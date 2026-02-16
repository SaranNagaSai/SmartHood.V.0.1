const admin = require('firebase-admin');

const cleanKey = (key) => {
    if (!key) return undefined;

    // 1. Remove surrounding quotes (both single and double)
    let cleaned = key.replace(/^["']|["']$/g, '');

    // 2. Replace literal "\n" (two chars) with actual newline character
    cleaned = cleaned.replace(/\\n/g, '\n');

    // 3. Ensure correct header/footer spacing if missing
    if (!cleaned.includes('-----BEGIN PRIVATE KEY-----')) {
        // If the key is just the base64 part, wrap it (unlikely but possible)
        cleaned = `-----BEGIN PRIVATE KEY-----\n${cleaned}\n-----END PRIVATE KEY-----`;
    }

    return cleaned;
};

// Log raw key presence (security safe)
console.log('Parsing Firebase Key... Present:', !!process.env.FIREBASE_PRIVATE_KEY);

const serviceAccount = {
    "type": "service_account",
    "project_id": process.env.FIREBASE_PROJECT_ID,
    "private_key_id": "e0b83a5e7cc4b8f94d1ad4ee808078fcf5693de5ea43ba57cb80049c5dc83231",
    "private_key": cleanKey(process.env.FIREBASE_PRIVATE_KEY),
    "client_email": process.env.FIREBASE_CLIENT_EMAIL,
    "client_id": "111816408253136270836",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.FIREBASE_CLIENT_EMAIL || '')}`
};

try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin initialized successfully');
} catch (error) {
    console.error('Firebase Admin initialization failed:', error);
    console.log('ℹ️  Continuing without Firebase');
}

module.exports = admin;
