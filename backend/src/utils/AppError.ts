import { translate, type Locale, type TranslationKey } from './i18n.js';

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'SLOT_NOT_AVAILABLE'
  | 'ORDER_ALREADY_BOOKED'
  | 'INVALID_STATUS_TRANSITION'
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_DISABLED'
  | 'RATE_LIMITED'
  | 'UPLOAD_ERROR'
  | 'INTERNAL_ERROR'
  | 'PAYMENT_REQUIRED'
  | 'PRE_CONDITION_FAILED';

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;
  readonly details?: unknown;
  readonly key?: TranslationKey;
  readonly params?: Record<string, string | number>;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode = 400,
    details?: unknown,
    key?: TranslationKey,
    params?: Record<string, string | number>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.key = key;
    this.params = params;
  }

  localized(locale: Locale): string {
    if (this.key) {
      return translate(locale, this.key, this.params);
    }
    return this.message;
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Yêu cầu không hợp lệ.', code: ErrorCode = 'VALIDATION_ERROR', details?: unknown) {
    super(code, message, 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message?: string) {
    super('UNAUTHORIZED', message ?? '', 401, undefined, 'error.UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message?: string) {
    super('FORBIDDEN', message ?? '', 403, undefined, 'error.FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Không tìm thấy tài nguyên.') {
    super('NOT_FOUND', message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Xung đột với dữ liệu hiện tại.', code: ErrorCode = 'CONFLICT') {
    super(code, message, 409);
  }
}