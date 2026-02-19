/**
 * Diagnostic: Send a real alert email to each Gudivada recipient
 * This skips the notification pipeline and tests email delivery directly
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const { sendEmail, generateAlertEmailTemplate } = require('../services/emailService');

async function testAlertEmails() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find Saran
    const saran = await User.findOne({ email: 'sarannagasait@gmail.com' });
    console.log(`Sender: ${saran.name} | ${saran.town} | ${saran.locality}\n`);

    // Find Gudivada recipients (excluding Saran)
    const recipients = await User.find({
        town: { $regex: /^\s*Gudivada\s*$/i },
        _id: { $ne: saran._id }
    });

    console.log(`Found ${recipients.length} recipients:\n`);

    // Create a fake alert object for the template
    const fakeAlert = {
        category: 'Welfare',
        subType: 'General',
        description: 'This is a test alert from SmartHood to verify email delivery to all community members in Gudivada. If you received this, the email system is working correctly!',
        locality: saran.locality,
        town: saran.town,
        district: saran.district,
        state: saran.state
    };

    // Generate the alert email HTML
    const emailHtml = generateAlertEmailTemplate(fakeAlert, saran);

    // Send to EACH recipient individually and log success/failure
    for (let i = 0; i < recipients.length; i++) {
        const user = recipients[i];
        console.log(`--- Recipient ${i + 1}/${recipients.length} ---`);
        console.log(`  Name: ${user.name}`);
        console.log(`  Email: ${user.email || 'NONE'}`);
        console.log(`  Locality: ${user.locality}`);

        if (!user.email) {
            console.log(`  SKIPPED: No email address\n`);
            continue;
        }

        try {
            const result = await sendEmail(
                user.email,
                'ALERT: Welfare - General',
                fakeAlert.description,
                emailHtml
            );
            console.log(`  Result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
            if (!result.success) {
                console.log(`  Reason: ${result.reason}`);
                console.log(`  Error: ${result.error || 'N/A'}`);
            }
            if (result.messageId) {
                console.log(`  MessageId: ${result.messageId}`);
            }
        } catch (err) {
            console.log(`  EXCEPTION: ${err.message}`);
        }
        console.log('');
    }

    console.log('DONE');
    await mongoose.disconnect();
    process.exit(0);
}

testAlertEmails().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
