require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const { createNotification } = require('./controllers/notificationController');


async function testNotificationToNag() {
    await mongoose.connect(process.env.MONGODB_URI);

    // Find Nag Sai
    const nagSai = await User.findOne({ phone: '9398176717' });
    if (!nagSai) {
        console.log('Nag Sai not found');
        return;
    }

    console.log(`Testing full notification delivery (Email+SMS) to: ${nagSai.name}...`);

    const notificationData = {
        title: 'PLATFORM TEST: Neighbour Activity',
        body: 'This is a test to verify your recipient status for neighbor-raised alerts.'
    };

    try {
        const result = await createNotification(
            nagSai._id,
            notificationData,
            'alert',
            '/alerts',
            null, // Simple text email
            false, // DO NOT skip email
            {
                workTitle: 'System Test',
                workInfo: 'Verifying notification loop for neighbor posts.',
                senderName: 'Neighbor Test User',
                senderPhone: '9876543210'
            }
        );
        console.log('Notification result:', result ? 'Delivered/Scheduled' : 'Failed');
    } catch (e) {
        console.error('Critical delivery failure:', e);
    }

    await mongoose.disconnect();
}

testNotificationToNag();
