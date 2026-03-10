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

        await createNotification(
            req.user._id,
            {
                title: 'Complaint Submitted',
                body: `Your complaint "${subject}" has been submitted. Ticket: ${complaint.ticketId}`
            },
            'complaint',
            '/complaints',
            null,
            false,
            {
                workTitle: category,
                workInfo: subject,
                senderName: req.user.name,
                senderPhone: req.user.phone
            }
        );

        // Notify Admins
        const User = require('../models/User');
        setImmediate(async () => {
            try {
                const admins = await User.find({ isAdmin: true, _id: { $ne: req.user._id } });
                for (const admin of admins) {
                    await createNotification(
                        admin._id,
                        {
                            title: `ADMIN: New Complaint - ${category}`,
                            body: `User ${req.user.name} logged a complaint: ${subject}`
                        },
                        'complaint',
                        '/complaints/all',
                        null,
                        false,
                        {
                            workTitle: category,
                            workInfo: `Ticket: ${complaint.ticketId} - ${subject}`,
                            senderName: req.user.name,
                            senderPhone: req.user.phone
                        }
                    );
                }
            } catch (e) {
                console.error('Admin complaint notify fail:', e);
            }
        });

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

        await createNotification(
            complaint.userId,
            {
                title: 'Complaint Status Updated',
                body: `Your complaint "${complaint.subject}" is now ${status}`
            },
            'complaint',
            '/complaints',
            null,
            false,
            {
                workTitle: status.toUpperCase(),
                workInfo: adminResponse || complaint.subject,
                senderName: 'SmartHood Admin',
                senderPhone: 'Support'
            }
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
