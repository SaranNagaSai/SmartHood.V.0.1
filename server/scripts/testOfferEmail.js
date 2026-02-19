/**
 * Test script: Create a real Offer Service from Saran Naga Sai
 * and send it to all community members in his town (Gudivada) + his locality (Patimeeda)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Service = require('../models/Service');
const { generateServiceEmailTemplate, sendEmail } = require('../services/emailService');
const { routeNotifications } = require('../services/notificationService');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Fetch Saran Naga Sai
    const saran = await User.findOne({ email: 'sarannagasait@gmail.com' });
    if (!saran) {
        console.error('❌ User Saran Naga Sai not found!');
        process.exit(1);
    }
    console.log(`\n👤 Sender: ${saran.name} (${saran.uniqueId})`);
    console.log(`   Town: ${saran.town}, Locality: ${saran.locality}`);

    // 2. Create the test Offer service in DB
    const service = await Service.create({
        createdBy: saran._id,
        type: 'offer',
        title: 'Free Web Development Consultation',
        description: 'Hi Community! I am offering free web development consultation for anyone who needs help building websites or web applications. I can help with HTML, CSS, JavaScript, React, Node.js and more. Feel free to reach out!',
        targetAudience: 'ALL',
        locality: saran.locality,
        town: saran.town,
        district: saran.district,
        state: saran.state,
        status: 'active'
    });
    console.log(`\n📝 Service created: ${service._id}`);

    // 3. Find target users: all community members in Gudivada town
    const townRegex = new RegExp(`^\\s*${saran.town.trim()}\\s*$`, 'i');
    const targetUsers = await User.find({
        town: { $regex: townRegex },
        _id: { $ne: saran._id }
    });

    console.log(`\n🎯 Found ${targetUsers.length} recipients in ${saran.town}:`);
    targetUsers.forEach((u, i) => {
        console.log(`   ${i + 1}. ${u.name} (${u.uniqueId}) - ${u.locality} - ${u.email || 'No email'}`);
    });

    // 4. Store recipient IDs in sentTo
    service.sentTo = targetUsers.map(u => u._id);
    await service.save();
    console.log(`\n💾 Stored ${targetUsers.length} recipient IDs in service.sentTo`);

    // 5. Generate email HTML and send notifications
    const emailHtml = generateServiceEmailTemplate(service, saran, 'offer');

    console.log('\n📧 Sending notifications...');
    await routeNotifications(targetUsers, {
        title: 'New Service Offer',
        body: `${saran.name} posted: ${service.title}`,
        data: { url: `/service/${service._id}`, type: 'service' },
        emailHtml: emailHtml
    });

    // Summary
    const withEmail = targetUsers.filter(u => u.email);
    const withFCM = targetUsers.filter(u => u.fcmToken);
    console.log('\n✅ DONE! Summary:');
    console.log(`   Service ID: ${service._id}`);
    console.log(`   Total recipients: ${targetUsers.length}`);
    console.log(`   With email: ${withEmail.length}`);
    console.log(`   With FCM token: ${withFCM.length}`);

    await mongoose.disconnect();
    process.exit(0);
}

run().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
