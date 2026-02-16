const User = require('../models/User');
const Service = require('../models/Service');
const Alert = require('../models/Alert');
const Notification = require('../models/Notification');

// @desc    Get system-wide analytics
// @route   GET /api/analytics/system
// @access  Admin/Private
const getSystemAnalytics = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const serviceStats = await Service.aggregate([
            { $group: { _id: '$type', count: { $sum: 1 } } }
        ]);

        const localityGrowth = await User.aggregate([
            { $group: { _id: '$locality', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        res.json({
            totalUsers,
            serviceStats,
            localityGrowth
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get user-specific locality stats
// @route   GET /api/analytics/locality
// @access  Private
const getLocalityAnalytics = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const locality = user.locality;

        const localityUsers = await User.countDocuments({ locality });
        const localityServices = await Service.countDocuments({ locality });
        const localityAlerts = await Alert.countDocuments({ locality });

        res.json({
            locality,
            stats: {
                users: localityUsers,
                services: localityServices,
                alerts: localityAlerts
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { getSystemAnalytics, getLocalityAnalytics };
