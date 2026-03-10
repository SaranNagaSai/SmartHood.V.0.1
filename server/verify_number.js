const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const twilio = require('twilio');
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = twilio(accountSid, authToken);

async function requestVerification() {
    const phone = process.argv[2];
    if (!phone) {
        console.log('Usage: node verify_number.js +91XXXXXXXXXX');
        process.exit(1);
    }

    try {
        console.log(`Requesting verification for ${phone}...`);
        const request = await client.validationRequests.create({
            friendlyName: 'SmartHood Beta Tester',
            phoneNumber: phone
        });
        console.log(`Success! A call is being placed to ${phone}.`);
        console.log(`--- IMPORTANT: YOU MUST ENTER THIS CODE ON THE CALL: ${request.validationCode} ---`);
    } catch (err) {
        console.error('Error:', err.message);
    }
    process.exit(0);
}

requestVerification();
