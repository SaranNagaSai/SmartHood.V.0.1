const express = require('express');
const router = express.Router();
const { getSystemAnalytics, getLocalityAnalytics } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/system', protect, getSystemAnalytics);
router.get('/locality', protect, getLocalityAnalytics);

module.exports = router;
