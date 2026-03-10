const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const { createNotification } = require('./controllers/notificationController');
const User = require('./models/User');

async function testComplaintSMS() {
    console.log('--- Testing Complaint SMS Delivery ---');
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ phone: '9398176717' });
        if (!user) throw new Error('Test user not found');

        console.log(`User: ${user.name} (${user.phone})`);

        const data = {
            title: 'Complaint Logged',
            body: 'Your query regarding water supply has been registered. Ticket: TKT00123'
        };

        const extendedData = {
            workTitle: 'Water Supply',
            workInfo: 'Low pressure in Sector 4',
            senderName: user.name,
            senderPhone: user.phone
        };

        console.log('Triggering notification...');
        const result = await createNotification(
            user._id,
            data,
            'complaint',
            '/complaints',
            null,
            true, // skipEmail
            extendedData
        );

        console.log('Notification processing initiated.');
        console.log('Result:', result ? 'Success' : 'Failed');
    } catch (err) {
        console.error('Test Error:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

testComplaintSMS();
