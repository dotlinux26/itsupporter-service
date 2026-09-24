import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import type { Role } from '../models/index.js';

export interface AccessTokenPayload {
  sub: string;
  uid: number;
  email: string;
  name: string;
  role: Role;
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: string;
  uid: number;
  type: 'refresh';
}

export function signAccessToken(user: { id: number; email: string; name: string; role: Role }): string {
  const payload: AccessTokenPayload = {
    sub: String(user.id),
    uid: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    type: 'access',
  };
  return jwt.sign(payload, config.jwt.accessSecret, { expiresIn: config.jwt.accessExpiresIn as jwt.SignOptions['expiresIn'] });
}

export function signRefreshToken(userId: number): string {
  const payload: RefreshTokenPayload = { sub: String(userId), uid: userId, type: 'refresh' };
  return jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn'] });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, config.jwt.accessSecret) as AccessTokenPayload;
  if (decoded.type !== 'access') {
    throw new Error('Wrong token type');
  }
  return decoded;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, config.jwt.refreshSecret) as RefreshTokenPayload;
  if (decoded.type !== 'refresh') {
    throw new Error('Wrong token type');
  }
  return decoded;
}