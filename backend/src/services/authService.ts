import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from '../utils/AppError.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  signTemp2FAToken,
  verifyTemp2FAToken,
} from '../utils/jwt.js';
import type { Role, User } from '../models/index.js';
import * as userRepo from '../repositories/userRepository.js';
import {
  generateTotpSetup,
  verifyTotpToken,
  verifyAndConsumeBackupCode,
  checkRecoveryRateLimit,
  recordRecoveryFailure,
  clearRecoveryRateLimit,
  type TotpSetupResult,
} from './totpService.js';
import { writeAuditLog } from './auditService.js';

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: PublicUser;
}

export interface LoginResult {
  require2FA?: boolean;
  tempToken?: string;
  accessToken?: string;
  refreshToken?: string;
  user: PublicUser;
}

export interface PublicUser {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
  avatar_url: string | null;
  contact_info: string | null;
  status: string;
  created_at: string;
  bio?: string | null;
  public_profile?: string | null;
  alias?: string | null;
  bank_info?: string | null;
  bank_qr_path?: string | null;
  is_recovery_enabled: boolean;
  is_2fa_enabled: boolean;
}

export function toPublicUser(user: User): PublicUser {
  let bio: string | null = null;
  let public_profile: string | null = null;
  let alias: string | null = null;
  let bank_info: string | null = null;
  let bank_qr_path: string | null = null;
  if (user.role === 'TECHNICIAN') {
    const techProf = userRepo.getTechnicianProfile(user.id);
    if (techProf) {
      bio = techProf.bio;
      public_profile = techProf.public_profile;
      alias = techProf.alias;
      bank_info = techProf.bank_info;
      bank_qr_path = techProf.bank_qr_path;
    }
  }
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    avatar_url: user.avatar_url,
    contact_info: user.contact_info,
    status: user.status,
    created_at: user.created_at,
    bio,
    public_profile,
    alias,
    bank_info,
    bank_qr_path,
    is_recovery_enabled: Boolean(user.is_recovery_enabled),
    is_2fa_enabled: Boolean(user.is_2fa_enabled),
  };
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const existing = userRepo.findUserForAuth(input.email.trim().toLowerCase());
  if (existing) {
    throw new ConflictError('Email này đã được sử dụng.');
  }

  const passwordHash = await hashPassword(input.password);
  const email = input.email.trim().toLowerCase();

  // Role mặc định luôn là GUEST. Backend bỏ qua mọi role khách gửi lên.
  const id = userRepo.createUser({
    email,
    passwordHash,
    name: input.name.trim(),
    phone: input.phone ?? null,
    role: 'GUEST',
  });

  const user = userRepo.findUserById(id);
  if (!user) {
    throw new NotFoundError();
  }

  return issueTokens(user);
}

export async function login(input: LoginInput): Promise<LoginResult> {
  const email = input.email.trim().toLowerCase();
  const user = userRepo.findUserForAuth(email);

  if (!user) {
    await verifyPassword('$argon2id$v=19$m=19456,t=2,p=1$c2FsdHNhbHQ$hashed', input.password).catch(() => undefined);
    throw new UnauthorizedError('Email hoặc mật khẩu không đúng.');
  }

  const ok = await verifyPassword(user.password_hash, input.password);
  if (!ok) {
    throw new UnauthorizedError('Email hoặc mật khẩu không đúng.');
  }

  if (user.is_deleted) {
    throw new UnauthorizedError('Tài khoản không tồn tại.');
  }
  if (user.status !== 'ACTIVE') {
    throw new UnauthorizedError('Tài khoản của bạn đã bị vô hiệu hóa.');
  }

  // If 2FA is enabled, return requirement for 2FA token
  if (user.is_2fa_enabled) {
    const tempToken = signTemp2FAToken(user.id);
    return {
      require2FA: true,
      tempToken,
      user: toPublicUser(user),
    };
  }

  const tokens = issueTokens(user);
  return {
    require2FA: false,
    ...tokens,
  };
}

export async function verifyLogin2FA(tempToken: string, code: string, ip?: string): Promise<AuthResult> {
  if (!tempToken) {
    throw new UnauthorizedError('Phiên xác thực 2 bước đã hết hạn. Vui lòng đăng nhập lại.');
  }
  if (!code || !code.trim()) {
    throw new BadRequestError('Vui lòng nhập mã xác thực 2 bước hoặc mã dự phòng.');
  }

  let uid: number;
  try {
    const decoded = verifyTemp2FAToken(tempToken);
    uid = decoded.uid;
  } catch {
    throw new UnauthorizedError('Phiên xác thực 2 bước đã hết hạn. Vui lòng đăng nhập lại.');
  }

  const user = userRepo.findUserById(uid);
  if (!user || user.is_deleted || user.status !== 'ACTIVE') {
    throw new UnauthorizedError('Tài khoản không hợp lệ hoặc đã bị khóa.');
  }

  const cleanCode = code.trim();
  let verified = false;

  // Try verifying TOTP token
  if (user.two_factor_secret && /^\d{6}$/.test(cleanCode.replace(/\s+/g, ''))) {
    verified = verifyTotpToken(cleanCode, user.two_factor_secret, user.id);
  }

  // If TOTP failed, try backup code
  if (!verified && user.two_factor_backup_codes) {
    const backupResult = verifyAndConsumeBackupCode(cleanCode, user.two_factor_backup_codes);
    if (backupResult.valid) {
      verified = true;
      userRepo.updateUser2FABackupCodes(user.id, JSON.stringify(backupResult.remainingCodes));
      writeAuditLog({
        actorId: user.id,
        actorEmail: user.email,
        action: 'USER_CONSUME_2FA_BACKUP_CODE',
        ip,
        metadata: { remainingCount: backupResult.remainingCodes.length },
      });
    }
  }

  if (!verified) {
    throw new BadRequestError('Mã xác thực 2 bước không chính xác hoặc đã hết hạn.');
  }

  writeAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    action: 'LOGIN_2FA_SUCCESS',
    ip,
  });

  return issueTokens(user);
}

// ----------------- TOTP RECOVERY (LUỒNG 1) -----------------
export async function setupRecoveryTotp(userId: number): Promise<TotpSetupResult> {
  const user = userRepo.findUserById(userId);
  if (!user) throw new NotFoundError('Người dùng không tồn tại');

  return generateTotpSetup(`KhoiPhuc_MatKhau(${user.email})`, 'ITSupporter_HaUI');
}


export async function confirmRecoveryTotp(
  userId: number,
  token: string,
  secret: string,
  backupCodes: string[],
  ip?: string
): Promise<void> {
  const user = userRepo.findUserById(userId);
  if (!user) throw new NotFoundError('Người dùng không tồn tại');

  if (!verifyTotpToken(token, secret, userId)) {
    throw new BadRequestError('Mã xác thực không hợp lệ. Vui lòng kiểm tra lại đồng hồ thiết bị và thử lại.');
  }

  userRepo.updateUserRecovery(userId, 1, secret, JSON.stringify(backupCodes));

  writeAuditLog({
    actorId: userId,
    actorEmail: user.email,
    action: 'USER_ENABLE_RECOVERY_TOTP',
    ip,
  });
}

export async function resetPasswordViaTotp(
  identifier: string,
  code: string,
  newPassword: string,
  ip?: string
): Promise<{ success: boolean; message: string }> {
  const cleanId = identifier.trim();
  checkRecoveryRateLimit(cleanId);
  if (ip) checkRecoveryRateLimit(ip);

  const user = userRepo.findUserByIdentifier(cleanId);
  if (!user) {
    const { attemptsLeft } = recordRecoveryFailure(cleanId);
    throw new BadRequestError(`Tài khoản không tồn tại. Bạn còn ${attemptsLeft} lần thử trước khi bị khóa tạm thời.`);
  }

  if (!user.is_recovery_enabled || !user.recovery_secret) {
    throw new BadRequestError(
      'Tài khoản chưa thiết lập tính năng Khôi phục bằng mã TOTP. Vui lòng gửi yêu cầu hỗ trợ qua Trung tâm Cứu trợ tài khoản.'
    );
  }

  const cleanCode = code.trim();
  let verified = false;

  // Try 6-digit TOTP
  if (/^\d{6}$/.test(cleanCode.replace(/\s+/g, ''))) {
    verified = verifyTotpToken(cleanCode, user.recovery_secret, user.id);
  }

  // Try backup code
  if (!verified && user.recovery_backup_codes) {
    const backupResult = verifyAndConsumeBackupCode(cleanCode, user.recovery_backup_codes);
    if (backupResult.valid) {
      verified = true;
      userRepo.updateUserRecoveryBackupCodes(user.id, JSON.stringify(backupResult.remainingCodes));
      writeAuditLog({
        actorId: user.id,
        actorEmail: user.email,
        action: 'USER_CONSUME_RECOVERY_BACKUP_CODE',
        ip,
        metadata: { remainingCount: backupResult.remainingCodes.length },
      });
    }
  }

  if (!verified) {
    const { attemptsLeft } = recordRecoveryFailure(cleanId);
    if (ip) recordRecoveryFailure(ip);
    throw new BadRequestError(`Mã xác thực hoặc mã dự phòng không đúng. Bạn còn ${attemptsLeft} lần thử trước khi bị khóa tạm thời.`);
  }

  // Verification succeeded - clear rate limits
  clearRecoveryRateLimit(cleanId);
  if (ip) clearRecoveryRateLimit(ip);

  validatePasswordStrength(newPassword);
  const passwordHash = await hashPassword(newPassword);
  userRepo.updateUserPassword(user.id, passwordHash);

  writeAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    action: 'USER_PASSWORD_RECOVERY_SUCCESS',
    ip,
    targetType: 'USER',
    targetId: user.id,
  });

  return { success: true, message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.' };
}

// ----------------- LOGIN 2FA (LUỒNG 2) -----------------
export async function setup2FA(userId: number): Promise<TotpSetupResult> {
  const user = userRepo.findUserById(userId);
  if (!user) throw new NotFoundError('Người dùng không tồn tại');

  return generateTotpSetup(`2FA_DangNhap(${user.email})`, 'ITSupporter_HaUI');
}


export async function confirm2FA(
  userId: number,
  token: string,
  secret: string,
  backupCodes: string[],
  ip?: string
): Promise<void> {
  const user = userRepo.findUserById(userId);
  if (!user) throw new NotFoundError('Người dùng không tồn tại');

  if (!verifyTotpToken(token, secret, userId)) {
    throw new BadRequestError('Mã xác thực không hợp lệ. Vui lòng kiểm tra lại đồng hồ thiết bị và thử lại.');
  }

  userRepo.updateUser2FA(userId, 1, secret, JSON.stringify(backupCodes));

  writeAuditLog({
    actorId: userId,
    actorEmail: user.email,
    action: 'USER_ENABLE_2FA',
    ip,
  });
}

export async function disable2FA(userId: number, tokenOrPassword: string, ip?: string): Promise<void> {
  const user = userRepo.findUserById(userId);
  if (!user) throw new NotFoundError('Người dùng không tồn tại');

  if (!user.is_2fa_enabled) {
    throw new BadRequestError('Tính năng xác thực 2 bước hiện chưa được bật.');
  }

  const clean = tokenOrPassword.trim();
  let verified = false;

  // Check if TOTP code
  if (user.two_factor_secret && /^\d{6}$/.test(clean.replace(/\s+/g, ''))) {
    verified = verifyTotpToken(clean, user.two_factor_secret, user.id);
  }

  // Check if password
  if (!verified) {
    verified = await verifyPassword(user.password_hash, clean);
  }

  if (!verified) {
    throw new BadRequestError('Mật khẩu hoặc mã 2FA không chính xác.');
  }

  userRepo.updateUser2FA(userId, 0, null, null);

  writeAuditLog({
    actorId: userId,
    actorEmail: user.email,
    action: 'USER_DISABLE_2FA',
    ip,
  });
}

export function issueTokens(user: User): AuthResult {
  return {
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user.id),
    user: toPublicUser(user),
  };
}

export async function refreshSession(refreshToken: string): Promise<AuthResult> {
  if (!refreshToken) {
    throw new UnauthorizedError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  }
  let uid: number;
  try {
    const decoded = verifyRefreshToken(refreshToken);
    uid = decoded.uid;
  } catch {
    throw new UnauthorizedError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  }

  const user = userRepo.findUserById(uid);
  if (!user) {
    throw new UnauthorizedError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  }
  if (user.status !== 'ACTIVE') {
    throw new UnauthorizedError('Tài khoản của bạn đã bị vô hiệu hóa.');
  }

  return issueTokens(user);
}

export function validatePasswordStrength(password: string): void {
  if (password.length < 8) {
    throw new BadRequestError('Mật khẩu phải có ít nhất 8 ký tự.');
  }
}