import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import argon2 from 'argon2';
import { getDb, closeDb } from '../config/database.js';
import logger from '../utils/logger.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function createAdmin(email: string, password: string): Promise<void> {
  if (!EMAIL_RE.test(email)) {
    throw new Error('Email không hợp lệ.');
  }
  if (password.length < 8) {
    throw new Error('Mật khẩu phải có ít nhất 8 ký tự.');
  }

  const db = getDb();
  const hash = await argon2.hash(password, { type: argon2.argon2id });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: number } | undefined;
  if (existing) {
    throw new Error(`Email đã tồn tại trong hệ thống (user id ${existing.id}). Không tạo admin trùng.`);
  }

  db.prepare(`
    INSERT INTO users (email, password_hash, name, role, status)
    VALUES (?, ?, ?, 'ADMIN', 'ACTIVE')
  `).run(email, hash, email.split('@')[0]);

  logger.info({ email }, 'Admin account created');
}

async function run(): Promise<void> {
  const rl = readline.createInterface({ input, output });

  try {
    const email = (await rl.question('Email admin: ')).trim();
    const password = await rl.question('Mật khẩu (tối thiểu 8 ký tự): ');
    const confirm = await rl.question('Xác nhận mật khẩu: ');

    if (password !== confirm) {
      throw new Error('Mật khẩu xác nhận không khớp.');
    }

    await createAdmin(email, password);
    console.log('Đã tạo tài khoản ADMIN thành công.');
  } catch (err) {
    console.error(err instanceof Error ? err.message : 'Tạo admin thất bại.');
    process.exitCode = 1;
  } finally {
    rl.close();
    closeDb();
  }
}

const isMain =
  process.argv[1] !== undefined &&
  (process.argv[1].endsWith('create-admin.ts') || process.argv[1].endsWith('create-admin'));

if (isMain) {
  const idxEmail = process.argv.indexOf('--email');
  const idxPass = process.argv.indexOf('--password');
  const emailArg = idxEmail !== -1 ? process.argv[idxEmail + 1] : undefined;
  const passArg = idxPass !== -1 ? process.argv[idxPass + 1] : undefined;

  if (emailArg && passArg) {
    createAdmin(emailArg, passArg)
      .then(() => {
        console.log('Đã tạo tài khoản ADMIN thành công.');
        closeDb();
      })
      .catch((err) => {
        console.error(err instanceof Error ? err.message : 'Tạo admin thất bại.');
        closeDb();
        process.exitCode = 1;
      });
  } else {
    run();
  }
}