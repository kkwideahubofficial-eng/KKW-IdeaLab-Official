import express from 'express';
import { initiateCheckout, verifyPayment, getMyOrders, getOrderById, getAllOrders, updateOrderStatus } from '../controllers/order.controller.js';
import { requireAuth, requireCoordinator } from '../middlewares/auth.js';

const router = express.Router();

router.use(requireAuth);

router.post('/initiate', initiateCheckout);
router.post('/verify', verifyPayment);
router.get('/', getMyOrders);

// Admin / Coordinator Routes
router.get('/admin/all', requireCoordinator, getAllOrders);
router.put('/:id/status', requireCoordinator, updateOrderStatus);

// Place generic ID route last to avoid collision with 'admin/all' if not careful, 
// though 'admin/all' is specific enough.
router.get('/:id', getOrderById);

export default router;
