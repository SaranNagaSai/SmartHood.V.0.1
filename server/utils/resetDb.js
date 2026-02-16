const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Verified Models
const User = require('../models/User');
const Service = require('../models/Service');
const Alert = require('../models/Alert');
const Notification = require('../models/Notification');
const Complaint = require('../models/Complaint');
const Event = require('../models/Event');
const Rating = require('../models/Rating');
const Admin = require('../models/Admin');
const Locality = require('../models/Locality');

dotenv.config({ path: path.join(__dirname, '../.env') });

const resetDatabase = async () => {
    try {
        console.log('🧹 Connecting to database: ', process.env.MONGODB_URI?.split('@')[1] || 'URI not found');

        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI not found in environment variables');
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected successfully.');

        console.log('🗑️ Clearing collections...');

        const models = [User, Service, Alert, Notification, Complaint, Event, Rating, Admin, Locality];

        for (const model of models) {
            const result = await model.deleteMany({});
            console.log(`--- Cleared ${model.modelName}: ${result.deletedCount} items removed`);
        }

        console.log('✨ All active collections cleared.');

        // Re-seed admins
        console.log('🌱 Re-seeding admins...');
        const seedAdmins = require('./seedAdmins');
        await seedAdmins();

        console.log('🏁 Database reset complete. You can now start fresh.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Reset failed error details:', error);
        process.exit(1);
    }
};

resetDatabase();
