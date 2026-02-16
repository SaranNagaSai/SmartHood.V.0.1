const mongoose = require('mongoose');
const User = require('./server/models/User');

async function checkTowns() {
    try {
        await mongoose.connect('mongodb://localhost:27017/smarthood');
        console.log('Connected to MongoDB');

        // Get total user count
        const userCount = await User.countDocuments();
        console.log(`\nTotal users in database: ${userCount}`);

        // Get distinct towns
        const towns = await User.distinct('town');
        console.log(`\nDistinct towns (${towns.length}):`);
        console.log(JSON.stringify(towns, null, 2));

        // Get sample users with their towns
        const sampleUsers = await User.find({}, 'name town locality').limit(10);
        console.log(`\nSample users:`);
        sampleUsers.forEach(user => {
            console.log(`  - ${user.name}: ${user.town} / ${user.locality}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkTowns();
