const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    totalUsers: Number,
    activeUsers: Number,
    totalRevenue: Number,
    localityStats: [{
        locality: String,
        userCount: Number,
        serviceCount: Number
    }],
    growth: {
        newUsers: Number,
        newServices: Number
    }
}, { timestamps: true });

module.exports = mongoose.model('Analytics', analyticsSchema);
