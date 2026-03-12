const { GoogleAuth } = require('google-auth-library');
require('dotenv').config();

const cleanKey = (key) => {
    if (!key) return undefined;
    let cleaned = key.replace(/^["']|["']$/g, '').trim();
    cleaned = cleaned.replace(/\\n/g, '\n');
    cleaned = cleaned.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n');
    return cleaned;
};

async function testAuth() {
    const key = process.env.FIREBASE_PRIVATE_KEY;
    const cleaned = cleanKey(key);
    
    const sa = {
        project_id: process.env.FIREBASE_PROJECT_ID,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        private_key: cleaned
    };

    console.log('Testing auth with SUPER CLEAN key...');
    
    try {
        const auth = new GoogleAuth({
            credentials: sa,
            scopes: ['https://www.googleapis.com/auth/firebase.messaging']
        });
        const client = await auth.getClient();
        await client.getAccessToken();
        console.log('✅ SUCCESS! Super clean key worked.');
    } catch (err) {
        console.error('❌ FAILURE:', err.message);
    }
}

testAuth();
