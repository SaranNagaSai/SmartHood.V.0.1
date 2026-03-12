require('dotenv').config();
const key = process.env.FIREBASE_PRIVATE_KEY;

if (!key) {
    console.log('FIREBASE_PRIVATE_KEY is missing');
    process.exit(1);
}

console.log('Key length:', key.length);
console.log('Key escaped start:', JSON.stringify(key.substring(0, 50)));
console.log('Key escaped end:', JSON.stringify(key.substring(key.length - 50)));

const cleanKey = (key) => {
    if (!key) return undefined;
    let cleaned = key.trim();
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
        cleaned = cleaned.substring(1, cleaned.length - 1);
    }
    cleaned = cleaned.replace(/\\n/g, '\n');
    return cleaned;
};

const cleaned = cleanKey(key);
console.log('Cleaned length:', cleaned.length);
console.log('Cleaned contains \\n:', cleaned.includes('\n'));
console.log('Cleaned starts with:', JSON.stringify(cleaned.substring(0, 50)));
console.log('Cleaned ends with:', JSON.stringify(cleaned.substring(cleaned.length - 50)));

if (!cleaned.includes('-----BEGIN PRIVATE KEY-----')) {
    console.log('ERROR: MISSING BEGIN MARKER');
}
if (!cleaned.includes('-----END PRIVATE KEY-----')) {
    console.log('ERROR: MISSING END MARKER');
}

const lines = cleaned.split('\n');
console.log('Line count:', lines.length);
for (let i = 0; i < lines.length; i++) {
    console.log(`Line ${i} length: ${lines[i].length}`);
}
