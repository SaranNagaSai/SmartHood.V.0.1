const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const { normalizeToEnglish } = require('../utils/locationMap');

dotenv.config({ path: path.join(__dirname, '../.env') });

const populateNormalizedLocations = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB.');

        const users = await User.find({
            $or: [
                { normalizedLocality: { $exists: false } },
                { normalizedTown: { $exists: false } },
                { normalizedDistrict: { $exists: false } },
                { normalizedLocality: "" },
                { normalizedTown: "" },
                { normalizedDistrict: "" }
            ]
        });

        console.log(`Found ${users.length} users to update.`);

        let count = 0;
        for (const user of users) {
            user.normalizedLocality = normalizeToEnglish(user.locality);
            user.normalizedTown = normalizeToEnglish(user.town);
            user.normalizedDistrict = normalizeToEnglish(user.district);

            await user.save();
            count++;
            if (count % 10 === 0) console.log(`Updated ${count} users...`);
        }

        console.log(`Migration complete. Updated ${count} users.`);
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

populateNormalizedLocations();
