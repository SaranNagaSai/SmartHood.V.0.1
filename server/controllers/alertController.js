const Alert = require('../models/Alert');
const User = require('../models/User');
const { generateAlertEmailTemplate } = require('../services/emailService');

// @desc    Create a new alert
// @route   POST /api/alerts
// @access  Private
const createAlert = async (req, res) => {
    try {
        const { category, subType, bloodGroup, description, locality, town, district, state } = req.body;

        // Process attachments from multer if any
        let attachmentPaths = [];
        if (req.files && req.files.length > 0) {
            attachmentPaths = req.files.map(file => `/uploads/${file.filename}`);
        }

        const alert = await Alert.create({
            senderId: req.user._id,
            category,
            subType,
            bloodGroup,
            description,
            attachments: attachmentPaths,
            locality,
            town,
            district,
            state
        });

        // NOTIFICATION LOGIC
        // Broaden to TOWN-wide alerts for community emergency/general alerts
        const townRegex = new RegExp(`^\\s*${req.user.town.trim()}\\s*$`, 'i');
        let query = { town: { $regex: townRegex } };
        query._id = { $ne: req.user._id };

        if (category === 'Emergency' && subType === 'Blood Donation') {
            // Strict Filtering: Only match blood group
            if (bloodGroup) {
                query.bloodGroup = bloodGroup;
            }
        }

        const targetUsers = await User.find(query);
        console.log(`[Alert] ${category} - ${subType} created for ${targetUsers.length} users in ${req.user.town}`);

        // Store recipient IDs for tracking
        alert.sentTo = targetUsers.map(u => u._id);
        await alert.save();

        // Generate rich HTML email with full details and sender info
        const emailHtml = generateAlertEmailTemplate(alert, req.user);

        // SEND EMAILS IN BACKGROUND (Non-blocking)
        // Use setImmediate to process emails after the response is sent
        setImmediate(async () => {
            console.log(`[Background] Starting email broadcast for Alert ${alert._id} to ${targetUsers.length} users`);

            let emailSuccessCount = 0;
            let emailFailCount = 0;
            let fcmCount = 0;
            const { sendEmail } = require('../services/emailService');
            const admin = require('../config/firebase');

            try {
                for (const user of targetUsers) {
                    // Send Email directly
                    if (user.email) {
                        try {
                            const result = await sendEmail(
                                user.email,
                                `ALERT: ${category} - ${subType || ''}`,
                                description.substring(0, 200),
                                emailHtml
                            );
                            if (result.success) {
                                emailSuccessCount++;
                                // consoling every success might be too noisy for large numbers, but good for debug
                                console.log(`[Alert Email] SUCCESS to ${user.email}`);
                            } else {
                                emailFailCount++;
                                console.error(`[Alert Email] FAILED to ${user.email}: ${result.reason}`);
                            }
                        } catch (emailErr) {
                            emailFailCount++;
                            console.error(`[Alert Email] ERROR to ${user.email}: ${emailErr.message}`);
                        }
                    }

                    // Send FCM push notification
                    if (user.fcmToken) {
                        try {
                            await admin.messaging().send({
                                token: user.fcmToken,
                                notification: {
                                    title: `ALERT: ${category} - ${subType || ''}`,
                                    body: description.substring(0, 100)
                                },
                                data: { url: '/alerts', type: 'ALERT' }
                            });
                            fcmCount++;
                        } catch (fcmErr) {
                            console.error(`[Alert FCM] ERROR for ${user.name}: ${fcmErr.message}`);
                        }
                    }

                    // Also create a DB notification entry
                    try {
                        const Notification = require('../models/Notification');
                        await Notification.create({
                            userId: user._id,
                            title: `ALERT: ${category} - ${subType || ''}`,
                            body: description.substring(0, 200),
                            type: 'ALERT',
                            link: '/alerts',
                            delivered: true,
                            deliveryMethod: user.email ? 'email' : (user.fcmToken ? 'fcm' : 'none')
                        });
                    } catch (notifErr) {
                        console.error(`[Alert DB Notif] ERROR for ${user.name}: ${notifErr.message}`);
                    }
                }

                console.log(`[Background] Alert Broadcast COMLPETE: ${emailSuccessCount} sent, ${emailFailCount} failed, ${fcmCount} FCM`);
            } catch (bgError) {
                console.error(`[Background] Alert Broadcast CRASHED: ${bgError.message}`);
            }
        });

        res.status(201).json({
            message: 'Alert broadcast started successfully',
            alert,
            recipientCount: targetUsers.length,
            status: 'processing_in_background'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get alerts for feed
// @route   GET /api/alerts
// @access  Private
const getAlerts = async (req, res) => {
    try {
        const currentUser = await User.findById(req.user._id);

        const localityRegex = new RegExp(`^\\s*${currentUser.locality.trim()}\\s*$`, 'i');
        const alerts = await Alert.find({
            locality: { $regex: localityRegex },
            isActive: true,
            $or: [
                { subType: { $ne: 'Blood Donation' } }, // Show non-blood alerts to everyone
                { subType: 'Blood Donation', bloodGroup: currentUser.bloodGroup } // Show matched blood alerts
            ]
        }).populate('senderId', 'name uniqueId').sort({ createdAt: -1 });

        res.json(alerts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get alerts created by current user
// @route   GET /api/alerts/my
// @access  Private
const getMyAlerts = async (req, res) => {
    try {
        const alerts = await Alert.find({ senderId: req.user._id })
            .sort({ createdAt: -1 });
        res.json(alerts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get recipients of an alert
// @route   GET /api/alerts/:id/recipients
// @access  Private
const getAlertRecipients = async (req, res) => {
    try {
        const alert = await Alert.findById(req.params.id)
            .populate('sentTo', 'name uniqueId locality professionCategory profilePhoto phone');

        if (!alert) {
            return res.status(404).json({ message: 'Alert not found' });
        }

        // Only the sender can see the recipient list
        if (alert.senderId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(alert.sentTo || []);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { createAlert, getAlerts, getMyAlerts, getAlertRecipients };
