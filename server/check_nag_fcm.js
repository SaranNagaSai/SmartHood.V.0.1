const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function checkNagFCM() {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne({ phone: '9398176717' });
    if (user) {
        console.log(`User: ${user.name}`);
        console.log(`FCM Token present: ${!!user.fcmToken}`);
        console.log(`FCM Token prefix: ${user.fcmToken ? user.fcmToken.substring(0, 20) : 'N/A'}`);
    } else {
        console.log('User not found');
    }
    await mongoose.disconnect();
}

checkNagFCM();
