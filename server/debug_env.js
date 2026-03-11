require('dotenv').config();

const sa = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: !!process.env.FIREBASE_PRIVATE_KEY
};

console.log('Project ID:', `'${sa.projectId}'`, 'Length:', sa.projectId?.length);
console.log('Client Email:', `'${sa.clientEmail}'`, 'Length:', sa.clientEmail?.length);
console.log('Private Key Start:', `'${process.env.FIREBASE_PRIVATE_KEY?.substring(0, 10)}'`);
