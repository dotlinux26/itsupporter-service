import { useEffect, useState } from 'react';
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
  ExternalLink 
} from 'lucide-react';

export function AdminSettings() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
      alert('Không thể lưu cài đặt. Vui lòng thử lại!');
    } finally {
      setSaving(false);
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
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Cài đặt hệ thống</h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý địa chỉ phòng làm việc, thông tin liên hệ, bản đồ Google Maps và chính sách dịch vụ.
          </p>
        </div>
        {saveSuccess && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-sm font-medium animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Đã lưu cài đặt thành công!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECTION 1: CƠ SỞ & TIẾP NHẬN MÁY */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 text-slate-900 font-bold text-base">
            <Building2 className="w-5 h-5 text-orange-600" />
            <span>Thông tin cơ sở & Địa chỉ tiếp nhận máy</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tên đội vận hành</label>
              <input
                type="text"
                value={settings.teamName ?? 'IT Supporter HaUI'}
                onChange={e => setSettings((prev: any) => ({ ...prev, teamName: e.target.value }))}
                className="input w-full"
                placeholder="VD: IT Supporter HaUI"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Đơn vị trực thuộc / Đại học</label>
              <input
                type="text"
                value={settings.university ?? 'Đại học Công nghiệp Hà Nội'}
                onChange={e => setSettings((prev: any) => ({ ...prev, university: e.target.value }))}
                className="input w-full"
                placeholder="VD: Đại học Công nghiệp Hà Nội"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Địa chỉ phòng tiếp nhận & làm việc chính thức
              </label>
              <input
                type="text"
                value={settings.workshopAddress ?? 'Phòng 1603, Tòa A1, Cơ sở 1 - Đại học Công nghiệp Hà Nội'}
                onChange={e => setSettings((prev: any) => ({ ...prev, workshopAddress: e.target.value }))}
                className="input w-full"
                placeholder="VD: Phòng 1603, Tòa A1, Cơ sở 1 - Đại học Công nghiệp Hà Nội"
              />
              <p className="text-xs text-slate-500 mt-1">
                Hiển thị trên Trang chủ, Trang Đặt lịch và Footer. Khách hàng sẽ mang máy tính tới đây theo giờ hẹn.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Khung giờ làm việc hiển thị</label>
              <input
                type="text"
                value={settings.workingHoursDisplay ?? '07:00 - 19:00 (Thứ 2 - Thứ 7)'}
                onChange={e => setSettings((prev: any) => ({ ...prev, workingHoursDisplay: e.target.value }))}
                className="input w-full"
                placeholder="VD: 07:00 - 19:00 (Thứ 2 - Thứ 7)"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Múi giờ hệ thống</label>
              <input
                type="text"
                value={settings.timezone ?? 'Asia/Ho_Chi_Minh'}
                onChange={e => setSettings((prev: any) => ({ ...prev, timezone: e.target.value }))}
                className="input w-full"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Thông báo quy định tiếp nhận máy (Banner lưu ý)
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
            <span>Kênh liên hệ & Nhà phân phối</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-500" /> Hotline tiếp nhận
              </label>
              <input
                type="text"
                value={settings.contactPhone ?? '0981.234.567'}
                onChange={e => setSettings((prev: any) => ({ ...prev, contactPhone: e.target.value }))}
                className="input w-full"
                placeholder="VD: 0981.234.567"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" /> Email hỗ trợ
              </label>
              <input
                type="email"
                value={settings.contactEmail ?? 'support@itsupporter.vn'}
                onChange={e => setSettings((prev: any) => ({ ...prev, contactEmail: e.target.value }))}
                className="input w-full"
                placeholder="VD: support@itsupporter.vn"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Facebook className="w-3.5 h-3.5 text-blue-600" /> Link Fanpage Facebook chính thức
              </label>
              <input
                type="url"
                value={settings.facebookPage ?? 'https://www.facebook.com/itsupporter.haui/'}
                onChange={e => setSettings((prev: any) => ({ ...prev, facebookPage: e.target.value }))}
                className="input w-full"
                placeholder="VD: https://www.facebook.com/itsupporter.haui/"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tên nhà phân phối chính thức</label>
              <input
                type="text"
                value={settings.distributorName ?? 'dotlinux26'}
                onChange={e => setSettings((prev: any) => ({ ...prev, distributorName: e.target.value }))}
                className="input w-full"
                placeholder="VD: dotlinux26"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" /> Link nhà phân phối
              </label>
              <input
                type="url"
                value={settings.distributorUrl ?? 'https://github.com/dotlinux26'}
                onChange={e => setSettings((prev: any) => ({ ...prev, distributorUrl: e.target.value }))}
                className="input w-full"
                placeholder="VD: https://github.com/dotlinux26"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: BẢN ĐỒ GOOGLE MAPS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 text-slate-900 font-bold text-base">
            <MapPin className="w-5 h-5 text-emerald-600" />
            <span>Tích hợp Bản đồ Google Maps</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Link Embed iframe Google Maps (nhúng bản đồ Footer)
              </label>
              <input
                type="text"
                value={settings.googleMapEmbedUrl ?? ''}
                onChange={e => setSettings((prev: any) => ({ ...prev, googleMapEmbedUrl: e.target.value }))}
                className="input w-full font-mono text-xs"
                placeholder="https://www.google.com/maps/embed?..."
              />
              <p className="text-xs text-slate-500 mt-1">
                Link src lấy từ tính năng "Chia sẻ & Nhúng bản đồ" trên Google Maps.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Link mở bản đồ trực tiếp (Chỉ đường Google Maps)
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
                <span className="block text-xs font-medium text-slate-500 mb-1.5">Xem trước bản đồ nhúng:</span>
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
            <span>Chính sách giờ giấc & Phạt muộn ca dịch vụ</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ngưỡng phạt trễ (phút)</label>
              <input
                type="number"
                value={settings.latePenaltyMinutes || 10}
                onChange={e => setSettings((prev: any) => ({ ...prev, latePenaltyMinutes: Number(e.target.value) }))}
                className="input w-full"
              />
              <span className="text-[11px] text-slate-500">Trễ từ mốc này sẽ bị trừ % doanh thu</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phần trăm phạt trễ (%)</label>
              <input
                type="number"
                value={settings.latePenaltyPercent || 15}
                onChange={e => setSettings((prev: any) => ({ ...prev, latePenaltyPercent: Number(e.target.value) }))}
                className="input w-full"
              />
              <span className="text-[11px] text-slate-500">Mặc định trừ 15%</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Miễn phí 100% nếu muộn quá (phút)</label>
              <input
                type="number"
                value={settings.freeServiceAfterMinutes || 30}
                onChange={e => setSettings((prev: any) => ({ ...prev, freeServiceAfterMinutes: Number(e.target.value) }))}
                className="input w-full font-bold text-orange-600"
              />
              <span className="text-[11px] text-slate-500">Quy định muộn &gt; 30p làm FREE (0đ)</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Giờ mở ca bắt đầu</label>
              <input
                type="time"
                value={settings.workingStart || '07:00'}
                onChange={e => setSettings((prev: any) => ({ ...prev, workingStart: e.target.value }))}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Giờ đóng ca kết thúc</label>
              <input
                type="time"
                value={settings.workingEnd || '19:00'}
                onChange={e => setSettings((prev: any) => ({ ...prev, workingEnd: e.target.value }))}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Thời lượng mỗi ca (phút)</label>
              <input
                type="number"
                value={settings.slotDurationMinutes || 60}
                onChange={e => setSettings((prev: any) => ({ ...prev, slotDurationMinutes: Number(e.target.value) }))}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Chia sẻ Kỹ thuật viên (%)</label>
              <input
                type="number"
                value={settings.technicianSharePercent || 70}
                onChange={e => setSettings((prev: any) => ({ ...prev, technicianSharePercent: Number(e.target.value) }))}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Chia sẻ Đội nhóm (%)</label>
              <input
                type="number"
                value={settings.teamSharePercent || 30}
                onChange={e => setSettings((prev: any) => ({ ...prev, teamSharePercent: Number(e.target.value) }))}
                className="input w-full"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: CHÍNH SÁCH BẢO HÀNH & HỖ TRỢ KỸ THUẬT */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Chính sách Bảo hành &amp; Hỗ trợ kỹ thuật</span>
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
                {settings.warrantyPolicyEnabled === true || settings.warrantyPolicyEnabled === 'true' ? 'Đang kích hoạt (Hiển thị)' : 'Tạm tắt (Ẩn)'}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tiêu đề chính sách</label>
              <input
                type="text"
                value={settings.warrantyPolicyTitle ?? 'Bảo hành hỗ trợ kỹ thuật'}
                onChange={e => setSettings((prev: any) => ({ ...prev, warrantyPolicyTitle: e.target.value }))}
                className="input w-full"
                placeholder="VD: Bảo hành hỗ trợ kỹ thuật"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Thời hạn cam kết</label>
              <input
                type="text"
                value={settings.warrantyPolicyDays ?? '30 Ngày'}
                onChange={e => setSettings((prev: any) => ({ ...prev, warrantyPolicyDays: e.target.value }))}
                className="input w-full"
                placeholder="VD: 30 Ngày"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nội dung chi tiết chính sách hỗ trợ</label>
              <textarea
                rows={2}
                value={settings.warrantyPolicyContent ?? ''}
                onChange={e => setSettings((prev: any) => ({ ...prev, warrantyPolicyContent: e.target.value }))}
                className="input w-full"
                placeholder="Hỗ trợ kỹ thuật và kiểm tra lại miễn phí trong thời gian cam kết nếu máy phát sinh hiện tượng nóng lại hoặc lỗi sau vệ sinh..."
              />
            </div>
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
            <span>{saving ? 'Đang lưu cấu hình...' : 'Lưu tất cả cài đặt'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}