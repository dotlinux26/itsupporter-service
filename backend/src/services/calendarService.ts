import { getDb } from '../config/database.js';
import { getSystemSettings } from './settingsService.js';
import {
  addMinutesToTime,
  weekdayOf,
  weekDaysStartingMonday,
} from '../utils/dateTime.js';

export interface TechnicianBrief {
  id: number;
  name: string;
  avatar_url: string | null;
  bio: string | null;
}

export interface SlotBrief {
  time: string; // "07:00"
  end_time: string; // "08:00"
  available: boolean;
  technicians: TechnicianBrief[];
}

export interface DaySlots {
  date: string; // YYYY-MM-DD
  day_of_week: number; // 1=Mon..7=Sun
  slots: SlotBrief[];
}

export function buildSlots(): Array<{ start: string; end: string }> {
  const s = getSystemSettings();
  const slots: Array<{ start: string; end: string }> = [];
  let cur = s.workingStart;
  while (cur < s.workingEnd) {
    const end = addMinutesToTime(cur, s.slotDurationMinutes);
    if (end > s.workingEnd) break;
    slots.push({ start: cur, end });
    cur = end;
  }
  return slots;
}

export function getActiveTechIds(): number[] {
  return (
    getDb()
      .prepare("SELECT u.id FROM users u WHERE u.role = 'TECHNICIAN' AND u.status = 'ACTIVE' AND u.is_deleted = 0")
      .all() as { id: number }[]
  ).map((r) => r.id);
}

/** Technician có thể phục vụ slot (date + start) hay không. */
export function isTechnicianAvailable(techId: number, date: string, start: string): boolean {
  const db = getDb();
  const dow = weekdayOf(date);

  const schedule = db
    .prepare(
      `SELECT start_time, end_time, slots FROM technician_schedules
       WHERE technician_id = ? AND day_of_week = ? AND is_active = 1`
    )
    .get(techId, dow) as { start_time: string; end_time: string; slots?: string | null } | undefined;

  if (!schedule) {
    return false;
  }

  // If specific slots JSON array is configured, check if 'start' is in the ticked slots
  if (schedule.slots) {
    try {
      const parsedSlots = JSON.parse(schedule.slots);
      if (Array.isArray(parsedSlots)) {
        if (!parsedSlots.includes(start)) {
          return false;
        }
      }
    } catch {
      if (start < schedule.start_time || start >= schedule.end_time) {
        return false;
      }
    }
  } else {
    if (start < schedule.start_time || start >= schedule.end_time) {
      return false;
    }
  }

  // Override theo ngày
  const override = db
    .prepare(
      `SELECT status FROM technicians_availability WHERE technician_id = ? AND date = ? AND start_time = ?`
    )
    .get(techId, date, start) as { status: string } | undefined;
  if (override && override.status !== 'AVAILABLE') {
    return false;
  }

  // Không trùng đơn trong thời gian đó
  const conflicting = db
    .prepare(
      `SELECT id FROM orders
       WHERE technician_id = ? AND scheduled_date = ? AND scheduled_start = ?
         AND status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS')`
    )
    .get(techId, date, start);
  if (conflicting) {
    return false;
  }

  return true;
}

export function getAvailableTechnicians(date: string, start: string): TechnicianBrief[] {
  const ids = getActiveTechIds().filter((id) => isTechnicianAvailable(id, date, start));
  if (ids.length === 0) return [];

  const placeholders = ids.map(() => '?').join(',');
  return getDb()
    .prepare(
      `SELECT u.id, u.name, u.avatar_url, tp.bio, tp.public_profile,
              ROUND(COALESCE(AVG(r.rating), 0), 1) AS rating,
              COUNT(r.id) AS rating_count
       FROM users u
       LEFT JOIN technician_profiles tp ON tp.user_id = u.id
       LEFT JOIN reviews r ON r.technician_id = u.id
       WHERE u.id IN (${placeholders})
       GROUP BY u.id`
    )
    .all(...ids) as TechnicianBrief[];
}

/** Lịch 7 ngày (T2-CN) cho tuần chứa dateStr. */
export function getWeekCalendar(dateStr: string): DaySlots[] {
  const days = weekDaysStartingMonday(dateStr);
  const slots = buildSlots();

  return days.map((date) => ({
    date,
    day_of_week: weekdayOf(date),
    slots: slots.map((slot) => {
      const technicians = getAvailableTechnicians(date, slot.start);
      return {
        time: slot.start,
        end_time: slot.end,
        available: technicians.length > 0,
        technicians,
      };
    }),
  }));
}

export function generateOrderCode(id: number): string {
  return `ORD-${String(id).padStart(6, '0')}`;
}

export function generateTransactionCode(prefix: string, id: number): string {
  return `${prefix}-${new Date().getFullYear()}${String(id).padStart(6, '0')}`;
}

export function generateSettlementCode(id: number): string {
  return `SETTLE-${String(id).padStart(6, '0')}`;
}