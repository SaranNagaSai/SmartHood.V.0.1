const nodemailer = require('nodemailer');

// Persistent transporter instance
let transporterInstance = null;

// Create transporter - configure with your email service
const createTransporter = () => {
    if (transporterInstance) return transporterInstance;

    const host = process.env.EMAIL_HOST || 'smtp-relay.brevo.com';
    const port = parseInt(process.env.EMAIL_PORT) || 2525;
    const secure = port === 465;

    console.log(`[Email] Creating persistent SMTP Transporter: ${host}:${port} (User: ${process.env.EMAIL_USER ? 'Present' : 'Missing'}, Secure: ${secure})`);

    // Create transporter with timeouts
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
        // Render optimization: Increase timeouts
        connectionTimeout: 10000, // 10 seconds
        greetingTimeout: 5000,    // 5 seconds
        socketTimeout: 20000      // 20 seconds
    });

    return transporterInstance;
};

// Global verification status logic removed - sendMail will handle connection errors directly

const sendEmail = async (to, subject, text, html = null) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            console.error('[Email] ERROR: Credentials not configured in environment variables');
            return { success: false, reason: 'Email not configured' };
        }

        const transporter = createTransporter();

        // Removed explicit verify() which caused timeouts on Render.
        // transporter.sendMail will attempt connection automatically.

        const mailOptions = {
            // Use authenticated sender email to avoid DMARC 'p=reject' issues
            // Standardizing to smarthoodc03@gmail.com as the primary verified sender
            from: `"SmartHood Notifications" <${process.env.EMAIL_FROM || 'smarthoodc03@gmail.com'}>`,
            replyTo: process.env.EMAIL_FROM || 'smarthoodc03@gmail.com',
            to,
            subject: `[SmartHood] ${subject}`,
            text,
            html: html || `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px; text-align: center; color: white;">
                        <h1 style="margin: 0; font-size: 28px;">Smart Hood</h1>
                        <p style="margin: 5px 0 0; opacity: 0.8; font-weight: bold;">మన పరిసర వేదిక</p>
                    </div>
                    <div style="padding: 40px; background: #ffffff; color: #333;">
                        <h2 style="color: #1e3a8a; margin-top: 0;">${subject}</h2>
                        <div style="line-height: 1.6; font-size: 16px;">
                            ${text.split('\n').map(line => `<p>${line}</p>`).join('')}
                        </div>
                    </div>
                    <div style="padding: 20px; background: #f8fafc; text-align: center; border-top: 1px solid #eee;">
                        <p style="color: #64748b; margin: 0; font-size: 12px;">
                            You received this email from SmartHood, your hyperlocal community platform.
                        </p>
                        <p style="color: #94a3b8; margin: 10px 0 0; font-size: 12px;">
                            © ${new Date().getFullYear()} SmartHood. All rights reserved.
                        </p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email] SUCCESS: Message sent to ${to} (Subject: ${subject})`);
        console.log(`[Email] Info: Accepted: ${info.accepted}, MsgId: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('[Email] FAILED to send email to', to);
        console.error('[Email] Error Stack:', error.stack || error);
        return { success: false, error: error.message, reason: 'SMTP Transport Error' };
    }
};

/**
 * Send welcome email upon registration
 */
const sendWelcomeEmail = async (user) => {
    const subject = '🎉 Welcome to SmartHood! Your Community Awaits 🏠';
    const text = `Namaste ${user.name} 🙏,\n\nWelcome to SmartHood! Your registration is complete.\n\nYour Unique ID: ${user.uniqueId}\n\nLogin with this ID and your phone number: ${user.phone}`;

    const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 40px 25px; text-align: center; color: white;">
                <div style="font-size: 48px; margin-bottom: 10px;">🏠</div>
                <h1 style="margin: 0; font-size: 32px; letter-spacing: -0.5px; font-weight: 800;">Welcome to SmartHood</h1>
                <p style="margin: 10px 0 0; font-size: 18px; opacity: 0.9; font-weight: 500;">మన పరిసరాల వేదిక - మీ చేతుల్లో</p>
                <p style="margin-top: 5px; font-size: 14px; opacity: 0.8;">Verified Hyperlocal Community Platform</p>
            </div>
            
            <div style="padding: 40px 30px; background: #ffffff;">
                <!-- Greeting -->
                <div style="text-align: center; margin-bottom: 30px;">
                    ${user.profilePhoto ? `
                    <img src="${user.profilePhoto.startsWith('http') ? user.profilePhoto : (process.env.CLIENT_URL || 'http://localhost:5173') + user.profilePhoto}" alt="${user.name}" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 4px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin-bottom: 15px; display: inline-block;">
                    ` : ''}
                    <h2 style="color: #1e3a8a; margin: 0; font-size: 24px;">Namaste ${user.name}! 🙏</h2>
                    <p style="color: #64748b; margin-top: 8px; font-size: 16px;">Welcome to the family.</p>
                </div>

                <p style="color: #334155; line-height: 1.7; font-size: 16px; text-align: center;">
                    Congratulations! 🎊 You are now a verified member of the <b>${user.locality}</b> community. 
                    SmartHood helps you connect with neighbors, find local experts, and stay informed about your city.
                </p>
                
                <!-- Credentials Box -->
                <div style="background: #f0f9ff; border: 2px dashed #bae6fd; padding: 25px; border-radius: 16px; margin: 30px 0; text-align: center;">
                    <h3 style="margin: 0 0 15px 0; font-size: 14px; text-transform: uppercase; color: #0284c7; letter-spacing: 1.5px; font-weight: 700;">🔐 Your Login Credentials</h3>
                    
                    <div style="background: white; display: inline-block; padding: 15px 30px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                        <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">UNIQUE ID (Save This)</div>
                        <div style="font-size: 28px; font-family: monospace; font-weight: bold; color: #0ea5e9; letter-spacing: 2px;">${user.uniqueId}</div>
                    </div>

                    <div style="margin-top: 15px; font-size: 15px; color: #334155;">
                        Linked Phone: <b>${user.phone}</b>
                    </div>
                </div>

                <!-- Profile Summary Card -->
                <div style="background: #f8fafc; border-radius: 16px; padding: 25px; margin-bottom: 30px; border: 1px solid #e2e8f0;">
                    <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #334155; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">📋 Your Profile Summary</h3>
                    <table style="width: 100%; border-collapse: separate; border-spacing: 0 8px;">
                        <tr>
                            <td style="color: #64748b; font-size: 14px;">📛 Name</td>
                            <td style="font-weight: 600; color: #1e293b;">${user.name}</td>
                        </tr>
                        <tr>
                            <td style="color: #64748b; font-size: 14px;">📍 Locality</td>
                            <td style="font-weight: 600; color: #1e293b;">${user.locality}, ${user.town}</td>
                        </tr>
                        <tr>
                            <td style="color: #64748b; font-size: 14px;">💼 Profession</td>
                            <td style="font-weight: 600; color: #1e293b;">${user.professionCategory}</td>
                        </tr>
                        ${user.professionDetails?.jobRole ? `
                        <tr>
                            <td style="color: #64748b; font-size: 14px;">🛠️ Role</td>
                            <td style="font-weight: 600; color: #1e293b;">${user.professionDetails.jobRole}</td>
                        </tr>` : ''}
                         ${user.professionDetails?.educationLevel ? `
                        <tr>
                            <td style="color: #64748b; font-size: 14px;">🎓 Education</td>
                            <td style="font-weight: 600; color: #1e293b;">${user.professionDetails.educationLevel}</td>
                        </tr>` : ''}
                    </table>
                </div>

                <!-- Next Steps -->
                <div style="margin-top: 30px;">
                    <h3 style="color: #1e3a8a; font-size: 18px; display: flex; align-items: center; gap: 8px;">
                        <span>🚀</span> What's next? / తర్వాత ఏమిటి?
                    </h3>
                    <ul style="color: #475569; padding-left: 20px; line-height: 1.8;">
                        <li><b>🧭 Explore City:</b> Discover local events and hidden gems.</li>
                        <li><b>🤝 Offer Service:</b> Help neighbors and earn Impact Score.</li>
                        <li><b>📢 Broadcast Alerts:</b> Keep your community safe and informed.</li>
                        <li><b>📊 Activity Dashboard:</b> Track your earnings and community reach.</li>
                    </ul>
                </div>

                <!-- CTA Button -->
                <div style="text-align: center; margin-top: 40px; margin-bottom: 20px;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background: linear-gradient(to right, #2563eb, #1d4ed8); color: white; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4); font-size: 16px;">Login to Your Dashboard &rarr;</a>
                </div>
            </div>

            <!-- Footer -->
            <div style="padding: 30px; background: #f1f5f9; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="color: #64748b; margin: 0; font-size: 14px;">
                    Need help? We're here! <br>
                    <a href="mailto:smarthoodc03@gmail.com" style="color: #2563eb; text-decoration: none; font-weight: 600;">support@smarthood.com</a>
                </p>
                <div style="margin-top: 20px; font-size: 20px;">
                    <span style="margin: 0 10px;">🌐</span>
                    <span style="margin: 0 10px;">🏘️</span>
                    <span style="margin: 0 10px;">🤝</span>
                </div>
                <p style="color: #94a3b8; margin: 20px 0 0; font-size: 11px;">
                    © ${new Date().getFullYear()} SmartHood Community. Verified Hyperlocal Platform.<br>
                    Building safer, smarter neighborhoods together.
                </p>
            </div>
        </div>
    `;

    return sendEmail(user.email, subject, text, html);
};

/**
 * Send service follow-up email
 */
const sendFollowUpEmail = async (userEmail, serviceName, daysAgo) => {
    const subject = 'Service Follow-up Reminder';
    const text = `Hi! You requested "${serviceName}" ${daysAgo} days ago. We want to check if you've found help or still need assistance. Please update your service status in the SmartHood app.`;

    const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
            <div style="background: #f59e0b; padding: 25px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 700;">Service Follow-up</h1>
            </div>
            <div style="padding: 30px;">
                <p style="color: #334155; font-size: 16px; line-height: 1.6;">
                    Hi! You requested <strong>"${serviceName}"</strong> ${daysAgo} days ago.
                </p>
                <p style="color: #334155; font-size: 16px; line-height: 1.6;">
                    We want to check if you've found help or still need assistance. Please update your service status in the SmartHood app.
                </p>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/services" 
                       style="background: #f59e0b; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                        Update Status
                    </a>
                </div>
            </div>
        </div>
    `;

    return sendEmail(userEmail, subject, text, html);
};

// REMOVED old sendCompletionEmail to use generic sendEmail with generated template
// The controller will now call generateCompletionEmailTemplate and then sendEmail directly or via notificationService

/**
 * Generate rich HTML email for service notifications (Broadcast)
 */
const generateServiceEmailTemplate = (service, creator, type) => {
    const isOffer = type === 'offer';
    const actionColor = isOffer ? '#059669' : '#d97706'; // Green for offer, Amber for request
    const actionTitle = isOffer ? 'New Service Offer / కొత్త ఆఫర్' : 'New Help Request / కొత్త అభ్యర్థన';

    return `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
            <!--Header -->
            <div style="background: ${actionColor}; padding: 25px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 700;">${actionTitle}</h1>
                <p style="margin: 5px 0 0; opacity: 0.9;">In your locality: ${service.locality}</p>
            </div>

            <div style="padding: 30px;">
                <!-- 1) Title -->
                <div style="margin-bottom: 20px;">
                    <h2 style="color: #1e293b; margin-top: 0; font-size: 22px; line-height: 1.4;">${service.title}</h2>
                </div>

                <!-- 2) Description -->
                <div style="margin-bottom: 25px;">
                    <strong style="color: #64748b; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">DESCRIPTION / వివరణ</strong>
                    <div style="background: #f8fafc; border-left: 4px solid ${actionColor}; padding: 15px; margin-top: 8px; border-radius: 4px;">
                        <p style="margin: 0; color: #475569; font-style: italic; line-height: 1.6;">
                            "${service.description}"
                        </p>
                    </div>
                </div>

                <!-- 3) Request Raised Info (Creator) -->
                <div style="margin-bottom: 25px;">
                    <strong style="color: #64748b; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">RAISED BY / ద్వారా పోస్ట్ చేయబడింది</strong>
                    <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; margin-top: 8px; background: #fcfcfc; display: flex; align-items: center;">
                        <div style="margin-right: 15px;">
                            ${creator.profilePhoto ? `
                            <img src="${creator.profilePhoto.startsWith('http') ? creator.profilePhoto : (process.env.CLIENT_URL || 'http://localhost:5173') + creator.profilePhoto}" alt="${creator.name}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid #e2e8f0;">
                            ` : `
                            <div style="width: 50px; height: 50px; background: #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; color: #64748b; font-weight: bold;">
                                ${creator.name.charAt(0).toUpperCase()}
                            </div>
                            `}
                        </div>
                        <div>
                            <div style="font-weight: 700; color: #0f172a; font-size: 16px;">${creator.name}</div>
                            <div style="color: #64748b; font-size: 14px;">
                                ${creator.professionCategory} ${!isOffer ? `• ${creator.locality}` : ''}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Action Button -->
                <div style="text-align: center; margin-top: 30px;">
                    <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/service/${service._id}" 
                       style="background: ${actionColor}; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
                        View Request / అభ్యర్థనను చూడండి
                    </a>
                    <p style="margin-top: 15px; font-size: 13px; color: #94a3b8;">
                         Click to view who else has seen this request.
                    </p>
                </div>
            </div>
            
            <!--Footer -->
        <div style="background: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; margin: 0; font-size: 12px;">
                SmartHood Community Notification
            </p>
        </div>
    `;
};

/**
 * Generate rich HTML email for Interest Expression
 */
const generateInterestEmailTemplate = (service, interestedUser) => {
    const actionColor = '#3b82f6'; // Blue

    return `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
            <div style="background: ${actionColor}; padding: 25px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 700;">New Interest! / కొత్త ఆసక్తి</h1>
                <p style="margin: 5px 0 0; opacity: 0.9;">Someone is interested in your request</p>
            </div>

            <div style="padding: 30px;">
                <div style="margin-bottom: 25px;">
                     <p style="color: #334155; font-size: 16px; line-height: 1.6;">
                        Good news! <strong>${interestedUser.name}</strong> has expressed interest in helping you with:
                    </p>
                    <div style="background: #eff6ff; border-left: 4px solid ${actionColor}; padding: 15px; margin: 15px 0; border-radius: 4px;">
                        <h3 style="margin: 0 0 5px 0; color: #1e40af; font-size: 16px;">${service.title}</h3>
                        <p style="margin: 0; color: #475569; font-size: 14px;">"${service.description}"</p>
                    </div>
                </div>

                <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 25px; background: #fcfcfc;">
                    <h3 style="margin: 0 0 15px 0; font-size: 14px; text-transform: uppercase; color: #64748b; letter-spacing: 1px;">Interested User / ఆసక్తిగల వ్యక్తి</h3>
                    <div style="display: flex; align-items: center;">
                         <div style="margin-right: 15px;">
                            ${interestedUser.profilePhoto ? `
                            <img src="${interestedUser.profilePhoto.startsWith('http') ? interestedUser.profilePhoto : (process.env.CLIENT_URL || 'http://localhost:5173') + interestedUser.profilePhoto}" alt="${interestedUser.name}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid #bfdbfe;">
                            ` : `
                            <div style="width: 50px; height: 50px; background: #bfdbfe; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; color: #1e40af; font-weight: bold;">
                                ${interestedUser.name.charAt(0).toUpperCase()}
                            </div>
                            `}
                        </div>
                        <div>
                            <div style="font-weight: 700; color: #0f172a; font-size: 16px;">${interestedUser.name}</div>
                            <div style="color: #64748b; font-size: 14px;">
                                ${interestedUser.professionCategory}
                            </div>
                        </div>
                    </div>
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed #e2e8f0; font-size: 14px; color: #334155;">
                        <div style="margin-bottom: 5px;"><strong>📧 Email:</strong> ${interestedUser.email || 'Not visible'}</div>
                        <div><strong>📞 Phone:</strong> ${interestedUser.phone}</div>
                    </div>
                </div>

                <div style="text-align: center;">
                    <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/service/${service._id}" 
                       style="background: ${actionColor}; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                        View Request / అభ్యర్థనను చూడండి
                    </a>
                </div>
            </div>
             <div style="background: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="color: #64748b; margin: 0; font-size: 12px;">SmartHood Auto-Notification</p>
            </div>
        </div>
    `;
};

/**
 * Generate rich HTML email for Service Completion
 */
const generateCompletionEmailTemplate = (service, provider, amount) => {
    const actionColor = '#10b981'; // Emerald Green

    return `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
            <div style="background: ${actionColor}; padding: 25px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 700;">Service Completed! / సేవ పూర్తయింది</h1>
                <p style="margin: 5px 0 0; opacity: 0.9;">Impact made in ${service.locality}</p>
            </div>

            <div style="padding: 30px;">
                <div style="text-align: center; margin-bottom: 25px;">
                    <div style="font-size: 40px; margin-bottom: 10px;">🎉</div>
                    <h2 style="color: #1e293b; margin: 0; font-size: 20px;">Successful Collaboration!</h2>
                    <p style="color: #64748b; margin-top: 5px;">Your service has been marked as completed.</p>
                </div>

                <div style="background: #ecfdf5; border: 1px dashed #10b981; padding: 20px; text-align: center; border-radius: 12px; margin-bottom: 25px;">
                    <h3 style="margin: 0 0 5px 0; color: #065f46; font-size: 18px;">${service.title}</h3>
                    <p style="font-size: 24px; font-weight: bold; color: #059669; margin: 10px 0;">₹${amount}</p>
                    <p style="margin: 0; color: #047857; font-size: 12px; text-transform: uppercase; font-weight: 600;">TRANSFERRED REVENUE</p>
                </div>

                <div style="border-top: 1px solid #e2e8f0; padding-top: 20px;">
                    <p style="color: #334155; font-size: 14px; text-align: center; margin-bottom: 5px;">
                        Completed by provider / సేవా ప్రదాత:
                    </p>
                    <div style="text-align: center;">
                        ${provider.profilePhoto ? `
                        <img src="${provider.profilePhoto.startsWith('http') ? provider.profilePhoto : (process.env.CLIENT_URL || 'http://localhost:5173') + provider.profilePhoto}" alt="${provider.name}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 3px solid #10b981; margin-bottom: 10px; display: inline-block;">
                        ` : `
                        <div style="width: 60px; height: 60px; background: #ecfdf5; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; color: #059669; font-weight: bold; margin-bottom: 10px;">
                            ${provider.name.charAt(0).toUpperCase()}
                        </div>
                        `}
                        <div style="font-weight: 700; color: #0f172a; font-size: 16px;">
                            ${provider.name}
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="background: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="color: #64748b; margin: 0; font-size: 12px;">Thank you for using SmartHood!</p>
            </div>
        </div>
    `;
};

/**
 * Generate rich HTML email for Alert notifications
 */
const generateAlertEmailTemplate = (alert, sender) => {
    const categoryColors = {
        'Emergency': '#dc2626',      // Red
        'Welfare': '#16a34a',        // Green
        'Official': '#2563eb',       // Blue
        'Entertainment': '#f97316',  // Orange
        'General': '#6366f1'         // Fallback/Legacy
    };
    const headerColor = categoryColors[alert.category] || '#6366f1';

    const categoryTe = {
        'Emergency': 'అత్యవసర',
        'Welfare': 'సంక్షేమం',
        'Official': 'అధికారిక',
        'Entertainment': 'వినోదం',
        'General': 'సాధారణ'
    };

    return `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
            <!-- Header with Locality -->
            <div style="background: ${headerColor}; padding: 30px 25px; text-align: center; color: white;">
                <p style="margin: 0 0 8px 0; font-size: 14px; opacity: 0.9; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">⚠️ Alert from / నుండి హెచ్చరిక</p>
                <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 0.5px;">${sender.locality || alert.locality || 'Your Community'}</h1>
                <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.85;">${sender.town || ''}, ${sender.district || ''}</p>
            </div>

            <div style="padding: 30px;">
                <!-- Alert Category Badge -->
                <div style="text-align: center; margin-bottom: 25px;">
                    <span style="display: inline-block; background: ${headerColor}15; color: ${headerColor}; padding: 8px 20px; border-radius: 50px; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; border: 2px solid ${headerColor}30;">
                        ${alert.category} / ${categoryTe[alert.category] || alert.category}
                        ${alert.subType ? ' — ' + alert.subType : ''}
                    </span>
                </div>

                ${alert.category === 'Emergency' && alert.subType === 'Blood Donation' && alert.bloodGroup ? `
                <!-- Blood Group -->
                <div style="text-align: center; margin-bottom: 25px;">
                    <div style="display: inline-block; background: #fef2f2; border: 2px solid #fecaca; padding: 15px 30px; border-radius: 16px;">
                        <p style="margin: 0 0 5px 0; font-size: 12px; color: #991b1b; text-transform: uppercase; font-weight: 600;">Blood Group Needed / రక్తం కావాలి</p>
                        <p style="margin: 0; font-size: 32px; font-weight: 800; color: #dc2626;">${alert.bloodGroup}</p>
                    </div>
                </div>
                ` : ''}

                <!-- Full Description -->
                <div style="background: #f8fafc; border-left: 4px solid ${headerColor}; padding: 20px; margin-bottom: 25px; border-radius: 0 8px 8px 0;">
                    <h3 style="margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; color: #64748b; letter-spacing: 1px;">Alert Details / వివరాలు</h3>
                    <p style="margin: 0; color: #334155; font-size: 16px; line-height: 1.7; white-space: pre-wrap;">${alert.description}</p>
                </div>

                <!-- Sender Information -->
                <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; background: #fcfcfc;">
                    <h3 style="margin: 0 0 15px 0; font-size: 14px; text-transform: uppercase; color: #64748b; letter-spacing: 1px;">Raised By / ద్వారా పోస్ట్ చేయబడింది</h3>
                    <div style="display: flex; align-items: center;">
                        <div style="margin-right: 15px;">
                            ${sender.profilePhoto ? `
                            <img src="${sender.profilePhoto.startsWith('http') ? sender.profilePhoto : (process.env.CLIENT_URL || 'http://localhost:5173') + sender.profilePhoto}" alt="${sender.name}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid ${headerColor}40;">
                            ` : `
                            <div style="width: 50px; height: 50px; background: ${headerColor}20; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22px; color: ${headerColor}; font-weight: bold;">
                                ${sender.name ? sender.name.charAt(0).toUpperCase() : '?'}
                            </div>
                            `}
                        </div>
                        <div>
                            <div style="font-weight: 700; color: #0f172a; font-size: 18px;">${sender.name}</div>
                            <div style="color: #64748b; font-size: 14px;">${sender.locality || ''}</div>
                        </div>
                    </div>
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed #e2e8f0; font-size: 14px; color: #334155;">
                        <div style="margin-bottom: 8px;">📞 <strong>Phone:</strong> ${sender.phone || 'Not available'}</div>
                        ${sender.email ? `<div>📧 <strong>Email:</strong> ${sender.email}</div>` : ''}
                    </div>
                </div>
            </div>

            <!--Footer -->
        <div style="background: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; margin: 0; font-size: 12px;">
                SmartHood Community Alert • ${sender.locality || alert.locality || 'Your Community'}
            </p>
            <p style="color: #94a3b8; margin: 8px 0 0; font-size: 11px;">
                © ${new Date().getFullYear()} SmartHood. All rights reserved.
            </p>
        </div>
        </div>
    `;
};

module.exports = {
    sendEmail,
    sendWelcomeEmail,
    sendFollowUpEmail,
    generateServiceEmailTemplate,
    generateInterestEmailTemplate,
    generateCompletionEmailTemplate,
    generateAlertEmailTemplate
};
