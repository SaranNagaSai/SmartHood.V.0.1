const rateLimit = require('express-rate-limit');

// General Limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Increased to allow polling from multiple devices
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 429,
        success: false,
        message: 'Too many requests. Please wait a moment.'
    }
});

module.exports = limiter;
