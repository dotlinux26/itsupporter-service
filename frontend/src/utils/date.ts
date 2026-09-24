import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

/**
 * Safely parses any date string from SQLite/server into a local Date object.
 * SQLite stores UTC timestamps as "YYYY-MM-DD HH:MM:SS" without a "Z" suffix.
 * When a browser's `new Date()` parses a string without "Z", it mistakenly treats
 * it as local time, causing it to be off by 7 hours in Vietnam (UTC+7).
 * This helper normalizes it to UTC ISO format ("YYYY-MM-DDTHH:MM:SSZ") so the browser
 * automatically converts it to the user's correct local timezone.
 */
export function parseServerDate(dateStr?: string | null): Date {
  if (!dateStr) return new Date();
  const trimmed = dateStr.trim();
  // Already has Z or timezone offset (+07:00, -05:00, etc.)
  if (trimmed.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(trimmed)) {
    return new Date(trimmed);
  }
  // SQLite format "YYYY-MM-DD HH:MM:SS" -> treat as UTC
  const normalized = (trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T')) + 'Z';
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? new Date(trimmed) : d;
}

/**
 * Formats a server date string into localized Vietnam date & time.
 * E.g., "dd/MM/yyyy HH:mm:ss"
 */
export function formatVietnamTime(
  dateStr?: string | null,
  pattern: string = 'dd/MM/yyyy HH:mm:ss'
): string {
  if (!dateStr) return '';
  try {
    const d = parseServerDate(dateStr);
    return format(d, pattern, { locale: vi });
  } catch {
    return dateStr;
  }
}
