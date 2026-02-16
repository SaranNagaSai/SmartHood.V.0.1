const mongoose = require('mongoose');

const revenueSchema = new mongoose.Schema({
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: true
    },
    requesterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    providerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        default: 0
    },
    serviceTitle: {
        type: String,
        required: true
    },
    locality: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Revenue', revenueSchema);
