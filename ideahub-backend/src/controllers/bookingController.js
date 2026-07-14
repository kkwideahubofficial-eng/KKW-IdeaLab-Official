import QRCode from 'qrcode';
import { validationResult } from 'express-validator';
import Booking from '../models/Booking.js';
import Room from '../models/Room.js';
import sendEmail from '../utils/sendEmail.js';
import PushSubscription from '../models/PushSubscription.js';
import webpush from '../config/webPush.js';
import generatePdf from '../utils/pdfGenerator.js';

function timesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

export async function getRoomAvailability(req, res) {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }



    // CHANGED: Fetch all normal rooms (excluding special ones) so we can show "Unavailable" message for inactive ones
    const rooms = await Room.find({ isSpecial: { $ne: true } }); 
    const roomIds = rooms.map(r => r._id);

    const bookings = await Booking.find({
      room: { $in: roomIds }, 
      slotDate: date, // Exact string match "YYYY-MM-DD"
      status: { $ne: 'rejected' } // Include pending and approved
    });

    // Map bookings to rooms
    const result = rooms.map(room => {
      const roomBookings = bookings.filter(b => b.room.toString() === room._id.toString());
      return {
        ...room.toObject(),
        bookings: roomBookings.map(b => ({
          startTime: b.startTime,
          endTime: b.endTime,
          teamSize: b.teamSize,
          status: b.status
        }))
      };
    });

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch room availability', error: err.message });
  }
}

export async function createBooking(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { slotDate, startTime, endTime, purpose, description, teamName, roomId, teamSize } = req.body;
    const teamId = req.user._id;
    
    // Validate time range
    if (startTime >= endTime) {
      return res.status(400).json({ 
        message: 'Invalid time range: Start Time must be strictly before End Time. If you meant 8 PM, please use 20:00.' 
      });
    }

    if (!roomId || !teamSize) {
      return res.status(400).json({ message: 'Room and Team Size are required' });
    }

    // validate team size
    if (teamSize < 1) {
       return res.status(400).json({ message: 'Team Size must be at least 1' });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (teamSize > room.capacity) {
      return res.status(400).json({ message: `Team size exceeds room capacity of ${room.capacity}` });
    }

    // Check for time slot conflicts and capacity
    // Find all APPROVED bookings for this room, date, and overlapping time
    // Pending bookings do NOT block new requests
    const existingBookings = await Booking.find({
      slotDate,
      room: roomId,
      status: 'approved',
    });

    // Check for "Overlap" in time is not enough. We need to check capacity for the specific time range.
    // However, since time slots might be flexible or fixed, simpler approach:
    // Find all bookings that overlap with the requested time.
    // Sum their team sizes.
    
    // Filter to only those that overlap
    const overlappingBookings = existingBookings.filter(b => timesOverlap(startTime, endTime, b.startTime, b.endTime));
    
    // Calculate total occupied seats
    const occupiedSeats = overlappingBookings.reduce((sum, b) => sum + b.teamSize, 0);

    console.log('--- Capacity Check ---');
    console.log('Room Capacity:', room.capacity);
    console.log('Requested Team Size:', parseInt(teamSize));
    console.log('Existing Bookings (Count):', existingBookings.length);
    console.log('Overlapping Bookings (Count):', overlappingBookings.length);
    console.log('Occupied Seats:', occupiedSeats);
    console.log('New Total:', occupiedSeats + parseInt(teamSize));
    console.log('----------------------');

    if (occupiedSeats + parseInt(teamSize) > room.capacity) {
      const remaining = room.capacity - occupiedSeats;
      return res.status(409).json({ 
        message: `Slot Full / Capacity Issue. Your team contains ${teamSize} members, but only ${remaining} seats are available in this room for the selected time slot. Please choose a different room or time slot.` 
      });
    }

    // Create the booking with all provided fields
    const booking = await Booking.create({ 
      team: teamId,
      room: roomId,
      teamSize,
      slotDate, 
      startTime, 
      endTime, 
      purpose,
      description: description || '',
      teamName: teamName || '',
      status: 'pending', // Ensure new bookings are set to pending
      history: [
        {
          status: 'pending',
          reason: '',
          by: teamId,
          at: new Date(),
        },
      ],
    });
    
    console.log('Booking created successfully:', booking);
    return res.status(201).json({ 
      message: 'Booking request submitted successfully',
      booking 
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to create booking', error: err.message });
  }
}

export async function getPendingBookings(req, res) {
  try {
    let query = { status: 'pending' };
    
    // If user is not a coordinator, only show their own pending bookings
    if (req.user.role !== 'coordinator') {
      query.team = req.user._id;
    }
    
    console.log('Fetching pending bookings with query:', query); // Debug log
    
    const bookings = await Booking.find(query)
      .populate({
        path: 'team',
        select: 'name email teamName',
      })
      .sort({ createdAt: -1 }); // Show newest first
      
    console.log('Found bookings:', bookings.length); // Debug log
    return res.status(200).json({ bookings });
  } catch (err) {
    console.error('Error in getPendingBookings:', err);
    return res.status(500).json({ 
      message: 'Failed to fetch pending bookings', 
      error: err.message 
    });
  }
}

export async function decideBooking(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { id } = req.params;
    const { decision, reason } = req.body; // decision: 'approved' | 'rejected'

    const booking = await Booking.findById(id).populate('team');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (decision === 'approved') {
      // 1. Fetch Room Capacity
      const room = await Room.findById(booking.room);
      if (!room) return res.status(404).json({ message: 'Room associated with booking not found' });

      // 2. Find all currently APPROVED bookings that overlap with this one
      const conflicts = await Booking.find({ 
        slotDate: booking.slotDate, 
        room: booking.room,
        status: 'approved', 
        _id: { $ne: booking._id } 
      });

      // Filter strict overlaps
      const overlappingBookings = conflicts.filter(b => timesOverlap(booking.startTime, booking.endTime, b.startTime, b.endTime));
      
      // 3. Calculate Occupied Seats
      const occupiedSeats = overlappingBookings.reduce((sum, b) => sum + b.teamSize, 0);
      const neededSeats = booking.teamSize;

      if (occupiedSeats + neededSeats > room.capacity) {
         const remaining = room.capacity - occupiedSeats;
         return res.status(409).json({ 
           message: `Cannot approve. Room capacity exceeded. Only ${remaining} seats available, but this team needs ${neededSeats}.` 
         });
      }

      // QR Code Payload
      // Check if team exists to avoid crash
      const teamId = booking.team ? booking.team._id.toString() : 'unknown';

      const payload = {
        bookingId: booking._id.toString(),
        team: teamId,
        slotDate: booking.slotDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
      };
      
      let qrCode = '';
      try {
        qrCode = await QRCode.toDataURL(JSON.stringify(payload));
      } catch (qrErr) {
        console.error('QR Code generation failed', qrErr);
        // Don't crash, just continue without QR
      }

      booking.status = 'approved';
      booking.reason = reason || '';
      booking.qrCode = qrCode;
      booking.history.push({ status: 'approved', reason: booking.reason, by: req.user._id, at: new Date() });
      await booking.save();

      // Send Email Notification
      // Wrapped in try/catch to prevent crashing the response
      let emailSent = false;
      console.log(`[Booking] decideBooking: Attempting to send approval email. BookingID: ${booking._id}`);

      if (booking.team && booking.team.email) {
        console.log(`[Booking] Sending approval email to: ${booking.team.email} for room: ${room.name}`);
        try {
            const frontendUrl = process.env.FRONTEND_ORIGIN || 'https://ideahub-app.onrender.com';
            const emailResult = await sendEmail(
              booking.team.email,
              'Booking Approved - Idea Lab',
              `<h2>Good news, ${booking.team.name}!</h2>
               <p>Your booking for <b>${room.name}</b> on ${booking.slotDate} (${booking.startTime} - ${booking.endTime}) has been approved.</p>
               <p><b>Reason/Note:</b> ${booking.reason || 'None'}</p>
               <p>Please present the QR code in your dashboard upon entry.</p>
               <p>View your approved slot and show your entry QR Code here: <a href="${frontendUrl}/my-bookings">View My Bookings</a></p>
               <br/>
               <p>Regards,<br/>AICTE IDEA Lab Team</p>`
            );
            if (emailResult) {
                console.log(`[Booking] Successfully sent to ${booking.team.email}. MessageID: ${emailResult.messageId}`);
                emailSent = true;
            } else {
                console.error(`[Booking] Failed: sendEmail returned null/false for ${booking.team.email}`);
            }
        } catch (emailErr) {
            console.error('[Booking] Exception during send:', emailErr);
        }
      } else {
        console.warn('[Booking] Skipping Email: User email not found or Team object is missing on booking.');
        if (!booking.team) console.warn('[Booking] Debug: booking.team is null/undefined');
        else console.warn(`[Booking] Debug: booking.team object present but email missing. ID: ${booking.team._id}`);
      }

      // --- Push Notification (Approved) ---
      try {
        if (booking.team && booking.team._id) {
            const subscriptions = await PushSubscription.find({ user: booking.team._id });
            if (subscriptions.length > 0) {
              const payload = JSON.stringify({
                title: 'Booking Approved!',
                body: `Your booking for ${room.name} on ${booking.slotDate} is confirmed.`,
                icon: '/icons/icon-192.png',
              });
              
              // Use Promise.allSettled to handle all sends without crashing
              const pushPromises = subscriptions.map(sub => 
                 webpush.sendNotification(sub.subscription, payload)
              );
              
              Promise.allSettled(pushPromises).then(results => {
                  const rejected = results.filter(r => r.status === 'rejected');
                  if (rejected.length > 0) console.error('Some push notifications failed:', rejected.length);
              });
            }
        } else {
            console.warn('Cannot send push: Booking has no team associated.');
        }
      } catch (err) {
        console.error('Failed to send push notification (Approved)', err);
      }

    } else if (decision === 'rejected') {
      booking.status = 'rejected';
      booking.reason = reason || '';
      booking.history.push({ status: 'rejected', reason: booking.reason, by: req.user._id, at: new Date() });
      await booking.save();

       // --- Push Notification (Rejected) ---
       try {
        if (booking.team && booking.team._id) {
            const subscriptions = await PushSubscription.find({ user: booking.team._id });
            if (subscriptions.length > 0) {
              const payload = JSON.stringify({
                title: 'Booking Rejected',
                body: `Your booking for ${booking.slotDate} was rejected. Reason: ${reason || 'N/A'}`,
                icon: '/icons/icon-192.png',
              });
              
              const pushPromises = subscriptions.map(sub => 
                 webpush.sendNotification(sub.subscription, payload)
              );
              
              Promise.allSettled(pushPromises).then(results => {
                  const rejected = results.filter(r => r.status === 'rejected');
                  if (rejected.length > 0) console.error('Some push notifications failed:', rejected.length);
              });
            }
        }
      } catch (err) {
        console.error('Failed to send push notification (Rejected)', err);
      }
    } else {
      return res.status(400).json({ message: 'Invalid decision' });
    }

    return res.status(200).json({ booking });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to decide booking', error: err.message });
  }
}

export async function getAllBookings(req, res) {
  try {
    // This is a coordinator-only action, so no need to filter by user
    const bookings = await Booking.find({})
      .sort({ createdAt: -1 })
      .populate('team', 'name teamName');

    return res.status(200).json(bookings);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch all bookings', error: err.message });
  }
}

export async function getMyBookings(req, res) {
  try {
    const bookings = await Booking.find({ team: req.user._id })
      .sort({ createdAt: -1 })
      .populate('team', 'name teamName'); // Populate user details if needed

    return res.status(200).json(bookings);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch your bookings', error: err.message });
  }
}

export async function getMyBookingHistory(req, res) {
  try {
    const bookings = await Booking.find({ team: req.user._id })
      .select('slotDate startTime endTime purpose status reason history createdAt updatedAt')
      .sort({ createdAt: -1 });
    return res.status(200).json({ bookings });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch booking history', error: err.message });
  }
}

export async function getAllBookingHistory(req, res) {
  try {
    const bookings = await Booking.find({})
      .select('slotDate startTime endTime purpose status reason history team createdAt updatedAt')
      .populate('team', 'name email teamName')
      .sort({ createdAt: -1 });
    return res.status(200).json({ bookings });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch all booking history', error: err.message });
  }
}

export async function getDashboardStats(req, res) {
  try {
    // For coordinators, show all stats
    // For team members, only show their own stats
    const query = req.user.role === 'coordinator' ? {} : { team: req.user._id };
    
    const [totalPending, totalApproved, totalRejected] = await Promise.all([
      Booking.countDocuments({ ...query, status: 'pending' }),
      Booking.countDocuments({ ...query, status: 'approved' }),
      Booking.countDocuments({ status: 'rejected' })
    ]);

    return res.status(200).json({
      stats: {
        totalPending,
        totalApproved,
        totalRejected
      },
      recentBookings: [] // We'll implement this later if needed
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch dashboard stats', error: err.message });
  }
}

export async function getBookingRecords(req, res) {
  try {
    const { filter } = req.query; // daily, weekly, monthly, last3months, etc.
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    // Calculate start date based on filter
    switch (filter) {
      case 'daily':
        // Today (start is already 00:00 today)
        break;
      case 'weekly':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'last3months':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'last6months':
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case 'last9months':
        startDate.setMonth(startDate.getMonth() - 9);
        break;
      case 'last12months':
      case 'yearly':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date(0); // All time if invalid/empty
    }

    // Since slotDate is string YYYY-MM-DD, we need string comparison
    // Or we can rely on standard string comparison for YYYY-MM-DD which works correctly
    const formattedStartDate = startDate.toISOString().split('T')[0];

    const bookings = await Booking.find({
      slotDate: { $gte: formattedStartDate }
    })
    .populate('team', 'name email teamName')
    .populate('room', 'name')
    .sort({ slotDate: -1, startTime: -1 });

    return res.status(200).json(bookings);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch booking records', error: err.message });
  }
}

export async function downloadRoomBookingPdf(req, res) {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id)
      .populate('team', 'name email mobile branch year teamName teamMembers teamSize')
      .populate('room', 'name');

    if (!booking) {
      return res.status(404).json({ message: 'Room booking not found' });
    }

    const leaderName = booking.team?.name || '';
    const frontendUrl = process.env.FRONTEND_ORIGIN || process.env.FRONTEND_URL || 'https://ideahub-app.onrender.com';
    const qrData = `${frontendUrl}/verify-room-permission/${booking._id}`;

    const data = {
      header: {
        bookingId: booking._id,
        bookingDate: booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : ''
      },
      team: {
        teamName: booking.teamName || booking.team?.teamName || '',
        teamSize: booking.teamSize || booking.team?.teamSize || 1,
        teamLeaderName: leaderName,
        email: booking.team?.email || '',
        mobile: booking.team?.mobile || '',
        teamMembers: booking.team?.teamMembers || []
      },
      booking: {
        roomName: booking.room?.name || '',
        date: booking.slotDate ? new Date(booking.slotDate + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '',
        timeSlot: `${booking.startTime} - ${booking.endTime}`,
        projectTitle: booking.purpose || '',
        projectDescription: booking.description || ''
      },
      status: booking.status,
      approvedBy: booking.history && booking.history.length > 0 ? booking.history[booking.history.length - 1].by : '',
      approvalDate: booking.updatedAt ? new Date(booking.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '',
      remarks: booking.reason || '',
      qrData: qrData
    };

    const pdfPath = `uploads/pdfs/RoomBooking_${booking._id}_${booking.status}_${new Date().toISOString().split('T')[0]}.pdf`;
    await generatePdf('room', data, pdfPath);

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
}

export default { 
  getRoomAvailability, 
  createBooking, 
  getPendingBookings, 
  decideBooking,
  getDashboardStats,
  getMyBookings,
  getAllBookings,
  getMyBookingHistory,
  getAllBookingHistory,
  getBookingRecords,
  downloadRoomBookingPdf
};
