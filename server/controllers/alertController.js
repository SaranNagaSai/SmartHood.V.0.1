const Alert = require('../models/Alert');
const User = require('../models/User');
const { generateAlertEmailTemplate } = require('../services/emailService');
const jwt = require('jsonwebtoken');
const { createNotification } = require('./notificationController');
const { locationMap } = require('../utils/locationMap');

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
        const userTown = (req.user.town || town || '').trim();
        
        // Get bilingual equivalents for more robust matching
        const townTranslations = [userTown];
        for (const [en, te] of Object.entries(locationMap)) {
            if (en.toLowerCase() === userTown.toLowerCase()) townTranslations.push(te);
            else if (te === userTown) townTranslations.push(en);
        }

        const townRegex = new RegExp(`^\\s*(${townTranslations.join('|')})\\s*$`, 'i');
        let query = {};

        // Normalize targetUserIds (handle string or array from formData)
        const targetIdsRaw = req.body.targetUserIds || req.body['targetUserIds[]'];
        const targetIds = targetIdsRaw ? (Array.isArray(targetIdsRaw) ? targetIdsRaw : [targetIdsRaw]) : [];

        // Handle Targeted Alerts (e.g., Blood Donation specific selection)
        if (targetIds.length > 0) {
            // When targeted, we prioritize the IDs provided
            query = {
                $or: [
                    { _id: { $in: targetIds } },
                    { isAdmin: true }
                ]
            };
        } else {
            // Default Broadcast Logic: Targeted Town + (Optional) Blood Match OR Admin Status
            const mainCriteria = {
                town: { $regex: townRegex }
            };

            // Add blood group filter if applicable
            if (category === 'Emergency' && subType === 'Blood Donation' && bloodGroup) {
                mainCriteria.bloodGroup = bloodGroup;
            }

            query = {
                $or: [
                    mainCriteria,
                    { isAdmin: true }
                ]
            };
        }

        const targetUsers = await User.find(query);
        console.log(`[Alert Debug] Category: ${category}, SubType: ${subType}`);
        console.log(`[Alert Debug] Initial targetIdsRaw: ${JSON.stringify(req.body.targetUserIds || req.body['targetUserIds[]'])}`);
        console.log(`[Alert Debug] Normalized targetIds: ${JSON.stringify(targetIds)}`);
        console.log(`[Alert Debug] Found ${targetUsers.length} target users in DB.`);

        // Store recipient IDs for tracking
        alert.sentTo = targetUsers.map(u => u._id);
        await alert.save();

        // SEND NOTIFICATIONS IN BACKGROUND (Non-blocking)
        setImmediate(async () => {
             const creatorAlertEmailHtml = generateAlertEmailTemplate(alert, req.user, true);
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

                const subTypeTeMap = {
                    'Blood Donation': 'రక్తదానం',
                    'Accident': 'ప్రమాదం',
                    'Cash Donation': 'నగదు విరాళం',
                    'Climate': 'వాతావరణం',
                    'Theft': 'దొంగతనం',
                    'General': 'సాధారణం'
                };

                await createNotification(
                    req.user._id,
                    creatorAlertNotification,
                    'ALERT',
                    '/activity',
                    creatorAlertEmailHtml,
                    false, // skipEmail
                    {
                        workTitle: `${category} (${subType})`,
                        workTitleTe: `${category === 'Emergency' ? 'అత్యవసర' : 'సాధారణ'} (${subTypeTeMap[subType] || subType})`,
                        workInfo: description,
                        senderName: req.user.name,
                        senderPhone: req.user.phone
                    }
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

                        const magicToken = jwt.sign({ id: user._id }, process.env.SMARTHOOD_JWT_SECRET, { expiresIn: '1d' });
                        const magicLink = `${process.env.FRONTEND_URL || 'https://smarthood.onrender.com'}/auto-login/${magicToken}?redirect=${encodeURIComponent(`/alert/${alert._id}?action=interest`)}`;
                        const personalizedEmailHtml = generateAlertEmailTemplate(alert, req.user, false, magicLink);

                        await createNotification(
                            user._id,
                            notificationData,
                            'ALERT',
                            `/alert/${alert._id}?action=interest`,
                            personalizedEmailHtml,
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

        const myLocality = (currentUser.locality || '').trim();
        const localityTranslations = [myLocality];
        for (const [en, te] of Object.entries(locationMap)) {
            if (en.toLowerCase() === myLocality.toLowerCase()) localityTranslations.push(te);
            else if (te === myLocality) localityTranslations.push(en);
        }

        const localityRegex = new RegExp(`^\\s*(${localityTranslations.join('|')})\\s*$`, 'i');
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

// @desc    Get single alert detail
// @route   GET /api/alerts/detail/:id
// @access  Private
const getAlertDetail = async (req, res) => {
    try {
        const alert = await Alert.findById(req.params.id)
            .populate('senderId', 'name uniqueId profilePhoto phone')
            .populate('interestedUsers', 'name uniqueId profilePhoto phone');

        if (!alert) {
            return res.status(404).json({ message: 'Alert not found' });
        }

        res.json(alert);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Express interest in an alert
// @route   POST /api/alerts/:id/interest
// @access  Private
const expressInterest = async (req, res) => {
    try {
        const alert = await Alert.findById(req.params.id);

        if (!alert) {
            return res.status(404).json({ message: 'Alert not found' });
        }

        if (alert.senderId.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot express interest in your own alert' });
        }

        const hasInterest = alert.interestedUsers.includes(req.user._id);

        if (hasInterest) {
            // Remove interest
            alert.interestedUsers = alert.interestedUsers.filter(
                id => id.toString() !== req.user._id.toString()
            );
        } else {
            // Add interest
            alert.interestedUsers.push(req.user._id);

            // Notify alert sender
            const { createNotification } = require('./notificationController');
            const sender = await User.findById(alert.senderId);
            
            if (sender) {
                const isTelugu = sender.language === 'Telugu';
                const notificationData = {
                    title: isTelugu ? 'కొత్త ప్రతిస్పందన 🚨' : 'New Response 🚨',
                    titleTe: 'కొత్త ప్రతిస్పందన 🚨',
                    body: isTelugu 
                        ? `${req.user.name} మీ అలెర్ట్‌కు స్పందించారు: ${alert.description}` 
                        : `${req.user.name} responded to your alert: ${alert.description}`,
                    bodyTe: `${req.user.name} మీ అలెర్ట్‌కు స్పందించారు: ${alert.description}`
                };

                await createNotification(
                    alert.senderId,
                    notificationData,
                    'ALERT_INTEREST',
                    `/activity`,
                    null, // No email for this yet
                    true, // Skip email for speed
                    {
                        workTitle: alert.category,
                        workInfo: `${req.user.name} is interested`,
                        senderName: req.user.name,
                        senderPhone: req.user.phone
                    }
                );
            }
        }

        await alert.save();
        res.json({
            hasInterest: !hasInterest,
            interestedCount: alert.interestedUsers.length
        });
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
            .populate('interestedUsers', 'name uniqueId locality professionCategory profilePhoto phone');

        if (!alert) {
            return res.status(404).json({ message: 'Alert not found' });
        }

        // Only the sender can see the list
        if (alert.senderId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // We now return interested people instead of the entire broadcast list
        res.json(alert.interestedUsers || []);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { createAlert, getAlerts, getMyAlerts, getAlertRecipients, expressInterest, getAlertDetail };
