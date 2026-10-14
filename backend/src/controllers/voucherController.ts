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
import { writeAuditLog } from '../services/auditService.js';

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
    if (user.role !== 'ADMIN') {
      throw new AppError('FORBIDDEN', 'Chỉ Quản trị viên mới có quyền hủy voucher.', 403);
    }
    const { id } = req.params;
    voidVoucher(Number(id));

    writeAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      action: 'VOUCHER_VOID',
      targetType: 'VOUCHER',
      targetId: id,
      ip: req.ip,
      metadata: { voucher_id: Number(id) },
    });

    res.json({ success: true, message: 'Đã hủy voucher thành công.' });
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
    const programId = createVoucherProgramService({
      ...req.body,
      created_by: user.id,
    });

    writeAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      action: 'VOUCHER_PROGRAM_CREATE',
      targetType: 'VOUCHER_PROGRAM',
      targetId: programId,
      ip: req.ip,
      metadata: { code: req.body.code, name: req.body.name, discount_type: req.body.discount_type, discount_value: req.body.discount_value },
    });

    res.status(201).json({ data: { id: programId } });
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
    const user = getAuthUser(req);
    const id = Number(req.params.id);
    updateVoucherProgramService(id, req.body);

    writeAuditLog({
      actorId: user?.id,
      actorEmail: user?.email,
      action: 'VOUCHER_PROGRAM_UPDATE',
      targetType: 'VOUCHER_PROGRAM',
      targetId: id,
      ip: req.ip,
      metadata: req.body,
    });

    res.json({ success: true, message: 'Cập nhật chương trình voucher thành công.' });
  } catch (err) {
    next(err);
  }
}

export function deleteVoucherProgramHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const user = getAuthUser(req);
    const id = Number(req.params.id);
    const result = deleteVoucherProgramService(id);

    writeAuditLog({
      actorId: user?.id,
      actorEmail: user?.email,
      action: result.action === 'deleted' ? 'VOUCHER_PROGRAM_DELETE' : 'VOUCHER_PROGRAM_DEACTIVATE',
      targetType: 'VOUCHER_PROGRAM',
      targetId: id,
      ip: req.ip,
      metadata: { code: result.program?.code, name: result.program?.name, result_action: result.action },
    });

    res.json({ success: true, action: result.action, message: result.message });
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
    const programId = Number(req.params.programId || req.params.id);
    if (!Number.isInteger(programId)) {
      throw new AppError('VALIDATION_ERROR', 'Mã chương trình voucher không hợp lệ', 400);
    }
    
    const count = Number(req.body.count || 1);
    const customerId = req.body.customer_id ?? req.body.customerId ?? null;
    const technicianId = req.body.technician_id ?? req.body.technicianId ?? (user.role === 'TECHNICIAN' ? user.id : null);
    const expiredAt = req.body.expired_at ?? req.body.expiredAt ?? null;
    
    if (count < 1) {
      throw new AppError('VALIDATION_ERROR', 'Số lượng voucher phải lớn hơn 0', 400);
    }
    
    const result = generateVouchersForProgram(programId, count, {
      customer_id: customerId ? Number(customerId) : undefined,
      technician_id: technicianId ? Number(technicianId) : undefined,
      expired_at: expiredAt ? String(expiredAt) : undefined,
    });

    writeAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      action: 'VOUCHER_GENERATE_CODES',
      targetType: 'VOUCHER_PROGRAM',
      targetId: programId,
      ip: req.ip,
      metadata: { count, program_id: programId, generated_count: result.count },
    });

    res.status(201).json({
      data: result.vouchers,
      vouchers: result.vouchers,
      count: result.count,
      codes: result.codes,
    });
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