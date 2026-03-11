const admin = require('firebase-admin');

const cleanKey = (key) => {
    if (!key) return undefined;

    // Remove any surrounding quotes and replace both literal \n and real newlines
    let cleaned = key.trim();
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
        cleaned = cleaned.substring(1, cleaned.length - 1);
    }
    cleaned = cleaned.replace(/\\n/g, '\n');

    // Safety check: ensure the key starts and ends correctly
    if (!cleaned.includes('-----BEGIN PRIVATE KEY-----')) {
        cleaned = `-----BEGIN PRIVATE KEY-----\n${cleaned}\n-----END PRIVATE KEY-----`;
    }

    // Log key stats for debugging
    console.log('[Firebase] Key Cleaned. Length:', cleaned.length);
    console.log('[Firebase] Key Starts With:', cleaned.substring(0, 30));
    console.log('[Firebase] Key Ends With:', cleaned.substring(cleaned.length - 30));

    return cleaned;
};

// Log raw key presence (security safe)
console.log('Parsing Firebase Key... Present:', !!process.env.FIREBASE_PRIVATE_KEY);

// Construct service account object from environment variables
const sa = {
    project_id: process.env.FIREBASE_PROJECT_ID,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    private_key: cleanKey(process.env.FIREBASE_PRIVATE_KEY)
};

console.log('[Firebase] Configuring for Project:', sa.project_id);
console.log('[Firebase] Client Email Present:', !!sa.client_email);
console.log('[Firebase] Private Key Present:', !!sa.private_key);

try {
    if (!sa.project_id || !sa.private_key || !sa.client_email) {
        throw new Error('Missing essential Firebase configuration (Project ID, Private Key, or Client Email)');
    }

    // Only initialize if not already initialized
    if (admin.apps.length === 0) {
        admin.initializeApp({
            credential: admin.credential.cert(sa)
        });
        console.log('✅ Firebase Admin initialized successfully');
    }
} catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error.message);
    if (error.stack && error.stack.includes('parse')) {
        console.log('ℹ️  Tip: This usually means the PRIVATE_KEY format in .env is incorrect.');
    }
}

module.exports = admin;
