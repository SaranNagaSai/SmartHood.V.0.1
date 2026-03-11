require('dotenv').config();

const cleanKey = (key) => {
    if (!key) return undefined;
    let cleaned = key.replace(/^["']|["']$/g, '');
    cleaned = cleaned.replace(/\\n/g, '\n');
    if (!cleaned.includes('-----BEGIN PRIVATE KEY-----')) {
        cleaned = `-----BEGIN PRIVATE KEY-----\n${cleaned}\n-----END PRIVATE KEY-----`;
    }
    return cleaned;
};

const raw = process.env.FIREBASE_PRIVATE_KEY;
const cleaned = cleanKey(raw);

console.log('Raw exists:', !!raw);
console.log('Raw start:', raw ? raw.substring(0, 30) : 'N/A');
console.log('Cleaned start:', cleaned ? cleaned.substring(0, 30) : 'N/A');
console.log('Cleaned end:', cleaned ? cleaned.substring(cleaned.length - 30) : 'N/A');
console.log('Contains newline:', cleaned ? cleaned.includes('\n') : false);
