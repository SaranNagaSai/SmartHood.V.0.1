const mongoose = require('mongoose');

const localitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    town: {
        type: String,
        required: true
    },
    district: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    userCount: {
        type: Number,
        default: 0
    },
    coordinates: {
        lat: Number,
        lng: Number
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Index for faster locality lookups
localitySchema.index({ name: 1, town: 1, district: 1, state: 1 }, { unique: true });

module.exports = mongoose.model('Locality', localitySchema);
