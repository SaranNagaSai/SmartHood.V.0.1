const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    magicLogin,
    sendRegistrationOTP,
    verifyRegistrationOTP
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const upload = require('../middleware/uploadMiddleware');

router.post('/register', upload.single('profilePhoto'), registerUser);
router.post('/login', loginUser);
router.post('/send-registration-otp', sendRegistrationOTP);
router.post('/verify-registration-otp', verifyRegistrationOTP);
router.get('/magic-login/:token', magicLogin); // Auto-login from links

module.exports = router;
