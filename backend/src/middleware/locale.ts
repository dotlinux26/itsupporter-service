import type { NextFunction, Request, Response } from 'express';
import { normalizeLocale, type Locale } from '../utils/i18n.js';

export interface LocaleRequest extends Request {
  lang: Locale;
  rawLang: string | undefined;
}

export function localeMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const accept = req.headers['accept-language'] as string | undefined;
  const cookieLang = (req as Request & { cookies?: Record<string, string> }).cookies?.lang;
  (req as LocaleRequest).rawLang = accept;
  (req as LocaleRequest).lang = normalizeLocale(cookieLang ?? accept);
  next();
}