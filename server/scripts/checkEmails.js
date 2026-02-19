const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const User = require('../models/User');

const checkEmails = async () => {
    try {
        await connectDB();

        const users = await User.find({ town: /Eluru/i });
        console.log(`--- Users in Eluru: ${users.length} ---`);

        users.forEach(u => {
            console.log(`Name: ${u.name} | Locality: ${u.locality} | Email: ${u.email || 'MISSING'}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.disconnect();
        process.exit(0);
    }
};

checkEmails();
