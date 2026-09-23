import type { NextFunction, Request, Response } from 'express';
import { getDb } from '../config/database.js';
import type { User } from '../models/index.js';
import { UnauthorizedError } from '../utils/AppError.js';
import { verifyAccessToken, type AccessTokenPayload } from '../utils/jwt.js';
import type { Role } from '../models/index.js';

export interface AuthRequest extends Request {
  user?: User;
  tokenPayload?: AccessTokenPayload;
}

export function getAuthUser(req: Request): User | undefined {
  return (req as AuthRequest).user;
}

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';

export async function loadUserById(id: number): Promise<User | undefined> {
  return getDb().prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
}

export function readAccessToken(req: Request): string | undefined {
  const cookie = (req as Request & { cookies?: Record<string, string> }).cookies?.[ACCESS_COOKIE];
  if (cookie) return cookie;
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return undefined;
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = readAccessToken(req);
  if (!token) {
    next(new UnauthorizedError());
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    const user = getDb().prepare('SELECT * FROM users WHERE id = ? AND is_deleted = 0').get(payload.uid) as
      | User
      | undefined;

    if (!user) {
      next(new UnauthorizedError());
      return;
    }
    if (user.status !== 'ACTIVE') {
      next(new UnauthorizedError('Tài khoản của bạn đã bị vô hiệu hóa.'));
      return;
    }

    (req as AuthRequest).user = user;
    (req as AuthRequest).tokenPayload = payload;
    next();
  } catch {
    next(new UnauthorizedError());
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = readAccessToken(req);
  if (!token) {
    next();
    return;
  }
  try {
    const payload = verifyAccessToken(token);
    const user = getDb().prepare('SELECT * FROM users WHERE id = ? AND is_deleted = 0').get(payload.uid) as
      | User
      | undefined;
    if (user && user.status === 'ACTIVE') {
      (req as AuthRequest).user = user;
      (req as AuthRequest).tokenPayload = payload;
    }
  } catch {
    /* ignore invalid token on optional auth */
  }
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = getAuthUser(req);
    if (!user) {
      next(new UnauthorizedError());
      return;
    }
    if (!roles.includes(user.role)) {
      next(new UnauthorizedError('Bạn không có quyền truy cập tài nguyên này.'));
      return;
    }
    next();
  };
}

export const ACCESS_TOKEN_NAME = ACCESS_COOKIE;
export const REFRESH_TOKEN_NAME = REFRESH_COOKIE;