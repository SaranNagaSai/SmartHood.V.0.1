const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const User = require('../models/User');

const checkUsersInEluru = async () => {
    try {
        await connectDB();

        const townName = "Eluru";
        const townRegex = new RegExp(`^\\s*${townName.trim()}\\s*$`, 'i');

        const users = await User.find({ town: { $regex: townRegex } });
        console.log(`--- Users in ${townName} (${users.length}) ---`);
        users.forEach((user, i) => {
            console.log(`${i + 1}. ${user.name} | Locality: "${user.locality}" | Town: "${user.town}" | Profession: "${user.professionCategory}"`);
        });

        const localities = await User.aggregate([
            { $match: { town: { $regex: townRegex } } },
            { $group: { _id: "$locality", count: { $sum: 1 } } }
        ]);
        console.log('--- Locality Aggregation ---');
        console.log(localities);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.disconnect();
        process.exit(0);
    }
};

checkUsersInEluru();
