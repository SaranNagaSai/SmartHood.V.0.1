const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config({ path: 'c:/Users/saran/OneDrive/Documents/SmartHood.V.0.1/server/.env' });

async function checkUserToken() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ phone: '9398176717' });

        if (!user) {
            console.log('User not found!');
        } else {
            console.log('User found:', user.name);
            console.log('FCM Token present:', user.fcmToken ? 'YES' : 'NO');
            if (user.fcmToken) {
                console.log('Token starts with:', user.fcmToken.substring(0, 10) + '...');
            }
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkUserToken();
