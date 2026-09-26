import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.NODE_ENV ??= 'development';

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: path.resolve(__dirname, '..', '..', envFile) });
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

function resolvePath(p: string | undefined, fallback: string): string {
  const v = p || fallback;
  return path.isAbsolute(v) ? v : path.resolve(__dirname, '..', '..', v);
}

const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
  const acc = process.env.JWT_ACCESS_SECRET;
  const ref = process.env.JWT_REFRESH_SECRET;
  if (!acc || acc.includes('change_me') || acc.length < 16) {
    throw new Error('FATAL: JWT_ACCESS_SECRET must be configured with a secure key in production (min 16 chars).');
  }
  if (!ref || ref.includes('change_me') || ref.length < 16) {
    throw new Error('FATAL: JWT_REFRESH_SECRET must be configured with a secure key in production (min 16 chars).');
  }
}

const config = {
  env: process.env.NODE_ENV ?? 'development',
  isProd,
  port: Number(process.env.PORT ?? 4000),

  databasePath: resolvePath(process.env.DATABASE_PATH, './data/itsupporter.sqlite'),

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev_access_secret_change_me',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev_refresh_secret_change_me',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },

  corsOrigin: (process.env.CORS_ORIGIN ?? 'http://localhost:5172,http://127.0.0.1:5172,http://localhost:5173,http://127.0.0.1:5173').split(',').map((s) => s.trim()),
  publicBaseUrl: process.env.PUBLIC_BASE_URL ?? 'http://localhost:5172',
  apiBaseUrl: process.env.API_BASE_URL ?? 'http://localhost:4000',

  uploadDir: resolvePath(process.env.UPLOAD_DIR, './uploads'),
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB ?? 5),

  // Giờ Việt Nam (UTC+7) = giờ Hà Nội. IANA hợp lệ duy nhất: Asia/Ho_Chi_Minh
  timezone: process.env.TIMEZONE ?? 'Asia/Ho_Chi_Minh',
  workingStart: process.env.WORKING_START ?? '07:00',
  workingEnd: process.env.WORKING_END ?? '19:00',
  slotDurationMinutes: Number(process.env.SLOT_DURATION_MINUTES ?? 60),

  defaults: {
    latePenaltyMinutes: Number(process.env.LATE_PENALTY_MINUTES ?? 10),
    latePenaltyPercent: Number(process.env.LATE_PENALTY_PERCENT ?? 15),
    freeServiceAfterMinutes: Number(process.env.FREE_SERVICE_AFTER_MINUTES ?? 45),
  },

  backupDir: resolvePath(process.env.BACKUP_DIR, '../database/backups'),

  turnstile: {
    enabled: process.env.TURNSTILE_ENABLED === 'true',
    siteKey: process.env.TURNSTILE_SITE_KEY ?? '',
    secret: process.env.TURNSTILE_SECRET ?? '',
    verifyUrl: process.env.TURNSTILE_VERIFY_URL ?? 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
  },

  telegram: {
    enabled: process.env.TELEGRAM_BOT_ENABLED === 'true',
    botToken: process.env.TELEGRAM_BOT_TOKEN ?? '',
    chatId: process.env.TELEGRAM_CHAT_ID ?? '',
    apiUrl: process.env.TELEGRAM_API_URL ?? 'https://api.telegram.org',
  },
};


export default config;