require('dotenv').config();
const admin = require('./config/firebase');

async function testSimplePush() {
    console.log('Testing simple push auth...');
    try {
        // We don't even need a real token to test the JWT signature.
        // If the signature is invalid, it fails at the auth step before checking the token.
        // But we can use a dummy token to see if we get a "token not found" instead of "invalid signature".
        const message = {
            token: 'dummy-token-for-auth-test',
            notification: {
                title: 'Auth Test',
                body: 'Testing signature'
            }
        };
        
        console.log('Sending message (expecting registration-token error, not auth error)...');
        await admin.messaging().send(message);
    } catch (error) {
        console.log('Captured Error Code:', error.code);
        console.log('Captured Error Message:', error.message);
        
        if (error.message.includes('invalid_grant') || error.message.includes('Invalid JWT Signature')) {
            console.log('🔴 AUTH FAILED: Invalid JWT Signature');
        } else if (error.code === 'messaging/invalid-argument' || error.message.includes('registration-token')) {
            console.log('🟢 AUTH SUCCESS: (Got expected token error, which means auth worked!)');
        } else {
            console.log('🟡 UNKNOWN ERROR:', error.message);
        }
    }
}

testSimplePush();
