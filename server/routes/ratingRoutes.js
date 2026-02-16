const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    createRating,
    getUserRatings,
    getServiceRating
} = require('../controllers/ratingController');

router.post('/', protect, createRating);
router.get('/user/:userId', protect, getUserRatings);
router.get('/service/:serviceId', protect, getServiceRating);

module.exports = router;
