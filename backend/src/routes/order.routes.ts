import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';
import {
  createBookingHandler,
  getOrderDetailHandler,
  listMyOrdersHandler,
  getOrderTimelineHandler,
  technicianConfirmHandler,
  technicianStartHandler,
  technicianCompleteHandler,
} from '../controllers/orderController.js';

const router = Router();

router.post('/', authenticate, createBookingHandler);
router.get('/', authenticate, listMyOrdersHandler);
router.get('/:id', authenticate, getOrderDetailHandler);
router.get('/:id/timeline', authenticate, getOrderTimelineHandler);

router.post('/:id/confirm', authenticate, requireRole('TECHNICIAN'), technicianConfirmHandler);
router.post('/:id/start', authenticate, requireRole('TECHNICIAN'), technicianStartHandler);
router.post('/:id/complete', authenticate, requireRole('TECHNICIAN'), technicianCompleteHandler);

export default router;