const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, enum: ['Emergency', 'Official', 'Welfare', 'Entertainment'], required: true },

    // Emergency Sub-categories + Other category types
    subType: {
        type: String,
        enum: ['Blood Donation', 'Accident', 'Cash Donation', 'Climate', 'Theft', 'General', 'Official', 'Welfare', 'Entertainment']
    },

    // Specific Fields
    bloodGroup: { type: String }, // Only for Blood Donation

    description: { type: String, required: true },
    attachments: [{ type: String }],

    // Geographic Scope
    locality: { type: String, required: true },
    town: { type: String, required: true },
    district: { type: String, required: true },
    state: { type: String, required: true },

    isActive: { type: Boolean, default: true }
}, { timestamps: true });

alertSchema.index({ locality: 1, createdAt: -1 });
alertSchema.index({ category: 1 });

module.exports = mongoose.model('Alert', alertSchema);
