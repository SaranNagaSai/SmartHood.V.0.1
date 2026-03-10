const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const twilioService = require('./utils/twilioService');

async function testSMS() {
    const testPhone = '9398176717'; // From the manual_test.js
    console.log(`Attempting to send test SMS to ${testPhone}...`);
    const result = await twilioService.sendDirectSMS(testPhone, 'SmartHood: This is a direct test of the SMS delivery system.');
    console.log('Result:', result);
    process.exit(0);
}

testSMS();
