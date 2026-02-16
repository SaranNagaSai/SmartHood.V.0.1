const User = require('../models/User');

// @desc    Get peers in the same locality and course
// @route   GET /api/students/peers
// @access  Private
const getPeers = async (req, res) => {
    try {
        const currentUser = await User.findById(req.user._id);
        if (currentUser.professionCategory !== 'Student') {
            return res.status(403).json({ message: 'Only students can access peer discovery' });
        }

        const peers = await User.find({
            locality: currentUser.locality,
            professionCategory: 'Student',
            _id: { $ne: currentUser._id },
            'professionDetails.course': currentUser.professionDetails.course
        }).select('name uniqueId professionDetails impactScore');

        res.json(peers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get potential mentors in the locality
// @route   GET /api/students/mentors
// @access  Private
const getMentors = async (req, res) => {
    try {
        const currentUser = await User.findById(req.user._id);

        // Find employed/business users in same locality
        // We could add more complex matching logic later
        const mentors = await User.find({
            locality: currentUser.locality,
            professionCategory: { $in: ['Employed', 'Business'] }
        }).select('name uniqueId professionCategory professionDetails experience');

        res.json(mentors);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get student stats in locality
// @route   GET /api/students/stats
// @access  Private
const getStudentStats = async (req, res) => {
    try {
        const currentUser = await User.findById(req.user._id);

        const stats = await User.aggregate([
            { $match: { locality: currentUser.locality, professionCategory: 'Student' } },
            { $group: { _id: '$professionDetails.course', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { getPeers, getMentors, getStudentStats };
