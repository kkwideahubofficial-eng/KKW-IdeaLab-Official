import express from 'express';
import { requireAuth, requireCoordinator, requireInternalUser } from '../middlewares/auth.js';
import {
  checkRoomAvailability,
  createRoomRequest,
  updateRoomRequest,
  submitDraftRequest,
  facultyVerifyRequest,
  coordinatorDecision,
  headDecision,
  cancelRequest,
  getRoomRequests,
  getRoomRequestById,
  getStudentStats,
  getCoordinatorStats,
  getHeadStats,
  getAnalytics,
  getCalendarBookings,
  getRoomInventory,
  downloadRoomPermissionPdf,
  sendManualReminder,
  downloadRoomUsageReport
} from '../controllers/roomPermissionController.js';

const router = express.Router();

// Publicly accessible endpoints (e.g. for faculty email actions or QR scanner)
router.put('/:id/faculty-verify', facultyVerifyRequest);
router.get('/:id/verify-public', getRoomRequestById);

// Authenticated & Protected Routes
router.get('/availability', requireAuth, requireInternalUser, checkRoomAvailability);
router.get('/inventory', requireAuth, requireInternalUser, getRoomInventory);
router.get('/report', requireAuth, requireInternalUser, requireCoordinator, downloadRoomUsageReport);
router.post('/submit', requireAuth, requireInternalUser, createRoomRequest);
router.put('/:id/update', requireAuth, requireInternalUser, updateRoomRequest);
router.put('/:id/submit-draft', requireAuth, requireInternalUser, submitDraftRequest);
router.put('/:id/cancel', requireAuth, requireInternalUser, cancelRequest);
router.get('/student-stats', requireAuth, requireInternalUser, getStudentStats);
router.get('/coordinator-stats', requireAuth, requireInternalUser, requireCoordinator, getCoordinatorStats);
router.get('/head-stats', requireAuth, requireInternalUser, requireCoordinator, getHeadStats);
router.get('/analytics', requireAuth, requireInternalUser, requireCoordinator, getAnalytics);
router.get('/calendar-bookings', requireAuth, requireInternalUser, requireCoordinator, getCalendarBookings);
router.get('/', requireAuth, requireInternalUser, getRoomRequests);
router.get('/:id', requireAuth, requireInternalUser, getRoomRequestById);
router.get('/:id/pdf', requireAuth, requireInternalUser, downloadRoomPermissionPdf);
router.post('/:id/send-reminder', requireAuth, requireInternalUser, requireCoordinator, sendManualReminder);
router.put('/:id/coordinator-decision', requireAuth, requireInternalUser, requireCoordinator, coordinatorDecision);
router.put('/:id/head-decision', requireAuth, requireInternalUser, requireCoordinator, headDecision);

export default router;
