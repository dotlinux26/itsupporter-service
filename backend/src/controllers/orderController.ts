import type { NextFunction, Request, Response } from 'express';
import { getDb } from '../config/database.js';
import type { OrderRow } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { getAuthUser } from '../middleware/auth.js';
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
