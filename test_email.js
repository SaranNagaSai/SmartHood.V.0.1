const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, 'server/.env') });

const { sendEmail } = require('./server/services/emailService');

const testEmail = async () => {
    console.log('Testing email sending...');
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
    console.log('EMAIL_PORT:', process.env.EMAIL_PORT);

    const result = await sendEmail(
        'sarannagasait@gmail.com',
        'Test Email from SmartHood Debugger (Port 587)',
        'If you receive this, the email service is working correctly on port 587.'
    );

    console.log('Result:', result);
    process.exit(result.success ? 0 : 1);
};

testEmail();
