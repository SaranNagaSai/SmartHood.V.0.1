const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Fix paths relative to this script
const serverPath = path.join(__dirname, '../server');
const Locality = require(path.join(serverPath, 'models/Locality'));
const User = require(path.join(serverPath, 'models/User'));

dotenv.config({ path: path.join(serverPath, '.env') });

const verifyLocalityStats = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        // 1. Test getLocalities logic (Aggregation)
        console.log('\n--- Testing Locality User Counts ---');
        const town = 'Hyderabad'; // Assuming some data exists for Hyderabad
        const localities = await Locality.find({ town, isActive: true });

        const localityNames = localities.map(l => l.name);
        console.log(`Found ${localities.length} localities in ${town}`);

        const userCounts = await User.aggregate([
            {
                $match: {
                    locality: { $in: localityNames },
                    town: town
                }
            },
            { $group: { _id: "$locality", count: { $sum: 1 } } }
        ]);

        console.log('User Counts per Locality:', userCounts);

        // 2. Test getUsersByLocality logic
        if (localities.length > 0) {
            const targetLocality = localities[0].name;
            console.log(`\n--- Testing Fetch Users for ${targetLocality} ---`);

            const users = await User.find({
                locality: targetLocality,
                town: town
            })
                .select('name uniqueId professionCategory professionDetails impactScore')
                .limit(3);

            console.log(`Found ${users.length} users:`);
            users.forEach(u => console.log(`- ${u.name} (${u.professionCategory})`));
        }

        mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

verifyLocalityStats();
