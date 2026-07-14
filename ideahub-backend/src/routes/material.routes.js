import express from 'express';
import { requireAuth, requireCoordinator } from '../middlewares/auth.js';
import {
  getAllMaterials,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  seedMaterials,
} from '../controllers/materialController.js';

const router = express.Router();

router.get('/', requireAuth, getAllMaterials);
router.post('/', requireAuth, requireCoordinator, createMaterial);
router.put('/:id', requireAuth, requireCoordinator, updateMaterial);
router.delete('/:id', requireAuth, requireCoordinator, deleteMaterial);
router.post('/seed', requireAuth, requireCoordinator, seedMaterials);

export default router;
