const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const listUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const users = await User.find({
            locality: { $regex: /Patimeeda/i }
        }).select('name email phone');

        const fs = require('fs');
        fs.writeFileSync('patimeeda_users.txt', JSON.stringify(users, null, 2));
        console.log('Done writing to file');

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

listUsers();
