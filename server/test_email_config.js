const dotenv = require('dotenv');
const { sendEmail } = require('./services/emailService');

dotenv.config();

const testEmail = async () => {
    console.log('--- Email Diagnostic Started ---');
    console.log('Check Environment Variables:');
    console.log('EMAIL_HOST:', process.env.EMAIL_HOST || 'smtp-relay.brevo.com (default)');
    console.log('EMAIL_PORT:', process.env.EMAIL_PORT || '587 (default)');
    console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'MISSING');
    console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'Set' : 'MISSING');
    console.log('--------------------------------');

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.error('ERROR: Email credentials missing in .env file.');
        process.exit(1);
    }

    const recipient = process.env.EMAIL_USER; // Send to self for testing
    console.log(`Attempting to send test email to: ${recipient}`);

    const result = await sendEmail(
        recipient,
        'Diagnostic Test Email',
        'This is a test email from the SmartHood diagnostic script to verify SMTP configuration.',
        '<h1>SmartHood Diagnostic</h1><p>This is a test email to verify your SMTP configuration is working correctly.</p>'
    );

    if (result.success) {
        console.log('SUCCESS: Diagnostic email sent successfully.');
        console.log('MessageId:', result.messageId);
    } else {
        console.log('FAILED: Could not send diagnostic email.');
        console.log('Reason:', result.reason || 'Unknown');
        console.log('Error:', result.error);
    }
    console.log('--- Diagnostic Finished ---');
};

testEmail();
