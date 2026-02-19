const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const User = require('../models/User');

const debugApi = async () => {
    try {
        await connectDB();

        const town = "Eluru";
        const trimmedTown = town.trim();
        const matchStage = {
            town: { $regex: new RegExp(`^\\s*${trimmedTown}\\s*$`, 'i') }
        };

        console.log('--- Debugging getLocalities Logic ---');
        console.log('Match Stage:', JSON.stringify(matchStage));

        const localityGroups = await User.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: { $toLower: "$locality" },
                    displayName: { $first: "$locality" },
                    userCount: { $sum: 1 }
                }
            },
            { $sort: { displayName: 1 } }
        ]);

        console.log('Locality Groups Found:', localityGroups.length);
        console.log(JSON.stringify(localityGroups, null, 2));

        const currentUser = { locality: "santhi nagar" };
        const townRegex = new RegExp(`^\\s*${town.trim()}\\s*$`, 'i');
        const localityExcludeRegex = new RegExp(`^\\s*${currentUser.locality.trim()}\\s*$`, 'i');

        console.log('\n--- Debugging getCommunitiesByTown Logic ---');
        console.log('Locality Exclude Regex:', localityExcludeRegex);

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

        console.log('Communities Found:', communities.length);
        console.log(JSON.stringify(communities, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.disconnect();
        process.exit(0);
    }
};

debugApi();
