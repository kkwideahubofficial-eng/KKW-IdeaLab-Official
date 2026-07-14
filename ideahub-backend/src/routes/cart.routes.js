import express from 'express';
import { getCart, updateCart, clearCart } from '../controllers/cart.controller.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

// All cart routes require authentication
router.use(requireAuth);

router.get('/', getCart);
router.put('/', updateCart);
router.delete('/', clearCart);

export default router;
