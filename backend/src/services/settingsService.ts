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
  aboutMarkdown: string;
  termsMarkdown: string;
  totpGuideMarkdown: string;
  totpGuideVideoUrl: string;
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
    aboutMarkdown: getVal(
      'about_markdown',
      `# Về chúng tôi - IT Supporter HaUI

Đội ngũ kỹ thuật viên sinh viên nhiệt huyết, được đào tạo bài bản về vệ sinh và bảo dưỡng phần cứng PC/Laptop tại Đại học Công nghiệp Hà Nội.

### Giới thiệu dịch vụ
IT Supporter HaUI là dịch vụ vệ sinh, bảo trì máy tính chuyên nghiệp, giúp khách hàng dễ dàng đặt lịch trước online và mang máy tới phòng làm việc để kỹ thuật viên kiểm tra & xử lý trực tiếp.

### Đội ngũ & Vận hành
Dự án được xây dựng và vận hành bởi Đội IT Supporter HaUI (Đại học Công nghiệp Hà Nội) - tập hợp các kỹ thuật viên sinh viên nhiệt huyết, được đào tạo bài bản về kỹ thuật máy tính, quy trình tháo lắp chống tĩnh điện và bảo trì phần cứng PC/Laptop chuyên nghiệp.

### Mục đích
Cung cấp dịch vụ IT chất lượng cao, minh bạch, công bằng cho cả khách hàng và kỹ thuật viên. Xây dựng hệ sinh thái dịch vụ IT tin cậy, chuyên nghiệp tại Việt Nam.

### Dịch vụ
- Vệ sinh máy tính cơ bản và cao cấp
- Tra keo tản nhiệt (gốm cao cấp / kim loại lỏng)
- Kiểm tra tình trạng phần cứng & Stress-test nhiệt độ
- Kiểm tra và cài đặt phần mềm
- Hỗ trợ làm sạch hệ thống, cài đặt phần mềm theo yêu cầu`
    ),
    termsMarkdown: getVal(
      'terms_markdown',
      `# Quy định & Cam kết dịch vụ

Các điều khoản minh bạch, quyền lợi và cam kết phục vụ chuẩn xác giữa khách hàng và kỹ thuật viên.

### Dành cho khách hàng
- **Quy định đặt lịch**: Khách hàng cần đặt lịch trước tối thiểu 4 tiếng và tối đa 30 ngày để đảm bảo kỹ thuật viên chuẩn bị đầy đủ trang thiết bị và vật tư chuyên dụng.
- **Quy định đổi lịch**: Có thể đổi lịch tối thiểu 2 tiếng trước giờ hẹn, tùy theo tình trạng trống lịch của kỹ thuật viên.
- **Quy định hủy đơn**: Hủy miễn phí nếu hủy trước 2 tiếng. Hủy sau 2 tiếng sẽ bị tính phí dịch chuyển 15% giá trị đơn.
- **Cam kết đúng giờ & Phạt vi phạm**:
  - Đến muộn 10 – 29 phút: Giảm ngay 15% tổng giá trị đơn hàng.
  - Đến muộn ≥ 30 phút: MIỄN PHÍ 100% (0 VNĐ) cho khách hàng. Kỹ thuật viên/Hệ thống kích hoạt chế độ vi phạm để kết toán 0 đồng.
- **Quy định Voucher & Khuyến mãi**:
  - Chương trình khuyến mãi chung (Sale Event): Được áp dụng trực tiếp tại ca làm việc.
  - Mã Voucher quà tặng (Gift Voucher): Mã quà tặng dùng 1 lần nhận qua khung chat hoặc email, có thể cộng dồn ưu đãi tri ân khách hàng thân thiết.
- **Quy định thanh toán**: Thanh toán chuyển khoản qua mã QR Ngân hàng VietQR chuẩn xác hoặc tiền mặt ngay khi hoàn thành dịch vụ.
- **Quy định sử dụng dịch vụ**: Khách hàng chuẩn bị máy tính tại vị trí có ổ cắm điện và ánh sáng thuận tiện.
- **Quy định đánh giá**: Khách hàng có thể viết đánh giá kèm nội dung Markdown sau khi đơn hoàn tất (1-5 sao).

### Dành cho kỹ thuật viên
- **Quy định nhận đơn**: Kỹ thuật viên chỉ nhận đơn khi có mặt trong ca trực và sẵn sàng trước giờ hẹn.
- **Quy định tác phong & Giờ giấc**: Phải có mặt đúng giờ hẹn. Nếu trễ từ 10 - 29 phút bị giảm 15% doanh thu ca. Nếu trễ ≥ 30 phút, kỹ thuật viên có trách nhiệm bấm xác nhận vi phạm làm MIỄN PHÍ 100% cho khách hàng.
- **Quy định thực hiện đơn**: Thực hiện theo đúng quy trình 9 bước vệ sinh, chống tĩnh điện ESD, tra keo tản nhiệt chất lượng cao.
- **Quy định Voucher & Khuyến mãi**: Nhập chính xác mã Voucher do khách hàng cung cấp (hệ thống sẽ lập tức gạch mã dùng 1 lần) và gửi tặng Voucher tri ân qua khung chat sau khi nghiệm thu.
- **Quy định thanh toán**: Thu đúng số tiền cuối cùng hiển thị trên đơn, hiển thị mã VietQR cho khách quét và cập nhật trạng thái thanh toán ngay khi có xác nhận.
- **Quy định trách nhiệm**: Chịu trách nhiệm bảo dưỡng toàn diện, bảo đảm an toàn dữ liệu và phần cứng của khách.`
    ),
    totpGuideMarkdown: getVal(
      'totp_guide_markdown',
      `# Hướng dẫn Cài đặt & Sử dụng Google Authenticator (TOTP)

Hệ thống IT Supporter sử dụng chuẩn toán học mã hóa một lần TOTP (RFC 6238) để bảo vệ tài khoản và khôi phục mật khẩu mà không phụ thuộc vào hệ thống gửi Email.

---

### Bước 1: Tải ứng dụng Authenticator về điện thoại
- **Android**: Vào Google Play Store tìm và cài đặt **Google Authenticator** (hoặc Microsoft Authenticator).
- **iOS (iPhone/iPad)**: Vào Apple App Store tìm và cài đặt **Google Authenticator**.

---

### Bước 2: Quét mã QR hoặc Nhập khóa thiết lập
1. Mở ứng dụng Google Authenticator trên điện thoại.
2. Bấm vào biểu tượng dấu cộng **(+)** ở góc dưới màn hình.
3. Chọn **Quét mã QR** và hướng camera vào mã QR đang hiển thị trên màn hình máy tính.
4. *(Nếu camera hỏng hoặc không quét được)*: Chọn **Nhập khóa thiết lập (Enter setup key)**, nhập Tên tài khoản và dán dãy ký tự Khóa bí mật (Secret Key) được cung cấp.

---

### Bước 3: Lưu lại Bộ mã dự phòng (Backup Codes)
- Khi kích hoạt, hệ thống sẽ cấp cho bạn **8 mã dự phòng (định dạng XXXX-XXXX)**.
- Tải file text về máy tính hoặc chép ra sổ tay an toàn. Mỗi mã chỉ dùng được 1 lần duy nhất trong trường hợp điện thoại bị mất hoặc hỏng.

---

### Bước 4: Khắc phục lỗi lệch giờ (Lỗi nhập đúng số nhưng báo sai)
Mã 6 chữ số thay đổi mỗi 30 giây dựa trên đồng hồ thời gian chuẩn. Nếu mã luôn báo không hợp lệ:
1. Đảm bảo điện thoại của bạn đang bật chế độ **"Đặt giờ tự động (Set time automatically)"** theo mạng.
2. Trên Android: Mở Google Authenticator -> bấm menu 3 chấm -> **Cài đặt** -> **Đồng bộ hóa thời gian** -> **Đồng bộ ngay (Sync now)**.`
    ),
    totpGuideVideoUrl: getVal('totp_guide_video_url', 'https://www.youtube-nocookie.com/embed/n4sM0fK6n8A?autoplay=1'),
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