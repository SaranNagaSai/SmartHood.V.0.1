const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    permissions: {
        manageUsers: { type: Boolean, default: true },
        manageAlerts: { type: Boolean, default: true },
        viewAnalytics: { type: Boolean, default: true },
        resolveComplaints: { type: Boolean, default: true }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    }
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);
