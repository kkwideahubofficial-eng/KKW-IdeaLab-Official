import Event from '../models/Event.js';
import EventRegistration from '../models/EventRegistration.js';
import EventNotification from '../models/EventNotification.js';
import User from '../models/User.js';
import { generateCertificatePdf } from '../utils/certificateGenerator.js';
import { validationResult } from 'express-validator';
import path from 'path';
import fs from 'fs';
import sendEmail from '../utils/sendEmail.js';
import { deleteFromCloudinary } from '../utils/deleteCloudinaryImage.js';

// Helper function to send notification to database
const createNotification = async (userId, title, body, type) => {
  try {
    const notification = new EventNotification({
      user: userId,
      title,
      body,
      type
    });
    await notification.save();
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

// @desc    Create an event
// @route   POST /api/events
// @access  Private/Coordinator
export const createEvent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      title, description, date, organizer, category, objectives,
      startTime, endTime, registrationStartDate, registrationEndDate,
      venue, building, roomNumber, totalSeats, minTeamSize, maxTeamSize,
      participationType, allowedBranches, allowedYears, requiredSkills, coordinatorName,
      coordinatorContact, rules, eligibilityCriteria, schedule, isPublished
    } = req.body;

    const imageUrl = req.file ? req.file.path : (req.body.imageUrl || '');
    
    const parseArray = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      try {
        return JSON.parse(val);
      } catch (e) {
        return val.split(',').map(s => s.trim()).filter(Boolean);
      }
    };

    const newEvent = new Event({
      title,
      description,
      date,
      organizer,
      imageUrl,
      category: category || 'General',
      objectives: objectives || '',
      startTime: startTime || '10:00 AM',
      endTime: endTime || '05:00 PM',
      registrationStartDate: registrationStartDate ? new Date(registrationStartDate) : Date.now(),
      registrationEndDate: registrationEndDate ? new Date(registrationEndDate) : Date.now(),
      venue: venue || 'IDEA Lab',
      building: building || '',
      roomNumber: roomNumber || '',
      totalSeats: totalSeats ? parseInt(totalSeats, 10) : 50,
      participationType: participationType || 'Both Allowed',
      minTeamSize: minTeamSize ? parseInt(minTeamSize, 10) : 1,
      maxTeamSize: maxTeamSize ? parseInt(maxTeamSize, 10) : 10,
      allowedBranches: parseArray(allowedBranches),
      allowedYears: parseArray(allowedYears),
      requiredSkills: parseArray(requiredSkills),
      coordinatorName: coordinatorName || '',
      coordinatorContact: coordinatorContact || '',
      rules: rules || '',
      eligibilityCriteria: eligibilityCriteria || '',
      schedule: schedule || '',
      isPublished: isPublished !== undefined ? isPublished === 'true' || isPublished === true : true
    });

    const event = await newEvent.save();
    
    // Broadcast notification to all student users about new event
    const students = await User.find({ role: 'team' });
    const promises = students.map(student => 
      createNotification(
        student._id, 
        'New Event Published', 
        `A new event "${event.title}" has been scheduled for ${new Date(event.date).toLocaleDateString()}. Register now!`, 
        'event_published'
      )
    );
    await Promise.all(promises);

    res.status(201).json(event);
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc    Get all events (Student and Coordinator view with filters)
// @route   GET /api/events
// @access  Public
export const getAllEvents = async (req, res) => {
  try {
    const { category, search, branch, status, date } = req.query;
    
    let query = {};
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { organizer: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (branch) {
      query.$or = [
        { allowedBranches: { $size: 0 } },
        { allowedBranches: branch }
      ];
    }
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    let events = await Event.find(query).sort({ date: 1 });
    
    const enrichedEvents = events.map(event => {
      const eventObj = event.toObject();
      eventObj.status = event.getStatus();
      return eventObj;
    });

    let finalEvents = enrichedEvents;
    if (status) {
      finalEvents = enrichedEvents.filter(e => e.status.toLowerCase() === status.toLowerCase());
    }

    res.json(finalEvents);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get event by ID
// @route   GET /api/events/:id
// @access  Public
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    const eventObj = event.toObject();
    eventObj.status = event.getStatus();
    
    const registrations = await EventRegistration.find({ event: event._id, status: { $ne: 'rejected' } });
    eventObj.registeredSeats = registrations.length;
    eventObj.availableSeats = Math.max(0, event.totalSeats - registrations.length);
    
    res.json(eventObj);
  } catch (err) {
    console.error('Error fetching event details:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private/Coordinator
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const {
      title, description, date, organizer, category, objectives,
      startTime, endTime, registrationStartDate, registrationEndDate,
      venue, building, roomNumber, totalSeats, minTeamSize, maxTeamSize,
      participationType, allowedBranches, allowedYears, requiredSkills, coordinatorName,
      coordinatorContact, rules, eligibilityCriteria, schedule, isPublished, statusOverride
    } = req.body;

    const parseArray = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      try {
        return JSON.parse(val);
      } catch (e) {
        return val.split(',').map(s => s.trim()).filter(Boolean);
      }
    };

    event.title = title !== undefined ? title : event.title;
    event.description = description !== undefined ? description : event.description;
    event.date = date !== undefined ? new Date(date) : event.date;
    event.organizer = organizer !== undefined ? organizer : event.organizer;
    
    event.category = category !== undefined ? category : event.category;
    event.objectives = objectives !== undefined ? objectives : event.objectives;
    event.startTime = startTime !== undefined ? startTime : event.startTime;
    event.endTime = endTime !== undefined ? endTime : event.endTime;
    event.registrationStartDate = registrationStartDate !== undefined ? new Date(registrationStartDate) : event.registrationStartDate;
    event.registrationEndDate = registrationEndDate !== undefined ? new Date(registrationEndDate) : event.registrationEndDate;
    event.venue = venue !== undefined ? venue : event.venue;
    event.building = building !== undefined ? building : event.building;
    event.roomNumber = roomNumber !== undefined ? roomNumber : event.roomNumber;
    event.totalSeats = totalSeats !== undefined ? parseInt(totalSeats, 10) : event.totalSeats;
    event.minTeamSize = minTeamSize !== undefined ? parseInt(minTeamSize, 10) : event.minTeamSize;
    event.maxTeamSize = maxTeamSize !== undefined ? parseInt(maxTeamSize, 10) : event.maxTeamSize;
    event.participationType = participationType !== undefined ? participationType : event.participationType;
    
    if (allowedBranches !== undefined) event.allowedBranches = parseArray(allowedBranches);
    if (allowedYears !== undefined) event.allowedYears = parseArray(allowedYears);
    if (requiredSkills !== undefined) event.requiredSkills = parseArray(requiredSkills);
    
    event.coordinatorName = coordinatorName !== undefined ? coordinatorName : event.coordinatorName;
    event.coordinatorContact = coordinatorContact !== undefined ? coordinatorContact : event.coordinatorContact;
    event.rules = rules !== undefined ? rules : event.rules;
    event.eligibilityCriteria = eligibilityCriteria !== undefined ? eligibilityCriteria : event.eligibilityCriteria;
    event.schedule = schedule !== undefined ? schedule : event.schedule;
    
    if (isPublished !== undefined) {
      event.isPublished = isPublished === 'true' || isPublished === true;
    }
    
    if (statusOverride !== undefined) {
      event.statusOverride = statusOverride === 'Cancelled' ? 'Cancelled' : null;
    }

    if (req.file) {
      event.imageUrl = req.file.path;
    } else if (req.body.imageUrl !== undefined) {
      event.imageUrl = req.body.imageUrl;
    }

    await event.save();
    res.json(event);
  } catch (err) {
    console.error('Error updating event:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private/Coordinator
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.imageUrl) {
      await deleteFromCloudinary(event.imageUrl);
    }

    await EventRegistration.deleteMany({ event: event._id });
    await event.deleteOne();
    res.json({ message: 'Event removed and all registrations cleaned up' });
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Register for an event with Dynamic Team lists
// @route   POST /api/events/:id/register
// @access  Private/Student
export const registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const currentStatus = event.getStatus();
    if (currentStatus !== 'Registration Open') {
      return res.status(400).json({ message: `Registration is not open. Event status: ${currentStatus}` });
    }

    const existingRegCount = await EventRegistration.countDocuments({ event: event._id, status: { $ne: 'rejected' } });
    if (existingRegCount >= event.totalSeats) {
      return res.status(400).json({ message: 'Event is fully booked. No available seats.' });
    }

    const existingRegistration = await EventRegistration.findOne({ event: event._id, student: req.user._id });
    if (existingRegistration) {
      return res.status(400).json({ message: 'You have already registered for this event.' });
    }

    const {
      teamName, teamSize, projectTitle, problemStatement, projectDescription, skills,
      teamMembers, declarationConfirmed
    } = req.body;

    if (!declarationConfirmed) {
      return res.status(400).json({ message: 'You must confirm the declarations.' });
    }

    if (!Array.isArray(teamMembers) || teamMembers.length === 0) {
      return res.status(400).json({ message: 'Team members must be a non-empty array.' });
    }

    // Dynamic Team Validations
    const size = parseInt(teamSize, 10) || 1;
    if (teamMembers.length !== size) {
      return res.status(400).json({ message: `Team size (${size}) does not match the members provided (${teamMembers.length}).` });
    }

    // Min & Max check
    if (size < event.minTeamSize || size > event.maxTeamSize) {
      return res.status(400).json({ message: `Team size must be between ${event.minTeamSize} and ${event.maxTeamSize}.` });
    }

    // Participation Type checks
    if (event.participationType === 'Individual Only' && size !== 1) {
      return res.status(400).json({ message: 'Only individual registrations are allowed for this event.' });
    }
    if (event.participationType === 'Team Only' && size <= 1) {
      return res.status(400).json({ message: 'Only team registrations are allowed for this event.' });
    }

    // Duplicate Checks inside registration body
    const prns = teamMembers.map(m => m.prn.trim().toUpperCase());
    const rolls = teamMembers.map(m => m.rollNumber.trim().toUpperCase());
    const emails = teamMembers.map(m => m.email.trim().toLowerCase());

    if (new Set(prns).size !== prns.length) {
      return res.status(400).json({ message: 'Duplicate PRN numbers found within team members.' });
    }
    if (new Set(rolls).size !== rolls.length) {
      return res.status(400).json({ message: 'Duplicate Roll numbers found within team members.' });
    }
    if (new Set(emails).size !== emails.length) {
      return res.status(400).json({ message: 'Duplicate Emails found within team members.' });
    }

    // Ensure Team Leader exists
    const leaderIndex = teamMembers.findIndex(m => m.isTeamLeader);
    if (leaderIndex === -1) {
      return res.status(400).json({ message: 'A team leader must be designated.' });
    }

    const regId = `REG-EVT-${Math.floor(100000 + Math.random() * 900000)}`;

    const newRegistration = new EventRegistration({
      event: event._id,
      student: req.user._id,
      registrationId: regId,
      teamName: teamName || `${teamMembers[leaderIndex].fullName}'s Team`,
      teamSize: size,
      projectTitle: projectTitle || '',
      problemStatement: problemStatement || '',
      projectDescription: projectDescription || '',
      skills: skills || '',
      teamMembers,
      declarationConfirmed
    });

    await newRegistration.save();

    // Notify student leader
    await createNotification(
      req.user._id,
      'Registration Submitted',
      `Your team registration for "${event.title}" has been submitted. Registration ID: ${regId}.`,
      'registration_submitted'
    );

    // Notify Coordinators
    const coordinators = await User.find({ role: 'coordinator' });
    const promises = coordinators.map(coord => 
      createNotification(
        coord._id,
        'New Registration Received',
        `New registration (ID: ${regId}) submitted by ${teamMembers[leaderIndex].fullName} for event "${event.title}".`,
        'new_registration'
      )
    );
    await Promise.all(promises);

    res.status(201).json(newRegistration);
  } catch (err) {
    console.error('Error registering for event:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc    Get student's own registration history
// @route   GET /api/events/student/registrations
// @access  Private/Student
export const getStudentRegistrations = async (req, res) => {
  try {
    const registrations = await EventRegistration.find({ student: req.user._id })
      .populate('event')
      .sort({ createdAt: -1 });

    const enrichedRegistrations = registrations.map(reg => {
      const regObj = reg.toObject();
      if (reg.event) {
        regObj.event.status = reg.event.getStatus();
      }
      return regObj;
    });

    res.json(enrichedRegistrations);
  } catch (err) {
    console.error('Error fetching registrations:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all registrations for an event (Coordinator view)
// @route   GET /api/events/:id/registrations
// @access  Private/Coordinator
export const getEventRegistrations = async (req, res) => {
  try {
    const registrations = await EventRegistration.find({ event: req.params.id })
      .populate('student', 'name email branch year')
      .sort({ createdAt: -1 });

    res.json(registrations);
  } catch (err) {
    console.error('Error fetching registrations:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Approve or Reject participant registration
// @route   PATCH /api/events/registrations/status
// @access  Private/Coordinator
export const updateRegistrationStatus = async (req, res) => {
  try {
    const { registrationIds, status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status decision.' });
    }

    if (!Array.isArray(registrationIds) || registrationIds.length === 0) {
      return res.status(400).json({ message: 'Registration IDs must be a non-empty array.' });
    }

    const registrations = await EventRegistration.find({ _id: { $in: registrationIds } }).populate('event');

    const promises = registrations.map(async (reg) => {
      reg.status = status;
      await reg.save();

      // Find team leader email
      const leader = reg.teamMembers.find(m => m.isTeamLeader) || reg.teamMembers[0];
      const studentEmail = leader?.email;

      // Notify student leader
      const title = status === 'approved' ? 'Registration Approved' : 'Registration Rejected';
      const body = status === 'approved' 
        ? `Congratulations! Your registration for "${reg.event.title}" has been approved.`
        : `We regret to inform you that your registration for "${reg.event.title}" has been rejected.`;
      
      await createNotification(reg.student, title, body, `registration_${status}`);

      // Send Email Notification
      if (studentEmail) {
        const subject = `AICTE IDEA Lab: ${title} - ${reg.event.title}`;
        
        let htmlContent = '';
        if (status === 'approved') {
          htmlContent = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #10b981;">Registration Approved! 🎉</h2>
              <p>Dear ${leader?.fullName || 'Student'},</p>
              <p>Congratulations! Your registration for the event <strong>"${reg.event.title}"</strong> has been approved.</p>
              
              <h3 style="margin-top: 20px;">Event Details:</h3>
              <ul style="line-height: 1.6; padding-left: 20px;">
                <li><strong>Event:</strong> ${reg.event.title}</li>
                <li><strong>Date:</strong> ${new Date(reg.event.date).toLocaleDateString()}</li>
                <li><strong>Time:</strong> ${reg.event.startTime} - ${reg.event.endTime}</li>
                <li><strong>Venue:</strong> ${reg.event.venue} ${reg.event.roomNumber ? `(Room: ${reg.event.roomNumber})` : ''}</li>
              </ul>
              
              <p style="margin-top: 20px;">Please ensure you arrive on time. If you have any questions, you can contact the coordinator: ${reg.event.coordinatorName || 'the organizing team'} ${reg.event.coordinatorContact ? `(${reg.event.coordinatorContact})` : ''}.</p>
              
              <br/>
              <p>Best regards,<br/><strong>AICTE IDEA Lab Team</strong></p>
            </div>
          `;
        } else {
          htmlContent = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #ef4444;">Registration Status Update</h2>
              <p>Dear ${leader?.fullName || 'Student'},</p>
              <p>We regret to inform you that your registration for the event <strong>"${reg.event.title}"</strong> has been rejected.</p>
              <p>This may be due to limited seating capacity or eligibility criteria not being met.</p>
              <p>Thank you for your interest, and we hope to see you in future events.</p>
              
              <br/>
              <p>Best regards,<br/><strong>AICTE IDEA Lab Team</strong></p>
            </div>
          `;
        }
        
        try {
          await sendEmail(studentEmail, subject, htmlContent);
        } catch (e) {
          console.error("Failed to send email to", studentEmail, e);
        }
      }
    });

    await Promise.all(promises);
    res.json({ message: `Successfully updated ${registrationIds.length} registration(s) to ${status}.` });
  } catch (err) {
    console.error('Error updating registration status:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Mark attendance for individual team members (Single/Bulk updates)
// @route   PATCH /api/events/attendance
// @access  Private/Coordinator
export const markAttendanceBulk = async (req, res) => {
  try {
    const { updates } = req.body; // Array of { registrationId, memberId, attendance: 'present'|'absent' }

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: 'Updates must be a non-empty array' });
    }

    for (const update of updates) {
      const reg = await EventRegistration.findById(update.registrationId).populate('event');
      if (reg) {
        const member = reg.teamMembers.id(update.memberId);
        if (member) {
          member.attendance = update.attendance;
          
          // Generate certificate code if approved + present
          if (update.attendance === 'present' && reg.status === 'approved' && !member.certificateNumber) {
            member.certificateNumber = `CERT-EVT-${Math.floor(10000000 + Math.random() * 90000000)}`;
            member.certificateGeneratedAt = new Date();

            // Notify student leader
            await createNotification(
              reg.student,
              'Certificate Available',
              `A certificate for "${reg.event.title}" is generated for member ${member.fullName}!`,
              'certificate_available'
            );
          }
          await reg.save();
        }
      }
    }

    res.json({ message: `Successfully updated attendance for selected team members.` });
  } catch (err) {
    console.error('Error marking attendance:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Download student certificate as PDF
// @route   GET /api/events/certificate/:registrationId
// @access  Private
export const downloadCertificate = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { memberId } = req.query; // specific member

    const registration = await EventRegistration.findOne({ registrationId })
      .populate('event')
      .populate('student');

    if (!registration) {
      return res.status(404).json({ message: 'Registration record not found' });
    }

    if (req.user.role !== 'coordinator' && String(registration.student._id) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Unauthorized to download this certificate' });
    }

    const member = memberId 
      ? registration.teamMembers.id(memberId) 
      : registration.teamMembers.find(m => m.isTeamLeader);

    if (!member) {
      return res.status(404).json({ message: 'Team member not found' });
    }

    if (registration.status !== 'approved' || member.attendance !== 'present') {
      return res.status(400).json({ message: 'Certificate only available for approved, present participants' });
    }

    const certData = {
      studentName: member.fullName,
      eventName: registration.event.title,
      eventDate: registration.event.date,
      organizer: registration.event.organizer,
      coordinatorName: registration.event.coordinatorName,
      certificateNumber: member.certificateNumber,
      generatedAt: member.certificateGeneratedAt || new Date()
    };

    const fileName = `certificate_${registration.registrationId}_${member._id}.pdf`;
    const tempFilePath = path.resolve(`uploads/${fileName}`);

    await generateCertificatePdf(certData, tempFilePath);

    res.download(tempFilePath, fileName, (err) => {
      if (err) {
        console.error('Error sending certificate PDF:', err);
      }
      fs.unlink(tempFilePath, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting temp certificate file:', unlinkErr);
      });
    });

  } catch (err) {
    console.error('Error downloading certificate:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc    Get dashboard event analytics
// @route   GET /api/events/dashboard/analytics
// @access  Private/Coordinator
export const getEventAnalytics = async (req, res) => {
  try {
    const totalEvents = await Event.countDocuments();
    
    const events = await Event.find();
    let upcomingCount = 0;
    let ongoingCount = 0;
    let completedCount = 0;
    
    events.forEach(e => {
      const status = e.getStatus();
      if (status === 'Upcoming' || status === 'Registration Open') upcomingCount++;
      else if (status === 'Ongoing') ongoingCount++;
      else if (status === 'Completed' || status === 'Registration Closed') completedCount++;
    });

    const totalRegistrations = await EventRegistration.countDocuments();
    
    // Sum of approved team members
    const approvedRegs = await EventRegistration.find({ status: 'approved' });
    const approvedParticipants = approvedRegs.reduce((acc, r) => acc + r.teamMembers.length, 0);

    // Sum of present/absent approved members
    let presentCount = 0;
    let absentCount = 0;
    let certificatesGenerated = 0;
    approvedRegs.forEach(r => {
      r.teamMembers.forEach(m => {
        if (m.attendance === 'present') presentCount++;
        if (m.attendance === 'absent') absentCount++;
        if (m.certificateNumber) certificatesGenerated++;
      });
    });

    const attendedCount = presentCount + absentCount;
    const attendancePercentage = attendedCount > 0 ? Math.round((presentCount / attendedCount) * 100) : 0;

    // Chart 1: Registrations per event (number of teams)
    const regPerEvent = await EventRegistration.aggregate([
      { $group: { _id: '$event', count: { $sum: 1 } } },
      { $lookup: { from: 'events', localField: '_id', foreignField: '_id', as: 'eventDetails' } },
      { $unwind: '$eventDetails' },
      { $project: { name: '$eventDetails.title', count: 1 } },
      { $limit: 10 }
    ]);

    // Chart 2: Attendance per event (in Javascript for precision)
    const attendanceMap = {};
    const allApprovedRegs = await EventRegistration.find({ status: 'approved' }).populate('event');
    allApprovedRegs.forEach(r => {
      if (!r.event) return;
      const title = r.event.title;
      if (!attendanceMap[title]) {
        attendanceMap[title] = { name: title, present: 0, absent: 0 };
      }
      r.teamMembers.forEach(m => {
        if (m.attendance === 'present') attendanceMap[title].present++;
        if (m.attendance === 'absent') attendanceMap[title].absent++;
      });
    });
    const attendancePerEvent = Object.values(attendanceMap).slice(0, 10);

    // Chart 3: Department participation (across all registered members)
    const deptMap = {};
    const allRegs = await EventRegistration.find();
    allRegs.forEach(r => {
      r.teamMembers.forEach(m => {
        const dept = (m.department || 'General').toUpperCase();
        deptMap[dept] = (deptMap[dept] || 0) + 1;
      });
    });
    const deptParticipation = Object.entries(deptMap).map(([name, count]) => ({ name, count }));

    // Chart 4: Year wise participation (across all registered members)
    const yearMap = {};
    allRegs.forEach(r => {
      r.teamMembers.forEach(m => {
        const yr = (m.year || 'N/A').toUpperCase();
        yearMap[yr] = (yearMap[yr] || 0) + 1;
      });
    });
    const yearParticipation = Object.entries(yearMap).map(([name, count]) => ({ name, count }));

    res.json({
      summary: {
        totalEvents,
        upcomingEvents: upcomingCount,
        ongoingEvents: ongoingCount,
        completedEvents: completedCount,
        totalRegistrations,
        approvedParticipants,
        attendancePercentage,
        certificatesGenerated
      },
      charts: {
        regPerEvent,
        attendancePerEvent,
        deptParticipation,
        yearParticipation
      }
    });
  } catch (err) {
    console.error('Error fetching analytics:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get student notifications
// @route   GET /api/events/student/notifications
// @access  Private
export const getStudentNotifications = async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    // Delete notifications older than 7 days
    await EventNotification.deleteMany({ createdAt: { $lt: sevenDaysAgo } });

    const notifications = await EventNotification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30);
    res.json(notifications);
  } catch (err) {
    console.error('Error loading notifications:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Mark notification read
// @route   PATCH /api/events/student/notifications/:id/read
// @access  Private
export const markNotificationRead = async (req, res) => {
  try {
    const notification = await EventNotification.findOne({ _id: req.params.id, user: req.user._id });
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    notification.isRead = true;
    await notification.save();
    res.json({ message: 'Marked as read' });
  } catch (err) {
    console.error('Error updating notification:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};
