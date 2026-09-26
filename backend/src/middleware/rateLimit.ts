import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';
import config from '../config/index.js';
import { translate } from '../utils/i18n.js';
import type { LocaleRequest } from './locale.js';

function messageFn() {
  return (_req: Request, res: Response) => {
    const lang = (_req as unknown as LocaleRequest).lang ?? 'vi';
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: translate(lang, 'error.RATE_LIMITED'),
      },
    });
  };
}

export const loginRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: messageFn(),
});

export const strictRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: messageFn(),
});

export const chatRateLimiter = rateLimit({
  windowMs: 10 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: messageFn(),
});

export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: messageFn(),
});

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: config.isProd ? 300 : 10000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: messageFn(),
});

export const bookingCooldownLimiter = rateLimit({
  windowMs: 15 * 1000, // 15 giây chống spam click liên tiếp
  limit: 1, // Mỗi user/IP chỉ được bấm đặt 1 đơn trong vòng 15 giây
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => {
    const user = (req as any).user;
    if (user && user.id) {
      return `cooldown_user_${user.id}`;
    }
    return `cooldown_ip_${req.ip || 'unknown'}`;
  },
  message: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Bạn vừa tạo một đơn đặt lịch. Vui lòng chờ 15 giây trước khi tiếp tục tạo đơn mới.',
      },
    });
  },
});

export const bookingRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 phút
  limit: 3, // Tối đa 3 lượt đặt lịch trong 5 phút trên mỗi user/IP
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => {
    const user = (req as any).user;
    if (user && user.id) {
      return `booking_user_${user.id}`;
    }
    return `booking_ip_${req.ip || 'unknown'}`;
  },
  message: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Bạn đã đạt giới hạn đặt lịch (tối đa 3 đơn / 5 phút). Vui lòng chờ ít phút trước khi thử lại.',
      },
    });
  },
});

export const telegramRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  limit: 10, // Tối đa 10 thao tác test/quét bot mỗi phút
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Bạn đang thao tác với Telegram bot quá nhanh. Vui lòng chờ 1 phút trước khi thử lại.',
      },
    });
  },
});