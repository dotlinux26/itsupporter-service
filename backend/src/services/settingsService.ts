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
  teamName: string;
  university: string;
  workshopAddress: string;
  contactPhone: string;
  contactEmail: string;
  facebookPage: string;
  distributorName: string;
  distributorUrl: string;
  googleMapEmbedUrl: string;
  googleMapDirectUrl: string;
  workingHoursDisplay: string;
  bookingNotice: string;
  warrantyPolicyEnabled: boolean;
  warrantyPolicyDays: string;
  warrantyPolicyTitle: string;
  warrantyPolicyContent: string;
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
    teamName: readSetting('team_name', 'IT Supporter HaUI'),
    university: readSetting('university', 'Đại học Công nghiệp Hà Nội'),
    workshopAddress: readSetting('workshop_address', 'Phòng 1603, Tòa A1, Cơ sở 1 - Đại học Công nghiệp Hà Nội'),
    contactPhone: readSetting('contact_phone', '0981.234.567'),
    contactEmail: readSetting('contact_email', 'support@itsupporter.vn'),
    facebookPage: readSetting('facebook_page', 'https://www.facebook.com/itsupporter.haui/'),
    distributorName: readSetting('distributor_name', 'dotlinux26'),
    distributorUrl: readSetting('distributor_url', 'https://github.com/dotlinux26'),
    googleMapEmbedUrl: readSetting(
      'google_map_embed_url',
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3723.863985044336!2d105.7445984154024!3d21.05372429283389!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31345457e292d5bf%3A0x20ac91903d45e803!2zVHLGsOG7nW5nIMSQ4bqhaSBI4buNYyBDw7RuZyBOZ2hp4buHcCBIw6AgTuG7mWk!5e0!3m2!1svi!2s!4v1700000000000!5m2!1svi!2s'
    ),
    googleMapDirectUrl: readSetting('google_map_direct_url', 'https://maps.google.com/?q=21.053724,105.744598'),
    workingHoursDisplay: readSetting('working_hours_display', '07:00 - 19:00 (Thứ 2 - Thứ 7)'),
    bookingNotice: readSetting(
      'booking_notice',
      'Khách hàng đặt lịch trước tối thiểu 4 tiếng, sau đó mang máy tới trực tiếp phòng 1603 Tòa A1 để kỹ thuật viên kiểm tra & bảo dưỡng.'
    ),
    warrantyPolicyEnabled: readSetting('warranty_policy_enabled', 'false') === 'true',
    warrantyPolicyDays: readSetting('warranty_policy_days', '30 Ngày'),
    warrantyPolicyTitle: readSetting('warranty_policy_title', 'Bảo hành hỗ trợ kỹ thuật'),
    warrantyPolicyContent: readSetting(
      'warranty_policy_content',
      'Hỗ trợ kỹ thuật và kiểm tra lại miễn phí trong thời gian cam kết nếu máy phát sinh hiện tượng nóng lại hoặc lỗi sau vệ sinh.'
    ),
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