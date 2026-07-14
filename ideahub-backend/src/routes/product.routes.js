import { Router } from 'express';
import { body, param } from 'express-validator';
import { requireAuth, requireCoordinator } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';
import { listProducts, createProduct, updateProduct, deleteProduct } from '../controllers/productController.js';

const router = Router();

router.get('/', listProducts);

router.post(
  '/',
  requireAuth,
  requireCoordinator,
  upload.single('image'),
  [
    body('title').not().isEmpty(),
    body('description').not().isEmpty(),
    body('price').isFloat({ min: 0 }),
  ],
  createProduct
);

router.delete('/:id', requireAuth, requireCoordinator, param('id').isMongoId(), deleteProduct);

router.put(
  '/:id',
  requireAuth,
  requireCoordinator,
  upload.single('image'),
  param('id').isMongoId(),
  [
    body('title').optional().not().isEmpty(),
    body('description').optional().not().isEmpty(),
    body('price').optional().isFloat({ min: 0 }),
  ],
  updateProduct
);

export default router;


