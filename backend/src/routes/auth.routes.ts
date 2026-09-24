import { Router } from 'express';
import {
  changePasswordController,
  loginController,
  logoutController,
  meController,
  refreshController,
  registerController,
  updateProfileController,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { authRateLimiter, loginRateLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/register', authRateLimiter, registerController);
router.post('/login', loginRateLimiter, loginController);
router.post('/refresh', refreshController);
router.post('/logout', authenticate, logoutController);
router.get('/me', authenticate, meController);
router.patch('/profile', authenticate, updateProfileController);
router.post('/change-password', authenticate, changePasswordController);

export default router;