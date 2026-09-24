import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createReviewHandler,
  listMyReviewsHandler,
  listTechnicianReviewsHandler,
  getOrderReviewHandler,
} from '../controllers/reviewController.js';

const router = Router();

router.post('/reviews', authenticate, createReviewHandler);
router.get('/reviews', authenticate, listMyReviewsHandler);
router.get('/reviews/technician/:technicianId', authenticate, listTechnicianReviewsHandler);
router.get('/orders/:id/review', authenticate, getOrderReviewHandler);

export default router;