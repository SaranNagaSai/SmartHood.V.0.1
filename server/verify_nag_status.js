const mongoose = require('mongoose');
const Alert = require('./models/Alert');
const User = require('./models/User');
require('dotenv').config();

async function checkAdminStatus() {
    await mongoose.connect(process.env.MONGODB_URI);

    const nagSai = await User.findOne({ phone: '9398176717' });
    if (!nagSai) {
        console.log('Nag Sai not found');
        return;
    }

    const nagId = nagSai._id.toString();
    console.log(`Nag Sai ID: ${nagId}`);

    const alerts = await Alert.find().sort({ createdAt: -1 }).limit(5);
    console.log(`Checking ${alerts.length} recent alerts:`);

    alerts.forEach((a, i) => {
        const inSentTo = a.sentTo.map(id => id.toString()).includes(nagId);
        console.log(`Alert ${i + 1}: ${a.category} (${a.subType}) at ${a.createdAt}`);
        console.log(` - SentTo Count: ${a.sentTo.length}`);
        console.log(` - Nag Sai included? ${inSentTo ? '✅ YES' : '❌ NO'}`);
    });

    await mongoose.disconnect();
}

checkAdminStatus();
