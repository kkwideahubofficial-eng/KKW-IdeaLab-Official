import RoomPermissionRequest from '../models/RoomPermissionRequest.js';
import User from '../models/User.js';
import EventNotification from '../models/EventNotification.js';
import PushSubscription from '../models/PushSubscription.js';
import sendEmail from '../utils/sendEmail.js';
import webpush from '../config/webPush.js';
import generatePdf from '../utils/pdfGenerator.js';
import path from 'path';
import Room from '../models/Room.js';
import XLSX from 'xlsx';


// Helper utilities for time calculations
function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTimeStr(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function timesOverlap(start1, end1, start2, end2) {
  return parseTimeToMinutes(start1) < parseTimeToMinutes(end2) && 
         parseTimeToMinutes(start2) < parseTimeToMinutes(end1);
}

// Check room capacities
const ROOM_CAPACITIES = {
  'Conference Room': 50,
  'Discussion Room': 15,
  'Ideation Room': 25
};

// Check room equipment inventory counts
const EQUIPMENT_TOTALS = {
  'Projector': 5,
  'Display Screen': 5,
  'Whiteboard': 10,
  'Marker Set': 20,
  'Laptop Connection': 15,
  'Audio System': 5,
  'Extension Board': 20,
  'Internet Access': 100, // virtually unlimited
  'Video Conferencing Setup': 3,
  'Prototype Display Area': 5
};

// In-app Notification helper
async function createInAppNotification(userId, title, body, type = 'room_permission') {
  try {
    await EventNotification.create({
      user: userId,
      title,
      body,
      type
    });
  } catch (err) {
    console.error('Failed to create in-app notification:', err);
  }
}

// Push Notification helper
async function sendPushNotification(userId, title, body) {
  try {
    const subscriptions = await PushSubscription.find({ user: userId });
    if (subscriptions.length > 0) {
      const payload = JSON.stringify({
        title,
        body,
        icon: '/icons/icon-192.png',
      });
      const pushPromises = subscriptions.map(sub => 
        webpush.sendNotification(sub.subscription, payload)
      );
      await Promise.allSettled(pushPromises);
    }
  } catch (err) {
    console.error('Failed to send push notification:', err);
  }
}

// 1. Check Availability & Suggest Nearest Slots
export const checkRoomAvailability = async (req, res) => {
  try {
    const { requestedDate, startTime, endTime, facilityRequired, excludeRequestId } = req.query;

    if (!requestedDate || !startTime || !endTime || !facilityRequired) {
      return res.status(400).json({ message: 'All parameters are required' });
    }

    const durationMins = parseTimeToMinutes(endTime) - parseTimeToMinutes(startTime);
    if (durationMins <= 0) {
      return res.status(400).json({ message: 'Invalid time range: Start Time must be before End Time' });
    }

    // Query active requests for that date and room
    const query = {
      'schedule.requestedDate': requestedDate,
      facilityRequired,
      status: { $in: ['Faculty Verified', 'Coordinator Review', 'Coordinator Approved', 'IDEA Hub Head Review', 'Approved', 'Conditional Approval'] }
    };

    if (excludeRequestId) {
      query._id = { $ne: excludeRequestId };
    }

    const requests = await RoomPermissionRequest.find(query).populate('applicantDetails.requestedBy', 'name');

    // Check overlaps
    let hasConflict = false;
    let conflictDetails = null;

    for (const reqObj of requests) {
      if (timesOverlap(startTime, endTime, reqObj.schedule.startTime, reqObj.schedule.endTime)) {
        // Overlap exists
        if (['Approved', 'Conditional Approval'].includes(reqObj.status)) {
          hasConflict = true;
          conflictDetails = reqObj;
          break;
        }
      }
    }

    if (hasConflict) {
      // Find nearest available slots (09:00 AM to 06:00 PM, i.e., 540 to 1080 mins)
      const suggestions = [];
      const labStart = 540; // 09:00
      const labEnd = 1080;  // 18:00
      
      for (let t = labStart; t <= labEnd - durationMins; t += 30) {
        const potentialStart = minutesToTimeStr(t);
        const potentialEnd = minutesToTimeStr(t + durationMins);
        
        let slotConflict = false;
        for (const reqObj of requests) {
          if (['Approved', 'Conditional Approval'].includes(reqObj.status) &&
              timesOverlap(potentialStart, potentialEnd, reqObj.schedule.startTime, reqObj.schedule.endTime)) {
            slotConflict = true;
            break;
          }
        }
        
        if (!slotConflict) {
          suggestions.push({ startTime: potentialStart, endTime: potentialEnd });
        }
        if (suggestions.length >= 3) break;
      }

      return res.status(200).json({
        available: false,
        status: 'Already Booked',
        message: `${facilityRequired} already booked from ${conflictDetails.schedule.startTime} to ${conflictDetails.schedule.endTime} by ${conflictDetails.applicantDetails.applicantName}`,
        suggestions
      });
    }

    // Otherwise, check if there are pending requests that overlap (Partially Available / Warning)
    const pendingOverlaps = requests.filter(reqObj => 
      ['Faculty Verified', 'Coordinator Review', 'Coordinator Approved', 'IDEA Hub Head Review'].includes(reqObj.status) &&
      timesOverlap(startTime, endTime, reqObj.schedule.startTime, reqObj.schedule.endTime)
    );

    return res.status(200).json({
      available: true,
      status: pendingOverlaps.length > 0 ? 'Partially Available' : 'Room Available',
      message: pendingOverlaps.length > 0 
        ? `Note: There are ${pendingOverlaps.length} pending request(s) overlapping this slot.` 
        : `Room is fully available.`,
      pendingRequestsCount: pendingOverlaps.length
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ message: 'Error checking availability', error: error.message });
  }
};

// 2. Submit / Create Request (Student)
export const createRoomRequest = async (req, res) => {
  try {
    const {
      facilityRequired,
      purpose,
      category,
      applicantDetails,
      teamDetails,
      schedule,
      facultyRecommendation,
      resourceRequirements,
      specialRequirements,
      additionalNotes,
      declaresAgreed,
      status // 'Draft' or 'Submitted'
    } = req.body;

    const studentId = req.user._id;

    // Capacity check
    const roomDoc = await Room.findOne({ name: facilityRequired, isSpecial: true });
    const capacity = roomDoc ? roomDoc.capacity : (ROOM_CAPACITIES[facilityRequired] || 0);
    if (teamDetails.participantsCount > capacity) {
      return res.status(400).json({
        message: `Participant count (${teamDetails.participantsCount}) exceeds room capacity of ${capacity} for ${facilityRequired}.`
      });
    }

    // Calculate Duration
    const startMins = parseTimeToMinutes(schedule.startTime);
    const endMins = parseTimeToMinutes(schedule.endTime);
    const durationHours = (endMins - startMins) / 60;

    if (durationHours <= 0) {
      return res.status(400).json({ message: 'Start time must be before End time.' });
    }

    // Check availability before submitting (prevent overlaps)
    if (status === 'Submitted') {
      const activeQueries = {
        'schedule.requestedDate': schedule.requestedDate,
        facilityRequired,
        status: { $in: ['Approved', 'Conditional Approval'] }
      };
      const conflicts = await RoomPermissionRequest.find(activeQueries);
      const isBooked = conflicts.some(c => timesOverlap(schedule.startTime, schedule.endTime, c.schedule.startTime, c.schedule.endTime));
      if (isBooked) {
        return res.status(409).json({ message: `${facilityRequired} is already booked for the selected date and time range.` });
      }
    }

    // Generate Request ID
    const todayStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const requestId = `REQ-${todayStr}-${randomCode}`;

    const newRequest = new RoomPermissionRequest({
      requestId,
      facilityRequired,
      purpose,
      category,
      applicantDetails: {
        ...applicantDetails,
        requestedBy: studentId
      },
      teamDetails,
      schedule: {
        ...schedule,
        duration: durationHours
      },
      facultyRecommendation: {
        ...facultyRecommendation,
        verified: false
      },
      resourceRequirements,
      specialRequirements,
      additionalNotes,
      declaresAgreed,
      status: status || 'Draft',
      approvalHistory: status === 'Submitted' ? [{
        role: 'Student',
        action: 'Submitted',
        remarks: 'Request submitted, awaiting faculty recommendation.',
        byName: applicantDetails.applicantName,
        date: new Date()
      }] : []
    });

    const savedRequest = await newRequest.save();

    // Trigger Email to Student and Faculty
    if (status === 'Submitted') {
      // Notify Student
      await createInAppNotification(
        studentId,
        'Room Request Submitted',
        `Your request ${requestId} for ${facilityRequired} has been submitted.`
      );

      // Email to student
      try {
        const frontendUrl = process.env.FRONTEND_ORIGIN || 'https://ideahub-app.onrender.com';
        await sendEmail(
          applicantDetails.email,
          `Room Permission Request Submitted - ${requestId}`,
          `<h2>Dear ${applicantDetails.applicantName},</h2>
           <p>Your special room permission request for <b>${facilityRequired}</b> on <b>${schedule.requestedDate}</b> has been submitted successfully.</p>
           <p><b>Request ID:</b> ${requestId}</p>
           <p>We have forwarded a recommendation request to your faculty advisor <b>${facultyRecommendation.facultyName}</b>. Once they verify it, the request will proceed to the Coordinator.</p>
           <p>You can view the real-time status and details of your request here: <a href="${frontendUrl}/verify-room-permission/${savedRequest._id}">View Request Details</a></p>
           <br/><p>Regards,<br/>IDEA Hub Admin</p>`
        );
      } catch (err) {
        console.error('Failed to send student confirmation email:', err);
      }

      // Email to Faculty
      try {
        const frontendUrl = process.env.FRONTEND_ORIGIN || 'https://ideahub-app.onrender.com';
        const verifyLink = `${frontendUrl}/verify-faculty/${savedRequest._id}`; // Redirect to frontend port 8080
        await sendEmail(
          facultyRecommendation.facultyEmail,
          `IDEA Hub Room Permission Recommendation Required - ${requestId}`,
          `<h2>Dear Prof. ${facultyRecommendation.facultyName},</h2>
           <p>Your student <b>${applicantDetails.applicantName}</b> has requested permission to book the <b>${facilityRequired}</b> for <b>${teamDetails.projectName}</b>.</p>
           <p><b>Date:</b> ${schedule.requestedDate}</p>
           <p><b>Time Slot:</b> ${schedule.startTime} - ${schedule.endTime} (${durationHours} hours)</p>
           <p><b>Purpose:</b> ${purpose}</p>
           <p>They require your recommendation and digital confirmation to proceed to the Coordinator review stage.</p>
           <br/>
           <p><a href="${verifyLink}" style="display:inline-block;padding:10px 20px;background-color:#1a237e;color:#ffffff;text-decoration:none;border-radius:4px;font-weight:bold;">Review & Verify Request</a></p>
           <br/>
           <p>Or copy this link: ${verifyLink}</p>
           <br/><p>Regards,<br/>IDEA Hub System</p>`
        );
      } catch (err) {
        console.error('Failed to send faculty verification email:', err);
      }

      // Notify Coordinator and Head
      try {
        const frontendUrl = process.env.FRONTEND_ORIGIN || 'https://ideahub-app.onrender.com';
        const admins = await User.find({ role: { $in: ['coordinator', 'head'] } });
        for (const admin of admins) {
          const dashboardPath = admin.role === 'head' ? '/head-dashboard' : '/coordinator/room-permissions';
          await sendEmail(
            admin.email,
            `New Room Permission Request - ${requestId}`,
            `<h2>Dear ${admin.name},</h2>
             <p>A new room permission request <b>${requestId}</b> for <b>${facilityRequired}</b> has been submitted by <b>${applicantDetails.applicantName}</b>.</p>
             <p>It is currently awaiting Faculty Verification.</p>
             <p>Review and process this request directly: <a href="${frontendUrl}${dashboardPath}">Go to Dashboard Review</a></p>
             <br/><p>Regards,<br/>IDEA Hub System</p>`
          );
        }
      } catch (err) {
        console.error('Failed to send admin email:', err);
      }
    }

    res.status(201).json(savedRequest);
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(500).json({ message: 'Error creating room request', error: error.message });
  }
};

// 3. Update Request (Draft)
export const updateRoomRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      facilityRequired,
      purpose,
      category,
      applicantDetails,
      teamDetails,
      schedule,
      facultyRecommendation,
      resourceRequirements,
      specialRequirements,
      additionalNotes,
      declaresAgreed,
      status
    } = req.body;

    const request = await RoomPermissionRequest.findById(id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'Draft') {
      return res.status(400).json({ message: 'Only Draft requests can be edited.' });
    }

    // Capacity check
    const roomDoc = await Room.findOne({ name: facilityRequired, isSpecial: true });
    const capacity = roomDoc ? roomDoc.capacity : (ROOM_CAPACITIES[facilityRequired] || 0);
    if (teamDetails.participantsCount > capacity) {
      return res.status(400).json({
        message: `Participant count (${teamDetails.participantsCount}) exceeds room capacity of ${capacity} for ${facilityRequired}.`
      });
    }

    const startMins = parseTimeToMinutes(schedule.startTime);
    const endMins = parseTimeToMinutes(schedule.endTime);
    const durationHours = (endMins - startMins) / 60;

    request.facilityRequired = facilityRequired;
    request.purpose = purpose;
    request.category = category;
    request.applicantDetails = {
      ...applicantDetails,
      requestedBy: request.applicantDetails.requestedBy || req.user._id
    };
    request.teamDetails = teamDetails;
    request.schedule = { ...schedule, duration: durationHours };
    request.facultyRecommendation = {
      ...facultyRecommendation,
      verified: request.facultyRecommendation.verified,
      verifiedAt: request.facultyRecommendation.verifiedAt
    };
    request.resourceRequirements = resourceRequirements;
    request.specialRequirements = specialRequirements;
    request.additionalNotes = additionalNotes;
    request.declaresAgreed = declaresAgreed;
    
    if (status === 'Submitted') {
      request.status = 'Submitted';
      request.approvalHistory.push({
        role: 'Student',
        action: 'Submitted',
        remarks: 'Request submitted, awaiting faculty recommendation.',
        byName: applicantDetails.applicantName,
        date: new Date()
      });

      // Email Faculty
      try {
        const frontendUrl = process.env.FRONTEND_ORIGIN || 'https://ideahub-app.onrender.com';
        const verifyLink = `${frontendUrl}/verify-faculty/${request._id}`;
        await sendEmail(
          facultyRecommendation.facultyEmail,
          `IDEA Hub Room Permission Recommendation Required - ${request.requestId}`,
          `<h2>Dear Prof. ${facultyRecommendation.facultyName},</h2>
           <p>Your student <b>${applicantDetails.applicantName}</b> has requested permission to book the <b>${facilityRequired}</b> for <b>${teamDetails.projectName}</b>.</p>
           <p><b>Date:</b> ${schedule.requestedDate}</p>
           <p><b>Time Slot:</b> ${schedule.startTime} - ${schedule.endTime} (${durationHours} hours)</p>
           <br/>
           <p><a href="${verifyLink}" style="display:inline-block;padding:10px 20px;background-color:#1a237e;color:#ffffff;text-decoration:none;border-radius:4px;font-weight:bold;">Review & Verify Request</a></p>
           <br/><p>Regards,<br/>IDEA Hub System</p>`
        );
      } catch (err) {
        console.error('Failed to send faculty email:', err);
      }

      // Notify Coordinator and Head
      try {
        const frontendUrl = process.env.FRONTEND_ORIGIN || 'https://ideahub-app.onrender.com';
        const admins = await User.find({ role: { $in: ['coordinator', 'head'] } });
        for (const admin of admins) {
          const dashboardPath = admin.role === 'head' ? '/head-dashboard' : '/coordinator/room-permissions';
          await sendEmail(
            admin.email,
            `Resubmitted Room Permission Request - ${request.requestId}`,
            `<h2>Dear ${admin.name},</h2>
             <p>The room permission request <b>${request.requestId}</b> has been resubmitted with updates by <b>${applicantDetails.applicantName}</b>.</p>
             <p>It is currently awaiting Faculty Verification.</p>
             <p>Review and process this request directly: <a href="${frontendUrl}${dashboardPath}">Go to Dashboard Review</a></p>
             <br/><p>Regards,<br/>IDEA Hub System</p>`
          );
        }
      } catch (err) {
        console.error('Failed to send admin email:', err);
      }
    }

    await request.save();
    res.status(200).json(request);
  } catch (error) {
    res.status(500).json({ message: 'Error updating request', error: error.message });
  }
};

// 3.5 Submit Draft Request
export const submitDraftRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    const request = await RoomPermissionRequest.findById(id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'Draft') {
      return res.status(400).json({ message: 'Only Draft requests can be submitted this way.' });
    }

    // Validate required fields
    if (!request.facilityRequired) return res.status(400).json({ message: 'Facility is required.' });
    if (!request.schedule?.requestedDate || !request.schedule?.startTime || !request.schedule?.endTime) {
      return res.status(400).json({ message: 'Complete schedule is required to submit the request.' });
    }
    if (!request.applicantDetails?.applicantName || !request.applicantDetails?.email || !request.applicantDetails?.mobile) {
      return res.status(400).json({ message: 'Applicant details are incomplete.' });
    }
    if (!request.facultyRecommendation?.facultyName || !request.facultyRecommendation?.facultyEmail) {
      return res.status(400).json({ message: 'Faculty recommendation details are incomplete.' });
    }

    // Fix for older drafts that might have lost their requestedBy field
    if (!request.applicantDetails.requestedBy) {
      request.applicantDetails.requestedBy = req.user._id;
    }

    // Capacity check
    const roomDoc = await Room.findOne({ name: request.facilityRequired, isSpecial: true });
    const capacity = roomDoc ? roomDoc.capacity : (ROOM_CAPACITIES[request.facilityRequired] || 0);
    if (request.teamDetails?.participantsCount > capacity) {
      return res.status(400).json({
        message: `Participant count (${request.teamDetails.participantsCount}) exceeds room capacity of ${capacity} for ${request.facilityRequired}.`
      });
    }

    // Check availability
    const activeQueries = {
      'schedule.requestedDate': request.schedule.requestedDate,
      facilityRequired: request.facilityRequired,
      status: { $in: ['Approved', 'Conditional Approval'] }
    };
    const conflicts = await RoomPermissionRequest.find(activeQueries);
    const isBooked = conflicts.some(c => timesOverlap(request.schedule.startTime, request.schedule.endTime, c.schedule.startTime, c.schedule.endTime));
    if (isBooked) {
      return res.status(409).json({ message: `${request.facilityRequired} is already booked for the selected date and time range.` });
    }

    request.status = 'Submitted';
    request.approvalHistory.push({
      role: 'Student',
      action: 'Submitted',
      remarks: 'Request submitted from draft, awaiting faculty recommendation.',
      byName: request.applicantDetails?.applicantName || 'Student',
      date: new Date()
    });

    // Notify Student
    await createInAppNotification(
      request.applicantDetails.requestedBy,
      'Room Request Submitted',
      `Your request ${request.requestId} for ${request.facilityRequired} has been submitted.`
    );

    // Email Faculty
    try {
      const frontendUrl = process.env.FRONTEND_ORIGIN || 'https://ideahub-app.onrender.com';
      const verifyLink = `${frontendUrl}/verify-faculty/${request._id}`;
      await sendEmail(
        request.facultyRecommendation.facultyEmail,
        `IDEA Hub Room Permission Recommendation Required - ${request.requestId}`,
        `<h2>Dear Prof. ${request.facultyRecommendation.facultyName},</h2>
         <p>Your student <b>${request.applicantDetails.applicantName}</b> has requested permission to book the <b>${request.facilityRequired}</b> for <b>${request.teamDetails.projectName}</b>.</p>
         <p><b>Date:</b> ${request.schedule.requestedDate}</p>
         <p><b>Time Slot:</b> ${request.schedule.startTime} - ${request.schedule.endTime}</p>
         <br/>
         <p><a href="${verifyLink}" style="display:inline-block;padding:10px 20px;background-color:#1a237e;color:#ffffff;text-decoration:none;border-radius:4px;font-weight:bold;">Review & Verify Request</a></p>
         <br/><p>Regards,<br/>IDEA Hub System</p>`
      );
    } catch (err) {
      console.error('Failed to send faculty email:', err);
    }

    // Notify Coordinator and Head
    try {
      const frontendUrl = process.env.FRONTEND_ORIGIN || 'https://ideahub-app.onrender.com';
      const admins = await User.find({ role: { $in: ['coordinator', 'head'] } });
      for (const admin of admins) {
        const dashboardPath = admin.role === 'head' ? '/head-dashboard' : '/coordinator/room-permissions';
        await sendEmail(
          admin.email,
          `New Room Permission Request - ${request.requestId}`,
          `<h2>Dear ${admin.name},</h2>
           <p>A new room permission request <b>${request.requestId}</b> for <b>${request.facilityRequired}</b> has been submitted by <b>${request.applicantDetails.applicantName}</b>.</p>
           <p>It is currently awaiting Faculty Verification.</p>
           <p>Review and process this request directly: <a href="${frontendUrl}${dashboardPath}">Go to Dashboard Review</a></p>
           <br/><p>Regards,<br/>IDEA Hub System</p>`
        );
      }
    } catch (err) {
      console.error('Failed to send admin email:', err);
    }

    await request.save();
    res.status(200).json(request);
  } catch (error) {
    res.status(500).json({ message: 'Error submitting draft request', error: error.message });
  }
};


// 4. Faculty Verification Workflow (Public endpoint)
export const facultyVerifyRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, remarks } = req.body; // action: 'verify' or 'decline'

    const request = await RoomPermissionRequest.findById(id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (request.status !== 'Submitted') {
      return res.status(400).json({ message: 'Request is not in a verification state.' });
    }

    if (action === 'verify') {
      request.status = 'Coordinator Review';
      request.facultyRecommendation.verified = true;
      request.facultyRecommendation.verifiedAt = new Date();
      request.facultyRecommendation.facultyRemarks = remarks || 'Recommended';
      
      request.approvalHistory.push({
        role: 'Faculty',
        action: 'Verified',
        remarks: remarks || 'Recommended by Faculty.',
        byName: request.facultyRecommendation.facultyName,
        date: new Date()
      });

      await request.save();

      // Notify Student
      await createInAppNotification(
        request.applicantDetails.requestedBy,
        'Faculty Recommended Request',
        `Prof. ${request.facultyRecommendation.facultyName} has verified and recommended your request ${request.requestId}.`
      );

      // Email Student
      try {
        const frontendUrl = process.env.FRONTEND_ORIGIN || 'https://ideahub-app.onrender.com';
        await sendEmail(
          request.applicantDetails.email,
          `Faculty Recommended Request - ${request.requestId}`,
          `<h2>Dear ${request.applicantDetails.applicantName},</h2>
           <p>Your room request <b>${request.requestId}</b> has been recommended by <b>Prof. ${request.facultyRecommendation.facultyName}</b>.</p>
           <p><b>Remarks:</b> ${remarks || 'None'}</p>
           <p>The request is now pending with the Coordinator for review.</p>
           <p>Track your request status here: <a href="${frontendUrl}/verify-room-permission/${request._id}">View Request Details</a></p>
           <br/><p>Regards,<br/>IDEA Hub Admin</p>`
        );
      } catch (err) {
        console.error('Email error:', err);
      }

      // Notify Coordinators (Find users with role 'coordinator')
      const coordinators = await User.find({ role: 'coordinator' });
      for (const coord of coordinators) {
        await createInAppNotification(
          coord._id,
          'New Room Request Awaiting Review',
          `Room Permission Request ${request.requestId} is verified by faculty and awaits your review.`
        );
        try {
          const frontendUrl = process.env.FRONTEND_ORIGIN || 'https://ideahub-app.onrender.com';
          await sendEmail(
            coord.email,
            `Action Required: Room Permission Request - ${request.requestId}`,
            `<h2>Dear ${coord.name},</h2>
             <p>The room permission request <b>${request.requestId}</b> has been verified by the Faculty and is now awaiting your review.</p>
             <p>Review and process this request directly: <a href="${frontendUrl}/coordinator/room-permissions">Go to Coordinator Dashboard</a></p>
             <br/><p>Regards,<br/>IDEA Hub System</p>`
          );
        } catch (err) {
          console.error('Failed to send coordinator email:', err);
        }
      }
    } else {
      // Declined by Faculty
      request.status = 'Rejected';
      request.facultyRecommendation.verified = false;
      request.facultyRecommendation.facultyRemarks = remarks || 'Declined by Faculty';
      request.approvalHistory.push({
        role: 'Faculty',
        action: 'Rejected',
        remarks: remarks || 'Declined by Faculty.',
        byName: request.facultyRecommendation.facultyName,
        date: new Date()
      });

      await request.save();

      // Notify Student
      await createInAppNotification(
        request.applicantDetails.requestedBy,
        'Room Request Declined by Faculty',
        `Prof. ${request.facultyRecommendation.facultyName} has declined to recommend request ${request.requestId}.`
      );

      // Email Student
      try {
        const frontendUrl = process.env.FRONTEND_ORIGIN || 'https://ideahub-app.onrender.com';
        await sendEmail(
          request.applicantDetails.email,
          `Request Declined by Faculty - ${request.requestId}`,
          `<h2>Dear ${request.applicantDetails.applicantName},</h2>
           <p>Your room request <b>${request.requestId}</b> has been declined by <b>Prof. ${request.facultyRecommendation.facultyName}</b>.</p>
           <p><b>Remarks/Reason:</b> ${remarks || 'None'}</p>
           <p>View request details and history here: <a href="${frontendUrl}/verify-room-permission/${request._id}">View Request Details</a></p>
           <br/><p>Regards,<br/>IDEA Hub System</p>`
        );
      } catch (err) {
        console.error('Email error:', err);
      }
    }

    res.status(200).json(request);
  } catch (error) {
    res.status(500).json({ message: 'Error verifying request', error: error.message });
  }
};

// 5. Coordinator Decision
export const coordinatorDecision = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, remarks } = req.body; // decision: 'approve' or 'reject' or 'forward'

    const request = await RoomPermissionRequest.findById(id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (!['Submitted', 'Faculty Verified', 'Coordinator Review'].includes(request.status)) {
      return res.status(400).json({ message: 'Request is not in a reviewable state.' });
    }

    const coordinatorName = req.user.name;

    if (decision === 'approve' || decision === 'forward') {
      // Both options recommendation moves the request to the Head Approval stage
      request.status = 'IDEA Hub Head Review';
      request.approvalHistory.push({
        role: 'Coordinator',
        action: 'Coordinator Approved',
        remarks: remarks || 'Approved and forwarded to IDEA Hub Head.',
        byName: coordinatorName,
        date: new Date()
      });

      await request.save();

      // Notify Student
      await createInAppNotification(
        request.applicantDetails.requestedBy,
        'Coordinator Approved Room Request',
        `Coordinator ${coordinatorName} approved and forwarded request ${request.requestId} to IDEA Hub Head.`
      );
      await sendPushNotification(
        request.applicantDetails.requestedBy,
        'Request Coordinator Approved',
        `Your request for ${request.facilityRequired} is forwarded to Head review.`
      );

      // Email Student
      try {
        const frontendUrl = process.env.FRONTEND_ORIGIN || 'https://ideahub-app.onrender.com';
        await sendEmail(
          request.applicantDetails.email,
          `Coordinator Approved Room Request - ${request.requestId}`,
          `<h2>Dear ${request.applicantDetails.applicantName},</h2>
           <p>Your request <b>${request.requestId}</b> for <b>${request.facilityRequired}</b> has been approved by the Coordinator <b>${coordinatorName}</b>.</p>
           <p>It has now been forwarded to the **IDEA Hub Head** for final approval.</p>
           <p>Track progress of Head approval here: <a href="${frontendUrl}/verify-room-permission/${request._id}">View Request Details</a></p>
           <br/><p>Regards,<br/>IDEA Hub Admin</p>`
        );
      } catch (err) {
        console.error('Email error:', err);
      }

      // Notify Head users
      const heads = await User.find({ role: 'head' });
      for (const head of heads) {
        await createInAppNotification(
          head._id,
          'New Request Awaiting Head Approval',
          `Room request ${request.requestId} is forwarded by Coordinator and awaits your approval.`
        );
        try {
          const frontendUrl = process.env.FRONTEND_ORIGIN || 'https://ideahub-app.onrender.com';
          await sendEmail(
            head.email,
            `Action Required: Room Permission Request - ${request.requestId}`,
            `<h2>Dear ${head.name},</h2>
             <p>The room permission request <b>${request.requestId}</b> has been approved and forwarded by the Coordinator.</p>
             <p>It is now awaiting your final approval.</p>
             <p>Review and decide on this request directly: <a href="${frontendUrl}/head/room-permissions">Go to Head Dashboard</a></p>
             <br/><p>Regards,<br/>IDEA Hub System</p>`
          );
        } catch (err) {
          console.error('Failed to send head email:', err);
        }
      }
    } else if (decision === 'reject') {
      request.status = 'Rejected';
      request.remarks = remarks || 'Rejected by Coordinator';
      request.approvalHistory.push({
        role: 'Coordinator',
        action: 'Rejected',
        remarks: remarks || 'Rejected by Coordinator.',
        byName: coordinatorName,
        date: new Date()
      });

      await request.save();

      // Notify Student
      await createInAppNotification(
        request.applicantDetails.requestedBy,
        'Room Request Rejected',
        `Coordinator ${coordinatorName} rejected request ${request.requestId}.`
      );

      try {
        const frontendUrl = process.env.FRONTEND_ORIGIN || 'https://ideahub-app.onrender.com';
        await sendEmail(
          request.applicantDetails.email,
          `Room Request Rejected - ${request.requestId}`,
          `<h2>Dear ${request.applicantDetails.applicantName},</h2>
           <p>Your request <b>${request.requestId}</b> for <b>${request.facilityRequired}</b> has been rejected by the Coordinator.</p>
           <p><b>Remarks:</b> ${remarks || 'No remarks provided'}</p>
           <p>Review the rejection history and coordinator notes: <a href="${frontendUrl}/verify-room-permission/${request._id}">View Request Details</a></p>
           <br/><p>Regards,<br/>IDEA Hub Admin</p>`
        );
      } catch (err) {
        console.error('Email error:', err);
      }
    } else if (decision === 'request_changes') {
      request.status = 'Draft';
      request.remarks = remarks || 'Changes requested by Coordinator';
      request.approvalHistory.push({
        role: 'Coordinator',
        action: 'Changes Requested',
        remarks: remarks || 'Changes requested.',
        byName: coordinatorName,
        date: new Date()
      });

      await request.save();

      // Notify Student
      await createInAppNotification(
        request.applicantDetails.requestedBy,
        'Changes Requested for Room Request',
        `Coordinator ${coordinatorName} requested changes for request ${request.requestId}. Status reset to Draft.`
      );

      // Email Student
      try {
        const frontendUrl = process.env.FRONTEND_ORIGIN || 'https://ideahub-app.onrender.com';
        await sendEmail(
          request.applicantDetails.email,
          `Changes Requested for Room Request - ${request.requestId}`,
          `<h2>Dear ${request.applicantDetails.applicantName},</h2>
           <p>Your room request <b>${request.requestId}</b> for <b>${request.facilityRequired}</b> requires changes.</p>
           <p><b>Remarks:</b> ${remarks || 'Please check remarks in portal'}</p>
           <p>The request status has been reset to **Draft**. You can edit the form and re-submit.</p>
           <p>You can view changes requested or edit your request directly here: <a href="${frontendUrl}/verify-room-permission/${request._id}">View Request Details</a></p>
           <br/><p>Regards,<br/>IDEA Hub System</p>`
        );
      } catch (err) {
        console.error('Email error:', err);
      }
    }

    res.status(200).json(request);
  } catch (error) {
    res.status(500).json({ message: 'Error in Coordinator review', error: error.message });
  }
};

// 6. IDEA Hub Head Decision
export const headDecision = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, remarks, conditions } = req.body; // decision: 'approve' or 'reject' or 'conditional' or 'forward_back'

    const request = await RoomPermissionRequest.findById(id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (request.status !== 'IDEA Hub Head Review') {
      return res.status(400).json({ message: 'Request is not in Head Review state.' });
    }

    const headName = req.user.name;

    if (decision === 'approve') {
      request.status = 'Approved';
      request.remarks = remarks || 'Approved';
      request.approvalHistory.push({
        role: 'Head',
        action: 'Approved',
        remarks: remarks || 'Approved.',
        byName: headName,
        date: new Date()
      });

      await request.save();

      // Notify Student
      await createInAppNotification(
        request.applicantDetails.requestedBy,
        'Room Request Approved',
        `IDEA Hub Head ${headName} has approved your booking for ${request.facilityRequired}. PDF is generated.`
      );
      await sendPushNotification(
        request.applicantDetails.requestedBy,
        'Request Approved!',
        `Your request for ${request.facilityRequired} has been approved.`
      );

      // Email Student
      try {
        const frontendUrl = process.env.FRONTEND_ORIGIN || 'https://ideahub-app.onrender.com';
        await sendEmail(
          request.applicantDetails.email,
          `Room Request Approved - ${request.requestId}`,
          `<h2>Dear ${request.applicantDetails.applicantName},</h2>
           <p>Congratulations! Your room permission request <b>${request.requestId}</b> has been **Approved** by the IDEA Hub Head <b>${headName}</b>.</p>
           <p>You can now log in to the dashboard, view the status timeline, and download/print your official permission form PDF.</p>
           <p>Download your official permission slip and view approved slot here: <a href="${frontendUrl}/verify-room-permission/${request._id}">View Approved Request</a></p>
           <br/><p>Regards,<br/>IDEA Hub Team</p>`
        );
      } catch (err) {
        console.error('Email error:', err);
      }
    } else if (decision === 'conditional') {
      request.status = 'Conditional Approval';
      request.remarks = remarks || 'Approved under conditions';
      request.conditions = conditions || '';
      request.approvalHistory.push({
        role: 'Head',
        action: 'Conditional Approval',
        remarks: `Remarks: ${remarks || 'None'}. Conditions: ${conditions || 'None'}`,
        byName: headName,
        date: new Date()
      });

      await request.save();

      // Notify Student
      await createInAppNotification(
        request.applicantDetails.requestedBy,
        'Room Request Conditionally Approved',
        `Your request ${request.requestId} has been conditionally approved. Please review conditions.`
      );

      // Email Student
      try {
        const frontendUrl = process.env.FRONTEND_ORIGIN || 'https://ideahub-app.onrender.com';
        await sendEmail(
          request.applicantDetails.email,
          `Conditional Approval - ${request.requestId}`,
          `<h2>Dear ${request.applicantDetails.applicantName},</h2>
           <p>Your room request <b>${request.requestId}</b> has been **Conditionally Approved** by the IDEA Hub Head.</p>
           <p><b>Conditions to satisfy:</b> ${conditions || 'None'}</p>
           <p><b>Remarks:</b> ${remarks || 'None'}</p>
           <p>Review conditional terms and download your permission slip here: <a href="${frontendUrl}/verify-room-permission/${request._id}">View Approved Request</a></p>
           <br/><p>Regards,<br/>IDEA Hub Team</p>`
        );
      } catch (err) {
        console.error('Email error:', err);
      }
    } else if (decision === 'reject') {
      request.status = 'Rejected';
      request.remarks = remarks || 'Rejected by Head';
      request.approvalHistory.push({
        role: 'Head',
        action: 'Rejected',
        remarks: remarks || 'Rejected.',
        byName: headName,
        date: new Date()
      });

      await request.save();

      // Notify Student
      await createInAppNotification(
        request.applicantDetails.requestedBy,
        'Room Request Rejected by Head',
        `Your request ${request.requestId} was rejected by the Head.`
      );

      // Email Student
      try {
        const frontendUrl = process.env.FRONTEND_ORIGIN || 'https://ideahub-app.onrender.com';
        await sendEmail(
          request.applicantDetails.email,
          `Request Rejected by Head - ${request.requestId}`,
          `<h2>Dear ${request.applicantDetails.applicantName},</h2>
           <p>Your request <b>${request.requestId}</b> for <b>${request.facilityRequired}</b> has been rejected by the IDEA Hub Head.</p>
           <p><b>Reason:</b> ${remarks || 'None'}</p>
           <p>Review final status and notes here: <a href="${frontendUrl}/verify-room-permission/${request._id}">View Request Details</a></p>
           <br/><p>Regards,<br/>IDEA Hub Team</p>`
        );
      } catch (err) {
        console.error('Email error:', err);
      }
    } else if (decision === 'forward_back') {
      request.status = 'Coordinator Review';
      request.remarks = remarks || 'Forwarded back to coordinator';
      request.approvalHistory.push({
        role: 'Head',
        action: 'Forwarded',
        remarks: remarks || 'Forwarded back to Coordinator for clarifications.',
        byName: headName,
        date: new Date()
      });

      await request.save();

      // Notify Student
      await createInAppNotification(
        request.applicantDetails.requestedBy,
        'Room Request Returned for Review',
        `Your request ${request.requestId} was forwarded back to Coordinator.`
      );

      // Notify Coordinators
      const coordinators = await User.find({ role: 'coordinator' });
      for (const coord of coordinators) {
        await createInAppNotification(
          coord._id,
          'Request Returned from Head',
          `Request ${request.requestId} has been forwarded back to you by the Head.`
        );
      }
    } else if (decision === 'request_changes') {
      request.status = 'Draft';
      request.remarks = remarks || 'Changes requested by IDEA Hub Head';
      request.approvalHistory.push({
        role: 'Head',
        action: 'Changes Requested',
        remarks: remarks || 'Changes requested by Head.',
        byName: headName,
        date: new Date()
      });

      await request.save();

      // Notify Student
      await createInAppNotification(
        request.applicantDetails.requestedBy,
        'Changes Requested by Head',
        `IDEA Hub Head ${headName} requested changes for request ${request.requestId}. Status reset to Draft.`
      );

      // Email Student
      try {
        const frontendUrl = process.env.FRONTEND_ORIGIN || 'https://ideahub-app.onrender.com';
        await sendEmail(
          request.applicantDetails.email,
          `Changes Requested by IDEA Hub Head - ${request.requestId}`,
          `<h2>Dear ${request.applicantDetails.applicantName},</h2>
           <p>Your room request <b>${request.requestId}</b> for <b>${request.facilityRequired}</b> requires changes according to the Head.</p>
           <p><b>Remarks:</b> ${remarks || 'Please check remarks in portal'}</p>
           <p>The request status has been reset to **Draft**. You can edit the form and re-submit.</p>
           <p>View requested changes and edit your request here: <a href="${frontendUrl}/verify-room-permission/${request._id}">View Request Details</a></p>
           <br/><p>Regards,<br/>IDEA Hub Team</p>`
        );
      } catch (err) {
        console.error('Email error:', err);
      }
    }

    res.status(200).json(request);
  } catch (error) {
    res.status(500).json({ message: 'Error in Head review', error: error.message });
  }
};

// 7. Student Request Cancellation
export const cancelRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await RoomPermissionRequest.findById(id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    // Permissions: only the student who requested can cancel
    if (String(request.applicantDetails.requestedBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Access denied: You cannot cancel this request.' });
    }

    // Cancellation conditions: Before coordinator approval, and before room usage date
    const today = new Date().toISOString().split('T')[0];
    const isFutureDate = request.schedule.requestedDate >= today;
    const isBeforeCoordinatorApproval = ['Draft', 'Submitted', 'Faculty Verified', 'Coordinator Review'].includes(request.status);

    if (!isBeforeCoordinatorApproval) {
      return res.status(400).json({ message: 'Cannot cancel request once approved/reviewed by Coordinator.' });
    }
    if (!isFutureDate) {
      return res.status(400).json({ message: 'Cannot cancel requests for past dates.' });
    }

    request.status = 'Cancelled';
    request.approvalHistory.push({
      role: 'Student',
      action: 'Cancelled',
      remarks: 'Cancelled by Student.',
      byName: request.applicantDetails.applicantName,
      date: new Date()
    });

    await request.save();

    res.status(200).json({ message: 'Request cancelled successfully.', request });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling request', error: error.message });
  }
};

// 8. Get All Requests (Search & Filters)
export const getRoomRequests = async (req, res) => {
  try {
    const { search, status, roomType, date, department, year } = req.query;
    const userRole = req.user.role;
    const userId = req.user._id;

    let query = {};

    // Role restrictions
    if (userRole === 'team') {
      query['applicantDetails.requestedBy'] = userId;
    }

    // Filters
    if (status) query.status = status;
    if (roomType) query.facilityRequired = roomType;
    if (date) query['schedule.requestedDate'] = date;
    if (department) query['applicantDetails.department'] = department;
    if (year) query['applicantDetails.year'] = year;

    // Search query mapping
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { requestId: searchRegex },
        { 'applicantDetails.applicantName': searchRegex },
        { 'applicantDetails.prn': searchRegex },
        { 'teamDetails.projectName': searchRegex }
      ];
    }

    const requests = await RoomPermissionRequest.find(query)
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching requests', error: error.message });
  }
};

// 9. Get Single Request
export const getRoomRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await RoomPermissionRequest.findById(id).populate('applicantDetails.requestedBy', 'name email');
    if (!request) return res.status(404).json({ message: 'Request not found' });
    res.status(200).json(request);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching request details', error: error.message });
  }
};

// 10. Get Student Stats
export const getStudentStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date().toISOString().split('T')[0];

    const [total, pending, approved, rejected, upcoming, todayBookings, completed] = await Promise.all([
      RoomPermissionRequest.countDocuments({ 'applicantDetails.requestedBy': userId }),
      RoomPermissionRequest.countDocuments({ 'applicantDetails.requestedBy': userId, status: { $in: ['Submitted', 'Faculty Verified', 'Coordinator Review', 'IDEA Hub Head Review'] } }),
      RoomPermissionRequest.countDocuments({ 'applicantDetails.requestedBy': userId, status: 'Approved' }),
      RoomPermissionRequest.countDocuments({ 'applicantDetails.requestedBy': userId, status: 'Rejected' }),
      RoomPermissionRequest.countDocuments({ 'applicantDetails.requestedBy': userId, status: { $in: ['Approved', 'Conditional Approval'] }, 'schedule.requestedDate': { $gt: today } }),
      RoomPermissionRequest.countDocuments({ 'applicantDetails.requestedBy': userId, status: { $in: ['Approved', 'Conditional Approval'] }, 'schedule.requestedDate': today }),
      RoomPermissionRequest.countDocuments({ 'applicantDetails.requestedBy': userId, status: 'Completed' })
    ]);

    res.status(200).json({
      total,
      pending,
      approved,
      rejected,
      upcoming,
      todayBookings,
      completed
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
};

// 11. Coordinator Stats
export const getCoordinatorStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [total, pending, approved, rejected, todayBookings, upcoming] = await Promise.all([
      RoomPermissionRequest.countDocuments({ status: { $ne: 'Draft' } }),
      RoomPermissionRequest.countDocuments({ status: 'Coordinator Review' }),
      RoomPermissionRequest.countDocuments({ status: 'Approved' }),
      RoomPermissionRequest.countDocuments({ status: 'Rejected' }),
      RoomPermissionRequest.countDocuments({ status: { $in: ['Approved', 'Conditional Approval'] }, 'schedule.requestedDate': today }),
      RoomPermissionRequest.countDocuments({ status: { $in: ['Approved', 'Conditional Approval'] }, 'schedule.requestedDate': { $gt: today } })
    ]);

    res.status(200).json({
      total,
      pending,
      approved,
      rejected,
      todayBookings,
      upcoming
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching coordinator stats', error: error.message });
  }
};

// 12. Head Dashboard Stats
export const getHeadStats = async (req, res) => {
  try {
    const [pending, approved, rejected, conditional] = await Promise.all([
      RoomPermissionRequest.countDocuments({ status: 'IDEA Hub Head Review' }),
      RoomPermissionRequest.countDocuments({ status: 'Approved' }),
      RoomPermissionRequest.countDocuments({ status: 'Rejected' }),
      RoomPermissionRequest.countDocuments({ status: 'Conditional Approval' })
    ]);

    // Resource utilization logic: percentage of slots occupied today (e.g. out of total availability)
    // Simple mock calculation based on bookings
    const totalPossibleSlots = 3 * 18; // 3 rooms * 18 slots (half hour) = 54
    const today = new Date().toISOString().split('T')[0];
    const todayBookingsCount = await RoomPermissionRequest.countDocuments({
      status: { $in: ['Approved', 'Conditional Approval', 'Completed'] },
      'schedule.requestedDate': today
    });
    const utilization = Math.min(100, Math.round((todayBookingsCount / totalPossibleSlots) * 100)) || 15;

    res.status(200).json({
      pending,
      approved,
      rejected,
      conditional,
      resourceUtilization: utilization
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching head stats', error: error.message });
  }
};

// 13. Head Analytics Data
export const getAnalytics = async (req, res) => {
  try {
    const approvedRequests = await RoomPermissionRequest.find({
      status: { $in: ['Approved', 'Conditional Approval', 'Completed'] }
    });

    const specialRooms = await Room.find({ isSpecial: true });
    const counts = {};
    specialRooms.forEach(r => { counts[r.name] = 0; });
    const hoursCount = Array(24).fill(0);

    approvedRequests.forEach(reqObj => {
      const room = reqObj.facilityRequired;
      if (counts[room] !== undefined) {
        counts[room] += 1;
      }
      
      const startHour = parseInt(reqObj.schedule.startTime.split(':')[0]);
      if (!isNaN(startHour)) {
        hoursCount[startHour] += 1;
      }
    });

    const total = approvedRequests.length || 1;
    const percentages = {};
    specialRooms.forEach(r => {
      const key = r.name.toLowerCase().replace(/\s+room/g, '').replace(/\s+/g, '');
      percentages[key] = Math.round(((counts[r.name] || 0) / total) * 100);
    });

    // Find most used room
    let mostUsed = specialRooms[0]?.name || 'Conference Room';
    specialRooms.forEach(r => {
      if ((counts[r.name] || 0) > (counts[mostUsed] || 0)) {
        mostUsed = r.name;
      }
    });

    // Format peak hours
    const peakHoursData = hoursCount.map((count, hr) => {
      const ampm = hr >= 12 ? 'PM' : 'AM';
      const displayHr = hr % 12 === 0 ? 12 : hr % 12;
      return { hour: `${displayHr} ${ampm}`, bookings: count };
    }).filter(d => d.bookings > 0 || (parseInt(d.hour) >= 9 && parseInt(d.hour) <= 18));

    // Mock Monthly trends for chart
    const monthlyTrends = [
      { name: 'Jan', bookings: 5 },
      { name: 'Feb', bookings: 8 },
      { name: 'Mar', bookings: 12 },
      { name: 'Apr', bookings: 18 },
      { name: 'May', bookings: 25 },
      { name: 'Jun', bookings: total }
    ];

    res.status(200).json({
      mostUsedRoom: mostUsed,
      percentages,
      peakUsageHours: peakHoursData,
      monthlyUsageTrends: monthlyTrends
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
};

// 14. Monthly Calendar bookings
export const getCalendarBookings = async (req, res) => {
  try {
    const bookings = await RoomPermissionRequest.find({
      status: { $in: ['Approved', 'Conditional Approval', 'Rejected', 'Completed'] }
    });

    const formattedBookings = bookings.map(b => ({
      id: b._id,
      title: `${b.facilityRequired} - ${b.teamDetails.projectName}`,
      room: b.facilityRequired,
      date: b.schedule.requestedDate,
      startTime: b.schedule.startTime,
      endTime: b.schedule.endTime,
      bookedBy: b.applicantDetails.applicantName,
      status: b.status,
      color: b.status === 'Approved' ? 'Blue' : 
             b.status === 'Conditional Approval' ? 'Yellow' : 
             b.status === 'Rejected' ? 'Red' : 'Gray'
    }));

    res.status(200).json(formattedBookings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching calendar bookings', error: error.message });
  }
};

// 15. Room Resource Inventory Tracking
export const getRoomInventory = async (req, res) => {
  try {
    const { date, startTime, endTime } = req.query;

    const inventory = [];

    // Query overlapping approved requests for that slot
    let reservedCounts = {};
    Object.keys(EQUIPMENT_TOTALS).forEach(eq => { reservedCounts[eq] = 0; });

    if (date && startTime && endTime) {
      const activeRequests = await RoomPermissionRequest.find({
        'schedule.requestedDate': date,
        status: { $in: ['Approved', 'Conditional Approval'] }
      });

      const overlaps = activeRequests.filter(r => timesOverlap(startTime, endTime, r.schedule.startTime, r.schedule.endTime));
      overlaps.forEach(r => {
        r.resourceRequirements.requiredEquipment.forEach(eq => {
          if (reservedCounts[eq] !== undefined) {
            reservedCounts[eq] += 1;
          }
        });
      });
    }

    Object.keys(EQUIPMENT_TOTALS).forEach(eq => {
      const total = EQUIPMENT_TOTALS[eq];
      const reserved = reservedCounts[eq];
      const remaining = Math.max(0, total - reserved);
      inventory.push({
        equipment: eq,
        total,
        reserved,
        remaining
      });
    });

    res.status(200).json(inventory);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching inventory', error: error.message });
  }
};

// 16. PDF Download & Signatures
export const downloadRoomPermissionPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await RoomPermissionRequest.findById(id).populate('applicantDetails.requestedBy', 'name email');
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const frontendUrl = process.env.FRONTEND_ORIGIN || process.env.FRONTEND_URL || 'https://ideahub-app.onrender.com';
    const qrData = `${frontendUrl}/verify-room-permission/${request.requestId || request._id}`;

    const data = {
      header: {
        application: 'SPECIAL ROOM PERMISSION FORM',
        requestId: request.requestId,
        applicationDate: request.applicationDate ? new Date(request.applicationDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : ''
      },
      student: {
        name: request.applicantDetails.applicantName,
        prn: request.applicantDetails.prn,
        rollNo: request.applicantDetails.rollNo,
        department: request.applicantDetails.department,
        year: request.applicantDetails.year,
        division: request.applicantDetails.division,
        mobile: request.applicantDetails.mobile,
        email: request.applicantDetails.email
      },
      room: {
        facilityRequired: request.facilityRequired,
        purpose: request.purpose,
        category: request.category,
        projectName: request.teamDetails.projectName,
        teamName: request.teamDetails.teamName,
        participantsCount: request.teamDetails.participantsCount,
        teamMembers: request.teamDetails.teamMembers || []
      },
      schedule: {
        requestedDate: request.schedule.requestedDate ? new Date(request.schedule.requestedDate + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '',
        timeSlot: `${request.schedule.startTime} - ${request.schedule.endTime}`,
        duration: `${request.schedule.duration} hours`
      },
      faculty: {
        name: request.facultyRecommendation.facultyName,
        department: request.facultyRecommendation.facultyDepartment,
        designation: request.facultyRecommendation.facultyDesignation,
        remarks: request.facultyRecommendation.facultyRemarks,
        mobile: request.facultyRecommendation.facultyMobile || 'N/A',
        email: request.facultyRecommendation.facultyEmail || 'N/A',
        verified: request.facultyRecommendation.verified ? 'RECOMMENDED' : 'PENDING'
      },
      resources: {
        requiredEquipment: request.resourceRequirements.requiredEquipment || [],
        otherEquipment: request.resourceRequirements.otherEquipment || ''
      },
      status: request.status,
      remarks: request.remarks || '',
      conditions: request.conditions || '',
      approvalHistory: request.approvalHistory || [],
      qrData: qrData
    };

    const pdfPath = `uploads/pdfs/SpecialRoomPermission_${request._id}_${request.status}_${new Date().toISOString().split('T')[0]}.pdf`;
    await generatePdf('specialRoom', data, pdfPath);

    res.download(pdfPath, (err) => {
      if (err) {
        console.error('Error sending PDF:', err);
        res.status(500).end();
      }
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: 'Error generating PDF', error: error.message });
  }
};

// 17. Send Manual Reminder (Coordinator/Head)
export const sendManualReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await RoomPermissionRequest.findById(id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    // Send email reminder
    try {
      const frontendUrl = process.env.FRONTEND_ORIGIN || `${req.protocol}://${req.get('host')}`.replace('5000', '8080');
      await sendEmail(
        request.applicantDetails.email,
        `Booking Reminder: ${request.facilityRequired} - ${request.requestId}`,
        `<h2>Dear ${request.applicantDetails.applicantName},</h2>
         <p>This is a reminder that you have an approved booking for the <b>${request.facilityRequired}</b> on <b>${request.schedule.requestedDate}</b>.</p>
         <p><b>Time Slot:</b> ${request.schedule.startTime} - ${request.schedule.endTime}</p>
         <p><b>Team Name:</b> ${request.teamDetails.teamName}</p>
         <p><b>Project:</b> ${request.teamDetails.projectName}</p>
         <br/>
         <p>Please ensure you bring the official permission PDF and follow all IDEA Hub rules and guidelines during usage.</p>
         <p>Review your booking details here: <a href="${frontendUrl}/verify-room-permission/${request._id}">View Booking Details</a></p>
         <br/><p>Regards,<br/>AICTE IDEA Lab Team</p>`
      );
    } catch (emailErr) {
      return res.status(500).json({ message: 'Failed to send reminder email', error: emailErr.message });
    }

    request.reminderSent = true;
    await request.save();

    res.status(200).json({ message: 'Reminder sent successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending reminder', error: error.message });
  }
};

// 18. Download Room Usage Report (Excel, CSV, PDF)
export const downloadRoomUsageReport = async (req, res) => {
  try {
    const { rangeType, fromDate, toDate, format } = req.query;

    if (!rangeType) {
      return res.status(400).json({ message: 'Range type is required' });
    }

    const today = new Date();
    let startStr = '';
    let endStr = '';

    const formatDate = (d) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    if (rangeType === 'Today') {
      startStr = formatDate(today);
      endStr = formatDate(today);
    } else if (rangeType === 'Last 7 Days' || rangeType === '7 Days') {
      const start = new Date();
      start.setDate(today.getDate() - 6);
      startStr = formatDate(start);
      endStr = formatDate(today);
    } else if (rangeType === 'Last 30 Days' || rangeType === '30 Days') {
      const start = new Date();
      start.setDate(today.getDate() - 29);
      startStr = formatDate(start);
      endStr = formatDate(today);
    } else if (rangeType === 'Last 3 Months' || rangeType === '3 Months') {
      const start = new Date();
      start.setMonth(today.getMonth() - 3);
      startStr = formatDate(start);
      endStr = formatDate(today);
    } else if (rangeType === 'Last 6 Months' || rangeType === '6 Months') {
      const start = new Date();
      start.setMonth(today.getMonth() - 6);
      startStr = formatDate(start);
      endStr = formatDate(today);
    } else if (rangeType === 'Last 1 Year' || rangeType === '1 Year') {
      const start = new Date();
      start.setFullYear(today.getFullYear() - 1);
      startStr = formatDate(start);
      endStr = formatDate(today);
    } else if (rangeType === 'Custom Date Range' || rangeType === 'Custom') {
      if (!fromDate || !toDate) {
        return res.status(400).json({ message: 'From date and To date are required for custom range' });
      }
      startStr = fromDate;
      endStr = toDate;
    } else {
      return res.status(400).json({ message: 'Invalid range type' });
    }

    // Fetch matching bookings
    let query = { status: { $ne: 'Draft' } };
    let dateRangeStr = '';

    if (rangeType === 'Today') {
      query['schedule.requestedDate'] = startStr;
      dateRangeStr = startStr;
    } else if (rangeType === 'Custom Date Range' || rangeType === 'Custom') {
      query['schedule.requestedDate'] = { $gte: startStr, $lte: endStr };
      dateRangeStr = `${startStr} to ${endStr}`;
    } else {
      // For Last 7 Days, Last 30 Days, Last 3 Months, Last 6 Months, Last 1 Year
      // We start from startStr but don't cap the upper bound, so all future scheduled bookings are included
      query['schedule.requestedDate'] = { $gte: startStr };
      dateRangeStr = `From ${startStr}`;
    }

    const requests = await RoomPermissionRequest.find(query)
      .sort({ 'schedule.requestedDate': 1, 'schedule.startTime': 1 });

    if (format === 'csv') {
      const headers = [
        'Request ID', 'Student Name', 'PRN', 'Room Type', 'Project Name',
        'Date', 'Start Time', 'End Time', 'Duration (Hrs)', 'Purpose',
        'Category', 'Status', 'Recommending Faculty', 'Department'
      ];
      const csvRows = [headers.join(',')];
      
      requests.forEach(r => {
        const rowData = [
          r.requestId,
          r.applicantDetails?.applicantName || 'N/A',
          r.applicantDetails?.prn || 'N/A',
          r.facilityRequired,
          r.teamDetails?.projectName || 'N/A',
          r.schedule?.requestedDate || 'N/A',
          r.schedule?.startTime || 'N/A',
          r.schedule?.endTime || 'N/A',
          r.schedule?.duration || 0,
          r.purpose || 'N/A',
          r.category || 'N/A',
          r.status,
          r.facultyRecommendation?.facultyName || 'N/A',
          r.applicantDetails?.department || 'N/A'
        ];
        const escapedRow = rowData.map(val => {
          const strVal = String(val).replace(/"/g, '""');
          return `"${strVal}"`;
        });
        csvRows.push(escapedRow.join(','));
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="RoomUsageReport_${rangeType.replace(/\s+/g, '_')}_${startStr}_${endStr}.csv"`);
      return res.send(csvRows.join('\n'));

    } else if (format === 'pdf') {
      const pdfPath = `uploads/pdfs/RoomUsageReport_${rangeType.replace(/\s+/g, '_')}_${startStr}_${endStr}.pdf`;
      const data = {
        dateRangeStr,
        requests
      };
      
      await generatePdf('roomUsageReport', data, pdfPath);
      
      return res.download(pdfPath, (err) => {
        if (err) {
          console.error('Error sending PDF report:', err);
          if (!res.headersSent) {
            res.status(500).end();
          }
        }
      });

    } else {
      // Default to xlsx
      const reportData = requests.map(r => ({
        'Request ID': r.requestId,
        'Student Name': r.applicantDetails?.applicantName || 'N/A',
        'PRN': r.applicantDetails?.prn || 'N/A',
        'Room Type': r.facilityRequired,
        'Project Name': r.teamDetails?.projectName || 'N/A',
        'Date': r.schedule?.requestedDate || 'N/A',
        'Start Time': r.schedule?.startTime || 'N/A',
        'End Time': r.schedule?.endTime || 'N/A',
        'Duration (Hrs)': r.schedule?.duration || 0,
        'Purpose': r.purpose || 'N/A',
        'Category': r.category || 'N/A',
        'Status': r.status,
        'Recommending Faculty': r.facultyRecommendation?.facultyName || 'N/A',
        'Department': r.applicantDetails?.department || 'N/A'
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(reportData);
      XLSX.utils.book_append_sheet(wb, ws, "Room Usage Report");
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="RoomUsageReport_${rangeType.replace(/\s+/g, '_')}_${startStr}_${endStr}.xlsx"`);
      return res.send(buffer);
    }

  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ message: 'Error generating report', error: error.message });
  }
};
