// Test the /api/localities/filters endpoint
const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/localities/filters',
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
};

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Response:');
        try {
            const jsonData = JSON.parse(data);
            console.log(JSON.stringify(jsonData, null, 2));
            console.log('\nTowns array:');
            console.log(jsonData.towns);
            console.log(`\nTotal towns: ${jsonData.towns ? jsonData.towns.length : 0}`);
        } catch (e) {
            console.log(data);
        }
    });
});

req.on('error', (error) => {
    console.error('Error:', error.message);
});

req.end();
