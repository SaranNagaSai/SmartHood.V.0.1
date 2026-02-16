const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const maskedURI = process.env.MONGODB_URI.replace(/:([^@]+)@/, ':****@');
        console.log(`Connecting to: ${maskedURI}`);
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            family: 4 // Force IPv4 to avoid ETIMEOUT on some networks
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
