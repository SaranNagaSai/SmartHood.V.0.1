const admin = require('firebase-admin');
require('dotenv').config();

const clean = (val) => val ? val.trim().replace(/^"|"$/g, '') : undefined;

const projectId = clean(process.env.FIREBASE_PROJECT_ID);
const clientEmail = clean(process.env.FIREBASE_CLIENT_EMAIL);
const privateKey = process.env.FIREBASE_PRIVATE_KEY 
    ? process.env.FIREBASE_PRIVATE_KEY.trim().replace(/^"|"$/g, '').replace(/\\n/g, '\n')
    : undefined;

console.log('Project ID:', `'${projectId}'`);
console.log('Client Email:', `'${clientEmail}'`);
console.log('Private Key Start:', privateKey?.substring(0, 30));

if (!projectId || !clientEmail || !privateKey) {
    console.error('Missing config');
    process.exit(1);
}

const sa = {
    projectId,
    clientEmail,
    privateKey
};

try {
    if (admin.apps.length === 0) {
        admin.initializeApp({
            credential: admin.credential.cert(sa)
        });
    }
    console.log('Firebase Init Success');
    
    // Try to send a message to a dummy token to trigger auth validation
    console.log('Sending test message...');
    const res = await admin.messaging().send({
        token: 'dummy-token-for-auth-test',
        notification: { title: 'test', body: 'test' }
    });
    console.log('Success:', res);
} catch (err) {
    if (err.message.includes('invalid_grant') || err.message.includes('Invalid JWT Signature')) {
        console.log('🔴 AUTH FAILED: Invalid JWT Signature');
    } else if (err.code === 'messaging/invalid-argument' || err.message.includes('registration-token')) {
        console.log('🟢 AUTH SUCCESS (JWT accepted, token rejected as expected)');
    } else {
        console.log('🟡 Other Error:', err.message);
        console.log('Error Code:', err.code);
    }
} finally {
    process.exit();
}

