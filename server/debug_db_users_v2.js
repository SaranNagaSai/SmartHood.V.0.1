const mongoose = require('mongoose');
const User = require('./models/User');
const fs = require('fs');
require('dotenv').config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({}, 'name town locality professionCategory');

        let output = '--- ALL USERS ---\n';
        output += JSON.stringify(users, null, 2);

        const gudivadaUsers = await User.find({ town: { $regex: /Gudivada/i } });
        output += `\n\n--- USERS IN GUDIVADA: ${gudivadaUsers.length} ---\n`;
        output += JSON.stringify(gudivadaUsers.map(u => ({ name: u.name, locality: u.locality, town: u.town })), null, 2);

        fs.writeFileSync('users_dump_utf8.txt', output);
        console.log('Data written to users_dump_utf8.txt');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
