const Alert = require('../models/Alert');
const User = require('../models/User');
const { generateAlertEmailTemplate } = require('../services/emailService');

// @desc    Create a new alert
// @route   POST /api/alerts
// @access  Private
const createAlert = async (req, res) => {
    try {
        const { category, subType: rawSubType, bloodGroup, description, locality, town, district, state } = req.body;

        // Map frontend snake_case subTypes to backend Enum values
        const subTypeMap = {
            'blood_donation': 'Blood Donation',
            'accident': 'Accident',
            'cash_donation': 'Cash Donation',
            'climate_alert': 'Climate',
            'theft': 'Theft',
            'general_alert': 'General'
        };

        const subType = subTypeMap[rawSubType] || rawSubType;

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
        const userTown = req.user.town || town || '';
        const townRegex = new RegExp(`^\\s*${userTown.trim()}\\s*$`, 'i');
        let query = {};

        // Normalize targetUserIds (handle string or array from formData)
        const targetIdsRaw = req.body.targetUserIds || req.body['targetUserIds[]'];
        const targetIds = targetIdsRaw ? (Array.isArray(targetIdsRaw) ? targetIdsRaw : [targetIdsRaw]) : [];

        // Handle Targeted Alerts (e.g., Blood Donation specific selection)
        if (targetIds.length > 0) {
            // When targeted, we prioritize the selected IDs regardless of town (though they should match)
            query._id = { $in: targetIds, $ne: req.user._id };
        } else {
            // Default Broadcast Logic (Town-wide)
            query = {
                town: { $regex: townRegex },
                _id: { $ne: req.user._id }
            };

            if (category === 'Emergency' && subType === 'Blood Donation') {
                // Strict Filtering: Only match blood group
                if (bloodGroup) {
                    query.bloodGroup = bloodGroup;
                }
            }
        }

        const targetUsers = await User.find(query);
        console.log(`[Alert Debug] Category: ${category}, SubType: ${subType}`);
        console.log(`[Alert Debug] Initial targetIdsRaw: ${JSON.stringify(req.body.targetUserIds || req.body['targetUserIds[]'])}`);
        console.log(`[Alert Debug] Normalized targetIds: ${JSON.stringify(targetIds)}`);
        console.log(`[Alert Debug] Found ${targetUsers.length} target users in DB.`);

        // Store recipient IDs for tracking
        alert.sentTo = targetUsers.map(u => u._id);
        await alert.save();

        // Generate rich HTML email with full details and sender info
        const isTelugu = req.user.language === 'Telugu';
        const emailHtml = generateAlertEmailTemplate(alert, req.user);
        const creatorAlertEmailHtml = generateAlertEmailTemplate(alert, req.user, true);

        // SEND NOTIFICATIONS IN BACKGROUND (Non-blocking)
        setImmediate(async () => {
            try {
                console.log(`🚀 [Background] Starting broadcast for Alert ${alert._id} to ${targetUsers.length} users`);

                const { createNotification } = require('./notificationController');

                // 1. SEND CONFIRMATION TO ALERT CREATOR
                const creatorAlertNotification = {
                    title: 'Your Alert is Live!',
                    titleTe: 'మీ హెచ్చరిక ప్రత్యక్ష ప్రసారంలో ఉంది!',
                    body: `Your ${category} alert "${subType}" has been broadcast to ${targetUsers.length} people.`,
                    bodyTe: `మీ ${category} హెచ్చరిక "${subType}" ${targetUsers.length} మందికి ప్రసారం చేయబడింది.`
                };

                await createNotification(
                    req.user._id,
                    creatorAlertNotification,
                    'ALERT',
                    '/alerts',
                    creatorAlertEmailHtml
                );
                console.log(`✅ [Background] Alert confirmation sent to creator ${req.user.name}`);

                // 2. BROADCAST TO TARGET USERS
                let successCount = 0;
                for (const user of targetUsers) {
                    try {
                        const notificationData = {
                            title: `ALERT: ${category} (${subType})`,
                            titleTe: `హెచ్చరిక: ${category} (${subType})`,
                            body: description,
                            bodyTe: description
                        };

                        const subTypeTeMap = {
                            'Blood Donation': 'రక్తదానం',
                            'Accident': 'ప్రమాదం',
                            'Cash Donation': 'నగదు విరాళం',
                            'Climate': 'వాతావరణం',
                            'Theft': 'దొంగతనం',
                            'General': 'సాధారణం'
                        };

                        await createNotification(
                            user._id,
                            notificationData,
                            'ALERT',
                            '/alerts',
                            emailHtml,
                            false,
                            {
                                workTitle: `${category} (${subType})`,
                                workTitleTe: `${category === 'Emergency' ? 'అత్యవసర' : 'సాధారణ'} (${subTypeTeMap[subType] || subType})`,
                                workInfo: description,
                                senderName: req.user.name,
                                senderPhone: req.user.phone
                            }
                        );
                        successCount++;
                    } catch (targetErr) {
                        console.error(`❌ [Background] Failed to notify target ${user._id}:`, targetErr.message);
                    }
                }
                console.log(`🏁 [Background] Alert Broadcast COMPLETE. Success: ${successCount}/${targetUsers.length}`);
            } catch (err) {
                console.error('💥 [Background] Critical failure in alert broadcast loop:', err);
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
