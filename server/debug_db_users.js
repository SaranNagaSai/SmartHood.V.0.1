const mongoose = require('mongoose');
const User = require('./models/User'); // Adjust path if needed
require('dotenv').config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const users = await User.find({}, 'name town locality professionCategory');
        console.log('--- ALL USERS ---');
        console.log(JSON.stringify(users, null, 2));

        // specific check for Gudivada
        const gudivadaUsers = await User.find({ town: { $regex: /Gudivada/i } });
        console.log(`\n--- USERS IN GUDIVADA: ${gudivadaUsers.length} ---`);

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
