import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import axios from 'axios';
import { API_URL } from './apiConfig';

const firebaseConfig = {
    apiKey: "AIzaSyDei3YFE5Dj-EbPhr94uGc2kSpkJ-YOet0",
    authDomain: "smart-hood-9da8f.firebaseapp.com",
    projectId: "smart-hood-9da8f",
    storageBucket: "smart-hood-9da8f.firebasestorage.app",
    messagingSenderId: "257024789633",
    appId: "1:257024789633:web:b2802755dc73e24d2dd180"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestForToken = async () => {
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const token = await getToken(messaging, {
                vapidKey: "BEn6bFmC5m8V1qS1Z1p-z7Wb0rR6vG6B1X6b8X6b8X6b8X6b8X6b8X6b8X6b8X6b8X6b8X6b8" // Note: This should be user's real VAPID key
            });
            if (token) {
                console.log('FCM Token:', token);
                await updateTokenOnServer(token);
                return token;
            }
        }
    } catch (error) {
        console.error('Error getting FCM token:', error);
    }
};

const updateTokenOnServer = async (fcmToken) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        await axios.post(`${API_URL}/auth/update-fcm`, { fcmToken }, {
            headers: { Authorization: `Bearer ${token}` }
        });
    } catch (error) {
        console.error('Failed to update FCM token on server:', error);
    }
};

export const onMessageListener = () =>
    new Promise((resolve) => {
        onMessage(messaging, (payload) => {
            resolve(payload);
        });
    });
