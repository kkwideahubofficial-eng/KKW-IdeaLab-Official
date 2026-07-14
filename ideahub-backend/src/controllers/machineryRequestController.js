import MachineryRequest from '../models/MachineryRequest.js';
import User from '../models/User.js';
import Material from '../models/Material.js';
import Machinery from '../models/Machinery.js';
import EventNotification from '../models/EventNotification.js';
import PushSubscription from '../models/PushSubscription.js';
import sendEmail from '../utils/sendEmail.js';
import generatePdf from '../utils/pdfGenerator.js';
import webpush from '../config/webPush.js';
import mongoose from 'mongoose';
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

// In-app Notification helper
async function createInAppNotification(userId, title, body, type = 'machinery') {
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

// Helper for sending email notification to Faculty Guide
async function sendFacultyGuideNotification(facultyGuide, requestId, projectName, studentName, status = 'Submitted', remarks = '') {
  if (!facultyGuide || !facultyGuide.email) return;

  const facultyEmail = facultyGuide.email;
  const facultyName = facultyGuide.name || 'Faculty Member';
  const frontendUrl = process.env.FRONTEND_ORIGIN || 'https://ideahub-app.onrender.com';
  const trackUrl = `${frontendUrl}/verify-request/${requestId}`;
  
  let subject = `IDEA Hub: Student Machinery & Material Request Notification - ${requestId}`;
  let bodyText = `<h2>Dear Prof. ${facultyName},</h2>
    <p>Your student <b>${studentName}</b> has submitted a Machinery & Material Usage Permission request to the AICTE IDEA Lab.</p>
    <p><b>Request ID:</b> ${requestId}</p>
    <p><b>Project Name:</b> ${projectName}</p>
    <p><b>Status:</b> ${status}</p>`;

  if (remarks) {
    bodyText += `<p><b>Remarks:</b> ${remarks}</p>`;
  }

  bodyText += `<p>You can view the full request details and real-time status here: <a href="${trackUrl}">${trackUrl}</a></p>
    <br/>
    <p>Regards,<br/>AICTE IDEA Lab & Innovation Centre<br/>K. K. Wagh Institute of Engineering Education and Research, Nashik</p>`;

  try {
    await sendEmail(facultyEmail, subject, bodyText);
    console.log(`[Notification] Faculty guide email sent to ${facultyEmail} for request ${requestId}`);
  } catch (err) {
    console.error(`Failed to send faculty guide email to ${facultyEmail}:`, err);
  }
}

// Check Availability & Suggest nearest slots for a machine
export const checkMachineAvailability = async (req, res) => {
  try {
    const { machineId, date, startTime, endTime, excludeRequestId, machineUnitNumber } = req.query;

    if (!machineId || !date || !startTime || !endTime) {
      return res.status(400).json({ message: 'machineId, date, startTime, and endTime are required' });
    }

    const durationMins = parseTimeToMinutes(endTime) - parseTimeToMinutes(startTime);
    if (durationMins <= 0) {
      return res.status(400).json({ message: 'Invalid time range' });
    }

    const machine = await Machinery.findById(machineId);
    if (!machine) return res.status(404).json({ message: 'Machine not found' });

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0,0,0,0));
    const endOfDay = new Date(targetDate.setHours(23,59,59,999));

    // Get all approved bookings for this machine on this day
    const query = {
      'requestedMachines.machineId': machineId,
      status: { $in: ['Approved', 'Approved With Conditions', 'Material Allocated', 'Machine Scheduled', 'Active Booking'] },
      'requestedMachines.usageDate': { $gte: startOfDay, $lte: endOfDay }
    };
    if (excludeRequestId) {
      query._id = { $ne: excludeRequestId };
    }

    const requests = await MachineryRequest.find(query);

    // Identify which specific unit numbers are booked
    const bookedUnits = new Set();
    let overlapsCount = 0;
    for (const reqObj of requests) {
      for (const mach of reqObj.requestedMachines) {
        if (mach.machineId.toString() === machineId.toString()) {
          const machDate = new Date(mach.usageDate);
          if (machDate.toDateString() === startOfDay.toDateString()) {
            if (timesOverlap(startTime, endTime, mach.startTime, mach.endTime)) {
              overlapsCount++;
              if (mach.machineUnitNumber) {
                bookedUnits.add(Number(mach.machineUnitNumber));
              }
            }
          }
        }
      }
    }

    const capacity = machine.capacity || 1;
    const availableUnits = [];
    for (let i = 1; i <= capacity; i++) {
      if (!bookedUnits.has(i)) {
        availableUnits.push(i);
      }
    }

    const requestedUnit = Number(machineUnitNumber) || 1;
    const isRequestedUnitAvailable = !bookedUnits.has(requestedUnit) && requestedUnit <= capacity;

    if (!isRequestedUnitAvailable) {
      // Find alternative slots on that date (9 AM to 6 PM)
      const suggestions = [];
      const dayStart = 540; // 09:00 AM
      const dayEnd = 1080;  // 06:00 PM

      for (let t = dayStart; t <= dayEnd - durationMins; t += 30) {
        const potentialStart = minutesToTimeStr(t);
        const potentialEnd = minutesToTimeStr(t + durationMins);

        let unitIsBookedInAlternativeSlot = false;
        for (const reqObj of requests) {
          for (const mach of reqObj.requestedMachines) {
            if (mach.machineId.toString() === machineId.toString()) {
              const machDate = new Date(mach.usageDate);
              if (machDate.toDateString() === startOfDay.toDateString()) {
                const bmUnit = Number(mach.machineUnitNumber) || 1;
                if (bmUnit === requestedUnit) {
                  if (timesOverlap(potentialStart, potentialEnd, mach.startTime, mach.endTime)) {
                    unitIsBookedInAlternativeSlot = true;
                  }
                }
              }
            }
          }
        }

        if (!unitIsBookedInAlternativeSlot) {
          suggestions.push({ startTime: potentialStart, endTime: potentialEnd });
        }
        if (suggestions.length >= 3) break;
      }

      return res.status(200).json({
        available: false,
        status: 'Unavailable',
        message: `Unit #${requestedUnit} is already booked for this slot.`,
        availableUnits,
        bookedUnits: Array.from(bookedUnits),
        suggestions
      });
    }

    return res.status(200).json({
      available: true,
      status: 'Available',
      message: `Unit #${requestedUnit} is available for booking.`,
      availableUnits,
      bookedUnits: Array.from(bookedUnits)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error checking machine availability', error: error.message });
  }
};

// Create or save draft request
export const createRequest = async (req, res) => {
  try {
    const {
      projectName,
      projectCategory,
      projectDescription,
      projectObjectives,
      expectedOutcome,
      teamName,
      numberOfStudents,
      students,
      facultyGuide,
      requestedMachines,
      requestedMaterials,
      uploadedFiles,
      benefits,
      declaration,
      status, // 'Draft' or 'Submitted' / 'Student Resubmitted'
      applicantType, // 'Internal' or 'External'
      externalFullName,
      externalCollegeOrg,
      externalDept,
      externalDesignation,
      externalWebsite,
      externalCity,
      externalState,
      externalEmail,
      externalMobile,
      externalIdentityProof,
      externalApplicantType,
      externalTeamMembers
    } = req.body;

    const isExternal = applicantType === 'External' || !req.user;
    if (applicantType === 'Internal' && req.user && req.user.userType === 'EXTERNAL') {
      return res.status(403).json({ message: 'Access Restricted. External users cannot submit Internal student requests.' });
    }
    const studentId = req.user ? req.user._id : null;

    // Check material stocks first if submitting
    if (status !== 'Draft') {
      if (!isExternal) {
        const activeRequest = await MachineryRequest.findOne({
          studentId,
          status: { $in: ['Submitted', 'Coordinator Review', 'Coordinator Approved', 'Head Review', 'Approved', 'Approved With Conditions', 'Material Allocated', 'Machine Scheduled', 'Active Booking'] }
        });
        if (activeRequest) {
          return res.status(400).json({
            message: `Active Request Block: You already have an active request (${activeRequest.requestId}) in progress. Please complete your current booking before submitting a new request.`
          });
        }
      }

      for (const mat of (requestedMaterials || [])) {
        if (mat.materialId) {
          const material = await Material.findById(mat.materialId);
          if (material) {
            const remaining = Math.max(0, material.currentStock - material.allocatedQuantity);
            if (mat.quantityRequired > remaining) {
              return res.status(400).json({
                message: `Auto Capacity Validation failed: Only ${remaining} ${material.unit} of "${material.name}" available. Requested: ${mat.quantityRequired}.`
              });
            }
          }
        }
      }

      // Check machine slot availability
      for (const mach of (requestedMachines || [])) {
        if (mach.machineId && mach.usageDate && mach.startTime && mach.endTime) {
          const machine = await Machinery.findById(mach.machineId);
          if (machine) {
            const usageDate = new Date(mach.usageDate);
            const startD = new Date(usageDate.setHours(0,0,0,0));
            const endD = new Date(usageDate.setHours(23,59,59,999));

            const bookings = await MachineryRequest.find({
              'requestedMachines.machineId': mach.machineId,
              status: { $in: ['Approved', 'Approved With Conditions', 'Material Allocated', 'Machine Scheduled', 'Active Booking'] },
              'requestedMachines.usageDate': { $gte: startD, $lte: endD }
            });

            const targetUnit = Number(mach.machineUnitNumber) || 1;
            let isUnitBooked = false;
            for (const b of bookings) {
              for (const bm of b.requestedMachines) {
                if (bm.machineId.toString() === mach.machineId.toString()) {
                  if (new Date(bm.usageDate).toDateString() === usageDate.toDateString()) {
                    const bmUnit = Number(bm.machineUnitNumber) || 1;
                    if (bmUnit === targetUnit) {
                      if (timesOverlap(mach.startTime, mach.endTime, bm.startTime, bm.endTime)) {
                        isUnitBooked = true;
                        break;
                      }
                    }
                  }
                }
              }
              if (isUnitBooked) break;
            }

            if (isUnitBooked) {
              return res.status(400).json({
                message: `Double Booking Alert: Unit #${targetUnit} of machine "${machine.name}" is already booked from ${mach.startTime} to ${mach.endTime} on ${new Date(mach.usageDate).toLocaleDateString()}.`
              });
            }
          }
        }
      }
    }

    // Auto-generate Request ID e.g., MAT-2026-001 or EXT-2026-001
    let requestId = '';
    const prefix = isExternal ? 'EXT-2026-' : 'MAT-2026-';
    const lastRequest = await MachineryRequest.findOne({ requestId: { $regex: `^${prefix}` } }).sort({ createdAt: -1 });
    if (lastRequest) {
      const numStr = lastRequest.requestId.replace(prefix, '');
      const nextNum = parseInt(numStr) + 1;
      requestId = `${prefix}${nextNum.toString().padStart(3, '0')}`;
    } else {
      requestId = `${prefix}001`;
    }

    // Prepare compatibility variables
    const primaryMachine = requestedMachines && requestedMachines.length > 0 ? requestedMachines[0] : null;
    const teamMems = !isExternal ? (students || []).slice(1).map(s => ({
      name: s.name,
      branch: s.branch,
      year: s.year,
      mobile: s.mobile,
      email: s.email
    })) : [];

    const newRequest = new MachineryRequest({
      requestId,
      applicantType: isExternal ? 'External' : 'Internal',
      projectName,
      projectCategory,
      projectDescription,
      projectObjectives,
      expectedOutcome,
      teamName,
      numberOfStudents: Number(numberOfStudents) || 1,
      students: isExternal ? [] : (students || []),
      facultyGuide: facultyGuide || {},
      requestedMachines: requestedMachines || [],
      requestedMaterials: requestedMaterials || [],
      uploadedFiles: uploadedFiles || {},
      benefits: benefits || {},
      declaration: declaration || {},
      status: status || 'Submitted',
      studentId: studentId,
      
      // External fields
      externalFullName: isExternal ? (externalFullName || '') : '',
      externalCollegeOrg: isExternal ? (externalCollegeOrg || '') : '',
      externalDept: isExternal ? (externalDept || '') : '',
      externalDesignation: isExternal ? (externalDesignation || '') : '',
      externalWebsite: isExternal ? (externalWebsite || '') : '',
      externalCity: isExternal ? (externalCity || '') : '',
      externalState: isExternal ? (externalState || '') : '',
      externalEmail: isExternal ? (externalEmail || '') : '',
      externalMobile: isExternal ? (externalMobile || '') : '',
      externalIdentityProof: isExternal ? (externalIdentityProof || '') : '',
      externalApplicantType: isExternal ? (externalApplicantType || 'Individual') : 'Individual',
      externalTeamMembers: isExternal ? (externalTeamMembers || []) : [],

      approvalHistory: status !== 'Draft' ? [{
        role: isExternal ? 'External Applicant' : 'Student',
        action: 'Submitted',
        remarks: 'Request submitted for Coordinator Review.',
        byName: isExternal ? (externalFullName || 'External User') : req.user.name,
        date: new Date()
      }] : [],

      // Backward compatibility mapping
      machineryId: primaryMachine ? primaryMachine.machineId : undefined,
      teamMembers: teamMems,
      usageDate: primaryMachine ? primaryMachine.usageDate : undefined,
      startTime: primaryMachine ? primaryMachine.startTime : undefined,
      endTime: primaryMachine ? primaryMachine.endTime : undefined,
      purpose: projectDescription || '',
      consentAgreed: declaration ? declaration.acceptResponsibility : false,
      groupPhotoUrl: uploadedFiles ? uploadedFiles.designFileUrl : ''
    });

    const saved = await newRequest.save();

    // Trigger profile updates for internal students
    if (!isExternal && students && students.length > 0) {
      const lead = students[0];
      const updates = {};
      if (lead.mobile) updates.mobile = lead.mobile;
      if (lead.branch) updates.branch = lead.branch;
      if (lead.year) {
        let mappedYear = lead.year;
        if (lead.year === '1st Year') mappedYear = 'FE';
        else if (lead.year === '2nd Year') mappedYear = 'SE';
        else if (lead.year === '3rd Year') mappedYear = 'TE';
        else if (lead.year === '4th Year') mappedYear = 'BE';
        updates.year = mappedYear;
      }
      await User.findByIdAndUpdate(studentId, updates);
    }

    // Trigger Notification for Coordinator & User
    if (status !== 'Draft') {
      if (!isExternal) {
        await createInAppNotification(
          studentId,
          'Permission Request Submitted',
          `Your request ${requestId} has been submitted successfully.`
        );
      } else if (externalEmail) {
        // Email external applicant with tracking details
        const frontendUrl = process.env.FRONTEND_ORIGIN || 'https://ideahub-app.onrender.com';
        const trackUrl = `${frontendUrl}/verify-request/${requestId}`;
        const subject = `IDEA Hub: Request Submitted Successfully - ${requestId}`;
        const bodyText = `<p>Dear ${externalFullName},</p>
                          <p>Your machinery/material request has been submitted successfully to KK Wagh AICTE IDEA Lab.</p>
                          <p><b>Request ID:</b> ${requestId}</p>
                          <p><b>Project Name:</b> ${projectName}</p>
                          <p>You can track the live status of your request here: <a href="${trackUrl}">${trackUrl}</a></p>
                          <p>Please note that external requests are subject to verification of your uploaded Identity Proof and machinery usage charges.</p>
                          <p>Regards,<br/>IDEA Hub Team</p>`;
        try {
          await sendEmail(externalEmail, subject, bodyText);
        } catch (err) {
          console.error('Failed to send email to external user:', err);
        }
      }

      // Notify Faculty Guide if specified
      if (facultyGuide && facultyGuide.email) {
        const studentName = isExternal ? (externalFullName || 'External User') : (req.user ? req.user.name : (students?.[0]?.name || 'Student'));
        await sendFacultyGuideNotification(facultyGuide, requestId, projectName, studentName, status || 'Submitted');
      }

      const admins = await User.find({ role: { $in: ['coordinator', 'head'] } });
      for (const admin of admins) {
        await createInAppNotification(
          admin._id,
          'New Request Awaiting Review',
          `New request ${requestId} for project "${projectName}" submitted by ${isExternal ? (externalFullName || 'External User') : req.user.name}.`
        );
        await sendPushNotification(
          admin._id,
          'New Material/Machinery Request',
          `${isExternal ? (externalFullName || 'External User') : req.user.name} submitted request ${requestId}`
        );
        try {
          const frontendUrl = process.env.FRONTEND_ORIGIN || 'https://ideahub-app.onrender.com';
          await sendEmail(
            admin.email,
            `New Machinery/Material Request - ${requestId}`,
            `<h2>Dear ${admin.name},</h2>
             <p>A new machinery/material request <b>${requestId}</b> for project <b>${projectName}</b> has been submitted by <b>${isExternal ? (externalFullName || 'External User') : req.user.name}</b>.</p>
             <p>Process this request on your dashboard: <a href="${frontendUrl}${admin.role === 'head' ? '/head-dashboard' : '/coordinator-dashboard'}">Go to Dashboard</a></p>
             <br/><p>Regards,<br/>AICTE IDEA Lab Team</p>`
          );
        } catch (err) {
          console.error('Failed to send admin email:', err);
        }
      }
    }

    res.status(201).json(saved);
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(500).json({ message: 'Error creating request', error: error.message });
  }
};

// Update existing request (resubmit or update draft)
export const updateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      projectName,
      projectCategory,
      projectDescription,
      projectObjectives,
      expectedOutcome,
      teamName,
      numberOfStudents,
      students,
      facultyGuide,
      requestedMachines,
      requestedMaterials,
      uploadedFiles,
      benefits,
      declaration,
      status
    } = req.body;

    const request = await MachineryRequest.findById(id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    // Validate that student owns it and it's editable (Draft or Changes Requested)
    if (request.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized action' });
    }

    if (!['Draft', 'Changes Requested'].includes(request.status)) {
      return res.status(400).json({ message: 'This request cannot be modified in its current state.' });
    }

    // Stock validations if submitting
    if (status === 'Submitted' || status === 'Student Resubmitted') {
      for (const mat of (requestedMaterials || [])) {
        if (mat.materialId) {
          const material = await Material.findById(mat.materialId);
          if (material) {
            const remaining = Math.max(0, material.currentStock - material.allocatedQuantity);
            if (mat.quantityRequired > remaining) {
              return res.status(400).json({
                message: `Auto Capacity Validation failed: Only ${remaining} ${material.unit} of "${material.name}" available. Requested: ${mat.quantityRequired}.`
              });
            }
          }
        }
      }

      // Check machine slot availability for specific unit
      for (const mach of (requestedMachines || [])) {
        if (mach.machineId && mach.usageDate && mach.startTime && mach.endTime) {
          const machine = await Machinery.findById(mach.machineId);
          if (machine) {
            const usageDate = new Date(mach.usageDate);
            const startD = new Date(usageDate.setHours(0,0,0,0));
            const endD = new Date(usageDate.setHours(23,59,59,999));

            const bookings = await MachineryRequest.find({
              _id: { $ne: id },
              'requestedMachines.machineId': mach.machineId,
              status: { $in: ['Approved', 'Approved With Conditions', 'Material Allocated', 'Machine Scheduled', 'Active Booking'] },
              'requestedMachines.usageDate': { $gte: startD, $lte: endD }
            });

            const targetUnit = Number(mach.machineUnitNumber) || 1;
            let isUnitBooked = false;
            for (const b of bookings) {
              for (const bm of b.requestedMachines) {
                if (bm.machineId.toString() === mach.machineId.toString()) {
                  if (new Date(bm.usageDate).toDateString() === usageDate.toDateString()) {
                    const bmUnit = Number(bm.machineUnitNumber) || 1;
                    if (bmUnit === targetUnit) {
                      if (timesOverlap(mach.startTime, mach.endTime, bm.startTime, bm.endTime)) {
                        isUnitBooked = true;
                        break;
                      }
                    }
                  }
                }
              }
              if (isUnitBooked) break;
            }

            if (isUnitBooked) {
              return res.status(400).json({
                message: `Double Booking Alert: Unit #${targetUnit} of machine "${machine.name}" is already booked from ${mach.startTime} to ${mach.endTime} on ${new Date(mach.usageDate).toLocaleDateString()}.`
              });
            }
          }
        }
      }
    }

    request.projectName = projectName;
    request.projectCategory = projectCategory;
    request.projectDescription = projectDescription;
    request.projectObjectives = projectObjectives;
    request.expectedOutcome = expectedOutcome;
    request.teamName = teamName;
    request.numberOfStudents = Number(numberOfStudents) || 1;
    request.students = students;
    request.facultyGuide = facultyGuide;
    request.requestedMachines = requestedMachines;
    request.requestedMaterials = requestedMaterials;
    request.uploadedFiles = uploadedFiles;
    request.benefits = benefits;
    request.declaration = declaration;

    if (status === 'Submitted' || status === 'Student Resubmitted') {
      request.status = status;
      request.approvalHistory.push({
        role: 'Student',
        action: 'Resubmitted',
        remarks: 'Student updated request details and resubmitted.',
        byName: req.user.name,
        date: new Date()
      });

      // Notify Faculty Guide if specified
      if (request.facultyGuide && request.facultyGuide.email) {
        await sendFacultyGuideNotification(request.facultyGuide, request.requestId, request.projectName, req.user ? req.user.name : 'Student', status);
      }

      // Notify Coordinator and Head
      const admins = await User.find({ role: { $in: ['coordinator', 'head'] } });
      for (const admin of admins) {
        await createInAppNotification(
          admin._id,
          'Resubmitted Request Review Needed',
          `Request ${request.requestId} has been resubmitted with updates by ${req.user.name}.`
        );
        try {
          const frontendUrl = process.env.FRONTEND_ORIGIN || 'https://ideahub-app.onrender.com';
          await sendEmail(
            admin.email,
            `Resubmitted Machinery/Material Request - ${request.requestId}`,
            `<h2>Dear ${admin.name},</h2>
             <p>The machinery/material request <b>${request.requestId}</b> has been resubmitted with updates by <b>${req.user.name}</b>.</p>
             <p>Review updated details on your dashboard: <a href="${frontendUrl}${admin.role === 'head' ? '/head-dashboard' : '/coordinator-dashboard'}">Go to Dashboard</a></p>
             <br/><p>Regards,<br/>AICTE IDEA Lab Team</p>`
          );
        } catch (err) {
          console.error('Failed to send admin email:', err);
        }
      }
    }

    // Sync backward compatibility fields
    const primaryMachine = requestedMachines && requestedMachines.length > 0 ? requestedMachines[0] : null;
    request.machineryId = primaryMachine ? primaryMachine.machineId : undefined;
    request.teamMembers = (students || []).slice(1).map(s => ({
      name: s.name,
      branch: s.branch,
      year: s.year,
      mobile: s.mobile,
      email: s.email
    }));
    request.usageDate = primaryMachine ? primaryMachine.usageDate : undefined;
    request.startTime = primaryMachine ? primaryMachine.startTime : undefined;
    request.endTime = primaryMachine ? primaryMachine.endTime : undefined;
    request.purpose = projectDescription || '';
    request.consentAgreed = declaration ? declaration.acceptResponsibility : false;
    request.groupPhotoUrl = uploadedFiles ? uploadedFiles.designFileUrl : '';

    const saved = await request.save();
    res.status(200).json(saved);
  } catch (error) {
    res.status(500).json({ message: 'Error updating request', error: error.message });
  }
};

// Fetch requests with search, filter, and population
export const getRequests = async (req, res) => {
  try {
    const { role, _id } = req.user;
    const { search, status, machine, material, date, applicantType, email, mobile } = req.query;

    let query = {};

    // Roll-based access logic
    if (role !== 'head' && role !== 'coordinator' && role !== 'admin') {
      // Student sees only theirs
      query.studentId = _id;
    }

    // Status filtering
    if (status) {
      query.status = status;
    }

    // Applicant Type filtering
    if (applicantType) {
      query.applicantType = applicantType;
    }

    // Machine filtering
    if (machine) {
      query['requestedMachines.machineId'] = machine;
    }

    // Material filtering
    if (material) {
      query['requestedMaterials.materialId'] = material;
    }

    // Date filtering
    if (date) {
      const targetDate = new Date(date);
      const start = new Date(targetDate.setHours(0,0,0,0));
      const end = new Date(targetDate.setHours(23,59,59,999));
      query['requestedMachines.usageDate'] = { $gte: start, $lte: end };
    }

    // Compound queries
    const andClauses = [];

    if (search) {
      andClauses.push({
        $or: [
          { requestId: { $regex: search, $options: 'i' } },
          { projectName: { $regex: search, $options: 'i' } },
          { teamName: { $regex: search, $options: 'i' } },
          { externalFullName: { $regex: search, $options: 'i' } },
          { externalCollegeOrg: { $regex: search, $options: 'i' } }
        ]
      });
    }

    if (email || mobile) {
      const emailMobileOr = [];
      if (email) {
        emailMobileOr.push({ externalEmail: email });
        emailMobileOr.push({ 'students.email': email });
      }
      if (mobile) {
        emailMobileOr.push({ externalMobile: mobile });
        emailMobileOr.push({ 'students.mobile': mobile });
      }
      if (emailMobileOr.length > 0) {
        andClauses.push({ $or: emailMobileOr });
      }
    }

    if (andClauses.length > 0) {
      query.$and = andClauses;
    }

    const requests = await MachineryRequest.find(query)
      .populate('studentId', 'name email mobile branch year')
      .populate('machineryId', 'name imageUrl')
      .populate('requestedMachines.machineId', 'name imageUrl capacity')
      .populate('requestedMaterials.materialId', 'name unit currentStock allocatedQuantity')
      .populate('materialAllocations.materialId', 'name unit')
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching requests', error: error.message });
  }
};

// Get single request detail (public or private)
export const getRequestById = async (req, res) => {
  try {
    const request = await MachineryRequest.findById(req.params.id)
      .populate('studentId', 'name email mobile branch year')
      .populate('machineryId', 'name imageUrl')
      .populate('requestedMachines.machineId', 'name imageUrl capacity')
      .populate('requestedMaterials.materialId', 'name unit currentStock allocatedQuantity')
      .populate('materialAllocations.materialId', 'name unit')
      .populate('approvedBy', 'name');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Verify request ownership for standard users
    const { role, _id } = req.user;
    if (role !== 'head' && role !== 'coordinator' && role !== 'admin') {
      if (request.studentId && request.studentId._id.toString() !== _id.toString()) {
        return res.status(403).json({ message: 'Access denied: You do not own this request' });
      }
    }

    res.status(200).json(request);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching request details', error: error.message });
  }
};

// Handle workflow status transitions (Coordinator & Head reviews)
export const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks, checks, conditions, identityVerification, machineCharges, materialCharges, paymentStatus, isUrgentPermission } = req.body;
    const { role, name } = req.user;

    const request = await MachineryRequest.findById(id)
      .populate('studentId', 'name email mobile')
      .populate('requestedMaterials.materialId', 'name unit currentStock allocatedQuantity')
      .populate('requestedMachines.machineId', 'name');

    if (!request) return res.status(404).json({ message: 'Request not found' });

    // Save previous status to check if it's newly transitioning to approved/rejected
    const oldStatus = request.status;

    // Validate Status values
    const allowedStatuses = [
      'Draft', 'Submitted', 'Coordinator Review', 'Coordinator Approved', 
      'Coordinator Rejected', 'Changes Requested', 'Student Resubmitted', 
      'Head Review', 'Approved', 'Rejected', 'Approved With Conditions', 
      'Material Allocated', 'Machine Scheduled', 'Active Booking', 'Work Completed', 'Closed', 'Completed', 'Cancelled'
    ];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    // Check roles
    if (['coordinator', 'head', 'admin'].includes(role) === false) {
      return res.status(403).json({ message: 'Only coordinators or heads can execute status actions.' });
    }

    // Apply reviews and Remarks
    if (status) request.status = status;
    if (remarks) {
      if (role === 'head') {
        request.headRemarks = remarks;
      } else {
        request.coordinatorRemarks = remarks;
      }
    }

    // Apply external details if provided
    if (identityVerification) {
      request.identityVerification = identityVerification;
    }
    if (machineCharges !== undefined) {
      request.machineCharges = Number(machineCharges) || 0;
    }
    if (materialCharges !== undefined) {
      request.materialCharges = Number(materialCharges) || 0;
    }
    request.totalCharges = (request.machineCharges || 0) + (request.materialCharges || 0);
    if (paymentStatus) {
      request.paymentStatus = paymentStatus;
    }

    // Record Coordinator Review checks
    if (checks) {
      request.coordinatorChecks = {
        machineAvailability: !!checks.machineAvailability,
        materialAvailability: !!checks.materialAvailability,
        projectFeasibility: !!checks.projectFeasibility,
        studentEligibility: !!checks.studentEligibility,
        previousUsageHistory: !!checks.previousUsageHistory
      };
    }

    // Record Head conditional approvals
    if (conditions) {
      request.headConditions = conditions;
    }

    // Record Audit trace
    const actionText = isUrgentPermission ? 'Urgent Permission Granted (Direct Approval)' : (status || 'Remarks Added');
    const actionRemarks = isUrgentPermission ? `URGENT PERMISSION GRANTED BY COORDINATOR. ${remarks || ''}` : (remarks || conditions || 'Status updated');

    request.approvalHistory.push({
      date: new Date(),
      role: role.toUpperCase(),
      action: actionText,
      remarks: actionRemarks,
      byName: name
    });

    // Handle Material Reservation/Stock Updates
    // Transitioning INTO Approved or Allocated state: reserve/allocate material stock
    const isApprovedState = ['Approved', 'Approved With Conditions', 'Material Allocated', 'Machine Scheduled', 'Active Booking', 'Work Completed', 'Closed'].includes(status);
    const wasApprovedState = ['Approved', 'Approved With Conditions', 'Material Allocated', 'Machine Scheduled', 'Active Booking', 'Work Completed', 'Closed'].includes(oldStatus);

    if (isApprovedState && !wasApprovedState) {
      // Deduct stock levels by adding to allocatedQuantity
      for (const mat of request.requestedMaterials) {
        if (mat.materialId) {
          const materialItem = await Material.findById(mat.materialId);
          if (materialItem) {
            materialItem.allocatedQuantity += mat.quantityRequired;
            await materialItem.save();
          }
        }
      }

      // Pre-populate materialAllocations array for tracking
      if (request.materialAllocations.length === 0) {
        request.materialAllocations = request.requestedMaterials.map(m => ({
          materialId: m.materialId,
          quantityRequested: m.quantityRequired,
          quantityIssued: 0,
          returnedQuantity: 0,
          balanceQuantity: 0
        }));
      }
    }

    // Transitioning OUT OF Approved/Allocated to Cancelled/Rejected/Completed: release allocation
    const isReleasedState = ['Completed', 'Cancelled', 'Rejected', 'Coordinator Rejected', 'Work Completed', 'Closed'].includes(status);
    if (isReleasedState && wasApprovedState) {
      for (const mat of request.requestedMaterials) {
        if (mat.materialId) {
          const materialItem = await Material.findById(mat.materialId);
          if (materialItem) {
            materialItem.allocatedQuantity = Math.max(0, materialItem.allocatedQuantity - mat.quantityRequired);
            
            // If completed, deduct the actually issued/consumed materials permanently from stock
            if (['Completed', 'Work Completed', 'Closed'].includes(status)) {
              const allocationRecord = request.materialAllocations.find(a => a.materialId.toString() === mat.materialId.toString());
              const consumedQty = allocationRecord ? (allocationRecord.quantityIssued - allocationRecord.returnedQuantity) : mat.quantityRequired;
              materialItem.currentStock = Math.max(0, materialItem.currentStock - consumedQty);
            }
            
            await materialItem.save();
          }
        }
      }
    }

    if (status === 'Approved' || status === 'Approved With Conditions') {
      request.approvedBy = req.user._id;
    }

    const saved = await request.save();

    // Trigger real-time notifications to the Student/External User
    if (request.studentId && request.studentId.email) {
      const studentEmail = request.studentId.email;
      const studentName = request.studentId.name;
      const machineNames = request.requestedMachines.map(m => m.machineName).join(', ') || 'IDEA Lab Resources';
      const frontendUrl = process.env.FRONTEND_ORIGIN || `${req.protocol}://${req.get('host')}`.replace('5000', '8080');
      
      let subject = `IDEA Hub: Request Status Updated - ${request.requestId}`;
      let bodyText = `<p>Dear ${studentName},</p>
                      <p>Your Request <b>${request.requestId}</b> for <b>${machineNames}</b> has been updated to <b>${status || request.status}</b>.</p>`;

      if (remarks) bodyText += `<p><b>Remarks:</b> ${remarks}</p>`;
      if (conditions) bodyText += `<p><b>Approval Conditions:</b> ${conditions}</p>`;
      bodyText += `<br/><p>Monitor details and print receipts: <a href="${frontendUrl}/verify-request/${request.requestId}">Track Request Status</a></p>
                  <p>Regards,<br/>IDEA Hub Team</p>`;

      try {
        await sendEmail(studentEmail, subject, bodyText);
        await createInAppNotification(request.studentId._id, `Request Status: ${status || request.status}`, `Your request ${request.requestId} was updated to ${status || request.status} by ${name}.`);
        await sendPushNotification(request.studentId._id, `Request ${status || request.status}`, `Request ${request.requestId} updated to ${status || request.status}.`);
      } catch (err) {
        console.error('Failed to trigger notifications:', err);
      }
    } else if (request.applicantType === 'External' && request.externalEmail) {
      const externalEmail = request.externalEmail;
      const externalName = request.externalFullName;
      const machineNames = request.requestedMachines.map(m => m.machineName).join(', ') || 'IDEA Lab Resources';
      
      let subject = `IDEA Hub: Request Status Updated - ${request.requestId}`;
      let bodyText = `<p>Dear ${externalName},</p>
                      <p>Your Request <b>${request.requestId}</b> for <b>${machineNames}</b> has been updated to <b>${status || request.status}</b>.</p>`;

      if (remarks) bodyText += `<p><b>Remarks:</b> ${remarks}</p>`;
      if (conditions) bodyText += `<p><b>Approval Conditions:</b> ${conditions}</p>`;
      if (request.totalCharges > 0 || request.machineCharges > 0 || request.materialCharges > 0) {
        bodyText += `<p><b>External Usage Charges:</b> ₹${request.totalCharges} (Machine: ₹${request.machineCharges}, Material: ₹${request.materialCharges})</p>
                     <p><b>Payment Status:</b> ${request.paymentStatus}</p>`;
      }
      const frontendUrl = process.env.FRONTEND_ORIGIN || `${req.protocol}://${req.get('host')}`.replace('5000', '8080');
      bodyText += `<br/><p>You can track updates and verify your request details using this link: 
                   <a href="${frontendUrl}/verify-request/${request.requestId}">Track Request</a></p>
                   <p>Regards,<br/>IDEA Hub Team</p>`;

      try {
        await sendEmail(externalEmail, subject, bodyText);
      } catch (err) {
        console.error('Failed to trigger email notification to external user:', err);
      }
    }

    // Notify Faculty Guide of status update if specified
    if (request.facultyGuide && request.facultyGuide.email) {
      const studentName = request.studentId ? request.studentId.name : (request.externalFullName || 'Student');
      await sendFacultyGuideNotification(request.facultyGuide, request.requestId, request.projectName, studentName, status || request.status, remarks);
    }

    res.status(200).json(saved);
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ message: 'Error updating request status', error: error.message });
  }
};

// Coordinator Action: Allocate / Issue Material quantities and update stock
export const issueMaterials = async (req, res) => {
  try {
    const { id } = req.params;
    const { allocations } = req.body; // Array of { materialId, quantityIssued }

    const request = await MachineryRequest.findById(id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    // Validate Coordinator/Admin role
    if (!['coordinator', 'head', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    // Process issue amounts
    for (const alloc of (allocations || [])) {
      const record = request.materialAllocations.find(a => a.materialId.toString() === alloc.materialId.toString());
      if (record) {
        const material = await Material.findById(alloc.materialId);
        if (material) {
          const diff = Number(alloc.quantityIssued) - record.quantityIssued;
          
          // Deduct from remaining stock
          if (material.currentStock < diff) {
            return res.status(400).json({ message: `Insufficient stock for "${material.name}". Only ${material.currentStock} units remaining.` });
          }

          record.quantityIssued = Number(alloc.quantityIssued);
          record.issuedDate = new Date();
          record.issuedBy = req.user._id;
          record.balanceQuantity = record.quantityIssued - record.returnedQuantity;
        }
      }
    }

    request.status = 'Material Allocated';
    request.approvalHistory.push({
      date: new Date(),
      role: req.user.role.toUpperCase(),
      action: 'Material Issued',
      remarks: 'Materials issued successfully to the student team.',
      byName: req.user.name
    });

    const saved = await request.save();
    res.status(200).json(saved);
  } catch (error) {
    res.status(500).json({ message: 'Error issuing materials', error: error.message });
  }
};

// Coordinator Action: Return Material/Tools and update database
export const returnResource = async (req, res) => {
  try {
    const { id } = req.params;
    const { returns } = req.body; // Array of { resourceType, resourceId, resourceName, returnedQuantity, condition, remarks }

    const request = await MachineryRequest.findById(id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (!['coordinator', 'head', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    for (const ret of (returns || [])) {
      // Record return logs
      request.returns.push({
        resourceType: ret.resourceType,
        resourceId: ret.resourceId,
        resourceName: ret.resourceName,
        returnedQuantity: Number(ret.returnedQuantity),
        returnDate: new Date(),
        condition: ret.condition || 'Good',
        remarks: ret.remarks || '',
        returnedBy: req.user.name
      });

      // Update allocations balance if it's a material return
      if (ret.resourceType === 'Material') {
        const alloc = request.materialAllocations.find(a => a.materialId.toString() === ret.resourceId.toString());
        if (alloc) {
          alloc.returnedQuantity += Number(ret.returnedQuantity);
          alloc.balanceQuantity = Math.max(0, alloc.quantityIssued - alloc.returnedQuantity);
        }

        // Restore returnable tools back into currentStock levels in the Inventory
        const material = await Material.findById(ret.resourceId);
        if (material) {
          material.currentStock += Number(ret.returnedQuantity);
          material.allocatedQuantity = Math.max(0, material.allocatedQuantity - Number(ret.returnedQuantity));
          await material.save();
        }
      }
    }

    request.status = 'Completed';
    request.actualExitTime = new Date();
    request.approvalHistory.push({
      date: new Date(),
      role: req.user.role.toUpperCase(),
      action: 'Completed',
      remarks: 'Resources returned, status marked as Completed.',
      byName: req.user.name
    });

    const saved = await request.save();
    res.status(200).json(saved);
  } catch (error) {
    res.status(500).json({ message: 'Error returning resource', error: error.message });
  }
};

// Check-in tracking (Usage Tracking)
export const checkInStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await MachineryRequest.findById(id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.actualEntryTime = new Date();
    request.approvalHistory.push({
      date: new Date(),
      role: req.user.role.toUpperCase(),
      action: 'Check In',
      remarks: 'Team checked in at IDEA Hub.',
      byName: req.user.name
    });

    const saved = await request.save();
    res.status(200).json(saved);
  } catch (error) {
    res.status(500).json({ message: 'Error during check-in', error: error.message });
  }
};

// Check-out tracking (Usage Tracking)
export const checkOutStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await MachineryRequest.findById(id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.actualExitTime = new Date();
    request.status = 'Completed';
    request.approvalHistory.push({
      date: new Date(),
      role: req.user.role.toUpperCase(),
      action: 'Check Out',
      remarks: 'Team checked out from IDEA Hub.',
      byName: req.user.name
    });

    const saved = await request.save();
    res.status(200).json(saved);
  } catch (error) {
    res.status(500).json({ message: 'Error during check-out', error: error.message });
  }
};

// Download Machinery/Material PDF
export const downloadMachineryPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await MachineryRequest.findById(id)
      .populate('studentId', 'name email mobile branch year')
      .populate('requestedMachines.machineId', 'name')
      .populate('requestedMaterials.materialId', 'name unit')
      .populate('approvedBy', 'name');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Verify request ownership for standard users
    const { role, _id } = req.user;
    if (role !== 'head' && role !== 'coordinator' && role !== 'admin') {
      if (request.studentId && request.studentId._id.toString() !== _id.toString()) {
        return res.status(403).json({ message: 'Access denied: You do not own this request' });
      }
    }

    const frontendUrl = process.env.FRONTEND_ORIGIN || process.env.FRONTEND_URL || 'https://ideahub-app.onrender.com';
    const qrData = `${frontendUrl}/verify-request/${request.requestId}`;

    // Compile data structure for PDF generator
    const data = {
      header: {
        applicationId: request.requestId,
        applicationDate: request.applicationDate ? new Date(request.applicationDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '',
        projectName: request.projectName,
        projectCategory: request.projectCategory,
        projectDescription: request.projectDescription,
        guideName: request.facultyGuide?.name || 'N/A',
      },
      student: {
        name: request.students[0]?.name || '',
        email: request.students[0]?.email || '',
        mobile: request.students[0]?.mobile || '',
        branch: request.students[0]?.branch || '',
        year: request.students[0]?.year || '',
        prn: request.students[0]?.prn || '',
      },
      requestedMachines: request.requestedMachines.map(m => ({
        name: m.machineId?.name || m.machineName,
        usageDate: m.usageDate ? new Date(m.usageDate).toLocaleDateString() : '',
        timeSlot: `${m.startTime} - ${m.endTime}`,
        hours: m.usageHours,
        purpose: m.purposeOfUsage
      })),
      requestedMaterials: request.requestedMaterials.map(m => ({
        name: m.materialId?.name || m.materialName,
        quantity: m.quantityRequired,
        purpose: m.purposeOfUsage
      })),
      teamMembers: request.students.map((s, i) => ({
        index: i + 1,
        name: s.name,
        branch: s.branch,
        year: s.year,
        prn: s.prn
      })),
      status: request.status,
      approvedBy: request.approvedBy?.name || '',
      approvalDate: request.updatedAt ? new Date(request.updatedAt).toLocaleDateString() : '',
      remarks: request.headRemarks || request.coordinatorRemarks || '',
      conditions: request.headConditions || '',
      qrData: qrData
    };

    const pdfPath = `uploads/pdfs/ResourceRequest_${request.requestId}_${request.status}_${new Date().toISOString().split('T')[0]}.pdf`;
    await generatePdf('machinery', data, pdfPath);

    res.download(pdfPath, (err) => {
      if (err) {
        console.error('Error sending PDF:', err);
        res.status(500).end();
      }
    });
  } catch (err) {
    console.error('Error generating PDF:', err);
    res.status(500).json({ message: 'Error generating PDF', error: err.message });
  }
};

// Public endpoint to verify PDF via Request ID
export const verifyPublicRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await MachineryRequest.findOne({ requestId })
      .populate('studentId', 'name email branch year prn')
      .populate('requestedMachines.machineId', 'name')
      .populate('requestedMaterials.materialId', 'name')
      .populate('approvedBy', 'name');

    if (!request) {
      return res.status(404).json({ message: 'Request not found for this ID' });
    }

    res.status(200).json(request);
  } catch (error) {
    res.status(500).json({ message: 'Error verifying request', error: error.message });
  }
};

// Student / Staff Action: complete machine work
export const completeWorkRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body || {};
    const request = await MachineryRequest.findById(id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    // Check if user is the student who made the request or coordinator/head/admin
    const isOwner = request.studentId.toString() === req.user._id.toString();
    const isStaff = ['coordinator', 'head', 'admin'].includes(req.user.role);
    if (!isOwner && !isStaff) {
      return res.status(403).json({ message: 'Unauthorized action' });
    }

    // Allowed statuses for completing work
    if (!['Machine Scheduled', 'Active Booking'].includes(request.status)) {
      return res.status(400).json({ message: 'Work completion is only allowed for scheduled or active bookings.' });
    }

    request.status = 'Work Completed';
    request.isWorkCompleted = true;
    request.completedAt = new Date();
    request.completedBy = req.user._id;
    request.machineReleased = true;
    request.completionRemarks = remarks || 'Student marked machine work as completed.';

    // Calculate actual usage hours
    let actualHours = 0;
    if (request.actualEntryTime) {
      const diffMs = new Date() - new Date(request.actualEntryTime);
      actualHours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));
    } else {
      // Fallback to scheduled startTime
      const primaryMachine = request.requestedMachines?.[0];
      if (primaryMachine && primaryMachine.usageDate && primaryMachine.startTime) {
        const usageDateStr = new Date(primaryMachine.usageDate).toISOString().split('T')[0];
        const scheduledStart = new Date(`${usageDateStr}T${primaryMachine.startTime}:00`);
        if (!isNaN(scheduledStart)) {
          const diffMs = new Date() - scheduledStart;
          actualHours = Math.max(0, Number((diffMs / (1000 * 60 * 60)).toFixed(2)));
        }
      }
    }
    if (isNaN(actualHours) || actualHours < 0) {
      actualHours = 0;
    }
    request.actualUsageHours = actualHours;

    // Audit log entry
    request.approvalHistory.push({
      date: new Date(),
      role: req.user.role.toUpperCase(),
      action: 'Work Completed',
      remarks: request.completionRemarks,
      byName: req.user.name
    });

    // Handle early release: shorten booked time if finished early
    const primaryMachine = request.requestedMachines?.[0];
    if (primaryMachine && primaryMachine.usageDate) {
      const now = new Date();
      const usageDateStr = new Date(primaryMachine.usageDate).toISOString().split('T')[0];
      const scheduledEnd = new Date(`${usageDateStr}T${primaryMachine.endTime}:00`);
      if (now < scheduledEnd) {
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const endTimeStr = minutesToTimeStr(currentMinutes);
        primaryMachine.endTime = endTimeStr;
      }
    }

    const saved = await request.save();

    // Send notifications
    await createInAppNotification(
      request.studentId,
      'Machine Work Completed',
      `Machine usage completed and released for Request ${request.requestId}.`
    );
    
    const coordinators = await User.find({ role: 'coordinator' });
    for (const coord of coordinators) {
      await createInAppNotification(
        coord._id,
        'Machine Work Completed',
        `Student ${req.user.name} completed work for Request ${request.requestId}.`
      );
    }

    res.status(200).json(saved);
  } catch (error) {
    console.error('Error completing work request:', error);
    res.status(500).json({ message: 'Error completing work request', error: error.message });
  }
};

// Student action: request booking extension
export const requestExtension = async (req, res) => {
  try {
    const { id } = req.params;
    const { extensionEndTime, reason } = req.body;

    if (!extensionEndTime || !reason) {
      return res.status(400).json({ message: 'Extension end time and reason are required' });
    }

    const request = await MachineryRequest.findById(id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    // Ensure user is owner or staff
    const isOwner = request.studentId.toString() === req.user._id.toString();
    const isStaff = ['coordinator', 'head', 'admin'].includes(req.user.role);
    if (!isOwner && !isStaff) {
      return res.status(403).json({ message: 'Unauthorized action' });
    }

    // Allowed statuses for extension
    if (!['Machine Scheduled', 'Active Booking'].includes(request.status)) {
      return res.status(400).json({ message: 'Extensions can only be requested for scheduled or active bookings.' });
    }

    request.extensionEndTime = extensionEndTime;
    request.extensionReason = reason;
    request.extensionStatus = 'Pending';

    request.approvalHistory.push({
      date: new Date(),
      role: req.user.role.toUpperCase(),
      action: 'Extension Requested',
      remarks: `Requested extension to ${extensionEndTime}. Reason: ${reason}`,
      byName: req.user.name
    });

    const saved = await request.save();

    // Notify coordinators
    const coordinators = await User.find({ role: 'coordinator' });
    for (const coord of coordinators) {
      await createInAppNotification(
        coord._id,
        'Extension Requested',
        `Request ${request.requestId} has requested an extension to ${extensionEndTime}.`
      );
    }

    res.status(200).json(saved);
  } catch (error) {
    console.error('Error requesting extension:', error);
    res.status(500).json({ message: 'Error requesting extension', error: error.message });
  }
};

// Coordinator action: Approve/Reject booking extension
export const handleExtension = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body; // status: 'Approved' or 'Rejected'

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid extension status decision' });
    }

    const request = await MachineryRequest.findById(id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    // Validate Coordinator/Admin role
    if (!['coordinator', 'head', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    if (request.extensionStatus !== 'Pending') {
      return res.status(400).json({ message: 'No pending extension request found' });
    }

    request.extensionStatus = status;

    if (status === 'Approved') {
      // Update primary machine slot's end time
      const primaryMachine = request.requestedMachines?.[0];
      if (primaryMachine) {
        primaryMachine.endTime = request.extensionEndTime;
        // Recalculate usageHours
        if (primaryMachine.startTime) {
          const diffMins = parseTimeToMinutes(primaryMachine.endTime) - parseTimeToMinutes(primaryMachine.startTime);
          primaryMachine.usageHours = Math.max(0, Number((diffMins / 60).toFixed(2)));
        }
      }
      // Reset reminder flag and extension status details so they can request another later if needed
      request.completionReminderSent = false;
      request.extensionStatus = null;
      request.extensionEndTime = null;
      request.extensionReason = null;
    }

    request.approvalHistory.push({
      date: new Date(),
      role: req.user.role.toUpperCase(),
      action: `Extension ${status}`,
      remarks: remarks || `Extension request was ${status.toLowerCase()} by coordinator.`,
      byName: req.user.name
    });

    const saved = await request.save();

    // Notify student
    await createInAppNotification(
      request.studentId,
      `Extension ${status}`,
      `Your extension request for ${request.requestId} was ${status.toLowerCase()}.`
    );

    res.status(200).json(saved);
  } catch (error) {
    console.error('Error handling extension:', error);
    res.status(500).json({ message: 'Error handling extension', error: error.message });
  }
};

// 19. Download Machinery Usage Report (Excel, CSV, PDF)
export const downloadMachineryUsageReport = async (req, res) => {
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

    let query = { status: { $ne: 'Draft' } };
    let dateRangeStr = '';

    if (rangeType === 'Today') {
      const start = new Date(today.setHours(0,0,0,0));
      const end = new Date(today.setHours(23,59,59,999));
      query['requestedMachines.usageDate'] = { $gte: start, $lte: end };
      dateRangeStr = startStr;
    } else if (rangeType === 'Custom Date Range' || rangeType === 'Custom') {
      const start = new Date(fromDate);
      start.setHours(0,0,0,0);
      const end = new Date(toDate);
      end.setHours(23,59,59,999);
      query['requestedMachines.usageDate'] = { $gte: start, $lte: end };
      dateRangeStr = `${fromDate} to ${toDate}`;
    } else {
      const start = new Date(startStr);
      start.setHours(0,0,0,0);
      query['requestedMachines.usageDate'] = { $gte: start };
      dateRangeStr = `From ${startStr}`;
    }

    const requests = await MachineryRequest.find(query)
      .populate('studentId', 'name email mobile branch year')
      .populate('requestedMachines.machineId', 'name')
      .populate('requestedMaterials.materialId', 'name unit')
      .sort({ 'requestedMachines.usageDate': 1, createdAt: 1 });

    if (format === 'csv') {
      const headers = [
        'Request ID', 'Applicant Type', 'Applicant Name', 'Org/College', 'Project Name',
        'Machine Booked', 'Usage Date', 'Time Slot', 'Duration (Hrs)', 'Total Charges',
        'Payment Status', 'Status'
      ];
      const csvRows = [headers.join(',')];

      requests.forEach(r => {
        const isExt = r.applicantType === 'External';
        const applicantName = isExt ? r.externalFullName : (r.students?.[0]?.name || 'N/A');
        const orgCollege = isExt ? r.externalCollegeOrg : 'K.K. Wagh IEER';
        
        r.requestedMachines.forEach(m => {
          const uDate = m.usageDate ? new Date(m.usageDate).toLocaleDateString('en-IN') : 'N/A';
          const rowData = [
            r.requestId,
            r.applicantType || 'Internal',
            applicantName || 'N/A',
            orgCollege || 'N/A',
            r.projectName || 'N/A',
            m.machineId?.name || m.machineName || 'N/A',
            uDate,
            `${m.startTime} - ${m.endTime}`,
            m.usageHours || 0,
            r.totalCharges || 0,
            r.paymentStatus || 'N/A',
            r.status
          ];
          const escapedRow = rowData.map(val => {
            const strVal = String(val).replace(/"/g, '""');
            return `"${strVal}"`;
          });
          csvRows.push(escapedRow.join(','));
        });
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="MachineryUsageReport_${rangeType.replace(/\s+/g, '_')}_${startStr}.csv"`);
      return res.send(csvRows.join('\n'));

    } else if (format === 'pdf') {
      const pdfPath = `uploads/pdfs/MachineryUsageReport_${rangeType.replace(/\s+/g, '_')}_${startStr}.pdf`;
      const data = {
        dateRangeStr,
        requests
      };

      await generatePdf('machineryUsageReport', data, pdfPath);

      return res.download(pdfPath, (err) => {
        if (err) {
          console.error('Error sending PDF machinery report:', err);
          if (!res.headersSent) {
            res.status(500).end();
          }
        }
      });

    } else {
      // Excel Format
      const reportData = [];
      requests.forEach(r => {
        const isExt = r.applicantType === 'External';
        const applicantName = isExt ? r.externalFullName : (r.students?.[0]?.name || 'N/A');
        const orgCollege = isExt ? r.externalCollegeOrg : 'K.K. Wagh IEER';

        r.requestedMachines.forEach(m => {
          const uDate = m.usageDate ? new Date(m.usageDate).toLocaleDateString('en-IN') : 'N/A';
          reportData.push({
            'Request ID': r.requestId,
            'Applicant Type': r.applicantType || 'Internal',
            'Applicant Name': applicantName || 'N/A',
            'Org/College': orgCollege || 'N/A',
            'Project Name': r.projectName || 'N/A',
            'Machine Booked': m.machineId?.name || m.machineName || 'N/A',
            'Usage Date': uDate,
            'Time Slot': `${m.startTime} - ${m.endTime}`,
            'Duration (Hrs)': m.usageHours || 0,
            'Total Charges': r.totalCharges || 0,
            'Payment Status': r.paymentStatus || 'N/A',
            'Status': r.status
          });
        });
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(reportData);
      XLSX.utils.book_append_sheet(wb, ws, "Machinery Usage Report");

      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="MachineryUsageReport_${rangeType.replace(/\s+/g, '_')}_${startStr}.xlsx"`);
      return res.send(buffer);
    }

  } catch (error) {
    console.error('Error generating machinery report:', error);
    res.status(500).json({ message: 'Error generating machinery report', error: error.message });
  }
};

