import config from '../config/index.js';

// Giờ Việt Nam (UTC+7) = giờ Hà Nội. IANA hợp lệ duy nhất: Asia/Ho_Chi_Minh
export const TIME_ZONE = config.timezone;

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export type HHMM = string; // "07:00"

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function todayInZone(): string {
  return dateFormatter.format(new Date()); // YYYY-MM-DD
}

export function nowTimeInZone(): HHMM {
  return timeFormatter.format(new Date());
}

/** "07:30" -> 450 (phiên bản phút trong ngày) */
export function timeToMinutes(t: HHMM): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function minutesToTime(mins: number): HHMM {
  const clamped = ((mins % 1440) + 1440) % 1440;
  return `${pad2(Math.floor(clamped / 60))}:${pad2(clamped % 60)}`;
}

export function addMinutesToTime(t: HHMM, minutes: number): HHMM {
  return minutesToTime(timeToMinutes(t) + minutes);
}

export function toISOWithZone(dateStr: string, timeStr: HHMM): Date {
  // "YYYY-MM-DD" + "HH:MM" -> Date đúng theo timezone HCM
  return new Date(`${dateStr}T${timeStr}:00+07:00`);
}

export function diffMinutes(start: HHMM, end: HHMM): number {
  return timeToMinutes(end) - timeToMinutes(start);
}

/** Ngày ISO +7 cách base ngày hiện tại bao nhiêu ngày (âm = quá khứ) */
export function daysFromToday(isoDate: string): number {
  const [y, m, d] = isoDate.split('-').map(Number);
  const target = new Date(Date.UTC(y, m - 1, d));
  const todayUtc = (() => {
    const parts = todayInZone().split('-').map(Number);
    return Date.UTC(parts[0], parts[1] - 1, parts[2]);
  })();
  return Math.round((target.getTime() - todayUtc) / 86400000);
}

export function weekdayOf(isoDate: string): number {
  // 1=Mon ... 7=Sun
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const jsDow = dt.getUTCDay(); // 0=Sun
  return jsDow === 0 ? 7 : jsDow;
}

/** 7 ngày từ thứ 2 của tuần chứa dateStr */
export function weekDaysStartingMonday(dateStr: string): string[] {
  const dow = weekdayOf(dateStr);
  const [y, m, d] = dateStr.split('-').map(Number);
  const mondayDate = new Date(Date.UTC(y, m - 1, d - (dow - 1)));
  const result: string[] = [];
  for (let i = 0; i < 7; i += 1) {
    const dt = new Date(mondayDate.getTime() + i * 86400000);
    result.push(dt.toISOString().slice(0, 10));
  }
  return result;
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

export function nowTimestamp(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}