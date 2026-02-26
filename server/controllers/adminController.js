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

// @desc    Generate Excel for a user and email to all admins
// @route   POST /api/admin/users/:id/export-excel
// @access  Admin
const exportUserExcel = async (req, res) => {
    try {
        const ExcelJS = require('exceljs');
        const { sendEmail } = require('../services/emailService');

        const userId = req.params.id;
        const user = await User.findById(userId).select('-fcmToken');
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Fetch user stats
        const servicesOffered = await Service.countDocuments({ createdBy: userId, type: { $in: ['offer', 'OFFER'] } });
        const servicesRequested = await Service.countDocuments({ createdBy: userId, type: { $in: ['request', 'REQUEST'] } });
        const servicesCompleted = await Service.countDocuments({ createdBy: userId, status: { $in: ['completed', 'COMPLETED'] } });
        const servicesActive = await Service.countDocuments({ createdBy: userId, status: { $in: ['active', 'OPEN'] } });

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

        const totalAlerts = await Alert.countDocuments({ senderId: userId });
        const interestedIn = await Service.countDocuments({ interestedProviders: userId });
        const accountAgeDays = Math.floor((Date.now() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24));

        // Create Excel workbook
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'SmartHood Admin';
        workbook.created = new Date();

        const sheet = workbook.addWorksheet('User Report', {
            properties: { tabColor: { argb: '0E7490' } }
        });

        // Define columns
        sheet.columns = [
            { header: 'Field', key: 'field', width: 28 },
            { header: 'Details', key: 'details', width: 45 },
        ];

        // Style header row
        const headerRow = sheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 12 };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0E7490' } };
        headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
        headerRow.height = 30;

        // Add user data
        const rows = [
            ['📋 PERSONAL INFORMATION', ''],
            ['Name', user.name || 'N/A'],
            ['Unique ID', user.uniqueId || 'N/A'],
            ['Phone', user.phone || 'N/A'],
            ['Email', user.email || 'N/A'],
            ['Age', user.age || 'N/A'],
            ['Gender', user.gender || 'N/A'],
            ['Blood Group', user.bloodGroup || 'N/A'],
            ['', ''],
            ['📍 LOCATION', ''],
            ['Address', user.address || 'N/A'],
            ['Locality', user.locality || 'N/A'],
            ['Town', user.town || 'N/A'],
            ['District', user.district || 'N/A'],
            ['State', user.state || 'N/A'],
            ['', ''],
            ['💼 PROFESSION', ''],
            ['Category', user.professionCategory || 'N/A'],
            ['Job Role', user.professionDetails?.jobRole || 'N/A'],
            ['Sector', user.professionDetails?.sector || 'N/A'],
            ['Business Type', user.professionDetails?.businessType || 'N/A'],
            ['Education Level', user.professionDetails?.educationLevel || 'N/A'],
            ['Course', user.professionDetails?.course || 'N/A'],
            ['Experience (Years)', user.experience || '0'],
            ['', ''],
            ['📊 SERVICE STATISTICS', ''],
            ['Services Offered', servicesOffered.toString()],
            ['Services Requested', servicesRequested.toString()],
            ['Services Completed', servicesCompleted.toString()],
            ['Services Active', servicesActive.toString()],
            ['Showed Interest In', interestedIn.toString()],
            ['', ''],
            ['💰 FINANCIAL SUMMARY', ''],
            ['Total Earned (₹)', `₹${totalEarned}`],
            ['Total Spent (₹)', `₹${totalSpent}`],
            ['Net Balance (₹)', `₹${totalEarned - totalSpent}`],
            ['', ''],
            ['🔔 ENGAGEMENT', ''],
            ['Alerts Sent', totalAlerts.toString()],
            ['Impact Score', (user.impactScore || 0).toString()],
            ['Account Age (Days)', accountAgeDays.toString()],
            ['Joined On', user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : 'N/A'],
        ];

        rows.forEach((row, idx) => {
            const dataRow = sheet.addRow({ field: row[0], details: row[1] });
            // Style section headers
            if (row[0].includes('📋') || row[0].includes('📍') || row[0].includes('💼') || row[0].includes('📊') || row[0].includes('💰') || row[0].includes('🔔')) {
                dataRow.font = { bold: true, size: 11, color: { argb: '0E7490' } };
                dataRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0F7FA' } };
            }
            dataRow.alignment = { vertical: 'middle' };
        });

        // Add borders
        sheet.eachRow({ includeEmpty: false }, (row) => {
            row.eachCell({ includeEmpty: false }, (cell) => {
                cell.border = {
                    top: { style: 'thin', color: { argb: 'E2E8F0' } },
                    left: { style: 'thin', color: { argb: 'E2E8F0' } },
                    bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
                    right: { style: 'thin', color: { argb: 'E2E8F0' } },
                };
            });
        });

        // Generate Excel buffer
        const buffer = await workbook.xlsx.writeBuffer();

        // Get all admin emails
        const admins = await Admin.find({ isActive: true }).select('email username');
        const adminEmails = admins.map(a => a.email).filter(Boolean);

        if (adminEmails.length === 0) {
            return res.status(400).json({ message: 'No admin emails found' });
        }

        // Create nodemailer transporter
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
            port: parseInt(process.env.EMAIL_PORT) || 2525,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            },
            tls: { rejectUnauthorized: false },
            connectionTimeout: 10000,
            greetingTimeout: 5000,
            socketTimeout: 20000
        });

        const fileName = `SmartHood_User_${user.uniqueId || user.name}_Report.xlsx`;

        // Send email to all admins at once
        const mailOptions = {
            from: `"SmartHood Admin" <${process.env.EMAIL_FROM || 'smarthoodc03@gmail.com'}>`,
            to: adminEmails.join(', '),
            subject: `[SmartHood] User Report - ${user.name} (${user.uniqueId || 'N/A'})`,
            html: `
                <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #0E7490, #4338CA); padding: 30px; text-align: center; color: white;">
                        <h1 style="margin: 0; font-size: 24px;">📊 User Report Generated</h1>
                        <p style="margin: 10px 0 0; opacity: 0.9;">SmartHood Admin Panel</p>
                    </div>
                    <div style="padding: 30px;">
                        <h2 style="color: #1e293b; margin-top: 0;">User: ${user.name}</h2>
                        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                            <tr><td style="padding: 8px; color: #64748b;">Unique ID</td><td style="padding: 8px; font-weight: bold;">${user.uniqueId || 'N/A'}</td></tr>
                            <tr style="background: #f8fafc;"><td style="padding: 8px; color: #64748b;">Phone</td><td style="padding: 8px; font-weight: bold;">${user.phone || 'N/A'}</td></tr>
                            <tr><td style="padding: 8px; color: #64748b;">Locality</td><td style="padding: 8px; font-weight: bold;">${user.locality}, ${user.town}</td></tr>
                            <tr style="background: #f8fafc;"><td style="padding: 8px; color: #64748b;">Profession</td><td style="padding: 8px; font-weight: bold;">${user.professionCategory}</td></tr>
                            <tr><td style="padding: 8px; color: #64748b;">Impact Score</td><td style="padding: 8px; font-weight: bold;">${user.impactScore || 0}</td></tr>
                        </table>
                        <p style="color: #64748b; font-size: 14px;">📎 Full report is attached as an Excel file.</p>
                    </div>
                    <div style="padding: 20px; background: #f1f5f9; text-align: center; border-top: 1px solid #e2e8f0;">
                        <p style="color: #64748b; margin: 0; font-size: 12px;">SmartHood Admin Report • Generated on ${new Date().toLocaleString('en-IN')}</p>
                    </div>
                </div>
            `,
            attachments: [{
                filename: fileName,
                content: buffer,
                contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            }]
        };

        await transporter.sendMail(mailOptions);

        console.log(`[Excel] Report for ${user.name} sent to ${adminEmails.join(', ')}`);

        res.json({
            success: true,
            message: `Report generated and sent to ${adminEmails.length} admins`,
            sentTo: adminEmails
        });

    } catch (error) {
        console.error('Excel Export Error:', error);
        res.status(500).json({ message: 'Failed to generate and send report', error: error.message });
    }
};

module.exports = {
    adminLogin,
    getAnalytics,
    getAllUsers,
    createAdmin,
    getUserStats,
    exportUserExcel
};
