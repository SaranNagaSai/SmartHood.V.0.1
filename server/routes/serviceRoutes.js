const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
    createService,
    getServices,
    getMyServices,
    getServiceById,
    expressInterest,
    completeService,
    cancelService
} = require('../controllers/serviceController');

router.post('/', protect, upload.array('attachments', 5), createService);
router.get('/', protect, getServices);
router.get('/my', protect, getMyServices);
router.get('/:id', protect, getServiceById);
router.post('/:id/interest', protect, expressInterest);
router.post('/:id/complete', protect, completeService);
router.delete('/:id', protect, cancelService);

module.exports = router;
