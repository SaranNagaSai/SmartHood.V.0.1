const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendEmail } = require('../services/emailService');
const admin = require('../config/firebase');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json(notification);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user._id, read: false },
            { read: true }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create notification (internal use)
const createNotification = async (userId, title, body, type = 'system', link = null, emailHtml = null, skipEmail = false) => {
    try {
        const user = await User.findById(userId);
        if (!user) return null;

        const notification = await Notification.create({
            userId,
            title,
            body,
            type,
            link
        });

        // Send Email (unless skipEmail is true - caller already handled email)
        if (user.email && !skipEmail) {
            const emailResult = await sendEmail(user.email, title, body, emailHtml);
            if (emailResult.success) {
                notification.deliveryMethod = 'email';
                notification.delivered = true;
                console.log(`[Notification] Email sent to ${user.email}`);
            } else {
                console.error(`[Notification] Email FAILED to ${user.email}:`, emailResult.reason);
            }
        }

        if (user.fcmToken) {
            try {
                await admin.messaging().send({
                    token: user.fcmToken,
                    notification: { title, body },
                    data: { url: link || '/home' }
                });
                notification.deliveryMethod = user.email && !skipEmail ? 'both' : 'fcm';
                notification.delivered = true;
            } catch (fcmError) {
                console.error(`FCM Error for ${user.name}:`, fcmError.message);
            }
        }

        if (notification.delivered) {
            await notification.save();
        }

        return notification;
    } catch (error) {
        console.error('Notification creation error:', error);
        return null;
    }
};

// @desc    Get unread count
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            userId: req.user._id,
            read: false
        });
        res.json({ count });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    createNotification,
    getUnreadCount
};
