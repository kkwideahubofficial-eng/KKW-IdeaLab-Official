import { Router } from 'express';
import { body, param } from 'express-validator';
import { requireAuth, requireCoordinator } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';
import {
  createAchievement,
  getAllAchievements,
  filterAchievements,
  getAchievementTimeline,
  getContributionAnalytics,
  getAchievementAnalytics,
  getPrizeAnalytics,
  getAchievementById,
  updateAchievement,
  deleteAchievement,
  deleteCloudinaryImageController,
} from '../controllers/achievementController.js';

const router = Router();

// Public routes
router.get('/', getAllAchievements);
router.get('/filter', filterAchievements);
router.get('/timeline', getAchievementTimeline);
router.get('/contributions', getContributionAnalytics);
router.get('/analytics', getAchievementAnalytics);
router.get('/prize-analytics', getPrizeAnalytics);

// Coordinator-only routes
router.post('/delete-image', requireAuth, requireCoordinator, deleteCloudinaryImageController);
router.get('/:id', param('id').isMongoId(), getAchievementById);

// Coordinator-only routes
router.post(
  '/',
  requireAuth,
  requireCoordinator,
  upload.fields([{ name: 'image', maxCount: 1 }, { name: 'gallery', maxCount: 10 }, { name: 'certificateFiles', maxCount: 10 }]),
  [
    body('title').not().isEmpty().withMessage('Title is required'),
    body('description').not().isEmpty().withMessage('Description is required'),
    body('date').isISO8601().toDate().withMessage('Valid date is required'),
    body('achievedBy').not().isEmpty().withMessage('Achieved by is required'),
    body('prizeAmount').optional().isFloat({ min: 0 }).toFloat(),
    body('eventYear').optional().isInt({ min: 1900, max: 3000 }).toInt(),
    body('teamSize').optional().isInt({ min: 1 }).toInt(),
  ],
  createAchievement
);

router.put(
  '/:id',
  requireAuth,
  requireCoordinator,
  upload.fields([{ name: 'image', maxCount: 1 }, { name: 'gallery', maxCount: 10 }, { name: 'certificateFiles', maxCount: 10 }]),
  param('id').isMongoId(),
  [
    body('title').optional().not().isEmpty(),
    body('description').optional().not().isEmpty(),
    body('date').optional().isISO8601().toDate(),
    body('achievedBy').optional().not().isEmpty(),
    body('prizeAmount').optional().isFloat({ min: 0 }).toFloat(),
    body('eventYear').optional().isInt({ min: 1900, max: 3000 }).toInt(),
    body('teamSize').optional().isInt({ min: 1 }).toInt(),
  ],
  updateAchievement
);

router.delete('/:id', requireAuth, requireCoordinator, param('id').isMongoId(), deleteAchievement);

export default router;
