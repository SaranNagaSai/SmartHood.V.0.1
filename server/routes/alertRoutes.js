const express = require('express');
const router = express.Router();
const { createAlert, getAlerts, getMyAlerts, getAlertRecipients, expressInterest, getAlertDetail } = require('../controllers/alertController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/', protect, upload.array('attachments', 5), createAlert);
router.get('/my', protect, getMyAlerts);
router.get('/detail/:id', protect, getAlertDetail);
router.post('/:id/interest', protect, expressInterest);
router.get('/:id/recipients', protect, getAlertRecipients);
router.get('/', protect, getAlerts);

module.exports = router;
