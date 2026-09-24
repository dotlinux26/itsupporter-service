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