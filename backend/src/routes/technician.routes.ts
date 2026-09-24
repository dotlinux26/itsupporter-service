import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';
import { getAuthUser } from '../middleware/auth.js';
import { getDb } from '../config/database.js';
import { AppError } from '../utils/AppError.js';
import type { OrderRow } from '../models/index.js';

const router = Router();

// Technician: GET /schedule?date=YYYY-MM-DD
router.get('/schedule', authenticate, requireRole('TECHNICIAN'), (req, res, next) => {
  try {
    const user = getAuthUser(req)!;
    const date = String(req.query.date ?? new Date().toISOString().slice(0, 10));
    const orders = getDb()
      .prepare(
        `SELECT o.*, c.name AS customer_name, p.name AS package_name
           FROM orders o
           JOIN users c ON c.id = o.customer_id
           JOIN service_packages p ON p.id = o.package_id
          WHERE o.technician_id = ? AND o.scheduled_date = ?
          ORDER BY o.scheduled_start ASC`
      )
      .all(user.id, date) as (OrderRow & { customer_name: string; package_name: string })[];
    res.json({ data: orders, date });
  } catch (err) { next(err); }
});

// Technician: GET /shifts (weekly shift schedule)
router.get('/shifts', authenticate, requireRole('TECHNICIAN'), (req, res, next) => {
  try {
    const user = getAuthUser(req)!;
    const db = getDb();
    const rows = db
      .prepare(
        `SELECT day_of_week, start_time, end_time, is_active
         FROM technician_schedules
         WHERE technician_id = ?
         ORDER BY day_of_week ASC`
      )
      .all(user.id) as Array<{ day_of_week: number; start_time: string; end_time: string; is_active: number }>;

    // Map 1..7 (Monday to Sunday)
    const days = [1, 2, 3, 4, 5, 6, 7].map((dow) => {
      const existing = rows.find((r) => r.day_of_week === dow);
      return {
        day_of_week: dow,
        start_time: existing ? existing.start_time : '07:00',
        end_time: existing ? existing.end_time : '19:00',
        is_active: existing ? existing.is_active : (dow <= 6 ? 1 : 0),
      };
    });

    res.json({ data: days });
  } catch (err) { next(err); }
});

// Technician: PUT /shifts (publish & update weekly shifts)
router.put('/shifts', authenticate, requireRole('TECHNICIAN'), (req, res, next) => {
  try {
    const user = getAuthUser(req)!;
    const shifts = req.body.shifts as Array<{ day_of_week: number; start_time: string; end_time: string; is_active: boolean | number }>;
    if (!Array.isArray(shifts)) {
      throw new AppError('VALIDATION_ERROR', 'Dữ liệu lịch trực không hợp lệ.', 400);
    }

    const db = getDb();
    const insertOrReplace = db.prepare(`
      INSERT INTO technician_schedules (technician_id, day_of_week, start_time, end_time, is_active)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(technician_id, day_of_week) DO UPDATE SET
        start_time = excluded.start_time,
        end_time = excluded.end_time,
        is_active = excluded.is_active
    `);

    const updateMany = db.transaction((items) => {
      for (const item of items) {
        insertOrReplace.run(
          user.id,
          Number(item.day_of_week),
          String(item.start_time || '07:00'),
          String(item.end_time || '19:00'),
          item.is_active ? 1 : 0
        );
      }
    });

    updateMany(shifts);

    res.json({ success: true, message: 'Đã xuất bản lịch trực thành công.' });
  } catch (err) { next(err); }
});

// Technician: GET /orders (my orders with filters)
router.get('/orders', authenticate, requireRole('TECHNICIAN'), (req, res, next) => {
  try {
    const user = getAuthUser(req)!;
    const status = req.query.status ? String(req.query.status) : undefined;
    const sql = status
      ? `SELECT o.*, c.name AS customer_name, p.name AS package_name
           FROM orders o
           JOIN users c ON c.id = o.customer_id
           JOIN service_packages p ON p.id = o.package_id
          WHERE o.technician_id = ? AND o.status = ?
          ORDER BY o.scheduled_date DESC, o.scheduled_start DESC`
      : `SELECT o.*, c.name AS customer_name, p.name AS package_name
           FROM orders o
           JOIN users c ON c.id = o.customer_id
           JOIN service_packages p ON p.id = o.package_id
          WHERE o.technician_id = ?
          ORDER BY o.scheduled_date DESC, o.scheduled_start DESC`;
    const params = status ? [user.id, status] : [user.id];
    const orders = getDb().prepare(sql).all(...params) as (OrderRow & { customer_name: string; package_name: string })[];
    res.json({ data: orders });
  } catch (err) { next(err); }
});

// Technician: GET /orders/:id/detail
router.get('/orders/:id', authenticate, requireRole('TECHNICIAN'), (req, res, next) => {
  try {
    const user = getAuthUser(req)!;
    const id = Number(req.params.id);
    const order = getDb()
      .prepare(
        `SELECT o.*, c.name AS customer_name, c.phone AS customer_phone, c.email AS customer_email,
                p.name AS package_name, p.duration_minutes
           FROM orders o
           JOIN users c ON c.id = o.customer_id
           JOIN service_packages p ON p.id = o.package_id
          WHERE o.id = ? AND o.technician_id = ?`
      )
      .get(id, user.id) as (OrderRow & { customer_name: string; customer_phone: string; customer_email: string; package_name: string; duration_minutes: number }) | undefined;
    if (!order) throw new AppError('NOT_FOUND', 'Không tìm thấy đơn hoặc bạn không được phân công.', 404);
    res.json({ data: order });
  } catch (err) { next(err); }
});

import {
  technicianConfirmHandler,
  technicianStartHandler,
  technicianPenaltyHandler,
  technicianExtendHandler,
  technicianSaleProgramHandler,
  technicianRedeemVoucherHandler,
  technicianPaymentHandler,
  technicianCompleteHandler,
} from '../controllers/orderController.js';

// Technician Order Actions
router.post('/orders/:id/confirm', authenticate, requireRole('TECHNICIAN'), technicianConfirmHandler);
router.post('/orders/:id/start', authenticate, requireRole('TECHNICIAN'), technicianStartHandler);
router.post('/orders/:id/penalty', authenticate, requireRole('TECHNICIAN', 'MANAGER', 'ADMIN'), technicianPenaltyHandler);
router.post('/orders/:id/extend', authenticate, requireRole('TECHNICIAN'), technicianExtendHandler);
router.post('/orders/:id/sale-program', authenticate, requireRole('TECHNICIAN'), technicianSaleProgramHandler);
router.post('/orders/:id/redeem-voucher', authenticate, requireRole('TECHNICIAN'), technicianRedeemVoucherHandler);
router.post('/orders/:id/payment', authenticate, requireRole('TECHNICIAN'), technicianPaymentHandler);
router.post('/orders/:id/complete', authenticate, requireRole('TECHNICIAN'), technicianCompleteHandler);

export default router;