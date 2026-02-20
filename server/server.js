const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimiter = require('./middleware/rateLimiter');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

dotenv.config();

const app = express();

// Security Headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Request Logging
app.use(morgan('dev'));

// Rate Limiting
app.use(rateLimiter);

const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:5174'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
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
app.use('/api/debug', require('./routes/debugRoutes'));

app.get('/', (req, res) => res.json({ status: 'ok', message: 'SmartHood API Running' }));

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = 5000;

const schedulerService = require('./services/schedulerService');

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('--- MongoDB Connected ---');
        app.listen(PORT, () => {
            console.log(`--- Server ready on port ${PORT} ---`);
            schedulerService.start();
        });
    })
    .catch(err => {
        console.error('--- DB Connection Error ---');
        console.error(err);
        process.exit(1);
    });
