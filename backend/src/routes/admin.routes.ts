import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';
import { getAuthUser } from '../middleware/auth.js';
import { getDb } from '../config/database.js';
import { AppError } from '../utils/AppError.js';

const router = Router();

// Admin: GET /users?role=...&status=...
router.get('/users', authenticate, requireRole('ADMIN'), (req, res, next) => {
  try {
    let where = `WHERE 1=1`;
    const params: (string | number)[] = [];
    if (req.query.role) { where += ` AND role = ?`; params.push(String(req.query.role)); }
    if (req.query.status) { where += ` AND status = ?`; params.push(String(req.query.status)); }
    const sql = `SELECT id, name, email, phone, role, status, avatar_url, created_at, updated_at
                 FROM users ${where} ORDER BY id DESC LIMIT 200`;
    const users = getDb().prepare(sql).all(...params) as Array<{ id: number; name: string; email: string; phone: string; role: string; status: string; avatar_url: string | null; created_at: string; updated_at: string }>;
    res.json({ data: users });
  } catch (err) { next(err); }
});

// Admin: PATCH /users/:id/status (activate/disable)
router.patch('/users/:id/status', authenticate, requireRole('ADMIN'), (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const status = String(req.body.status);
    if (!['ACTIVE', 'DISABLED'].includes(status)) {
      throw new AppError('VALIDATION_ERROR', 'Trạng thái phải là ACTIVE hoặc DISABLED.', 400);
    }
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as { id: number; status: string } | undefined;
    if (!user) throw new AppError('NOT_FOUND', 'Không tìm thấy người dùng.', 404);
    db.prepare('UPDATE users SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').run(status, id);
    const updated = db.prepare('SELECT id, name, email, role, status, updated_at FROM users WHERE id = ?').get(id);
    res.json({ data: updated });
  } catch (err) { next(err); }
});

// Admin: PATCH /users/:id/role
router.patch('/users/:id/role', authenticate, requireRole('ADMIN'), (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const role = String(req.body.role);
    if (!['GUEST', 'TECHNICIAN', 'MANAGER', 'ADMIN'].includes(role)) {
      throw new AppError('VALIDATION_ERROR', 'Vai trò không hợp lệ.', 400);
    }
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as { id: number; role: string } | undefined;
    if (!user) throw new AppError('NOT_FOUND', 'Không tìm thấy người dùng.', 404);
    db.prepare('UPDATE users SET role = ?, updated_at = datetime(\'now\') WHERE id = ?').run(role, id);
    const updated = db.prepare('SELECT id, name, email, role, status, updated_at FROM users WHERE id = ?').get(id);
    res.json({ data: updated });
  } catch (err) { next(err); }
});

// Admin: GET /stats (revenue, orders, technicians)
router.get('/stats', authenticate, requireRole('ADMIN'), (req, res, next) => {
  try {
    const db = getDb();
    const stats = {
      totalUsers: (db.prepare('SELECT COUNT(*) AS c FROM users WHERE is_deleted = 0').get() as { c: number }).c,
      totalTechnicians: (db.prepare('SELECT COUNT(*) AS c FROM users WHERE role = \'TECHNICIAN\'').get() as { c: number }).c,
      totalOrders: (db.prepare('SELECT COUNT(*) AS c FROM orders').get() as { c: number }).c,
      revenue: (db.prepare('SELECT COALESCE(SUM(final_amount), 0) AS c FROM orders WHERE payment_status = \'PAID\'').get() as { c: number }).c,
    };
    res.json({ data: stats });
  } catch (err) { next(err); }
});

// Admin: GET /settings
router.get('/settings', authenticate, requireRole('ADMIN'), (req, res, next) => {
  try {
    const { getSystemSettings } = require('../services/settingsService.js');
    const settings = getSystemSettings();
    res.json({ data: settings });
  } catch (err) { next(err); }
});

// Admin: PATCH /settings
router.patch('/settings', authenticate, requireRole('ADMIN'), (req, res, next) => {
  try {
    const db = getDb();
    const allowed = ['late_penalty_minutes', 'late_penalty_percent', 'free_service_after_minutes', 'working_start', 'working_end', 'slot_duration_minutes', 'timezone', 'technician_share_percent', 'team_share_percent'];
    for (const [key, value] of Object.entries(req.body)) {
      if (allowed.includes(key)) {
        db.prepare('INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES (?, ?, datetime(\'now\'))').run(key, String(value));
      }
    }
    const { getSystemSettings } = require('../services/settingsService.js');
    res.json({ data: getSystemSettings() });
  } catch (err) { next(err); }
});

export default router;