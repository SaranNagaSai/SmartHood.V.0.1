const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['offer', 'request', 'OFFER', 'REQUEST'], required: true },

    title: { type: String, required: true, maxLength: 100 },
    description: { type: String, required: true },
    attachments: [{ type: String }], // URLs to files

    // Target Logic
    targetAudience: { type: String, enum: ['ALL', 'SPECIFIC', 'all', 'specific'], default: 'ALL' },
    targetProfession: [{ type: String }], // Array of professions if targetAudience is SPECIFIC
    targetLocalities: [{ type: String }], // Array of additional localities to broadcast to
    selectedCommunities: [{ type: String }], // Array of additional communities to broadcast to (NEW)

    // Geographic Scope (Inherited from User at time of creation)
    locality: { type: String, required: true },
    town: { type: String, required: true },
    district: { type: String, required: true },
    state: { type: String, required: true },

    status: {
        type: String,
        enum: ['active', 'in_progress', 'completed', 'cancelled', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CLOSED'],
        default: 'active'
    },

    // Completion workflow
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    completedByUniqueId: { type: String },
    completionDate: { type: Date },
    amountSpent: { type: Number, default: 0 },

    // For Request privacy flow - providers who express interest
    interestedProviders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Follow-up tracking
    // Stage 0: Initial (Immediate - sent on creation)
    // Stage 1: 30 mins after creation
    // Stage 2: 1 hour after Stage 1
    // Stage 3: 1 hour after Stage 2
    // Stage 4: 1 hour after Stage 3 (Final)
    followUpStage: { type: Number, default: 0 },
    lastNotificationSentAt: { type: Date, default: Date.now },
    followUpComplete: { type: Boolean, default: false },

    // View Tracking
    views: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Recipients tracking
    sentTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Ratings
    hasBeenRated: { type: Boolean, default: false }
}, { timestamps: true });

// Index for faster locality-based queries
serviceSchema.index({ locality: 1, status: 1, type: 1 });

module.exports = mongoose.model('Service', serviceSchema);
