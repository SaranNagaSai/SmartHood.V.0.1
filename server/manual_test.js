const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: 'c:/Users/saran/OneDrive/Documents/SmartHood.V.0.1/server/.env' });

const User = require('./models/User');
const { createNotification } = require('./controllers/notificationController');

async function triggerManualTest() {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI);

        console.log('Finding your profile (9398176717)...');
        const user = await User.findOne({ phone: '9398176717' });

        if (!user) {
            console.log('❌ Error: User not found in database.');
            process.exit(1);
        }

        console.log(`Found: ${user.name}`);
        console.log(`Email on file: ${user.email}`);

        const data = {
            title: 'Manual Test Notification',
            titleTe: 'మాన్యువల్ పరీక్ష ప్రకటన',
            body: 'This is a manual test triggered directly from the server to verify your setup. Sent at: ' + new Date().toLocaleTimeString(),
            bodyTe: 'సర్వర్‌ నుండి నేరుగా పంపబడిన పరీక్ష ప్రకటన. సమయం: ' + new Date().toLocaleTimeString()
        };

        console.log('Triggering Dual-Channel notification (Email + FCM)...');
        const result = await createNotification(user._id, data, 'system', '/home');

        if (result) {
            console.log('✅ Success! The notification system has processed your request.');
            console.log('Please check your Email, Phone Notifications, and the Bell icon in the app.');
        } else {
            console.log('❌ Failed: Something went wrong in createNotification logic.');
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('💥 Critical Error:', err.message);
        process.exit(1);
    }
}

triggerManualTest();
