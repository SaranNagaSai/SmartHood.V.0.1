const { MongoClient } = require('mongodb');
require('dotenv').config({ path: 'server/.env' });

async function run() {
    console.log('--- Database Cleanup Started ---');
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        const db = client.db('smarthood');

        // 1. Update Notifications
        const notifCol = db.collection('notifications');
        const teluguName = 'సాయి కిరణ్'; // Telugu for sai kiran
        const correctName = 'Thiriveedhi Saran Naga Sai';

        console.log(`• Correcting notifications containing [${teluguName}]...`);
        const result = await notifCol.updateMany(
            { body: { $regex: teluguName } },
            [
                { $set: { body: { $replaceOne: { input: "$body", find: teluguName, replacement: correctName } } } }
            ]
        );
        console.log(`• Updated ${result.modifiedCount} notifications.`);

    } finally {
        await client.close();
        process.exit(0);
    }
}

run();
