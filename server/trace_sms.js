const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function checkStatus() {
    const to = '+919398176717';
    console.log(`Sending check message to ${to}...`);
    const msg = await client.messages.create({
        body: "SmartHood Status Check: " + new Date().toISOString(),
        from: process.env.TWILIO_PHONE_NUMBER,
        to: to
    });
    console.log(`SID: ${msg.sid}, Initial Status: ${msg.status}`);

    // Wait and poll status 3 times
    for (let i = 0; i < 5; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const updatedMsg = await client.messages(msg.sid).fetch();
        console.log(`Polling ${i + 1}: Status = ${updatedMsg.status} ${updatedMsg.errorMessage ? '- Error: ' + updatedMsg.errorMessage : ''}`);
        if (['delivered', 'failed', 'undelivered'].includes(updatedMsg.status)) break;
    }
    process.exit(0);
}

checkStatus();
