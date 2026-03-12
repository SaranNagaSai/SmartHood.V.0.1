const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ phone: '9398176717' });
        if (user && user.fcmToken) {
            console.log('Found user:', user.name);
            console.log('Current legacy token:', user.fcmToken);
            
            // Explicitly set the array
            if (!user.fcmTokens) user.fcmTokens = [];
            if (!user.fcmTokens.includes(user.fcmToken)) {
                user.fcmTokens.push(user.fcmToken);
            }
            
            await user.save();
            console.log('Successfully seeded fcmTokens array');
            console.log('Updated Array:', user.fcmTokens);
        } else {
            console.log('User or legacy token not found');
        }
    } catch (err) {
        console.error('Error during seeding:', err);
    } finally {
        await mongoose.disconnect();
    }
}

seed();
