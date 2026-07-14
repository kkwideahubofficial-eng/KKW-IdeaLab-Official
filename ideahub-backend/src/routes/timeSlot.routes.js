import express from 'express';
import { getTimeSlots, createTimeSlot, updateTimeSlot, deleteTimeSlot } from '../controllers/timeSlotController.js';
import { requireAuth, requireCoordinator } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', requireAuth, getTimeSlots);
router.post('/', requireAuth, requireCoordinator, createTimeSlot);
router.put('/:id', requireAuth, requireCoordinator, updateTimeSlot);
router.delete('/:id', requireAuth, requireCoordinator, deleteTimeSlot);

export default router;
