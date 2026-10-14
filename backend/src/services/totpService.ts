import { generateSecret, generateURI, verifySync } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'node:crypto';
import { BadRequestError, AppError } from '../utils/AppError.js';
import logger from '../utils/logger.js';

export interface TotpSetupResult {
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
}

export function generateBackupCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
    codes.push(`${part1}-${part2}`);
  }
  return codes;
}

export async function generateTotpSetup(
  label: string,
  issuer = 'ITSupporter_HaUI'
): Promise<TotpSetupResult> {
  const secret = generateSecret({ length: 20 });
  const otpauthUrl = generateURI({
    secret,
    label,
    issuer,
  });
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 256,
  });
  const backupCodes = generateBackupCodes(8);

  return {
    secret,
    otpauthUrl,
    qrCodeDataUrl,
    backupCodes,
  };
}

// Anti-replay cache to prevent reusing the same 6-digit token in the same 30-90s window
const usedTokensCache = new Map<string, number>();

function cleanExpiredUsedTokens(): void {
  const now = Date.now();
  for (const [key, expiresAt] of usedTokensCache.entries()) {
    if (now >= expiresAt) {
      usedTokensCache.delete(key);
    }
  }
}

export function verifyTotpToken(token: string, secret: string, userKey?: string | number): boolean {
  if (!token || !secret) return false;
  const cleanToken = token.replace(/\s+/g, '');
  if (!/^\d{6}$/.test(cleanToken)) return false;

  cleanExpiredUsedTokens();

  // Check anti-replay if userKey is provided
  const replayKey = userKey ? `${userKey}_${cleanToken}` : null;
  if (replayKey && usedTokensCache.has(replayKey)) {
    const expiresAt = usedTokensCache.get(replayKey)!;
    if (Date.now() < expiresAt) {
      logger.warn({ userKey, token: cleanToken }, 'Rejected replayed TOTP token');
      return false;
    }
  }

  try {
    const result = verifySync({
      token: cleanToken,
      secret,
      epochTolerance: 30, // Window of ±30s margin
    });
    const isValid = Boolean(result && result.valid);
    if (isValid && replayKey) {
      // Mark token as used for 90 seconds (covers current 30s + window=1)
      usedTokensCache.set(replayKey, Date.now() + 90000);
    }
    return isValid;
  } catch (err: any) {
    logger.warn({ err: err?.message }, 'TOTP check error');
    return false;
  }
}



export function verifyAndConsumeBackupCode(
  inputCode: string,
  backupCodesJson: string | null | undefined
): { valid: boolean; remainingCodes: string[] } {
  if (!inputCode || !backupCodesJson) {
    return { valid: false, remainingCodes: [] };
  }

  let codes: string[] = [];
  try {
    codes = JSON.parse(backupCodesJson);
    if (!Array.isArray(codes)) codes = [];
  } catch {
    codes = [];
  }

  const cleanInput = inputCode.trim().toUpperCase().replace(/\s+/g, '');
  const matchIndex = codes.findIndex((c) => c.trim().toUpperCase().replace(/\s+/g, '') === cleanInput);

  if (matchIndex === -1) {
    return { valid: false, remainingCodes: codes };
  }

  // Consume code
  const remainingCodes = [...codes.slice(0, matchIndex), ...codes.slice(matchIndex + 1)];
  return { valid: true, remainingCodes };
}

// In-memory rate limiting for recovery attempts
interface RateLimitEntry {
  attempts: number;
  lockedUntil?: number;
}
const recoveryRateLimitMap = new Map<string, RateLimitEntry>();

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export function checkRecoveryRateLimit(key: string): void {
  const entry = recoveryRateLimitMap.get(key);
  if (!entry) return;

  if (entry.lockedUntil && Date.now() < entry.lockedUntil) {
    const minutesLeft = Math.ceil((entry.lockedUntil - Date.now()) / 60000);
    throw new AppError(
      'RATE_LIMITED',
      `Tính năng khôi phục đang bị tạm khóa do nhập sai nhiều lần. Vui lòng thử lại sau ${minutesLeft} phút.`,
      429
    );
  }

  // Lock expired
  if (entry.lockedUntil && Date.now() >= entry.lockedUntil) {
    recoveryRateLimitMap.delete(key);
  }
}

export function recordRecoveryFailure(key: string): { attemptsLeft: number; lockedUntil?: number } {
  let entry = recoveryRateLimitMap.get(key);
  if (!entry) {
    entry = { attempts: 0 };
    recoveryRateLimitMap.set(key, entry);
  }

  entry.attempts += 1;
  if (entry.attempts >= MAX_FAILED_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    entry.attempts = 0;
    const minutes = Math.ceil(LOCKOUT_DURATION_MS / 60000);
    throw new AppError(
      'RATE_LIMITED',
      `Bạn đã nhập sai mã xác thực quá 5 lần. Tính năng khôi phục tài khoản bị tạm khóa trong ${minutes} phút để bảo vệ an toàn.`,
      429
    );
  }

  const attemptsLeft = MAX_FAILED_ATTEMPTS - entry.attempts;
  return { attemptsLeft };
}

export function clearRecoveryRateLimit(key: string): void {
  recoveryRateLimitMap.delete(key);
}
