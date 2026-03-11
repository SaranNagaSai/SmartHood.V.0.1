const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function checkUser() {
    await mongoose.connect(process.env.MONGODB_URI);
    const users = await User.find({ phone: /9398176717/ });
    console.log('Found', users.length, 'users with phone 9398176717');
    users.forEach(u => {
        console.log(`- ID: ${u._id}, Name: ${u.name}, FCM: ${!!u.fcmToken}, Token: ${u.fcmToken?.substring(0, 10)}...`);
    });
    await mongoose.disconnect();
}
checkUser();
