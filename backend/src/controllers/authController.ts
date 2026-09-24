import type { Response } from 'express';
import config from '../config/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/response.js';
import * as authService from '../services/authService.js';
import { validate } from '../utils/validate.js';
import { changePasswordSchema, loginSchema, profileUpdateSchema, registerSchema } from '../validators/auth.js';
import {
  ACCESS_TOKEN_NAME,
  REFRESH_TOKEN_NAME,
  type AuthRequest,
} from '../middleware/auth.js';
import { writeAuditLog } from '../services/auditService.js';
import type { LocaleRequest } from '../middleware/locale.js';
import { updateUserProfile, findUserById, updateUserPassword } from '../repositories/userRepository.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { BadRequestError, NotFoundError } from '../utils/AppError.js';

const isProd = config.isProd;

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
  rememberMe = false
): void {
  const common = {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
  };

  res.cookie(ACCESS_TOKEN_NAME, accessToken, {
    ...common,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie(REFRESH_TOKEN_NAME, refreshToken, {
    ...common,
    maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_TOKEN_NAME, { path: '/' });
  res.clearCookie(REFRESH_TOKEN_NAME, { path: '/' });
}

export const registerController = asyncHandler(async (req, res) => {
  const body = validate(registerSchema, req.body);
  const result = await authService.register(body);
  const lang = (req as LocaleRequest).lang ?? 'vi';

  writeAuditLog({
    actorId: result.user.id,
    actorEmail: result.user.email,
    action: 'REGISTER',
    ip: req.ip,
    metadata: { lang },
  });

  setAuthCookies(res, result.accessToken, result.refreshToken);
  ok(res, result.user, 'Đăng ký thành công.');
});

export const loginController = asyncHandler(async (req, res) => {
  const body = validate(loginSchema, req.body);
  const rememberMe = req.body.rememberMe === true || req.body.rememberMe === 'true';

  const result = await authService.login(body);

  writeAuditLog({
    actorId: result.user.id,
    actorEmail: result.user.email,
    action: 'LOGIN',
    ip: req.ip,
  });

  setAuthCookies(res, result.accessToken, result.refreshToken, rememberMe);
  ok(res, result.user, 'Đăng nhập thành công.');
});

export const refreshController = asyncHandler(async (req, res) => {
  const refreshToken = (req as AuthRequest & { cookies?: Record<string, string> }).cookies?.[REFRESH_TOKEN_NAME];
  const result = await authService.refreshSession(refreshToken ?? '');
  setAuthCookies(res, result.accessToken, result.refreshToken);
  ok(res, result.user, 'Phiên làm việc đã được làm mới.');
});

export const logoutController = asyncHandler(async (req, res) => {
  const user = (req as AuthRequest).user;
  if (user) {
    writeAuditLog({ actorId: user.id, actorEmail: user.email, action: 'LOGOUT', ip: req.ip });
  }
  clearAuthCookies(res);
  ok(res, null, 'Đã đăng xuất.');
});

export const meController = asyncHandler(async (req, res) => {
  const user = (req as AuthRequest).user!;
  ok(res, authService.toPublicUser(user));
});

export const updateProfileController = asyncHandler(async (req, res) => {
  const user = (req as AuthRequest).user!;
  const body = validate(profileUpdateSchema, req.body);

  updateUserProfile(user.id, {
    name: body.name,
    phone: body.phone,
    contactInfo: body.contactInfo,
    avatarUrl: body.avatarUrl,
  });

  const updated = findUserById(user.id);
  ok(res, authService.toPublicUser(updated!), 'Cập nhật hồ sơ thành công.');
});

export const changePasswordController = asyncHandler(async (req, res) => {
  const user = (req as AuthRequest).user!;
  const body = validate(changePasswordSchema, req.body);

  const fullUser = findUserById(user.id);
  if (!fullUser) throw new NotFoundError('Không tìm thấy tài khoản.');

  const valid = await verifyPassword(fullUser.password_hash, body.currentPassword);
  if (!valid) throw new BadRequestError('Mật khẩu hiện tại không đúng.');

  const newHash = await hashPassword(body.newPassword);
  updateUserPassword(user.id, newHash);

  writeAuditLog({ actorId: user.id, actorEmail: user.email, action: 'CHANGE_PASSWORD', ip: req.ip });
  ok(res, null, 'Đổi mật khẩu thành công.');
});