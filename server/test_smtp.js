const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config({ path: 'c:/Users/saran/OneDrive/Documents/SmartHood.V.0.1/server/.env' });

async function testSmtp() {
    console.log('--- SMTP TEST START ---');
    console.log('Host:', process.env.EMAIL_HOST);
    console.log('Port:', process.env.EMAIL_PORT);
    console.log('User:', process.env.EMAIL_USER);

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
        port: parseInt(process.env.EMAIL_PORT) || 2525,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    try {
        const info = await transporter.sendMail({
            from: '"SmartHood Test" <smarthoodc03@gmail.com>',
            to: 'sarannagasait@gmail.com', // Your verified email
            subject: 'Manual SMTP Connection Test',
            text: 'If you receive this, your SMTP server is configured correctly and the network is open.'
        });
        console.log('✅ Success! Message ID:', info.messageId);
    } catch (err) {
        console.error('❌ Failed:', err.message);
    }
}

testSmtp();
