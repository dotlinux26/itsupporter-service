import { getDb } from '../config/database.js';
import type { OrderMessage } from '../models/index.js';

export function createOrderMessage(
  orderId: number,
  senderId: number,
  message: string
): OrderMessage {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO order_messages (order_id, sender_id, message, read_at, created_at)
       VALUES (?, ?, ?, NULL, datetime('now'))`
    )
    .run(orderId, senderId, message);
  const row = db
    .prepare('SELECT * FROM order_messages WHERE id = ?')
    .get(result.lastInsertRowid) as OrderMessage;
  return row;
}

export function getOrderMessages(
  orderId: number
): Array<OrderMessage & { sender_name: string }> {
  return getDb()
    .prepare(
      `SELECT om.*, u.name AS sender_name
       FROM order_messages om
       LEFT JOIN users u ON u.id = om.sender_id
       WHERE om.order_id = ?
       ORDER BY om.created_at ASC`
    )
    .all(orderId) as Array<OrderMessage & { sender_name: string }>;
}

export function markOrderMessagesRead(orderId: number, userId: number): void {
  const db = getDb();
  db.prepare(
    `UPDATE order_messages
     SET read_at = datetime('now')
     WHERE order_id = ? AND sender_id != ? AND (read_at IS NULL OR read_at = '')`
  ).run(orderId, userId);
}

export function getUnreadCountForOrder(orderId: number, userId: number): number {
  const row = getDb()
    .prepare(
      `SELECT COUNT(*) AS c
       FROM order_messages
       WHERE order_id = ? AND sender_id != ? AND (read_at IS NULL OR read_at = '')`
    )
    .get(orderId) as { c: number };
  return row.c;
}