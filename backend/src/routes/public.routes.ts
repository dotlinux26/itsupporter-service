import { Router } from 'express';
import { getDb } from '../config/database.js';
import { buildSlots, getAvailableTechnicians } from '../services/calendarService.js';
import { getPublicRecentReviews } from '../repositories/notificationReviewRepository.js';
import { getSystemSettings } from '../services/settingsService.js';

const router = Router();

// GET /api/public/info - Thông tin đội IT Supporter HaUI & địa chỉ phòng làm việc tiếp nhận máy
router.get('/info', (_req, res, next) => {
  try {
    const settings = getSystemSettings();
    const db = getDb();
    const completedCountRow = db.prepare("SELECT COUNT(*) AS c FROM orders WHERE status = 'COMPLETED'").get() as { c: number };
    const totalOrdersRow = db.prepare("SELECT COUNT(*) AS c FROM orders").get() as { c: number };
    const reviewStatsRow = db.prepare(`
      SELECT 
        COUNT(*) AS total_reviews,
        COALESCE(AVG(rating), 5.0) AS avg_rating,
        COUNT(CASE WHEN rating >= 4 THEN 1 END) AS positive_reviews
      FROM reviews
    `).get() as { total_reviews: number; avg_rating: number; positive_reviews: number };
    const activeTechsRow = db.prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'TECHNICIAN' AND is_deleted = 0 AND status = 'ACTIVE'").get() as { c: number };

    const satisfactionPercent = reviewStatsRow.total_reviews > 0
      ? Math.round((reviewStatsRow.positive_reviews / reviewStatsRow.total_reviews) * 1000) / 10
      : 100;

    res.json({
      data: {
        team_name: settings.teamName,
        university: settings.university,
        workshop_address: settings.workshopAddress,
        contact_phone: settings.contactPhone,
        email: settings.contactEmail,
        facebook_page: settings.facebookPage,
        distributor_name: settings.distributorName,
        distributor_url: settings.distributorUrl,
        google_map_embed_url: settings.googleMapEmbedUrl,
        google_map_direct_url: settings.googleMapDirectUrl,
        working_hours_display: settings.workingHoursDisplay,
        booking_notice: settings.bookingNotice,
        warranty_policy_enabled: settings.warrantyPolicyEnabled,
        warranty_policy_days: settings.warrantyPolicyDays,
        warranty_policy_title: settings.warrantyPolicyTitle,
        warranty_policy_content: settings.warrantyPolicyContent,
        stats: {
          completed_orders_count: completedCountRow.c,
          total_orders_count: totalOrdersRow.c,
          total_reviews: reviewStatsRow.total_reviews,
          avg_rating: Math.round(reviewStatsRow.avg_rating * 10) / 10,
          satisfaction_percent: satisfactionPercent,
          active_technicians_count: activeTechsRow.c,
        },
        // CamelCase properties for convenience in frontend
        teamName: settings.teamName,
        workshopAddress: settings.workshopAddress,
        contactPhone: settings.contactPhone,
        contactEmail: settings.contactEmail,
        facebookPage: settings.facebookPage,
        distributorName: settings.distributorName,
        distributorUrl: settings.distributorUrl,
        googleMapEmbedUrl: settings.googleMapEmbedUrl,
        googleMapDirectUrl: settings.googleMapDirectUrl,
        workingHoursDisplay: settings.workingHoursDisplay,
        bookingNotice: settings.bookingNotice,
        warrantyPolicyEnabled: settings.warrantyPolicyEnabled,
        warrantyPolicyDays: settings.warrantyPolicyDays,
        warrantyPolicyTitle: settings.warrantyPolicyTitle,
        warrantyPolicyContent: settings.warrantyPolicyContent,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/public/packages - Danh sách gói dịch vụ (Basic, Premium)
router.get('/packages', (_req, res, next) => {
  try {
    const db = getDb();
    const packages = db
      .prepare(`
        SELECT id, name, description, price, duration_minutes, features, display_order, image
        FROM service_packages
        WHERE is_active = 1
        ORDER BY display_order ASC, id ASC
      `)
      .all();
    res.json({ data: packages });
  } catch (err) {
    next(err);
  }
});

// GET /api/public/slots?date=YYYY-MM-DD - Lấy các ca làm việc trong ngày (7h - 19h)
router.get('/slots', (req, res, next) => {
  try {
    const date = String(req.query.date ?? new Date().toISOString().slice(0, 10));
    const allSlots = buildSlots();

    // Map each slot with available technician count and info
    const data = allSlots.map((slot) => {
      const availableTechs = getAvailableTechnicians(date, slot.start);
      return {
        start: slot.start,
        end: slot.end,
        available: availableTechs.length > 0,
        technicians: availableTechs.map((t) => ({
          id: t.id,
          name: t.name,
          avatar_url: t.avatar_url,
        })),
      };
    });

    res.json({ data, date });
  } catch (err) {
    next(err);
  }
});

// GET /api/public/technicians?date=YYYY-MM-DD&start=HH:MM - Kỹ thuật viên khả dụng theo ca
router.get('/technicians', (req, res, next) => {
  try {
    const date = String(req.query.date ?? new Date().toISOString().slice(0, 10));
    const start = String(req.query.start ?? '');
    if (!start) {
      // Return all active technicians
      const db = getDb();
      const allTechs = db
        .prepare(`
          SELECT u.id, u.name, u.email, u.phone, u.avatar_url,
                 p.bio, p.public_profile,
                 ROUND(COALESCE(AVG(r.rating), 0), 1) AS rating,
                 COUNT(r.id) AS rating_count
          FROM users u
          LEFT JOIN technician_profiles p ON p.user_id = u.id
          LEFT JOIN reviews r ON r.technician_id = u.id
          WHERE u.role = 'TECHNICIAN' AND u.status = 'ACTIVE' AND u.is_deleted = 0
          GROUP BY u.id
          ORDER BY u.name ASC
        `)
        .all();
      res.json({ data: allTechs });
      return;
    }

    const availableTechs = getAvailableTechnicians(date, start);
    res.json({ data: availableTechs });
  } catch (err) {
    next(err);
  }
});

// GET /api/public/orders?limit=10&offset=0 - Danh sách đơn công khai (10 đơn/lần)
router.get('/orders', (req, res, next) => {
  try {
    const db = getDb();
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const query = `
      SELECT o.id, o.code, o.scheduled_date, o.scheduled_start, o.status, o.location,
             p.name AS package_name,
             c.name AS customer_name,
             t.name AS technician_name,
             o.created_at
      FROM orders o
      JOIN users c ON c.id = o.customer_id
      LEFT JOIN users t ON t.id = o.technician_id
      JOIN service_packages p ON p.id = o.package_id
      ORDER BY o.id DESC
      LIMIT ? OFFSET ?
    `;

    const orders = db.prepare(query).all(limit, offset) as Array<{
      id: number;
      code: string;
      scheduled_date: string;
      scheduled_start: string;
      status: string;
      location: string;
      package_name: string;
      customer_name: string;
      technician_name: string | null;
      created_at: string;
    }>;

    // Mask customer name for privacy in public list: "Nguyễn Văn A" -> "Nguyễn ***"
    const maskedOrders = orders.map((ord) => {
      const parts = (ord.customer_name || '').split(' ');
      const maskedName = parts.length > 1 ? `${parts[0]} ***` : (ord.customer_name || 'Khách hàng');
      return {
        ...ord,
        customer_name: maskedName,
      };
    });

    const total = (db.prepare('SELECT COUNT(*) AS c FROM orders').get() as { c: number }).c;

    res.json({ data: maskedOrders, total, hasMore: offset + limit < total });
  } catch (err) {
    next(err);
  }
});

// GET /api/public/reviews?limit=10&offset=0 - Đánh giá từ khách hàng (10 đơn mới nhất, bấm tải thêm)
router.get('/reviews', (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const reviews = getPublicRecentReviews(limit, offset);
    const total = (getDb().prepare('SELECT COUNT(*) AS c FROM reviews').get() as { c: number }).c;

    res.json({ data: reviews, total, hasMore: offset + limit < total });
  } catch (err) {
    next(err);
  }
});

export default router;
