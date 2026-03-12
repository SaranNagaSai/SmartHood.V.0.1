require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const { createNotification } = require('./controllers/notificationController');

async function trigger() {
    try {
        console.log('[1/5] Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        
        console.log('[2/5] Finding user 9398176717...');
        const user = await User.findOne({ phone: '9398176717' });
        
        if (!user) {
            console.error('❌ User not found');
            return;
        }
        console.log(`🎯 Found user: ${user.name} in ${user.locality}`);

        const data = {
            title: '🚨 Patimeeda Community Alert',
            body: 'A neighbor in Patimeeda Gudivada has reported an urgent community update. Check the app for details.',
            titleTe: '🚨 పట్టిమీద కమ్యూనిటీ అలెర్ట్',
            bodyTe: 'పట్టిమీద గుడివాడలోని ఒక పొరుగువారు అత్యవసర కమ్యూనిటీ అప్‌డేట్‌ను నివేదించారు. వివరాల కోసం యాప్‌ని తనిఖీ చేయండి.'
        };

        const extendedData = {
            workTitle: 'Community Safety Update',
            workInfo: 'Emergency maintenance or localized alert for residents.',
            senderName: 'Patimeeda Admin',
            senderPhone: '9398176717'
        };

        console.log('[3/5] Triggering Triple-Channel Notification (Email, FCM, SMS)...');
        const notification = await createNotification(user._id, data, 'alert', '/home', null, false, extendedData);

        if (notification) {
            console.log('--- [4/5] TRIGGER RESULTS ---');
            console.log('✅ Notification ID:', notification._id);
            console.log('✅ Delivered Status:', notification.delivered);
            console.log('✅ Delivery Method:', notification.deliveryMethod);
            console.log('----------------------------');
        } else {
            console.error('❌ Failed to create notification object');
        }

    } catch (err) {
        console.error('❌ [5/5] CRITICAL ERROR:', err);
    } finally {
        console.log('🔌 Closing DB Connection...');
        await mongoose.disconnect();
        console.log('🏁 Done.');
        process.exit(0);
    }
}

trigger();
