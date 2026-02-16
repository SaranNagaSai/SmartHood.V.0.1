const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getEvents,
    createEvent,
    rsvpEvent,
    getEventById,
    deleteEvent
} = require('../controllers/eventController');

router.get('/', protect, getEvents);
router.post('/', protect, createEvent);
router.get('/:id', protect, getEventById);
router.post('/:id/rsvp', protect, rsvpEvent);
router.delete('/:id', protect, deleteEvent);

module.exports = router;
