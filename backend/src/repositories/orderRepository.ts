import { getDb } from '../config/database.js';
import type { Order, OrderRow } from '../models/index.js';

export interface ListOrdersOptions {
  page?: number;
  limit?: number;
  customerId?: number;
  technicianId?: number;
  status?: string | null;
  paymentStatus?: string | null;
  completionResult?: string | null;
  packageId?: number;
  fromDate?: string;
  toDate?: string;
  q?: string;
  includeUnreadFor?: number;
}

const BASE_SELECT = `
  SELECT o.*,
         c.name AS customer_name,
         c.phone AS customer_phone,
         c.email AS customer_email,
         c.contact_info AS customer_contact_info,
         p.name AS package_name,
         t.name AS technician_name,
         t.email AS technician_email,
         t.avatar_url AS technician_avatar,
         u.name AS actor_name
  FROM orders o
  LEFT JOIN users c ON c.id = o.customer_id
  LEFT JOIN users t ON t.id = o.technician_id
  LEFT JOIN service_packages p ON p.id = o.package_id
`;

export function findOrderById(id: number): (OrderRow & { actor_name: string }) | undefined {
  return getDb().prepare(`${BASE_SELECT} WHERE o.id = ?`).get(id) as
    | (OrderRow & { actor_name: string })
    | undefined;
}

export function listOrders(opts: ListOrdersOptions): { data: OrderRow[]; total: number } {
  const db = getDb();
  const page = opts.page ?? 1;
  const limit = Math.min(opts.limit ?? 10, 10);
  const offset = (page - 1) * limit;

  const where: string[] = [];
  const params: unknown[] = [];

  if (opts.customerId) {
    where.push('o.customer_id = ?');
    params.push(opts.customerId);
  }
  if (opts.technicianId) {
    where.push('o.technician_id = ?');
    params.push(opts.technicianId);
  }
  if (opts.status) {
    where.push('o.status = ?');
    params.push(opts.status);
  }
  if (opts.paymentStatus) {
    where.push('o.payment_status = ?');
    params.push(opts.paymentStatus);
  }
  if (opts.completionResult) {
    where.push('o.completion_result = ?');
    params.push(opts.completionResult);
  }
  if (opts.packageId) {
    where.push('o.package_id = ?');
    params.push(opts.packageId);
  }
  if (opts.fromDate) {
    where.push('o.created_at >= ?');
    params.push(opts.fromDate);
  }
  if (opts.toDate) {
    where.push('o.created_at <= ?');
    params.push(opts.toDate);
  }
  if (opts.q) {
    where.push('(o.code LIKE ? OR c.name LIKE ? OR p.name LIKE ?)');
    const like = `%${opts.q}%`;
    params.push(like, like, like);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const total = (
    db.prepare(`SELECT COUNT(*) AS c FROM orders o ${whereSql}`).get(...params) as { c: number }
  ).c;

  let unreadSub = `0 AS has_unread, NULL AS last_message_at`;
  if (opts.includeUnreadFor) {
    unreadSub = `(
      (SELECT COUNT(*) FROM order_messages om
        WHERE om.order_id = o.id AND om.sender_id != ?
          AND (om.read_at IS NULL OR om.read_at = '')
      ) > 0
    ) AS has_unread,
    (SELECT MAX(om2.created_at) FROM order_messages om2 WHERE om2.order_id = o.id) AS last_message_at`;
    params.push(opts.includeUnreadFor);
  }

  const sql = `SELECT o.*,
                      c.name AS customer_name,
                      c.phone AS customer_phone,
                      c.email AS customer_email,
                      c.contact_info AS customer_contact_info,
                      p.name AS package_name,
                      t.name AS technician_name,
                      t.email AS technician_email,
                      t.avatar_url AS technician_avatar,
                      ${unreadSub}
               FROM orders o
               LEFT JOIN users c ON c.id = o.customer_id
               LEFT JOIN users t ON t.id = o.technician_id
               LEFT JOIN service_packages p ON p.id = o.package_id
               ${whereSql}
               ORDER BY o.scheduled_date DESC, o.scheduled_start DESC, o.id DESC
               LIMIT ? OFFSET ?`;

  const data = db.prepare(sql).all(...params, limit, offset) as OrderRow[];
  return { data, total };
}

export function createOrderRow(input: Omit<Order, 'id' | 'code' | 'created_at' | 'updated_at'> & { code?: string }): number {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO orders (
         code, customer_id, technician_id, package_id, scheduled_date, scheduled_start, scheduled_end,
         location, note, price, penalty, discount, extend_fee, final_amount, status, payment_status
       ) VALUES (
         @code, @customer_id, @technician_id, @package_id, @scheduled_date, @scheduled_start, @scheduled_end,
         @location, @note, @price, @penalty, @discount, @extend_fee, @final_amount, @status, @payment_status
       )`
    )
    .run({
      code: input.code ?? Date.now().toString(),
      customer_id: input.customer_id,
      technician_id: input.technician_id,
      package_id: input.package_id,
      scheduled_date: input.scheduled_date,
      scheduled_start: input.scheduled_start,
      scheduled_end: input.scheduled_end,
      location: input.location,
      note: input.note,
      price: input.price,
      penalty: input.penalty,
      discount: input.discount,
      extend_fee: input.extend_fee,
      final_amount: input.final_amount,
      status: input.status,
      payment_status: input.payment_status,
    });
  return Number(result.lastInsertRowid);
}

export function updateOrder(
  id: number,
  patch: Partial<Pick<Order, 'status' | 'completion_result' | 'payment_status' | 'unpaid_reason' | 'started_at' | 'completed_at' | 'penalty' | 'extend_fee' | 'final_amount' | 'scheduled_date' | 'scheduled_start' | 'scheduled_end' | 'technician_id'>>
): void {
  const db = getDb();
  const cur = findOrderById(id) as Order | undefined;
  if (!cur) return;
  const merged = { ...cur, ...patch };
  db.prepare(
    `UPDATE orders SET
       status = ?, completion_result = ?, payment_status = ?, unpaid_reason = ?,
       started_at = ?, completed_at = ?, penalty = ?, extend_fee = ?, final_amount = ?,
       scheduled_date = ?, scheduled_start = ?, scheduled_end = ?, technician_id = ?,
       updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    merged.status,
    merged.completion_result,
    merged.payment_status,
    merged.unpaid_reason,
    merged.started_at,
    merged.completed_at,
    merged.penalty,
    merged.extend_fee,
    merged.final_amount,
    merged.scheduled_date,
    merged.scheduled_start,
    merged.scheduled_end,
    merged.technician_id,
    id
  );
}

export function logStatusChange(
  orderId: number,
  fromStatus: string | null,
  toStatus: string,
  actorId: number | null,
  note?: string | null
): void {
  getDb()
    .prepare(
      `INSERT INTO order_status_history (order_id, from_status, to_status, actor_id, note)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(orderId, fromStatus, toStatus, actorId, note ?? null);
}

export function getOrderTimeline(orderId: number): Array<{
  from_status: string | null;
  to_status: string;
  actor_id: number | null;
  actor_name: string | null;
  note: string | null;
  created_at: string;
}> {
  return getDb()
    .prepare(
      `SELECT h.from_status, h.to_status, h.actor_id, u.name AS actor_name, h.note, h.created_at
       FROM order_status_history h
       LEFT JOIN users u ON u.id = h.actor_id
       WHERE h.order_id = ?
       ORDER BY h.created_at ASC, h.id ASC`
    )
    .all(orderId) as Array<{
    from_status: string | null;
    to_status: string;
    actor_id: number | null;
    actor_name: string | null;
    note: string | null;
    created_at: string;
  }>;
}

export function getAggregatedStats(customerId: number): Record<string, number> {
  const rows = getDb()
    .prepare(
      `SELECT status, completion_result, COUNT(*) AS c
       FROM orders WHERE customer_id = ? GROUP BY status, completion_result`
    )
    .all(customerId) as Array<{ status: string; completion_result: string | null; c: number }>;
  const stats: Record<string, number> = {};
  for (const r of rows) {
    const key = r.status + (r.completion_result ? `:${r.completion_result}` : '');
    stats[key] = r.c;
  }
  return stats;
}