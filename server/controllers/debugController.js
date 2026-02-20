const { sendEmail } = require('../services/emailService');
const nodemailer = require('nodemailer');

// @desc    Test Email Configuration
// @route   GET /api/debug/email
// @access  Public (for debugging) - Secure this in production if needed
const testEmailConfig = async (req, res) => {
    try {
        const configReport = {
            host: process.env.EMAIL_HOST || 'N/A',
            port: process.env.EMAIL_PORT || 'N/A',
            user: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 3)}***` : 'MISSING',
            pass: process.env.EMAIL_PASSWORD ? 'PRESENT (Masked)' : 'MISSING',
            from: process.env.EMAIL_FROM || 'N/A'
        };

        console.log('[Debug] Testing SMTP Config on Server:', configReport);

        // 1. Create temporary transporter to test connection
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT),
            secure: parseInt(process.env.EMAIL_PORT) === 465,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        // 2. Verify Connection
        try {
            await transporter.verify();
            configReport.connection = 'SUCCESS';
        } catch (err) {
            configReport.connection = 'FAILED';
            configReport.error = err.message;
            return res.status(500).json({ message: 'SMTP Connection Failed', report: configReport });
        }

        // 3. Send Test Email (if email query param provided, otherwise to sender/default)
        const targetEmail = req.query.email || 'sarannagasait@gmail.com';
        const sendResult = await sendEmail(
            targetEmail,
            'SmartHood Debug: Server-side Test',
            'This is a test email triggered from the live server debug route. If you see this, sending works!',
            '<h3>Server Connectivity Test</h3><p>SMTP Check: <strong>PASSED</strong></p><p>Sent from: SmartHood Live Server</p>'
        );

        configReport.sendResult = sendResult;

        res.json({
            message: 'Email Debug Complete',
            report: configReport
        });

    } catch (error) {
        console.error('Debug Error:', error);
        res.status(500).json({ message: 'Debug Failed', error: error.message });
    }
};

module.exports = { testEmailConfig };
