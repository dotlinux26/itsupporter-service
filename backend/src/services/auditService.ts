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

export function queryAuditLogs(
  options: { limit?: number; offset?: number; action?: string; targetId?: string; actorId?: number } = {}
): { data: AuditLog[]; total: number } {
  const db = getDb();
  const limit = Math.min(options.limit ?? 10, 50);
  const offset = options.offset ?? 0;

  const where: string[] = [];
  const params: unknown[] = [];

  if (options.action) {
    where.push('action = ?');
    params.push(options.action);
  }
  if (options.targetId) {
    where.push('target_id = ?');
    params.push(options.targetId);
  }
  if (options.actorId) {
    where.push('actor_id = ?');
    params.push(options.actorId);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const total = (
    db.prepare(`SELECT COUNT(*) AS c FROM audit_logs ${whereSql}`).get(...params) as { c: number }
  ).c;

  const data = db
    .prepare(`SELECT * FROM audit_logs ${whereSql} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`)
    .all(...params, limit, offset) as AuditLog[];

  return { data, total };
}