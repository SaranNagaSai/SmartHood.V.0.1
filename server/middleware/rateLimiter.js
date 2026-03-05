const rateLimit = require('express-rate-limit');

// General Limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === 'OPTIONS', // Never rate limit preflight requests
    message: {
        status: 429,
        success: false,
        message: 'Too many requests. Please wait a moment.'
    }
});

module.exports = limiter;
