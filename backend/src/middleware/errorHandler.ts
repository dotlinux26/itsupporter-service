import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';
import { translate } from '../utils/i18n.js';
import type { LocaleRequest } from './locale.js';

export const notFoundHandler: RequestHandler = (req, res) => {
  const lang = (req as LocaleRequest).lang ?? 'vi';
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: translate(lang, 'error.NOT_FOUND'),
      details: { route: `${req.method} ${req.originalUrl}` },
    },
  });
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const lang = (req as LocaleRequest).lang ?? 'vi';

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: translate(lang, 'error.VALIDATION_ERROR'),
        details: err.flatten(),
      },
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.localized(lang),
        details: err.details,
      },
    });
  }

  if (err instanceof Error && 'type' in err && (err as { type?: string }).type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: translate(lang, 'error.VALIDATION_ERROR') },
    });
  }

  logger.error({ err }, 'Unhandled error');

  if (config.isProd) {
    res.status(err instanceof AppError ? err.statusCode : 500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: translate(lang, 'error.INTERNAL_ERROR') },
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: translate(lang, 'error.INTERNAL_ERROR'),
      stack: err instanceof Error ? err.stack : undefined,
    },
  });
};