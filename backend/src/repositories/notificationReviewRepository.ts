import { getDb } from '../config/database.js';
import type { NotificationRecord, Review } from '../models/index.js';

export function createNotification(
  userId: number,
  orderId: number | null,
  type: string,
  title: string,
  content: string | null
): NotificationRecord {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO notifications (user_id, order_id, type, title, content, is_read, read_at, created_at)
       VALUES (?, ?, ?, ?, ?, 0, NULL, datetime('now'))`
    )
    .run(userId, orderId ?? null, type, title, content ?? null);
  const row = db
    .prepare('SELECT * FROM notifications WHERE id = ?')
    .get(result.lastInsertRowid) as NotificationRecord;
  return row;
}

export function getNotificationsByUser(
  userId: number,
  opts?: { unreadOnly?: boolean; limit?: number; offset?: number }
): NotificationRecord[] {
  const db = getDb();
  let sql = `SELECT * FROM notifications WHERE user_id = ?`;
  const params: (string | number)[] = [userId];
  if (opts?.unreadOnly) {
    sql += ` AND is_read = 0`;
  }
  sql += ` ORDER BY created_at DESC`;
  if (opts?.limit) {
    sql += ` LIMIT ?`;
    params.push(opts.limit);
  }
  if (opts?.offset) {
    sql += ` OFFSET ?`;
    params.push(opts.offset);
  }
  return db.prepare(sql).all(...params) as NotificationRecord[];
}

export function markNotificationRead(notificationId: number, userId: number): void {
  const db = getDb();
  db.prepare(
    `UPDATE notifications SET is_read = 1, read_at = datetime('now') WHERE id = ? AND user_id = ?`
  ).run(notificationId, userId);
}

export function getUnreadNotificationCount(userId: number): number {
  const row = getDb()
    .prepare(`SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND is_read = 0`)
    .get(userId) as { c: number };
  return row.c;
}

export function createReview(
  orderId: number,
  customerId: number,
  technicianId: number | null,
  rating: number,
  content: string
): Review {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO reviews (order_id, customer_id, technician_id, rating, content, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`
    )
    .run(orderId, customerId, technicianId ?? null, rating, content);
  const row = db
    .prepare('SELECT * FROM reviews WHERE id = ?')
    .get(result.lastInsertRowid) as Review;
  return row;
}

export function getReviewsByCustomer(customerId: number): Array<{
  id: number;
  order_id: number;
  rating: number;
  content: string;
  created_at: string;
  order_code: string;
  package_name: string;
  technician_name: string | null;
}> {
  return getDb()
    .prepare(
      `SELECT r.*, o.code AS order_code, p.name AS package_name, u.name AS technician_name
       FROM reviews r
       JOIN orders o ON o.id = r.order_id
       JOIN service_packages p ON p.id = o.package_id
       LEFT JOIN users u ON u.id = r.technician_id
       WHERE r.customer_id = ?
       ORDER BY r.created_at DESC`
    )
    .all(customerId) as Array<{
    id: number;
    order_id: number;
    rating: number;
    content: string;
    created_at: string;
    order_code: string;
    package_name: string;
    technician_name: string | null;
  }>;
}

export function getReviewsByTechnician(technicianId: number): Array<{
  id: number;
  order_id: number;
  rating: number;
  content: string;
  created_at: string;
  order_code: string;
  package_name: string;
  customer_name: string;
}> {
  return getDb()
    .prepare(
      `SELECT r.*, o.code AS order_code, p.name AS package_name, u.name AS customer_name
       FROM reviews r
       JOIN orders o ON o.id = r.order_id
       JOIN service_packages p ON p.id = o.package_id
       JOIN users u ON u.id = o.customer_id
       WHERE r.technician_id = ?
       ORDER BY r.created_at DESC`
    )
    .all(technicianId) as Array<{
    id: number;
    order_id: number;
    rating: number;
    content: string;
    created_at: string;
    order_code: string;
    package_name: string;
    customer_name: string;
  }>;
}

export function getReviewByOrder(orderId: number): Review | undefined {
  return getDb()
    .prepare('SELECT * FROM reviews WHERE order_id = ?')
    .get(orderId) as Review | undefined;
}

export function getPublicRecentReviews(limit = 10, offset = 0): Array<{
  id: number;
  order_id: number;
  rating: number;
  content: string;
  created_at: string;
  order_code: string;
  package_name: string;
  customer_name: string;
  technician_name: string | null;
}> {
  return getDb()
    .prepare(
      `SELECT r.*, o.code AS order_code, p.name AS package_name,
              c.name AS customer_name, t.name AS technician_name
       FROM reviews r
       JOIN orders o ON o.id = r.order_id
       JOIN service_packages p ON p.id = o.package_id
       LEFT JOIN users c ON c.id = r.customer_id
       LEFT JOIN users t ON t.id = r.technician_id
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(limit, offset) as Array<{
    id: number;
    order_id: number;
    rating: number;
    content: string;
    created_at: string;
    order_code: string;
    package_name: string;
    customer_name: string;
    technician_name: string | null;
  }>;
}