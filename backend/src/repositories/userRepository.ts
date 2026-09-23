import { getDb } from '../config/database.js';
import type { Role, User } from '../models/index.js';

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
    .prepare(`SELECT * FROM users ${whereSql} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`)
    .all(...params, limit, offset) as User[];

  return { data, total };
}

export function getTechnicianProfile(userId: number): { bio: string | null; public_profile: string | null } | undefined {
  return getDb()
    .prepare('SELECT bio, public_profile FROM technician_profiles WHERE user_id = ?')
    .get(userId) as { bio: string | null; public_profile: string | null } | undefined;
}

export function ensureTechnicianProfile(userId: number): void {
  getDb()
    .prepare('INSERT OR IGNORE INTO technician_profiles (user_id) VALUES (?)')
    .run(userId);
}

export function updateTechnicianProfile(
  userId: number,
  patch: { bio?: string | null; publicProfile?: string | null }
): void {
  const db = getDb();
  ensureTechnicianProfile(userId);
  const current = getTechnicianProfile(userId);

  db.prepare(
    `UPDATE technician_profiles SET bio = ?, public_profile = ?, updated_at = datetime('now') WHERE user_id = ?`
  ).run(
    patch.bio !== undefined ? patch.bio : current?.bio ?? null,
    patch.publicProfile !== undefined ? patch.publicProfile : current?.public_profile ?? null,
    userId
  );
}