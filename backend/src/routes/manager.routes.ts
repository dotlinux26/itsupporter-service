import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';
import { getAuthUser } from '../middleware/auth.js';
import { getDb } from '../config/database.js';
import { AppError } from '../utils/AppError.js';
import type { OrderRow } from '../models/index.js';

const router = Router();

// Manager: GET /orders?status=...&technician_id=...&from=...&to=...
router.get('/orders', authenticate, requireRole('MANAGER', 'ADMIN'), (req, res, next) => {
  try {
    let where = `WHERE 1=1`;
    const params: (string | number)[] = [];
    if (req.query.status) { where += ` AND o.status = ?`; params.push(String(req.query.status)); }
    if (req.query.technician_id) { where += ` AND o.technician_id = ?`; params.push(Number(req.query.technician_id)); }
    if (req.query.from) { where += ` AND o.scheduled_date >= ?`; params.push(String(req.query.from)); }
    if (req.query.to) { where += ` AND o.scheduled_date <= ?`; params.push(String(req.query.to)); }
    const sql = `SELECT o.*, c.name AS customer_name, t.name AS technician_name, p.name AS package_name
                 FROM orders o
                 JOIN users c ON c.id = o.customer_id
                 LEFT JOIN users t ON t.id = o.technician_id
                 JOIN service_packages p ON p.id = o.package_id
                 ${where}
                 ORDER BY o.scheduled_date DESC, o.scheduled_start DESC
                 LIMIT 200`;
    const orders = getDb().prepare(sql).all(...params) as (OrderRow & { customer_name: string; technician_name: string | null; package_name: string })[];
    res.json({ data: orders });
  } catch (err) { next(err); }
});

// Manager: GET /technicians
router.get('/technicians', authenticate, requireRole('MANAGER', 'ADMIN'), (req, res, next) => {
  try {
    const techs = getDb()
      .prepare(`SELECT u.id, u.name, u.email, u.phone, u.avatar_url, u.status, u.created_at
                FROM users u
               WHERE u.role = 'TECHNICIAN'
               ORDER BY u.name ASC`)
      .all() as Array<{ id: number; name: string; email: string; phone: string; avatar_url: string | null; status: string; created_at: string }>;
    res.json({ data: techs });
  } catch (err) { next(err); }
});

// Manager: GET /packages
router.get('/packages', authenticate, requireRole('MANAGER', 'ADMIN'), (req, res, next) => {
  try {
    const pkgs = getDb()
      .prepare(`SELECT id, name, description, price, image, duration_minutes, features, display_order, is_active, created_at
                FROM service_packages
                ORDER BY display_order ASC, id ASC`)
      .all() as Array<{ id: number; name: string; description: string; price: number; image: string | null; duration_minutes: number; features: string; display_order: number; is_active: number; created_at: string }>;
    res.json({ data: pkgs });
  } catch (err) { next(err); }
});

// Manager: GET /settlements
router.get('/settlements', authenticate, requireRole('MANAGER', 'ADMIN'), (req, res, next) => {
  try {
    const { listSettlements } = require('../services/financeService.js');
    const data = listSettlements({ limit: 100, offset: 0 });
    res.json({ data });
  } catch (err) { next(err); }
});

// Manager: GET /reviews
router.get('/reviews', authenticate, requireRole('MANAGER', 'ADMIN'), (req, res, next) => {
  try {
    const { getReviewsByTechnician, getReviewsByCustomer } = require('../repositories/notificationReviewRepository.js');
    // List all reviews with technician/customer info
    const rows = getDb()
      .prepare(`SELECT r.*, o.code AS order_code, p.name AS package_name,
                       c.name AS customer_name, t.name AS technician_name
                FROM reviews r
                JOIN orders o ON o.id = r.order_id
                JOIN service_packages p ON p.id = o.package_id
                LEFT JOIN users c ON c.id = r.customer_id
                LEFT JOIN users t ON t.id = r.technician_id
                ORDER BY r.created_at DESC
                LIMIT 200`)
      .all() as Array<{ id: number; order_id: number; rating: number; content: string; created_at: string; order_code: string; package_name: string; customer_name: string; technician_name: string | null }>;
    res.json({ data: rows });
  } catch (err) { next(err); }
});

// Manager: GET /settings
router.get('/settings', authenticate, requireRole('MANAGER', 'ADMIN'), (req, res, next) => {
  try {
    const { getSystemSettings } = require('../services/settingsService.js');
    const settings = getSystemSettings();
    res.json({ data: settings });
  } catch (err) { next(err); }
});

export default router;