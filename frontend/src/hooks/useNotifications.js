import { useEffect, useRef } from 'react';
import { requestForToken, onMessageListener } from '../config/firebase';
import { onMessage } from 'firebase/messaging';
import { messaging } from '../config/firebase';
import { API_URL } from '../utils/apiConfig';

const useNotifications = (isAuthenticated) => {
    const tokenSyncedRef = useRef(false);
    const retryCountRef = useRef(0);
    const MAX_RETRIES = 3;

    const syncFcmToken = async (manual = false) => {
        if (tokenSyncedRef.current && !manual) return;

        console.log(`[FCM] Starting token sync... (Manual: ${manual})`);
        try {
            // 1. First, explicitly request notification permission on mobile
            if ('Notification' in window) {
                if (Notification.permission === 'default') {
                    console.log('[FCM] Requesting notification permission...');
                    const permission = await Notification.requestPermission();
                    console.log(`[FCM] Permission result: ${permission}`);
                    if (permission !== 'granted') {
                        console.warn('[FCM] Notification permission denied');
                        return;
                    }
                } else if (Notification.permission === 'denied' && manual) {
                    alert('Notifications are blocked by your browser settings. Please enable them in your browser settings to receive updates.');
                    return;
                }
            }

            // 2. Get FCM token
            const token = await requestForToken();
            const user = JSON.parse(localStorage.getItem('user'));
            const authToken = localStorage.getItem('token');

            if (token && user && authToken) {
                // 3. Send to backend
                console.log('[FCM] Token obtained, sending to backend...');
                const response = await fetch(`${API_URL}/users/fcm-token`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({ fcmToken: token })
                });

                if (response.ok) {
                    console.log('[FCM] Token synced with server successfully');
                    tokenSyncedRef.current = true;
                    retryCountRef.current = 0;
                    if (manual) alert('Push Notifications Enabled Successfully!');
                } else {
                    const errorText = await response.text();
                    console.error('[FCM] Server rejected token sync:', response.status, errorText);
                    throw new Error('Server rejected FCM token');
                }
            } else {
                if (!token) console.warn('[FCM] No token received from Firebase. Check console for registration errors.');
                if (!user) console.warn('[FCM] No user in localStorage');
                if (!authToken) console.warn('[FCM] No auth token in localStorage');
                if (manual && !token) alert('Failed to get notification token. Please ensure you are on HTTPS.');
            }
        } catch (err) {
            console.warn(`[FCM] Token sync failed (attempt ${retryCountRef.current + 1}/${MAX_RETRIES}):`, err.message || err);

            // Retry with exponential backoff
            retryCountRef.current += 1;
            if (retryCountRef.current < MAX_RETRIES) {
                const delay = Math.pow(2, retryCountRef.current) * 2000;
                console.log(`[FCM] Retrying in ${delay / 1000}s...`);
                setTimeout(() => syncFcmToken(manual), delay);
            }
        }
    };

    useEffect(() => {
        if (!isAuthenticated) {
            tokenSyncedRef.current = false;
            return;
        }

        // Initial sync (delayed slightly to let auth settle)
        const initTimer = setTimeout(() => syncFcmToken(false), 3000);

        // Periodic token refresh (every 30 minutes)
        const refreshInterval = setInterval(() => {
            if (localStorage.getItem('token')) {
                syncFcmToken(false);
            }
        }, 30 * 60 * 1000);

        return () => {
            clearTimeout(initTimer);
            clearInterval(refreshInterval);
        };
    }, [isAuthenticated]);

    // Persistent foreground message listener
    useEffect(() => {
        let unsubscribe;
        try {
            unsubscribe = onMessage(messaging, (payload) => {
                console.log('[FCM] Foreground message received:', payload);
                console.log('[FCM] Notification Permission Status:', Notification.permission);

                if ('serviceWorker' in navigator && Notification.permission === 'granted') {
                    console.log('[FCM] Attempting to show notification via Service Worker...');
                    navigator.serviceWorker.ready.then(registration => {
                        const title = payload.notification?.title || payload.data?.title || 'SmartHood';
                        const body = payload.notification?.body || payload.data?.body || '';

                        registration.showNotification(title, {
                            body,
                            icon: '/logo.png',
                            badge: '/logo.png',
                            vibrate: [200, 100, 200],
                            tag: 'smarthood-alert',
                            renotify: true,
                            data: {
                                url: payload.data?.url || '/home',
                                ...payload.data
                            }
                        }).then(() => {
                            console.log('[FCM] registration.showNotification SUCCESS');
                        }).catch(e => {
                            console.error('[FCM] registration.showNotification FAILED:', e);
                        });
                    });
                } else if ('Notification' in window && Notification.permission === 'granted') {
                    console.log('[FCM] Falling back to standard Notification...');
                    const title = payload.notification?.title || payload.data?.title || 'SmartHood';
                    const body = payload.notification?.body || payload.data?.body || '';
                    new Notification(title, { body, icon: '/logo.png' });
                } else {
                    console.warn('[FCM] Cannot show notification: Permissions denied or SW not supported');
                }
            });
        } catch (err) {
            console.warn('[FCM] Could not set up foreground listener:', err);
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    return { syncFcmToken };
};

export default useNotifications;
