const dotenv = require('dotenv');
dotenv.config();
console.log('Step 1: dotenv loaded');

const mongoose = require('mongoose');
console.log('Step 2: mongoose loaded');

const admin = require('./config/firebase');
console.log('Step 3: firebase loaded');

const User = require('./models/User');
console.log('Step 4: User model loaded');

const Service = require('./models/Service');
console.log('Step 5: Service model loaded');

const notificationController = require('./controllers/notificationController');
console.log('Step 6: notificationController loaded');

const schedulerService = require('./services/schedulerService');
console.log('Step 7: schedulerService loaded');

const routes = [
    './routes/authRoutes',
    './routes/userRoutes',
    './routes/serviceRoutes',
    './routes/alertRoutes',
    './routes/notificationRoutes',
    './routes/complaintRoutes',
    './routes/eventRoutes',
    './routes/adminRoutes',
    './routes/ratingRoutes',
    './routes/localityRoutes'
];

routes.forEach((route, index) => {
    require(route);
    console.log(`Step ${8 + index}: ${route} loaded`);
});

console.log('SUCCESS: All core modules and routes loaded');
process.exit(0);
