const Service = require('../models/Service');
const User = require('../models/User');
const Revenue = require('../models/Revenue');
const { createNotification } = require('./notificationController');
const { generateServiceEmailTemplate, generateInterestEmailTemplate, generateCompletionEmailTemplate } = require('../services/emailService');

// @desc    Create a new service offer/request
// @route   POST /api/services
// @access  Private
const createService = async (req, res) => {
    try {
        const {
            type, title, description,
            targetAudience, targetProfession,
            targetLocality, // Legacy single target
            targetLocalities, // New multi target array
            selectedCommunities // New multi-community array
        } = req.body;

        // Process attachments from multer if any
        let attachmentPaths = [];
        if (req.files && req.files.length > 0) {
            attachmentPaths = req.files.map(file => `/uploads/${file.filename}`);
        } else if (req.body.attachments) {
            attachmentPaths = req.body.attachments;
        }

        const user = req.user;

        // Title character limit check
        if (title && title.length > 100) {
            return res.status(400).json({ message: 'Title must be 100 characters or less' });
        }

        // Determine final localities list
        // Always include creator's locality
        let allTargetLocalities = [user.locality];

        // Add specific targets if provided
        if (targetLocalities && Array.isArray(targetLocalities)) {
            allTargetLocalities = [...new Set([...allTargetLocalities, ...targetLocalities])];
        } else if (targetLocality) {
            allTargetLocalities = [...new Set([...allTargetLocalities, targetLocality])];
        }

        // Normalize targetProfession to always be an array
        let professionArray = [];
        if (targetProfession) {
            professionArray = Array.isArray(targetProfession) ? targetProfession : [targetProfession];
        }

        const service = await Service.create({
            createdBy: user._id,
            type: type.toLowerCase(),
            title,
            description,
            attachments: attachmentPaths,
            targetAudience: targetAudience || 'ALL',
            targetProfession: professionArray,
            locality: user.locality, // Primary origin
            targetLocalities: allTargetLocalities.filter(l => l !== user.locality), // Store *additional* targets
            selectedCommunities: selectedCommunities || [], // Store selected communities
            town: user.town,
            district: user.district,
            state: user.state
        });

        // NOTIFICATION LOGIC - Find target users in ALL targeted localities AND communities
        let allCommunities = [user.locality]; // Start with user's own community

        // Add selected communities if provided
        if (selectedCommunities && Array.isArray(selectedCommunities) && selectedCommunities.length > 0) {
            allCommunities = [...new Set([...allCommunities, ...selectedCommunities])];
        }

        // Also include targetLocalities for backward compatibility
        if (allTargetLocalities && allTargetLocalities.length > 0) {
            allCommunities = [...new Set([...allCommunities, ...allTargetLocalities])];
        }

        let query = {
            locality: { $in: allCommunities },
            _id: { $ne: user._id }
        };

        if (targetAudience === 'SPECIFIC' && professionArray.length > 0) {
            query.professionCategory = { $in: professionArray };
        }

        const targetUsers = await User.find(query);

        // Send notifications via unified service
        const { routeNotifications } = require('../services/notificationService');

        // Generate rich HTML email
        const emailHtml = generateServiceEmailTemplate(service, user, type.toLowerCase());

        await routeNotifications(targetUsers, {
            title: `New ${type === 'offer' ? 'Service Offer' : 'Help Request'}`,
            body: `${user.name} posted: ${title}`,
            data: { url: `/service/${service._id}`, type: 'service' },
            emailHtml: emailHtml
        });

        res.status(201).json({
            message: 'Service created successfully',
            service,
            recipientCount: targetUsers.length
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get services for current user's feed
// @route   GET /api/services
// @access  Private
const getServices = async (req, res) => {
    try {
        const currentUser = req.user;
        const { type, status } = req.query;

        let query = {
            // Show services where:
            // 1. Service is from my locality
            // 2. OR Service explicitly targets my locality
            $or: [
                { locality: currentUser.locality },
                { targetLocalities: currentUser.locality }
            ],
            // AND audience check
            $and: [
                {
                    $or: [
                        { targetAudience: { $in: ['ALL', 'all'] } },
                        {
                            targetAudience: { $in: ['SPECIFIC', 'specific'] },
                            targetProfession: { $in: [currentUser.professionCategory] }
                        }
                    ]
                }
            ]
        };

        if (type) query.type = type.toLowerCase();
        if (status) query.status = status.toLowerCase();

        const services = await Service.find(query)
            .populate('createdBy', 'name uniqueId professionCategory professionDetails')
            .sort({ createdAt: -1 });

        res.json(services);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get my services
// @route   GET /api/services/my
// @access  Private
const getMyServices = async (req, res) => {
    try {
        const services = await Service.find({ createdBy: req.user._id })
            .sort({ createdAt: -1 });
        res.json(services);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get service by ID
// @route   GET /api/services/:id
// @access  Private
const getServiceById = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id)
            .populate('createdBy', 'name uniqueId phone email professionCategory professionDetails profilePhoto') // Added profilePhoto
            .populate('completedBy', 'name uniqueId profilePhoto')
            .populate('interestedProviders', 'name uniqueId professionCategory profilePhoto')
            .populate('views', 'name profilePhoto'); // Populate views

        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        // View Tracking Logic
        // If user is not the creator and not already in views list, add them
        if (req.user._id.toString() !== service.createdBy._id.toString()) {
            const hasViewed = service.views.some(v => v._id.toString() === req.user._id.toString());
            if (!hasViewed) {
                service.views.push(req.user._id);
                await service.save();
            }
        }

        res.json(service);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Express interest in a service (for requests)
// @route   POST /api/services/:id/interest
// @access  Private
const expressInterest = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);

        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        if (service.createdBy.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot express interest in your own service' });
        }

        const hasInterest = service.interestedProviders.includes(req.user._id);

        if (hasInterest) {
            // Remove interest
            service.interestedProviders = service.interestedProviders.filter(
                id => id.toString() !== req.user._id.toString()
            );
        } else {
            // Add interest
            service.interestedProviders.push(req.user._id);

            // Notify service creator
            const emailHtml = generateInterestEmailTemplate(service, req.user);

            await createNotification(
                service.createdBy,
                'New Interest in Your Request',
                `${req.user.name} is interested in helping with "${service.title}"`,
                'service',
                `/service/${service._id}`,
                emailHtml
            );
        }

        await service.save();
        res.json({
            hasInterest: !hasInterest,
            interestedCount: service.interestedProviders.length
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Complete a service
// @route   POST /api/services/:id/complete
// @access  Private
const completeService = async (req, res) => {
    try {
        const { providerUniqueId, amountSpent } = req.body;
        const service = await Service.findById(req.params.id);

        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        if (service.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the service creator can complete it' });
        }

        // Find provider by unique ID
        const provider = await User.findOne({ uniqueId: providerUniqueId.toUpperCase() });

        if (!provider) {
            return res.status(404).json({ message: 'Provider not found with this Unique ID' });
        }

        // Update service
        service.status = 'completed';
        service.completedBy = provider._id;
        service.completedByUniqueId = provider.uniqueId;
        service.completionDate = new Date();
        service.amountSpent = amountSpent || 0;

        await service.save();

        // Update provider stats
        provider.impactScore = (provider.impactScore || 0) + 5;
        provider.revenue = (provider.revenue || 0) + (amountSpent || 0);
        await provider.save();

        // Create Revenue Log
        await Revenue.create({
            serviceId: service._id,
            requesterId: req.user._id,
            providerId: provider._id,
            amount: amountSpent || 0,
            serviceTitle: service.title,
            locality: service.locality
        });

        // Notify provider
        const emailHtml = generateCompletionEmailTemplate(service, provider, amountSpent || 0);

        await createNotification(
            provider._id,
            'Service Completed!',
            `${req.user.name} marked your service as complete. Your impact score increased!`,
            'service',
            `/service/${service._id}`, // Adding link for consistency
            emailHtml
        );

        res.json({
            message: 'Service completed successfully',
            service,
            providerStats: {
                impactScore: provider.impactScore,
                revenue: provider.revenue
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Cancel a service
// @route   DELETE /api/services/:id
// @access  Private
const cancelService = async (req, res) => {
    try {
        const service = await Service.findOne({
            _id: req.params.id,
            createdBy: req.user._id
        });

        if (!service) {
            return res.status(404).json({ message: 'Service not found or unauthorized' });
        }

        service.status = 'cancelled';
        await service.save();

        res.json({ message: 'Service cancelled' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    createService,
    getServices,
    getMyServices,
    getServiceById,
    expressInterest,
    completeService,
    cancelService
};
