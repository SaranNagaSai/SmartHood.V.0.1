const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const User = require('../models/User');

const cleanupEluru = async () => {
    try {
        await connectDB();

        const townName = "Eluru";
        const townRegex = new RegExp(`^\\s*${townName.trim()}\\s*$`, 'i');

        const users = await User.find({ town: { $regex: townRegex } });
        console.log(`--- Normalizing ${users.length} users in "${townName}" ---`);

        for (const user of users) {
            const oldTown = user.town;
            const oldLocality = user.locality;

            // Normalize to "Eluru" and trimmed locality
            user.town = "Eluru";
            user.locality = user.locality.trim();

            if (oldTown !== user.town || oldLocality !== user.locality) {
                await user.save();
                console.log(`Cleaned up: ${user.name} | "${oldTown}" -> "${user.town}" | "${oldLocality}" -> "${user.locality}"`);
            }
        }

        console.log('--- Cleanup Complete ---');

    } catch (error) {
        console.error('Error during cleanup:', error);
    } finally {
        mongoose.disconnect();
        process.exit(0);
    }
};

cleanupEluru();
