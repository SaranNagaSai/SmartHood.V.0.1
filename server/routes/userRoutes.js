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
    uploadPhoto,
    searchUsers,
    getUsersByState,
    getTownLocalities,
    testPush
} = require('../controllers/userController');
const upload = require('../middleware/uploadMiddleware');

router.get('/stats', protect, getLocalityStats);
router.get('/by-profession/:profession', protect, getUsersByProfession);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/photo', protect, upload.single('profilePhoto'), uploadPhoto);
router.get('/activity', protect, getActivity);
router.put('/fcm-token', protect, updateFcmToken);
router.post('/test-push', protect, testPush);
router.get('/locality/:locality', protect, getUsersByLocality);
router.get('/search', protect, searchUsers);
router.get('/state/:stateName', protect, getUsersByState);
router.get('/town-localities', protect, getTownLocalities);

module.exports = router;
