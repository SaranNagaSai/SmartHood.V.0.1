const Service = require('../models/Service');
const User = require('../models/User');
const Revenue = require('../models/Revenue');
const { createNotification } = require('./notificationController');
const { sendEmail, generateServiceEmailTemplate, generateInterestEmailTemplate, generateCompletionEmailTemplate } = require('../services/emailService');

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
            selectedCommunities, // New multi-community array
            broadcastGlobal // NEW: Global broadcast flag
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

        console.log(`[Service] Creating ${type} for user: ${user.name} (${user.locality})`);
        console.log(`[Service] Target Localities:`, targetLocalities, `Communities:`, selectedCommunities, `Global:`, broadcastGlobal);

        const service = await Service.create({
            createdBy: user._id,
            type: type.toLowerCase(),
            title,
            description,
            attachments: attachmentPaths,
            targetAudience: targetAudience || 'ALL',
            targetProfession: professionArray,
            broadcastGlobal: broadcastGlobal === 'true' || broadcastGlobal === true,
            locality: user.locality, // Primary origin
            targetLocalities: allTargetLocalities.filter(l => l !== user.locality), // Store *additional* targets
            selectedCommunities: selectedCommunities || [], // Store selected communities
            town: user.town,
            district: user.district,
            state: user.state
        });

        console.log(`[Service] ID: ${service._id} Created.`);

        // NOTIFICATION LOGIC - Find target users
        let query = {
            _id: { $ne: user._id }
        };

        if (service.broadcastGlobal) {
            console.log(`[Service] GLOBAL BROADCAST: Targeting all users.`);
            // No geographic restrictions for global broadcast
        } else {
            // NOTIFICATION LOGIC - Find target users in ALL targeted localities AND communities
            let allCommunities = [user.locality]; // Start with user's own community

            // Add selected communities if provided (NEW multiselect)
            if (selectedCommunities && Array.isArray(selectedCommunities) && selectedCommunities.length > 0) {
                allCommunities = [...new Set([...allCommunities, ...selectedCommunities])];
            }

            // Also include targetLocalities (OLD/Compatibility multiselect)
            if (targetLocalities) {
                if (Array.isArray(targetLocalities)) {
                    allCommunities = [...new Set([...allCommunities, ...targetLocalities])];
                } else if (typeof targetLocalities === 'string') {
                    allCommunities = [...new Set([...allCommunities, targetLocalities])];
                }
            }

            // NOTIFICATION LOGIC - Broaden to TOWN if no specific localities selected
            const trimmedTown = (user.town || '').trim();
            const townRegex = new RegExp(`^\\s*${trimmedTown}\\s*$`, 'i');

            query.town = { $regex: townRegex };

            // If specific communities were targeted (more than just origin), we restrict by those locality names
            // otherwise we broadcast to everyone in the town
            if (allCommunities.length > 1) {
                console.log(`[Service] Restricting to ${allCommunities.length} communities: ${allCommunities.join(', ')}`);
                query.locality = {
                    $in: allCommunities.map(loc => new RegExp(`^\\s*${(loc || '').trim()}\\s*$`, 'i'))
                };
            } else {
                console.log(`[Service] Broadcasting to entire town: ${trimmedTown}`);
            }
        }

        if (targetAudience === 'SPECIFIC' && professionArray.length > 0) {
            console.log(`[Service] Restricting to professions: ${professionArray.join(', ')}`);
            query.$or = [
                { professionCategory: { $in: professionArray } },
                { 'professionDetails.jobRole': { $in: professionArray } },
                { 'professionDetails.businessType': { $in: professionArray } },
                { 'professionDetails.course': { $in: professionArray } },
                { 'professionDetails.description': { $in: professionArray } }
            ];
        }

        const targetUsers = await User.find(query);
        console.log(`[Service] Found ${targetUsers.length} recipients. Query:`, JSON.stringify(query, (k, v) => v instanceof RegExp ? v.toString() : v));

        // Store recipient IDs for tracking
        service.sentTo = targetUsers.map(u => u._id);
        await service.save();

        // Generate rich HTML email
        const isTelugu = user.language === 'Telugu';
        const emailHtml = generateServiceEmailTemplate(service, user, type.toLowerCase());

        // SEND NOTIFICATIONS IN BACKGROUND (Non-blocking)
        setImmediate(async () => {
            console.log(`[Background] Starting dual-channel broadcast for Service ${service._id} to ${targetUsers.length} users`);

            const { createNotification } = require('./notificationController');

            // 1. SEND CONFIRMATION TO CREATOR (Immediate feedback)
            const isOffer = type.toLowerCase() === 'offer';
            const creatorNotification = {
                title: isOffer ? 'Your Offer is Live!' : 'Your Request is Live!',
                titleTe: isOffer ? 'మీ ఆఫర్ ప్రత్యక్ష ప్రసారంలో ఉంది!' : 'మీ అభ్యర్థన ప్రత్యక్ష ప్రసారంలో ఉంది!',
                body: isOffer
                    ? `Your offer "${title}" has been sent to ${targetUsers.length} people in your community.`
                    : `Your request "${title}" has been sent to ${targetUsers.length} people. You'll receive follow-up updates.`,
                bodyTe: isOffer
                    ? `మీ ఆఫర్ "${title}" మీ కమ్యూనిటీలోని ${targetUsers.length} మందికి పంపబడింది.`
                    : `మీ అభ్యర్థన "${title}" ${targetUsers.length} మందికి పంపబడింది. మీకు ఫాలో-అప్ అప్‌డేట్‌లు వస్తాయి.`
            };

            await createNotification(
                user._id,
                creatorNotification,
                'service',
                `/service/${service._id}`,
                null // No custom email HTML for confirmation - uses default template
            );
            console.log(`[Background] Creator confirmation sent to ${user.name}`);

            // 2. BROADCAST TO TARGET USERS
            for (const targetUser of targetUsers) {
                const recipientIsTelugu = targetUser.language === 'Telugu';

                // Prepare bilingual content
                const notificationData = {
                    title: isOffer ? 'New Service Offer' : 'New Help Request',
                    titleTe: isOffer ? 'కొత్త సర్వీస్ ఆఫర్' : 'కొత్త సహాయం అభ్యర్థన',
                    body: `${user.name} posted: ${title}`,
                    bodyTe: `${user.name} పోస్ట్ చేశారు: ${title}`
                };

                await createNotification(
                    targetUser._id,
                    notificationData,
                    'service',
                    `/service/${service._id}`,
                    emailHtml
                );
            }
            console.log(`[Background] Service Broadcast COMPLETE for ${targetUsers.length} users.`);
        });

        res.status(201).json({
            message: 'Service created successfully',
            service,
            recipientCount: targetUsers.length,
            status: 'processing_in_background'
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

        const localityRegex = new RegExp(`^\\s*${currentUser.locality.trim()}\\s*$`, 'i');
        let query = {
            $or: [
                { locality: { $regex: localityRegex } },
                { targetLocalities: { $regex: localityRegex } },
                { selectedCommunities: { $regex: localityRegex } }
            ],
            $and: [
                {
                    $or: [
                        { targetAudience: { $in: ['ALL', 'all'] } },
                        {
                            targetAudience: { $in: ['SPECIFIC', 'specific'] },
                            $or: [
                                { targetProfession: { $in: [currentUser.professionCategory] } },
                                { targetProfession: { $in: [currentUser.professionDetails?.jobRole] } },
                                { targetProfession: { $in: [currentUser.professionDetails?.businessType] } },
                                { targetProfession: { $in: [currentUser.professionDetails?.course] } }
                            ]
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
            const creator = await User.findById(service.createdBy);
            const isTelugu = req.user.language === 'Telugu';

            if (creator && creator.email) {
                await sendEmail(
                    creator.email,
                    isTelugu ? `కొత్త ఆసక్తి: ${service.title}` : `New Interest: ${service.title}`,
                    isTelugu ? `${req.user.name} మీ సహాయం కోరుతున్నారు.` : `${req.user.name} is interested in your request.`,
                    generateInterestEmailTemplate(service, req.user)
                );
            }

            // Create DB Notification for Creator
            await createNotification(
                service.createdBy,
                {
                    title: 'New Interest',
                    titleTe: 'కొత్త ఆసక్తి',
                    body: `${req.user.name} is interested in: ${service.title}`,
                    bodyTe: `${req.user.name} దీనిపై ఆసక్తి చూపారు: ${service.title}`
                },
                'interest',
                `/service/${service._id}`,
                generateInterestEmailTemplate(service, req.user)
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

        if (service.type !== 'request') {
            return res.status(400).json({ message: 'Completion form is only available for Help Requests' });
        }

        if (service.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the service creator can complete it' });
        }

        // Find provider by unique ID OR Name
        const searchTerm = providerUniqueId.trim();
        const provider = await User.findOne({
            $or: [
                { uniqueId: searchTerm.toUpperCase() },
                { name: { $regex: new RegExp(`^${searchTerm}$`, 'i') } }
            ]
        });

        if (!provider) {
            return res.status(404).json({ message: 'Provider not found with this ID or Name' });
        }

        // Update service
        service.status = 'completed';
        service.completedBy = provider._id;
        service.completedByUniqueId = provider.uniqueId;
        service.completionDate = new Date();
        service.amountSpent = amountSpent || 0;
        service.followUpComplete = true; // INSTANT TERMINATION - stop scheduler reminders

        await service.save();

        // Update provider stats
        provider.impactScore = (provider.impactScore || 0) + 5;
        provider.revenue = (provider.revenue || 0) + (amountSpent || 0);
        await provider.save();

        // Update requester stats (Expenditure)
        const requester = await User.findById(req.user._id);
        if (requester) {
            requester.totalSpent = (requester.totalSpent || 0) + (amountSpent || 0);
            await requester.save();
        }

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
        const amount = amountSpent || 0;
        const isTelugu = req.user.language === 'Telugu';

        if (provider.email) {
            await sendEmail(
                provider.email,
                isTelugu ? `సేవ పూర్తయింది: ${service.title}` : `Service Completed: ${service.title}`,
                isTelugu ? `అభినందనలు! మీ సేవ విజయవంతంగా పూర్తయింది.` : `Congratulations! Your service has been marked as completed.`,
                generateCompletionEmailTemplate(service, provider, amount)
            );
        }

        // Notification for Provider
        await createNotification(
            service.completedBy,
            {
                title: 'Service Completed',
                titleTe: 'సేవ పూర్తయింది',
                body: `Your service "${service.title}" has been completed. Revenue: ₹${amount}`,
                bodyTe: `మీ సేవ "${service.title}" పూర్తయింది. ఆదాయం: ₹${amount}`
            },
            'completion',
            `/service/${service._id}`,
            generateCompletionEmailTemplate(service, provider, amount)
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

// @desc    Get recipients of a service
// @route   GET /api/services/:id/recipients
// @access  Private
const getServiceRecipients = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id)
            .populate('sentTo', 'name uniqueId locality professionCategory profilePhoto phone');

        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        // Only the creator can see the recipient list
        if (service.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(service.sentTo || []);
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
    cancelService,
    getServiceRecipients
};
