const Rating = require('../models/Rating');
const User = require('../models/User');
const Service = require('../models/Service');

// @desc    Create rating
// @route   POST /api/ratings
// @access  Private
const createRating = async (req, res) => {
    try {
        const { serviceId, ratedUserId, rating, review } = req.body;

        // Check if user already rated this service
        const existingRating = await Rating.findOne({
            serviceId,
            raterId: req.user._id
        });

        if (existingRating) {
            return res.status(400).json({ message: 'You have already rated this service' });
        }

        const newRating = await Rating.create({
            serviceId,
            raterId: req.user._id,
            ratedUserId,
            rating,
            review
        });

        // Update impact score of rated user
        const allRatings = await Rating.find({ ratedUserId });
        const avgRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;

        await User.findByIdAndUpdate(ratedUserId, {
            $inc: { impactScore: rating }
        });

        res.status(201).json(newRating);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get ratings for a user
// @route   GET /api/ratings/user/:userId
// @access  Private
const getUserRatings = async (req, res) => {
    try {
        const ratings = await Rating.find({ ratedUserId: req.params.userId })
            .populate('raterId', 'name uniqueId')
            .populate('serviceId', 'title')
            .sort({ createdAt: -1 });

        const avgRating = ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
            : 0;

        res.json({
            ratings,
            averageRating: Math.round(avgRating * 10) / 10,
            totalRatings: ratings.length
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get rating for a service
// @route   GET /api/ratings/service/:serviceId
// @access  Private
const getServiceRating = async (req, res) => {
    try {
        const rating = await Rating.findOne({
            serviceId: req.params.serviceId,
            raterId: req.user._id
        });

        res.json(rating || null);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    createRating,
    getUserRatings,
    getServiceRating
};
