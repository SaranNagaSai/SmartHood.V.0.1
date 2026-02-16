const express = require('express');
const router = express.Router();
const { getPeers, getMentors, getStudentStats } = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');

router.get('/peers', protect, getPeers);
router.get('/mentors', protect, getMentors);
router.get('/stats', protect, getStudentStats);

module.exports = router;
