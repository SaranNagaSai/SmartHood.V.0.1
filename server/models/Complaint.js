const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    ticketId: {
        type: String,
        unique: true
    },
    subject: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['Service', 'User', 'Technical', 'Payment', 'Other'],
        default: 'Other'
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'resolved', 'rejected'],
        default: 'pending'
    },
    adminResponse: {
        type: String
    },
    resolvedAt: {
        type: Date
    }
}, { timestamps: true });

// Generate ticket ID before save
complaintSchema.pre('save', async function (next) {
    if (!this.ticketId) {
        const count = await mongoose.model('Complaint').countDocuments();
        this.ticketId = `TKT${String(count + 1).padStart(5, '0')}`;
    }
    next();
});

module.exports = mongoose.model('Complaint', complaintSchema);
