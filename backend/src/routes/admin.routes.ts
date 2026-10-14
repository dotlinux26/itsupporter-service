import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';
import { getAuthUser } from '../middleware/auth.js';
import { getDb } from '../config/database.js';
import { AppError } from '../utils/AppError.js';
import { imageUpload } from '../utils/upload.js';
import { getSystemSettings } from '../services/settingsService.js';
import { testTelegramConnection, detectTelegramChatId } from '../services/telegramService.js';
import { telegramRateLimiter } from '../middleware/rateLimit.js';

const router = Router();

import crypto from 'node:crypto';
import { hashPassword } from '../utils/password.js';
import { writeAuditLog } from '../services/auditService.js';
import {
  listRecoveryRequests,
  findRecoveryRequestById,
  resolveRecoveryRequest,
  updateUserPassword,
  updateUser2FA,
  updateUserRecovery,
} from '../repositories/userRepository.js';

// Admin: GET /users?role=...&status=...&q=...
router.get('/users', authenticate, requireRole('ADMIN'), (req, res, next) => {
  try {
    let where = `WHERE is_deleted = 0`;
    const params: (string | number)[] = [];
    if (req.query.role) { where += ` AND role = ?`; params.push(String(req.query.role)); }
    if (req.query.status) { where += ` AND status = ?`; params.push(String(req.query.status)); }
    if (req.query.q) {
      where += ` AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)`;
      const q = `%${String(req.query.q).trim()}%`;
      params.push(q, q, q);
    }
    const sql = `SELECT id, name, email, phone, role, status, avatar_url, contact_info, created_at, updated_at, is_recovery_enabled, is_2fa_enabled
                 FROM users ${where} ORDER BY id DESC LIMIT 200`;
    const users = getDb().prepare(sql).all(...params);
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
    const user = db.prepare('SELECT * FROM users WHERE id = ? AND is_deleted = 0').get(id) as { id: number; name: string; email: string; status: string } | undefined;
    if (!user) throw new AppError('NOT_FOUND', 'Không tìm thấy người dùng.', 404);
    
    const admin = getAuthUser(req);
    const oldStatus = user.status;
    db.prepare('UPDATE users SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').run(status, id);

    writeAuditLog({
      actorId: admin?.id,
      actorEmail: admin?.email,
      action: 'ADMIN_UPDATE_USER_STATUS',
      targetType: 'USER',
      targetId: id,
      ip: req.ip,
      metadata: { target_name: user.name, target_email: user.email, old_status: oldStatus, new_status: status },
    });

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
    const user = db.prepare('SELECT * FROM users WHERE id = ? AND is_deleted = 0').get(id) as { id: number; name: string; email: string; role: string } | undefined;
    if (!user) throw new AppError('NOT_FOUND', 'Không tìm thấy người dùng.', 404);
    
    const admin = getAuthUser(req);
    const oldRole = user.role;
    db.prepare('UPDATE users SET role = ?, updated_at = datetime(\'now\') WHERE id = ?').run(role, id);
    
    // If upgraded to technician, ensure technician_profile exists
    if (role === 'TECHNICIAN') {
      db.prepare('INSERT OR IGNORE INTO technician_profiles (user_id) VALUES (?)').run(id);
    }

    writeAuditLog({
      actorId: admin?.id,
      actorEmail: admin?.email,
      action: 'ADMIN_UPDATE_USER_ROLE',
      targetType: 'USER',
      targetId: id,
      ip: req.ip,
      metadata: { target_name: user.name, target_email: user.email, old_role: oldRole, new_role: role },
    });

    const updated = db.prepare('SELECT id, name, email, role, status, updated_at FROM users WHERE id = ?').get(id);
    res.json({ data: updated });
  } catch (err) { next(err); }
});

// Admin: POST /users/:id/reset-password
router.post('/users/:id/reset-password', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const newPassword = String(req.body.newPassword || req.body.password || '').trim();
    if (newPassword.length < 8) {
      throw new AppError('VALIDATION_ERROR', 'Mật khẩu mới phải có ít nhất 8 ký tự.', 400);
    }
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ? AND is_deleted = 0').get(id) as { id: number; name: string; email: string } | undefined;
    if (!user) throw new AppError('NOT_FOUND', 'Không tìm thấy người dùng.', 404);
    
    const admin = getAuthUser(req);
    const hash = await hashPassword(newPassword);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?').run(hash, id);

    // SECURITY: NEVER log plaintext passwords into audit log metadata!
    writeAuditLog({
      actorId: admin?.id,
      actorEmail: admin?.email,
      action: 'ADMIN_RESET_PASSWORD',
      targetType: 'USER',
      targetId: id,
      ip: req.ip,
      metadata: { target_name: user.name, target_email: user.email, note: 'Mật khẩu đã được đặt lại bởi Admin' },
    });

    res.json({ message: 'Đặt lại mật khẩu thành công.' });
  } catch (err) { next(err); }
});

// Admin: DELETE /users/:id
router.delete('/users/:id', authenticate, requireRole('ADMIN'), (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as { id: number; name: string; email: string; role: string } | undefined;
    if (!user) throw new AppError('NOT_FOUND', 'Không tìm thấy người dùng.', 404);
    if (user.role === 'ADMIN') {
      throw new AppError('FORBIDDEN', 'Không thể xóa tài khoản Admin.', 403);
    }
    const admin = getAuthUser(req);
    db.prepare('UPDATE users SET is_deleted = 1, status = \'DISABLED\', updated_at = datetime(\'now\') WHERE id = ?').run(id);

    writeAuditLog({
      actorId: admin?.id,
      actorEmail: admin?.email,
      action: 'ADMIN_DELETE_USER',
      targetType: 'USER',
      targetId: id,
      ip: req.ip,
      metadata: { target_name: user.name, target_email: user.email, role: user.role },
    });

    res.json({ message: 'Đã xóa người dùng thành công.' });
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
      turnstile_enabled: 'turnstile_enabled',
      turnstileEnabled: 'turnstile_enabled',
      turnstile_site_key: 'turnstile_site_key',
      turnstileSiteKey: 'turnstile_site_key',
      turnstile_secret: 'turnstile_secret',
      turnstileSecret: 'turnstile_secret',
      telegram_enabled: 'telegram_enabled',
      telegramEnabled: 'telegram_enabled',
      telegram_bot_token: 'telegram_bot_token',
      telegramBotToken: 'telegram_bot_token',
      telegram_chat_id: 'telegram_chat_id',
      telegramChatId: 'telegram_chat_id',
      telegram_api_url: 'telegram_api_url',
      telegramApiUrl: 'telegram_api_url',
      about_markdown: 'about_markdown',
      aboutMarkdown: 'about_markdown',
      terms_markdown: 'terms_markdown',
      termsMarkdown: 'terms_markdown',
      totp_guide_markdown: 'totp_guide_markdown',
      totpGuideMarkdown: 'totp_guide_markdown',
    };

    const updatedKeys: string[] = [];
    for (const [key, value] of Object.entries(req.body)) {
      const canonical = keyMap[key];
      if (canonical && value !== undefined && value !== null) {
        db.prepare('INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES (?, ?, datetime(\'now\'))').run(canonical, String(value));
        updatedKeys.push(canonical);
      }
    }
    const admin = getAuthUser(req);
    writeAuditLog({
      actorId: admin?.id,
      actorEmail: admin?.email,
      action: 'ADMIN_UPDATE_SETTINGS',
      targetType: 'SYSTEM_SETTINGS',
      targetId: 'GLOBAL',
      ip: req.ip,
      metadata: { updated_keys: updatedKeys },
    });
    res.json({ data: getSystemSettings() });
  } catch (err) { next(err); }
});

// Admin: POST /telegram/test
router.post('/telegram/test', authenticate, requireRole('ADMIN'), telegramRateLimiter, async (req, res, next) => {
  try {
    const { chatId } = req.body;
    const result = await testTelegramConnection(chatId);
    if (!result.success) {
      throw new AppError('VALIDATION_ERROR', result.message, 400);
    }
    res.json({ success: true, message: result.message });
  } catch (err) { next(err); }
});

// Admin: POST /telegram/detect-chat-id
router.post('/telegram/detect-chat-id', authenticate, requireRole('ADMIN'), telegramRateLimiter, async (_req, res, next) => {
  try {
    const result = await detectTelegramChatId();
    if (!result.success) {
      throw new AppError('VALIDATION_ERROR', result.message, 400);
    }
    res.json(result);
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
    const qr = db.prepare('SELECT * FROM qr_configs WHERE id = ?').get(result.lastInsertRowid) as { id: number; path: string; description: string };
    
    writeAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      action: 'ADMIN_UPLOAD_QR',
      targetType: 'QR_CONFIG',
      targetId: qr.id,
      ip: req.ip,
      metadata: { path: qr.path, description: qr.description },
    });

    res.status(201).json({ data: qr });
  } catch (err) { next(err); }
});

// Admin: DELETE /qr/:id
router.delete('/qr/:id', authenticate, requireRole('ADMIN'), (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const db = getDb();
    const qr = db.prepare('SELECT * FROM qr_configs WHERE id = ?').get(id) as { id: number; path: string } | undefined;
    db.prepare('DELETE FROM qr_configs WHERE id = ?').run(id);

    const admin = getAuthUser(req);
    writeAuditLog({
      actorId: admin?.id,
      actorEmail: admin?.email,
      action: 'ADMIN_DELETE_QR',
      targetType: 'QR_CONFIG',
      targetId: id,
      ip: req.ip,
      metadata: { deleted_path: qr?.path },
    });

    res.json({ success: true });
  } catch (err) { next(err); }
});

// Admin: POST /users/:id/reset-totp - Reset 2FA or Recovery TOTP or Both
router.post('/users/:id/reset-totp', authenticate, requireRole('ADMIN'), (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const type = String(req.body.type || 'ALL').toUpperCase(); // '2FA', 'RECOVERY', 'ALL'
    const db = getDb();
    const user = db.prepare('SELECT id, name, email FROM users WHERE id = ? AND is_deleted = 0').get(id) as { id: number; name: string; email: string } | undefined;
    if (!user) throw new AppError('NOT_FOUND', 'Không tìm thấy người dùng.', 404);

    if (type === '2FA' || type === 'ALL') {
      updateUser2FA(id, 0, null, null);
    }
    if (type === 'RECOVERY' || type === 'ALL') {
      updateUserRecovery(id, 0, null, null);
    }

    const admin = getAuthUser(req);
    writeAuditLog({
      actorId: admin?.id,
      actorEmail: admin?.email,
      action: 'ADMIN_RESET_USER_TOTP',
      targetType: 'USER',
      targetId: id,
      ip: req.ip,
      metadata: { target_name: user.name, target_email: user.email, reset_type: type },
    });

    res.json({ success: true, message: `Đã reset cấu hình TOTP (${type}) cho người dùng thành công.` });
  } catch (err) { next(err); }
});

router.post('/users/:id/reset-2fa', authenticate, requireRole('ADMIN'), (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const db = getDb();
    const user = db.prepare('SELECT id, name, email FROM users WHERE id = ? AND is_deleted = 0').get(id) as { id: number; name: string; email: string } | undefined;
    if (!user) throw new AppError('NOT_FOUND', 'Không tìm thấy người dùng.', 404);

    updateUser2FA(id, 0, null, null);

    const admin = getAuthUser(req);
    writeAuditLog({
      actorId: admin?.id,
      actorEmail: admin?.email,
      action: 'ADMIN_RESET_USER_2FA',
      targetType: 'USER',
      targetId: id,
      ip: req.ip,
      metadata: { target_name: user.name, target_email: user.email },
    });

    res.json({ success: true, message: 'Đã tắt và đặt lại xác thực 2 bước (2FA) cho người dùng thành công.' });
  } catch (err) { next(err); }
});

router.post('/users/:id/reset-recovery', authenticate, requireRole('ADMIN'), (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const db = getDb();
    const user = db.prepare('SELECT id, name, email FROM users WHERE id = ? AND is_deleted = 0').get(id) as { id: number; name: string; email: string } | undefined;
    if (!user) throw new AppError('NOT_FOUND', 'Không tìm thấy người dùng.', 404);

    updateUserRecovery(id, 0, null, null);

    const admin = getAuthUser(req);
    writeAuditLog({
      actorId: admin?.id,
      actorEmail: admin?.email,
      action: 'ADMIN_RESET_USER_RECOVERY',
      targetType: 'USER',
      targetId: id,
      ip: req.ip,
      metadata: { target_name: user.name, target_email: user.email },
    });

    res.json({ success: true, message: 'Đã hủy kích hoạt tính năng khôi phục mật khẩu TOTP cho người dùng thành công.' });
  } catch (err) { next(err); }
});

// Admin: GET /recovery-requests - List account recovery requests
router.get('/recovery-requests', authenticate, requireRole('ADMIN'), (req, res, next) => {
  try {
    const status = req.query.status ? String(req.query.status) : undefined;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;

    const result = listRecoveryRequests({ status, page, limit });
    res.json(result);
  } catch (err) { next(err); }
});

// Admin: POST /recovery-requests/:id/approve - 1-Click Approve Helpdesk Request
router.post('/recovery-requests/:id/approve', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { adminNotes } = req.body;
    const request = findRecoveryRequestById(id);
    if (!request) throw new AppError('NOT_FOUND', 'Không tìm thấy yêu cầu cứu trợ.', 404);

    const admin = getAuthUser(req)!;
    let temporaryPassword = '';

    if (request.user_id) {
      // Generate temporary secure password (e.g., ITSupporter@8392)
      temporaryPassword = `ITSupporter@${crypto.randomInt(1000, 9999)}`;
      const hash = await hashPassword(temporaryPassword);
      updateUserPassword(request.user_id, hash);
      // Reset 2FA and Recovery so user can login and re-configure
      updateUser2FA(request.user_id, 0, null, null);
      updateUserRecovery(request.user_id, 0, null, null);
    }

    resolveRecoveryRequest(id, 'APPROVED', adminNotes || 'Đã duyệt và cấp mật khẩu tạm qua Helpdesk', admin.id);

    writeAuditLog({
      actorId: admin.id,
      actorEmail: admin.email,
      action: 'ADMIN_APPROVE_RECOVERY_REQUEST',
      targetType: 'ACCOUNT_RECOVERY_REQUEST',
      targetId: id,
      ip: req.ip,
      metadata: {
        request_id: id,
        username_or_email: request.username_or_email,
        user_id: request.user_id,
        admin_notes: adminNotes,
      },
    });

    res.json({
      success: true,
      message: 'Đã phê duyệt yêu cầu khôi phục tài khoản thành công.',
      temporaryPassword,
    });
  } catch (err) { next(err); }
});

// Admin: POST /recovery-requests/:id/reject
router.post('/recovery-requests/:id/reject', authenticate, requireRole('ADMIN'), (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { adminNotes } = req.body;
    const request = findRecoveryRequestById(id);
    if (!request) throw new AppError('NOT_FOUND', 'Không tìm thấy yêu cầu cứu trợ.', 404);

    const admin = getAuthUser(req)!;
    resolveRecoveryRequest(id, 'REJECTED', adminNotes || 'Từ chối yêu cầu cứu trợ', admin.id);

    writeAuditLog({
      actorId: admin.id,
      actorEmail: admin.email,
      action: 'ADMIN_REJECT_RECOVERY_REQUEST',
      targetType: 'ACCOUNT_RECOVERY_REQUEST',
      targetId: id,
      ip: req.ip,
      metadata: {
        request_id: id,
        username_or_email: request.username_or_email,
        admin_notes: adminNotes,
      },
    });

    res.json({ success: true, message: 'Đã từ chối yêu cầu cứu trợ.' });
  } catch (err) { next(err); }
});

// Admin/Manager: POST /uploads/markdown-image or /upload-image (Markdown Editor paste/drop)
router.post(
  ['/uploads/markdown-image', '/upload-image'],
  authenticate,
  requireRole('ADMIN', 'MANAGER'),
  imageUpload.single('image'),
  (req, res, next) => {
    try {
      if (!req.file) {
        throw new AppError('VALIDATION_ERROR', 'Vui lòng chọn hoặc dán hình ảnh hợp lệ.', 400);
      }
      const publicUrl = `/uploads/${req.file.filename}`;
      res.status(201).json({
        success: true,
        url: publicUrl,
        filename: req.file.filename,
      });
    } catch (err) { next(err); }
  }
);

export default router;