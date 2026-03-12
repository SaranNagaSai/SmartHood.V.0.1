require('dotenv').config();
const cleanKey = (key) => {
    if (!key) return undefined;
    let cleaned = key.trim();
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
        cleaned = cleaned.substring(1, cleaned.length - 1);
    }
    cleaned = cleaned.replace(/\\n/g, '\n');
    return cleaned;
};

const sa = {
    project_id: process.env.FIREBASE_PROJECT_ID,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    private_key: cleanKey(process.env.FIREBASE_PRIVATE_KEY)
};

console.log('Project ID:', sa.project_id);
console.log('Client Email:', sa.client_email);
console.log('Private Key Start:', sa.private_key?.substring(0, 30));
console.log('Private Key End:', sa.private_key?.substring(sa.private_key.length - 30));

// Extract private_key_id if possible from the key? No, it's not in the PEM.
// But we can check if the client_email matches the project_id.
if (sa.client_email && sa.project_id) {
    const emailDomain = sa.client_email.split('@')[1];
    if (emailDomain && !emailDomain.includes(sa.project_id)) {
        console.log('WARNING: Client Email domain does not seem to contain Project ID!');
    }
}
