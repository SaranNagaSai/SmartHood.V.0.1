const jwt = require('jsonwebtoken');
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

const privateKey = cleanKey(process.env.FIREBASE_PRIVATE_KEY);
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

if (!privateKey || !clientEmail) {
    console.error('Missing key or email');
    process.exit(1);
}

const payload = {
    iss: clientEmail,
    sub: clientEmail,
    aud: "https://oauth2.googleapis.com/token",
    iat: Math.floor(Date.now() / 1000) - 60,
    exp: Math.floor(Date.now() / 1000) + 3600
};

try {
    const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });
    console.log('✅ JWT Signing successful!');
    console.log('Token starts with:', token.substring(0, 20));
} catch (err) {
    console.error('❌ JWT Signing failed!');
    console.error(err.message);
}
