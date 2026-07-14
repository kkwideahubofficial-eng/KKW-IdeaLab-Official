import { Router } from 'express';
import { body, param } from 'express-validator';
import { requireAuth, requireCoordinator } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';
import { createMachine, updateMachine, listMachines, deleteMachine } from '../controllers/machineController.js';

const router = Router();

router.get('/', listMachines);

router.post(
  '/',
  requireAuth,
  requireCoordinator,
  upload.single('image'),
  [body('name').not().isEmpty()],
  createMachine
);

router.delete('/:id', requireAuth, requireCoordinator, param('id').isMongoId(), deleteMachine);

router.put(
  '/:id',
  requireAuth,
  requireCoordinator,
  upload.single('image'),
  param('id').isMongoId(),
  [body('name').optional().not().isEmpty()],
  updateMachine
);

export default router;


