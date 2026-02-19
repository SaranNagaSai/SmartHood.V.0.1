const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const { sendEmail } = require('../services/emailService');

const testRealEmail = async () => {
    try {
        const testTarget = "renukapaleti27@gmail.com"; // One from the DB
        console.log(`--- Testing Real Email Delivery to ${testTarget} ---`);
        console.log(`Using EMAIL_USER: ${process.env.EMAIL_USER}`);

        const result = await sendEmail(
            testTarget,
            "SmartHood Connection Test",
            "This is a diagnostic test from the SmartHood development team to verify the notification system."
        );

        if (result.success) {
            console.log("SUCCESS: Email sent successfully.");
            console.log("MessageId:", result.messageId);
        } else {
            console.error("FAILURE: Email failed to send.");
            console.error("Reason:", result.reason);
            console.error("Error Message:", result.error);
        }

    } catch (error) {
        console.error('Critical Error:', error);
    } finally {
        process.exit(0);
    }
};

testRealEmail();
