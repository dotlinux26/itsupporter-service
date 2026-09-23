import { Router } from 'express';
import {
  loginController,
  logoutController,
  meController,
  refreshController,
  registerController,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { authRateLimiter, loginRateLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/register', authRateLimiter, registerController);
router.post('/login', loginRateLimiter, loginController);
router.post('/refresh', refreshController);
router.post('/logout', authenticate, logoutController);
router.get('/me', authenticate, meController);

export default router;