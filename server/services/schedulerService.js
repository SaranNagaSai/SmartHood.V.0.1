const Service = require('../models/Service');
const User = require('../models/User');
const { createNotification } = require('../controllers/notificationController');
const { sendFollowUpEmail, generateTerminationEmailTemplate, sendEmail, generateFollowUpEmailTemplate } = require('./emailService');

/**
 * Advanced Scheduler Service with Catch-Up Mechanism
 * 
 * Handles multi-stage follow-up notifications:
 * Stage 0→1: 30 mins after creation
 * Stage 1→2: 1.5 hours after creation (cumulative)
 * Stage 2→3: 2.5 hours after creation (cumulative)
 * Stage 3→4: 8.5 hours after creation (cumulative) → TERMINATION
 * 
 * KEY FIX: Uses absolute time from createdAt (not relative from lastNotificationSentAt)
 * This ensures that even if the Render server sleeps and wakes up hours later,
 * it correctly determines which stage each service should be at and catches up.
 * 
 * Interval: Runs every 5 minutes
 */

// Absolute cumulative thresholds in minutes from service creation
const STAGE_THRESHOLDS = {
    1: 30,       // Stage 0→1: 30 minutes
    2: 90,       // Stage 1→2: 1.5 hours (30 + 60)
    3: 150,      // Stage 2→3: 2.5 hours (30 + 60 + 60)
    4: 210       // Stage 3→4: 3.5 hours (30 + 60 + 60 + 60) → TERMINATION
};

class SchedulerService {
    constructor() {
        this.intervalId = null;
    }

    start() {
        console.log('🕐 Advanced Scheduler started (5-min interval, with catch-up)');

        // Run catch-up immediately on startup to process any missed stages
        this.runCatchUp().then(() => {
            // Then start the regular interval
            this.runChecks();
            this.intervalId = setInterval(() => {
                this.runChecks();
            }, 5 * 60 * 1000);
        });
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            console.log('🛑 Scheduler stopped');
        }
    }

    /**
     * CATCH-UP: Runs on server startup.
     * Finds all services that should be at a later stage based on absolute time
     * since creation, and fast-forwards them to the correct stage.
     */
    async runCatchUp() {
        try {
            console.log('🔄 Running startup catch-up for missed follow-ups...');

            const activeServices = await Service.find({
                type: 'request',
                status: 'active',
                followUpComplete: false
            }).populate('createdBy', 'name email language fcmToken _id');

            const now = new Date();
            let catchUpCount = 0;

            for (const service of activeServices) {
                const user = service.createdBy;
                if (!user) continue;

                const minsFromCreation = Math.floor((now - new Date(service.createdAt)) / 60000);
                const currentStage = service.followUpStage;

                // Determine the correct stage based on absolute time
                let targetStage = 0;
                if (minsFromCreation >= STAGE_THRESHOLDS[4]) targetStage = 4;
                else if (minsFromCreation >= STAGE_THRESHOLDS[3]) targetStage = 3;
                else if (minsFromCreation >= STAGE_THRESHOLDS[2]) targetStage = 2;
                else if (minsFromCreation >= STAGE_THRESHOLDS[1]) targetStage = 1;

                // If we need to advance stages
                if (targetStage > currentStage) {
                    console.log(`🔄 Catch-up: Service ${service._id} at stage ${currentStage}, should be at stage ${targetStage} (${minsFromCreation} mins old)`);

                    // Send only the LATEST missed notification (don't spam all intermediate stages)
                    const isTermination = targetStage >= 4;
                    await this.sendStageNotification(service, user, targetStage, isTermination);

                    // Update to the correct stage
                    service.followUpStage = targetStage;
                    service.lastNotificationSentAt = now;

                    if (isTermination) {
                        service.status = 'unsatisfied';
                        service.followUpComplete = true;
                    }

                    await service.save();
                    catchUpCount++;
                }
            }

            console.log(`✅ Catch-up complete: ${catchUpCount} services updated`);
        } catch (error) {
            console.error('❌ Catch-up error:', error);
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
            const activeServices = await Service.find({
                type: 'request',
                status: 'active',
                followUpComplete: false
            }).populate('createdBy', 'name email language fcmToken _id');

            const now = new Date();

            for (const service of activeServices) {
                const user = service.createdBy;
                if (!user) continue;

                const currentStage = service.followUpStage;
                const minsFromCreation = Math.floor((now - new Date(service.createdAt)) / 60000);

                // Determine next stage based on ABSOLUTE time from creation
                let nextStage = null;
                let isTermination = false;

                if (currentStage === 0 && minsFromCreation >= STAGE_THRESHOLDS[1]) {
                    nextStage = 1;
                } else if (currentStage === 1 && minsFromCreation >= STAGE_THRESHOLDS[2]) {
                    nextStage = 2;
                } else if (currentStage === 2 && minsFromCreation >= STAGE_THRESHOLDS[3]) {
                    nextStage = 3;
                } else if (currentStage === 3 && minsFromCreation >= STAGE_THRESHOLDS[4]) {
                    nextStage = 4;
                    isTermination = true;
                }

                if (nextStage !== null) {
                    console.log(`🔔 Stage ${currentStage}→${nextStage} for service ${service._id} (${minsFromCreation} mins old, Termination: ${isTermination})`);

                    await this.sendStageNotification(service, user, nextStage, isTermination);

                    service.followUpStage = nextStage;
                    service.lastNotificationSentAt = now;

                    if (isTermination) {
                        service.status = 'unsatisfied';
                        service.followUpComplete = true;
                    }

                    await service.save();
                }
            }
        } catch (error) {
            console.error('❌ Follow-up check error:', error);
        }
    }

    /**
     * Send the appropriate notification for a given stage
     */
    async sendStageNotification(service, user, stage, isTermination) {
        const isTelugu = user.language === 'Telugu';

        // Stage-specific bilingual messages
        const stageMessages = {
            1: {
                body: `It's been 30 mins since you requested "${service.title}". Have you found help yet?`,
                bodyTe: `మీరు కోరిన "${service.title}" కి ఇంకా సహాయం అందలేదా?`
            },
            2: {
                body: `1 hour follow-up: Still looking for help with "${service.title}"? SmartHood is broadcasting to nearby pros.`,
                bodyTe: `1 గంట గడిచింది: "${service.title}" కోసం ఇంకా చూస్తున్నారా? స్మార్ట్ హుడ్ చుట్టుపక్కల నిపుణులకు తెలియజేస్తోంది.`
            },
            3: {
                body: `2 hours update: Any luck with "${service.title}"? Don't forget to mark it complete if done!`,
                bodyTe: `2 గంటల అప్‌డేట్: "${service.title}" కి ఎవరైనా స్పందించారా? ఒకవేళ పూర్తయితే దయచేసి మార్క్ చేయండి!`
            },
            4: {
                body: `Your request "${service.title}" was not fulfilled today. Please raise this query again tomorrow.`,
                bodyTe: `మీ అభ్యర్థన "${service.title}" నేడు పూర్తి కాలేదు. రేపు మళ్లీ ప్రయత్నించండి.`
            }
        };

        const msg = stageMessages[stage] || stageMessages[1];

        const notificationData = {
            title: isTermination ? 'Request Expired Today' : 'Service Status Check',
            titleTe: isTermination ? 'అభ్యర్థన గడువు ముగిసింది' : 'సర్వీస్ ఫాలో-అప్',
            body: msg.body,
            bodyTe: msg.bodyTe
        };

        // Generate email template
        let customEmailHtml = null;
        if (isTermination) {
            const term = generateTerminationEmailTemplate(service, user);
            customEmailHtml = term.html;
        } else {
            const followUp = generateFollowUpEmailTemplate(service, user, isTelugu ? msg.bodyTe : msg.body);
            customEmailHtml = followUp.html;
        }

        await createNotification(
            user._id,
            notificationData,
            isTermination ? 'alert' : 'reminder',
            `/service/${service._id}?action=complete`,
            customEmailHtml
        );
    }
}

const schedulerService = new SchedulerService();
module.exports = schedulerService;
