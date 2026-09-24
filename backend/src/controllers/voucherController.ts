import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError.js';
import { getAuthUser } from '../middleware/auth.js';
import {
  validateVoucher,
  redeemVoucher,
  voidVoucher,
  getMyVouchers,
  getTechnicianVouchers,
  getProgramVouchers,
  createVoucherProgramService,
  updateVoucherProgramService,
  deleteVoucherProgramService,
  generateVouchersForProgram,
  listVoucherPrograms,
  findVoucherProgramById,
} from '../services/voucherService.js';
import { requireRole } from '../middleware/auth.js';

export function validateVoucherHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const user = getAuthUser(req);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Vui lòng đăng nhập', 401);
    }
    const { code } = req.body;
    const orderId = req.body.orderId ? Number(req.body.orderId) : undefined;
    
    if (!code) {
      throw new AppError('VALIDATION_ERROR', 'Mã voucher là bắt buộc', 400);
    }
    
    const result = validateVoucher(code, user.id, orderId);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export function redeemVoucherHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const user = getAuthUser(req);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Vui lòng đăng nhập', 401);
    }
    const { code, orderId } = req.body;
    
    if (!code || !orderId) {
      throw new AppError('VALIDATION_ERROR', 'Mã voucher và mã đơn hàng là bắt buộc', 400);
    }
    
    const result = redeemVoucher(code, user.id, Number(orderId));
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
}

export function voidVoucherHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const user = getAuthUser(req);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Vui lòng đăng nhập', 401);
    }
    const { id } = req.params;
    voidVoucher(Number(id));
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export function listMyVouchersHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const user = getAuthUser(req);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Vui lòng đăng nhập', 401);
    }
    const vouchers = getMyVouchers(user.id);
    res.json({ data: vouchers });
  } catch (err) {
    next(err);
  }
}

export function listTechnicianVouchersHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const user = getAuthUser(req);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Vui lòng đăng nhập', 401);
    }
    const vouchers = getTechnicianVouchers(user.id);
    res.json({ data: vouchers });
  } catch (err) {
    next(err);
  }
}

export function listProgramVouchersHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const { programId } = req.params;
    const vouchers = getProgramVouchers(Number(programId));
    res.json({ data: vouchers });
  } catch (err) {
    next(err);
  }
}

// Admin/Manager Voucher Program Management
export function listVoucherProgramsHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const programs = listVoucherPrograms();
    res.json({ data: programs });
  } catch (err) {
    next(err);
  }
}

export function createVoucherProgramHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const user = getAuthUser(req);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Vui lòng đăng nhập', 401);
    }
    const program = createVoucherProgramService({
      ...req.body,
      created_by: user.id,
    });
    res.status(201).json({ data: { id: program } });
  } catch (err) {
    next(err);
  }
}

export function getVoucherProgramHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const program = findVoucherProgramById(Number(req.params.id));
    if (!program) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy chương trình voucher', 404);
    }
    res.json({ data: program });
  } catch (err) {
    next(err);
  }
}

export function updateVoucherProgramHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    updateVoucherProgramService(Number(req.params.id), req.body);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export function deleteVoucherProgramHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    deleteVoucherProgramService(Number(req.params.id));
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export function generateVouchersHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const user = getAuthUser(req);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Vui lòng đăng nhập', 401);
    }
    const { programId } = req.params;
    const { count, customer_id, technician_id, expired_at } = req.body;
    
    if (!count || count < 1) {
      throw new AppError('VALIDATION_ERROR', 'Số lượng voucher phải lớn hơn 0', 400);
    }
    
    const result = generateVouchersForProgram(Number(programId), count, {
      customer_id: req.body.customer_id,
      technician_id: req.body.technician_id,
      expired_at: req.body.expired_at,
    });
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
}

// Customer validate voucher for order (public endpoint with auth)
export function customerValidateVoucherHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const user = getAuthUser(req);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Vui lòng đăng nhập', 401);
    }
    const { code } = req.query;
    const orderId = req.query.orderId ? Number(req.query.orderId) : undefined;
    
    if (!code) {
      throw new AppError('VALIDATION_ERROR', 'Mã voucher là bắt buộc', 400);
    }
    
    const result = validateVoucher(String(code), user.id, orderId);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}