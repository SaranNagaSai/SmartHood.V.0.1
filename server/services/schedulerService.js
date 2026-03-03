const Service = require('../models/Service');
const User = require('../models/User');
const { createNotification } = require('../controllers/notificationController');
const { sendFollowUpEmail, generateTerminationEmailTemplate, sendEmail } = require('./emailService');

/**
 * Advanced Scheduler Service
 * Handles multi-stage follow-up notifications:
 * 1. Immediate (Handled by Controller)
 * 2. After 30 mins (Stage 1)
 * 3. After 1 hour (Stage 2)
 * 4. After 1 hour (Stage 3)
 * 5. After 6 hours (Stage 4 - TERMINATION)
 * 
 * Interval: Runs every 5 minutes to ensure timely delivery
 */
class SchedulerService {
    constructor() {
        this.intervalId = null;
    }

    start() {
        console.log('🕐 Advanced Scheduler started (5-min interval)');
        this.runChecks();

        // Run every 5 minutes
        this.intervalId = setInterval(() => {
            this.runChecks();
        }, 5 * 60 * 1000);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            console.log('🛑 Scheduler stopped');
        }
    }

    async runChecks() {
        try {
            console.log(`⏱️ Running scheduled checks at ${new Date().toLocaleTimeString()}`);
            await this.checkServiceFollowUps();
        } catch (error) {
            console.error('❌ Scheduler cycle error:', error);
        }
    }

    async checkServiceFollowUps() {
        try {
            // Find active REQUEST services that haven't completed the cycle
            const activeServices = await Service.find({
                type: 'request',
                status: 'active',
                followUpComplete: false
            }).populate('createdBy', 'name email language fcmToken');

            const now = new Date();

            for (const service of activeServices) {
                const user = service.createdBy;
                if (!user) continue;

                let shouldNotify = false;
                let isTermination = false;
                let message = '';
                let nextStage = service.followUpStage;

                const lastSent = new Date(service.lastNotificationSentAt || service.createdAt);
                const diffMs = now - lastSent;
                const diffMins = Math.floor(diffMs / 60000);

                const isTelugu = user.language === 'Telugu';

                // LOGIC MATRIX
                // Stage 0 -> 1 : 30 mins
                if (service.followUpStage === 0) {
                    if (diffMins >= 30) {
                        shouldNotify = true;
                        message = isTelugu
                            ? `మీరు కోరిన "${service.title}" కి ఇంకా సహాయం అందలేదా?`
                            : `It's been 30 mins since you requested "${service.title}". Have you found help yet?`;
                        nextStage = 1;
                    }
                }
                // Stage 1 -> 2 : 60 mins
                else if (service.followUpStage === 1) {
                    if (diffMins >= 60) {
                        shouldNotify = true;
                        message = isTelugu
                            ? `1 గంట గడిచింది: "${service.title}" కోసం ఇంకా చూస్తున్నారా? స్మార్ట్ హుడ్ చుట్టుపక్కల నిపుణులకు తెలియజేస్తోంది.`
                            : `1 hour follow-up: Still looking for help with "${service.title}"? SmartHood is broadcasting to nearby pros.`;
                        nextStage = 2;
                    }
                }
                // Stage 2 -> 3 : 60 mins
                else if (service.followUpStage === 2) {
                    if (diffMins >= 60) {
                        shouldNotify = true;
                        message = isTelugu
                            ? `2 గంటల అప్‌డేట్: "${service.title}" కి ఎవరైనా స్పందించారా? ఒకవేళ పూర్తయితే దయచేసి మార్క్ చేయండి!`
                            : `2 hours update: Any luck with "${service.title}"? Don't forget to mark it complete if done!`;
                        nextStage = 3;
                    }
                }
                // Stage 3 -> 4 : 360 mins (~6 hours gap, total ~8.5 hours from start) -> TERMINATION
                else if (service.followUpStage === 3) {
                    if (diffMins >= 360) {
                        shouldNotify = true;
                        isTermination = true;
                        message = isTelugu
                            ? `మీ అభ్యర్థన "${service.title}" నేడు పూర్తి కాలేదు. రేపు మళ్లీ ప్రయత్నించండి.`
                            : `Your request "${service.title}" was not fulfilled today. Please rise this query again tomorrow.`;
                        nextStage = 4;
                    }
                }

                if (shouldNotify) {
                    console.log(`🔔 Sending Stage ${nextStage} notification for ${service._id} (Termination: ${isTermination})`);

                    // 1. In-App Notification
                    await createNotification(
                        user._id,
                        isTermination
                            ? (isTelugu ? 'అభ్యర్థన గడువు ముగిసింది' : 'Request Expired Today')
                            : (isTelugu ? 'సర్వీస్ ఫాలో-అప్' : 'Service Status Check'),
                        message,
                        isTermination ? 'alert' : 'reminder',
                        `/service/${service._id}`
                    );

                    // 2. Email Notification
                    if (user.email) {
                        if (isTermination) {
                            const terminationData = generateTerminationEmailTemplate(service, user);
                            await sendEmail(user.email, terminationData.subject, message, terminationData.html);
                        } else {
                            await sendFollowUpEmail(user.email, service.title, `${nextStage} Stages`, user.language);
                        }
                    }

                    // Update Service
                    service.followUpStage = nextStage;
                    service.lastNotificationSentAt = now;

                    if (isTermination) {
                        service.status = 'unsatisfied';
                        service.followUpComplete = true; // No more stages
                    }

                    await service.save();
                }
            }
        } catch (error) {
            console.error('❌ Follow-up check error:', error);
        }
    }
}

const schedulerService = new SchedulerService();
module.exports = schedulerService;
