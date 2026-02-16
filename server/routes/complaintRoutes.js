const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getComplaints,
    createComplaint,
    getComplaintById,
    updateComplaintStatus,
    getAllComplaints
} = require('../controllers/complaintController');

router.get('/', protect, getComplaints);
router.post('/', protect, createComplaint);
router.get('/all', protect, getAllComplaints); // Admin route
router.get('/:id', protect, getComplaintById);
router.put('/:id/status', protect, updateComplaintStatus); // Admin route

module.exports = router;
