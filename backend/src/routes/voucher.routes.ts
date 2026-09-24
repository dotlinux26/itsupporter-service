import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';
import {
  validateVoucherHandler,
  redeemVoucherHandler,
  voidVoucherHandler,
  listMyVouchersHandler,
  listTechnicianVouchersHandler,
  listProgramVouchersHandler,
  listVoucherProgramsHandler,
  createVoucherProgramHandler,
  getVoucherProgramHandler,
  updateVoucherProgramHandler,
  deleteVoucherProgramHandler,
  generateVouchersHandler,
  customerValidateVoucherHandler,
} from '../controllers/voucherController.js';

const router = Router();

// Public/Customer endpoints (require auth)
router.post('/validate', authenticate, validateVoucherHandler);
router.get('/validate', authenticate, (req, res, next) => {
  // GET /api/vouchers/validate?code=CODE&orderId=123
  // Convert query to body for validateVoucherHandler
  req.body = { code: req.query.code, orderId: req.query.orderId };
  validateVoucherHandler(req, res, next);
});
router.post('/redeem', authenticate, redeemVoucherHandler);
router.get('/my', authenticate, listMyVouchersHandler);
router.get('/technician', authenticate, requireRole('TECHNICIAN', 'MANAGER', 'ADMIN'), listTechnicianVouchersHandler);

// Voucher Program Management (Admin/Manager)
router.get('/programs', authenticate, requireRole('MANAGER', 'ADMIN'), listVoucherProgramsHandler);
router.post('/programs', authenticate, requireRole('ADMIN'), createVoucherProgramHandler);
router.get('/programs/:id', authenticate, requireRole('MANAGER', 'ADMIN'), getVoucherProgramHandler);
router.patch('/programs/:id', authenticate, requireRole('ADMIN'), updateVoucherProgramHandler);
router.delete('/programs/:id', authenticate, requireRole('ADMIN'), deleteVoucherProgramHandler);
router.post('/programs/:id/generate', authenticate, requireRole('ADMIN'), generateVouchersHandler);

// Voucher operations
router.post('/redeem', authenticate, redeemVoucherHandler);
router.post('/:id/void', authenticate, voidVoucherHandler);

// Customer voucher endpoints
router.get('/my', authenticate, listMyVouchersHandler);
router.get('/technician', authenticate, requireRole('TECHNICIAN', 'MANAGER', 'ADMIN'), listTechnicianVouchersHandler);
router.get('/programs/:programId/vouchers', authenticate, requireRole('MANAGER', 'ADMIN'), listProgramVouchersHandler);
router.post('/programs/:programId/generate', authenticate, requireRole('ADMIN'), generateVouchersHandler);

// Voucher validation for customers (used during booking)
router.get('/validate', authenticate, customerValidateVoucherHandler);
router.post('/redeem', authenticate, redeemVoucherHandler);
router.post('/:id/void', authenticate, voidVoucherHandler);

export default router;