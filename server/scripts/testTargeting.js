const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const User = require('../models/User');

const testTargeting = async () => {
    try {
        await connectDB();

        // Mock user (The one who is sending the request)
        // From the screenshot, it seems they are in "santhi nagar" and town "Eluru"
        const sender = await User.findOne({ locality: /santhi nagar/i });
        if (!sender) {
            console.error("Sender not found");
            return;
        }
        console.log(`Sender: ${sender.name} | Town: "${sender.town}" | Locality: "${sender.locality}"`);

        const town = sender.town.trim();
        const townRegex = new RegExp(`^\\s*${town}\\s*$`, 'i');

        let query = {
            town: { $regex: townRegex },
            _id: { $ne: sender._id }
        };

        console.log('Query without locality restrictions:', JSON.stringify(query, (key, value) => value instanceof RegExp ? value.toString() : value));

        const targetUsersAny = await User.find(query);
        console.log(`Found ${targetUsersAny.length} potential recipients in town (excluding sender).`);

        // Test with specific localities
        // Suppose they selected "Sai Nagar"
        const selectedCommunities = ["Sai Nagar"];
        let allCommunities = [sender.locality, ...selectedCommunities];

        if (allCommunities.length > 1) {
            query.locality = {
                $in: allCommunities.map(loc => new RegExp(`^\\s*${loc.trim()}\\s*$`, 'i'))
            };
        }

        console.log('Query with locality restrictions:', JSON.stringify(query, (key, value) => value instanceof RegExp ? value.toString() : value));

        const targetUsersSpecific = await User.find(query);
        console.log(`Found ${targetUsersSpecific.length} recipients with locality restrictions.`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.disconnect();
        process.exit(0);
    }
};

testTargeting();
