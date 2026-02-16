const axios = require('axios');
const runTest = async () => {
    try {
        const url = 'http://localhost:5000/api/localities?town=Gudivada';
        console.log(`Fetching: ${url}`);
        const res = await axios.get(url);
        console.log("Response Status:", res.status);
        console.log("Response Data:", JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error("Error:", err.message);
        if (err.response) {
            console.error("Response:", err.response.data);
        }
    }
};
runTest();
