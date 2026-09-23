import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().trim().email('Email không hợp lệ.').max(255),
  password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự.').max(128),
  name: z.string().trim().min(1, 'Vui lòng nhập họ tên.').max(100),
  phone: z.string().trim().max(20).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Email không hợp lệ.').max(255),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu.').max(128),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự.').max(128),
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().max(20).nullable().optional(),
  contactInfo: z.string().trim().max(300).nullable().optional(),
  avatarUrl: z.string().max(500).nullable().optional(),
});

export const technicianProfileUpdateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().max(20).nullable().optional(),
  contactInfo: z.string().trim().max(300).nullable().optional(),
  avatarUrl: z.string().max(500).nullable().optional(),
  bio: z.string().trim().max(300).nullable().optional(),
  publicProfile: z.string().trim().max(5000).nullable().optional(),
});