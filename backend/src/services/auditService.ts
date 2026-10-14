import { getDb } from '../config/database.js';
import type { AuditLog } from '../models/index.js';

interface AuditInput {
  actorId?: number | null;
  actorEmail?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | number | null;
  ip?: string | null;
  result?: 'SUCCESS' | 'FAILED';
  metadata?: Record<string, unknown> | null;
}

export function writeAuditLog(input: AuditInput): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO audit_logs (actor_id, actor_email, action, target_type, target_id, ip, result, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    input.actorId ?? null,
    input.actorEmail ?? null,
    input.action,
    input.targetType ?? null,
    input.targetId != null ? String(input.targetId) : null,
    input.ip ?? null,
    input.result ?? 'SUCCESS',
    input.metadata ? JSON.stringify(input.metadata) : null
  );
}

export interface EnrichedAuditLog extends AuditLog {
  actor_name?: string | null;
  actor_avatar?: string | null;
  actor_role?: string | null;
}

export function queryAuditLogs(
  options: {
    limit?: number;
    offset?: number;
    action?: string;
    targetType?: string;
    targetId?: string;
    actorId?: number;
    search?: string;
  } = {}
): { data: EnrichedAuditLog[]; total: number } {
  const db = getDb();
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
  const offset = Math.max(options.offset ?? 0, 0);

  const where: string[] = [];
  const params: unknown[] = [];

  if (options.action) {
    where.push('a.action = ?');
    params.push(options.action);
  }
  if (options.targetType) {
    where.push('a.target_type = ?');
    params.push(options.targetType);
  }
  if (options.targetId) {
    where.push('a.target_id = ?');
    params.push(options.targetId);
  }
  if (options.actorId) {
    where.push('a.actor_id = ?');
    params.push(options.actorId);
  }
  if (options.search) {
    const q = `%${options.search.trim()}%`;
    where.push('(a.actor_email LIKE ? OR a.action LIKE ? OR a.target_id LIKE ? OR a.target_type LIKE ? OR u.name LIKE ?)');
    params.push(q, q, q, q, q);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const total = (
    db.prepare(`
      SELECT COUNT(*) AS c 
      FROM audit_logs a 
      LEFT JOIN users u ON u.id = a.actor_id 
      ${whereSql}
    `).get(...params) as { c: number }
  ).c;

  const data = db
    .prepare(`
      SELECT a.*, u.name AS actor_name, u.avatar_url AS actor_avatar, u.role AS actor_role 
      FROM audit_logs a 
      LEFT JOIN users u ON u.id = a.actor_id 
      ${whereSql} 
      ORDER BY a.created_at DESC, a.id DESC 
      LIMIT ? OFFSET ?
    `)
    .all(...params, limit, offset) as EnrichedAuditLog[];

  return { data, total };
}