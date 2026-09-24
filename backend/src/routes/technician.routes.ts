import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';
import { getAuthUser } from '../middleware/auth.js';
import { getDb } from '../config/database.js';
import { AppError } from '../utils/AppError.js';
import type { OrderRow } from '../models/index.js';
import { getRunBalance } from '../services/financeService.js';

const router = Router();

// Technician: GET /finance (real balance, earnings, settlements from ledger)
router.get('/finance', authenticate, requireRole('TECHNICIAN'), (req, res, next) => {
  try {
    const user = getAuthUser(req)!;
    const db = getDb();
    const currentBalance = getRunBalance(user.id);

    const earnedRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) AS earned
      FROM financial_transactions
      WHERE technician_id = ? AND direction = 'IN'
    `).get(user.id) as { earned: number };

    const settledRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) AS settled
      FROM settlements
      WHERE technician_id = ?
    `).get(user.id) as { settled: number };

    const settlements = db.prepare(`
      SELECT s.*, m.name AS manager_name
      FROM settlements s
      LEFT JOIN users m ON m.id = s.manager_id
      WHERE s.technician_id = ?
      ORDER BY s.created_at DESC LIMIT 20
    `).all(user.id);

    const transactions = db.prepare(`
      SELECT ft.*, o.code AS order_code
      FROM financial_transactions ft
      LEFT JOIN orders o ON o.id = ft.order_id
      WHERE ft.technician_id = ?
      ORDER BY ft.created_at DESC LIMIT 30
    `).all(user.id);

    res.json({
      data: {
        current_balance: currentBalance,
        total_earned: earnedRow.earned,
        total_settled: settledRow.settled,
        settlements,
        transactions,
      },
    });
  } catch (err) { next(err); }
});

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

const ALL_SLOTS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
];

// Technician: GET /shifts (weekly shift schedule with ticked slots)
router.get('/shifts', authenticate, requireRole('TECHNICIAN'), (req, res, next) => {
  try {
    const user = getAuthUser(req)!;
    const db = getDb();
    const rows = db
      .prepare(
        `SELECT day_of_week, start_time, end_time, is_active, slots
         FROM technician_schedules
         WHERE technician_id = ?
         ORDER BY day_of_week ASC`
      )
      .all(user.id) as Array<{ day_of_week: number; start_time: string; end_time: string; is_active: number; slots: string | null }>;

    // Map 1..7 (Monday to Sunday)
    const days = [1, 2, 3, 4, 5, 6, 7].map((dow) => {
      const existing = rows.find((r) => r.day_of_week === dow);
      let slots: string[] = [];
      if (existing) {
        if (existing.slots) {
          try {
            const parsed = JSON.parse(existing.slots);
            if (Array.isArray(parsed)) slots = parsed;
          } catch {
            slots = ALL_SLOTS.filter((s) => s >= existing.start_time && s < existing.end_time);
          }
        } else if (existing.is_active) {
          slots = ALL_SLOTS.filter((s) => s >= existing.start_time && s < existing.end_time);
        }
      } else if (dow <= 6) {
        slots = [...ALL_SLOTS];
      }

      return {
        day_of_week: dow,
        start_time: existing ? existing.start_time : '07:00',
        end_time: existing ? existing.end_time : '19:00',
        is_active: existing ? existing.is_active : (dow <= 6 ? 1 : 0),
        slots,
      };
    });

    res.json({ data: days });
  } catch (err) { next(err); }
});

// Technician: PUT /shifts (publish & update weekly shifts with flexible ticked slots)
router.put('/shifts', authenticate, requireRole('TECHNICIAN'), (req, res, next) => {
  try {
    const user = getAuthUser(req)!;
    const shifts = req.body.shifts as Array<{ day_of_week: number; start_time?: string; end_time?: string; is_active: boolean | number; slots?: string[] }>;
    if (!Array.isArray(shifts)) {
      throw new AppError('VALIDATION_ERROR', 'Dữ liệu lịch trực không hợp lệ.', 400);
    }

    const db = getDb();
    const insertOrReplace = db.prepare(`
      INSERT INTO technician_schedules (technician_id, day_of_week, start_time, end_time, is_active, slots)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(technician_id, day_of_week) DO UPDATE SET
        start_time = excluded.start_time,
        end_time = excluded.end_time,
        is_active = excluded.is_active,
        slots = excluded.slots
    `);

    const updateMany = db.transaction((items) => {
      for (const item of items) {
        const slotsArray = Array.isArray(item.slots) ? item.slots : [];
        const isActive = item.is_active ? (slotsArray.length > 0 ? 1 : 0) : 0;
        const sortedSlots = [...slotsArray].sort();
        const earliest = sortedSlots[0] || '07:00';
        const latest = sortedSlots[sortedSlots.length - 1] || '19:00';

        insertOrReplace.run(
          user.id,
          Number(item.day_of_week),
          earliest,
          latest,
          isActive,
          JSON.stringify(slotsArray)
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