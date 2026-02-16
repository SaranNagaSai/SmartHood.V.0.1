const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.get('/', (req, res) => res.send('Minimal Server OK'));

const PORT = 5001; // Different port
app.listen(PORT, () => {
    console.log(`Minimal server on ${PORT}`);
});
