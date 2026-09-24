import { getDb } from '../config/database.js';
import type { FinancialTransaction, FinancialTransactionType, Order, Settlement } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { getSystemSettings } from './settingsService.js';

export type LedgerDirection = 'IN' | 'OUT';

export interface LedgerEntryInput {
  type: FinancialTransactionType;
  amount: number;
  technicianId?: number | null;
  orderId?: number | null;
  referenceId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdBy?: number | null;
}

/**
 * CỐT LÕI TÀI CHÍNH — "BALANCE IS A RESULT, LEDGER IS THE SOURCE OF TRUTH".
 *
 * Mọi thay đổi tiền phải ghi vào bảng financial_transactions như một ledger
 * entry bất biến. Cột balance trong users/orders chỉ là cached kết quả tính từ
 * ledger. Không bao giờ UPDATE balance trực tiếp.
 */
export function insertLedgerEntry(input: LedgerEntryInput): number {
  const db = getDb();
  const direction: LedgerDirection =
    input.type === 'ORDER_REVENUE' ||
    input.type === 'TECHNICIAN_SHARE' ||
    input.type === 'TEAM_SHARE' ||
    input.type === 'EXTEND_FEE'
      ? 'IN'
      : 'OUT';

  const result = db
    .prepare(
      `INSERT INTO financial_transactions
         (transaction_code, order_id, technician_id, type, amount, direction, reference_id, metadata, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      makeTransactionCode(input.type),
      input.orderId ?? null,
      input.technicianId ?? null,
      input.type,
      input.amount,
      direction,
      input.referenceId ?? null,
      input.metadata ? JSON.stringify(input.metadata) : null,
      input.createdBy ?? null
    );
  return Number(result.lastInsertRowid);
}

function makeTransactionCode(_kind: FinancialTransactionType): string {
  return `LEDGER-${Date.now() % 100000000}-${Math.floor(Math.random() * 1000)}`;
}

export interface FinancialLedgerEntry extends FinancialTransaction {
  technician_name?: string | null;
}

export function getLedger(options: {
  technicianId?: number;
  orderId?: number;
  from?: string;
  to?: string;
  type?: FinancialTransactionType;
  page?: number;
  limit?: number;
}): { data: FinancialLedgerEntry[]; total: number } {
  const db = getDb();
  const page = options.page ?? 1;
  const limit = Math.min(options.limit ?? 10, 50);
  const offset = (page - 1) * limit;

  const where: string[] = [];
  const params: unknown[] = [];
  if (options.technicianId) {
    where.push('ft.technician_id = ?');
    params.push(options.technicianId);
  }
  if (options.orderId) {
    where.push('ft.order_id = ?');
    params.push(options.orderId);
  }
  if (options.from) {
    where.push('ft.created_at >= ?');
    params.push(options.from);
  }
  if (options.to) {
    where.push('ft.created_at <= ?');
    params.push(options.to);
  }
  if (options.type) {
    where.push('ft.type = ?');
    params.push(options.type);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const total = (
    db.prepare(`SELECT COUNT(*) AS c FROM financial_transactions ft ${whereSql}`).get(...params) as { c: number }
  ).c;
  const data = db
    .prepare(
      `SELECT ft.*, u.name AS technician_name
       FROM financial_transactions ft
       LEFT JOIN users u ON u.id = ft.technician_id
       ${whereSql}
       ORDER BY ft.created_at DESC, ft.id DESC LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset) as FinancialLedgerEntry[];

  return { data, total };
}

export function getRunBalance(technicianId: number): number {
  const row = getDb()
    .prepare(
      `SELECT COALESCE(SUM(CASE WHEN direction = 'IN' THEN amount ELSE -amount END), 0) AS balance
       FROM financial_transactions WHERE technician_id = ?`
    )
    .get(technicianId) as { balance: number };
  return row.balance;
}

export function getTeamBalance(): number {
  const row = getDb()
    .prepare(
      `SELECT COALESCE(SUM(CASE WHEN direction = 'IN' THEN amount ELSE -amount END), 0) AS balance
       FROM financial_transactions 
       WHERE (technician_id IS NULL OR technician_id = 0) AND type != 'ORDER_REVENUE'`
    )
    .get() as { balance: number };
  return row.balance;
}

/** Khi đóng order thành công — ghi ledger theo ledger-first. */
export function settleOrderLedger(order: Order, createdBy: number): void {
  const settings = getSystemSettings();
  const techPercent = settings.technicianSharePercent / 100;
  const base = order.price - order.penalty;
  const techShare = Math.round(base * techPercent);
  const teamShare = base - techShare;
  const finalAmount = order.final_amount;

  // 1. Tổng doanh thu công ty
  insertLedgerEntry({
    type: 'ORDER_REVENUE',
    amount: finalAmount,
    orderId: order.id,
    technicianId: null,
    referenceId: order.code,
    metadata: { base },
    createdBy,
  });

  // 2. Fines / phạt
  if (order.penalty > 0 && order.technician_id != null) {
    insertLedgerEntry({
      type: 'LATE_PENALTY',
      amount: order.penalty,
      orderId: order.id,
      technicianId: order.technician_id,
      referenceId: order.code,
      metadata: { penalty: order.penalty, base },
      createdBy,
    });
  }

  // 3. Technician share
  if (techShare > 0 && order.technician_id != null) {
    insertLedgerEntry({
      type: 'TECHNICIAN_SHARE',
      amount: techShare,
      orderId: order.id,
      technicianId: order.technician_id,
      referenceId: order.code,
      metadata: { base, percent: settings.technicianSharePercent },
      createdBy,
    });
  }

  // 4. Team share
  if (teamShare > 0) {
    insertLedgerEntry({
      type: 'TEAM_SHARE',
      amount: teamShare,
      orderId: order.id,
      technicianId: null,
      referenceId: order.code,
      metadata: { base, percent: settings.teamSharePercent },
      createdBy,
    });
  }

  // 5. Extend fee (100% technician)
  if (order.extend_fee > 0 && order.technician_id != null) {
    insertLedgerEntry({
      type: 'EXTEND_FEE',
      amount: order.extend_fee,
      orderId: order.id,
      technicianId: order.technician_id,
      referenceId: order.code,
      metadata: { reason: 'extend/extra' },
      createdBy,
    });
  }
}

export function createSettlement(technicianId: number, managerId: number, notes?: string): Settlement {
  const db = getDb();
  const balance = getRunBalance(technicianId);
  if (balance <= 0) {
    throw new AppError('PRE_CONDITION_FAILED', 'Số dư kỹ thuật viên không đủ điều kiện kết toán.', 400);
  }

  const result = db
    .prepare(
      `INSERT INTO settlements (settlement_code, technician_id, manager_id, amount, balance_before, balance_after, notes)
       VALUES (?, ?, ?, ?, ?, 0, ?)`
    )
    .run(
      `SETTLE-${Date.now() % 1000000}`,
      technicianId,
      managerId,
      balance,
      balance,
      notes ?? null
    );
  const id = Number(result.lastInsertRowid);

  // Kết toán bắt buộc tạo ledger entry để giữ lịch sử (tuyệt đối không UPDATE users.balance).
  insertLedgerEntry({
    type: 'SETTLEMENT',
    amount: balance,
    orderId: null,
    technicianId,
    referenceId: `SETTLE-${Date.now() % 1000000}`,
    metadata: { notes: notes ?? null },
    createdBy: managerId,
  });

  return db.prepare('SELECT * FROM settlements WHERE id = ?').get(id) as Settlement;
}

export function listSettlements(options: {
  technicianId?: number;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}): { data: Array<Settlement & { technician_name?: string }>; total: number } {
  const db = getDb();
  const page = options.page ?? 1;
  const limit = Math.min(options.limit ?? 10, 50);
  const offset = (page - 1) * limit;

  const where: string[] = [];
  const params: unknown[] = [];
  if (options.technicianId) {
    where.push('s.technician_id = ?');
    params.push(options.technicianId);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const total = (
    db.prepare(`SELECT COUNT(*) AS c FROM settlements s ${whereSql}`).get(...params) as { c: number }
  ).c;
  const data = db
    .prepare(
      `SELECT s.*, u.name AS technician_name
       FROM settlements s
       LEFT JOIN users u ON u.id = s.technician_id
       ${whereSql}
       ORDER BY s.created_at DESC, s.id DESC LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset) as Array<Settlement & { technician_name?: string }>;

  return { data, total };
}

/** Tổng doanh thu theo kỳ (ledger-based). */
export function getRevenueSummary(options: { from?: string; to?: string }): number {
  const db = getDb();
  const where: string[] = ['type = ?'];
  const params: unknown[] = ['ORDER_REVENUE'];
  if (options.from) {
    where.push('created_at >= ?');
    params.push(options.from);
  }
  if (options.to) {
    where.push('created_at <= ?');
    params.push(options.to);
  }
  const row = db
    .prepare(`SELECT COALESCE(SUM(amount), 0) AS s FROM financial_transactions WHERE ${where.join(' AND ')}`)
    .get(...params) as { s: number };
  return row.s;
}