const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function simulateBroadcast() {
    await mongoose.connect(process.env.MONGODB_URI);

    // Simulate User A (the neighbor) posting an alert in Gudivada
    const senderTown = "Gudivada";
    const townRegex = new RegExp(`^\\s*${senderTown.trim()}\\s*$`, 'i');

    // Logic from alertController.js
    const query = {
        $or: [
            { town: { $regex: townRegex } },
            { isAdmin: true }
        ],
        // Assume sender ID is different from Nag Sai
        _id: { $ne: new mongoose.Types.ObjectId() }
    };

    const targetUsers = await User.find(query);
    console.log(`Found ${targetUsers.length} targets for alert in ${senderTown}:`);
    targetUsers.forEach(u => {
        console.log(` - ${u.name} (Admin: ${u.isAdmin}, Town: ${u.town})`);
    });

    await mongoose.disconnect();
}

simulateBroadcast();
