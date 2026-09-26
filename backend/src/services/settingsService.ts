import { getDb } from '../config/database.js';
import config from '../config/index.js';

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
  turnstileEnabled: boolean;
  turnstileSiteKey: string;
  turnstileSecret: string;
  telegramEnabled: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  telegramApiUrl: string;
}

export function getSystemSettings(): SystemSettings {
  const rows = getDb()
    .prepare('SELECT key, value FROM system_settings')
    .all() as Array<{ key: string; value: string }>;
  const map = new Map<string, string>(rows.map((r) => [r.key, r.value]));

  const getVal = (key: string, fallback: string): string => map.get(key) ?? fallback;

  return {
    latePenaltyMinutes: Number(getVal('late_penalty_minutes', '10')),
    latePenaltyPercent: Number(getVal('late_penalty_percent', '15')),
    freeServiceAfterMinutes: Number(getVal('free_service_after_minutes', '45')),
    workingStart: getVal('working_start', '07:00'),
    workingEnd: getVal('working_end', '19:00'),
    slotDurationMinutes: Number(getVal('slot_duration_minutes', '60')),
    timezone: getVal('timezone', 'Asia/Ho_Chi_Minh'),
    technicianSharePercent: Number(getVal('technician_share_percent', '70')),
    teamSharePercent: Number(getVal('team_share_percent', '30')),
    teamName: getVal('team_name', 'IT Supporter HaUI'),
    university: getVal('university', 'Đại học Công nghiệp Hà Nội'),
    workshopAddress: getVal('workshop_address', 'Phòng 1603, Tòa A1, Cơ sở 1 - Đại học Công nghiệp Hà Nội'),
    contactPhone: getVal('contact_phone', '0981.234.567'),
    contactEmail: getVal('contact_email', 'support@itsupporter.vn'),
    facebookPage: getVal('facebook_page', 'https://www.facebook.com/itsupporter.haui/'),
    distributorName: getVal('distributor_name', 'dotlinux26'),
    distributorUrl: getVal('distributor_url', 'https://github.com/dotlinux26'),
    googleMapEmbedUrl: getVal(
      'google_map_embed_url',
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3723.863985044336!2d105.7445984154024!3d21.05372429283389!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31345457e292d5bf%3A0x20ac91903d45e803!2zVHLGsOG7nW5nIMSQ4bqhaSBI4buNYyBDw7RuZyBOZ2hp4buHcCBIw6AgTuG7mWk!5e0!3m2!1svi!2s!4v1700000000000!5m2!1svi!2s'
    ),
    googleMapDirectUrl: getVal('google_map_direct_url', 'https://maps.google.com/?q=21.053724,105.744598'),
    workingHoursDisplay: getVal('working_hours_display', '07:00 - 19:00 (Thứ 2 - Thứ 7)'),
    bookingNotice: getVal(
      'booking_notice',
      'Khách hàng đặt lịch trước tối thiểu 4 tiếng, sau đó mang máy tới trực tiếp phòng 1603 Tòa A1 để kỹ thuật viên kiểm tra & bảo dưỡng.'
    ),
    warrantyPolicyEnabled: getVal('warranty_policy_enabled', 'false') === 'true',
    warrantyPolicyDays: getVal('warranty_policy_days', '30 Ngày'),
    warrantyPolicyTitle: getVal('warranty_policy_title', 'Bảo hành hỗ trợ kỹ thuật'),
    warrantyPolicyContent: getVal(
      'warranty_policy_content',
      'Hỗ trợ kỹ thuật và kiểm tra lại miễn phí trong thời gian cam kết nếu máy phát sinh hiện tượng nóng lại hoặc lỗi sau vệ sinh.'
    ),
    turnstileEnabled: getVal('turnstile_enabled', String(config.turnstile.enabled)) === 'true',
    turnstileSiteKey: getVal('turnstile_site_key', config.turnstile.siteKey),
    turnstileSecret: getVal('turnstile_secret', config.turnstile.secret),
    telegramEnabled: getVal('telegram_enabled', String(config.telegram.enabled)) === 'true',
    telegramBotToken: getVal('telegram_bot_token', config.telegram.botToken),
    telegramChatId: getVal('telegram_chat_id', config.telegram.chatId),
    telegramApiUrl: getVal('telegram_api_url', config.telegram.apiUrl),
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