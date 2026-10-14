import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import config from '../config/index.js';
import { getDb } from '../config/database.js';
import { buildSlots, getAvailableTechnicians } from '../services/calendarService.js';
import { getPublicRecentReviews } from '../repositories/notificationReviewRepository.js';
import { getSystemSettings } from '../services/settingsService.js';
import { TIME_ZONE, todayInZone, toISOWithZone } from '../utils/dateTime.js';
import { generateAvatarSvg } from '../utils/avatar.js';
import logger from '../utils/logger.js';
import { imageUpload } from '../utils/upload.js';
import { AppError } from '../utils/AppError.js';
import { createRecoveryRequest, findUserByIdentifier } from '../repositories/userRepository.js';
import { notifyAccountRecoveryRequest } from '../services/telegramService.js';
import { accountRecoveryRateLimiter } from '../middleware/rateLimit.js';

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
        about_markdown: settings.aboutMarkdown,
        aboutMarkdown: settings.aboutMarkdown,
        terms_markdown: settings.termsMarkdown,
        termsMarkdown: settings.termsMarkdown,
        totp_guide_markdown: settings.totpGuideMarkdown,
        totpGuideMarkdown: settings.totpGuideMarkdown,
        totp_guide_video_url: settings.totpGuideVideoUrl,
        totpGuideVideoUrl: settings.totpGuideVideoUrl,
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
    const rawParam = String(req.params.aliasOrId ?? '').trim();
    const aliasOrId = rawParam.replace(/[./]+$/, '').trim();
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
        AND (${isNumeric ? 'u.id = ? OR LOWER(p.alias) = LOWER(?)' : "LOWER(p.alias) = LOWER(?) OR LOWER(u.name) = LOWER(?) OR (instr(u.email, '@') > 0 AND LOWER(substr(u.email, 1, instr(u.email, '@') - 1)) = LOWER(?))"})
      GROUP BY u.id
      LIMIT 1
    `;

    const params = isNumeric ? [Number(aliasOrId), aliasOrId] : [aliasOrId, aliasOrId, aliasOrId];
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

function escapeXml(unsafe: string): string {
  return String(unsafe || '').replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

async function renderTechnicianOgPng(rawAliasOrId: string): Promise<Buffer> {
  const aliasOrId = String(rawAliasOrId || '').replace(/[./]+$/, '').trim();
  const db = getDb();
  const isNumeric = /^\d+$/.test(aliasOrId);

  const query = `
    SELECT u.id, u.name, u.avatar_url,
           p.bio, p.alias,
           ROUND(COALESCE(AVG(r.rating), 5.0), 1) AS rating,
           COUNT(DISTINCT r.id) AS rating_count,
           (SELECT COUNT(*) FROM orders o WHERE o.technician_id = u.id AND o.status = 'COMPLETED') AS completed_orders_count
    FROM users u
    LEFT JOIN technician_profiles p ON p.user_id = u.id
    LEFT JOIN reviews r ON r.technician_id = u.id
    WHERE u.role = 'TECHNICIAN' AND u.status = 'ACTIVE' AND u.is_deleted = 0
      AND (${isNumeric ? 'u.id = ? OR LOWER(p.alias) = LOWER(?)' : "LOWER(p.alias) = LOWER(?) OR LOWER(u.name) = LOWER(?) OR (instr(u.email, '@') > 0 AND LOWER(substr(u.email, 1, instr(u.email, '@') - 1)) = LOWER(?))"})
    GROUP BY u.id
    LIMIT 1
  `;

  const params = isNumeric ? [Number(aliasOrId), aliasOrId] : [aliasOrId, aliasOrId, aliasOrId];
  const tech = db.prepare(query).get(...params) as any;

  const name = escapeXml(tech?.name || 'Kỹ thuật viên IT Supporter');
  const rating = Number(tech?.rating || 5.0).toFixed(1);
  const ratingCount = Number(tech?.rating_count || 0);
  const completedCount = Number(tech?.completed_orders_count || 0);
  const rawBio = tech?.bio || 'Đội ngũ kỹ thuật viên sinh viên nhiệt huyết, được đào tạo bài bản về vệ sinh và bảo dưỡng phần cứng PC/Laptop tại Đại học Công nghiệp Hà Nội.';
  const bio = escapeXml(rawBio.length > 140 ? rawBio.slice(0, 140) + '...' : rawBio);

  let avatarBase64 = '';
  if (tech?.avatar_url && tech.avatar_url.startsWith('/uploads/')) {
    const filename = path.basename(tech.avatar_url);
    const filePath = path.join(config.uploadDir, filename);
    if (fs.existsSync(filePath)) {
      try {
        const fileBuf = fs.readFileSync(filePath);
        const avatarPng = await sharp(fileBuf).resize(360, 360, { fit: 'cover' }).png().toBuffer();
        avatarBase64 = `data:image/png;base64,${avatarPng.toString('base64')}`;
      } catch (err) {
        logger.warn({ err }, 'Failed to read avatar for OG image');
      }
    }
  }

  if (!avatarBase64) {
    const svgAvatar = generateAvatarSvg(tech?.name, null, 360);
    const avatarPng = await sharp(Buffer.from(svgAvatar)).png().toBuffer();
    avatarBase64 = `data:image/png;base64,${avatarPng.toString('base64')}`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="100%" stop-color="#020617" />
      </linearGradient>
      <radialGradient id="glowGrad" cx="20%" cy="50%" r="60%">
        <stop offset="0%" stop-color="#ea580c" stop-opacity="0.3" />
        <stop offset="100%" stop-color="#ea580c" stop-opacity="0" />
      </radialGradient>
      <clipPath id="avatarClip">
        <circle cx="240" cy="315" r="150" />
      </clipPath>
    </defs>

    <!-- Background -->
    <rect width="1200" height="630" fill="url(#bgGrad)" />
    <rect width="1200" height="630" fill="url(#glowGrad)" />

    <!-- Left Side: Circular Avatar (Trai Avatar) -->
    <circle cx="240" cy="315" r="160" fill="none" stroke="#ea580c" stroke-width="8" />
    <circle cx="240" cy="315" r="150" fill="#1e293b" />
    <image href="${avatarBase64}" x="90" y="165" width="300" height="300" preserveAspectRatio="xMidYMid slice" clip-path="url(#avatarClip)" />

    <!-- Badge dưới avatar -->
    <g transform="translate(130, 490)">
      <rect width="220" height="42" rx="21" fill="#ea580c" />
      <text x="110" y="26" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="13" font-weight="bold" fill="#ffffff" text-anchor="middle">✓ KỸ THUẬT VIÊN CHÍNH THỨC</text>
    </g>

    <!-- Right Side: Info (Phai Ho Ten & Thong Tin) -->
    <text x="450" y="145" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="18" font-weight="bold" fill="#fb923c" letter-spacing="1">
      IT SUPPORTER HaUI · ĐẠI HỌC CÔNG NGHIỆP HÀ NỘI
    </text>

    <!-- Họ tên kỹ thuật viên -->
    <text x="450" y="225" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="52" font-weight="bold" fill="#ffffff">
      ${name}
    </text>

    <!-- Chức danh -->
    <text x="450" y="275" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="22" font-weight="500" fill="#94a3b8">
      Kỹ thuật viên Vệ sinh &amp; Bảo dưỡng phần cứng PC/Laptop
    </text>

    <!-- Stats Box -->
    <rect x="450" y="315" width="670" height="85" rx="16" fill="#1e293b" fill-opacity="0.85" stroke="#334155" stroke-width="1.5" />
    
    <!-- Rating -->
    <text x="480" y="367" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="26" font-weight="bold" fill="#facc15">
      ★ ${rating} <tspan font-size="15" fill="#94a3b8" font-weight="normal">(${ratingCount} đánh giá)</tspan>
    </text>

    <line x1="720" y1="335" x2="720" y2="380" stroke="#475569" stroke-width="2" />

    <!-- Orders Completed -->
    <text x="750" y="367" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="26" font-weight="bold" fill="#38bdf8">
      ${completedCount} <tspan font-size="15" fill="#94a3b8" font-weight="normal">ca bảo dưỡng thành công</tspan>
    </text>

    <!-- Bio snippet -->
    <text x="450" y="445" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="18" fill="#cbd5e1">
      ${bio}
    </text>

    <!-- Footer Bar -->
    <line x1="450" y1="495" x2="1120" y2="495" stroke="#334155" stroke-width="1" />
    <text x="450" y="535" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="16" font-weight="bold" fill="#fb923c">
      ĐẶT LỊCH TRỰC TUYẾN: itsupporter.io.vn
    </text>
    <text x="850" y="535" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="16" fill="#94a3b8">
      Hotline: 0337.616.423
    </text>
  </svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

// GET /api/public/ktv/:aliasOrId/og-image - Dynamic Open Graph PNG image for KTV
router.get(['/ktv/:aliasOrId/og-image', '/ktv/:aliasOrId/og-image.png', '/technicians/profile/:aliasOrId/og-image'], async (req, res) => {
  try {
    const aliasOrId = String(req.params.aliasOrId || '').trim();
    const pngBuffer = await renderTechnicianOgPng(aliasOrId);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    res.send(pngBuffer);
  } catch (err) {
    logger.error({ err }, 'Error generating technician OG image');
    res.status(500).send('Error generating OG image');
  }
});

// Link and HTML protection filter to prevent XSS and Phishing
const HTML_TAG_REGEX = /<[^>]*>/i;
const PROTOCOL_URL_REGEX = /(https?:\/\/|ftp:\/\/|www\.[a-zA-Z0-9-]+\.[a-zA-Z]{2,})/i;

function assertSafePlainText(value: string | undefined, fieldLabel: string, isEmailField = false): void {
  if (!value) return;
  if (HTML_TAG_REGEX.test(value)) {
    throw new AppError('VALIDATION_ERROR', `Trường "${fieldLabel}" không được chứa mã HTML.`, 400);
  }
  // Email fields should not be flagged for domain extensions like .com, .vn
  if (isEmailField) {
    if (PROTOCOL_URL_REGEX.test(value)) {
      throw new AppError('VALIDATION_ERROR', `Trường "${fieldLabel}" không hợp lệ.`, 400);
    }
    return;
  }
  // Strip out valid email addresses before checking for links
  const stripped = value.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '');
  if (PROTOCOL_URL_REGEX.test(stripped)) {
    throw new AppError(
      'VALIDATION_ERROR',
      `Vì lý do an toàn bảo mật, form cứu trợ tài khoản nghiêm cấm cung cấp đường dẫn liên kết (links/URLs). Vui lòng chỉ nhập thông tin văn bản thuần túy cho "${fieldLabel}".`,
      400
    );
  }
}

// POST /api/public/recovery-requests - Submit helpdesk account recovery request
router.post('/recovery-requests', accountRecoveryRateLimiter, async (req, res, next) => {
  try {
    const { usernameOrEmail, fullName, contactPhone, contactEmail, reason } = req.body;

    if (!usernameOrEmail?.trim() || !fullName?.trim() || !contactPhone?.trim() || !reason?.trim()) {
      throw new AppError('VALIDATION_ERROR', 'Vui lòng điền đầy đủ các thông tin bắt buộc: Tài khoản/Email, Họ tên, SĐT liên hệ và Lý do.', 400);
    }

    // Strict validation: No links, no HTML in any text fields
    assertSafePlainText(usernameOrEmail, 'Tài khoản cần cứu', true);
    assertSafePlainText(fullName, 'Họ và tên', false);
    assertSafePlainText(contactPhone, 'Số điện thoại liên hệ', false);
    assertSafePlainText(contactEmail, 'Email liên hệ', true);
    assertSafePlainText(reason, 'Lý do & mô tả sự cố', false);

    const cleanUsernameOrEmail = usernameOrEmail.trim();
    const cleanFullName = fullName.trim();
    const cleanPhone = contactPhone.trim();
    const cleanEmail = contactEmail?.trim() || null;
    const cleanReason = reason.trim();

    const matchedUser = findUserByIdentifier(cleanUsernameOrEmail);

    const id = createRecoveryRequest({
      userId: matchedUser?.id ?? null,
      usernameOrEmail: cleanUsernameOrEmail,
      fullName: cleanFullName,
      contactPhone: cleanPhone,
      contactEmail: cleanEmail,
      reason: cleanReason,
      evidenceUrl: null,
    });

    // Notify Telegram asynchronously in background (don't block user response)
    notifyAccountRecoveryRequest({
      id,
      usernameOrEmail: cleanUsernameOrEmail,
      fullName: cleanFullName,
      contactPhone: cleanPhone,
      contactEmail: cleanEmail || undefined,
      reason: cleanReason,
    }).catch((err) => {
      logger.warn({ err: err?.message }, 'Failed to send Telegram notification for recovery request');
    });

    res.status(201).json({
      success: true,
      message: 'Yêu cầu cứu trợ đã được tiếp nhận thành công. Đội ngũ quản trị viên sẽ liên hệ và xử lý cho bạn trong thời gian sớm nhất.',
      data: { id },
    });
  } catch (err) { next(err); }
});


export default router;

