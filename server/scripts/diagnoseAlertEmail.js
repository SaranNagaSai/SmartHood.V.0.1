// Quick diagnostic: test email delivery for alert recipients
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const { sendEmail } = require('../services/emailService');

async function diagnose() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find Gudivada users (excluding Saran)
    const users = await User.find({
        town: { $regex: /^\s*Gudivada\s*$/i },
        _id: { $ne: '6981a63b1ddcf1b5b44c981c' }
    }, 'name email uniqueId locality');

    console.log('=== GUDIVADA RECIPIENTS ===');
    users.forEach((u, i) => {
        console.log(`${i + 1}. ${u.name} | Email: ${u.email || 'NONE'} | Locality: ${u.locality} | ID: ${u.uniqueId}`);
    });
    console.log(`Total: ${users.length}\n`);

    // Test direct email to Saran
    console.log('=== TESTING DIRECT EMAIL TO sarannagasait@gmail.com ===');
    const result = await sendEmail(
        'sarannagasait@gmail.com',
        'SmartHood Alert Delivery Test',
        'This is a diagnostic test to verify email delivery is working.',
        '<div style="padding:20px;font-family:Arial"><h2>Email Delivery Test</h2><p>If you receive this, the SMTP pipeline is working correctly.</p><p style="color:green;font-weight:bold">SUCCESS</p></div>'
    );
    console.log('Send result:', JSON.stringify(result, null, 2));

    await mongoose.disconnect();
    process.exit(0);
}

diagnose().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
