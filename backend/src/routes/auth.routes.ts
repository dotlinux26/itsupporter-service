import { Router } from 'express';
import {
  changePasswordController,
  confirm2FAController,
  confirmRecoveryController,
  disable2FAController,
  forgotPasswordTotpController,
  loginController,
  logoutController,
  meController,
  refreshController,
  registerController,
  setup2FAController,
  setupRecoveryController,
  updateProfileController,
  uploadAvatarController,
  uploadBankQrController,
  verifyLogin2FAController,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { authRateLimiter, loginRateLimiter, totpRateLimiter } from '../middleware/rateLimit.js';
import { imageUpload } from '../utils/upload.js';

const router = Router();

router.post('/register', authRateLimiter, registerController);
router.post('/login', loginRateLimiter, loginController);
router.post('/login/2fa', totpRateLimiter, verifyLogin2FAController);
router.post('/refresh', refreshController);
router.post('/logout', authenticate, logoutController);
router.get('/me', authenticate, meController);
router.patch('/profile', authenticate, updateProfileController);
router.post('/upload-avatar', authenticate, imageUpload.single('avatar'), uploadAvatarController);
router.post('/upload-bank-qr', authenticate, imageUpload.single('qr'), uploadBankQrController);
router.post('/change-password', authenticate, authRateLimiter, changePasswordController);

// Dual TOTP: Luồng 1 - Khôi phục mật khẩu (Recovery)
router.get(['/recovery/setup', '/recovery-totp/generate'], authenticate, authRateLimiter, setupRecoveryController);
router.post(['/recovery/setup', '/recovery-totp/generate'], authenticate, authRateLimiter, setupRecoveryController);
router.post(['/recovery/confirm', '/recovery-totp/verify-setup'], authenticate, totpRateLimiter, confirmRecoveryController);
router.post('/forgot-password/totp', totpRateLimiter, forgotPasswordTotpController);

// Dual TOTP: Luồng 2 - Xác thực 2 bước Đăng nhập (2FA)
router.get(['/2fa/setup', '/2fa/generate'], authenticate, authRateLimiter, setup2FAController);
router.post(['/2fa/setup', '/2fa/generate'], authenticate, authRateLimiter, setup2FAController);
router.post(['/2fa/confirm', '/2fa/verify-setup'], authenticate, totpRateLimiter, confirm2FAController);
router.post('/2fa/disable', authenticate, totpRateLimiter, disable2FAController);

export default router;