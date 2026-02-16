const User = require('../models/User');

// @desc    Get professions by community (locality)
// @route   GET /api/professions/by-community?community=X
// @access  Private
const getProfessionsByCommunity = async (req, res) => {
    try {
        const { community } = req.query;

        if (!community) {
            return res.status(400).json({ message: 'Community parameter is required' });
        }

        // Aggregate specific Job Titles from users in the specified community (case-insensitive)
        const communityRegex = new RegExp(`^\\s*${community.trim()}\\s*$`, 'i');
        const professions = await User.aggregate([
            {
                $match: {
                    locality: { $regex: communityRegex },
                    professionCategory: { $exists: true, $ne: null, $ne: '' }
                }
            },
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
            {
                $group: {
                    _id: '$jobTitle',
                    userCount: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    profession: '$_id',
                    userCount: 1
                }
            },
            {
                $sort: { profession: 1 }
            }
        ]);

        res.json(professions);
    } catch (error) {
        console.error('Error fetching professions by community:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get communities by town
// @route   GET /api/communities/by-town?town=X
// @access  Private
const getCommunitiesByTown = async (req, res) => {
    try {
        const { town } = req.query;
        const currentUser = req.user;



        if (!town) {
            return res.status(400).json({ message: 'Town parameter is required' });
        }

        // Aggregate communities (localities) from users in the specified town
        const townRegex = new RegExp(`^\\s*${town.trim()}\\s*$`, 'i');
        const localityExcludeRegex = new RegExp(`^\\s*${currentUser.locality.trim()}\\s*$`, 'i');



        const communities = await User.aggregate([
            {
                $match: {
                    town: { $regex: townRegex },
                    locality: { $exists: true, $ne: null, $ne: '', $not: localityExcludeRegex }
                }
            },
            {
                $group: {
                    _id: '$locality',
                    memberCount: { $sum: 1 }
                }
            },
            {
                $match: {
                    memberCount: { $gt: 0 }
                }
            },
            {
                $project: {
                    _id: 0,
                    communityName: '$_id',
                    memberCount: 1
                }
            },
            {
                $sort: { communityName: 1 }
            }
        ]);


        res.json(communities);
    } catch (error) {
        console.error('Error fetching communities by town:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get professions by town (all localities in town)
// @route   GET /api/professions/by-town?town=X
// @access  Private
const getProfessionsByTown = async (req, res) => {
    try {
        const { town } = req.query;



        if (!town) {
            return res.status(400).json({ message: 'Town parameter is required' });
        }

        const townRegex = new RegExp(`^\\s*${town.trim()}\\s*$`, 'i');


        // Aggregate professions from ALL users in the town
        const professions = await User.aggregate([
            {
                $match: {
                    town: { $regex: townRegex },
                    professionCategory: { $exists: true, $ne: null, $ne: '' }
                }
            },
            {
                $group: {
                    _id: '$professionCategory',
                    userCount: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    profession: '$_id',
                    userCount: 1
                }
            },
            {
                $sort: { profession: 1 }
            }
        ]);


        res.json(professions);
    } catch (error) {
        console.error('Error fetching professions by town:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getProfessionsByCommunity,
    getCommunitiesByTown,
    getProfessionsByTown
};
