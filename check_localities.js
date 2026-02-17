const mongoose = require('mongoose');
const Locality = require('./server/models/Locality');
const dotenv = require('dotenv');
dotenv.config({ path: './server/.env' });

async function checkLocalities() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const localityCount = await Locality.countDocuments();
        console.log(`\nTotal localities in database: ${localityCount}`);

        const towns = await Locality.distinct('town');
        console.log(`\nDistinct towns in Locality collection (${towns.length}):`);
        console.log(JSON.stringify(towns, null, 2));

        const sample = await Locality.find({}).limit(5);
        console.log('\nSample localities:');
        console.log(JSON.stringify(sample, null, 2));

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkLocalities();
