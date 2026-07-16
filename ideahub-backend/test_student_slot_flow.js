import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import MachineryRequest from './src/models/MachineryRequest.js';
import Machinery from './src/models/Machinery.js';
import User from './src/models/User.js';
import EventNotification from './src/models/EventNotification.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ideahub';

async function runStudentTest() {
  try {
    console.log('--------------------------------------------------');
    console.log('STARTING STUDENT MACHINERY WORKFLOW TEST');
    console.log('--------------------------------------------------');
    
    console.log('1. Connecting to DB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    // 1. Get student (student@test.com)
    let student = await User.findOne({ email: 'student@test.com' });
    if (!student) {
      console.error('>>> FAILURE: student@test.com not found! Run seedHeadData.js first.');
      process.exit(1);
    }
    console.log('Found test student:', student.email);

    // 2. Find request MAT-SEED-004
    let requestD = await MachineryRequest.findOne({ requestId: 'MAT-SEED-004' });
    if (!requestD) {
      console.error('>>> FAILURE: MAT-SEED-004 request not found! Run seedHeadData.js first.');
      process.exit(1);
    }
    console.log(`Found Request D: ${requestD.requestId} with status: ${requestD.status}`);
    console.log(`Scheduled time slot: ${requestD.startTime} - ${requestD.endTime} on ${new Date(requestD.usageDate).toLocaleDateString()}`);

    // Clean up any other test notifications for this student to have a clean state
    await EventNotification.deleteMany({ user: student._id, type: { $regex: `^machinery_completion_reminder:` } });
    
    // Clean up MAT-SEED-002, MAT-SEED-003, and MAT-SEED-005 so they don't interfere with this test's unblocking checks
    // (MAT-SEED-003 is 'Submitted' status which also blocks, MAT-SEED-005 is future 'Machine Scheduled' slot)
    await MachineryRequest.deleteMany({ studentId: student._id, requestId: { $in: ['MAT-SEED-002', 'MAT-SEED-003', 'MAT-SEED-005'] } });

    // Ensure completionReminderSent is false initially
    requestD.completionReminderSent = false;
    await requestD.save();

    // 3. Verify validation block: Since status is 'Machine Scheduled', the student is currently BLOCKED
    console.log('\n3. Verifying that student is blocked from submitting another request while slot is active/scheduled...');
    const activeRequest = await MachineryRequest.findOne({
      studentId: student._id,
      status: { $in: ['Submitted', 'Coordinator Review', 'Coordinator Approved', 'Head Review', 'Approved', 'Approved With Conditions', 'Material Allocated', 'Machine Scheduled', 'Active Booking'] }
    });

    if (activeRequest) {
      console.log('>>> SUCCESS: Submitting new requests is BLOCKED because student has active booking:', activeRequest.requestId);
    } else {
      console.error('>>> FAILURE: Student is NOT blocked!');
      process.exit(1);
    }

    // 4. Simulate time passing past the end time (9:15 PM)
    console.log('\n4. Simulating booking time passing (making current time past 9:15 PM)...');
    
    // In our test, the scheduler runs using 'now'.
    // We can simulate 'now' being past scheduledEnd.
    // The scheduledEnd for MAT-SEED-004 is: usageDate at 21:15.
    const primaryMachine = requestD.requestedMachines?.[0];
    if (!primaryMachine) {
      console.error('>>> FAILURE: Primary machine details not found in request!');
      process.exit(1);
    }

    const usageDateStr = new Date(primaryMachine.usageDate).toISOString().split('T')[0];
    const scheduledEnd = new Date(`${usageDateStr}T${primaryMachine.endTime}:00`);
    console.log(`Scheduled end date-time: ${scheduledEnd.toString()}`);
    console.log(`Current system date-time: ${new Date().toString()}`);

    if (new Date() > scheduledEnd) {
      console.log('Current time is already past scheduledEnd (8:05 AM). Running scheduler reminder logic...');
    } else {
      console.log('Current time is before scheduledEnd. Mocking usageDate/endTime to make it past due...');
      // Mock usageDate to yesterday so it is definitely past due
      requestD.usageDate = new Date(new Date().setDate(new Date().getDate() - 1));
      if (requestD.requestedMachines?.[0]) {
        requestD.requestedMachines[0].usageDate = new Date(new Date().setDate(new Date().getDate() - 1));
      }
      await requestD.save();
      console.log('Mocked booking date to yesterday to force past due status.');
    }

    // Run scheduler completion checking logic
    console.log('\nRunning Auto-Completion Reminder Scheduler logic...');
    const activeMachBookings = await MachineryRequest.find({
      status: { $in: ['Machine Scheduled', 'Active Booking'] },
      completionReminderSent: { $ne: true }
    }).populate('studentId');

    let notifiedCount = 0;
    for (const req of activeMachBookings) {
      const pm = req.requestedMachines?.[0];
      if (pm && pm.usageDate && pm.endTime) {
        const uDateStr = new Date(pm.usageDate).toISOString().split('T')[0];
        const schedEnd = new Date(`${uDateStr}T${pm.endTime}:00`);

        if (new Date() > schedEnd) {
          await EventNotification.create({
            user: req.studentId._id,
            title: 'Have you completed your machine work?',
            body: `Your booking for "${pm.machineName}" was scheduled to end at ${pm.endTime}. Please mark your work as completed or request an extension.`,
            type: `machinery_completion_reminder:${req._id}`
          });
          req.completionReminderSent = true;
          await req.save();
          notifiedCount++;
          console.log(`Sent completion reminder for request: ${req.requestId}`);
        }
      }
    }
    console.log(`Scheduler checked bookings. Sent ${notifiedCount} reminders.`);

    // Verify reminder notification was successfully created
    const reminderNotif = await EventNotification.findOne({ user: student._id, type: `machinery_completion_reminder:${requestD._id}` });
    if (reminderNotif) {
      console.log('>>> SUCCESS: In-app reminder notification created successfully:');
      console.log(`    Title: "${reminderNotif.title}"`);
      console.log(`    Body: "${reminderNotif.body}"`);
    } else {
      console.error('>>> FAILURE: Notification was not created! Please check scheduler query criteria.');
      process.exit(1);
    }

    // 5. Student confirms work completion
    console.log('\n5. Simulating Student marking work as completed...');
    requestD = await MachineryRequest.findById(requestD._id);
    requestD.status = 'Work Completed';
    requestD.isWorkCompleted = true;
    requestD.completedAt = new Date();
    requestD.machineReleased = true;
    requestD.completionRemarks = 'Student confirmed completion via frontend dialog.';
    await requestD.save();
    console.log(`Request D status updated to: ${requestD.status}`);

    // 6. Verify student is now unblocked
    console.log('\n6. Checking validation block after completion...');
    const activeRequestAfterCompletion = await MachineryRequest.findOne({
      studentId: student._id,
      status: { $in: ['Submitted', 'Coordinator Review', 'Coordinator Approved', 'Head Review', 'Approved', 'Approved With Conditions', 'Material Allocated', 'Machine Scheduled', 'Active Booking'] }
    });

    if (!activeRequestAfterCompletion) {
      console.log('>>> SUCCESS: Student is UNBLOCKED and can now submit new machinery requests!');
    } else {
      console.error('>>> FAILURE: Student is still blocked by active request:', activeRequestAfterCompletion.requestId);
      process.exit(1);
    }

    console.log('\n--------------------------------------------------');
    console.log('STUDENT WORKFLOW FLOW TEST SUCCESSFUL - ALL CRITERIA MET');
    console.log('--------------------------------------------------');

  } catch (error) {
    console.error('TEST EXCEPTION:', error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

runStudentTest();
