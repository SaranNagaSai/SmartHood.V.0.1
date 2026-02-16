// Native Fetch version for Node 18+
const loginAndFetchStats = async () => {
    try {
        // Helper for JSON fetch
        const post = async (url, data) => {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) {
                const txt = await res.text(); // Read text body for error
                throw new Error(`HTTP ${res.status}: ${txt.substring(0, 200)}...`);
            }
            return res.json();
        };

        const get = async (url, token) => {
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(`HTTP ${res.status}: ${txt.substring(0, 200)}...`);
            }
            return res.json();
        };

        // 1. Login to get token
        console.log('Logging in...');
        const loginRes = await post('http://127.0.0.1:5000/api/users/login', {
            email: 'saran@example.com',
            password: 'password123'
        });

        const token = loginRes.token;
        const town = loginRes.town;
        const userLocality = loginRes.locality;
        console.log(`Logged in as: ${loginRes.name}, Town: "${town}", Locality: "${userLocality}"`);

        // 2. Fetch Stats without localities (default)
        console.log('\n--- Fetching Default Stats (User Locality) ---');
        try {
            // Use 127.0.0.1
            const res1 = await get(`http://127.0.0.1:5000/api/users/stats`, token);
            console.log('Professions found:', res1.professions.length);
            res1.professions.forEach(p => console.log(` - ${p._id}: ${p.count}`));
        } catch (e) { console.error('Error fetching default stats:', e.message); }

        // 3. Fetch Stats with target localities
        // Using known localities. 
        const targets = [userLocality, "pedha veedhi", "Patimeeda"];
        const query = targets.map(t => encodeURIComponent(t)).join(',');

        console.log(`\n--- Fetching Stats for targets: ${targets.join(', ')} ---`);
        try {
            // Pass explicit town parameter to test controller logic
            const res2 = await get(`http://127.0.0.1:5000/api/users/stats?town=${encodeURIComponent(town.trim())}&localities=${query}`, token);
            console.log('Professions found:', res2.professions.length);
            res2.professions.forEach(p => console.log(` - ${p._id}: ${p.count}`));
        } catch (e) { console.error('Error fetching targeted stats:', e.message); }

    } catch (err) {
        console.error('Login Failed or Script Error:', err.message);
    }
};

loginAndFetchStats();
