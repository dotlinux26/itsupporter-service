import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { adminApi } from '../../api/client';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Facebook,
  ShieldAlert, 
  ShieldCheck,
  Save, 
  CheckCircle2, 
  ExternalLink,
  Send,
  Bot,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Shield,
  FileText
} from 'lucide-react';
import { MarkdownEditorWithUpload } from '../../components/MarkdownEditorWithUpload';

const DEFAULT_ABOUT_MD = `# Về chúng tôi - IT Supporter HaUI

Đội ngũ kỹ thuật viên sinh viên nhiệt huyết, được đào tạo bài bản về vệ sinh và bảo dưỡng phần cứng PC/Laptop tại Đại học Công nghiệp Hà Nội.

### Giới thiệu dịch vụ
IT Supporter HaUI là dịch vụ vệ sinh, bảo trì máy tính chuyên nghiệp, giúp khách hàng dễ dàng đặt lịch trước online và mang máy tới phòng làm việc để kỹ thuật viên kiểm tra & xử lý trực tiếp.

### Đội ngũ & Vận hành
Dự án được xây dựng và vận hành bởi Đội IT Supporter HaUI (Đại học Công nghiệp Hà Nội) - tập hợp các kỹ thuật viên sinh viên nhiệt huyết, được đào tạo bài bản về kỹ thuật máy tính, quy trình tháo lắp chống tĩnh điện và bảo trì phần cứng PC/Laptop chuyên nghiệp.

### Mục đích
Cung cấp dịch vụ IT chất lượng cao, minh bạch, công bằng cho cả khách hàng và kỹ thuật viên. Xây dựng hệ sinh thái dịch vụ IT tin cậy, chuyên nghiệp tại Việt Nam.

### Dịch vụ
• Vệ sinh máy tính cơ bản và cao cấp
• Tra keo tản nhiệt (gốm cao cấp / kim loại lỏng)
• Kiểm tra tình trạng phần cứng & Stress-test nhiệt độ
• Kiểm tra và cài đặt phần mềm
• Hỗ trợ làm sạch hệ thống, cài đặt phần mềm theo yêu cầu`;

const DEFAULT_TERMS_MD = `# Quy định & Cam kết dịch vụ

Các điều khoản minh bạch, quyền lợi và cam kết phục vụ chuẩn xác giữa khách hàng và kỹ thuật viên.

### Dành cho khách hàng
• Quy định đặt lịch: Khách hàng cần đặt lịch trước tối thiểu 4 tiếng và tối đa 30 ngày để đảm bảo kỹ thuật viên chuẩn bị đầy đủ trang thiết bị và vật tư chuyên dụng.
• Quy định đổi lịch: Có thể đổi lịch tối thiểu 2 tiếng trước giờ hẹn, tùy theo tình trạng trống lịch của kỹ thuật viên.
• Quy định hủy đơn: Hủy miễn phí nếu hủy trước 2 tiếng. Hủy sau 2 tiếng sẽ bị tính phí dịch chuyển 15% giá trị đơn.
• Cam kết đúng giờ & Phạt vi phạm:
  - Đến muộn 10 – 29 phút: Giảm ngay 15% tổng giá trị đơn hàng.
  - Đến muộn ≥ 30 phút: MIỄN PHÍ 100% (0 VNĐ) cho khách hàng. Kỹ thuật viên/Hệ thống kích hoạt chế độ vi phạm để kết toán 0 đồng.
• Quy định Voucher & Khuyến mãi:
  - Chương trình khuyến mãi chung (Sale Event): Được áp dụng trực tiếp tại ca làm việc.
  - Mã Voucher quà tặng (Gift Voucher): Mã quà tặng dùng 1 lần nhận qua khung chat hoặc email, có thể cộng dồn ưu đãi tri ân khách hàng.
• Thanh toán & Hoàn tất: Khách hàng thanh toán sau khi máy tính đã hoàn thành và kiểm tra hài lòng. Hỗ trợ quét mã QR chuyển khoản hoặc tiền mặt.

### Dành cho kỹ thuật viên
• Tiếp nhận đơn: Kỹ thuật viên kiểm tra tình trạng máy kỹ lưỡng trước khi thao tác, ghi nhận lỗi và chụp ảnh lưu trữ.
• Đúng giờ: Luôn có mặt tại phòng làm việc trước giờ hẹn ít nhất 10 phút để sẵn sàng trang thiết bị chống tĩnh điện và dụng cụ.
• Trách nhiệm: Thực hiện chuẩn xác quy trình vệ sinh, tra keo tản nhiệt và stress-test nhiệt độ trước khi bàn giao.`;

const DEFAULT_TOTP_GUIDE_MD = `# Hướng dẫn Cài đặt & Sử dụng Google Authenticator (TOTP)

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
2. Trên Android: Mở Google Authenticator -> bấm menu 3 chấm -> **Cài đặt** -> **Đồng bộ hóa thời gian** -> **Đồng bộ ngay (Sync now)**.`;

export function AdminSettings() {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Markdown editor state
  const [markdownTab, setMarkdownTab] = useState<'about' | 'terms' | 'totpGuide'>('about');

  // Telegram test & detect state
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [telegramTestResult, setTelegramTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [detectingChatId, setDetectingChatId] = useState(false);
  const [detectedChatResult, setDetectedChatResult] = useState<{ success: boolean; message: string; chatId?: string; title?: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await adminApi.settings();
      setSettings(response.data.data || {});
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await adminApi.updateSettings(settings);
      if (res.data?.data) {
        setSettings(res.data.data);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert(isEn ? 'Failed to save settings. Please try again!' : 'Không thể lưu cài đặt. Vui lòng thử lại!');
    } finally {
      setSaving(false);
    }
  };

  const handleTestTelegram = async () => {
    setTestingTelegram(true);
    setTelegramTestResult(null);
    try {
      const res = await adminApi.testTelegram(settings.telegramChatId);
      setTelegramTestResult({
        success: true,
        message: res.data?.message || (isEn ? 'Sent test message successfully!' : 'Bắn tin nhắn test thành công!'),
      });
    } catch (error: any) {
      setTelegramTestResult({
        success: false,
        message: error.response?.data?.error?.message || error.response?.data?.message || (isEn ? 'Failed to send test alert.' : 'Gửi tin nhắn test thất bại.'),
      });
    } finally {
      setTestingTelegram(false);
    }
  };

  const handleDetectChatId = async () => {
    setDetectingChatId(true);
    setDetectedChatResult(null);
    try {
      const res = await adminApi.detectTelegramChatId();
      if (res.data?.data?.chatId) {
        setSettings((prev: any) => ({ ...prev, telegramChatId: res.data.data.chatId }));
        setDetectedChatResult({
          success: true,
          message: res.data.message,
          chatId: res.data.data.chatId,
          title: res.data.data.chatTitle,
        });
      } else {
        setDetectedChatResult({
          success: false,
          message: res.data?.message || (isEn ? 'No Chat ID found.' : 'Không tìm thấy Chat ID.'),
        });
      }
    } catch (error: any) {
      setDetectedChatResult({
        success: false,
        message: error.response?.data?.error?.message || error.response?.data?.message || (isEn ? 'Error scanning for Chat ID.' : 'Lỗi khi quét Chat ID.'),
      });
    } finally {
      setDetectingChatId(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 sm:py-8 md:py-12 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-1/3"></div>
          <div className="card p-6 space-y-4">
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="h-10 bg-slate-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5 sm:py-8 md:py-12 max-w-4xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{t('admin.settingsTitle')}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {t('admin.settingsSubtitle')}
          </p>
        </div>
        {saveSuccess && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-sm font-medium animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{t('settings.settingsSaved')}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECTION 1: CƠ SỞ & TIẾP NHẬN MÁY */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 text-slate-900 font-bold text-base">
            <Building2 className="w-5 h-5 text-orange-600" />
            <span>{t('admin.contactSettings')}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('admin.teamNameLabel')}</label>
              <input
                type="text"
                value={settings.teamName ?? 'IT Supporter HaUI'}
                onChange={e => setSettings((prev: any) => ({ ...prev, teamName: e.target.value }))}
                className="input w-full"
                placeholder={isEn ? "e.g. IT Supporter HaUI" : "VD: IT Supporter HaUI"}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('admin.universityLabel')}</label>
              <input
                type="text"
                value={settings.university ?? (isEn ? 'Hanoi University of Industry' : 'Đại học Công nghiệp Hà Nội')}
                onChange={e => setSettings((prev: any) => ({ ...prev, university: e.target.value }))}
                className="input w-full"
                placeholder={isEn ? "e.g. Hanoi University of Industry" : "VD: Đại học Công nghiệp Hà Nội"}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('admin.workshopAddressLabel')}
              </label>
              <input
                type="text"
                value={settings.workshopAddress ?? 'Phòng 1603, Tòa A1, Cơ sở 1 - Đại học Công nghiệp Hà Nội'}
                onChange={e => setSettings((prev: any) => ({ ...prev, workshopAddress: e.target.value }))}
                className="input w-full"
                placeholder={isEn ? "e.g. Room 1603, Building A1, HaUI" : "VD: Phòng 1603, Tòa A1, Cơ sở 1 - Đại học Công nghiệp Hà Nội"}
              />
              <p className="text-xs text-slate-500 mt-1">
                {t('admin.workshopAddressDesc')}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('admin.workingHoursLabel')}</label>
              <input
                type="text"
                value={settings.workingHoursDisplay ?? '07:00 - 19:00 (Thứ 2 - Thứ 7)'}
                onChange={e => setSettings((prev: any) => ({ ...prev, workingHoursDisplay: e.target.value }))}
                className="input w-full"
                placeholder={isEn ? "e.g. 07:00 - 19:00 (Mon - Sat)" : "VD: 07:00 - 19:00 (Thứ 2 - Thứ 7)"}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('admin.timezoneLabel')}</label>
              <input
                type="text"
                value={settings.timezone ?? 'Asia/Ho_Chi_Minh'}
                onChange={e => setSettings((prev: any) => ({ ...prev, timezone: e.target.value }))}
                className="input w-full font-mono text-xs"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('admin.bookingNoticeLabel')}
              </label>
              <textarea
                rows={2}
                value={settings.bookingNotice ?? 'Khách hàng đặt lịch trước tối thiểu 4 tiếng, sau đó mang máy tới phòng 1603 Tòa A1 để kỹ thuật viên kiểm tra & bảo dưỡng trực tiếp.'}
                onChange={e => setSettings((prev: any) => ({ ...prev, bookingNotice: e.target.value }))}
                className="input w-full py-2"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: LIÊN HỆ & KÊNH CHÍNH THỨC */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 text-slate-900 font-bold text-base">
            <Phone className="w-5 h-5 text-blue-600" />
            <span>{t('admin.channelsAndDistributor')}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-500" /> {t('admin.hotlineLabel')}
              </label>
              <input
                type="text"
                value={settings.contactPhone ?? '0981.234.567'}
                onChange={e => setSettings((prev: any) => ({ ...prev, contactPhone: e.target.value }))}
                className="input w-full"
                placeholder="0981.234.567"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" /> {t('admin.emailSupportLabel')}
              </label>
              <input
                type="email"
                value={settings.contactEmail ?? 'support@itsupporter.vn'}
                onChange={e => setSettings((prev: any) => ({ ...prev, contactEmail: e.target.value }))}
                className="input w-full"
                placeholder="support@itsupporter.vn"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Facebook className="w-3.5 h-3.5 text-blue-600" /> {t('admin.facebookPageLabel')}
              </label>
              <input
                type="url"
                value={settings.facebookPage ?? 'https://www.facebook.com/itsupporter.haui/'}
                onChange={e => setSettings((prev: any) => ({ ...prev, facebookPage: e.target.value }))}
                className="input w-full"
                placeholder="https://www.facebook.com/itsupporter.haui/"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('admin.distributorNameLabel')}</label>
              <input
                type="text"
                value={settings.distributorName ?? 'dotlinux26'}
                onChange={e => setSettings((prev: any) => ({ ...prev, distributorName: e.target.value }))}
                className="input w-full"
                placeholder="dotlinux26"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" /> {t('admin.distributorUrlLabel')}
              </label>
              <input
                type="url"
                value={settings.distributorUrl ?? 'https://github.com/dotlinux26'}
                onChange={e => setSettings((prev: any) => ({ ...prev, distributorUrl: e.target.value }))}
                className="input w-full"
                placeholder="https://github.com/dotlinux26"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: BẢN ĐỒ GOOGLE MAPS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 text-slate-900 font-bold text-base">
            <MapPin className="w-5 h-5 text-emerald-600" />
            <span>{t('admin.googleMapsIntegration')}</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('admin.googleMapEmbedUrlLabel')}
              </label>
              <input
                type="text"
                value={settings.googleMapEmbedUrl ?? ''}
                onChange={e => setSettings((prev: any) => ({ ...prev, googleMapEmbedUrl: e.target.value }))}
                className="input w-full font-mono text-xs"
                placeholder="https://www.google.com/maps/embed?..."
              />
              <p className="text-xs text-slate-500 mt-1">
                {t('admin.googleMapEmbedUrlDesc')}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('admin.googleMapDirectUrlLabel')}
              </label>
              <input
                type="url"
                value={settings.googleMapDirectUrl ?? ''}
                onChange={e => setSettings((prev: any) => ({ ...prev, googleMapDirectUrl: e.target.value }))}
                className="input w-full font-mono text-xs"
                placeholder="https://maps.google.com/?q=..."
              />
            </div>

            {settings.googleMapEmbedUrl && (
              <div className="mt-3">
                <span className="block text-xs font-medium text-slate-500 mb-1.5">{t('admin.previewEmbeddedMap')}</span>
                <div className="w-full h-48 rounded-xl overflow-hidden border border-slate-200">
                  <iframe
                    title="Google Maps Preview"
                    src={settings.googleMapEmbedUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 4: CHÍNH SÁCH GIỜ GIẤC & PHẠT KỸ THUẬT VIÊN */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 text-slate-900 font-bold text-base">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <span>{t('admin.timingAndPenaltyPolicy')}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('settings.latePenaltyMinutes')}</label>
              <input
                type="number"
                value={settings.latePenaltyMinutes || 10}
                onChange={e => setSettings((prev: any) => ({ ...prev, latePenaltyMinutes: Number(e.target.value) }))}
                className="input w-full"
              />
              <span className="text-[11px] text-slate-500">{isEn ? 'Late beyond this threshold deducts payout %' : 'Trễ từ mốc này sẽ bị trừ % doanh thu'}</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('settings.latePenaltyPercent')}</label>
              <input
                type="number"
                value={settings.latePenaltyPercent || 15}
                onChange={e => setSettings((prev: any) => ({ ...prev, latePenaltyPercent: Number(e.target.value) }))}
                className="input w-full"
              />
              <span className="text-[11px] text-slate-500">{isEn ? 'Default: 15% deduction' : 'Mặc định trừ 15%'}</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('settings.freeServiceMinutes')}</label>
              <input
                type="number"
                value={settings.freeServiceAfterMinutes || 30}
                onChange={e => setSettings((prev: any) => ({ ...prev, freeServiceAfterMinutes: Number(e.target.value) }))}
                className="input w-full font-bold text-orange-600"
              />
              <span className="text-[11px] text-slate-500">{isEn ? 'Late > 30 mins: 100% FREE (0 VND)' : 'Quy định muộn > 30p làm FREE (0đ)'}</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('settings.workingStart')}</label>
              <input
                type="time"
                value={settings.workingStart || '07:00'}
                onChange={e => setSettings((prev: any) => ({ ...prev, workingStart: e.target.value }))}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('settings.workingEnd')}</label>
              <input
                type="time"
                value={settings.workingEnd || '19:00'}
                onChange={e => setSettings((prev: any) => ({ ...prev, workingEnd: e.target.value }))}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('settings.slotDuration')}</label>
              <input
                type="number"
                value={settings.slotDurationMinutes || 60}
                onChange={e => setSettings((prev: any) => ({ ...prev, slotDurationMinutes: Number(e.target.value) }))}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('settings.technicianShare')}</label>
              <input
                type="number"
                value={settings.technicianSharePercent || 70}
                onChange={e => setSettings((prev: any) => ({ ...prev, technicianSharePercent: Number(e.target.value) }))}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('settings.teamShare')}</label>
              <input
                type="number"
                value={settings.teamSharePercent || 30}
                onChange={e => setSettings((prev: any) => ({ ...prev, teamSharePercent: Number(e.target.value) }))}
                className="input w-full"
              />
            </div>
          </div>
        </div>

        {/* SECTION 5: CHÍNH SÁCH BẢO HÀNH & HỖ TRỢ KỸ THUẬT */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>{t('admin.warrantyPolicy')}</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.warrantyPolicyEnabled === true || settings.warrantyPolicyEnabled === 'true'}
                onChange={e => setSettings((prev: any) => ({ ...prev, warrantyPolicyEnabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              <span className="ml-3 text-xs font-semibold text-slate-700">
                {settings.warrantyPolicyEnabled === true || settings.warrantyPolicyEnabled === 'true' ? t('admin.activeShowing') : t('admin.inactiveHidden')}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('admin.warrantyPolicyTitleLabel')}</label>
              <input
                type="text"
                value={settings.warrantyPolicyTitle ?? 'Bảo hành hỗ trợ kỹ thuật'}
                onChange={e => setSettings((prev: any) => ({ ...prev, warrantyPolicyTitle: e.target.value }))}
                className="input w-full"
                placeholder={isEn ? "e.g. Warranty & Tech Support" : "VD: Bảo hành hỗ trợ kỹ thuật"}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('admin.warrantyPolicyDaysLabel')}</label>
              <input
                type="text"
                value={settings.warrantyPolicyDays ?? '30 Ngày'}
                onChange={e => setSettings((prev: any) => ({ ...prev, warrantyPolicyDays: e.target.value }))}
                className="input w-full"
                placeholder={isEn ? "e.g. 30 Days" : "VD: 30 Ngày"}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('admin.warrantyPolicyContentLabel')}</label>
              <textarea
                rows={2}
                value={settings.warrantyPolicyContent ?? ''}
                onChange={e => setSettings((prev: any) => ({ ...prev, warrantyPolicyContent: e.target.value }))}
                className="input w-full"
                placeholder={isEn ? "Free re-inspection and support during commitment period if overheating occurs..." : "Hỗ trợ kỹ thuật và kiểm tra lại miễn phí trong thời gian cam kết nếu máy phát sinh hiện tượng nóng lại hoặc lỗi sau vệ sinh..."}
              />
            </div>
          </div>
        </div>

        {/* SECTION 6: BẢO MẬT & CHỐNG SPAM BOT (CLOUDFLARE TURNSTILE) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base">
              <Shield className="w-5 h-5 text-indigo-600" />
              <span>{t('admin.turnstileTitle')}</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.turnstileEnabled === true || settings.turnstileEnabled === 'true'}
                onChange={e => setSettings((prev: any) => ({ ...prev, turnstileEnabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              <span className="ml-3 text-xs font-semibold text-slate-700">
                {settings.turnstileEnabled === true || settings.turnstileEnabled === 'true' ? t('admin.turnstileActive') : t('admin.turnstileBypass')}
              </span>
            </label>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900 leading-relaxed flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
            <span>{t('admin.turnstileDesc')}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('admin.turnstileSiteKeyLabel')}</label>
              <input
                type="text"
                value={settings.turnstileSiteKey ?? '0x4AAAAAAFD6cbdGSfQ4qeog'}
                onChange={e => setSettings((prev: any) => ({ ...prev, turnstileSiteKey: e.target.value }))}
                className="input w-full font-mono text-xs"
                placeholder="0x4AAAAAA..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('admin.turnstileSecretKeyLabel')}</label>
              <input
                type="password"
                value={settings.turnstileSecret ?? ''}
                onChange={e => setSettings((prev: any) => ({ ...prev, turnstileSecret: e.target.value }))}
                className="input w-full font-mono text-xs"
                placeholder="0x4AAAAAA..."
              />
            </div>
          </div>
        </div>

        {/* SECTION 7: THÔNG BÁO TỨC THÌ (TELEGRAM BOT DISPATCHER) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base">
              <Bot className="w-5 h-5 text-sky-600" />
              <span>{t('admin.telegramTitle')}</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.telegramEnabled === true || settings.telegramEnabled === 'true'}
                onChange={e => setSettings((prev: any) => ({ ...prev, telegramEnabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
              <span className="ml-3 text-xs font-semibold text-slate-700">
                {settings.telegramEnabled === true || settings.telegramEnabled === 'true' ? t('admin.telegramActive') : t('admin.telegramDisabled')}
              </span>
            </label>
          </div>

          <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-100 text-xs text-sky-950 space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-sky-800">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span>{t('admin.telegramGuideTitle')}</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-600">
              <li>{t('admin.telegramStep1')} <a href="https://t.me/canh_technician_bot" target="_blank" rel="noreferrer" className="text-sky-600 font-bold underline inline-flex items-center gap-0.5">@canh_technician_bot <ExternalLink className="w-3 h-3" /></a></li>
              <li>{t('admin.telegramStep2')}</li>
              <li>{t('admin.telegramStep3')}</li>
            </ol>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('admin.telegramBotTokenLabel')}</label>
              <input
                type="text"
                value={settings.telegramBotToken ?? ''}
                onChange={e => setSettings((prev: any) => ({ ...prev, telegramBotToken: e.target.value }))}
                className="input w-full font-mono text-xs"
                placeholder="123456789:ABCdefGhI..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('admin.telegramChatIdLabel')}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.telegramChatId ?? ''}
                  onChange={e => setSettings((prev: any) => ({ ...prev, telegramChatId: e.target.value }))}
                  className="input flex-1 font-mono text-xs"
                  placeholder="-1001234567890"
                />
                <button
                  type="button"
                  onClick={handleDetectChatId}
                  disabled={detectingChatId}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-100 hover:bg-sky-200 text-sky-800 text-xs font-bold rounded-lg transition disabled:opacity-50 cursor-pointer whitespace-nowrap"
                  title={t('admin.detectChatId')}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${detectingChatId ? 'animate-spin' : ''}`} />
                  <span>{detectingChatId ? t('admin.detecting') : t('admin.detectChatId')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Detect Chat Result Banner */}
          {detectedChatResult && (
            <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
              detectedChatResult.success 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {detectedChatResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 leading-relaxed">
                {detectedChatResult.message}
              </div>
            </div>
          )}

          {/* Test Telegram Ping Row */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
            <div className="text-xs text-slate-500">
              {t('admin.testTelegramHint')}
            </div>
            <button
              type="button"
              onClick={handleTestTelegram}
              disabled={testingTelegram}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <Send className={`w-3.5 h-3.5 ${testingTelegram ? 'animate-pulse' : ''}`} />
              <span>{testingTelegram ? t('admin.testing') : t('admin.testTelegram')}</span>
            </button>
          </div>

          {/* Test Telegram Result Banner */}
          {telegramTestResult && (
            <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
              telegramTestResult.success 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {telegramTestResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 leading-relaxed">
                {telegramTestResult.message}
              </div>
            </div>
          )}
        </div>

        {/* SECTION 8: NỘI DUNG TRANG VỀ CHÚNG TÔI & ĐIỀU KHOẢN (MARKDOWN) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base">
              <FileText className="w-5 h-5 text-orange-600" />
              <span>{isEn ? 'Pages Content Management (Markdown)' : 'Quản lý nội dung bài viết (Markdown)'}</span>
            </div>

            {/* Subtabs */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="bg-slate-100 p-1 rounded-xl flex flex-wrap items-center text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setMarkdownTab('about')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    markdownTab === 'about'
                      ? 'bg-white text-orange-600 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isEn ? 'About Us Page' : 'Về chúng tôi'}
                </button>
                <button
                  type="button"
                  onClick={() => setMarkdownTab('terms')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    markdownTab === 'terms'
                      ? 'bg-white text-orange-600 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isEn ? 'Terms & Commitments' : 'Điều khoản & Cam kết'}
                </button>
                <button
                  type="button"
                  onClick={() => setMarkdownTab('totpGuide')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    markdownTab === 'totpGuide'
                      ? 'bg-white text-orange-600 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isEn ? 'TOTP Guide' : 'Hướng dẫn Authenticator'}
                </button>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            {markdownTab === 'about'
              ? (isEn
                  ? 'Editing content rendered on the /about page. Supports standard GitHub Flavored Markdown (headings, lists, bold, italics, images).'
                  : 'Nội dung hiển thị trên trang Về chúng tôi (/about). Hỗ trợ cú pháp Markdown hoàn chỉnh, kéo thả hoặc dán ảnh (Ctrl + V) trực tiếp.')
              : markdownTab === 'terms'
              ? (isEn
                  ? 'Editing rules & commitments rendered on the /terms page. Standardize rights and obligations between technicians and customers.'
                  : 'Nội dung hiển thị trên trang Quy định & Cam kết dịch vụ (/terms). Chuẩn hóa quyền lợi và trách nhiệm.')
              : (isEn
                  ? 'Editing TOTP Google Authenticator instructions shown in public modal & user onboarding guide.'
                  : 'Nội dung hướng dẫn cài đặt Google Authenticator / TOTP hiển thị trong Modal hướng dẫn và bảng trợ giúp.')}
          </p>

          {/* Editor / Preview Area */}
          <div className="pt-1">
            <MarkdownEditorWithUpload
              value={
                markdownTab === 'about'
                  ? (settings.aboutMarkdown ?? DEFAULT_ABOUT_MD)
                  : markdownTab === 'terms'
                  ? (settings.termsMarkdown ?? DEFAULT_TERMS_MD)
                  : (settings.totpGuideMarkdown ?? DEFAULT_TOTP_GUIDE_MD)
              }
              onChange={(val) => {
                if (markdownTab === 'about') {
                  setSettings((prev: any) => ({ ...prev, aboutMarkdown: val }));
                } else if (markdownTab === 'terms') {
                  setSettings((prev: any) => ({ ...prev, termsMarkdown: val }));
                } else {
                  setSettings((prev: any) => ({ ...prev, totpGuideMarkdown: val }));
                }
              }}
              onRestoreDefault={() => {
                if (markdownTab === 'about') {
                  if (window.confirm(isEn ? 'Reset About Page content to system default?' : 'Khôi phục nội dung trang Về chúng tôi về mặc định ban đầu?')) {
                    setSettings((prev: any) => ({ ...prev, aboutMarkdown: DEFAULT_ABOUT_MD }));
                  }
                } else if (markdownTab === 'terms') {
                  if (window.confirm(isEn ? 'Reset Terms Page content to system default?' : 'Khôi phục nội dung trang Điều khoản dịch vụ về mặc định ban đầu?')) {
                    setSettings((prev: any) => ({ ...prev, termsMarkdown: DEFAULT_TERMS_MD }));
                  }
                } else {
                  if (window.confirm(isEn ? 'Reset TOTP Guide content to system default?' : 'Khôi phục tài liệu hướng dẫn Authenticator về mặc định ban đầu?')) {
                    setSettings((prev: any) => ({ ...prev, totpGuideMarkdown: DEFAULT_TOTP_GUIDE_MD }));
                  }
                }
              }}
              minHeight="420px"
              placeholder={isEn ? 'Type markdown content or paste/drag images...' : 'Nhập nội dung markdown hoặc kéo thả / dán ảnh (Ctrl + V) vào đây...'}
            />
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? t('admin.saving') : t('admin.saveAllSettings')}</span>
          </button>
        </div>
      </form>
    </div>
  );
}