import { getDb } from '../config/database.js';
import type { Role, User, AccountRecoveryRequest } from '../models/index.js';

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  name: string;
  phone?: string | null;
  role: Role;
  avatarUrl?: string | null;
  contactInfo?: string | null;
}

export function createUser(input: CreateUserInput): number {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO users (email, password_hash, name, phone, role, avatar_url, contact_info)
       VALUES (@email, @password_hash, @name, @phone, @role, @avatar_url, @contact_info)`
    )
    .run({
      email: input.email,
      password_hash: input.passwordHash,
      name: input.name,
      phone: input.phone ?? null,
      role: input.role,
      avatar_url: input.avatarUrl ?? null,
      contact_info: input.contactInfo ?? null,
    });
  return Number(result.lastInsertRowid);
}

export function findUserByEmail(email: string): User | undefined {
  return getDb().prepare('SELECT * FROM users WHERE email = ? AND is_deleted = 0').get(email) as User | undefined;
}

export function findUserById(id: number): User | undefined {
  return getDb().prepare('SELECT * FROM users WHERE id = ? AND is_deleted = 0').get(id) as User | undefined;
}

export function findUserForAuth(email: string): User | undefined {
  return getDb().prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;
}

export function findUserByIdentifier(identifier: string): User | undefined {
  const clean = identifier.trim().toLowerCase();
  return getDb().prepare(
    'SELECT * FROM users WHERE (LOWER(email) = ? OR phone = ? OR LOWER(name) = ?) AND is_deleted = 0'
  ).get(clean, identifier.trim(), clean) as User | undefined;
}


export function updateUserProfile(
  id: number,
  patch: {
    name?: string;
    phone?: string | null;
    contactInfo?: string | null;
    avatarUrl?: string | null;
  }
): void {
  const db = getDb();
  const current = findUserById(id);
  if (!current) return;

  db.prepare(
    `UPDATE users SET name = ?, phone = ?, contact_info = ?, avatar_url = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(
    patch.name ?? current.name,
    patch.phone !== undefined ? patch.phone : current.phone,
    patch.contactInfo !== undefined ? patch.contactInfo : current.contact_info,
    patch.avatarUrl !== undefined ? patch.avatarUrl : current.avatar_url,
    id
  );
}

export function updateUserPassword(id: number, passwordHash: string): void {
  getDb()
    .prepare(`UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(passwordHash, id);
}

export function updateUserRole(id: number, role: Role): void {
  getDb()
    .prepare(`UPDATE users SET role = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(role, id);
}

export function setUserStatus(id: number, status: 'ACTIVE' | 'DISABLED'): void {
  getDb()
    .prepare(`UPDATE users SET status = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(status, id);
}

export function softDeleteUser(id: number): void {
  getDb()
    .prepare(
      `UPDATE users SET is_deleted = 1, status = 'DISABLED', email = 'deleted-' || id || '-' || email, updated_at = datetime('now') WHERE id = ?`
    )
    .run(id);
}

export function listUsers(options: {
  q?: string;
  role?: Role | null;
  page?: number;
  limit?: number;
}): { data: User[]; total: number } {
  const db = getDb();
  const page = options.page ?? 1;
  const limit = Math.min(options.limit ?? 10, 10);
  const offset = (page - 1) * limit;

  const where: string[] = ['is_deleted = 0'];
  const params: unknown[] = [];

  if (options.q) {
    where.push('(email LIKE ? OR name LIKE ? OR IFNULL(phone, \'\') LIKE ?)');
    const like = `%${options.q}%`;
    params.push(like, like, like);
  }
  if (options.role) {
    where.push('role = ?');
    params.push(options.role);
  }

  const whereSql = `WHERE ${where.join(' AND ')}`;

  const total = (db.prepare(`SELECT COUNT(*) AS c FROM users ${whereSql}`).get(...params) as { c: number }).c;
  const data = db
    .prepare(
      `SELECT id, email, name, phone, role, avatar_url, contact_info, status, is_deleted, created_at, updated_at,
              is_recovery_enabled, is_2fa_enabled, last_totp_used_at
       FROM users ${whereSql} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset) as User[];

  return { data, total };
}

export interface TechnicianProfileRecord {
  bio: string | null;
  public_profile: string | null;
  alias: string | null;
  bank_info: string | null;
  bank_qr_path: string | null;
}

export function getTechnicianProfile(userId: number): TechnicianProfileRecord | undefined {
  return getDb()
    .prepare('SELECT bio, public_profile, alias, bank_info, bank_qr_path FROM technician_profiles WHERE user_id = ?')
    .get(userId) as TechnicianProfileRecord | undefined;
}

export function findTechnicianByAlias(alias: string): (TechnicianProfileRecord & { user_id: number }) | undefined {
  return getDb()
    .prepare('SELECT user_id, alias, bio, public_profile, bank_info, bank_qr_path FROM technician_profiles WHERE LOWER(alias) = LOWER(?)')
    .get(alias) as (TechnicianProfileRecord & { user_id: number }) | undefined;
}

export function ensureTechnicianProfile(userId: number): void {
  getDb()
    .prepare('INSERT OR IGNORE INTO technician_profiles (user_id) VALUES (?)')
    .run(userId);
}

export function updateTechnicianProfile(
  userId: number,
  patch: {
    bio?: string | null;
    publicProfile?: string | null;
    alias?: string | null;
    bankInfo?: string | null;
    bankQrPath?: string | null;
  }
): void {
  const db = getDb();
  ensureTechnicianProfile(userId);
  const current = getTechnicianProfile(userId);

  db.prepare(
    `UPDATE technician_profiles
     SET bio = ?,
         public_profile = ?,
         alias = ?,
         bank_info = ?,
         bank_qr_path = ?,
         updated_at = datetime('now')
     WHERE user_id = ?`
  ).run(
    patch.bio !== undefined ? patch.bio : current?.bio ?? null,
    patch.publicProfile !== undefined ? patch.publicProfile : current?.public_profile ?? null,
    patch.alias !== undefined ? patch.alias : current?.alias ?? null,
    patch.bankInfo !== undefined ? patch.bankInfo : current?.bank_info ?? null,
    patch.bankQrPath !== undefined ? patch.bankQrPath : current?.bank_qr_path ?? null,
    userId
  );
}

export function updateUserRecovery(
  id: number,
  enabled: number,
  secret?: string | null,
  backupCodes?: string | null
): void {
  getDb()
    .prepare(
      `UPDATE users SET is_recovery_enabled = ?, recovery_secret = ?, recovery_backup_codes = ?, updated_at = datetime('now') WHERE id = ?`
    )
    .run(enabled, secret ?? null, backupCodes ?? null, id);
}

export function updateUserRecoveryBackupCodes(id: number, backupCodesJson: string): void {
  getDb()
    .prepare(
      `UPDATE users SET recovery_backup_codes = ?, updated_at = datetime('now') WHERE id = ?`
    )
    .run(backupCodesJson, id);
}

export function updateUser2FA(
  id: number,
  enabled: number,
  secret?: string | null,
  backupCodes?: string | null
): void {
  getDb()
    .prepare(
      `UPDATE users SET is_2fa_enabled = ?, two_factor_secret = ?, two_factor_backup_codes = ?, updated_at = datetime('now') WHERE id = ?`
    )
    .run(enabled, secret ?? null, backupCodes ?? null, id);
}

export function updateUser2FABackupCodes(id: number, backupCodesJson: string): void {
  getDb()
    .prepare(
      `UPDATE users SET two_factor_backup_codes = ?, updated_at = datetime('now') WHERE id = ?`
    )
    .run(backupCodesJson, id);
}

export interface CreateRecoveryRequestInput {
  userId?: number | null;
  usernameOrEmail: string;
  fullName: string;
  contactPhone: string;
  contactEmail?: string | null;
  reason: string;
  evidenceUrl?: string | null;
}

export function createRecoveryRequest(input: CreateRecoveryRequestInput): number {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO account_recovery_requests (user_id, username_or_email, full_name, contact_phone, contact_email, reason, evidence_url)
    VALUES (@userId, @usernameOrEmail, @fullName, @contactPhone, @contactEmail, @reason, @evidenceUrl)
  `).run({
    userId: input.userId ?? null,
    usernameOrEmail: input.usernameOrEmail,
    fullName: input.fullName,
    contactPhone: input.contactPhone,
    contactEmail: input.contactEmail ?? null,
    reason: input.reason,
    evidenceUrl: input.evidenceUrl ?? null,
  });
  return Number(result.lastInsertRowid);
}

export function listRecoveryRequests(options: {
  status?: string;
  page?: number;
  limit?: number;
}): { data: AccountRecoveryRequest[]; total: number } {
  const db = getDb();
  const page = options.page ?? 1;
  const limit = Math.min(options.limit ?? 20, 50);
  const offset = (page - 1) * limit;

  const where: string[] = [];
  const params: unknown[] = [];

  if (options.status) {
    where.push('status = ?');
    params.push(options.status);
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  const total = (
    db.prepare(`SELECT COUNT(*) as c FROM account_recovery_requests ${whereSql}`).get(...params) as { c: number }
  ).c;

  const data = db.prepare(
    `SELECT * FROM account_recovery_requests ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, limit, offset) as AccountRecoveryRequest[];

  return { data, total };
}

export function findRecoveryRequestById(id: number): AccountRecoveryRequest | undefined {
  return getDb().prepare('SELECT * FROM account_recovery_requests WHERE id = ?').get(id) as AccountRecoveryRequest | undefined;
}

export function resolveRecoveryRequest(
  id: number,
  status: 'APPROVED' | 'REJECTED',
  adminNotes?: string | null,
  resolvedBy?: number | null
): void {
  getDb().prepare(`
    UPDATE account_recovery_requests
    SET status = ?, admin_notes = ?, resolved_at = datetime('now'), resolved_by = ?
    WHERE id = ?
  `).run(status, adminNotes ?? null, resolvedBy ?? null, id);
}