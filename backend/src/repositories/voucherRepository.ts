import { getDb } from '../config/database.js';
import type { Voucher, VoucherProgram } from '../models/index.js';

interface VoucherWithProgram extends Voucher {
  program_name: string;
  program_code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
}

interface CreateVoucherInput {
  program_id: number;
  code: string;
  customer_id?: number | null;
  technician_id?: number | null;
  order_id?: number | null;
  status?: 'active' | 'used' | 'expired' | 'voided';
  assigned_at?: string | null;
  used_at?: string | null;
  expired_at?: string | null;
}

export function findVoucherById(id: number): Voucher | undefined {
  return getDb().prepare('SELECT * FROM vouchers WHERE id = ?').get(id) as Voucher | undefined;
}

export function findVoucherByCode(code: string): (Voucher & { program: VoucherProgram }) | undefined {
  return getDb().prepare(`
    SELECT v.*, vp.name as program_name, vp.code as program_code, vp.discount_type, vp.discount_value
    FROM vouchers v
    JOIN voucher_programs vp ON vp.id = v.program_id
    WHERE v.code = ?
  `).get(code) as (Voucher & { program: VoucherProgram }) | undefined;
}

export function findVouchersByCustomer(customerId: number): Voucher[] {
  return getDb().prepare(`
    SELECT v.*, vp.name as program_name, vp.code as program_code, vp.discount_type, vp.discount_value
    FROM vouchers v
    JOIN voucher_programs vp ON vp.id = v.program_id
    WHERE v.customer_id = ?
    ORDER BY v.created_at DESC
  `).all(customerId) as Voucher[];
}

export function findVouchersByTechnician(technicianId: number): Voucher[] {
  return getDb().prepare(`
    SELECT v.*, vp.name as program_name, vp.code as program_code, vp.discount_type, vp.discount_value
    FROM vouchers v
    JOIN voucher_programs vp ON vp.id = v.program_id
    WHERE v.technician_id = ?
    ORDER BY v.created_at DESC
  `).all(technicianId) as Voucher[];
}

export function findVouchersByProgram(programId: number): Voucher[] {
  return getDb().prepare('SELECT * FROM vouchers WHERE program_id = ? ORDER BY created_at DESC').all(programId) as Voucher[];
}

export function createVoucher(input: CreateVoucherInput): number {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO vouchers (
         program_id, code, customer_id, technician_id, order_id, status, assigned_at, used_at, expired_at
       ) VALUES (
         @program_id, @code, @customer_id, @technician_id, @order_id, @status, @assigned_at, @used_at, @expired_at
       )`
    )
    .run({
      program_id: input.program_id,
      code: input.code,
      customer_id: input.customer_id ?? null,
      technician_id: input.technician_id ?? null,
      order_id: input.order_id ?? null,
      status: input.status ?? 'active',
      assigned_at: input.assigned_at ?? null,
      used_at: input.used_at ?? null,
      expired_at: input.expired_at ?? null,
    });
  return Number(result.lastInsertRowid);
}

export function createVoucherTransaction(voucherId: number, orderId: number, discountAmount: number): number {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO voucher_transactions (voucher_id, order_id, discount_amount)
       VALUES (?, ?, ?)`
    )
    .run(voucherId, orderId, discountAmount);
  return Number(result.lastInsertRowid);
}

export function updateVoucherStatus(
  id: number,
  status: 'active' | 'used' | 'expired' | 'voided',
  orderId?: number
): void {
  const db = getDb();
  const now = new Date().toISOString();
  
  if (status === 'used') {
    db.prepare(
      `UPDATE vouchers SET status = ?, used_at = ?, order_id = ?, updated_at = datetime('now') WHERE id = ?`
    ).run('used', new Date().toISOString(), orderId ?? null, id);
  } else if (status === 'voided') {
    db.prepare(
      `UPDATE vouchers SET status = ?, updated_at = datetime('now') WHERE id = ?`
    ).run('voided', id);
  } else {
    db.prepare(
      `UPDATE vouchers SET status = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(status, id);
  }
}

export function getVoucherWithProgram(code: string): (Voucher & { program: VoucherProgram }) | undefined {
  return getDb().prepare(`
    SELECT v.*, vp.name as program_name, vp.code as program_code, vp.discount_type, vp.discount_value, vp.max_usage, vp.valid_from, vp.valid_to
    FROM vouchers v
    JOIN voucher_programs vp ON vp.id = v.program_id
    WHERE v.code = ?
  `).get(code) as (Voucher & { program: VoucherProgram }) | undefined;
}

export function findVoucherProgramById(id: number): VoucherProgram | undefined {
  return getDb().prepare('SELECT * FROM voucher_programs WHERE id = ?').get(id) as VoucherProgram | undefined;
}

export function findVoucherProgramByCode(code: string): VoucherProgram | undefined {
  return getDb().prepare('SELECT * FROM voucher_programs WHERE code = ?').get(code) as VoucherProgram | undefined;
}

export function listVoucherPrograms(): (VoucherProgram & { voucher_count: number })[] {
  return getDb().prepare(`
    SELECT vp.*, COUNT(v.id) as voucher_count
    FROM voucher_programs vp
    LEFT JOIN vouchers v ON v.program_id = vp.id
    GROUP BY vp.id
    ORDER BY vp.created_at DESC
  `).all() as (VoucherProgram & { voucher_count: number })[];
}

export function createVoucherProgram(input: {
  code: string;
  name: string;
  description?: string | null;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  max_usage: number;
  valid_from?: string | null;
  valid_to?: string | null;
  is_active?: number;
  created_by: number;
}): number {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO voucher_programs (
         code, name, description, discount_type, discount_value, max_usage,
         valid_from, valid_to, is_active, created_by
       ) VALUES (
         @code, @name, @description, @discount_type, @discount_value, @max_usage,
         @valid_from, @valid_to, @is_active, @created_by
       )`
    )
    .run({
      code: input.code,
      name: input.name,
      description: input.description ?? null,
      discount_type: input.discount_type,
      discount_value: input.discount_value,
      max_usage: input.max_usage,
      valid_from: input.valid_from ?? null,
      valid_to: input.valid_to ?? null,
      is_active: input.is_active ?? 1,
      created_by: input.created_by,
    });
  return Number(result.lastInsertRowid);
}

export function updateVoucherProgram(id: number, patch: {
  code?: string;
  name?: string;
  description?: string | null;
  discount_type?: 'percent' | 'fixed';
  discount_value?: number;
  max_usage?: number;
  valid_from?: string | null;
  valid_to?: string | null;
  is_active?: number;
}): void {
  const db = getDb();
  const fields: string[] = [];
  const params: any[] = [];
  
  if (patch.code !== undefined) { fields.push('code = ?'); params.push(patch.code); }
  if (patch.name !== undefined) { fields.push('name = ?'); params.push(patch.name); }
  if (patch.description !== undefined) { fields.push('description = ?'); params.push(patch.description); }
  if (patch.discount_type !== undefined) { fields.push('discount_type = ?'); params.push(patch.discount_type); }
  if (patch.discount_value !== undefined) { fields.push('discount_value = ?'); params.push(patch.discount_value); }
  if (patch.max_usage !== undefined) { fields.push('max_usage = ?'); params.push(patch.max_usage); }
  if (patch.valid_from !== undefined) { fields.push('valid_from = ?'); params.push(patch.valid_from); }
  if (patch.valid_to !== undefined) { fields.push('valid_to = ?'); params.push(patch.valid_to); }
  if (patch.is_active !== undefined) { fields.push('is_active = ?'); params.push(patch.is_active); }
  
  if (fields.length === 0) return;
  
  fields.push('updated_at = datetime(\'now\')');
  params.push(id);
  
  db.prepare(`UPDATE voucher_programs SET ${fields.join(', ')} WHERE id = ?`).run(...params);
}

export function deleteVoucherProgram(id: number): void {
  const db = getDb();
  // First void all vouchers in this program
  db.prepare('UPDATE vouchers SET status = ?, updated_at = datetime(\'now\') WHERE program_id = ?').run('voided', id);
  // Then delete the program
  db.prepare('DELETE FROM voucher_programs WHERE id = ?').run(id);
}