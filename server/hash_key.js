const crypto = require('crypto');
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

const key = process.env.FIREBASE_PRIVATE_KEY;
const cleaned = cleanKey(key);

if (cleaned) {
    const hash = crypto.createHash('sha256').update(cleaned).digest('hex');
    console.log('Key Hash (SHA256):', hash);
    console.log('Markers present:', cleaned.includes('-----BEGIN PRIVATE KEY-----') && cleaned.includes('-----END PRIVATE KEY-----'));
    console.log('Lines:', cleaned.split('\n').length);
} else {
    console.log('No key found');
}
