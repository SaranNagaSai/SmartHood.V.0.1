const mongoose = require('mongoose');
const Notification = require('./models/Notification');
const User = require('./models/User');
require('dotenv').config();

async function checkNotifications() {
    await mongoose.connect(process.env.MONGODB_URI);
    const nagSai = await User.findOne({ phone: '9398176717' });
    if (!nagSai) {
        console.log('Nag Sai not found');
        return;
    }

    const notifications = await Notification.find({ userId: nagSai._id })
        .sort({ createdAt: -1 })
        .limit(10);

    console.log(`Notifications for ${nagSai.name}:`, notifications.map(n => ({
        title: n.title,
        type: n.type,
        delivered: n.delivered,
        method: n.deliveryMethod,
        at: n.createdAt
    })));
    await mongoose.disconnect();
}

checkNotifications();
