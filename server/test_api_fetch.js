const runTest = async () => {
    try {
        const url = 'http://localhost:5000/api/localities?town=Gudivada';
        console.log(`Fetching: ${url}`);
        const res = await fetch(url);
        console.log("Response Status:", res.status);
        const data = await res.json();
        console.log("Response Data Length:", data.length);
        console.log("Response Data:", JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Error:", err.message);
    }
};
runTest();
