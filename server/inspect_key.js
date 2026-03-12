require('dotenv').config();
const key = process.env.FIREBASE_PRIVATE_KEY;

console.log('Key length:', key.length);
console.log('Chars 24-30:');
for (let i = 24; i < 31; i++) {
    console.log(`${i}: ${key.charCodeAt(i)} ('${key[i]}')`);
}

const cleaned = key.replace(/\\n/g, '\n');
console.log('Cleaned length:', cleaned.length);
