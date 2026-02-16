const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String
    },
    venue: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['Community', 'Cultural', 'Sports', 'Educational', 'Religious', 'Other'],
        default: 'Community'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    locality: {
        type: String,
        required: true
    },
    rsvps: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Virtual for RSVP count
eventSchema.virtual('rsvpCount').get(function () {
    return this.rsvps ? this.rsvps.length : 0;
});

eventSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Event', eventSchema);
