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
    const order = getDb().prepare('SELECT * FROM orders WHERE id = ?').get(id) as (OrderRow & { actor_name: string }) | undefined;
    if (!order) { next(new AppError('NOT_FOUND', 'Không tìm thấy đơn.', 404)); return; }
    if (order.status !== 'CONFIRMED') { next(new AppError('CONFLICT', 'Chỉ bắt đầu được đơn CONFIRMED.', 409)); return; }
    const now = new Date().toISOString();
    getDb().prepare('UPDATE orders SET status = ?, started_at = ?, updated_at = datetime(\'now\') WHERE id = ?').run('IN_PROGRESS', now, id);
    logStatusChange(id, 'CONFIRMED', 'IN_PROGRESS', user.id, 'Kỹ thuật viên bắt đầu thực hiện');
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
