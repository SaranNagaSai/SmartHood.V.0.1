const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const twilioService = require('./utils/twilioService');

async function testSimpleSMS() {
    const testPhone = '9398176717';
    const message = "SmartHood: Test simple message at " + new Date().toLocaleTimeString();
    console.log(`Sending to ${testPhone}: "${message}"`);
    const result = await twilioService.sendDirectSMS(testPhone, message);
    console.log('Result:', result);
    process.exit(0);
}

testSimpleSMS();
