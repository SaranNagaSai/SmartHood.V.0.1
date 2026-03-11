require('dotenv').config();
const email = process.env.FIREBASE_CLIENT_EMAIL;
console.log('Email:', `'${email}'`);
console.log('Length:', email.length);
for (let i = 0; i < email.length; i++) {
    console.log(`Char ${i}: ${email[i]} (Code: ${email.charCodeAt(i)})`);
}
