const express = require('express');
const router = express.Router();
const { adminProtect } = require('../middleware/authMiddleware');
const {
    adminLogin,
    getAnalytics,
    getAllUsers,
    createAdmin,
    getUserStats
} = require('../controllers/adminController');

// Public route
router.post('/login', adminLogin);

// Protected admin routes
router.get('/analytics', adminProtect, getAnalytics);
router.get('/users/:id/stats', adminProtect, getUserStats);
router.get('/users', adminProtect, getAllUsers);
router.post('/create', adminProtect, createAdmin);

module.exports = router;
