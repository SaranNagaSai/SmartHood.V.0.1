const mongoose = require('mongoose');
const User = require('./server/models/User'); // Adjust path as needed
const dotenv = require('dotenv');

dotenv.config({ path: './server/.env' });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Connected');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const runDebug = async () => {
    await connectDB();

    console.log("--- DEBUG: ALL USERS ---");
    const users = await User.find({}, 'name town locality email');

    // Group by Town
    const townGroups = {};
    users.forEach(u => {
        const t = u.town ? `"${u.town}"` : "NULL";
        if (!townGroups[t]) townGroups[t] = [];
        townGroups[t].push(u.locality);
    });

    for (const [town, locs] of Object.entries(townGroups)) {
        console.log(`Town: ${town}`);
        console.log(`  Localities (${locs.length}): ${locs.join(', ')}`);
        console.log('-----------------------------------');
    }

    console.log("--- DEBUG END ---");
    process.exit();
};

runDebug();
