const Service = require('../models/Service');
const User = require('../models/User');
const Revenue = require('../models/Revenue');
const jwt = require('jsonwebtoken');
const { createNotification } = require('./notificationController');
const { sendEmail, generateServiceEmailTemplate, generateInterestEmailTemplate, generateCompletionEmailTemplate } = require('../services/emailService');
const { translateText } = require('../utils/translationUtility');
const { locationMap } = require('../utils/locationMap');

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
            query.$or = [
                { isAdmin: true },
                { _id: { $exists: true } } // effectively all users
            ];
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
            
            // Get bilingual equivalents for more robust matching
            const townTranslations = [trimmedTown];
            for (const [en, te] of Object.entries(locationMap)) {
                if (en.toLowerCase() === trimmedTown.toLowerCase()) townTranslations.push(te);
                else if (te === trimmedTown) townTranslations.push(en);
            }

            // Create a single combined regex for ALL localities and all their language equivalents
            const combinedEquivalents = allCommunities.flatMap(loc => {
                const trimmed = (loc || '').trim();
                const equivalents = [trimmed];
                for (const [en, te] of Object.entries(locationMap)) {
                    if (en.toLowerCase() === trimmed.toLowerCase()) equivalents.push(te);
                    else if (te === trimmed) equivalents.push(en);
                }
                return equivalents;
            });

            // Include Admins Globally + Users in the target town/localities (Bilingual)
            const townRegex = new RegExp(`^\\s*(${townTranslations.join('|')})\\s*$`, 'i');
            const localityRegex = new RegExp(`^\\s*(${combinedEquivalents.join('|')})\\s*$`, 'i');

            query.$or = [
                { isAdmin: true },
                {
                    town: { $regex: townRegex },
                    ...(combinedEquivalents.length > 0 ? {
                        locality: { $regex: localityRegex }
                    } : {})
                }
            ];
        }

        if (targetAudience === 'SPECIFIC' && professionArray.length > 0) {
            console.log(`[Service] Restricting to professions: ${professionArray.join(', ')}`);
            // We must preserve the existing Query (Admins + Town match) AND only including these professions
            query.$and = query.$and || [];
            query.$and.push({
                $or: [
                    { isAdmin: true }, // Admins always get everything
                    {
                        $or: [
                            { professionCategory: { $in: professionArray } },
                            { 'professionDetails.jobRole': { $in: professionArray } },
                            { 'professionDetails.businessType': { $in: professionArray } },
                            { 'professionDetails.course': { $in: professionArray } },
                            { 'professionDetails.description': { $in: professionArray } }
                        ]
                    }
                ]
            });
        }

        const targetUsers = await User.find(query);
        console.log(`[Service Broadcast] Found ${targetUsers.length} target users for ${type}.`);
        console.log(`[Service Broadcast] Query constraints: ${JSON.stringify(query)}`);

        // Store recipient IDs for tracking
        service.sentTo = targetUsers.map(u => u._id);
        await service.save();

        // Personalized Email HTML and Magic Links will be handled inside the loop or per target
        const creatorEmailHtml = generateServiceEmailTemplate(service, user, type.toLowerCase(), true);

        // SEND NOTIFICATIONS IN BACKGROUND (Non-blocking)
        setImmediate(async () => {
            try {
                const totalTargets = targetUsers.length;
                console.log(`🚀 [Background] Starting broadcast for Service ${service._id} (Offer: ${type.toLowerCase() === 'offer'})`);

                // 1. Prepare Content Once
                const isOffer = type.toLowerCase() === 'offer';
                const creatorNotification = {
                    title: isOffer ? 'Your Offer is Live!' : 'Your Request is Live!',
                    titleTe: isOffer ? 'మీ ఆఫర్ ప్రత్యక్ష ప్రసారంలో ఉంది!' : 'మీ అభ్యర్థన ప్రత్యక్ష ప్రసారంలో ఉంది!',
                    body: isOffer
                        ? `Your offer "${title}" has been sent to ${totalTargets} people in your community.`
                        : `Your request "${title}" has been sent to ${totalTargets} people. You'll receive follow-up updates.`,
                    bodyTe: isOffer
                        ? `మీ ఆఫర్ "${title}" మీ కమ్యూనిటీలోని ${totalTargets} మందికి పంపబడింది.`
                        : `మీ అభ్యర్థన "${title}" ${totalTargets} మందికి పంపబడింది. మీకు ఫాలో-అప్ అప్‌డేట్‌లు వస్తాయి.`
                };

                const recipientNotificationData = {
                    title: isOffer ? 'New Service Offer' : 'New Help Request',
                    titleTe: isOffer ? 'కొత్త సర్వీస్ ఆఫర్' : 'కొత్త సహాయం అభ్యర్థన',
                    body: `${user.name} posted: ${title}`,
                    bodyTe: `${user.name} పోస్ట్ చేశారు: ${title}`
                };

                // 2. FIRST PRIORITY: Notify the "Query Raiser" (Creator)
                console.log(`📡 [Notification] Sending confirmation to Query Raiser: ${user.name}`);
                await createNotification(
                    user._id,
                    creatorNotification,
                    'service',
                    `/service/${service._id}`,
                    creatorEmailHtml,
                    false, // Send Email
                    {
                        workTitle: title,
                        workInfo: description,
                        senderName: 'SmartHood System',
                        senderPhone: 'Support'
                    }
                );
                console.log(`✅ [Notification] Query Raiser confirmed via Email/SMS.`);

                // 3. BROADCAST TO TARGET USERS
                console.log(`📡 [Background] Sending to ${totalTargets} recipients...`);
                let successCount = 0;

                // Process in small batches or one by one to avoid overwhelming SMTP
                for (const targetUser of targetUsers) {
                    try {
                        const magicToken = jwt.sign({ id: targetUser._id }, process.env.SMARTHOOD_JWT_SECRET, { expiresIn: '1d' });
                        const magicLink = `${process.env.FRONTEND_URL || 'https://smarthood.onrender.com'}/auto-login/${magicToken}?redirect=${encodeURIComponent(`/service/${service._id}?action=interest`)}`;
                        const personalizedEmailHtml = generateServiceEmailTemplate(service, user, type.toLowerCase(), false, magicLink);

                        await createNotification(
                            targetUser._id,
                            recipientNotificationData,
                            'service',
                            `/service/${service._id}?action=interest`,
                            personalizedEmailHtml,
                            false,
                            {
                                workTitle: title,
                                workInfo: description,
                                senderName: user.name,
                                senderPhone: user.phone
                            }
                        );
                        successCount++;
                    } catch (targetErr) {
                        console.error(`❌ [Background] Failed to notify target ${targetUser._id}:`, targetErr.message);
                    }
                }

                // Broadcast tracking complete
                console.log(`🏁 [Background] Broadcast COMPLETE. Success: ${successCount}/${totalTargets}`);
            } catch (err) {
                console.error('💥 [Background] Critical failure in broadcast loop:', err);
            }
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

        // Get bilingual equivalents for current user's locality to match posts created in either language
        const myLocality = currentUser.locality.trim();
        const localityEquivalents = [myLocality];
        for (const [en, te] of Object.entries(locationMap)) {
            if (en.toLowerCase() === myLocality.toLowerCase()) localityEquivalents.push(te);
            else if (te === myLocality) localityEquivalents.push(en);
        }

        const matchRegex = new RegExp(`^\\s*(${localityEquivalents.join('|')})\\s*$`, 'i');
        
        let query = {
            $or: [
                { locality: { $regex: matchRegex } },
                { targetLocalities: { $regex: matchRegex } },
                { selectedCommunities: { $regex: matchRegex } }
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

            // Also Notify the interested person (Confirmation for them)
            await createNotification(
                req.user._id,
                {
                    title: isTelugu ? 'ఆసక్తి పంపబడింది 🚀' : 'Interest Sent 🚀',
                    body: isTelugu
                        ? `మీరు "${service.title}" పై ఆసక్తిని తెలియజేశారు. కమ్యూనికేషన్ ప్రారంభమైంది.`
                        : `You have expressed interest in "${service.title}". Communication established.`
                },
                'interest',
                `/service/${service._id}`,
                generateInterestEmailTemplate(service, req.user)
            );

            const notificationData = {
                title: 'New Interest',
                titleTe: 'కొత్త ఆసక్తి',
                body: `${req.user.name} is interested in: ${service.title}`,
                bodyTe: `${req.user.name} దీనిపై ఆసక్తి చూపారు: ${service.title}`
            };

            await createNotification(
                service.createdBy,
                notificationData,
                'interest',
                `/service/${service._id}`,
                generateInterestEmailTemplate(service, req.user),
                false, // Send email
                {
                    workTitle: service.title,
                    workInfo: `${req.user.name} expressed interest`,
                    senderName: req.user.name,
                    senderPhone: req.user.phone
                }
            );

            // ADMIN NOTIFICATION (Monitoring)
            setImmediate(async () => {
                try {
                    const admins = await User.find({ isAdmin: true, _id: { $ne: req.user._id } });
                    const creator = await User.findById(service.createdBy);
                    for (const adminUser of admins) {
                        await createNotification(
                            adminUser._id,
                            {
                                title: `Interest Alert: ${service.title}`,
                                titleTe: `ఆసక్తి హెచ్చరిక: ${service.title}`,
                                body: `ADMIN: ${req.user.name} responded to ${creator?.name || 'User'}'s post.`
                            },
                            'interest',
                            `/service/${service._id}`,
                            generateInterestEmailTemplate(service, req.user)
                        );
                    }
                } catch (e) {
                    console.error('Admin broadcast fail:', e);
                }
            });
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

        // Notification for Requester (Confirmation)
        await createNotification(
            req.user._id,
            {
                title: isTelugu ? 'మీ సేవ పూర్తయినట్లు గుర్తించారు ✅' : 'Service Marked Completed ✅',
                body: isTelugu
                    ? `మీరు "${service.title}" పూర్తయినట్లు ధృవీకరించారు. ఖర్చు: ₹${amount}`
                    : `You've confirmed completion of "${service.title}". Total: ₹${amount}`
            },
            'completion',
            `/service/${service._id}`,
            generateCompletionEmailTemplate(service, provider, amount),
            false,
            {
                workTitle: service.title,
                workInfo: `Completed by ${provider.name}. Amount: ₹${amount}`,
                senderName: 'SmartHood',
                senderPhone: 'Finalized'
            }
        );

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
            generateCompletionEmailTemplate(service, provider, amount),
            false,
            {
                workTitle: service.title,
                workInfo: `Achievement unlocked! Revenue: ₹${amount}`,
                senderName: req.user.name,
                senderPhone: req.user.phone
            }
        );

        // ADMIN NOTIFICATION (Monitoring)
        setImmediate(async () => {
            try {
                const admins = await User.find({ isAdmin: true, _id: { $ne: req.user._id } });
                for (const adminUser of admins) {
                    await createNotification(
                        adminUser._id,
                        {
                            title: `ADMIN: Service Finalized`,
                            body: `Platform Event: ${service.title} marked completed. ₹${amount} logged.`
                        },
                        'completion',
                        `/service/${service._id}`,
                        generateCompletionEmailTemplate(service, provider, amount)
                    );
                }
            } catch (e) {
                console.error('Admin completion fail:', e);
            }
        });

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
            .populate('interestedProviders', 'name uniqueId locality professionCategory profilePhoto phone');

        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        // Only the creator can see the list
        if (service.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(service.interestedProviders || []);
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
