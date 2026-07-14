import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { requireAuth, requireCoordinator, requireInternalUser } from '../middlewares/auth.js';
import { 
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
} from '../controllers/bookingController.js';

const router = Router();

router.get(
  '/availability',
  [query('date').isString().matches(/^\d{4}-\d{2}-\d{2}$/)],
  requireAuth,
  requireInternalUser,
  getRoomAvailability
);

router.post(
  '/',
  [
    body('slotDate').isString().matches(/^\d{4}-\d{2}-\d{2}$/),
    body('startTime').isString(),
    body('endTime').isString(),
    body('purpose').isString().isLength({ min: 3 }),
    body('description').optional().isString(),
    body('teamName').optional().isString(),
    body('roomId').isMongoId(),
    body('teamSize').isInt({ min: 1 })
  ],
  requireAuth,
  requireInternalUser,
  createBooking
);

// Allow team members to see their own pending bookings, coordinators to see all
router.get('/pending', requireAuth, requireInternalUser, getPendingBookings);

// Only coordinators can approve/reject bookings
router.patch(
  '/:id/decision',
  [param('id').isMongoId(), body('decision').isIn(['approved', 'rejected']), body('reason').optional().isString()],
  requireAuth,
  requireInternalUser,
  requireCoordinator,
  decideBooking
);

// Route for a user to get their own bookings
router.get('/my-bookings', requireAuth, requireInternalUser, getMyBookings);

// Booking history for the logged-in student
router.get('/my-history', requireAuth, requireInternalUser, getMyBookingHistory);

// Get all bookings (coordinator only)
router.get('/all', requireAuth, requireInternalUser, requireCoordinator, getAllBookings);
router.get('/history', requireAuth, requireInternalUser, requireCoordinator, getAllBookingHistory);

// Dashboard stats for coordinators only
router.get('/dashboard-stats', requireAuth, requireInternalUser, requireCoordinator, getDashboardStats);

// Booking records with filters (Coordinator only)
router.get('/records', requireAuth, requireInternalUser, requireCoordinator, getBookingRecords);

// Route to download room booking PDF
router.get('/:id/pdf', requireAuth, requireInternalUser, downloadRoomBookingPdf);

export default router;
