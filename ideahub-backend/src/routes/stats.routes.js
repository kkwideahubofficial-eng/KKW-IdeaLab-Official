import express from 'express';
import { getPublicStats, getAdminStats, updateAdminStats } from '../controllers/stats.controller.js';
import { requireAuth, requireCoordinator } from '../middlewares/auth.js';

const router = express.Router();

router.get('/public', getPublicStats);
router.get('/admin', requireAuth, requireCoordinator, getAdminStats);
router.put('/admin', requireAuth, requireCoordinator, updateAdminStats);

export default router;
