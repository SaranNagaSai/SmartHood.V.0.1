// List all Gudivada recipients with their email addresses
require('dotenv').config();
const mongoose = require('mongoose');

async function listRecipients() {
    await mongoose.connect(process.env.MONGODB_URI);
    const User = require('../models/User');

    const users = await User.find({
        town: { $regex: /^\s*Gudivada\s*$/i },
        _id: { $ne: '6981a63b1ddcf1b5b44c981c' } // exclude Saran
    }, 'name email locality phone');

    users.forEach((u, i) => {
        console.log(`${i + 1}. ${u.name}`);
        console.log(`   Email: ${u.email || 'NO EMAIL'}`);
        console.log(`   Locality: ${u.locality}`);
        console.log(`   Phone: ${u.phone}`);
        console.log('');
    });
    console.log(`Total: ${users.length}`);

    // Also check Brevo daily limit info
    console.log('\n--- Brevo Config ---');
    console.log(`EMAIL_HOST: ${process.env.EMAIL_HOST}`);
    console.log(`EMAIL_PORT: ${process.env.EMAIL_PORT}`);
    console.log(`EMAIL_USER: ${process.env.EMAIL_USER ? 'Present' : 'MISSING'}`);
    console.log(`EMAIL_FROM: ${process.env.EMAIL_FROM}`);

    await mongoose.disconnect();
    process.exit(0);
}

listRecipients().catch(err => { console.error(err); process.exit(1); });
