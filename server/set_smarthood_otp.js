const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const twilio = require('twilio');
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

const client = twilio(accountSid, authToken);

async function setSmartHoodBranding() {
    try {
        console.log(`Setting branding for Verify Service: ${verifyServiceSid}...`);
        const service = await client.verify.v2.services(verifyServiceSid)
            .update({ friendlyName: 'SmartHood' });
        console.log('Success! OTP Header will now display:', service.friendlyName);
    } catch (err) {
        console.error('Error:', err.message);
    }
    process.exit(0);
}

setSmartHoodBranding();
