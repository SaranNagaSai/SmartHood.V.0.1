require('dotenv').config();
const admin = require('./config/firebase');
const mongoose = require('mongoose');
const User = require('./models/User');

async function testPush() {
    console.log('[Test] Connecting to DB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Test] DB Connected.');

    const nagSai = await User.findOne({ phone: '9398176717' });

    if (!nagSai || !nagSai.fcmToken) {
        console.log('[Test] User or Token not found');
        await mongoose.disconnect();
        return;
    }

    console.log(`[Test] Sending test push to ${nagSai.name}...`);
    console.log(`[Test] Token found: ${nagSai.fcmToken.substring(0, 15)}...`);

    const message = {
        token: nagSai.fcmToken,
        notification: {
            title: '🎉 SmartHood Push Live!',
            body: 'Your browser notifications are now connected successfully.'
        }
    };

    try {
        console.log('[Test] Calling admin.messaging().send...');
        const response = await admin.messaging().send(message);
        console.log('✅ [Test] Successfully sent message:', response);
    } catch (error) {
        console.error('❌ [Test] Error sending message:', error.message);
    }

    console.log('[Test] Disconnecting...');
    await mongoose.disconnect();
    console.log('[Test] Done.');
}

testPush().catch(err => {
    console.error('[Test] Critical error in test script:', err);
    process.exit(1);
});
