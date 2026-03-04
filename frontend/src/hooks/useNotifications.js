import { useEffect, useRef } from 'react';
import { requestForToken, onMessageListener } from '../config/firebase';
import { onMessage } from 'firebase/messaging';
import { messaging } from '../config/firebase';
import { API_URL } from '../utils/apiConfig';

const useNotifications = () => {
    const tokenSyncedRef = useRef(false);
    const retryCountRef = useRef(0);
    const MAX_RETRIES = 3;

    useEffect(() => {
        const syncFcmToken = async () => {
            try {
                // 1. First, explicitly request notification permission on mobile
                if ('Notification' in window && Notification.permission === 'default') {
                    console.log('[FCM] Requesting notification permission...');
                    const permission = await Notification.requestPermission();
                    console.log(`[FCM] Permission result: ${permission}`);
                    if (permission !== 'granted') {
                        console.warn('[FCM] Notification permission denied by user');
                        return;
                    }
                } else if ('Notification' in window && Notification.permission === 'denied') {
                    console.warn('[FCM] Notifications are blocked. User must enable from browser settings.');
                    return;
                }

                // 2. Get FCM token
                const token = await requestForToken();
                const user = JSON.parse(localStorage.getItem('user'));
                const authToken = localStorage.getItem('token');

                if (token && user && authToken) {
                    // 3. Send to backend
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
                    } else {
                        console.error('[FCM] Server rejected token sync:', response.status);
                        throw new Error('Server rejected FCM token');
                    }
                } else {
                    if (!token) console.warn('[FCM] No token received from Firebase');
                    if (!user) console.warn('[FCM] No user in localStorage');
                    if (!authToken) console.warn('[FCM] No auth token in localStorage');
                }
            } catch (err) {
                console.warn(`[FCM] Token sync failed (attempt ${retryCountRef.current + 1}/${MAX_RETRIES}):`, err.message || err);

                // Retry with exponential backoff
                retryCountRef.current += 1;
                if (retryCountRef.current < MAX_RETRIES) {
                    const delay = Math.pow(2, retryCountRef.current) * 2000; // 4s, 8s
                    console.log(`[FCM] Retrying in ${delay / 1000}s...`);
                    setTimeout(syncFcmToken, delay);
                }
            }
        };

        // Initial sync (delayed slightly to let auth settle)
        const initTimer = setTimeout(syncFcmToken, 2000);

        // Periodic token refresh (every 30 minutes) - tokens can expire
        const refreshInterval = setInterval(() => {
            if (localStorage.getItem('token')) {
                console.log('[FCM] Periodic token refresh...');
                tokenSyncedRef.current = false;
                retryCountRef.current = 0;
                syncFcmToken();
            }
        }, 30 * 60 * 1000);

        return () => {
            clearTimeout(initTimer);
            clearInterval(refreshInterval);
        };
    }, []);

    // Persistent foreground message listener (fixes the one-shot Promise issue)
    useEffect(() => {
        let unsubscribe;
        try {
            unsubscribe = onMessage(messaging, (payload) => {
                console.log('[FCM] Foreground message received:', payload);

                // Show browser notification for foreground messages
                if ('Notification' in window && Notification.permission === 'granted') {
                    const title = payload.notification?.title || payload.data?.title || 'SmartHood';
                    const body = payload.notification?.body || payload.data?.body || '';

                    new Notification(title, {
                        body,
                        icon: '/logo.png',
                        badge: '/logo.png',
                        vibrate: [200, 100, 200],
                        data: payload.data
                    });
                }
            });
        } catch (err) {
            console.warn('[FCM] Could not set up foreground listener:', err.message);
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);
};

export default useNotifications;
