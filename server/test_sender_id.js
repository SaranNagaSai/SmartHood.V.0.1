const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const twilioService = require('./utils/twilioService');

async function testSenderID() {
    const testPhone = '9398176717';
    const message = "SmartHood: Testing Alphanumeric Sender ID delivery.";
    console.log(`Sending to ${testPhone} using Sender ID: ${process.env.TWILIO_SENDER_ID || 'None'}`);
    const result = await twilioService.sendDirectSMS(testPhone, message);
    console.log('Result:', result);
    process.exit(0);
}

testSenderID();
