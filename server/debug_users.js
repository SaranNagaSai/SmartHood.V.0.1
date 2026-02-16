const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config(); // Load .env from current dir

const runDebug = async () => {
    try {
        const uri = "mongodb+srv://sarannagasait_db_user:GfYeLLv5r2ZJnlBm@cluster0.ak4hxrn.mongodb.net/smarthood?retryWrites=true&w=majority&appName=Cluster0";
        if (!uri) {
            console.error("MONGO_URI is undefined!");
            process.exit(1);
        }
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Connected');

        console.log("--- DEBUG: ALL USERS ---");
        const users = await User.find({}, 'name town locality email professionCategory professionDetails');

        const fs = require('fs');
        let output = "--- DEBUG: ALL USERS ---\n";

        // Group by Town
        const townGroups = {};
        users.forEach(u => {
            const t = u.town ? `"${u.town}"` : "NULL";
            if (!townGroups[t]) townGroups[t] = [];
            townGroups[t].push(u.locality);
        });

        for (const [town, locs] of Object.entries(townGroups)) {
            const uniqueLocs = [...new Set(locs)];
            output += `Town: ${town}\n`;
            output += `  Count: ${locs.length}\n`; // Total users in this town group
            // List users with professions in this town
            users.filter(u => (u.town ? `"${u.town}"` : "NULL") === town).forEach(u => {
                output += `    - ${u.name} (${u.locality}): ${u.professionCategory} / ${u.professionDetails?.jobRole || u.professionDetails?.description}\n`;
            });
            output += '-----------------------------------\n';
        }

        output += "--- DEBUG END ---";
        fs.writeFileSync('debug_output.txt', output);
        console.log("Debug output written to debug_output.txt");
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

runDebug();
