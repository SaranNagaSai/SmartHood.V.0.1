const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function listUsers() {
    await mongoose.connect(process.env.MONGODB_URI);
    const users = await User.find({});
    console.log('--- DB USER ANALYSIS ---');
    users.forEach(u => {
        console.log(`Name: ${u.name}`);
        console.log(`Town: "${u.town}" (Length: ${u.town?.length})`);
        console.log(`Locality: "${u.locality}"`);
        console.log(`Language Preference: ${u.language}`);
        console.log('---');
    });
    await mongoose.disconnect();
}

listUsers();
