const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const upload = require('../middleware/uploadMiddleware');

router.post('/register', upload.single('profilePhoto'), registerUser);
router.post('/login', loginUser);

module.exports = router;
