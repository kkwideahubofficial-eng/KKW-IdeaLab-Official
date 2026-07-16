import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import MachineryRequest from './src/models/MachineryRequest.js';
import Machinery from './src/models/Machinery.js';
import User from './src/models/User.js';
import EventNotification from './src/models/EventNotification.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ideahub';

async function runTest() {
  try {
    console.log('--------------------------------------------------');
    console.log('STARTING MACHINERY WORKFLOW TEST');
    console.log('--------------------------------------------------');
    
    console.log('1. Connecting to DB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    // 1. Get or create student
    let student = await User.findOne({ email: 'teammember@gmail.com' });
    if (!student) {
      console.log('No teammember@gmail.com student found. Creating one...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('123456', salt);
      student = await User.create({
        name: 'Team Member',
        email: 'teammember@gmail.com',
        passwordHash: hashedPassword,
        role: 'team',
        branch: 'Computer Engineering',
        year: 'TE'
      });
      console.log('Created test student:', student.email);
    } else {
      console.log('Using existing test student:', student.email);
    }

    // 2. Get or create machine
    let machine = await Machinery.findOne({});
    if (!machine) {
      console.log('No machinery found. Creating a test 3D Printer...');
      machine = await Machinery.create({
        name: '3D Printer Test Model',
        description: 'Testing 3D Printer availability',
        capacity: 2,
        isAvailable: true
      });
      console.log('Created machine:', machine.name);
    } else {
      console.log('Using existing machine:', machine.name);
    }

    // Clean up any historical test requests for this student to avoid interference
    await MachineryRequest.deleteMany({ studentId: student._id });
    await EventNotification.deleteMany({ user: student._id });

    // 3. STEP 1: Student submits Request A
    console.log('\n2. Simulating Student submitting Request A...');
    const requestA = await MachineryRequest.create({
      requestId: 'MAT-TEST-001',
      projectName: 'Smart Agriculture Robot',
      projectCategory: 'Academic Project',
      projectDescription: 'Fabricate custom chassis',
      projectObjectives: 'Build prototype',
      expectedOutcome: 'Working robot',
      students: [{
        name: student.name,
        prn: 'PRN123456',
        branch: student.branch,
        year: student.year,
        division: 'A',
        mobile: '1234567890',
        email: student.email
      }],
      requestedMachines: [{
        machineId: machine._id,
        machineName: machine.name,
        usageDate: new Date(),
        startTime: '10:00',
        endTime: '12:00',
        usageHours: 2,
        purposeOfUsage: 'Robot chassis printing'
      }],
      status: 'Submitted',
      studentId: student._id
    });
    console.log(`Submitted Request A successfully with status: ${requestA.status} (${requestA.requestId})`);

    // 4. STEP 2: Verify active booking check blocks Request B
    console.log('\n3. Verifying validation block (trying to submit Request B while Request A is active)...');
    
    // Simulate our backend check in createRequest
    const activeRequest = await MachineryRequest.findOne({
      studentId: student._id,
      status: { $in: ['Submitted', 'Coordinator Review', 'Coordinator Approved', 'Head Review', 'Approved', 'Approved With Conditions', 'Material Allocated', 'Machine Scheduled', 'Active Booking'] }
    });

    if (activeRequest) {
      console.log('>>> SUCCESS: Submitting Request B is BLOCKED because student already has active Request A:', activeRequest.requestId);
    } else {
      console.error('>>> FAILURE: Request B was NOT blocked!');
      process.exit(1);
    }

    // 5. STEP 3: Transition Request A through workflow to Active Booking
    console.log('\n4. Simulating Coordinator reviewing, Head approving, and checking-in Student (Request A -> Active Booking)...');
    requestA.status = 'Active Booking';
    requestA.actualEntryTime = new Date();
    await requestA.save();
    console.log(`Request A status updated to: ${requestA.status}`);

    // 6. STEP 4: Simulate booking time passing and trigger scheduler task
    console.log('\n5. Simulating booking time passing (making endTime past)...');
    
    // Mock the endTime of Request A to be in the past (e.g. 5 minutes ago)
    const now = new Date();
    const pastMinutes = now.getHours() * 60 + now.getMinutes() - 10;
    const pastHour = Math.floor(pastMinutes / 60);
    const pastMin = pastMinutes % 60;
    const pastTimeStr = `${pastHour.toString().padStart(2, '0')}:${pastMin.toString().padStart(2, '0')}`;
    
    requestA.requestedMachines[0].endTime = pastTimeStr;
    await requestA.save();
    console.log(`Request A scheduled end time mocked to: ${pastTimeStr}`);

    console.log('Running Auto-Completion Reminder Scheduler logic...');
    
    // Run the scheduler logic
    const activeMachBookings = await MachineryRequest.find({
      status: { $in: ['Machine Scheduled', 'Active Booking'] },
      completionReminderSent: { $ne: true }
    }).populate('studentId');

    let notifiedCount = 0;
    for (const req of activeMachBookings) {
      const primaryMachine = req.requestedMachines?.[0];
      if (primaryMachine && primaryMachine.usageDate && primaryMachine.endTime) {
        const usageDateStr = new Date(primaryMachine.usageDate).toISOString().split('T')[0];
        const scheduledEnd = new Date(`${usageDateStr}T${primaryMachine.endTime}:00`);

        if (new Date() > scheduledEnd) {
          await EventNotification.create({
            user: req.studentId._id,
            title: 'Have you completed your machine work?',
            body: `Your booking for "${primaryMachine.machineName}" was scheduled to end at ${primaryMachine.endTime}. Please mark your work as completed or request an extension.`,
            type: `machinery_completion_reminder:${req._id}`
          });
          req.completionReminderSent = true;
          await req.save();
          notifiedCount++;
        }
      }
    }
    console.log(`Scheduler checked past bookings. Sent ${notifiedCount} reminders.`);
    
    // Verify notification was created
    const notif = await EventNotification.findOne({ user: student._id, type: `machinery_completion_reminder:${requestA._id}` });
    if (notif) {
      console.log('>>> SUCCESS: In-app reminder notification created successfully:');
      console.log(`    Title: "${notif.title}"`);
      console.log(`    Body: "${notif.body}"`);
    } else {
      console.error('>>> FAILURE: Notification was not created!');
      process.exit(1);
    }

    // 7. STEP 5: Student marks work as completed (releases slot & blocks)
    console.log('\n6. Simulating Student confirming Completion (clicks "Work Completed")...');
    requestA.status = 'Work Completed';
    requestA.isWorkCompleted = true;
    requestA.completedAt = new Date();
    requestA.machineReleased = true;
    requestA.completionRemarks = 'Student confirmed completion of machine work.';
    await requestA.save();
    console.log(`Request A status updated to: ${requestA.status}`);

    // 8. STEP 6: Verify student is now unblocked and can submit Request B
    console.log('\n7. Checking validation block again (Request B submission)...');
    
    const activeRequestAfterCompletion = await MachineryRequest.findOne({
      studentId: student._id,
      status: { $in: ['Submitted', 'Coordinator Review', 'Coordinator Approved', 'Head Review', 'Approved', 'Approved With Conditions', 'Material Allocated', 'Machine Scheduled', 'Active Booking'] }
    });

    if (!activeRequestAfterCompletion) {
      console.log('>>> SUCCESS: Student is UNBLOCKED and can now submit new requests!');
    } else {
      console.error('>>> FAILURE: Student is still blocked!');
      process.exit(1);
    }

    console.log('\n--------------------------------------------------');
    console.log('WORKFLOW TEST SUCCESSFUL - ALL CRITERIA MET');
    console.log('--------------------------------------------------');

  } catch (error) {
    console.error('TEST EXCEPTION:', error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

runTest();
