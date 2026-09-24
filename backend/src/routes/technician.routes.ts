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