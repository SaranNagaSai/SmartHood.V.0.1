const express = require('express');
const router = express.Router();
const { getCommunitiesByTown } = require('../controllers/communityController');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/communities/by-town
router.get('/by-town', protect, getCommunitiesByTown);

module.exports = router;
