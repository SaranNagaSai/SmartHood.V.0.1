const { MongoClient } = require('mongodb');
require('dotenv').config({ path: 'server/.env' });

async function run() {
    console.log('--- User Language Stats ---');
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        const db = client.db('smarthood');
        const stats = await db.collection('users').aggregate([
            { $group: { _id: '$language', count: { $sum: 1 } } }
        ]).toArray();
        console.log(JSON.stringify(stats, null, 2));
    } finally {
        await client.close();
        process.exit(0);
    }
}

run();
