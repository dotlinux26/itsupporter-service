import type { NextFunction, Request, Response } from 'express';
import { getDb, withTransaction } from '../config/database.js';
import type { OrderRow } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { getAuthUser } from '../middleware/auth.js';
import { logStatusChange, findOrderById, listOrders, getOrderTimeline } from '../repositories/orderRepository.js';
import { settleOrderLedger } from '../services/financeService.js';
import { bookOrder } from '../services/bookingService.js';
import { sendOrderNotification } from '../services/notificationService.js';
import { getSystemSettings } from '../services/settingsService.js';

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
    const { data: rows, total } = listOrders({ customerId: user.id, limit: 100, includeUnreadFor: user.id });
    res.json({ data: rows, total });
  } catch (err) {
    next(err);
  }
}

function ensureAssignedTechnician(order: OrderRow, user: { id: number; role: string }): void {
  if (['MANAGER', 'ADMIN'].includes(user.role)) return;
  if (order.technician_id !== user.id) {
    throw new AppError('FORBIDDEN', 'Bạn không được phân công xử lý đơn hàng này.', 403);
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
    const order = findOrderById(id);
    if (!order) {
      next(new AppError('NOT_FOUND', 'Không tìm thấy đơn hàng.', 404));
      return;
    }
    if (order.customer_id !== user.id && !['TECHNICIAN', 'MANAGER', 'ADMIN'].includes(user.role)) {
      next(new AppError('FORBIDDEN', 'Bạn không có quyền xem đơn này.', 403));
      return;
    }
    if (user.role === 'TECHNICIAN' && order.technician_id && order.technician_id !== user.id) {
      next(new AppError('FORBIDDEN', 'Bạn không được phân công đơn này.', 403));
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

    if (order.technician_id != null && order.technician_id !== user.id && !['MANAGER', 'ADMIN'].includes(user.role)) {
      next(new AppError('FORBIDDEN', 'Đơn hàng này đã được phân công cho kỹ thuật viên khác.', 403));
      return;
    }

    // Atomic claim order: cập nhật technician_id nếu null hoặc thuộc về user, chống race condition
    const result = getDb().prepare(`
      UPDATE orders
      SET status = 'CONFIRMED',
          technician_id = COALESCE(technician_id, ?),
          updated_at = datetime('now')
      WHERE id = ?
        AND status = 'PENDING'
        AND (technician_id IS NULL OR technician_id = ?)
    `).run(user.id, id, user.id);

    if (result.changes !== 1) {
      next(new AppError('CONFLICT', 'Đơn hàng đã được kỹ thuật viên khác tiếp nhận hoặc trạng thái đã thay đổi.', 409));
      return;
    }

    logStatusChange(id, 'PENDING', 'CONFIRMED', user.id, 'Kỹ thuật viên nhận đơn');
    try {
      sendOrderNotification(
        order.customer_id,
        id,
        'ORDER_CONFIRMED',
        'Đơn đặt lịch đã được xác nhận!',
        `Kỹ thuật viên ${user.name} đã tiếp nhận đơn ${order.code}. Hãy liên hệ trực tiếp nếu cần hỗ trợ.`
      );
    } catch {}
    const updated = findOrderById(id) as OrderRow;
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
    ensureAssignedTechnician(order, user);
    if (order.status !== 'CONFIRMED') { next(new AppError('CONFLICT', 'Chỉ bắt đầu được đơn CONFIRMED.', 409)); return; }

    const now = new Date();
    const nowIso = now.toISOString();

    // Tính toán phạt nếu kỹ thuật viên đến muộn
    let penaltyPercent = order.penalty_percent || 0;
    let penaltyAmount = order.penalty || 0;

    const settings = getSystemSettings();
    if (order.scheduled_date && order.scheduled_start) {
      const [year, month, day] = order.scheduled_date.split('-').map(Number);
      const [hour, min] = order.scheduled_start.split(':').map(Number);
      if (year && month && day && !isNaN(hour) && !isNaN(min)) {
        const scheduledTime = new Date(year, month - 1, day, hour, min, 0, 0);
        const lateMinutes = Math.floor((now.getTime() - scheduledTime.getTime()) / (60 * 1000));
        // Quy định theo cài đặt hệ thống của Quản lý:
        if (lateMinutes >= settings.freeServiceAfterMinutes) {
          penaltyPercent = 100;
          penaltyAmount = order.price;
        } else if (lateMinutes >= settings.latePenaltyMinutes && penaltyPercent < settings.latePenaltyPercent) {
          penaltyPercent = settings.latePenaltyPercent;
          penaltyAmount = Math.round((order.price * settings.latePenaltyPercent) / 100);
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
    try {
      sendOrderNotification(
        order.customer_id,
        id,
        'ORDER_CONFIRMED',
        'Kỹ thuật viên đã bắt đầu bảo dưỡng',
        `Kỹ thuật viên đã bắt đầu quy trình bảo dưỡng cho đơn ${order.code}.`
      );
    } catch {}
    const updated = findOrderById(id) as OrderRow;
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
    ensureAssignedTechnician(order, user);

    const settings = getSystemSettings();
    let penaltyPercent = req.body.penalty_percent !== undefined ? Number(req.body.penalty_percent) : NaN;
    let reason = req.body.reason ? String(req.body.reason) : '';

    // If late_minutes was provided and penalty_percent wasn't explicitly supplied
    if (req.body.late_minutes !== undefined && isNaN(penaltyPercent)) {
      const lateMins = Math.max(0, Number(req.body.late_minutes) || 0);
      if (lateMins >= settings.freeServiceAfterMinutes) {
        penaltyPercent = 100;
      } else if (lateMins >= settings.latePenaltyMinutes) {
        penaltyPercent = settings.latePenaltyPercent;
      } else {
        penaltyPercent = 0;
      }
      if (!reason) {
        reason = `Muộn ${lateMins} phút (Phạt ${penaltyPercent}% theo cài đặt gốc)`;
      }
    }

    if (isNaN(penaltyPercent)) {
      penaltyPercent = 100;
    }

    if (!reason) {
      reason = penaltyPercent >= 100
        ? `Vi phạm muộn >= ${settings.freeServiceAfterMinutes}p - Làm FREE cho khách`
        : penaltyPercent > 0
        ? `Phạt muộn ${penaltyPercent}% theo quy định`
        : 'Đúng giờ - Không phạt';
    }

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
    ensureAssignedTechnician(order, user);

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
    ensureAssignedTechnician(order, user);

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
    ensureAssignedTechnician(order, user);

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
      // Gạch / thu hồi voucher sau khi dùng với atomic conditional update (SEC-06B)
      const updateRes = getDb().prepare(`
        UPDATE vouchers SET
          status = 'used',
          order_id = ?,
          used_at = datetime('now'),
          updated_at = datetime('now')
        WHERE id = ? AND status = 'active'
      `).run(id, voucher.id);

      if (updateRes.changes !== 1) {
        throw new AppError('CONFLICT', 'Voucher đã được sử dụng hoặc không còn hiệu lực.', 409);
      }

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
    ensureAssignedTechnician(order, user);

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
    ensureAssignedTechnician(order, user);
    if (order.status !== 'IN_PROGRESS') { next(new AppError('CONFLICT', 'Chỉ hoàn thành được đơn IN_PROGRESS.', 409)); return; }
    const completion_result = String(req.body.completion_result ?? 'SUCCESS');
    if (!['SUCCESS', 'FAILED', 'CANCELLED'].includes(completion_result)) {
      next(new AppError('VALIDATION_ERROR', 'Kết quả không hợp lệ.', 400)); return;
    }

    const paymentStatus = req.body.payment_status === 'UNPAID' ? 'UNPAID' : 'PAID';
    const unpaidReason = req.body.unpaid_reason ? String(req.body.unpaid_reason).trim() : null;
    const note = req.body.note ? String(req.body.note).trim() : `Hoàn thành dịch vụ: ${completion_result}`;
    const now = new Date().toISOString();

    getDb().prepare(`
      UPDATE orders SET 
        status = 'COMPLETED', 
        completion_result = ?, 
        payment_status = ?,
        unpaid_reason = ?,
        completed_at = ?, 
        updated_at = datetime('now') 
      WHERE id = ?
    `).run(completion_result, paymentStatus, unpaidReason, now, id);

    logStatusChange(
      id,
      'IN_PROGRESS',
      'COMPLETED',
      user.id,
      `${note} - Thanh toán: ${paymentStatus === 'PAID' ? 'Đã thu tiền' : 'Chưa thu tiền' + (unpaidReason ? ` (${unpaidReason})` : '')}`
    );

    const completedOrder = findOrderById(id) as OrderRow;
    // settle ledger
    settleOrderLedger(completedOrder, user.id);

    try {
      sendOrderNotification(
        order.customer_id,
        id,
        'ORDER_COMPLETED',
        'Đơn dịch vụ đã hoàn thành!',
        `Kỹ thuật viên ${user.name} đã hoàn tất bảo dưỡng đơn ${order.code}. Hãy vào đánh giá dịch vụ nhé!`
      );
    } catch {}

    res.json({ data: completedOrder });
  } catch (err) { next(err); }
}

export function getOrderTimelineHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const user = getAuthUser(req);
    if (!user) { next(new AppError('UNAUTHORIZED', 'Vui lòng đăng nhập.', 401)); return; }
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) { next(new AppError('VALIDATION_ERROR', 'Mã đơn không hợp lệ.', 400)); return; }
    const order = findOrderById(id);
    if (!order) { next(new AppError('NOT_FOUND', 'Không tìm thấy đơn hàng.', 404)); return; }
    if (order.customer_id !== user.id && !['TECHNICIAN', 'MANAGER', 'ADMIN'].includes(user.role)) {
      next(new AppError('FORBIDDEN', 'Bạn không có quyền xem đơn này.', 403));
      return;
    }
    if (user.role === 'TECHNICIAN' && order.technician_id && order.technician_id !== user.id) {
      next(new AppError('FORBIDDEN', 'Bạn không được phân công đơn này.', 403));
      return;
    }
    const timeline = getOrderTimeline(id);
    res.json({ data: timeline });
  } catch (err) { next(err); }
}
