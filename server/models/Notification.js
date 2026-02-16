const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['service', 'alert', 'ALERT', 'message', 'system', 'reminder'],
        default: 'system'
    },
    link: {
        type: String
    },
    read: {
        type: Boolean,
        default: false
    },
    deliveryMethod: {
        type: String,
        enum: ['email', 'fcm', 'both'],
        default: 'fcm'
    },
    delivered: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
