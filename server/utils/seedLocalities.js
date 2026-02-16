const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Locality = require('../models/Locality');

// Load env vars
dotenv.config(); // Defaults to .env in CWD

const localities = [
    // Hyderabad
    { name: 'Kukatpally', town: 'Hyderabad', district: 'Medchal-Malkajgiri', state: 'Telangana', pincode: '500072' },
    { name: 'Madhapur', town: 'Hyderabad', district: 'Ranga Reddy', state: 'Telangana', pincode: '500081' },
    { name: 'Gachibowli', town: 'Hyderabad', district: 'Ranga Reddy', state: 'Telangana', pincode: '500032' },
    { name: 'Uppal', town: 'Hyderabad', district: 'Medchal-Malkajgiri', state: 'Telangana', pincode: '500039' },
    { name: 'Banjara Hills', town: 'Hyderabad', district: 'Hyderabad', state: 'Telangana', pincode: '500034' },

    // Vijayawada
    { name: 'Benz Circle', town: 'Vijayawada', district: 'NTR', state: 'Andhra Pradesh', pincode: '520010' },
    { name: 'Patamata', town: 'Vijayawada', district: 'NTR', state: 'Andhra Pradesh', pincode: '520010' },
    { name: 'Moghalrajpuram', town: 'Vijayawada', district: 'NTR', state: 'Andhra Pradesh', pincode: '520010' },

    // Visakhapatnam
    { name: 'MVP Colony', town: 'Visakhapatnam', district: 'Visakhapatnam', state: 'Andhra Pradesh', pincode: '530017' },
    { name: 'Gajuwaka', town: 'Visakhapatnam', district: 'Visakhapatnam', state: 'Andhra Pradesh', pincode: '530026' },
    { name: 'Siripuram', town: 'Visakhapatnam', district: 'Visakhapatnam', state: 'Andhra Pradesh', pincode: '530003' }
];

const seedLocalities = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        // Clear existing
        await Locality.deleteMany({});
        console.log('Localities cleared');

        // Insert new
        await Locality.insertMany(localities);
        console.log('Localities seeded successfully');

        process.exit();
    } catch (error) {
        console.error('Error seeding localities:', error);
        process.exit(1);
    }
};

seedLocalities();
