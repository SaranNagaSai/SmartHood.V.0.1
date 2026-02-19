// @desc    Get professions by community (locality) - NOW UPDATED TO RETURN TOWN-WIDE BY DEFAULT IF REQUESTED
// @route   GET /api/professions/by-community?community=X&town=Y
// @access  Private
const getProfessionsByCommunity = async (req, res) => {
    try {
        const { community, town } = req.query;

        // Broaden search: If town is provided, we fetch professions from the whole town to give more options
        // This solves the 'empty' profession list issue for newly registered communities.
        let matchStage = {};
        if (town) {
            matchStage.town = { $regex: new RegExp(`^\\s*${town.trim()}\\s*$`, 'i') };
        } else if (community) {
            matchStage.locality = { $regex: new RegExp(`^\\s*${community.trim()}\\s*$`, 'i') };
        } else {
            return res.status(400).json({ message: 'Community or Town parameter is required' });
        }

        matchStage.professionCategory = { $exists: true, $ne: null, $ne: '' };

        console.log(`[CommunityCtrl] Fetching professions. Match:`, JSON.stringify(matchStage));

        const professions = await User.aggregate([
            { $match: matchStage },
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

        console.log(`[CommunityCtrl] Found ${professions.length} professions`);
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
        const localityExcludeRegex = new RegExp(`^\\s*${(currentUser.locality || '').trim()}\\s*$`, 'i');

        console.log(`[CommunityCtrl] Fetching communities for town: ${town}. Excluding: ${currentUser.locality}`);

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

        console.log(`[CommunityCtrl] Found ${communities.length} communities`);
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
