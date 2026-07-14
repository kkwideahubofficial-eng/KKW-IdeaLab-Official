import { Router } from 'express';
import { upload } from '../middlewares/upload.js';
import { requireAuth, requireCoordinator } from '../middlewares/auth.js';
import {
  getAllTeamMembers,
  getTeamMemberById,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
} from '../controllers/teamMemberController.js';

const router = Router();

// Public read routes
router.get('/', getAllTeamMembers);
router.get('/:id', getTeamMemberById);

// Protected write routes - STRICTLY RESTRICTED TO COORDINATORS / HEADS / ADMINS ONLY
router.post('/', requireAuth, requireCoordinator, upload.single('image'), createTeamMember);
router.put('/:id', requireAuth, requireCoordinator, upload.single('image'), updateTeamMember);
router.delete('/:id', requireAuth, requireCoordinator, deleteTeamMember);

export default router;
