const { GoogleAuth } = require('google-auth-library');
require('dotenv').config();

const cleanKey = (key) => {
    if (!key) return undefined;
    let cleaned = key.trim();
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
        cleaned = cleaned.substring(1, cleaned.length - 1);
    }
    cleaned = cleaned.replace(/\\n/g, '\n');
    return cleaned;
};

async function testAuth() {
    const sa = {
        project_id: process.env.FIREBASE_PROJECT_ID,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        private_key: cleanKey(process.env.FIREBASE_PRIVATE_KEY)
    };

    console.log('Testing auth for:', sa.client_email);
    
    try {
        const auth = new GoogleAuth({
            credentials: sa,
            scopes: ['https://www.googleapis.com/auth/firebase.messaging']
        });
        
        const client = await auth.getClient();
        console.log('Client obtained.');
        const token = await client.getAccessToken();
        console.log('Success! Token obtained:', token.token.substring(0, 20) + '...');
    } catch (err) {
        console.error('Auth failure:', err.message);
        if (err.stack) console.error(err.stack);
    }
}

testAuth();
