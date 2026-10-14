import { Request, Response } from 'express';
import { getDb } from '../config/database.js';
import logger from '../utils/logger.js';

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

function formatDate(dateInput?: string | null): string {
  if (!dateInput) return new Date().toISOString().split('T')[0];
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
    return d.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

interface TechRow {
  id: number;
  name: string;
  avatar_url: string | null;
  alias: string | null;
  updated_at: string | null;
}

export function handleSitemapXml(req: Request, res: Response): void {
  try {
    const host = req.get('host') || 'itsupporter.io.vn';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'https';
    // Always prefer official domain or protocol
    const baseUrl = host.includes('localhost') || host.includes('127.0.0.1')
      ? `${req.protocol}://${host}`
      : `https://${host}`;

    const today = new Date().toISOString().split('T')[0];

    const staticRoutes = [
      {
        path: '/',
        changefreq: 'daily',
        priority: '1.0',
        lastmod: today,
        images: [
          {
            loc: `${baseUrl}/logo_bo3goc.png`,
            title: 'IT Supporter HaUI - Dịch vụ bảo dưỡng máy tính sinh viên',
            caption: 'Phòng 1603 Tòa A1, ĐH Công nghiệp Hà Nội'
          }
        ]
      },
      {
        path: '/services',
        changefreq: 'weekly',
        priority: '0.9',
        lastmod: today,
      },
      {
        path: '/booking',
        changefreq: 'weekly',
        priority: '0.9',
        lastmod: today,
      },
      {
        path: '/public-orders',
        changefreq: 'hourly',
        priority: '0.8',
        lastmod: today,
      },
      {
        path: '/about',
        changefreq: 'monthly',
        priority: '0.8',
        lastmod: today,
      },
      {
        path: '/terms',
        changefreq: 'monthly',
        priority: '0.7',
        lastmod: today,
      },
      {
        path: '/account-recovery',
        changefreq: 'monthly',
        priority: '0.6',
        lastmod: today,
      },
      {
        path: '/login',
        changefreq: 'monthly',
        priority: '0.5',
        lastmod: today,
      },
      {
        path: '/register',
        changefreq: 'monthly',
        priority: '0.5',
        lastmod: today,
      },
    ];

    const db = getDb();
    const technicians = db.prepare(`
      SELECT u.id, u.name, u.avatar_url, p.alias, u.updated_at
      FROM users u
      LEFT JOIN technician_profiles p ON p.user_id = u.id
      WHERE u.role = 'TECHNICIAN' AND u.status = 'ACTIVE' AND u.is_deleted = 0
      ORDER BY u.id ASC
    `).all() as TechRow[];

    const dynamicRoutes = technicians.map((tech) => {
      const slug = tech.alias || tech.id;
      const images = [];
      if (tech.avatar_url) {
        const fullAvatar = tech.avatar_url.startsWith('http')
          ? tech.avatar_url
          : `${baseUrl}${tech.avatar_url.startsWith('/') ? '' : '/'}${tech.avatar_url}`;
        images.push({
          loc: fullAvatar,
          title: `${escapeXml(tech.name)} - Kỹ thuật viên IT Supporter HaUI`,
          caption: `Hồ sơ kỹ thuật viên ${escapeXml(tech.name)} tại P.1603 A1 HaUI`
        });
      }

      return {
        path: `/ktv/${encodeURIComponent(slug)}`,
        changefreq: 'weekly',
        priority: '0.8',
        lastmod: formatDate(tech.updated_at),
        images
      };
    });

    const allRoutes = [...staticRoutes, ...dynamicRoutes];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
    xml += `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

    for (const r of allRoutes) {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}${r.path}</loc>\n`;
      xml += `    <lastmod>${r.lastmod}</lastmod>\n`;
      xml += `    <changefreq>${r.changefreq}</changefreq>\n`;
      xml += `    <priority>${r.priority}</priority>\n`;
      if (r.images && r.images.length > 0) {
        for (const img of r.images) {
          xml += `    <image:image>\n`;
          xml += `      <image:loc>${escapeXml(img.loc)}</image:loc>\n`;
          if (img.title) {
            xml += `      <image:title>${escapeXml(img.title)}</image:title>\n`;
          }
          if (img.caption) {
            xml += `      <image:caption>${escapeXml(img.caption)}</image:caption>\n`;
          }
          xml += `    </image:image>\n`;
        }
      }
      xml += `  </url>\n`;
    }

    xml += `</urlset>\n`;

    res.removeHeader('Content-Security-Policy');
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=14400');
    res.send(xml);
  } catch (err) {
    logger.error({ err }, 'Error generating dynamic sitemap.xml');
    res.status(500).type('text/plain').send('Error generating sitemap');
  }
}
