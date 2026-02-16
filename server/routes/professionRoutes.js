const express = require('express');
const router = express.Router();
const { getProfessionsByCommunity, getCommunitiesByTown, getProfessionsByTown } = require('../controllers/communityController');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/professions/by-community
router.get('/by-community', protect, getProfessionsByCommunity);

// @route   GET /api/professions/by-town
router.get('/by-town', protect, getProfessionsByTown);

module.exports = router;
