import { getDb } from '../config/database.js';

export interface SystemSettings {
  latePenaltyMinutes: number;
  latePenaltyPercent: number;
  freeServiceAfterMinutes: number;
  workingStart: string;
  workingEnd: string;
  slotDurationMinutes: number;
  timezone: string;
  technicianSharePercent: number;
  teamSharePercent: number;
}

function readSetting(key: string, fallback: string): string {
  const row = getDb()
    .prepare('SELECT value FROM system_settings WHERE key = ?')
    .get(key) as { value: string } | undefined;
  return row?.value ?? fallback;
}

export function getSystemSettings(): SystemSettings {
  return {
    latePenaltyMinutes: Number(readSetting('late_penalty_minutes', '10')),
    latePenaltyPercent: Number(readSetting('late_penalty_percent', '15')),
    freeServiceAfterMinutes: Number(readSetting('free_service_after_minutes', '45')),
    workingStart: readSetting('working_start', '07:00'),
    workingEnd: readSetting('working_end', '19:00'),
    slotDurationMinutes: Number(readSetting('slot_duration_minutes', '60')),
    timezone: readSetting('timezone', 'Asia/Ho_Chi_Minh'),
    technicianSharePercent: Number(readSetting('technician_share_percent', '70')),
    teamSharePercent: Number(readSetting('team_share_percent', '30')),
  };
}

export function setSetting(key: string, value: string, updatedBy?: number): void {
  getDb()
    .prepare(
      `INSERT INTO system_settings (key, value, description, updated_by, updated_at)
       VALUES (?, ?, '', ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_by = excluded.updated_by, updated_at = datetime('now')`
    )
    .run(key, value, updatedBy ?? null);
}

export function listSettings(): Array<{ key: string; value: string; description: string }> {
  return getDb()
    .prepare('SELECT key, value, description FROM system_settings ORDER BY key')
    .all() as Array<{ key: string; value: string; description: string }>;
}