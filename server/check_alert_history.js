const mongoose = require('mongoose');
const Alert = require('./models/Alert');
const User = require('./models/User');
require('dotenv').config();

async function checkAlertHistory() {
    await mongoose.connect(process.env.MONGODB_URI);
    const alerts = await Alert.find().sort({ createdAt: -1 }).limit(3).populate('senderId', 'name').populate('sentTo', 'name isAdmin town');

    console.log('--- RECENT ALERT BROADCASTS ---');
    for (const a of alerts) {
        console.log(`\n📢 Alert: ${a.category} - ${a.subType}`);
        console.log(`👤 From: ${a.senderId?.name || 'Someone'}`);
        console.log(`📍 Locality: ${a.locality}`);
        console.log(`⏰ Time: ${a.createdAt}`);
        console.log(`👥 Sent To (${a.sentTo.length} users):`);
        a.sentTo.forEach(u => {
            console.log(`  - ${u.name} (Admin: ${u.isAdmin}, Town: ${u.town})`);
        });
    }
    console.log('--- END ---');
    await mongoose.disconnect();
}

checkAlertHistory();
