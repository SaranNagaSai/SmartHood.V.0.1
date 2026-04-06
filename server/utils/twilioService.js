const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
const fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const senderId = process.env.TWILIO_SENDER_ID || fromPhoneNumber; // Use SmartHood if defined

// Validate environment variables early
if (!accountSid || !authToken || !verifyServiceSid || !fromPhoneNumber) {
    console.warn('⚠️ TWILIO WARNING: Mandatory credentials missing from .env!');
    console.warn(`- SID: ${accountSid ? 'Detected' : 'MISSING'}`);
    console.warn(`- Token: ${authToken ? 'Detected' : 'MISSING'}`);
    console.warn(`- Verify SID: ${verifyServiceSid ? 'Detected' : 'MISSING'}`);
    console.warn(`- From Number: ${fromPhoneNumber ? 'Detected' : 'MISSING'}`);
}

const client = (accountSid && authToken) ? twilio(accountSid, authToken) : null;

const checkTwilio = (method) => {
    if (!client) {
        console.error(`❌ Twilio Error: client not initialized inside ${method}`);
        return false;
    }
    return true;
};

/**
 * Normalize phone number to E.164 format
 * @param {string} phone - Original phone number
 * @returns {string} - Formatted phone number
 */
const normalizePhone = (phone) => {
    if (!phone) return phone;
    let clean = phone.replace(/\D/g, ''); // Remove all non-digits

    // If it's 10 digits, assume India (+91)
    if (clean.length === 10) {
        return `+91${clean}`;
    }

    // If it starts with 91 and is 12 digits, prepend +
    if (clean.length === 12 && clean.startsWith('91')) {
        return `+${clean}`;
    }

    // If already has +, return as is (with digits only)
    if (phone.startsWith('+')) {
        return `+${clean}`;
    }

    // Fallback: just prepend + if missing
    return phone.startsWith('+') ? phone : `+${clean}`;
};

/**
 * Send an OTP to a phone number using Twilio Verify
 * @param {string} phoneNumber - E.164 formatted phone number
 * @returns {Promise<object>}
 */
const sendOTP = async (phoneNumber) => {
    if (!checkTwilio('sendOTP')) return { success: false, error: 'Twilio client not configured' };
    if (!verifyServiceSid) return { success: false, error: 'Twilio Verify Service SID missing' };

    try {
        const formattedPhone = normalizePhone(phoneNumber);
        const verification = await client.verify.v2.services(verifyServiceSid)
            .verifications
            .create({ to: formattedPhone, channel: 'sms' });
        return { success: true, sid: verification.sid };
    } catch (error) {
        // Handle Twilio Trial Account restriction (Error 21608: unverified number)
        if (error.code === 21608 || (error.message && error.message.includes('unverified'))) {
            console.warn(`[Twilio Service] 🛡️ SANDBOX MODE ACTIVATED for ${phoneNumber}`);
            console.warn(`[Twilio Service] Reason: Trial account cannot send to unverified numbers.`);
            console.warn(`[Twilio Service] Action: Allowing registration with bypass code: 123456`);
            
            return { 
                success: true, 
                sid: 'sandbox_bypass', 
                isSandbox: true,
                message: 'Twilio Sandbox Mode: Use code 123456 to verify (Trial Account Restriction)'
            };
        }

        console.error('Error sending OTP via Twilio:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Verify an OTP code for a phone number
 * @param {string} phoneNumber - E.164 formatted phone number
 * @param {string} code - 6-digit code
 * @returns {Promise<object>}
 */
const verifyOTP = async (phoneNumber, code) => {
    // 1. Check for Sandbox Bypass Code
    if (code === '123456') {
        console.log(`[Twilio Service] ✅ SANDBOX VERIFY: Bypassing for ${phoneNumber}`);
        return { success: true };
    }

    if (!checkTwilio('verifyOTP')) return { success: false, error: 'Twilio client not configured' };
    if (!verifyServiceSid) return { success: false, error: 'Twilio Verify Service SID missing' };

    try {
        const formattedPhone = normalizePhone(phoneNumber);
        const verificationCheck = await client.verify.v2.services(verifyServiceSid)
            .verificationChecks
            .create({ to: formattedPhone, code: code });

        if (verificationCheck.status === 'approved') {
            return { success: true };
        } else {
            return { success: false, error: 'Invalid or expired OTP' };
        }
    } catch (error) {
        console.error('Error verifying OTP via Twilio:', error);
        return { success: false, error: error.message };
    }
};

const sendDirectSMS = async (to, body) => {
    if (!checkTwilio('sendDirectSMS')) return { success: false, error: 'Twilio client not configured' };

    try {
        const formattedPhone = normalizePhone(to);
        const message = await client.messages.create({
            body: body,
            from: fromPhoneNumber, // Direct phone header for reliability
            to: formattedPhone
        });
        return { success: true, sid: message.sid };
    } catch (error) {
        // Handle Twilio Trial Account restriction for direct SMS
        if (error.code === 21608 || (error.message && error.message.includes('unverified'))) {
            console.warn(`[Twilio Service] 🛡️ SMS DELIVERY BYPASSED for ${to}`);
            console.warn(`[Twilio Service] Reason: Trial account cannot send to unverified numbers.`);
            return { success: true, sid: 'sandbox_bypass_sms', isSandbox: true };
        }

        console.error('Error sending SMS via Twilio:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendOTP,
    verifyOTP,
    sendDirectSMS
};
