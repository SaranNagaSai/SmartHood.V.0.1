const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    uniqueId: { type: String, unique: true }, // e.g., ABC12
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    age: { type: Number },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    email: { type: String }, // Optional
    bloodGroup: { type: String, required: true }, // Mandatory, Locked

    // Geographic Hierarchy
    address: { type: String },
    locality: { type: String, required: true },
    town: { type: String, required: true },
    district: { type: String, required: true },
    state: { type: String, required: true },

    // Professional Info
    professionCategory: { type: String, enum: ['Employed', 'Business', 'Student', 'Homemaker', 'Others'] },
    professionDetails: {
        jobRole: String, // For Employed
        sector: String, // For Employed
        businessType: String, // For Business
        educationLevel: String, // For Student
        course: String, // For Student
        description: String // General description
    },

    experience: { type: Number, default: 0 }, // Years of experience
    impactScore: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },

    isAdmin: { type: Boolean, default: false },
    language: { type: String, default: 'English' }, // Persisted language preference
    fcmToken: { type: String }, // For Browser Notifications
    profilePhoto: {
        type: String,
        default: ''
    },
}, { timestamps: true });

userSchema.index({ town: 1, locality: 1 });
userSchema.index({ professionCategory: 1 });

module.exports = mongoose.model('User', userSchema);
