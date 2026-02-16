import { useEffect } from 'react';
import { requestForToken, onMessageListener } from '../config/firebase';

const useNotifications = () => {
    useEffect(() => {
        const initNotifications = async () => {
            try {
                const token = await requestForToken();
                const user = JSON.parse(localStorage.getItem('user'));
                const authToken = localStorage.getItem('token');

                if (token && user && authToken) {
                    await fetch('/api/users/fcm-token', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${authToken}`
                        },
                        body: JSON.stringify({ fcmToken: token })
                    });
                    console.log('FCM Token synced with server');
                }
            } catch (err) {
                // Gracefully handle permission denied or other notification errors
                console.warn('Notification initialization failed (likely permission blocked):', err);
            }
        };

        initNotifications();

        // Listen for foreground messages
        onMessageListener().then(payload => {
            console.log('Foreground Message:', payload);
            // Optionally show a toast here using specific UI library
            // For now, browser notification or console is enough
            new Notification(payload.notification.title, {
                body: payload.notification.body,
                icon: '/vite.svg'
            });
        });

    }, []);
};

export default useNotifications;
