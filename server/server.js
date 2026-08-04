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
    res.json({
        status: 'active',
        time: new Date().toISOString(),
        env: {
            nodeEnv: process.env.NODE_ENV || 'not_set',
            mongo: !!process.env.MONGODB_URI,
            jwt: !!process.env.SMARTHOOD_JWT_SECRET,
            email: !!process.env.EMAIL_USER && !!process.env.EMAIL_PASSWORD,
            emailHost: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
            emailUser: process.env.EMAIL_USER ? 'Configured' : 'MISSING',
            firebase: !!process.env.FIREBASE_PROJECT_ID && !!process.env.FIREBASE_PRIVATE_KEY,
            twilio: !!process.env.TWILIO_ACCOUNT_SID && !!process.env.TWILIO_AUTH_TOKEN
        }
    });
});

app.get('/', (req, res) => res.json({ status: 'ok', message: 'SmartHood API Running' }));

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const schedulerService = require('./services/schedulerService');

const startServer = async () => {
    // 1. Start HTTP Server first so Render deployment health checks succeed
    app.listen(PORT, () => {
        console.log(`--- Server ready on port ${PORT} ---`);
        schedulerService.start();

        // Self-pinging mechanism (mitigation for Render cold starts)
        const selfUrl = process.env.RENDER_EXTERNAL_URL
            || (process.env.NODE_ENV === 'production' ? 'https://smarthoodbackend.onrender.com' : `http://localhost:${PORT}`);

        console.log(`[Stay-Alive] Self-ping target: ${selfUrl}/api/health/ping`);

        setInterval(() => {
            const axios = require('axios');
            axios.get(`${selfUrl}/api/health/ping`, { timeout: 10000 })
                .then(() => console.log('[Stay-Alive] Self-ping successful'))
                .catch(e => console.log('[Stay-Alive] Self-ping failed:', e.message));
        }, 5 * 60 * 1000); // 5 minutes
    });

    // 2. Connect to MongoDB Atlas with auto-retry
    const connectWithRetry = async () => {
        try {
            if (!process.env.MONGODB_URI) {
                console.error('❌ MONGODB_URI missing from environment variables');
                return;
            }
            await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
            console.log('--- ✅ MongoDB Connected Successfully ---');
        } catch (err) {
            console.error('--- ⚠️ DB Connection Error (Retrying in 10s...) ---');
            console.error(`Reason: ${err.message}`);
            setTimeout(connectWithRetry, 10000);
        }
    };

    connectWithRetry();
};

startServer();

