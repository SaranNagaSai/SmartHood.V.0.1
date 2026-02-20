const User = require('../models/User');

// @desc    Get stats for the user's locality
// @route   GET /api/users/stats
// @access  Private
const getLocalityStats = async (req, res) => {
    try {
        const currentUser = req.user;

        // Aggregate Specific Job Titles in MY locality (or targeted localities)
        const { localities } = req.query;

        // Base match: Always filter by the user's town to avoid cross-town collisions
        // Use regex for case/whitespace safety on town
        let matchQuery = {
            town: { $regex: new RegExp(`^\\s*${currentUser.town}\\s*$`, 'i') }
        };

        if (localities) {
            const localityList = localities.split(',');
            // Use $or with regex for case-insensitive matching of each locality
            matchQuery.$or = localityList.map(loc => ({
                locality: { $regex: new RegExp(`^\\s*${loc}\\s*$`, 'i') }
            }));
        } else {
            // Default to current user's locality
            matchQuery.locality = { $regex: new RegExp(`^\\s*${currentUser.locality}\\s*$`, 'i') };
        }

        const professionStats = await User.aggregate([
            { $match: matchQuery },
            {
                $project: {
                    jobTitle: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$professionCategory", "Employed"] }, then: { $ifNull: ["$professionDetails.jobRole", "Employed"] } },
                                { case: { $eq: ["$professionCategory", "Business"] }, then: { $ifNull: ["$professionDetails.businessType", "Business"] } },
                                { case: { $eq: ["$professionCategory", "Student"] }, then: { $ifNull: ["$professionDetails.course", "Student"] } },
                                { case: { $eq: ["$professionCategory", "Homemaker"] }, then: "Homemaker" }
                            ],
                            default: { $ifNull: ["$professionDetails.description", "Other"] }
                        }
                    }
                }
            },
            { $group: { _id: "$jobTitle", count: { $sum: 1 } } },
            { $match: { _id: { $ne: null } } },
            { $sort: { count: -1 } }
        ]);

        // Aggregate State-wise Users (for Reach)
        const stateStats = await User.aggregate([
            { $group: { _id: "$state", count: { $sum: 1 } } },
            { $limit: 5 }
        ]);

        res.json({
            professions: professionStats,
            states: stateStats
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get users by locality (Public Profile)
// @route   GET /api/users/locality/:locality
// @access  Private
const getUsersByLocality = async (req, res) => {
    try {
        const { locality } = req.params;
        const { town } = req.query; // Allow passing town as query param
        const currentUser = req.user;

        // Use the provided town or fallback to user's town
        const targetTown = town || currentUser.town;

        // Create case-insensitive regex for town and locality
        // Match town ignoring whitespace and case
        const townRegex = new RegExp(`^\\s*${targetTown}\\s*$`, 'i');
        const localityRegex = new RegExp(`^${locality}$`, 'i');

        const users = await User.find({
            locality: { $regex: localityRegex },
            town: { $regex: townRegex }
        })
            .select('name uniqueId professionCategory professionDetails impactScore profilePhoto phone')
            .sort({ impactScore: -1 });

        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get users by profession in locality
// @route   GET /api/users/by-profession/:profession
// @access  Private
const getUsersByProfession = async (req, res) => {
    try {
        const { profession } = req.params;
        const currentUser = req.user;

        // Create case-insensitive regex for locality to handle variations in casing
        const localityRegex = new RegExp(`^\\s*${currentUser.locality.trim()}\\s*$`, 'i');

        const users = await User.find({
            locality: { $regex: localityRegex },
            $or: [
                { 'professionDetails.jobRole': profession },
                { 'professionDetails.businessType': profession },
                { 'professionDetails.course': profession },
                { 'professionDetails.description': profession },
                { professionCategory: profession } // For Homemaker or legacy
            ]
        })
            .select('name uniqueId experience professionDetails professionCategory locality impactScore phone email profilePhoto')
            .sort({ experience: -1 });

        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-__v');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            const { address, locality, town, district, state, email,
                professionCategory, professionDetails, experience, bloodGroup } = req.body;

            // Update all editable fields
            user.address = address || user.address;
            user.locality = locality || user.locality;
            user.town = town || user.town;
            user.district = district || user.district;
            user.state = state || user.state;
            user.email = email !== undefined ? email : user.email;
            user.age = req.body.age || user.age;
            user.gender = req.body.gender || user.gender;
            user.bloodGroup = bloodGroup || user.bloodGroup; // Allow blood group updates
            user.professionCategory = professionCategory || user.professionCategory;
            user.professionDetails = professionDetails || user.professionDetails;
            user.experience = experience !== undefined ? experience : user.experience;

            const updatedUser = await user.save();
            res.json(updatedUser);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get user activity metrics
// @route   GET /api/users/activity
// @access  Private
const getActivity = async (req, res) => {
    try {
        const Service = require('../models/Service');
        const userId = req.user._id;

        // Get service stats
        const offeredCount = await Service.countDocuments({ createdBy: userId, type: 'offer' });
        const requestedCount = await Service.countDocuments({ createdBy: userId, type: 'request' });
        const completedCount = await Service.countDocuments({
            $or: [{ createdBy: userId }, { completedBy: userId }],
            status: 'completed'
        });

        // Get financial stats
        const completedServices = await Service.find({
            completedBy: userId,
            status: 'completed'
        }).select('amountSpent');

        const earned = completedServices.reduce((sum, s) => sum + (s.amountSpent || 0), 0);

        const spentServices = await Service.find({
            createdBy: userId,
            status: 'completed'
        }).select('amountSpent');

        const spent = spentServices.reduce((sum, s) => sum + (s.amountSpent || 0), 0);

        // Get monthly trend (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyStats = await Service.aggregate([
            {
                $match: {
                    status: 'completed',
                    completionDate: { $gte: sixMonthsAgo },
                    $or: [{ createdBy: userId }, { completedBy: userId }]
                }
            },
            {
                $group: {
                    _id: {
                        month: { $dateToString: { format: '%Y-%m', date: '$completionDate' } },
                        isEarned: { $eq: ['$completedBy', userId] }
                    },
                    amount: { $sum: '$amountSpent' }
                }
            }
        ]);

        // Format for frontend
        const trendMap = {};
        monthlyStats.forEach(stat => {
            const month = stat._id.month;
            if (!trendMap[month]) trendMap[month] = { name: month, earned: 0, spent: 0 };
            if (stat._id.isEarned) trendMap[month].earned += stat.amount;
            else trendMap[month].spent += stat.amount;
        });
        const monthlyTrend = Object.values(trendMap).sort((a, b) => a.name.localeCompare(b.name));

        res.json({
            financial: { earned, spent, monthly: monthlyTrend },
            services: { offered: offeredCount, requested: requestedCount, completed: completedCount },
            performance: {
                impactScore: req.user.impactScore || 0,
                responseSpeed: 15,
                ranking: 1
            },
            engagement: { badges: [], timeline: [], alertsParticipation: 0 }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update FCM Token
// @route   PUT /api/users/fcm-token
// @access  Private
const updateFcmToken = async (req, res) => {
    try {
        const { fcmToken } = req.body;
        const user = await User.findById(req.user._id);

        if (user) {
            user.fcmToken = fcmToken;
            await user.save();
            res.json({ message: 'FCM Token updated' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Upload profile photo
// @route   POST /api/users/photo
// @access  Private
const uploadPhoto = async (req, res) => {
    try {
        if (!req.file) {
            res.status(400);
            throw new Error('Please upload a file');
        }

        const user = await User.findById(req.user._id);

        if (user) {
            // req.file.path contains the full Cloudinary URL when using multer-storage-cloudinary
            const profilePhotoPath = req.file.path;
            user.profilePhoto = profilePhotoPath;
            await user.save();

            res.json({
                message: 'Profile photo uploaded',
                profilePhoto: profilePhotoPath
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};



// @desc    Search users (for Blood Donation etc)
// @route   GET /api/users/search
// @access  Private
const searchUsers = async (req, res) => {
    try {
        const { town, locality, bloodGroup, q } = req.query;
        const currentUser = req.user;

        const query = {};

        // Use provided Town or Fallback to User's Town
        // Always scope to a town to prevent global leakage unless admin (which this is not)
        const targetTown = town || currentUser.town;
        if (targetTown) {
            query.town = { $regex: new RegExp(`^\\s*${targetTown.trim()}\\s*$`, 'i') };
        }

        if (locality) {
            query.locality = { $regex: new RegExp(`^${locality}$`, 'i') };
        }

        if (bloodGroup) {
            query.bloodGroup = bloodGroup;
        }

        if (q) {
            query.name = { $regex: q, $options: 'i' };
        }

        // Exclude current user from results (don't donate to self in alert list)
        query._id = { $ne: currentUser._id };

        const users = await User.find(query)
            .select('name uniqueId locality phone profilePhoto bloodGroup professionCategory email')
            .limit(100);

        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getLocalityStats,
    getUsersByProfession,
    getProfile,
    updateProfile,
    getActivity,
    updateFcmToken,
    getUsersByLocality,
    uploadPhoto,
    searchUsers
};
