const http = require('http');
const fs = require('fs');

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
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        fs.writeFileSync('api_response.json', data);
        console.log('Response written to api_response.json');
        process.exit(0);
    });
});

req.on('error', (error) => {
    console.error('Error:', error.message);
    process.exit(1);
});

req.end();
