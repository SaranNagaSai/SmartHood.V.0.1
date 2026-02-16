// Test script to check what the frontend receives
console.log('Testing frontend API call...');

fetch('http://localhost:5173/api/localities/filters')
    .then(res => {
        console.log('Response status:', res.status);
        return res.json();
    })
    .then(data => {
        console.log('Received data:', JSON.stringify(data, null, 2));
        console.log('Towns:', data.towns);
        console.log('Towns count:', data.towns ? data.towns.length : 0);
    })
    .catch(err => {
        console.error('Error:', err);
    });
