const Service = require('../models/Service');
const User = require('../models/User');
const { createNotification } = require('../controllers/notificationController');
const { sendFollowUpEmail } = require('./emailService');

/**
 * Advanced Scheduler Service
 * Handles multi-stage follow-up notifications:
 * 1. Immediate (Handled by Controller)
 * 2. After 30 mins (Stage 1)
 * 3. After 1 hour (Stage 2)
 * 4. After 1 hour (Stage 3)
 * 5. After 1 hour (Stage 4 - Final)
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
            }).populate('createdBy', 'name email fcmToken');

            const now = new Date();

            for (const service of activeServices) {
                const user = service.createdBy;
                if (!user) continue;

                let shouldNotify = false;
                let message = '';
                let nextStage = service.followUpStage;
                let isFinal = false;

                const lastSent = new Date(service.lastNotificationSentAt || service.createdAt);
                const diffMs = now - lastSent;
                const diffMins = Math.floor(diffMs / 60000);

                // LOGIC MATRIX
                // Stage 0 -> 1 : Requires 30 mins gap from Creation/Last
                if (service.followUpStage === 0) {
                    if (diffMins >= 30) {
                        shouldNotify = true;
                        message = `It's been 30 mins since you requested "${service.title}". Have you found help yet?`;
                        nextStage = 1;
                    }
                }
                // Stage 1 -> 2 : Requires 60 mins gap
                else if (service.followUpStage === 1) {
                    if (diffMins >= 60) {
                        shouldNotify = true;
                        message = `1 hour follow-up: Still looking for help with "${service.title}"? SmartHood is broadcasting to nearby pros.`;
                        nextStage = 2;
                    }
                }
                // Stage 2 -> 3 : Requires 60 mins gap
                else if (service.followUpStage === 2) {
                    if (diffMins >= 60) {
                        shouldNotify = true;
                        message = `2 hours update: Any luck with "${service.title}"? Don't forget to mark it complete if done!`;
                        nextStage = 3;
                    }
                }
                // Stage 3 -> 4 : Requires 60 mins gap
                else if (service.followUpStage === 3) {
                    if (diffMins >= 60) {
                        shouldNotify = true;
                        message = `It's been 3 hours. We hope you got your help! We will check again in 7 days for completion.`;
                        nextStage = 4;
                    }
                }
                // Stage 4 -> 5 : Requires 7 days (10080 mins) gap (Final)
                else if (service.followUpStage === 4) {
                    if (diffMins >= 10080) { // 7 days
                        shouldNotify = true;
                        message = `It's been 7 days since your request "${service.title}". Has the work been completed? Please mark it if done!`;
                        nextStage = 5;
                        isFinal = true;
                    }
                }

                if (shouldNotify) {
                    console.log(`🔔 Sending Stage ${nextStage} notification for ${service._id}`);

                    // Send App Notification
                    await createNotification(
                        user._id,
                        'Service Status Check',
                        message,
                        'reminder',
                        `/service/request/${service._id}`
                    );

                    // Send Email (Optional - maybe reduce frequency or keeping it for all stages for high engagement)
                    if (user.email) {
                        await sendFollowUpEmail(user.email, service.title, `Stage ${nextStage} Check-in`);
                    }

                    // Update Service
                    service.followUpStage = nextStage;
                    service.lastNotificationSentAt = now;
                    if (isFinal) {
                        service.followUpComplete = true;
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
