import { Router } from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus
} from '../controllers/orderController.js';

const router = Router();

router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:orderId', getOrderById);
router.patch('/:orderId/status', updateOrderStatus);

export default router;
