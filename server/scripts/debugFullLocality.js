const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const User = require('../models/User');
const Locality = require('../models/Locality');

const debugFullLocalityFlow = async () => {
    try {
        await connectDB();

        const town = "Eluru";
        console.log(`\n--- Simulating getLocalities for "${town}" ---`);

        // 1. User Aggregation
        const trimmedTown = town.trim();
        const matchStage = { town: { $regex: new RegExp(`^\\s*${trimmedTown}\\s*$`, 'i') } };

        const localityGroups = await User.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: { $toLower: "$locality" },
                    displayName: { $first: "$locality" },
                    userCount: { $sum: 1 }
                }
            }
        ]);
        console.log(`1. User Aggregation found ${localityGroups.length} groups.`);

        // 2. Coords Lookup
        const localityNames = localityGroups.map(g => g.displayName);
        console.log(`   Searching Locality collection for names: ${JSON.stringify(localityNames)}`);

        const localityDocs = await Locality.find({
            town: { $regex: new RegExp(`^\\s*${trimmedTown}\\s*$`, 'i') },
            // Using the same regex logic as in the controller
            name: { $in: localityNames.map(n => new RegExp(`^${n.trim()}$`, 'i')) }
        });
        console.log(`2. Locality collection found ${localityDocs.length} matching docs.`);

        // 3. Merge
        const coordMap = {};
        localityDocs.forEach(loc => {
            if (loc.coordinates) {
                coordMap[loc.name.toLowerCase().trim()] = loc.coordinates;
            }
        });

        const result = localityGroups.map(group => ({
            _id: group.displayName,
            name: group.displayName.trim(),
            userCount: group.userCount,
            coordinates: coordMap[group._id.trim()] || null
        }));

        console.log(`3. Final Merged Result (${result.length} items):`);
        console.log(JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('Critical Error in Flow:', error);
    } finally {
        mongoose.disconnect();
        process.exit(0);
    }
};

debugFullLocalityFlow();
