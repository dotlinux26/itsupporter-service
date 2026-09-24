import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';
import { getAuthUser } from '../middleware/auth.js';
import { getDb } from '../config/database.js';
import { AppError } from '../utils/AppError.js';
import { imageUpload } from '../utils/upload.js';
import { getSystemSettings } from '../services/settingsService.js';

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
    const rev = (db.prepare('SELECT COALESCE(SUM(final_amount), 0) AS c FROM orders WHERE payment_status = \'PAID\'').get() as { c: number }).c;
    const stats = {
      totalUsers: (db.prepare('SELECT COUNT(*) AS c FROM users WHERE is_deleted = 0').get() as { c: number }).c,
      totalTechnicians: (db.prepare('SELECT COUNT(*) AS c FROM users WHERE role = \'TECHNICIAN\'').get() as { c: number }).c,
      totalOrders: (db.prepare('SELECT COUNT(*) AS c FROM orders').get() as { c: number }).c,
      totalRevenue: rev,
      revenue: rev,
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
    const keyMap: Record<string, string> = {
      late_penalty_minutes: 'late_penalty_minutes',
      latePenaltyMinutes: 'late_penalty_minutes',
      late_penalty_percent: 'late_penalty_percent',
      latePenaltyPercent: 'late_penalty_percent',
      free_service_after_minutes: 'free_service_after_minutes',
      freeServiceAfterMinutes: 'free_service_after_minutes',
      working_start: 'working_start',
      workingStart: 'working_start',
      working_end: 'working_end',
      workingEnd: 'working_end',
      slot_duration_minutes: 'slot_duration_minutes',
      slotDurationMinutes: 'slot_duration_minutes',
      timezone: 'timezone',
      technician_share_percent: 'technician_share_percent',
      technicianSharePercent: 'technician_share_percent',
      team_share_percent: 'team_share_percent',
      teamSharePercent: 'team_share_percent',
      team_name: 'team_name',
      teamName: 'team_name',
      university: 'university',
      workshop_address: 'workshop_address',
      workshopAddress: 'workshop_address',
      contact_phone: 'contact_phone',
      contactPhone: 'contact_phone',
      contact_email: 'contact_email',
      contactEmail: 'contact_email',
      facebook_page: 'facebook_page',
      facebookPage: 'facebook_page',
      distributor_name: 'distributor_name',
      distributorName: 'distributor_name',
      distributor_url: 'distributor_url',
      distributorUrl: 'distributor_url',
      google_map_embed_url: 'google_map_embed_url',
      googleMapEmbedUrl: 'google_map_embed_url',
      google_map_direct_url: 'google_map_direct_url',
      googleMapDirectUrl: 'google_map_direct_url',
      working_hours_display: 'working_hours_display',
      workingHoursDisplay: 'working_hours_display',
      booking_notice: 'booking_notice',
      bookingNotice: 'booking_notice',
      warranty_policy_enabled: 'warranty_policy_enabled',
      warrantyPolicyEnabled: 'warranty_policy_enabled',
      warranty_policy_days: 'warranty_policy_days',
      warrantyPolicyDays: 'warranty_policy_days',
      warranty_policy_title: 'warranty_policy_title',
      warrantyPolicyTitle: 'warranty_policy_title',
      warranty_policy_content: 'warranty_policy_content',
      warrantyPolicyContent: 'warranty_policy_content',
    };
    for (const [key, value] of Object.entries(req.body)) {
      const canonical = keyMap[key];
      if (canonical && value !== undefined && value !== null) {
        db.prepare('INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES (?, ?, datetime(\'now\'))').run(canonical, String(value));
      }
    }
    res.json({ data: getSystemSettings() });
  } catch (err) { next(err); }
});

// Admin/Manager: GET /qr
router.get('/qr', authenticate, requireRole('ADMIN', 'MANAGER'), (req, res, next) => {
  try {
    const db = getDb();
    const qrs = db.prepare('SELECT * FROM qr_configs ORDER BY is_active DESC, created_at DESC').all();
    res.json({ data: qrs });
  } catch (err) { next(err); }
});

// All authenticated: GET /qr/active
router.get('/qr/active', authenticate, (req, res, next) => {
  try {
    const db = getDb();
    const active = db.prepare('SELECT * FROM qr_configs WHERE is_active = 1 ORDER BY id DESC LIMIT 1').get() as { path: string } | undefined;
    res.json({ data: active ? { path: active.path } : null });
  } catch (err) { next(err); }
});

// Admin: POST /qr (Upload bank payment QR image)
router.post('/qr', authenticate, requireRole('ADMIN'), imageUpload.single('qr'), (req, res, next) => {
  try {
    const user = getAuthUser(req)!;
    if (!req.file) {
      throw new AppError('VALIDATION_ERROR', 'Vui lòng chọn file ảnh QR.', 400);
    }
    const publicPath = `/uploads/${req.file.filename}`;
    const db = getDb();
    db.prepare('UPDATE qr_configs SET is_active = 0').run();
    const result = db
      .prepare('INSERT INTO qr_configs (path, uploaded_by, description, is_active) VALUES (?, ?, ?, 1)')
      .run(publicPath, user.id, req.body.description || 'QR thanh toán ngân hàng chính thức');
    const qr = db.prepare('SELECT * FROM qr_configs WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ data: qr });
  } catch (err) { next(err); }
});

// Admin: DELETE /qr/:id
router.delete('/qr/:id', authenticate, requireRole('ADMIN'), (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const db = getDb();
    db.prepare('DELETE FROM qr_configs WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;