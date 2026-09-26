import { getDb } from '../config/database.js';
import { withTransaction } from '../config/database.js';
import { AppError } from '../utils/AppError.js';
import type { Voucher, VoucherProgram } from '../models/index.js';
import {
  findVoucherByCode,
  findVoucherById,
  findVouchersByCustomer,
  findVouchersByProgram,
  createVoucher,
  createVoucherTransaction,
  updateVoucherStatus,
  getVoucherWithProgram,
  findVoucherProgramById,
  findVoucherProgramByCode,
  listVoucherPrograms,
  createVoucherProgram,
  updateVoucherProgram,
  deleteVoucherProgram,
  findVouchersByTechnician,
} from '../repositories/voucherRepository.js';
import { findOrderById } from '../repositories/orderRepository.js';

export interface ValidateVoucherResult {
  valid: boolean;
  voucher?: Voucher & { program: VoucherProgram };
  program?: VoucherProgram;
  error?: string;
}

// Re-export repository functions needed by controller
export { listVoucherPrograms, findVoucherProgramById, findVoucherProgramByCode };

export function generateVoucherCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function validateVoucher(code: string, customerId: number, orderId?: number): ValidateVoucherResult {
  const voucher = getVoucherWithProgram(code);
  
  if (!voucher) {
    return { valid: false, error: 'Mã voucher không tồn tại' };
  }
  
  const program = voucher.program;
  
  if (!program.is_active) {
    return { valid: false, error: 'Chương trình voucher đã bị tắt' };
  }
  
  if (voucher.status !== 'active') {
    if (voucher.status === 'used') return { valid: false, error: 'Voucher đã được sử dụng' };
    if (voucher.status === 'expired') return { valid: false, error: 'Voucher đã hết hạn' };
    if (voucher.status === 'voided') return { valid: false, error: 'Voucher đã bị vô hiệu hóa' };
    return { valid: false, error: 'Voucher không hợp lệ' };
  }
  
  const now = new Date();
  if (program.valid_from && new Date(program.valid_from) > now) {
    return { valid: false, error: 'Voucher chưa đến thời gian sử dụng' };
  }
  if (program.valid_to && new Date(program.valid_to) < now) {
    return { valid: false, error: 'Voucher đã hết hạn' };
  }
  
  if (voucher.expired_at && new Date(voucher.expired_at) < now) {
    return { valid: false, error: 'Voucher đã hết hạn' };
  }
  
  if (voucher.customer_id && voucher.customer_id !== customerId) {
    return { valid: false, error: 'Voucher không thuộc về bạn' };
  }
  
  if (orderId) {
    const order = findOrderById(orderId);
    if (!order) {
      return { valid: false, error: 'Đơn hàng không tồn tại' };
    }
    if (order.customer_id !== customerId) {
      return { valid: false, error: 'Đơn hàng không thuộc về bạn' };
    }
    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      return { valid: false, error: 'Không thể áp dụng voucher cho đơn hàng ở trạng thái này' };
    }
  }
  
  return { valid: true, voucher, program };
}

export function redeemVoucher(voucherCode: string, customerId: number, orderId: number): {
  voucher: Voucher & { program: VoucherProgram };
  program: VoucherProgram;
  discountAmount: number;
} {
  return withTransaction(() => {
    const validation = validateVoucher(voucherCode, customerId, orderId);
    if (!validation.valid || !validation.voucher || !validation.program) {
      throw new AppError('VALIDATION_ERROR', validation.error || 'Voucher không hợp lệ', 400);
    }
    
    const { voucher, program } = validation;
    const db = getDb();
    
    const order = findOrderById(orderId);
    if (!order) {
      throw new AppError('NOT_FOUND', 'Đơn hàng không tồn tại', 404);
    }
    
    let discountAmount = 0;
    if (program.discount_type === 'percent') {
      discountAmount = Math.round((order.price * program.discount_value) / 100);
    } else {
      discountAmount = Math.min(program.discount_value, order.price);
    }
    
    const totalDiscount = (order.discount || 0) + discountAmount;
    const newFinalAmount = Math.max(0, order.price + (order.extend_fee || 0) - totalDiscount - (order.penalty || 0));
    db.prepare('UPDATE orders SET final_amount = ?, discount = ?, updated_at = datetime(\'now\') WHERE id = ?')
      .run(newFinalAmount, totalDiscount, orderId);
    
    updateVoucherStatus(voucher.id, 'used', orderId);
    
    createVoucherTransaction(voucher.id, orderId, discountAmount);
    
    return {
      voucher: { ...voucher, status: 'used' as const },
      program,
      discountAmount,
    };
  });
}

export function voidVoucher(voucherId: number): void {
  updateVoucherStatus(voucherId, 'voided');
}

export function getMyVouchers(customerId: number) {
  return findVouchersByCustomer(customerId);
}

export function getTechnicianVouchers(technicianId: number) {
  return findVouchersByTechnician(technicianId);
}

export function getProgramVouchers(programId: number) {
  return findVouchersByProgram(programId);
}

// Voucher Program Service Functions
export function createVoucherProgramService(input: {
  code: string;
  name: string;
  description?: string | null;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  max_usage: number;
  valid_from?: string | null;
  valid_to?: string | null;
  is_active?: number;
  created_by: number;
}) {
  const existing = findVoucherProgramByCode(input.code);
  if (existing) {
    throw new AppError('CONFLICT', 'Mã chương trình voucher đã tồn tại', 409);
  }
  
  return createVoucherProgram({
    ...input,
    is_active: input.is_active ?? 1,
  });
}

export function updateVoucherProgramService(id: number, patch: {
  code?: string;
  name?: string;
  description?: string | null;
  discount_type?: 'percent' | 'fixed';
  discount_value?: number;
  max_usage?: number;
  valid_from?: string | null;
  valid_to?: string | null;
  is_active?: number;
}) {
  const program = findVoucherProgramById(id);
  if (!program) {
    throw new AppError('NOT_FOUND', 'Chương trình voucher không tồn tại', 404);
  }
  
  if (patch.code && patch.code !== program.code) {
    const existing = findVoucherProgramByCode(patch.code);
    if (existing) {
      throw new AppError('CONFLICT', 'Mã chương trình voucher đã tồn tại', 409);
    }
  }
  
  updateVoucherProgram(id, patch);
}

export function deleteVoucherProgramService(id: number): void {
  const program = findVoucherProgramById(id);
  if (!program) {
    throw new AppError('NOT_FOUND', 'Chương trình voucher không tồn tại', 404);
  }
  deleteVoucherProgram(id);
}

export function generateVouchersForProgram(programId: number, count: number, options?: {
  customer_id?: number;
  technician_id?: number;
  expired_at?: string | null;
}): {
  count: number;
  codes: string[];
  vouchers: Array<{ id: number; code: string; program_id: number; customer_id?: number | null; technician_id?: number | null }>;
} {
  const program = findVoucherProgramById(programId);
  if (!program) {
    throw new AppError('NOT_FOUND', 'Chương trình voucher không tồn tại', 404);
  }
  
  if (count > 1000) {
    throw new AppError('VALIDATION_ERROR', 'Tối đa tạo 1000 voucher một lần', 400);
  }
  
  const db = getDb();
  
  const stmt = db.prepare(`
    INSERT INTO vouchers (program_id, code, customer_id, technician_id, status, expired_at)
    VALUES (?, ?, ?, ?, 'active', ?)
  `);
  
  const vouchers: Array<{ id: number; code: string; program_id: number; customer_id?: number | null; technician_id?: number | null }> = [];
  const insertMany = db.transaction((codes: string[]) => {
    for (const code of codes) {
      const res = stmt.run(
        programId, 
        code, 
        options?.customer_id ?? null, 
        options?.technician_id ?? null, 
        options?.expired_at ?? null
      );
      vouchers.push({
        id: Number(res.lastInsertRowid),
        code,
        program_id: programId,
        customer_id: options?.customer_id ?? null,
        technician_id: options?.technician_id ?? null,
      });
    }
  });
  
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    let code: string;
    let attempts = 0;
    do {
      code = generateVoucherCode();
      attempts++;
      if (attempts > 10) throw new Error('Cannot generate unique code');
    } while (db.prepare('SELECT 1 FROM vouchers WHERE code = ?').get(code));
    codes.push(code);
  }
  
  insertMany(codes);
  
  return { count: codes.length, codes, vouchers };
}
