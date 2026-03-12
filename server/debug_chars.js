require('dotenv').config();
const key = process.env.FIREBASE_PRIVATE_KEY;
console.log('Raw Env Length:', key?.length);
console.log('Raw Env Starts With Quoted Header:', key?.startsWith('"-----BEGIN'));

const cleanKey = (key) => {
    if (!key) return undefined;
    let cleaned = key.trim();
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
        cleaned = cleaned.substring(1, cleaned.length - 1);
    }
    const hadLiterals = cleaned.includes('\\n');
    cleaned = cleaned.replace(/\\n/g, '\n');
    return { cleaned, hadLiterals };
};

const { cleaned, hadLiterals } = cleanKey(key);
console.log('Cleaned Length:', cleaned?.length);
console.log('Had \\n literals:', hadLiterals);
console.log('First 5 characters byte codes:');
for (let i = 0; i < 5; i++) {
    console.log(`char ${i}: ${cleaned.charCodeAt(i)} ('${cleaned[i]}')`);
}

// Check for \r (carriage return)
console.log('Contains \\r:', cleaned.includes('\r'));
if (cleaned.includes('\r')) {
    console.log('Removing \\r...');
    const fixed = cleaned.replace(/\r/g, '');
    console.log('Fixed Length:', fixed.length);
}
