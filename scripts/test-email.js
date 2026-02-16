const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../server/.env') });

const testEmail = async () => {
    console.log('--- SMTP Test Started ---');
    console.log('Host:', process.env.EMAIL_HOST || 'smtp-relay.brevo.com');
    console.log('Port:', process.env.EMAIL_PORT || 465);
    console.log('User:', process.env.EMAIL_USER);

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
        port: parseInt(process.env.EMAIL_PORT) || 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    try {
        console.log('Verifying connection...');
        await transporter.verify();
        console.log('✅ SMTP Connection Successful!');

        console.log('Sending test email...');
        const info = await transporter.sendMail({
            from: `"SmartHood Test" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // Send to self
            subject: 'SmartHood SMTP Test',
            text: 'If you are reading this, your email configuration is working perfectly!',
            html: '<h1>✅ Email Test Successful!</h1><p>Your SmartHood email service is now correctly configured.</p>'
        });

        console.log('✅ Test Email Sent! Message ID:', info.messageId);
        console.log('Check your inbox at:', process.env.EMAIL_USER);
    } catch (error) {
        console.error('❌ SMTP Test Failed');
        console.error('Error Detail:', error);
    }
};

testEmail();
