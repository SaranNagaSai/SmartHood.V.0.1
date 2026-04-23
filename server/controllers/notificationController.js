const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendEmail } = require('../services/emailService');
const admin = require('../config/firebase');
const twilioService = require('../utils/twilioService');
const { translateText } = require('../utils/translationUtility');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json(notification);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user._id, read: false },
            { read: true }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const createNotification = async (userId, data, type = 'system', link = null, emailHtml = null, skipEmail = false, extendedData = null) => {
    try {
        // Support both simple string or bilingual object
        const { title, body, titleTe, bodyTe } = typeof data === 'string' ? { title: data, body: '' } : data;

        console.log(`[Notification] Creating for userId: ${userId}, type: ${type}`);
        const user = await User.findById(userId);
        if (!user) {
            console.error(`[Notification] CRITICAL: User NOT found for ID: ${userId}`);
            return null;
        }

        console.log(`[Notification] 🎯 TARGET: ${user.name} (${user.phone || 'No Phone'}, ${user.email || 'No Email'}, Lang: ${user.language})`);

        const isTelugu = user.language === 'Telugu';
        const targetLang = isTelugu ? 'Telugu' : 'English';

        // Pick best available title/body then translate if necessary
        let finalTitle = isTelugu && titleTe ? titleTe : title;
        let finalBody = isTelugu && bodyTe ? bodyTe : body;

        // Best effort translation for user-provided strings
        finalTitle = translateText(finalTitle, targetLang);
        finalBody = translateText(finalBody, targetLang);

        const notification = await Notification.create({
            userId,
            title: finalTitle,
            body: finalBody,
            type,
            link
        });

        let delivered = false;
        let methods = [];

        // 1. Send Email (Dual Channel)
        if (user.email && !skipEmail) {
            console.log(`📧 [Notification] Attempting email to ${user.email}...`);
            try {
                const emailResult = await sendEmail(user.email, finalTitle, finalBody, emailHtml);
                if (emailResult.success) {
                    delivered = true;
                    methods.push('email');
                    console.log(`✅ [Notification] Email SUCCESS for ${user.email}`);
                } else {
                    console.warn(`⚠️ [Notification] Email REJECTED: ${emailResult.reason || 'Unknown reason'}`);
                }
            } catch (err) {
                console.error(`❌ [Notification] Email ERROR:`, err.message);
            }
        } else {
            console.log(`ℹ️ [Notification] Skipping email for ${user.name} (No email or skipEmail=true)`);
        }

        // 2. Send FCM Push (Dual Channel - to all registered devices)
        const tokens = user.fcmTokens && user.fcmTokens.length > 0 ? user.fcmTokens : (user.fcmToken ? [user.fcmToken] : []);
        
        if (tokens.length > 0) {
            console.log(`📱 [Notification] Attempting push to ${user.name} (${tokens.length} devices)...`);
            
            // Send to each token
            const pushPromises = tokens.map(async (token) => {
                try {
                    await admin.messaging().send({
                        token: token,
                        notification: {
                            title: finalTitle,
                            body: finalBody.substring(0, 200)
                        },
                        webpush: {
                            headers: {
                                Urgency: "high",
                                "TTL": "86400" // 24 hours
                            },
                            notification: {
                                title: finalTitle,
                                body: finalBody.substring(0, 200),
                                icon: '/logo.png',
                                badge: '/logo.png',
                                vibrate: [300, 100, 300, 100, 300],
                                requireInteraction: true, // KEEP ON SCREEN until interact
                                renotify: true,
                                tag: 'smarthood-' + type + '-' + notification._id, // Use notification ID to prevent swapping unless it's an update
                                actions: [
                                    { action: 'open', title: 'Open SmartHood' }
                                ]
                            },
                            fcmOptions: {
                                link: link ? `${process.env.FRONTEND_URL || 'https://smarthood.onrender.com'}${link}` : `${process.env.FRONTEND_URL || 'https://smarthood.onrender.com'}/home`
                            }
                        },
                        android: {
                            priority: 'high',
                            ttl: 86400000, // 24 hours
                            notification: {
                                sound: 'default',
                                priority: 'high',
                                channelId: 'high_priority_alerts', // Must be created on client
                                notificationCount: 1,
                                visibility: 'public', // Show on lock screen
                                sticky: true, // Prevent accidentally swiping away during interaction
                                eventTime: new Date().toISOString()
                            }
                        },
                        data: {
                            url: link || '/home',
                            type: type,
                            notificationId: notification._id.toString()
                        }
                    });
                    return true;
                } catch (fcmError) {
                    console.error(`[Notification] FCM error for token on ${user.name}:`, fcmError.message);
                    // Automatic Cleanup: If token is expired or invalid, remove it
                    if (fcmError.code === 'messaging/registration-token-not-registered' || 
                        fcmError.code === 'messaging/invalid-registration-token') {
                        await User.findByIdAndUpdate(userId, { $pull: { fcmTokens: token } });
                    }
                    return false;
                }
            });

            const results = await Promise.all(pushPromises);
            if (results.some(r => r === true)) {
                delivered = true;
                methods.push('fcm');
                console.log(`[Notification] FCM successful for at least one device of ${user.name}`);
            }
        }


        // 3. Send SMS via Twilio (Parallel Mobile Channel)
        if (user.phone) {
            console.log(`📱 [Notification] Attempting SMS to ${user.phone}...`);
            try {
                let smsBody;

                const typeString = type.toLowerCase();
                const isRichType = ['service', 'alert', 'interlink', 'interest', 'completion', 'complaint'].includes(typeString);

                if (extendedData && isRichType) {
                    const { workTitle, workInfo, workTitleTe, workInfoTe, senderName, senderPhone } = extendedData;

                    // Multilingual Labels
                    const smsLabels = {
                        English: {
                            header: "SmartHood",
                            work: typeString === 'complaint' ? "Category" : (typeString === 'interlink' ? "Profession" : "Work"),
                            info: typeString === 'interlink' ? "Interlink" : "Info",
                            from: "From",
                            alertEnding: "Stay safe and connected with your neighbors.",
                            serviceEnding: "Building a stronger neighborhood together.",
                            generalEnding: "Moving forward together as a community."
                        },
                        Telugu: {
                            header: "SmartHood (స్మార్ట్ హుడ్)",
                            work: typeString === 'complaint' ? "వర్గం" : (typeString === 'interlink' ? "వృత్తి" : "పని"),
                            info: typeString === 'interlink' ? "ఇంటర్‌లింక్" : "వివరాలు",
                            from: "నుండి",
                            alertEnding: "సురక్షితంగా ఉండండి మరియు మీ పొరుగువారితో కనెక్ట్ అవ్వండి.",
                            serviceEnding: "కలిసి పటిష్టమైన సమాజాన్ని నిర్మిద్దాం.",
                            generalEnding: "కమ్యూనిటీగా కలిసి ముందుకు సాగుదాం."
                        }
                    };

                    const lang = user.language === 'Telugu' ? 'Telugu' : 'English';
                    const L = smsLabels[lang];

                    let intelligentEnding = L.generalEnding;
                    if (typeString === 'alert') intelligentEnding = L.alertEnding;
                    else if (typeString === 'service') intelligentEnding = L.serviceEnding;

                    // Localization prioritization with translation fallback
                    const finalWorkTitle = translateText(lang === 'Telugu' ? (workTitleTe || workTitle) : workTitle, lang);
                    const finalWorkInfo = translateText(lang === 'Telugu' ? (workInfoTe || workInfo) : workInfo, lang);
                    const finalSmsTitle = translateText(lang === 'Telugu' && data.titleTe ? data.titleTe : data.title, lang);

                    smsBody = `[SmartHood]\n` +
                        `📍 ${finalSmsTitle}\n` +
                        `📋 ${L.work}: ${finalWorkTitle || (lang === 'Telugu' ? 'సాధారణం' : 'General')}\n` +
                        `📝 ${L.info}: ${finalWorkInfo ? (finalWorkInfo.substring(0, 600) + (finalWorkInfo.length > 600 ? '...' : '')) : 'N/A'}\n` +
                        `👤 ${L.from}: ${senderName || (lang === 'Telugu' ? 'వ్యవస్థ' : 'System')} (${senderPhone || 'N/A'})\n` +
                        `🔗 Log in: https://smarthood.onrender.com\n` +
                        `✨ ${intelligentEnding}`;
                } else if (isRichType) {
                    // Semi-rich format for types without extendedData
                    const header = user.language === 'Telugu' ? '[స్మార్ట్ హుడ్]' : '[SmartHood]';
                    smsBody = `${header}\n` +
                        `📍 ${finalTitle}\n` +
                        `📝 ${finalBody.substring(0, 600)}${finalBody.length > 600 ? '...' : ''}\n` +
                        `🔗 Login: https://smarthood.onrender.com\n` +
                        `✨ Building a better neighborhood.`;
                } else {
                    // Fallback to standard "SmartHood: Title: Body" format
                    const header = user.language === 'Telugu' ? '[స్మార్ట్ హుడ్]' : '[SmartHood]';
                    smsBody = `${header} ${finalTitle}: ${finalBody.length > 400 ? finalBody.substring(0, 397) + '...' : finalBody}\nLogin: https://smarthood.onrender.com`;
                }

                if (!process.env.TWILIO_PHONE_NUMBER) {
                    console.warn('⚠️ [Notification] SMS SKIPPED: TWILIO_PHONE_NUMBER not defined');
                } else {
                    const smsResult = await twilioService.sendDirectSMS(user.phone, smsBody);
                    if (smsResult.success) {
                        delivered = true;
                        methods.push('sms');
                        console.log(`✅ [Notification] SMS SUCCESS for ${user.phone}`);
                    } else {
                        console.warn(`⚠️ [Notification] SMS FAILED:`, smsResult.error);
                    }
                }
            } catch (err) {
                console.error(`❌ [Notification] SMS ERROR:`, err.message);
            }
        }

        if (delivered) {
            notification.delivered = true;
            notification.deliveryMethod = methods.length > 0 ? methods.join('+') : 'none';
            await notification.save();
            console.log(`🏁 [Notification] FINISHED: Delivered via ${notification.deliveryMethod}`);
        } else {
            console.warn(`🏁 [Notification] FINISHED: No channel delivered (methods: ${methods.length})`);
        }

        return notification;
    } catch (error) {
        console.error('[Notification] Error:', error);
        return null;
    }
};

// @desc    Get unread count
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            userId: req.user._id,
            read: false
        });
        res.json({ count });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Send Interlink requests to multiple users
// @route   POST /api/notifications/interlink
// @access  Private
const sendInterlinkRequest = async (req, res) => {
    try {
        const { targetUserIds } = req.body;
        const sender = req.user; // From protect middleware

        if (!targetUserIds || !Array.isArray(targetUserIds) || targetUserIds.length === 0) {
            return res.status(400).json({ message: 'No target users selected' });
        }

        // 1. Construct the Professional Message
        // We get profession info based on category
        let professionStr = sender.professionCategory || 'Professional';
        if (sender.professionCategory === 'Employed') professionStr = sender.professionDetails?.jobRole || 'Employed';
        else if (sender.professionCategory === 'Business') professionStr = sender.professionDetails?.businessType || 'Business';
        else if (sender.professionCategory === 'Student') professionStr = sender.professionDetails?.course || 'Student';

        // 1. Construct the Professional Message (Bilingual Support)
        const isTelugu = sender.language === 'Telugu';

        const title = isTelugu
            ? `SmartHood: ${sender.name} (${sender.locality}, ${sender.town}) మీతో ఇంటర్‌లింక్ అవ్వాలనుకుంటున్నారు 🏠`
            : `SmartHood: ${sender.name} (from ${sender.locality}, ${sender.town}) is willing to interact with you 🏠`;

        const bodyContent = isTelugu
            ? `నమస్కారం! నేను మీ పొరుగునే ఉండే ${sender.name} (${sender.locality}, ${sender.town}). నేను ${professionStr} గా పని చేస్తున్నాను మరియు "ఈ విధంగా" మీతో వృత్తిపరంగా కనెక్ట్ అవ్వాలనుకుంటున్నాను! 🤝`
            : `Hi! I'm your neighbor ${sender.name} from ${sender.locality}, ${sender.town}. I work as a ${professionStr} and I'd like to interact with you "Like this" and establish a professional interlink in our community! 🤝`;

        const emailHtml = `
            <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);">
                <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 40px 30px; text-align: center; color: white;">
                    <div style="background: rgba(255,255,255,0.1); width: 80px; height: 80px; border-radius: 20px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2);">
                        <span style="font-size: 40px;">🤝</span>
                    </div>
                    <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">${isTelugu ? 'కొత్త కనెక్షన్ కోరిక' : 'New Interlink Request'}</h1>
                    <p style="margin: 10px 0 0; opacity: 0.7; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">SmartHood Discovery Hub</p>
                </div>
                
                <div style="padding: 40px; background: white;">
                    <div style="background-color: #f8fafc; padding: 30px; border-radius: 24px; border: 1px solid #f1f5f9; margin-bottom: 30px; text-align: center;">
                        <p style="color: #475569; font-size: 18px; line-height: 1.6; margin: 0; font-style: italic;">
                            ${isTelugu
                                ? `"నమస్కారం! నేను మీ పొరుగునే ఉండే <b>${sender.name}</b>. నేను మీతో <b>"ఈ విధంగా (Like This)"</b> వృత్తిపరంగా కనెక్ట్ అవ్వాలనుకుంటున్నాను మరియు మన కమ్యూనిటీలో పరస్పరం సహకరించుకోవాలనుకుంటున్నాను!"`
                                : `"Hi! I'm your neighbor <b>${sender.name}</b>. I'm willing to interact with you <b>"Like This"</b> and establish a professional interlink to strengthen our community bonds!"`
                            }
                        </p>
                    </div>
                    
                    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 25px; margin-bottom: 30px;">
                        <h3 style="margin: 0 0 20px; color: #0f172a; font-size: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">${isTelugu ? 'పంపినవారి ప్రొఫైల్' : 'Sender Highlight'}</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 10px 0; color: #64748b; font-size: 13px; font-weight: 600;">👤 ${isTelugu ? 'పేరు' : 'Name'}</td>
                                <td style="padding: 10px 0; color: #0f172a; font-size: 15px; font-weight: 700; text-align: right;">${sender.name}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0; color: #64748b; font-size: 13px; font-weight: 600;">💼 ${isTelugu ? 'వృత్తి' : 'Profession'}</td>
                                <td style="padding: 10px 0; color: #3b82f6; font-size: 14px; font-weight: 700; text-align: right;">${professionStr}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0; color: #64748b; font-size: 13px; font-weight: 600;">📍 ${isTelugu ? 'ప్రాంతం' : 'Locality'}</td>
                                <td style="padding: 10px 0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">${sender.locality}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0; color: #64748b; font-size: 13px; font-weight: 600;">🏙️ ${isTelugu ? 'పట్టణం' : 'Town'}</td>
                                <td style="padding: 10px 0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">${sender.town}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <div style="text-align: center;">
                        <a href="${process.env.FRONTEND_URL || 'https://smarthood.onrender.com'}/profile" style="background: #0f172a; color: #ffffff; padding: 18px 40px; border-radius: 50px; font-weight: 700; text-decoration: none; display: inline-block; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); font-size: 14px; letter-spacing: 0.5px;">${isTelugu ? 'ప్రొఫైల్ చూడండి & స్పందించండి' : 'VIEW PROFILE & RESPOND'}</a>
                    </div>
                </div>
                
                <div style="padding: 25px; background: #f8fafc; text-align: center; border-top: 1px solid #f1f5f9;">
                    <p style="color: #94a3b8; font-size: 11px; margin: 0;">
                        ${isTelugu ? 'SmartHood కమ్యూనిటీ నెట్‌వర్క్ ద్వారా పంపబడింది • నేబర్‌హుడ్ ఇంటెలిజెన్స్ సిస్టమ్' : 'Sent via SmartHood Community Network • Neighborhood Intelligence System'}
                    </p>
                </div>
            </div>
        `;

        // 2. Loop through targets and send
        const sendPromises = targetUserIds.map(async (targetId) => {
            // Already includes saving to DB inside createNotification
            // For each target user, create a notification for them (the receiver)
            return createNotification(
                targetId,
                { title, body: bodyContent },
                'interlink',
                '/profile',
                emailHtml,
                false, // Do not skip email
                {
                    workTitle: professionStr,
                    workInfo: bodyContent, // Use the full body content for workInfo
                    senderName: sender.name,
                    senderPhone: sender.phone
                }
            );
        });

        // 3. Send confirmation to Sender (Creator - The "Query Riser")
        sendPromises.push(createNotification(
            sender._id,
            {
                title: isTelugu ? 'ఇంటర్‌లింక్ అభ్యర్థన పంపబడింది 🚀' : 'Interlink Request Sent 🚀',
                body: isTelugu
                    ? `మీ అభ్యర్థన ${targetUserIds.length} మంది పొరుగువారికి పంపబడింది.`
                    : `Your request has been delivered to ${targetUserIds.length} neighbors.`
            },
            'interlink',
            '/home',
            null,
            true, // skipEmail
            {
                workTitle: professionStr,
                workInfo: `Sent to ${targetUserIds.length} neighbors`,
                senderName: 'SmartHood',
                senderPhone: 'Interlink'
            }
        ));

        await Promise.all(sendPromises);

        res.json({ message: `Successfully sent interlink requests to ${targetUserIds.length} neighbors!` });
    } catch (error) {
        console.error('Interlink request error:', error);
        res.status(500).json({ message: 'Failed to send interlink requests' });
    }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json({ message: 'Notification deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    getUnreadCount,
    sendInterlinkRequest
};
