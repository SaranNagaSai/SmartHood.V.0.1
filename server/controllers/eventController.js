const Event = require('../models/Event');
const { createNotification } = require('./notificationController');

// @desc    Get events in user's locality
// @route   GET /api/events
// @access  Private
const getEvents = async (req, res) => {
    try {
        const events = await Event.find({ locality: req.user.locality, isActive: true })
            .populate('createdBy', 'name uniqueId')
            .sort({ date: 1 });

        // Add hasRSVPd flag for current user
        const eventsWithRSVP = events.map(event => ({
            ...event.toJSON(),
            hasRSVPd: event.rsvps.some(id => id.toString() === req.user._id.toString())
        }));

        res.json(eventsWithRSVP);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create event
// @route   POST /api/events
// @access  Private
const createEvent = async (req, res) => {
    try {
        const { title, description, date, time, venue, category } = req.body;

        const event = await Event.create({
            title,
            description,
            date,
            time,
            venue,
            category,
            createdBy: req.user._id,
            locality: req.user.locality
        });

        // Notify neighbors
        const targetUsers = await User.find({
            locality: req.user.locality,
            _id: { $ne: req.user._id }
        });

        const { routeNotifications } = require('../services/notificationService');
        await routeNotifications(targetUsers, {
            title: `New Event: ${title}`,
            body: `Join us for ${title} on ${new Date(date).toLocaleDateString()} at ${venue}`,
            data: { url: `/events/${event._id}`, type: 'alert' }
        });

        res.status(201).json(event);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    RSVP to event
// @route   POST /api/events/:id/rsvp
// @access  Private
const rsvpEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const userId = req.user._id;
        const hasRSVPd = event.rsvps.some(id => id.toString() === userId.toString());

        if (hasRSVPd) {
            // Remove RSVP
            event.rsvps = event.rsvps.filter(id => id.toString() !== userId.toString());
        } else {
            // Add RSVP
            event.rsvps.push(userId);
        }

        await event.save();

        res.json({
            message: hasRSVPd ? 'RSVP removed' : 'RSVP added',
            hasRSVPd: !hasRSVPd,
            rsvpCount: event.rsvps.length
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get event by ID
// @route   GET /api/events/:id
// @access  Private
const getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('createdBy', 'name uniqueId')
            .populate('rsvps', 'name uniqueId');

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.json({
            ...event.toJSON(),
            hasRSVPd: event.rsvps.some(user => user._id.toString() === req.user._id.toString())
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete event (creator only)
// @route   DELETE /api/events/:id
// @access  Private
const deleteEvent = async (req, res) => {
    try {
        const event = await Event.findOne({
            _id: req.params.id,
            createdBy: req.user._id
        });

        if (!event) {
            return res.status(404).json({ message: 'Event not found or unauthorized' });
        }

        await event.deleteOne();
        res.json({ message: 'Event deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getEvents,
    createEvent,
    rsvpEvent,
    getEventById,
    deleteEvent
};
