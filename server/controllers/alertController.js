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
        // Fetch users in locality (case/whitespace-insensitive for consistency)
        const localityRegex = new RegExp(`^\\s*${req.user.locality.trim()}\\s*$`, 'i');
        let query = { locality: { $regex: localityRegex } };
        query._id = { $ne: req.user._id };

        if (category === 'Emergency' && subType === 'Blood Donation') {
            // Strict Filtering: Only match blood group
            if (bloodGroup) {
                query.bloodGroup = bloodGroup;
            }
        }
        // Else: Broadcast to all in locality

        const targetUsers = await User.find(query);

        // Track notification counts
        let emailCount = 0;
        let browserCount = 0;

        // Generate rich HTML email with full details and sender info
        const emailHtml = generateAlertEmailTemplate(alert, req.user);

        // Prepare Notification
        const notifData = {
            title: `ALERT: ${category} - ${subType || ''}`,
            body: description.substring(0, 100) + '...',
            data: {
                url: `/alerts`,
                type: 'ALERT'
            },
            emailHtml: emailHtml
        };

        const { routeNotifications } = require('../services/notificationService');
        await routeNotifications(targetUsers, notifData);

        // Count delivery methods
        for (const user of targetUsers) {
            if (user.email) {
                emailCount++;
            } else if (user.fcmToken) {
                browserCount++;
            }
        }

        res.status(201).json({
            message: 'Alert broadcast successfully',
            alert,
            recipientCount: targetUsers.length,
            emailCount,
            browserCount
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

module.exports = { createAlert, getAlerts, getMyAlerts };
