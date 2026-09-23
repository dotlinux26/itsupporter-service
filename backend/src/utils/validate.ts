import type { ZodType } from 'zod';
import { translate, type Locale } from './i18n.js';

export function validate<T>(schema: ZodType<T>, data: unknown): T {
  return schema.parse(data);
}

export function localizeField(field: string, lang: Locale): string {
  const map: Record<string, Record<'vi' | 'en', string>> = {
    email: { vi: 'Email', en: 'Email' },
    password: { vi: 'Mật khẩu', en: 'Password' },
    name: { vi: 'Họ tên', en: 'Full name' },
    phone: { vi: 'Số điện thoại', en: 'Phone number' },
  };
  const key = map[field];
  if (!key) return field;
  return key[lang];
}

export function invalidFieldMessage(field: string, lang: Locale): string {
  const name = localizeField(field, lang);
  const templates = translate(lang, 'error.VALIDATION_ERROR', { field: name });
  return `*${name}* — ${templates}`;
}

export function formatZodDetails(details: unknown, lang: Locale): unknown {
  return details;
}