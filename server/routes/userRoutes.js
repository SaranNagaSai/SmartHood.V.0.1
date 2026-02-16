const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getLocalityStats,
    getUsersByProfession,
    getProfile,
    updateProfile,
    getActivity,
    updateFcmToken,
    getUsersByLocality,
    uploadPhoto
} = require('../controllers/userController');
const upload = require('../middleware/uploadMiddleware');

router.get('/stats', protect, getLocalityStats);
router.get('/by-profession/:profession', protect, getUsersByProfession);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/photo', protect, upload.single('profilePhoto'), uploadPhoto);
router.get('/activity', protect, getActivity);
router.put('/fcm-token', protect, updateFcmToken);
router.get('/locality/:locality', protect, getUsersByLocality);

module.exports = router;
