const admin = require('firebase-admin');

async function testJson() {
    try {
        const serviceAccount = require('./firebase-debug-sa.json');
        
        if (admin.apps.length === 0) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        }
        
        console.log('Sending test message using JSON SA...');
        await admin.messaging().send({
            token: 'dummy',
            notification: { title: 'json test', body: 'testing' }
        });
    } catch (err) {
        console.log('Error:', err.message);
        if (err.message.includes('invalid_grant')) {
            console.log('🔴 STILL FAILED: Invalid JWT Signature');
        } else if (err.code === 'messaging/invalid-argument') {
            console.log('🟢 SUCCESS: JSON SA Auth worked!');
        }
    }
}

testJson().then(() => process.exit());
