import { getDb } from '../config/database.js';
import type { OrderMessage } from '../models/index.js';

export function createOrderMessage(
  orderId: number,
  senderId: number,
  message: string,
  messageType: 'text' | 'voucher' = 'text',
  voucherId: number | null = null
): OrderMessage {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO order_messages (order_id, sender_id, message, message_type, voucher_id, read_at, created_at)
       VALUES (?, ?, ?, ?, ?, NULL, datetime('now'))`
    )
    .run(orderId, senderId, message, messageType, voucherId);
  const row = db
    .prepare(`
      SELECT om.*,
             u.name AS sender_name,
             u.avatar_url AS sender_avatar,
             v.code AS voucher_code,
             v.status AS voucher_status,
             vp.name AS voucher_name,
             vp.discount_type AS voucher_discount_type,
             vp.discount_value AS voucher_discount_value,
             vp.valid_to AS voucher_valid_to
      FROM order_messages om
      LEFT JOIN users u ON u.id = om.sender_id
      LEFT JOIN vouchers v ON v.id = om.voucher_id
      LEFT JOIN voucher_programs vp ON vp.id = v.program_id
      WHERE om.id = ?
    `)
    .get(result.lastInsertRowid) as OrderMessage;
  return row;
}

export function getOrderMessages(
  orderId: number
): OrderMessage[] {
  return getDb()
    .prepare(
      `SELECT om.*,
              u.name AS sender_name,
              u.avatar_url AS sender_avatar,
              v.code AS voucher_code,
              v.status AS voucher_status,
              vp.name AS voucher_name,
              vp.discount_type AS voucher_discount_type,
              vp.discount_value AS voucher_discount_value,
              vp.valid_to AS voucher_valid_to
       FROM order_messages om
       LEFT JOIN users u ON u.id = om.sender_id
       LEFT JOIN vouchers v ON v.id = om.voucher_id
       LEFT JOIN voucher_programs vp ON vp.id = v.program_id
       WHERE om.order_id = ?
       ORDER BY om.created_at ASC`
    )
    .all(orderId) as OrderMessage[];
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