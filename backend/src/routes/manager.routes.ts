import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';
import { getAuthUser } from '../middleware/auth.js';
import { getDb } from '../config/database.js';
import { AppError } from '../utils/AppError.js';
import type { OrderRow } from '../models/index.js';
import { listSettlements, createSettlement, getTeamBalance, getRunBalance } from '../services/financeService.js';
import { getSystemSettings } from '../services/settingsService.js';
import { getAvailableTechnicians } from '../services/calendarService.js';

const router = Router();

// Manager: GET /analytics?days=7|14|30 (comprehensive financial & operational analytics)
router.get('/analytics', authenticate, requireRole('MANAGER', 'ADMIN'), (req, res, next) => {
  try {
    const db = getDb();
    const days = Math.min(Math.max(Number(req.query.days) || 14, 7), 90);
    const teamFundBalance = getTeamBalance();

    const revRow = db.prepare(`
      SELECT 
        COALESCE(SUM(final_amount), 0) AS total_revenue,
        COUNT(*) AS total_orders,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) AS completed_orders,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) AS pending_orders,
        COUNT(CASE WHEN status IN ('CONFIRMED', 'IN_PROGRESS') THEN 1 END) AS in_progress_orders,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) AS cancelled_orders
      FROM orders
    `).get() as any;

    const techShareRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) AS total_tech_share
      FROM financial_transactions
      WHERE type IN ('TECHNICIAN_SHARE', 'EXTEND_FEE') AND direction = 'IN'
    `).get() as any;

    const technicians = db.prepare(`
      SELECT id, name, avatar_url, email
      FROM users
      WHERE role = 'TECHNICIAN' AND is_deleted = 0
    `).all() as any[];

    let pendingSettlementsTotal = 0;
    const techLeaderboard = technicians.map((tech) => {
      const balance = getRunBalance(tech.id);
      if (balance > 0) pendingSettlementsTotal += balance;

      const stats = db.prepare(`
        SELECT 
          COUNT(*) AS total_jobs,
          COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) AS completed_jobs,
          COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN final_amount ELSE 0 END), 0) AS generated_revenue
        FROM orders
        WHERE technician_id = ?
      `).get(tech.id) as any;

      const ratingRow = db.prepare(`
        SELECT COALESCE(AVG(rating), 5.0) AS avg_rating, COUNT(*) AS review_count
        FROM reviews
        WHERE technician_id = ?
      `).get(tech.id) as any;

      return {
        id: tech.id,
        name: tech.name,
        email: tech.email,
        avatar_url: tech.avatar_url,
        current_balance: balance,
        completed_jobs: stats.completed_jobs || 0,
        generated_revenue: stats.generated_revenue || 0,
        avg_rating: Math.round((ratingRow.avg_rating || 5.0) * 10) / 10,
        review_count: ratingRow.review_count || 0,
      };
    }).sort((a, b) => b.completed_jobs - a.completed_jobs || b.generated_revenue - a.generated_revenue);

    const dateSeries: Array<{ date: string; revenue: number; order_count: number; team_share: number; tech_share: number }> = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const dateStr = d.toISOString().slice(0, 10);
      const row = db.prepare(`
        SELECT 
          COALESCE(SUM(final_amount), 0) AS revenue,
          COUNT(*) AS order_count
        FROM orders
        WHERE (
          DATE(completed_at, '+7 hours') = ? 
          OR (completed_at IS NULL AND scheduled_date = ?)
        ) AND status = 'COMPLETED'
      `).get(dateStr, dateStr) as any;

      const rev = Number(row?.revenue || 0);
      dateSeries.push({
        date: dateStr,
        revenue: rev,
        order_count: Number(row?.order_count || 0),
        team_share: Math.round(rev * 0.3),
        tech_share: Math.round(rev * 0.7),
      });
    }

    const packageStats = db.prepare(`
      SELECT 
        p.id,
        p.name,
        p.price,
        COUNT(o.id) AS order_count,
        COALESCE(SUM(CASE WHEN o.status = 'COMPLETED' THEN o.final_amount ELSE 0 END), 0) AS total_revenue
      FROM service_packages p
      LEFT JOIN orders o ON o.package_id = p.id
      GROUP BY p.id
      ORDER BY total_revenue DESC
    `).all() as any[];

    res.json({
      data: {
        summary: {
          total_revenue: revRow.total_revenue || 0,
          team_fund_balance: teamFundBalance,
          total_technician_share: techShareRow.total_tech_share || 0,
          pending_settlements_total: pendingSettlementsTotal,
          total_orders: revRow.total_orders || 0,
          completed_orders: revRow.completed_orders || 0,
          pending_orders: revRow.pending_orders || 0,
          in_progress_orders: revRow.in_progress_orders || 0,
          cancelled_orders: revRow.cancelled_orders || 0,
        },
        revenue_by_date: dateSeries,
        package_stats: packageStats,
        top_technicians: techLeaderboard,
      },
    });
  } catch (err) { next(err); }
});

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
    const data = listSettlements({ limit: 50, page: 1 });
    res.json({ data: data.data, total: data.total });
  } catch (err) { next(err); }
});

// Manager: GET /reviews
router.get('/reviews', authenticate, requireRole('MANAGER', 'ADMIN'), (req, res, next) => {
  try {
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
    const settings = getSystemSettings();
    res.json({ data: settings });
  } catch (err) { next(err); }
});

// Manager: GET /orders/:id/available-technicians
router.get('/orders/:id/available-technicians', authenticate, requireRole('MANAGER', 'ADMIN'), (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    const db = getDb();
    const order = db.prepare('SELECT id, code, scheduled_date, scheduled_start, technician_id FROM orders WHERE id = ?').get(orderId) as OrderRow | undefined;
    if (!order) throw new AppError('NOT_FOUND', 'Không tìm thấy đơn hàng.', 404);

    const availableTechs = getAvailableTechnicians(order.scheduled_date, order.scheduled_start);

    const allTechs = db.prepare(`
      SELECT u.id, u.name, u.email, u.phone, u.avatar_url, tp.bio
      FROM users u
      LEFT JOIN technician_profiles tp ON tp.user_id = u.id
      WHERE u.role = 'TECHNICIAN' AND u.status = 'ACTIVE' AND u.is_deleted = 0
      ORDER BY u.name ASC
    `).all() as any[];

    const candidateIds = availableTechs.map((t) => t.id);
    const autoRecommendedId = candidateIds.length > 0
      ? candidateIds[Math.floor(Math.random() * candidateIds.length)]
      : (allTechs.length > 0 ? allTechs[0].id : null);

    res.json({
      data: {
        order: {
          id: order.id,
          code: order.code,
          scheduled_date: order.scheduled_date,
          scheduled_start: order.scheduled_start,
          current_technician_id: order.technician_id,
        },
        available_technicians: availableTechs,
        all_technicians: allTechs,
        auto_recommended_id: autoRecommendedId,
      },
    });
  } catch (err) { next(err); }
});

// Manager: POST /orders/:id/assign
router.post('/orders/:id/assign', authenticate, requireRole('MANAGER', 'ADMIN'), (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    const technicianId = Number(req.body.technician_id || req.body.technicianId);
    const db = getDb();
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as OrderRow | undefined;
    if (!order) throw new AppError('NOT_FOUND', 'Không tìm thấy đơn hàng.', 404);

    const tech = db.prepare('SELECT * FROM users WHERE id = ? AND role = \'TECHNICIAN\' AND is_deleted = 0').get(technicianId);
    if (!tech) throw new AppError('NOT_FOUND', 'Không tìm thấy kỹ thuật viên hợp lệ.', 404);

    db.prepare('UPDATE orders SET technician_id = ?, status = CASE WHEN status = \'PENDING\' THEN \'CONFIRMED\' ELSE status END, updated_at = datetime(\'now\') WHERE id = ?').run(technicianId, orderId);
    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    res.json({ data: updated, message: 'Phân công kỹ thuật viên thành công.' });
  } catch (err) { next(err); }
});

// Manager: PATCH /orders/:id/status
router.patch('/orders/:id/status', authenticate, requireRole('MANAGER', 'ADMIN'), (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    const status = String(req.body.status);
    const valid = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    if (!valid.includes(status)) {
      throw new AppError('VALIDATION_ERROR', 'Trạng thái đơn hàng không hợp lệ.', 400);
    }
    const db = getDb();
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as OrderRow | undefined;
    if (!order) throw new AppError('NOT_FOUND', 'Không tìm thấy đơn hàng.', 404);

    db.prepare('UPDATE orders SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').run(status, orderId);
    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    res.json({ data: updated, message: 'Cập nhật trạng thái đơn hàng thành công.' });
  } catch (err) { next(err); }
});

// Manager: POST /packages (create new package)
router.post('/packages', authenticate, requireRole('MANAGER', 'ADMIN'), (req, res, next) => {
  try {
    const { name, description, price, duration_minutes, features, is_active } = req.body;
    if (!name || price == null) {
      throw new AppError('VALIDATION_ERROR', 'Vui lòng điền đầy đủ tên gói và giá.', 400);
    }
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO service_packages (name, description, price, duration_minutes, features, is_active, display_order)
      VALUES (?, ?, ?, ?, ?, ?, 99)
    `).run(
      String(name).trim(),
      description ? String(description).trim() : '',
      Number(price),
      Number(duration_minutes) || 60,
      features ? String(features).trim() : '',
      is_active !== undefined ? (is_active ? 1 : 0) : 1
    );
    const newPkg = db.prepare('SELECT * FROM service_packages WHERE id = ?').get(Number(result.lastInsertRowid));
    res.json({ data: newPkg, message: 'Tạo gói dịch vụ thành công.' });
  } catch (err) { next(err); }
});

// Manager: PATCH /packages/:id (update package)
router.patch('/packages/:id', authenticate, requireRole('MANAGER', 'ADMIN'), (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const db = getDb();
    const current = db.prepare('SELECT * FROM service_packages WHERE id = ?').get(id) as any;
    if (!current) throw new AppError('NOT_FOUND', 'Không tìm thấy gói dịch vụ.', 404);

    const name = req.body.name !== undefined ? String(req.body.name).trim() : current.name;
    const description = req.body.description !== undefined ? String(req.body.description).trim() : current.description;
    const price = req.body.price !== undefined ? Number(req.body.price) : current.price;
    const duration_minutes = req.body.duration_minutes !== undefined ? Number(req.body.duration_minutes) : current.duration_minutes;
    const features = req.body.features !== undefined ? String(req.body.features).trim() : current.features;
    const is_active = req.body.is_active !== undefined ? (req.body.is_active ? 1 : 0) : current.is_active;

    db.prepare(`
      UPDATE service_packages 
      SET name = ?, description = ?, price = ?, duration_minutes = ?, features = ?, is_active = ?
      WHERE id = ?
    `).run(name, description, price, duration_minutes, features, is_active, id);

    const updated = db.prepare('SELECT * FROM service_packages WHERE id = ?').get(id);
    res.json({ data: updated, message: 'Cập nhật gói dịch vụ thành công.' });
  } catch (err) { next(err); }
});

// Manager: DELETE /packages/:id (toggle active/inactive)
router.delete('/packages/:id', authenticate, requireRole('MANAGER', 'ADMIN'), (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const db = getDb();
    const current = db.prepare('SELECT * FROM service_packages WHERE id = ?').get(id) as any;
    if (!current) throw new AppError('NOT_FOUND', 'Không tìm thấy gói dịch vụ.', 404);

    const newStatus = current.is_active ? 0 : 1;
    db.prepare('UPDATE service_packages SET is_active = ? WHERE id = ?').run(newStatus, id);
    res.json({ message: newStatus ? 'Đã kích hoạt gói dịch vụ.' : 'Đã tắt gói dịch vụ.' });
  } catch (err) { next(err); }
});

// Manager: POST /settlements (execute settlement)
router.post('/settlements', authenticate, requireRole('MANAGER', 'ADMIN'), (req, res, next) => {
  try {
    const technicianId = Number(req.body.technician_id || req.body.technicianId);
    const notes = req.body.notes ? String(req.body.notes) : undefined;
    const authUser = getAuthUser(req);
    const managerId = authUser ? authUser.id : 1;
    const result = createSettlement(technicianId, managerId, notes);
    res.json({ data: result, message: 'Tạo phiếu quyết toán thành công.' });
  } catch (err) { next(err); }
});

// Manager: DELETE /reviews/:id (delete review)
router.delete('/reviews/:id', authenticate, requireRole('MANAGER', 'ADMIN'), (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const db = getDb();
    db.prepare('DELETE FROM reviews WHERE id = ?').run(id);
    res.json({ message: 'Đã xóa đánh giá thành công.' });
  } catch (err) { next(err); }
});

// Manager: GET /export?type=orders|settlements|financial&format=xlsx|csv
router.get('/export', authenticate, requireRole('MANAGER', 'ADMIN'), async (req, res, next) => {
  try {
    const type = (req.query.type as 'orders' | 'settlements' | 'financial') || 'orders';
    const format = (req.query.format as 'xlsx' | 'csv') || 'xlsx';
    const from = req.query.from ? String(req.query.from) : undefined;
    const to = req.query.to ? String(req.query.to) : undefined;
    const status = req.query.status ? String(req.query.status) : undefined;
    const technicianId = req.query.technician_id ? Number(req.query.technician_id) : undefined;

    const { generateExportData } = await import('../services/exportService.js');
    const { buffer, mimeType, filename } = generateExportData({
      type,
      format,
      from,
      to,
      status,
      technicianId,
    });

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

export default router;