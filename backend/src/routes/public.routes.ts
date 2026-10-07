import { Router } from 'express';
import { getDb } from '../config/database.js';
import { buildSlots, getAvailableTechnicians } from '../services/calendarService.js';
import { getPublicRecentReviews } from '../repositories/notificationReviewRepository.js';
import { getSystemSettings } from '../services/settingsService.js';
import { TIME_ZONE, todayInZone, toISOWithZone } from '../utils/dateTime.js';

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
        late_penalty_minutes: settings.latePenaltyMinutes,
        late_penalty_percent: settings.latePenaltyPercent,
        free_service_after_minutes: settings.freeServiceAfterMinutes,
        stats: {
          completed_orders_count: completedCountRow.c,
          total_orders_count: totalOrdersRow.c,
          total_reviews: reviewStatsRow.total_reviews,
          avg_rating: Math.round(reviewStatsRow.avg_rating * 10) / 10,
          satisfaction_percent: satisfactionPercent,
          active_technicians_count: activeTechsRow.c,
        },
        // CamelCase properties for convenience in frontend
        latePenaltyMinutes: settings.latePenaltyMinutes,
        latePenaltyPercent: settings.latePenaltyPercent,
        freeServiceAfterMinutes: settings.freeServiceAfterMinutes,
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
        turnstile_enabled: settings.turnstileEnabled,
        turnstile_site_key: settings.turnstileSiteKey,
        turnstileEnabled: settings.turnstileEnabled,
        turnstileSiteKey: settings.turnstileSiteKey,
        server_today: todayInZone(),
        server_time: new Date().toISOString(),
        server_timestamp: Date.now(),
        timezone: TIME_ZONE,
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
        SELECT id, name, description, price, duration_minutes, features, display_order, is_active, image
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
    const serverToday = todayInZone();
    const date = String(req.query.date ?? serverToday);
    const allSlots = buildSlots();
    const nowMs = Date.now();
    const minAdvanceMs = 4 * 60 * 60 * 1000; // 4 hours in ms

    // Map each slot with available technician count and info + authoritative bookable state
    const data = allSlots.map((slot) => {
      const availableTechs = getAvailableTechnicians(date, slot.start);
      const scheduledTime = toISOWithZone(date, slot.start);
      const diffMs = scheduledTime.getTime() - nowMs;
      const isTooSoon = diffMs < minAdvanceMs;
      const hasTechs = availableTechs.length > 0;
      const bookable = hasTechs && !isTooSoon;

      let reason: 'TOO_SOON_4H' | 'NO_TECHNICIAN' | null = null;
      if (isTooSoon) {
        reason = 'TOO_SOON_4H';
      } else if (!hasTechs) {
        reason = 'NO_TECHNICIAN';
      }

      return {
        start: slot.start,
        end: slot.end,
        available: hasTechs,
        bookable,
        is_too_soon: isTooSoon,
        reason,
        diff_hours: Math.round((diffMs / 3600000) * 10) / 10,
        technicians: availableTechs.map((t) => ({
          id: t.id,
          name: t.name,
          avatar_url: t.avatar_url,
        })),
      };
    });

    res.json({
      data,
      date,
      server_today: serverToday,
      server_time: new Date().toISOString(),
      server_timestamp: nowMs,
      timezone: TIME_ZONE,
      min_advance_hours: 4,
    });
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
          SELECT u.id, u.name, u.avatar_url,
                 p.bio, p.public_profile, p.alias,
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

// GET /api/public/technicians/profile/:aliasOrId - Public Profile KTV
router.get('/technicians/profile/:aliasOrId', (req, res, next) => {
  try {
    const aliasOrId = String(req.params.aliasOrId ?? '').trim();
    if (!aliasOrId) {
      res.status(400).json({ error: { message: 'Thiếu định danh kỹ thuật viên.' } });
      return;
    }

    const db = getDb();
    const isNumeric = /^\d+$/.test(aliasOrId);

    const query = `
      SELECT u.id, u.name, u.avatar_url, u.created_at,
             p.bio, p.public_profile, p.alias,
             ROUND(COALESCE(AVG(r.rating), 5.0), 1) AS rating,
             COUNT(DISTINCT r.id) AS rating_count,
             (SELECT COUNT(*) FROM orders o WHERE o.technician_id = u.id AND o.status = 'COMPLETED') AS completed_orders_count
      FROM users u
      LEFT JOIN technician_profiles p ON p.user_id = u.id
      LEFT JOIN reviews r ON r.technician_id = u.id
      WHERE u.role = 'TECHNICIAN' AND u.status = 'ACTIVE' AND u.is_deleted = 0
        AND (${isNumeric ? 'u.id = ? OR LOWER(p.alias) = LOWER(?)' : 'LOWER(p.alias) = LOWER(?)'})
      GROUP BY u.id
      LIMIT 1
    `;

    const params = isNumeric ? [Number(aliasOrId), aliasOrId] : [aliasOrId];
    const tech = db.prepare(query).get(...params) as any;

    if (!tech) {
      res.status(404).json({ error: { message: 'Không tìm thấy kỹ thuật viên.' } });
      return;
    }

    // Masking tên khách hàng (vd: Nguyễn V. A.) và KHÔNG lộ email/SĐT (Bảo mật PII)
    const reviews = db
      .prepare(`
        SELECT r.id, r.rating, r.content, r.created_at,
               c.name AS customer_name,
               pkg.name AS package_name
        FROM reviews r
        JOIN orders o ON o.id = r.order_id
        JOIN users c ON c.id = r.customer_id
        JOIN service_packages pkg ON pkg.id = o.package_id
        WHERE r.technician_id = ?
        ORDER BY r.created_at DESC
        LIMIT 20
      `)
      .all(tech.id) as Array<{
        id: number;
        rating: number;
        content: string;
        created_at: string;
        customer_name: string;
        package_name: string;
      }>;

    const maskedReviews = reviews.map((rev) => {
      const parts = (rev.customer_name || 'Khách hàng').trim().split(/\s+/);
      let maskedName = rev.customer_name;
      if (parts.length > 2) {
        maskedName = `${parts[0]} ${parts.slice(1, -1).map((p) => p[0].toUpperCase() + '.').join(' ')} ${parts[parts.length - 1]}`;
      } else if (parts.length === 2) {
        maskedName = `${parts[0]} ${parts[1][0].toUpperCase()}.`;
      }
      return {
        id: rev.id,
        rating: rev.rating,
        content: rev.content,
        created_at: rev.created_at,
        customer_name: maskedName,
        package_name: rev.package_name,
      };
    });

    res.json({
      data: {
        ...tech,
        reviews: maskedReviews,
      },
    });
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
