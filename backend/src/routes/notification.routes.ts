import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  listNotificationsHandler,
  markNotificationReadHandler,
  getUnreadCountHandler,
} from '../controllers/notificationController.js';

const router = Router();

router.get('/notifications', authenticate, listNotificationsHandler);
router.get('/notifications/unread', authenticate, getUnreadCountHandler);
router.patch('/notifications/:id/read', authenticate, markNotificationReadHandler);

export default router;