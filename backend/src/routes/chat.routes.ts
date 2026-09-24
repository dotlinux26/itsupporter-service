import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  sendMessageHandler,
  sendVoucherMessageHandler,
  listMessagesHandler,
  markReadHandler,
  getUnreadCountHandler,
} from '../controllers/chatController.js';

const router = Router();

router.get('/:id/messages', authenticate, listMessagesHandler);
router.post('/:id/messages', authenticate, sendMessageHandler);
router.post('/:id/messages/voucher', authenticate, sendVoucherMessageHandler);
router.patch('/:id/messages/read', authenticate, markReadHandler);
router.get('/:id/messages/unread', authenticate, getUnreadCountHandler);

export default router;