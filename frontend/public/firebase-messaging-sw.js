importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyDei3YFE5Dj-EbPhr94uGc2kSpkJ-YOet0",
    authDomain: "smart-hood-9da8f.firebaseapp.com",
    projectId: "smart-hood-9da8f",
    storageBucket: "smart-hood-9da8f.firebasestorage.app",
    messagingSenderId: "257024789633",
    appId: "1:257024789633:web:b2802755dc73e24d2dd180"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received message ', payload);

    // Support both notification and data payloads
    const notificationTitle = payload.notification?.title || payload.data?.title || 'SmartHood Notification';
    const notificationOptions = {
        body: payload.notification?.body || payload.data?.body || '',
        icon: '/logo.png',
        badge: '/logo.png',
        vibrate: [200, 100, 200],
        requireInteraction: true,
        data: {
            ...payload.data,
            receivedAt: Date.now()
        }
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});
// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    // Extract target URL from notification data
    const targetUrl = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // If a window is already open, focus it and navigate
                for (const client of clientList) {
                    if (client.url.includes(location.origin) && 'focus' in client) {
                        return client.focus().then(() => client.navigate(targetUrl));
                    }
                }
                // Otherwise open a new window
                if (clients.openWindow) {
                    return clients.openWindow(targetUrl);
                }
            })
    );
});
