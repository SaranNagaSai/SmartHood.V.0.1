const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimiter = require('./middleware/rateLimiter');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

dotenv.config();

console.log('--- Environment Diagnostics ---');
console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`- MONGODB_URI: ${process.env.MONGODB_URI ? 'Detected' : 'MISSING'}`);
console.log(`- JWT_SECRET (OLD): ${process.env.JWT_SECRET ? 'Warning: Still present' : 'Clean'}`);
console.log(`- SMARTHOOD_JWT_SECRET: ${process.env.SMARTHOOD_JWT_SECRET ? 'Detected' : 'MISSING'}`);
console.log(`- TWILIO_ACCOUNT_SID: ${process.env.TWILIO_ACCOUNT_SID ? 'Detected' : 'MISSING'}`);
console.log(`- TWILIO_VERIFY_SID: ${process.env.TWILIO_VERIFY_SERVICE_SID ? 'Detected' : 'MISSING'}`);
console.log(`- TWILIO_PHONE_NUMBER: ${process.env.TWILIO_PHONE_NUMBER ? 'Detected' : 'MISSING'}`);
console.log(`- EMAIL_USER: ${process.env.EMAIL_USER ? 'Detected' : 'MISSING'}`);
console.log('-------------------------------');

const app = express();

// Helper to normalize origins
const normalizeOrigin = (url) => url ? url.replace(/\/$/, '') : '';

const allowedOrigins = [
    normalizeOrigin(process.env.FRONTEND_URL),
    'https://smarthood.onrender.com', // Safe fallback
    'http://localhost:5173',
    'http://localhost:5174'
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl)
        if (!origin) return callback(null, true);

        const normalizedOrigin = normalizeOrigin(origin);
        if (allowedOrigins.includes(normalizedOrigin)) {
            callback(null, true);
        } else {
            console.warn(`[CORS] Blocked request from origin: ${origin}`);
            callback(null, false); // Blocked
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'language']
}));

// Security Headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Request Logging
app.use(morgan('dev'));

// Rate Limiting
app.use(rateLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Serve frontend assets (profile photos)
app.use('/assets', express.static(path.join(__dirname, '../frontend/public/assets')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/alerts', require('./routes/alertRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/ratings', require('./routes/ratingRoutes'));
app.use('/api/localities', require('./routes/localityRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/professions', require('./routes/professionRoutes'));
app.use('/api/communities', require('./routes/communityRoutes'));

// Health & Keep-Alive Route
app.get('/api/health/ping', (req, res) => {
    console.log(`[Ping] Received at ${new Date().toISOString()}`);
    res.json({ status: 'active', time: new Date().toISOString() });
});

app.get('/', (req, res) => res.json({ status: 'ok', message: 'SmartHood API Running' }));

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const schedulerService = require('./services/schedulerService');

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('--- MongoDB Connected ---');
        app.listen(PORT, () => {
            console.log(`--- Server ready on port ${PORT} ---`);
            schedulerService.start();

            // Self-pinging mechanism (mitigation for Render cold starts)
            // It pings its own health endpoint every 10 minutes
            const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
            const serverUrl = process.env.RENDER_EXTERNAL_URL || (FRONTEND_URL.includes('localhost') ? `http://localhost:${PORT}` : FRONTEND_URL.replace('5173', PORT.toString()));

            setInterval(() => {
                const axios = require('axios');
                axios.get(`${serverUrl}/api/health/ping`)
                    .then(() => console.log('[Stay-Alive] Self-ping successful'))
                    .catch(e => console.log('[Stay-Alive] Self-ping failed (expected if local)'));
            }, 10 * 60 * 1000); // 10 minutes
        });
    })
    .catch(err => {
        console.error('--- DB Connection Error ---');
        console.error(err);
        process.exit(1);
    });
