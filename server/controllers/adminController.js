const Admin = require('../models/Admin');
const User = require('../models/User');
const Service = require('../models/Service');
const Alert = require('../models/Alert');
const Notification = require('../models/Notification');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// @desc    Admin login
// @route   POST /api/admin/login
// @access  Public
const adminLogin = async (req, res) => {
    try {
        const { username, email } = req.body;

        // Note: Project requirement says backend validates against predefined admin list
        // and no separate registration. We'll find by username or email.
        const admin = await Admin.findOne({
            $or: [{ username }, { email }],
            isActive: true
        });

        if (!admin) {
            return res.status(401).json({ message: 'Invalid admin credentials' });
        }

        admin.lastLogin = new Date();
        await admin.save();

        const token = jwt.sign(
            { id: admin._id, isAdmin: true },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            success: true,
            admin: {
                _id: admin._id,
                username: admin.username,
                email: admin.email
            },
            token
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get admin analytics
// @route   GET /api/admin/analytics
// @access  Admin
const getAnalytics = async (req, res) => {
    try {
        // Total users
        const totalUsers = await User.countDocuments();

        // Service stats
        const serviceOffers = await Service.countDocuments({ type: 'offer' });
        const serviceRequests = await Service.countDocuments({ type: 'request' });

        // Alert stats by type
        const alertsByType = await Alert.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);

        // Notification delivery stats
        const notificationsSent = await Notification.countDocuments();
        const notificationsDelivered = await Notification.countDocuments({ delivered: true });

        // Revenue stats
        const revenueResult = await Service.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amountSpent' } } }
        ]);
        const totalRevenue = revenueResult[0]?.total || 0;

        // Locality distribution
        const localityStats = await User.aggregate([
            { $group: { _id: '$locality', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // User growth (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const userGrowth = await User.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Revenue trend (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const revenueTrend = await Service.aggregate([
            { $match: { status: 'completed', completionDate: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$completionDate' } },
                    total: { $sum: '$amountSpent' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            totalUsers,
            userGrowth,
            serviceStats: { offers: serviceOffers, requests: serviceRequests },
            alertStats: { total: alertsByType.reduce((s, a) => s + a.count, 0), byType: alertsByType },
            notificationStats: { sent: notificationsSent, delivered: notificationsDelivered },
            revenueStats: { total: totalRevenue, trend: revenueTrend },
            localityStats
        });
    } catch (error) {
        console.error('Analytics Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all users (Admin)
// @route   GET /api/admin/users
// @access  Admin
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select('-fcmToken')
            .sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create admin (Super admin only)
// @route   POST /api/admin/create
// @access  Super Admin
const createAdmin = async (req, res) => {
    try {
        const { username, email, permissions } = req.body;

        const existingAdmin = await Admin.findOne({ $or: [{ username }, { email }] });
        if (existingAdmin) {
            return res.status(400).json({ message: 'Admin already exists' });
        }

        const admin = await Admin.create({
            username,
            email,
            permissions,
            isActive: true
        });

        res.status(201).json(admin);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get individual user stats (Admin)
// @route   GET /api/admin/users/:id/stats
// @access  Admin
const getUserStats = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId).select('-fcmToken');
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Services created by this user
        const servicesOffered = await Service.countDocuments({ createdBy: userId, type: { $in: ['offer', 'OFFER'] } });
        const servicesRequested = await Service.countDocuments({ createdBy: userId, type: { $in: ['request', 'REQUEST'] } });
        const servicesCompleted = await Service.countDocuments({ createdBy: userId, status: { $in: ['completed', 'COMPLETED'] } });
        const servicesActive = await Service.countDocuments({ createdBy: userId, status: { $in: ['active', 'OPEN'] } });

        // Financial stats
        const earningResult = await Service.aggregate([
            { $match: { completedBy: user._id, status: { $in: ['completed', 'COMPLETED'] } } },
            { $group: { _id: null, total: { $sum: '$amountSpent' } } }
        ]);
        const spendingResult = await Service.aggregate([
            { $match: { createdBy: user._id, status: { $in: ['completed', 'COMPLETED'] } } },
            { $group: { _id: null, total: { $sum: '$amountSpent' } } }
        ]);
        const totalEarned = earningResult[0]?.total || 0;
        const totalSpent = spendingResult[0]?.total || 0;

        // Monthly financial trend (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const monthlyFinancials = await Service.aggregate([
            {
                $match: {
                    $or: [{ createdBy: user._id }, { completedBy: user._id }],
                    status: { $in: ['completed', 'COMPLETED'] },
                    completionDate: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$completionDate' } },
                    earned: {
                        $sum: { $cond: [{ $eq: ['$completedBy', user._id] }, '$amountSpent', 0] }
                    },
                    spent: {
                        $sum: { $cond: [{ $eq: ['$createdBy', user._id] }, '$amountSpent', 0] }
                    }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Alerts stats
        const totalAlerts = await Alert.countDocuments({ senderId: userId });
        const alertsByCategory = await Alert.aggregate([
            { $match: { senderId: user._id } },
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);

        // Notification stats
        const totalNotifications = await Notification.countDocuments({ userId });
        const readNotifications = await Notification.countDocuments({ userId, read: true });
        const unreadNotifications = await Notification.countDocuments({ userId, read: false });

        // Recent services (last 10)
        const recentServices = await Service.find({ createdBy: userId })
            .sort({ createdAt: -1 })
            .limit(10)
            .select('title type status createdAt amountSpent completionDate');

        // Recent alerts (last 10)
        const recentAlerts = await Alert.find({ senderId: userId })
            .sort({ createdAt: -1 })
            .limit(10)
            .select('category subType description createdAt locality');

        // Service type distribution (for pie chart)
        const serviceTypeDistribution = await Service.aggregate([
            { $match: { createdBy: user._id } },
            { $group: { _id: '$type', count: { $sum: 1 } } }
        ]);

        // Service status distribution
        const serviceStatusDistribution = await Service.aggregate([
            { $match: { createdBy: user._id } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Interest count (how many services this user showed interest in)
        const interestedIn = await Service.countDocuments({ interestedProviders: userId });

        // Account age
        const accountCreated = user.createdAt;
        const accountAgeDays = Math.floor((Date.now() - new Date(accountCreated)) / (1000 * 60 * 60 * 24));

        // Activity by day of week (services created)
        const activityByDay = await Service.aggregate([
            { $match: { createdBy: user._id } },
            { $group: { _id: { $dayOfWeek: '$createdAt' }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        // Activity by hour (services created)
        const activityByHour = await Service.aggregate([
            { $match: { createdBy: user._id } },
            { $group: { _id: { $hour: '$createdAt' }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            user,
            services: {
                offered: servicesOffered,
                requested: servicesRequested,
                completed: servicesCompleted,
                active: servicesActive,
                interestedIn,
                typeDistribution: serviceTypeDistribution,
                statusDistribution: serviceStatusDistribution,
                recent: recentServices
            },
            financial: {
                earned: totalEarned,
                spent: totalSpent,
                net: totalEarned - totalSpent,
                monthlyTrend: monthlyFinancials
            },
            alerts: {
                total: totalAlerts,
                byCategory: alertsByCategory,
                recent: recentAlerts
            },
            notifications: {
                total: totalNotifications,
                read: readNotifications,
                unread: unreadNotifications
            },
            engagement: {
                impactScore: user.impactScore || 0,
                accountAgeDays,
                activityByDay,
                activityByHour
            }
        });
    } catch (error) {
        console.error('User Stats Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    adminLogin,
    getAnalytics,
    getAllUsers,
    createAdmin,
    getUserStats
};
