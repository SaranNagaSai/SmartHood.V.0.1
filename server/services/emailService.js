const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');


// Persistent transporter instance
let transporterInstance = null;

// Create transporter - configure with your email service
const createTransporter = () => {
    if (transporterInstance) return transporterInstance;

    const host = process.env.EMAIL_HOST || 'smtp-relay.brevo.com';
    const port = parseInt(process.env.EMAIL_PORT) || 2525;
    const secure = port === 465;

    console.log(`[Email] Creating persistent SMTP Transporter: ${host}:${port} (User: ${process.env.EMAIL_USER ? 'Present' : 'Missing'}, Secure: ${secure})`);

    transporterInstance = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        },
        tls: {
            rejectUnauthorized: false
        },
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        socketTimeout: 20000
    });

    return transporterInstance;
};

const sendEmail = async (to, subject, text, html = null) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            console.error('[Email] ERROR: Credentials not configured');
            return { success: false, reason: 'Email not configured' };
        }

        const transporter = createTransporter();
        const isTelugu = /[\u0C00-\u0C7F]/.test(subject) ||
            html?.includes('నమస్కారం') ||
            html?.includes('స్మార్ట్ హుడ్') ||
            text?.includes('నమస్కారం');

        const subjectPrefix = isTelugu ? '[స్మార్ట్ హుడ్]' : '[SmartHood]';

        const mailOptions = {
            from: `"SmartHood Support" <${process.env.EMAIL_FROM || 'smarthoodc03@gmail.com'}>`,
            replyTo: process.env.EMAIL_FROM || 'smarthoodc03@gmail.com',
            to,
            subject: `${subjectPrefix} ${subject}`,
            text,
            headers: {
                'X-Priority': '1 (Highest)',
                'X-MSMail-Priority': 'High',
                'Importance': 'High',
                'X-Entity-Ref-ID': Date.now().toString(), // Makes each email unique in thread
                'X-Auto-Response-Suppress': 'All'
            },
            html: html || `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
                    <div style="background: #1e3a8a; padding: 30px; text-align: center; color: white;">
                        <h1 style="margin: 0; font-size: 28px;">Smart Hood</h1>
                        <p style="margin: 5px 0 0; opacity: 0.8; font-weight: bold;">${isTelugu ? 'మన పరిసర వేదిక' : 'Your Neighborhood Platform'}</p>
                    </div>
                    <div style="padding: 40px; background: #ffffff; color: #333;">
                        <h2 style="color: #1e3a8a; margin-top: 0;">${subject}</h2>
                        <div style="line-height: 1.6; font-size: 16px;">
                            ${text.split('\n').map(line => `<p>${line}</p>`).join('')}
                        </div>
                    </div>
                    <div style="padding: 20px; background: #f8fafc; text-align: center; border-top: 1px solid #eee;">
                        <p style="color: #64748b; margin: 0; font-size: 13px; font-weight: bold;">
                            <a href="https://smarthood.onrender.com" style="color: #2563eb; text-decoration: none;">Visit: https://smarthood.onrender.com</a>
                        </p>
                        <p style="color: #94a3b8; margin: 10px 0 0; font-size: 12px;">
                            © ${new Date().getFullYear()} SmartHood. All rights reserved.
                        </p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email] SUCCESS: Sent to ${to}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('[Email] FAILED:', error.message);
        return { success: false, error: error.message };
    }
};

const sendWelcomeEmail = async (user) => {
    const isTelugu = user.language === 'Telugu';
    const subject = isTelugu ? `🎉 స్మార్ట్ హుడ్ కు స్వాగతం, ${user.name}!` : `🎉 Welcome to SmartHood, ${user.name}!`;
    const text = isTelugu
        ? `నమస్కారం ${user.name} 🙏,\n\nస్మార్ట్ హుడ్ కు స్వాగతం! మీ రిజిస్ట్రేషన్ పూర్తయింది.\n\nమీ ఐడి: ${user.uniqueId}\n\nలాగిన్ వివరాలు: ${user.phone}`
        : `Namaste ${user.name} 🙏,\n\nWelcome to SmartHood! Your registration is complete.\n\nYour Unique ID: ${user.uniqueId}`;

    const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 40px 25px; text-align: center; color: white;">
                <h1 style="margin: 0;">${isTelugu ? 'స్మార్ట్ హుడ్ కు స్వాగతం' : 'Welcome to SmartHood'}</h1>
                <p>${isTelugu ? 'మన పరిసరాల వేదిక' : 'Your Neighborhood Platform'}</p>
            </div>
            <div style="padding: 40px; background: white; text-align: center;">
                <h2 style="color: #1e3a8a;">${isTelugu ? `నమస్కారం ${user.name}! 🙏` : `Namaste ${user.name}! 🙏`}</h2>
                <p>${isTelugu ? 'ధృవీకరించబడిన కమ్యూనిటీ సభ్యులుగా చేరినందుకు ధన్యవాదాలు.' : 'Thank you for joining our verified community.'}</p>
                <div style="background: #f0f9ff; padding: 20px; border-radius: 12px; margin: 20px 0;">
                    <p style="margin: 0; color: #64748b;">UNIQUE ID</p>
                    <h2 style="margin: 5px 0; color: #0ea5e9;">${user.uniqueId}</h2>
                </div>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 50px; font-weight: bold;">${isTelugu ? 'డాష్‌బోర్డ్ వెళ్ళండి' : 'Go to Dashboard'}</a>
            </div>
            <div style="padding: 20px; background: #f1f5f9; text-align: center;">
                <p style="margin: 0 0 10px; font-weight: bold;">
                   <a href="https://smarthood.onrender.com" style="color: #2563eb; text-decoration: none;">https://smarthood.onrender.com</a>
                </p>
                <p style="font-size: 11px; color: #94a3b8;">© ${new Date().getFullYear()} SmartHood. ${isTelugu ? 'మన పరిసర వేదిక' : 'Your Community Platform'}</p>
            </div>
        </div>
    `;
    return sendEmail(user.email, subject, text, html);
};

const generateServiceEmailTemplate = (service, creator, type, isConfirmation = false) => {
    const isTelugu = creator.language === 'Telugu';
    const isOffer = type === 'offer';
    const actionColor = isOffer ? '#059669' : '#d97706';
    let title = isTelugu
        ? (isOffer ? 'కొత్త సర్వీస్ ఆఫర్' : 'కొత్త సహాయం అభ్యర్థన')
        : (isOffer ? 'New Service Offer' : 'New Help Request');

    if (isConfirmation) {
        title = isTelugu
            ? (isOffer ? 'మీ ఆఫర్ అప్‌డేట్' : 'మీ అభ్యర్థన అప్‌డేట్')
            : (isOffer ? 'Your Offer Update' : 'Your Request Update');
    }

    // Get profession display
    let professionStr = creator.professionCategory || '';
    if (creator.professionCategory === 'Employed') professionStr = creator.professionDetails?.jobRole || 'Employed';
    else if (creator.professionCategory === 'Business') professionStr = creator.professionDetails?.businessType || 'Business';
    else if (creator.professionCategory === 'Student') professionStr = creator.professionDetails?.course || 'Student';

    // Profile photo - use Cloudinary URL directly or generate initial
    const hasPhoto = creator.profilePhoto && creator.profilePhoto.startsWith('http');
    const photoUrl = hasPhoto ? creator.profilePhoto.replace('http:', 'https:') : null;
    const initial = (creator.name || 'U').charAt(0).toUpperCase();

    return `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
            <!-- Header -->
            <div style="background: ${actionColor}; padding: 28px 25px; text-align: center; color: white;">
                <h2 style="margin: 0 0 6px; font-size: 22px; font-weight: 800;">${title}</h2>
                <p style="margin: 0; opacity: 0.9; font-size: 14px;">${isTelugu ? `ప్రాంతం: ${service.locality}` : `Locality: ${service.locality}`}</p>
            </div>

            <div style="padding: 30px;">
                <!-- Service Title & Description -->
                <h3 style="color: #1e293b; margin: 0 0 15px; font-size: 18px; font-weight: 700;">${service.title}</h3>
                <div style="background: #f8fafc; padding: 16px; border-left: 4px solid ${actionColor}; border-radius: 0 8px 8px 0; margin-bottom: 25px;">
                    <p style="margin: 0; color: #475569; line-height: 1.6; font-size: 14px;">${service.description}</p>
                </div>

                <!-- Service Attachments (if any) -->
                ${service.attachments && service.attachments.length > 0 ? `
                    <div style="margin-bottom: 25px; text-align: center;">
                        <p style="margin: 0 0 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; color: #94a3b8;">
                            ${isTelugu ? 'జత చేసిన మీడియా' : 'Attached Media'}
                        </p>
                        <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">
                            ${service.attachments.map(att => {
        const fullAttUrl = att.startsWith('http') ? att : `${process.env.BACKEND_URL || 'https://smarthood.onrender.com'}/${att.replace(/\\/g, '/')}`;
        return `<img src="${fullAttUrl}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0;" />`;
    }).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- Sender Profile Card -->
                <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; text-align: center;">
                    <p style="margin: 0 0 15px; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; color: #94a3b8;">
                        ${isTelugu ? 'పంపినవారి వివరాలు' : 'Sender Details'}
                    </p>

                    <!-- Profile Photo or Initial -->
                    ${photoUrl ? `
                        <div style="margin: 0 auto 12px; width: 80px; height: 80px; border-radius: 50%; overflow: hidden; border: 3px solid ${actionColor}; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                            <img src="${photoUrl}" alt="${creator.name}" style="width: 100%; height: 100%; object-fit: cover;" />
                        </div>
                    ` : `
                        <div style="margin: 0 auto 12px; width: 80px; height: 80px; border-radius: 50%; background: ${actionColor}; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                            <span style="color: white; font-size: 32px; font-weight: 800; line-height: 80px;">${initial}</span>
                        </div>
                    `}

                    <!-- Name -->
                    <h3 style="margin: 0 0 4px; color: #1e293b; font-size: 18px; font-weight: 800;">${creator.name}</h3>

                    <!-- Profession Badge -->
                    ${professionStr ? `
                        <div style="margin: 6px auto 14px;">
                            <span style="background: ${actionColor}15; color: ${actionColor}; padding: 4px 14px; border-radius: 50px; font-size: 12px; font-weight: 700; border: 1px solid ${actionColor}30;">
                                ${professionStr}
                            </span>
                        </div>
                    ` : ''}

                    <!-- Contact Info -->
                    <table style="width: 100%; max-width: 280px; margin: 0 auto; border-collapse: separate; border-spacing: 0 8px;">
                        <tr>
                            <td style="text-align: left; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; padding: 4px 0;">📞 ${isTelugu ? 'ఫోన్' : 'Phone'}</td>
                            <td style="text-align: right; color: #1e293b; font-size: 15px; font-weight: 700; padding: 4px 0;">
                                <a href="tel:${creator.phone}" style="color: #1e293b; text-decoration: none;">${creator.phone}</a>
                            </td>
                        </tr>
                        <tr>
                            <td style="text-align: left; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; padding: 4px 0;">📍 ${isTelugu ? 'ప్రాంతం' : 'Locality'}</td>
                            <td style="text-align: right; color: #1e293b; font-size: 14px; font-weight: 600; padding: 4px 0;">${creator.locality || service.locality}</td>
                        </tr>
                        ${creator.experience ? `
                        <tr>
                            <td style="text-align: left; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; padding: 4px 0;">⭐ ${isTelugu ? 'అనుభవం' : 'Experience'}</td>
                            <td style="text-align: right; color: #1e293b; font-size: 14px; font-weight: 600; padding: 4px 0;">${creator.experience} ${isTelugu ? 'సంవత్సరాలు' : 'Years'}</td>
                        </tr>
                        ` : ''}
                    </table>
                </div>

                <!-- Footer -->
                <div style="text-align: center; margin-top: 25px;">
                    <p style="margin: 0 0 5px; font-weight: 700;">
                        <a href="https://smarthood.onrender.com" style="color: ${actionColor}; text-decoration: none; font-size: 14px;">LOG IN: https://smarthood.onrender.com</a>
                    </p>
                    <p style="text-align: center; color: #94a3b8; font-size: 11px; margin: 0;">
                        ${isTelugu ? 'SmartHood కమ్యూనిటీ నెట్‌వర్క్ ద్వారా పంపబడింది' : 'Sent via SmartHood Community Network'}
                    </p>
                </div>
            </div>
        </div>
    `;
};

const generateInterestEmailTemplate = (service, interestedUser) => {
    const isTelugu = interestedUser.language === 'Telugu';
    const actionColor = '#3b82f6';

    return `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
            <div style="background: ${actionColor}; padding: 25px; text-align: center; color: white;">
                <h2>${isTelugu ? 'కొత్త ఆసక్తి!' : 'New Interest!'}</h2>
            </div>
            <div style="padding: 30px;">
                <p>${isTelugu ? `<strong>${interestedUser.name}</strong> మీ '${service.title}' పై ఆసక్తి చూపారు.` : `<strong>${interestedUser.name}</strong> is interested in '${service.title}'.`}</p>
                <div style="margin-top: 20px; padding: 15px; border: 1px solid #eee;">
                    <strong>${isTelugu ? 'పొరుగువారి పేరు:' : 'Neighbor Name:'}</strong> ${interestedUser.name}<br>
                    <strong>${isTelugu ? 'ఫోన్:' : 'Phone:'}</strong> ${interestedUser.phone}
                </div>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/service/${service._id}" style="background: ${actionColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px;">${isTelugu ? 'వివరాలు చూడండి' : 'Check Details'}</a>
                </div>
            </div>
        </div>
    `;
};

const generateCompletionEmailTemplate = (service, provider, amount) => {
    const isTelugu = provider.language === 'Telugu';
    const actionColor = '#10b981';

    return `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
            <div style="background: ${actionColor}; padding: 25px; text-align: center; color: white;">
                <h2>${isTelugu ? 'సేవ పూర్తయింది!' : 'Service Completed!'}</h2>
            </div>
            <div style="padding: 30px; text-align: center;">
                <h3>${service.title}</h3>
                <div style="font-size: 24px; color: #059669; margin: 15px 0;">₹${amount}</div>
                <p>${isTelugu ? 'నగదు బదిలీ చేయబడింది.' : 'Amount Transferred.'}</p>
                <div style="margin-top: 15px;">
                    <strong>${isTelugu ? 'నిపుణుడు:' : 'Provider:'}</strong> ${provider.name}
                </div>
            </div>
        </div>
    `;
};

const generateAlertEmailTemplate = (alert, sender, isConfirmation = false) => {
    const isTelugu = sender.language === 'Telugu';
    const categoryColors = { 'Emergency': '#dc2626', 'Welfare': '#16a34a', 'Official': '#2563eb', 'General': '#6366f1' };
    const headerColor = categoryColors[alert.category] || '#6366f1';
    const categoryTe = { 'Emergency': 'అత్యవసర', 'Welfare': 'సంక్షేమం', 'Official': 'అధికారిక', 'General': 'సాధారణ' };

    let title = isTelugu ? 'రాష్ట్ర/స్థానిక హెచ్చరిక' : 'Community Alert';
    if (isConfirmation) {
        title = isTelugu ? 'మీ హెచ్చరిక ప్రత్యక్ష ప్రసారంలో ఉంది!' : 'Your Alert is Live!';
    }

    return `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
            <div style="background: ${headerColor}; padding: 25px; text-align: center; color: white;">
                <p>${title}</p>
                <h2>${sender.locality || alert.locality}</h2>
            </div>
            <div style="padding: 30px;">
                <!-- Alert Attachments (if any) -->
                ${alert.attachments && alert.attachments.length > 0 ? `
                    <div style="margin-bottom: 25px; text-align: center;">
                        <p style="margin: 0 0 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; color: #94a3b8;">
                            ${isTelugu ? 'జత చేసిన మీడియా' : 'Attached Media'}
                        </p>
                        <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">
                            ${alert.attachments.map(att => {
        const fullAttUrl = att.startsWith('http') ? att : `${process.env.BACKEND_URL || 'https://smarthood.onrender.com'}/${att.replace(/\\/g, '/')}`;
        return `<img src="${fullAttUrl}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0;" />`;
    }).join('')}
                        </div>
                    </div>
                ` : ''}
                <div style="text-align: center; margin-bottom: 20px;">
                    <span style="background: ${headerColor}20; color: ${headerColor}; padding: 5px 15px; border-radius: 50px; font-weight: bold;">
                        ${isTelugu ? categoryTe[alert.category] || alert.category : alert.category}
                    </span>
                </div>
                <p style="font-size: 16px; line-height: 1.6;">${alert.description}</p>
                <div style="margin-top: 25px; border-top: 1px solid #eee; padding-top: 15px; text-align: center;">
                    <strong>${isTelugu ? 'పంపినవారు:' : 'Sender:'}</strong> ${sender.name} | ${sender.phone}<br>
                    <p style="margin: 15px 0 0; font-weight: bold;">
                        <a href="https://smarthood.onrender.com" style="color: ${headerColor}; text-decoration: none;">TAKE ACTION: https://smarthood.onrender.com</a>
                    </p>
                </div>
            </div>
        </div>
    `;
};

const generateFollowUpEmailTemplate = (service, user, message) => {
    const isTelugu = user.language === 'Telugu';
    const subject = isTelugu ? 'సర్వీస్ ఫాలో-అప్ రిమైండర్' : 'Service Follow-up Reminder';

    return {
        subject,
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
                <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 35px 25px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 28px; letter-spacing: 1px;">Smart Hood</h1>
                    <p style="margin: 5px 0 0; opacity: 0.9; font-weight: 500;">${isTelugu ? 'మన పరిసర వేదిక' : 'Your Neighborhood Platform'}</p>
                </div>
                <div style="padding: 40px 30px; text-align: center;">
                    <div style="background: #f0f9ff; color: #1e3a8a; padding: 12px 20px; border-radius: 50px; display: inline-block; font-size: 14px; font-weight: 700; margin-bottom: 25px; text-transform: uppercase; letter-spacing: 1px;">
                        ${isTelugu ? 'సర్వీస్ ఫాలో-అప్' : 'Service follow-up'}
                    </div>
                    <h3 style="color: #1e293b; font-size: 20px; margin-bottom: 15px;">${service.title}</h3>
                    <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                        ${message}
                    </p>
                    <div style="margin-top: 10px;">
                        <a href="${user._id ? `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auto-login/${jwt.sign({ id: user._id }, process.env.SMARTHOOD_JWT_SECRET, { expiresIn: '1d' })}?redirect=${encodeURIComponent(`/service/${service._id}?action=complete`)}` : `${process.env.FRONTEND_URL || 'http://localhost:5173'}/service/${service._id}?action=complete`}" 
                           style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 16px 35px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2); transition: all 0.3s ease;">
                            ${isTelugu ? 'అప్‌డేట్ చేయండి' : 'Update Status'}
                        </a>
                    </div>
                </div>
                <div style="padding: 25px; background: #f8fafc; text-align: center; border-top: 1px solid #f1f5f9;">
                    <p style="color: #64748b; margin: 0; font-size: 12px;">
                        ${isTelugu
                ? 'మీకు ఈమెయిల్ మీ పరిసరాల వేదిక అయిన స్మార్ట్ హుడ్ నుండి పంపబడినది.'
                : 'The email you received was sent from SmartHood, your neighborhood platform.'}
                    </p>
                    <p style="color: #94a3b8; margin: 10px 0 0; font-size: 12px;">
                        © ${new Date().getFullYear()} SmartHood. All rights reserved.
                    </p>
                </div>
            </div>
        `
    };
};

const sendFollowUpEmail = async (userEmail, serviceName, serviceId, lang = 'English') => {
    const service = { title: serviceName, _id: serviceId };
    const user = { language: lang };
    const isTelugu = lang === 'Telugu';
    const message = isTelugu
        ? `మీరు కోరిన "${serviceName}" కి ఇంకా సహాయం అందలేదా?`
        : `Still haven't received the help you requested for "${serviceName}"?`;

    const { subject, html } = generateFollowUpEmailTemplate(service, user, message);
    return sendEmail(userEmail, subject, message, html);
};

const generateTerminationEmailTemplate = (service, user) => {
    const isTelugu = user.language === 'Telugu';
    const actionColor = '#ef4444'; // Red for termination

    const subject = isTelugu ? 'మీ సర్వీస్ అభ్యర్థన నేడు పూర్తి కాలేదు' : 'Your Service Request Not Fulfilled Today';
    const message = isTelugu
        ? `మీరు కోరిన "${service.title}" సర్వీస్ అభ్యర్థన నేడు పూర్తి కాలేదు. దీనిని మేము ప్రస్తుతానికి ముగిస్తున్నాము (Unsatisfied). ఒకవేళ మీకు ఇంకా సహాయం కావాలంటే రేపు మళ్లీ అదే అభ్యర్థనను పంపండి.`
        : `Your request for "${service.title}" was not fulfilled today. We are marking this task as unsatisfied for now. Please raise this query again tomorrow if you still need help.`;

    return {
        subject,
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
                <div style="background: ${actionColor}; padding: 25px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 24px;">${isTelugu ? 'సర్వీస్ అభ్యర్థన ముగింపు' : 'Task Termination'}</h1>
                </div>
                <div style="padding: 30px; text-align: center;">
                    <div style="background: #fee2e2; color: #b91c1c; padding: 15px; border-radius: 12px; margin-bottom: 20px; font-weight: bold;">
                        ${isTelugu ? 'పని పూర్తి కాలేదు' : 'Status: Unsatisfied'}
                    </div>
                    <h3 style="color: #1e293b; margin-top: 0;">${service.title}</h3>
                    <p style="color: #64748b; line-height: 1.6;">${message}</p>
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                        <a href="${user._id ? `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auto-login/${jwt.sign({ id: user._id }, process.env.SMARTHOOD_JWT_SECRET, { expiresIn: '1d' })}?redirect=/service/request` : `${process.env.FRONTEND_URL || 'http://localhost:5173'}/service/request`}" 
                           style="background: #1e293b; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                            ${isTelugu ? 'రేపు మళ్లీ పంపండి' : 'Try Again Tomorrow'}
                        </a>
                    </div>
                </div>
            </div>
        `
    };
};

module.exports = {
    sendEmail,
    sendWelcomeEmail,
    sendFollowUpEmail,
    generateServiceEmailTemplate,
    generateInterestEmailTemplate,
    generateCompletionEmailTemplate,
    generateAlertEmailTemplate,
    generateTerminationEmailTemplate,
    generateFollowUpEmailTemplate
};
