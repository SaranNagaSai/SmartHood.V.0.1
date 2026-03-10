const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const twilioService = require('./utils/twilioService');

async function debugDelivery() {
    const testPhone = '9398176717';
    const message = "[SmartHood] Testing direct delivery from regular phone number context.";
    console.log(`🔍 DEBUG: Starting delivery to ${testPhone}...`);
    console.log(`📱 Using FROM Number: ${process.env.TWILIO_PHONE_NUMBER}`);

    try {
        const result = await twilioService.sendDirectSMS(testPhone, message);
        console.log('✅ Result:', JSON.stringify(result, null, 2));
    } catch (e) {
        console.error('❌ Crash details:', e);
    }
    process.exit(0);
}

debugDelivery();
