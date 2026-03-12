const fs = require('fs');
require('dotenv').config();

const clean = (val) => val ? val.trim().replace(/^"|"$/g, '') : undefined;

const sa = {
    type: "service_account",
    project_id: clean(process.env.FIREBASE_PROJECT_ID),
    private_key_id: "fake_id", // Google doesn't check this for signing
    private_key: process.env.FIREBASE_PRIVATE_KEY 
        ? process.env.FIREBASE_PRIVATE_KEY.trim().replace(/^"|"$/g, '').replace(/\\n/g, '\n')
        : undefined,
    client_email: clean(process.env.FIREBASE_CLIENT_EMAIL),
    client_id: "fake_client_id",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(clean(process.env.FIREBASE_CLIENT_EMAIL))}`
};

fs.writeFileSync('firebase-debug-sa.json', JSON.stringify(sa, null, 2));
console.log('Exported firebase-debug-sa.json');
