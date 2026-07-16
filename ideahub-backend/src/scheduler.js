import cron from 'node-cron';
import axios from 'axios';
import RoomPermissionRequest from './models/RoomPermissionRequest.js';
import MachineryRequest from './models/MachineryRequest.js';
import EventNotification from './models/EventNotification.js';
import sendEmail from './utils/sendEmail.js';

// URL provided by the user
const PING_URL = 'https://ideahub-app.onrender.com';

const task = () => {
    // Schedule task to run every 12 minutes
    console.log(`Cron job scheduled: Pinging ${PING_URL} every 12 minutes to keep service active.`);
    
    cron.schedule('*/12 * * * *', async () => {
        try {
            console.log(`[${new Date().toISOString()}] Sending ping to keep service active...`);
            const response = await axios.get(PING_URL);
            console.log(`[${new Date().toISOString()}] Ping successful: Status ${response.status}`);
        } catch (error) {
            console.error(`[${new Date().toISOString()}] Ping failed:`, error.message);
        }
    });

    // Room Permission background worker - runs every hour
    cron.schedule('0 * * * *', async () => {
        try {
            console.log('[Scheduler] Running Room Permission background worker...');
            
            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];
            const currentHour = now.getHours();
            const currentMin = now.getMinutes();
            const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;

            // 1. Auto-complete past bookings
            const activeBookings = await RoomPermissionRequest.find({
                status: { $in: ['Approved', 'Conditional Approval'] }
            });

            let completedCount = 0;
            for (const req of activeBookings) {
                const reqDate = req.schedule.requestedDate;
                const reqEnd = req.schedule.endTime;

                const isPastDate = reqDate < todayStr;
                const isTodayPastTime = reqDate === todayStr && reqEnd <= currentTimeStr;

                if (isPastDate || isTodayPastTime) {
                    req.status = 'Completed';
                    req.approvalHistory.push({
                        date: new Date(),
                        role: 'System',
                        action: 'Completed',
                        remarks: 'Completed automatically after room usage slot passed.',
                        byName: 'System'
                    });
                    await req.save();
                    completedCount++;
                }
            }
            if (completedCount > 0) {
                console.log(`[Scheduler] Auto-completed ${completedCount} room bookings.`);
            }

            // 2. Send 1-day reminders
            const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];

            const reminderBookings = await RoomPermissionRequest.find({
                status: { $in: ['Approved', 'Conditional Approval'] },
                'schedule.requestedDate': tomorrowStr,
                reminderSent: { $ne: true }
            });

            let reminderCount = 0;
            for (const req of reminderBookings) {
                try {
                    const frontendUrl = process.env.FRONTEND_ORIGIN || 'https://ideahub-app.onrender.com';
                    await sendEmail(
                        req.applicantDetails.email,
                        `Booking Reminder: ${req.facilityRequired} - ${req.requestId}`,
                        `<h2>Dear ${req.applicantDetails.applicantName},</h2>
                         <p>This is a reminder that you have an approved booking for the <b>${req.facilityRequired}</b> tomorrow, <b>${req.schedule.requestedDate}</b>.</p>
                         <p><b>Time Slot:</b> ${req.schedule.startTime} - ${req.schedule.endTime}</p>
                         <p><b>Team Name:</b> ${req.teamDetails.teamName}</p>
                         <p><b>Project:</b> ${req.teamDetails.projectName}</p>
                         <br/>
                         <p>Please ensure you bring the official permission PDF and follow all IDEA Hub rules and guidelines during usage.</p>
                         <p>Check booking details and instructions here: <a href="${frontendUrl}/verify-room-permission/${req._id}">View Booking Details</a></p>
                         <br/><p>Regards,<br/> AICTE IDEA Lab Team</p>`
                    );
                    req.reminderSent = true;
                    await req.save();
                    reminderCount++;
                } catch (emailErr) {
                    console.error(`[Scheduler] Failed to send reminder email for ${req.requestId}:`, emailErr);
                }
            }
            if (reminderCount > 0) {
                console.log(`[Scheduler] Sent ${reminderCount} booking reminders.`);
            }

            // 3. Machinery Booking - Auto completion reminders
            const activeMachBookings = await MachineryRequest.find({
                status: { $in: ['Machine Scheduled', 'Active Booking'] },
                completionReminderSent: { $ne: true }
            }).populate('studentId');

            let machineryReminderCount = 0;
            for (const req of activeMachBookings) {
                const primaryMachine = req.requestedMachines?.[0];
                if (primaryMachine && primaryMachine.usageDate && primaryMachine.endTime) {
                    const usageDateStr = new Date(primaryMachine.usageDate).toISOString().split('T')[0];
                    const scheduledEnd = new Date(`${usageDateStr}T${primaryMachine.endTime}:00`);

                    if (now > scheduledEnd) {
                        try {
                            // Send in-app notification with type 'machinery_completion_reminder'
                            await EventNotification.create({
                                user: req.studentId._id || req.studentId,
                                title: 'Have you completed your machine work?',
                                body: `Your booking for "${primaryMachine.machineName}" was scheduled to end at ${primaryMachine.endTime}. Please mark your work as completed or request an extension.`,
                                type: `machinery_completion_reminder:${req._id}`
                            });

                            // Send email
                            if (req.studentId?.email) {
                                const frontendUrl = process.env.FRONTEND_ORIGIN || 'https://ideahub-app.onrender.com';
                                await sendEmail(
                                    req.studentId.email,
                                    `Machinery Booking Completion Reminder - ${req.requestId}`,
                                    `<h2>Dear ${req.studentId.name},</h2>
                                     <p>Your booking slot for the machine <b>${primaryMachine.machineName}</b> has ended.</p>
                                     <p><b>Scheduled Time:</b> ${primaryMachine.startTime} - ${primaryMachine.endTime} on ${new Date(primaryMachine.usageDate).toLocaleDateString()}</p>
                                     <br/>
                                     <p>Please log in to the AICTE IDEA Lab Team portal and confirm if your work is completed to release the machine, or request a booking extension if you need more time.</p>
                                     <p>Mark your work as completed or request an extension here: <a href="${frontendUrl}/verify-request/${req.requestId}">Track Request & Action</a></p>
                                     <br/><p>Regards,<br/>AICTE IDEA Lab Team</p>`
                                );
                            }

                            req.completionReminderSent = true;
                            await req.save();
                            machineryReminderCount++;
                        } catch (err) {
                            console.error(`[Scheduler] Failed to process machinery reminder for ${req.requestId}:`, err);
                        }
                    }
                }
            }
            if (machineryReminderCount > 0) {
                console.log(`[Scheduler] Sent ${machineryReminderCount} machinery completion reminders.`);
            }

        } catch (error) {
            console.error('[Scheduler] Error running Room Permission worker:', error);
        }
    });
};

export default task;

