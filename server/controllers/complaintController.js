const Complaint = require('../models/Complaint');
const { createNotification } = require('./notificationController');

// @desc    Get user complaints
// @route   GET /api/complaints
// @access  Private
const getComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find({ userId: req.user._id })
            .sort({ createdAt: -1 });
        res.json(complaints);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create complaint
// @route   POST /api/complaints
// @access  Private
const createComplaint = async (req, res) => {
    try {
        const { subject, description, category } = req.body;

        const complaint = await Complaint.create({
            userId: req.user._id,
            subject,
            description,
            category
        });

        // Notify user
        await createNotification(
            req.user._id,
            'Complaint Submitted',
            `Your complaint "${subject}" has been submitted. Ticket: ${complaint.ticketId}`,
            'system'
        );

        res.status(201).json(complaint);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get complaint by ID
// @route   GET /api/complaints/:id
// @access  Private
const getComplaintById = async (req, res) => {
    try {
        const complaint = await Complaint.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        res.json(complaint);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update complaint status (Admin only)
// @route   PUT /api/complaints/:id/status
// @access  Admin
const updateComplaintStatus = async (req, res) => {
    try {
        const { status, adminResponse } = req.body;

        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            {
                status,
                adminResponse,
                ...(status === 'resolved' && { resolvedAt: new Date() })
            },
            { new: true }
        );

        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        // Notify user of status update
        await createNotification(
            complaint.userId,
            'Complaint Status Updated',
            `Your complaint "${complaint.subject}" is now ${status}`,
            'system'
        );

        res.json(complaint);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all complaints (Admin)
// @route   GET /api/complaints/all
// @access  Admin
const getAllComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find()
            .populate('userId', 'name uniqueId phone')
            .sort({ createdAt: -1 });
        res.json(complaints);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getComplaints,
    createComplaint,
    getComplaintById,
    updateComplaintStatus,
    getAllComplaints
};
