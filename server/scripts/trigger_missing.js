const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Service = require('../models/Service');
const { createNotification } = require('../controllers/notificationController');
const { generateServiceEmailTemplate } = require('../services/emailService');

dotenv.config();

async function trigger() {
    try {
        console.log('--- SmartHood Manual Notification Trigger ---');
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);

        const userUniqueId = process.argv[2] || 'XGA74';
        console.log(`Searching for User: ${userUniqueId}`);

        const user = await User.findOne({ uniqueId: userUniqueId.toUpperCase() });
        if (!user) {
            console.error('❌ User not found');
            process.exit(1);
        }

        const service = await Service.findOne({ createdBy: user._id }).sort({ createdAt: -1 });
        if (!service) {
            console.error('❌ No recent service/offer found for this user');
            process.exit(1);
        }

        console.log(`🚀 Found Latest Service: "${service.title}"`);
        console.log(`📡 Triggering notifications for ${service.sentTo.length} recipients...`);

        // 1. Send confirmation to creator (User XGA74)
        const creatorEmailHtml = generateServiceEmailTemplate(service, user, service.type, true);
        await createNotification(
            user._id,
            {
                title: 'Manual Re-Trigger: Your Offer is Live!',
                body: `We have re-sent the notifications for your offer "${service.title}".`
            },
            'service',
            `/service/${service._id}`,
            creatorEmailHtml,
            false,
            {
                workTitle: service.title,
                workInfo: service.description,
                senderName: user.name,
                senderPhone: user.phone
            }
        );

        console.log('✅ Process complete. Check your Render logs for delivery status.');
        process.exit(0);
    } catch (err) {
        console.error('💥 Critical Error:', err.message);
        process.exit(1);
    }
}

trigger();
