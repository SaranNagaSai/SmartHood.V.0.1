const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
require('dotenv').config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // Find user SARAN in Gudivada
        const user = await User.findOne({ town: { $regex: /Gudivada/i }, name: { $regex: /SARAN/i } });

        if (!user) {
            console.error('User "SARAN" in Gudivada not found');
            process.exit(1);
        }

        console.log(`Testing with User: ${user.name}, Town: "${user.town}", Locality: "${user.locality}"`);

        // Generate Token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        // Helper for fetch
        const fetchData = async (url) => {
            try {
                const res = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                console.log(`Status: ${res.status}`);
                if (res.ok) {
                    const data = await res.json();
                    console.log('Data:', JSON.stringify(data, null, 2));
                } else {
                    const text = await res.text();
                    console.error('Error Body:', text);
                }
            } catch (err) {
                console.error('Fetch Error:', err.message);
            }
        };

        // Test Communities Endpoint
        console.log('\n--- Testing GET /api/communities/by-town?town=Gudivada ---');
        await fetchData('http://localhost:5000/api/communities/by-town?town=Gudivada');

        // Test Professions Endpoint
        console.log('\n--- Testing GET /api/professions/by-town?town=Gudivada ---');
        await fetchData('http://localhost:5000/api/professions/by-town?town=Gudivada');

        // Also test with exact town string from user object to catch whitespace issues
        const encodedTown = encodeURIComponent(user.town.trim());
        console.log(`\n--- Testing GET /api/professions/by-town?town=${encodedTown} (from DB user.town) ---`);
        await fetchData(`http://localhost:5000/api/professions/by-town?town=${encodedTown}`);

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
