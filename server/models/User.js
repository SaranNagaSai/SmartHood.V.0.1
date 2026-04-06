const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    uniqueId: { type: String, unique: true }, // e.g., ABC12
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    age: { type: Number },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    email: { type: String }, // Optional
    bloodGroup: { type: String, required: true }, // Mandatory, Locked
    pin: { type: String, required: true }, // 4-digit PIN for free authentication

    // Geographic Hierarchy
    address: { type: String },
    locality: { type: String, required: true },
    normalizedLocality: { type: String }, // For cross-language matching (English base)
    town: { type: String, required: true },
    normalizedTown: { type: String }, // For cross-language matching (English base)
    district: { type: String, required: true },
    normalizedDistrict: { type: String }, // For cross-language matching (English base)
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
    totalSpent: { type: Number, default: 0 },

    isAdmin: { type: Boolean, default: false },
    language: { type: String, default: 'English' }, // Persisted language preference
    fcmTokens: [String], // Array of tokens for multiple devices
    fcmToken: { type: String }, // Legacy field for backwards compatibility

    profilePhoto: {
        type: String,
        default: ''
    },
}, { timestamps: true });

userSchema.index({ town: 1, locality: 1 });
userSchema.index({ professionCategory: 1 });

module.exports = mongoose.model('User', userSchema);
