import fs from 'node:fs';
import path from 'node:path';
import { Request, Response } from 'express';
import { getDb } from '../config/database.js';
import logger from '../utils/logger.js';

function escapeXml(unsafe: string): string {
  return String(unsafe || '').replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&#39;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

/**
 * Phục vụ HTML trang cá nhân KTV với Open Graph meta tags được inject động từ Server
 * Hỗ trợ Facebook Scraper, Zalo Bot, Telegram Scraper, Googlebot và trình duyệt người dùng
 */
export function handleTechnicianPublicHtml(req: Request, res: Response): void {
  try {
    const aliasOrId = String(req.params.aliasOrId || '').trim();
    if (!aliasOrId) {
      res.redirect('/');
      return;
    }

    const isNumeric = /^\d+$/.test(aliasOrId);
    const db = getDb();

    const query = `
      SELECT u.id, u.name, u.avatar_url, p.bio, p.alias,
             ROUND(COALESCE(AVG(r.rating), 5.0), 1) AS rating,
             COUNT(DISTINCT r.id) AS rating_count,
             (SELECT COUNT(*) FROM orders o WHERE o.technician_id = u.id AND o.status = 'COMPLETED') AS completed_orders_count
      FROM users u
      LEFT JOIN technician_profiles p ON p.user_id = u.id
      LEFT JOIN reviews r ON r.technician_id = u.id
      WHERE u.role = 'TECHNICIAN' AND u.status = 'ACTIVE' AND u.is_deleted = 0
        AND (${isNumeric ? 'u.id = ? OR LOWER(p.alias) = LOWER(?)' : 'LOWER(p.alias) = LOWER(?) OR LOWER(u.name) = LOWER(?) OR LOWER(substr(u.email, 1, instr(u.email, "@") - 1)) = LOWER(?)'})
      GROUP BY u.id
      LIMIT 1
    `;
    const params = isNumeric ? [Number(aliasOrId), aliasOrId] : [aliasOrId, aliasOrId, aliasOrId];
    const tech = db.prepare(query).get(...params) as any;

    // Tìm file frontend/dist/index.html trong các môi trường khác nhau
    const candidates = [
      path.resolve(process.cwd(), '../frontend/dist/index.html'),
      path.resolve(process.cwd(), 'frontend/dist/index.html'),
      path.resolve(process.cwd(), 'dist/index.html'),
      '/var/www/itsupporter/frontend/dist/index.html',
    ];
    const htmlPath = candidates.find((p) => fs.existsSync(p));
    let html = htmlPath ? fs.readFileSync(htmlPath, 'utf-8') : '';

    if (!html) {
      html = `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><title>IT Supporter HaUI</title></head><body><div id="root"></div></body></html>`;
    }

    if (tech) {
      const name = escapeXml(tech.name || 'Kỹ thuật viên IT Supporter');
      const title = `${name} | Kỹ thuật viên IT Supporter HaUI`;
      const rawBio = tech.bio || 'Hồ sơ kỹ thuật viên dịch vụ vệ sinh, bảo dưỡng phần cứng PC/Laptop tại ĐH Công nghiệp Hà Nội (Phòng 1603, Tòa A1). Quy trình minh bạch, an tâm tuyệt đối.';
      const desc = escapeXml(rawBio.length > 200 ? rawBio.slice(0, 197) + '...' : rawBio);

      const host = req.get('host') || 'itsupporter.io.vn';
      const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
      const baseUrl = `${protocol}://${host}`;
      const ogUrl = `${baseUrl}/ktv/${encodeURIComponent(aliasOrId)}`;
      const ogImageUrl = `${baseUrl}/api/public/ktv/${encodeURIComponent(aliasOrId)}/og-image`;

      // 1. Thay thế Document Title
      html = html.replace(/<title>.*?<\/title>/i, `<title>${title}</title>`);

      // 2. Thay thế Meta Description
      if (/<meta\s+name="description"\s+content=".*?"/i.test(html)) {
        html = html.replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/i, `<meta name="description" content="${desc}" />`);
      }

      // 3. Thay thế og:title
      if (/<meta\s+property="og:title"\s+content=".*?"/i.test(html)) {
        html = html.replace(/<meta\s+property="og:title"\s+content=".*?"\s*\/?>/i, `<meta property="og:title" content="${title}" />`);
      }

      // 4. Thay thế og:description
      if (/<meta\s+property="og:description"\s+content=".*?"/i.test(html)) {
        html = html.replace(/<meta\s+property="og:description"\s+content=".*?"\s*\/?>/i, `<meta property="og:description" content="${desc}" />`);
      }

      // 5. Thay thế toàn bộ cụm og:image bằng ảnh card 1200x630 động (Left Avatar, Right KTV info)
      const ogImageTags = `<meta property="og:image" content="${ogImageUrl}" />\n    <meta property="og:image:secure_url" content="${ogImageUrl}" />\n    <meta property="og:image:width" content="1200" />\n    <meta property="og:image:height" content="630" />\n    <meta property="og:image:type" content="image/png" />`;
      html = html.replace(/(<meta\s+property="og:image(?::[a-z_]+)?"\s+content=".*?"\s*\/?>\s*)+/i, `${ogImageTags}\n    `);

      // 6. Thay thế hoặc chèn og:url
      if (/<meta\s+property="og:url"\s+content=".*?"/i.test(html)) {
        html = html.replace(/<meta\s+property="og:url"\s+content=".*?"\s*\/?>/i, `<meta property="og:url" content="${ogUrl}" />`);
      } else {
        html = html.replace(/<\/head>/i, `    <meta property="og:url" content="${ogUrl}" />\n  </head>`);
      }

      // 7. Twitter Card tags
      if (/<meta\s+name="twitter:title"\s+content=".*?"/i.test(html)) {
        html = html.replace(/<meta\s+name="twitter:title"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:title" content="${title}" />`);
      }
      if (/<meta\s+name="twitter:description"\s+content=".*?"/i.test(html)) {
        html = html.replace(/<meta\s+name="twitter:description"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:description" content="${desc}" />`);
      }
      if (/<meta\s+name="twitter:image"\s+content=".*?"/i.test(html)) {
        html = html.replace(/<meta\s+name="twitter:image"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:image" content="${ogImageUrl}" />`);
      }
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
    res.send(html);
  } catch (err) {
    logger.error({ err }, 'Error handling technician public HTML');
    res.status(500).send('Internal Server Error');
  }
}
