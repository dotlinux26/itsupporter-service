import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from '../utils/AppError.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import type { Role, User } from '../models/index.js';
import * as userRepo from '../repositories/userRepository.js';

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
}

export function toPublicUser(user: User): PublicUser {
  let bio: string | null = null;
  let public_profile: string | null = null;
  if (user.role === 'TECHNICIAN') {
    const techProf = userRepo.getTechnicianProfile(user.id);
    if (techProf) {
      bio = techProf.bio;
      public_profile = techProf.public_profile;
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

export async function login(input: LoginInput): Promise<AuthResult> {
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

  return issueTokens(user);
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