import type { NextFunction, Request, Response } from 'express';
import { getDb, withTransaction } from '../config/database.js';
import type { OrderRow } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { getAuthUser } from '../middleware/auth.js';
import { logStatusChange } from '../repositories/orderRepository.js';
import { settleOrderLedger } from '../services/financeService.js';
import { bookOrder } from '../services/bookingService.js';

export function createBookingHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const user = getAuthUser(req);
    if (!user) {
      next(new AppError('UNAUTHORIZED', 'Vui lòng đăng nhập để đặt lịch.', 401));
      return;
    }

    const order = bookOrder({
      customerId: user.id,
      packageId: Number(req.body.packageId),
      scheduledDate: String(req.body.scheduledDate ?? ''),
      scheduledStart: String(req.body.scheduledStart ?? ''),
      requestedTechnicianId:
        req.body.requestedTechnicianId != null ? Number(req.body.requestedTechnicianId) : undefined,
      location: String(req.body.location ?? ''),
      note: req.body.note != null ? String(req.body.note) : null,
    });

    res.status(201).json({ data: order });
  } catch (err) {
    next(err);
  }
}

export function listMyOrdersHandler(_req: Request, res: Response, next: NextFunction): void {
  try {
    const user = getAuthUser(_req);
    if (!user) {
      next(new AppError('UNAUTHORIZED', 'Vui lòng đăng nhập.', 401));
      return;
    }
    const rows = getDb()
      .prepare(
        `SELECT o.*, u.name AS customer_name
           FROM orders o
           JOIN users u ON u.id = o.customer_id
          WHERE o.customer_id = ?
          ORDER BY o.id DESC`
      )
      .all(user.id) as (OrderRow & { customer_name: string })[];
    res.json({ data: rows, total: rows.length });
  } catch (err) {
    next(err);
  }
}

export function getOrderDetailHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const user = getAuthUser(req);
    if (!user) {
      next(new AppError('UNAUTHORIZED', 'Vui lòng đăng nhập.', 401));
      return;
    }
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      next(new AppError('VALIDATION_ERROR', 'Mã đơn không hợp lệ.', 400));
      return;
    }
    const order = getDb()
      .prepare(
        `SELECT o.*, u.name AS customer_name
           FROM orders o
           JOIN users u ON u.id = o.customer_id
          WHERE o.id = ?`
      )
      .get(id) as (OrderRow & { customer_name: string }) | undefined;
    if (!order) {
      next(new AppError('NOT_FOUND', 'Không tìm thấy đơn hàng.', 404));
      return;
    }
    if (order.customer_id !== user.id && !['TECHNICIAN', 'MANAGER', 'ADMIN'].includes(user.role)) {
      next(new AppError('FORBIDDEN', 'Bạn không có quyền xem đơn này.', 403));
      return;
    }
    res.json({ data: order });
  } catch (err) {
    next(err);
  }
}

export function technicianConfirmHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const user = getAuthUser(req);
    if (!user) { next(new AppError('UNAUTHORIZED', 'Vui lòng đăng nhập.', 401)); return; }
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) { next(new AppError('VALIDATION_ERROR', 'Mã đơn không hợp lệ.', 400)); return; }
    const order = getDb().prepare('SELECT * FROM orders WHERE id = ?').get(id) as (OrderRow & { actor_name: string }) | undefined;
    if (!order) { next(new AppError('NOT_FOUND', 'Không tìm thấy đơn.', 404)); return; }
    if (order.status !== 'PENDING') { next(new AppError('CONFLICT', 'Chỉ duyệt được đơn PENDING.', 409)); return; }
    getDb().prepare('UPDATE orders SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').run('CONFIRMED', id);
    logStatusChange(id, 'PENDING', 'CONFIRMED', user.id, 'Kỹ thuật viên nhận đơn');
    const updated = getDb().prepare('SELECT * FROM orders WHERE id = ?').get(id) as OrderRow;
    res.json({ data: updated });
  } catch (err) { next(err); }
}

export function technicianStartHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const user = getAuthUser(req);
    if (!user) { next(new AppError('UNAUTHORIZED', 'Vui lòng đăng nhập.', 401)); return; }
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) { next(new AppError('VALIDATION_ERROR', 'Mã đơn không hợp lệ.', 400)); return; }
    const order = getDb().prepare('SELECT * FROM orders WHERE id = ?').get(id) as OrderRow | undefined;
    if (!order) { next(new AppError('NOT_FOUND', 'Không tìm thấy đơn.', 404)); return; }
    if (order.status !== 'CONFIRMED') { next(new AppError('CONFLICT', 'Chỉ bắt đầu được đơn CONFIRMED.', 409)); return; }

    const now = new Date();
    const nowIso = now.toISOString();

    // Tính toán phạt nếu kỹ thuật viên đến muộn
    let penaltyPercent = order.penalty_percent || 0;
    let penaltyAmount = order.penalty || 0;

    if (order.scheduled_date && order.scheduled_start) {
      const [year, month, day] = order.scheduled_date.split('-').map(Number);
      const [hour, min] = order.scheduled_start.split(':').map(Number);
      if (year && month && day && !isNaN(hour) && !isNaN(min)) {
        const scheduledTime = new Date(year, month - 1, day, hour, min, 0, 0);
        const lateMinutes = Math.floor((now.getTime() - scheduledTime.getTime()) / (60 * 1000));
        // Quy định: Muộn >= 30p làm FREE cho khách (100% phạt, đơn 0đ)
        if (lateMinutes >= 30) {
          penaltyPercent = 100;
          penaltyAmount = order.price;
        } else if (lateMinutes >= 10 && penaltyPercent < 15) {
          penaltyPercent = 15;
          penaltyAmount = Math.round((order.price * 15) / 100);
        }
      }
    }

    const finalAmount = Math.max(0, order.price + (order.extend_fee || 0) - (order.discount || 0) - penaltyAmount);

    getDb().prepare(`
      UPDATE orders SET
        status = 'IN_PROGRESS',
        started_at = ?,
        penalty = ?,
        penalty_percent = ?,
        final_amount = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(nowIso, penaltyAmount, penaltyPercent, finalAmount, id);

    logStatusChange(id, 'CONFIRMED', 'IN_PROGRESS', user.id, `Kỹ thuật viên bắt đầu thực hiện (Phạt: ${penaltyPercent}%)`);
    const updated = getDb().prepare('SELECT * FROM orders WHERE id = ?').get(id) as OrderRow;
    res.json({ data: updated });
  } catch (err) { next(err); }
}

export function technicianPenaltyHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const user = getAuthUser(req);
    if (!user) { next(new AppError('UNAUTHORIZED', 'Vui lòng đăng nhập.', 401)); return; }
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) { next(new AppError('VALIDATION_ERROR', 'Mã đơn không hợp lệ.', 400)); return; }
    const order = getDb().prepare('SELECT * FROM orders WHERE id = ?').get(id) as OrderRow | undefined;
    if (!order) { next(new AppError('NOT_FOUND', 'Không tìm thấy đơn.', 404)); return; }

    const penaltyPercent = Number(req.body.penalty_percent ?? 100);
    const reason = String(req.body.reason ?? 'Vi phạm muộn > 30p - Làm FREE cho khách');

    let penaltyAmount = 0;
    if (penaltyPercent >= 100) {
      // 100% phạt = làm miễn phí cho khách (final_amount = 0)
      penaltyAmount = order.price;
    } else if (penaltyPercent > 0) {
      penaltyAmount = Math.round((order.price * penaltyPercent) / 100);
    }

    const finalAmount = Math.max(0, order.price + (order.extend_fee || 0) - (order.discount || 0) - penaltyAmount);

    getDb().prepare(`
      UPDATE orders SET
        penalty = ?,
        penalty_percent = ?,
        final_amount = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(penaltyAmount, penaltyPercent, finalAmount, id);

    logStatusChange(id, order.status, order.status, user.id, `Áp dụng phạt: ${penaltyPercent}% - ${reason}`);
    const updated = getDb().prepare('SELECT * FROM orders WHERE id = ?').get(id) as OrderRow;
    res.json({ data: updated });
  } catch (err) { next(err); }
}

export function technicianExtendHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const user = getAuthUser(req);
    if (!user) { next(new AppError('UNAUTHORIZED', 'Vui lòng đăng nhập.', 401)); return; }
    const id = Number(req.params.id);
    const extendFee = Number(req.body.extend_fee ?? 0);
    const reason = String(req.body.reason ?? 'Phụ phí làm thêm / tăng tốc tiến độ');

    const order = getDb().prepare('SELECT * FROM orders WHERE id = ?').get(id) as OrderRow | undefined;
    if (!order) { next(new AppError('NOT_FOUND', 'Không tìm thấy đơn.', 404)); return; }

    const newExtendFee = Math.max(0, extendFee);
    const finalAmount = Math.max(0, order.price + newExtendFee - (order.discount || 0) - (order.penalty || 0));

    getDb().prepare(`
      UPDATE orders SET
        extend_fee = ?,
        final_amount = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(newExtendFee, finalAmount, id);

    logStatusChange(id, order.status, order.status, user.id, `Thêm phụ phí: ${newExtendFee}đ (${reason})`);
    const updated = getDb().prepare('SELECT * FROM orders WHERE id = ?').get(id) as OrderRow;
    res.json({ data: updated });
  } catch (err) { next(err); }
}

export function technicianSaleProgramHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const user = getAuthUser(req);
    if (!user) { next(new AppError('UNAUTHORIZED', 'Vui lòng đăng nhập.', 401)); return; }
    const id = Number(req.params.id);
    const programId = Number(req.body.programId);

    const order = getDb().prepare('SELECT * FROM orders WHERE id = ?').get(id) as OrderRow | undefined;
    if (!order) { next(new AppError('NOT_FOUND', 'Không tìm thấy đơn.', 404)); return; }

    const program = getDb().prepare('SELECT * FROM voucher_programs WHERE id = ? AND is_active = 1').get(programId) as { discount_type: string; discount_value: number; name: string } | undefined;
    if (!program) { next(new AppError('NOT_FOUND', 'Chương trình giảm giá không tồn tại hoặc đã tắt.', 404)); return; }

    let discountAmount = 0;
    if (program.discount_type === 'percent') {
      discountAmount = Math.round((order.price * program.discount_value) / 100);
    } else {
      discountAmount = Math.min(order.price, program.discount_value);
    }

    const finalAmount = Math.max(0, order.price + (order.extend_fee || 0) - discountAmount - (order.penalty || 0));

    getDb().prepare(`
      UPDATE orders SET
        discount = ?,
        final_amount = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(discountAmount, finalAmount, id);

    logStatusChange(id, order.status, order.status, user.id, `Áp dụng chương trình ${program.name}: Giảm ${discountAmount}đ`);
    const updated = getDb().prepare('SELECT * FROM orders WHERE id = ?').get(id) as OrderRow;
    res.json({ data: updated });
  } catch (err) { next(err); }
}

export function technicianRedeemVoucherHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const user = getAuthUser(req);
    if (!user) { next(new AppError('UNAUTHORIZED', 'Vui lòng đăng nhập.', 401)); return; }
    const id = Number(req.params.id);
    const code = String(req.body.code ?? '').trim().toUpperCase();

    if (!code) { next(new AppError('VALIDATION_ERROR', 'Vui lòng nhập mã voucher.', 400)); return; }

    const order = getDb().prepare('SELECT * FROM orders WHERE id = ?').get(id) as OrderRow | undefined;
    if (!order) { next(new AppError('NOT_FOUND', 'Không tìm thấy đơn.', 404)); return; }

    const voucher = getDb().prepare(`
      SELECT v.*, vp.name AS program_name, vp.discount_type, vp.discount_value, vp.valid_to, vp.is_active AS program_active
      FROM vouchers v
      JOIN voucher_programs vp ON vp.id = v.program_id
      WHERE v.code = ?
    `).get(code) as { id: number; status: string; customer_id: number | null; discount_type: string; discount_value: number; program_name: string; program_active: number } | undefined;

    if (!voucher) { next(new AppError('NOT_FOUND', 'Mã voucher không tồn tại.', 404)); return; }
    if (voucher.status !== 'active') { next(new AppError('CONFLICT', `Voucher này ${voucher.status === 'used' ? 'đã sử dụng' : 'không còn hiệu lực'}.`, 409)); return; }
    if (!voucher.program_active) { next(new AppError('CONFLICT', 'Chương trình voucher đã kết thúc.', 409)); return; }

    let voucherDiscount = 0;
    if (voucher.discount_type === 'percent') {
      voucherDiscount = Math.round((order.price * voucher.discount_value) / 100);
    } else {
      voucherDiscount = Math.min(order.price, voucher.discount_value);
    }

    // Voucher có thể cộng dồn cùng với chương trình sale hiện tại
    const totalDiscount = (order.discount || 0) + voucherDiscount;
    const finalAmount = Math.max(0, order.price + (order.extend_fee || 0) - totalDiscount - (order.penalty || 0));

    withTransaction(() => {
      // Gạch / thu hồi voucher sau khi dùng
      getDb().prepare(`
        UPDATE vouchers SET
          status = 'used',
          order_id = ?,
          used_at = datetime('now'),
          updated_at = datetime('now')
        WHERE id = ?
      `).run(id, voucher.id);

      getDb().prepare(`
        INSERT INTO voucher_transactions (voucher_id, order_id, discount_amount, type)
        VALUES (?, ?, ?, 'REDEEM')
      `).run(voucher.id, id, voucherDiscount);

      getDb().prepare(`
        UPDATE orders SET
          discount = ?,
          final_amount = ?,
          updated_at = datetime('now')
        WHERE id = ?
      `).run(totalDiscount, finalAmount, id);

      logStatusChange(id, order.status, order.status, user.id, `Áp dụng voucher ${code}: Giảm ${voucherDiscount}đ`);
    });

    const updated = getDb().prepare('SELECT * FROM orders WHERE id = ?').get(id) as OrderRow;
    res.json({ data: updated });
  } catch (err) { next(err); }
}

export function technicianPaymentHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const user = getAuthUser(req);
    if (!user) { next(new AppError('UNAUTHORIZED', 'Vui lòng đăng nhập.', 401)); return; }
    const id = Number(req.params.id);
    const payment_status = req.body.payment_status === 'PAID' ? 'PAID' : 'UNPAID';
    const unpaid_reason = req.body.unpaid_reason ? String(req.body.unpaid_reason) : null;
    const payment_qr_path = req.body.payment_qr_path ? String(req.body.payment_qr_path) : null;

    const order = getDb().prepare('SELECT * FROM orders WHERE id = ?').get(id) as OrderRow | undefined;
    if (!order) { next(new AppError('NOT_FOUND', 'Không tìm thấy đơn.', 404)); return; }

    getDb().prepare(`
      UPDATE orders SET
        payment_status = ?,
        unpaid_reason = ?,
        payment_qr_path = COALESCE(?, payment_qr_path),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(payment_status, unpaid_reason, payment_qr_path, id);

    logStatusChange(id, order.status, order.status, user.id, `Cập nhật thanh toán: ${payment_status} ${unpaid_reason ? `(Lý do: ${unpaid_reason})` : ''}`);
    const updated = getDb().prepare('SELECT * FROM orders WHERE id = ?').get(id) as OrderRow;
    res.json({ data: updated });
  } catch (err) { next(err); }
}

export function technicianCompleteHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const user = getAuthUser(req);
    if (!user) { next(new AppError('UNAUTHORIZED', 'Vui lòng đăng nhập.', 401)); return; }
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) { next(new AppError('VALIDATION_ERROR', 'Mã đơn không hợp lệ.', 400)); return; }
    const order = getDb().prepare('SELECT * FROM orders WHERE id = ?').get(id) as (OrderRow & { actor_name: string }) | undefined;
    if (!order) { next(new AppError('NOT_FOUND', 'Không tìm thấy đơn.', 404)); return; }
    if (order.status !== 'IN_PROGRESS') { next(new AppError('CONFLICT', 'Chỉ hoàn thành được đơn IN_PROGRESS.', 409)); return; }
    const completion_result = String(req.body.completion_result ?? 'SUCCESS');
    if (!['SUCCESS', 'FAILED', 'CANCELLED'].includes(completion_result)) {
      next(new AppError('VALIDATION_ERROR', 'Kết quả không hợp lệ.', 400)); return;
    }
    const now = new Date().toISOString();
    getDb().prepare('UPDATE orders SET status = ?, completion_result = ?, completed_at = ?, updated_at = datetime(\'now\') WHERE id = ?').run('COMPLETED', completion_result, now, id);
    logStatusChange(id, 'IN_PROGRESS', 'COMPLETED', user.id, `Hoàn thành: ${completion_result}`);
    const completedOrder = getDb().prepare('SELECT * FROM orders WHERE id = ?').get(id) as OrderRow;
    // settle ledger
    settleOrderLedger(completedOrder, user.id);
    res.json({ data: completedOrder });
  } catch (err) { next(err); }
}
