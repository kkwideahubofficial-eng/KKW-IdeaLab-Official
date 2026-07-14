import { Router } from 'express';
import { body, param } from 'express-validator';
import { requireAuth, requireCoordinator } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  registerForEvent,
  getStudentRegistrations,
  getEventRegistrations,
  updateRegistrationStatus,
  markAttendanceBulk,
  downloadCertificate,
  getStudentNotifications,
  markNotificationRead,
  getEventAnalytics
} from '../controllers/eventController.js';

const router = Router();

// Student Notifications (Auth required)
router.get('/student/notifications', requireAuth, getStudentNotifications);
router.patch('/student/notifications/:id/read', requireAuth, markNotificationRead);

// Student own registration history (Auth required)
router.get('/student/registrations', requireAuth, getStudentRegistrations);

// Analytics Dashboard (Coordinator only)
router.get('/dashboard/analytics', requireAuth, requireCoordinator, getEventAnalytics);

// Download Certificate (Auth required)
router.get('/certificate/:registrationId', requireAuth, downloadCertificate);

// Coordinator Bulk Actions
router.patch('/registrations/status', requireAuth, requireCoordinator, updateRegistrationStatus);
router.patch('/attendance', requireAuth, requireCoordinator, markAttendanceBulk);

// Public get events
router.get('/', getAllEvents);
router.get('/:id', param('id').isMongoId(), getEventById);

// Coordinator CRUD Actions
router.post(
  '/',
  requireAuth,
  requireCoordinator,
  upload.single('image'),
  [
    body('title').not().isEmpty().withMessage('Title is required'),
    body('description').not().isEmpty().withMessage('Description is required'),
    body('date').isISO8601().toDate().withMessage('Valid date is required'),
    body('organizer').not().isEmpty().withMessage('Organizer is required'),
  ],
  createEvent
);

router.put(
  '/:id',
  requireAuth,
  requireCoordinator,
  upload.single('image'),
  param('id').isMongoId(),
  [
    body('title').optional().not().isEmpty(),
    body('description').optional().not().isEmpty(),
    body('date').optional().isISO8601().toDate(),
    body('organizer').optional().not().isEmpty(),
  ],
  updateEvent
);

router.delete('/:id', requireAuth, requireCoordinator, param('id').isMongoId(), deleteEvent);

// Student registration action
router.post('/:id/register', requireAuth, param('id').isMongoId(), registerForEvent);

// Get registrations for a specific event
router.get('/:id/registrations', requireAuth, requireCoordinator, param('id').isMongoId(), getEventRegistrations);

export default router;
