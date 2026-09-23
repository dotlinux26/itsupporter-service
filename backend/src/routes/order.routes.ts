import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createBookingHandler,
  getOrderDetailHandler,
  listMyOrdersHandler,
} from '../controllers/orderController.js';

const router = Router();

router.post('/', authenticate, createBookingHandler);
router.get('/', authenticate, listMyOrdersHandler);
router.get('/:id', authenticate, getOrderDetailHandler);

export default router;
