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

const createNotification = async (userId, data, type = 'system', link = null, emailHtml = null, skipEmail = false) => {
    try {
        // Support both simple string or bilingual object
        const { title, body, titleTe, bodyTe } = typeof data === 'string' ? { title: data, body: '' } : data;

        console.log(`[Notification] Creating for userId: ${userId}, type: ${type}`);
        const user = await User.findById(userId);
        if (!user) {
            console.log(`[Notification] User NOT found: ${userId}`);
            return null;
        }

        const isTelugu = user.language === 'Telugu';
        const finalTitle = isTelugu && titleTe ? titleTe : title;
        const finalBody = isTelugu && bodyTe ? bodyTe : body;

        const notification = await Notification.create({
            userId,
            title: finalTitle,
            body: finalBody,
            type,
            link
        });

        let delivered = false;
        let methods = [];

        // 1. Send Email (Dual Channel)
        if (user.email && !skipEmail) {
            try {
                const emailResult = await sendEmail(user.email, finalTitle, finalBody, emailHtml);
                if (emailResult.success) {
                    delivered = true;
                    methods.push('email');
                    console.log(`[Notification] Email sent to ${user.email}`);
                }
            } catch (err) {
                console.error(`[Notification] Email error for ${user.email}:`, err.message);
            }
        }

        // 2. Send FCM Push (Dual Channel - WhatsApp style)
        if (user.fcmToken) {
            try {
                // Dual channel delivery - ensuring high priority for immediate visibility
                await admin.messaging().send({
                    token: user.fcmToken,
                    notification: {
                        title: finalTitle,
                        body: finalBody.length > 150 ? finalBody.substring(0, 147) + '...' : finalBody
                    },
                    android: {
                        priority: 'high',
                        notification: {
                            sound: 'default',
                            priority: 'high',
                            channelId: 'high_priority_alerts' // Common channel name to ensure visibility
                        }
                    },
                    apns: {
                        payload: {
                            aps: {
                                sound: 'default',
                                badge: 1,
                                'content-available': 1
                            }
                        }
                    },
                    data: {
                        url: link || '/home',
                        type: type,
                        click_action: 'FLUTTER_NOTIFICATION_CLICK'
                    }
                });
                delivered = true;
                methods.push('fcm');
                console.log(`[Notification] FCM sent to ${user.name}`);
            } catch (fcmError) {
                console.error(`[Notification] FCM error for ${user.name}:`, fcmError.message);
            }
        }

        if (delivered) {
            notification.delivered = true;
            notification.deliveryMethod = methods.join('+');
            await notification.save();
        }

        return notification;
    } catch (error) {
        console.error('[Notification] Error:', error);
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

// @desc    Send Interlink requests to multiple users
// @route   POST /api/notifications/interlink
// @access  Private
const sendInterlinkRequest = async (req, res) => {
    try {
        const { targetUserIds } = req.body;
        const sender = req.user; // From protect middleware

        if (!targetUserIds || !Array.isArray(targetUserIds) || targetUserIds.length === 0) {
            return res.status(400).json({ message: 'No target users selected' });
        }

        // 1. Construct the Professional Message
        // We get profession info based on category
        let professionStr = sender.professionCategory || 'Professional';
        if (sender.professionCategory === 'Employed') professionStr = sender.professionDetails?.jobRole || 'Employed';
        else if (sender.professionCategory === 'Business') professionStr = sender.professionDetails?.businessType || 'Business';
        else if (sender.professionCategory === 'Student') professionStr = sender.professionDetails?.course || 'Student';

        // 1. Construct the Professional Message (Bilingual Support)
        const isTelugu = sender.language === 'Telugu';

        const title = isTelugu
            ? `SmartHood: ${sender.name} నుండి కొత్త ఇంటర్‌లింక్ కోరిక 🏠`
            : `SmartHood: New Interlink from ${sender.name} 🏠`;

        const bodyContent = isTelugu
            ? `నమస్కారం! నేను మీ పొరుగునే ఉండే ${sender.name} (${sender.locality}). నేను ${professionStr} గా పని చేస్తున్నాను మరియు మీతో వృత్తిపరంగా కనెక్ట్ అవ్వాలనుకుంటున్నాను!

నా వివరాలు:
📞 ${sender.phone}
📍 ${sender.address || sender.locality}

త్వరలో మాట్లాడదాం!`
            : `Hi! I'm your neighbor ${sender.name} from ${sender.locality}. I'm a ${professionStr} and I'd like to interlink with you professionally!

My Contacts:
📞 ${sender.phone}
📍 ${sender.address || sender.locality}

Looking forward to connecting!`;

        const emailHtml = `
            <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #f0f0f0; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
                <div style="text-align: center; margin-bottom: 25px;">
                    <div style="background: linear-gradient(135deg, #0e7490 0%, #4338ca 100%); width: 70px; height: 70px; border-radius: 20px; display: inline-flex; align-items: center; justify-content: center; margin: 0 auto;">
                        <span style="font-size: 35px;">🏠</span>
                    </div>
                    <h1 style="color: #111827; font-size: 24px; font-weight: 800; margin: 20px 0 10px;">${isTelugu ? 'కొత్త ఇంటర్‌లింక్ కోరిక' : 'New Interlink Request'}</h1>
                    <p style="color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700;">SmartHood Discovery Hub</p>
                </div>
                
                <div style="background-color: #f8fafc; padding: 25px; border-radius: 20px; border: 1px dashed #cbd5e1; margin-bottom: 25px;">
                    <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0;">
                        ${isTelugu
                ? `"నమస్కారం! నేను మీ పొరుగునే ఉండే <b>${sender.name}</b> (${sender.locality}). నేను <b>${professionStr}</b> గా పని చేస్తున్నాను మరియు మన కమ్యూనిటీలో మీతో వృత్తిపరంగా కనెక్ట్ అవ్వాలనుకుంటున్నాను!"`
                : `"Hi! I'm your neighbor <b>${sender.name}</b> from ${sender.locality}. I work as a <b>${professionStr}</b> and I'd like to establish a professional interlink with you in our community!"`
            }
                    </p>
                </div>
                
                <table style="width: 100%; border-collapse: separate; border-spacing: 0 10px;">
                    <tr>
                        <td style="color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase;">${isTelugu ? 'ఫోన్ నంబర్' : 'Phone Number'}</td>
                        <td style="color: #1e293b; font-size: 15px; font-weight: 700; text-align: right;">${sender.phone}</td>
                    </tr>
                    <tr>
                        <td style="color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase;">${isTelugu ? 'వృత్తి' : 'Profession'}</td>
                        <td style="color: #1e293b; font-size: 15px; font-weight: 700; text-align: right;">${professionStr}</td>
                    </tr>
                    <tr>
                        <td style="color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase;">${isTelugu ? 'ప్రాంతం' : 'Locality'}</td>
                        <td style="color: #1e293b; font-size: 15px; font-weight: 700; text-align: right;">${sender.locality}</td>
                    </tr>
                </table>
                
                <div style="text-align: center; margin-top: 35px;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile" style="background: linear-gradient(135deg, #0e7490 0%, #4338ca 100%); color: #ffffff; padding: 16px 40px; border-radius: 16px; font-weight: 700; text-decoration: none; display: inline-block; box-shadow: 0 4px 15px rgba(14,116,144,0.3); uppercase;">${isTelugu ? 'ప్రొఫైల్ చూడండి & అంగీకరించండి' : 'VIEW PROFILE & ACCEPT'}</a>
                </div>
                
                <p style="text-align: center; color: #94a3b8; font-size: 11px; margin-top: 30px;">
                    ${isTelugu ? 'SmartHood కమ్యూనిటీ నెట్‌వర్క్ ద్వారా పంపబడింది • నేబర్‌హుడ్ ఇంటెలిజెన్స్ సిస్టమ్' : 'Sent via SmartHood Community Network • Neighborhood Intelligence System'}
                </p>
            </div>
        `;

        // 2. Loop through targets and send
        const sendPromises = targetUserIds.map(async (targetId) => {
            // Already includes saving to DB inside createNotification
            return createNotification(
                targetId,
                title,
                bodyContent,
                'interlink',
                '/profile',
                emailHtml
            );
        });

        await Promise.all(sendPromises);

        res.json({ message: `Successfully sent interlink requests to ${targetUserIds.length} neighbors!` });
    } catch (error) {
        console.error('Interlink request error:', error);
        res.status(500).json({ message: 'Failed to send interlink requests' });
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    createNotification,
    getUnreadCount,
    sendInterlinkRequest
};
