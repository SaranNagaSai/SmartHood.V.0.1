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
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/vite.svg',
        data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
