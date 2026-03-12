require('dotenv').config();
const key = process.env.FIREBASE_PRIVATE_KEY;

// Extract base64 part
const lines = key.split('\n');
const base64Lines = lines.slice(1, -1);
const fullBase64 = base64Lines.join('');

console.log('Total lines:', lines.length);
console.log('Base64 lines:', base64Lines.length);

const invalidChars = fullBase64.match(/[^A-Za-z0-9+/=]/g);
if (invalidChars) {
    console.log('INVALID CHARACTERS IN BASE64:', [...new Set(invalidChars)]);
} else {
    console.log('Base64 characters are valid.');
}

// Check if each base64 line is 64 chars (except last)
base64Lines.forEach((line, i) => {
    if (line.length !== 64 && i < base64Lines.length - 1) {
        console.log(`Line ${i+1} has unusual length: ${line.length}`);
    }
});
