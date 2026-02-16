const { createNotification } = require('../controllers/notificationController');
const admin = require('../config/firebase');

// Helper to send individual notification (already handled by createNotification now)
const sendNotification = async (user, title, body, type, link) => {
    return await createNotification(user._id, title, body, type, link);
};

const sendBrowserNotification = async (user, title, body, data = {}) => {
    if (!user.fcmToken) return;

    try {
        await admin.messaging().send({
            token: user.fcmToken,
            notification: {
                title,
                body
            },
            data: {
                ...data,
                click_action: data.url // Standard field for redirect
            }
        });
        console.log(`[FCM SENT] To: ${user.name}`);
    } catch (error) {
        console.error(`[FCM ERROR] User: ${user.name}`, error.message);
    }
};

/**
 * Routes notification based on user's available contact methods
 * @param {Array} users - List of User documents
 * @param {Object} notification - { title, body, data, type }
 */
const routeNotifications = async (users, notification) => {
    const promises = users.map(async (user) => {
        const title = notification.title;
        const body = notification.body;
        const type = notification.data?.type || 'system';
        const link = notification.data?.url || null;
        const emailHtml = notification.emailHtml || null;

        // createNotification handles both DB entry and simultaneous delivery (Email/FCM)
        await createNotification(user._id, title, body, type, link, emailHtml);
    });

    await Promise.all(promises);
};

module.exports = { routeNotifications };
