import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/client';
import {
  User,
  KeyRound,
  Save,
  Eye,
  EyeOff,
  CheckCircle2,
  Camera,
  FileCode2,
  Sparkles,
  Tag,
  Award,
  AlertCircle,
  X,
  Trash2,
} from 'lucide-react';
import { Avatar } from '../../components/Avatar';
import { AvatarUploadModal } from '../../components/AvatarUploadModal';
import { MarkdownRenderer } from '../../components/MarkdownRenderer';

type Tab = 'profile' | 'technician_profile' | 'password';

const PRESET_SKILLS = [
  'Vệ sinh Laptop Văn Phòng',
  'Vệ sinh Laptop Gaming',
  'Tra keo tản nhiệt chất lượng cao',
  'Tra keo hiệu năng cao chuyên dụng',
  'Bảo dưỡng PC Desktop',
  'Cài đặt Windows 10/11 & macOS',
  'Nâng cấp RAM & SSD NVMe',
  'Xử lý kẹt quạt & tra dầu',
  'Tối ưu hóa nhiệt độ CPU/GPU',
  'Khắc phục lỗi màn hình xanh (BSOD)',
];

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState<Tab>('profile');
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  // --- Profile form state ---
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [contactInfo, setContactInfo] = useState('');

  // --- Technician specific state ---
  const [bio, setBio] = useState('');
  const [publicProfile, setPublicProfile] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [markdownPreview, setMarkdownPreview] = useState(false);

  // Feedback states
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // --- Password form state ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  const isTechnician = user?.role === 'TECHNICIAN';

  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setPhone(user.phone ?? '');
      setContactInfo(user.contact_info ?? '');
      setBio(user.bio ?? '');

      if (user.public_profile) {
        try {
          const parsed = JSON.parse(user.public_profile);
          if (parsed && typeof parsed === 'object') {
            if (Array.isArray(parsed.skills)) {
              setSelectedTags(parsed.skills);
            } else {
              setSelectedTags([]);
            }
            const md = parsed.article || parsed.markdown || parsed.content || '';
            setPublicProfile(md);
          } else {
            setSelectedTags([]);
            setPublicProfile(String(parsed));
          }
        } catch {
          setSelectedTags([]);
          setPublicProfile(user.public_profile);
        }
      } else {
        setSelectedTags([]);
        setPublicProfile('');
      }
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setProfileSaving(true);
    try {
      let profilePayload: string | null = null;
      if (isTechnician) {
        profilePayload = JSON.stringify({
          skills: selectedTags,
          article: publicProfile.trim(),
        });
      }

      await authApi.updateProfile({
        name: name.trim(),
        phone: phone.trim() || null,
        contactInfo: contactInfo.trim() || null,
        bio: isTechnician ? bio.trim() || null : undefined,
        publicProfile: profilePayload,
      });
      setProfileSuccess('Cập nhật hồ sơ thành công!');
      refreshUser();
    } catch (err: any) {
      setProfileError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Cập nhật thất bại.'
      );
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAddTag = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim();
    if (!trimmed || selectedTags.includes(trimmed)) return;
    if (selectedTags.length >= 8) {
      alert('Bạn chỉ có thể chọn tối đa 8 thẻ chuyên môn.');
      return;
    }
    const updated = [...selectedTags, trimmed];
    setSelectedTags(updated);
    setCustomTagInput('');
    // Optionally append to publicProfile
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tagToRemove));
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (newPassword !== confirmPassword) {
      setPwError('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (newPassword.length < 8) {
      setPwError('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }
    setPwSaving(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setPwSuccess('Đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Đổi mật khẩu thất bại.'
      );
    } finally {
      setPwSaving(false);
    }
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = isTechnician
    ? [
        { key: 'profile', label: 'Thông tin liên hệ', icon: <User className="w-4 h-4" /> },
        {
          key: 'technician_profile',
          label: 'Hồ sơ KTV & Kỹ năng',
          icon: <Award className="w-4 h-4 text-amber-600" />,
        },
        { key: 'password', label: 'Đổi mật khẩu', icon: <KeyRound className="w-4 h-4" /> },
      ]
    : [
        { key: 'profile', label: 'Thông tin cá nhân', icon: <User className="w-4 h-4" /> },
        { key: 'password', label: 'Đổi mật khẩu', icon: <KeyRound className="w-4 h-4" /> },
      ];

  const getRoleBadge = () => {
    switch (user?.role) {
      case 'ADMIN':
        return <span className="px-2.5 py-0.5 text-xs font-bold bg-purple-100 text-purple-700 rounded-full border border-purple-200">Quản trị viên (Admin)</span>;
      case 'MANAGER':
        return <span className="px-2.5 py-0.5 text-xs font-bold bg-blue-100 text-blue-700 rounded-full border border-blue-200">Quản lý (Manager)</span>;
      case 'TECHNICIAN':
        return <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-700 rounded-full border border-amber-200">Kỹ thuật viên HaUI</span>;
      default:
        return <span className="px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded-full border border-gray-200">Khách hàng (Guest)</span>;
    }
  };

  return (
    <div className="container py-5 sm:py-8 md:py-12 max-w-4xl mx-auto space-y-6 sm:space-y-8">
      {/* PROFILE BANNER CARD */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-4 sm:p-6 md:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-orange-50 rounded-full pointer-events-none -z-0 opacity-60" />

        {/* Avatar with upload trigger */}
        <div className="relative group flex-shrink-0 z-10">
          <Avatar
            src={user?.avatar_url}
            name={user?.name}
            email={user?.email}
            size={88}
          />
          <button
            type="button"
            onClick={() => setAvatarModalOpen(true)}
            className="absolute -bottom-1 -right-1 p-2 bg-primary text-white rounded-full shadow-md hover:bg-primary-hover hover:scale-105 transition-all"
            title="Đổi ảnh đại diện"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        {/* Basic user info */}
        <div className="flex-1 text-center sm:text-left space-y-2 z-10">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{user?.name}</h1>
            {getRoleBadge()}
          </div>
          <p className="text-sm text-gray-500 font-mono">{user?.email}</p>
          {user?.phone && (
            <p className="text-xs text-gray-600">
              📞 Hotline liên hệ: <span className="font-semibold text-gray-800">{user.phone}</span>
            </p>
          )}
          {isTechnician && (
            <p className="text-xs text-amber-700 font-medium bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 inline-block">
              ⭐ Đội ngũ kỹ thuật viên IT Supporter · Đại học Công nghiệp Hà Nội
            </p>
          )}
        </div>

        {/* Change avatar button */}
        <div className="z-10 sm:self-center">
          <button
            type="button"
            onClick={() => setAvatarModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Đổi avatar</span>
          </button>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex border-b border-border gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t.key);
              setProfileError('');
              setProfileSuccess('');
              setPwError('');
              setPwSuccess('');
            }}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
              tab === t.key
                ? 'border-primary text-primary bg-orange-50/40 rounded-t-lg'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* TAB CONTENT: THÔNG TIN CÁ NHÂN / LIÊN HỆ */}
      {tab === 'profile' && (
        <form onSubmit={handleProfileSubmit} className="card p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-gray-900">
              {isTechnician ? 'Thông tin tiếp nhận & Liên hệ KTV' : 'Thông tin tài khoản cá nhân'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Cập nhật tên hiển thị, số điện thoại và thông tin liên hệ khi phục vụ đơn hàng.
            </p>
          </div>

          {profileSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800 flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
                className="input text-sm"
                placeholder="Nguyễn Văn A"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Địa chỉ Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="input bg-gray-100 text-gray-500 cursor-not-allowed text-sm"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">Email là định danh tài khoản, không thể thay đổi.</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Số điện thoại liên hệ
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={20}
              className="input text-sm"
              placeholder="0981.234.567"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              {isTechnician ? 'Địa chỉ phòng trực / Kênh liên hệ' : 'Thông tin liên lạc thêm'}
            </label>
            <textarea
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              maxLength={300}
              rows={3}
              className="input text-sm resize-none"
              placeholder={
                isTechnician
                  ? 'Ví dụ: Phòng 1603 Tòa A1 Cơ sở 1 HaUI · Facebook: fb.com/itsupporter · Zalo: 0981234567'
                  : 'Ví dụ: Ký túc xá HaUI, Facebook cá nhân hoặc ghi chú nhận máy...'
              }
            />
            <div className="flex justify-between text-[11px] text-gray-400 mt-1">
              <span>Tối đa 300 ký tự</span>
              <span>{contactInfo.length}/300</span>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={profileSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-md transition disabled:opacity-50"
            >
              {profileSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Lưu thay đổi</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* TAB CONTENT: HỒ SƠ KỸ THUẬT VIÊN & MARKDOWN (CHỈ KTV) */}
      {isTechnician && tab === 'technician_profile' && (
        <form onSubmit={handleProfileSubmit} className="space-y-6">
          <div className="card p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6">
            <div className="border-b border-gray-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Hồ sơ năng lực & Thẻ chi tiết Kỹ thuật viên
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Nội dung này hiển thị trực tiếp cho khách hàng khi chọn KTV trên lịch và trang thông tin đội ngũ.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-orange-50 text-orange-700 rounded-lg border border-orange-200 self-start sm:self-auto">
                Hỗ trợ Markdown 5000 ký tự
              </span>
            </div>

            {profileSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800 flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {/* Giới thiệu ngắn Bio */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Giới thiệu ngắn gọn (Bio popup)
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={300}
                rows={2}
                className="input text-sm resize-none"
                placeholder="Ví dụ: Sinh viên CNTT K17 HaUI · 2 năm kinh nghiệm vệ sinh tra keo tản nhiệt Gaming, tháo lắp cẩn thận và nhiệt tình."
              />
              <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                <span>Hiển thị khi khách hàng hover chuột vào avatar trên lịch</span>
                <span>{bio.length}/300</span>
              </div>
            </div>

            {/* Gợi ý thẻ kỹ năng / tags */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-primary" />
                  Thẻ chuyên môn & Kỹ năng nổi bật ({selectedTags.length}/8)
                </label>
                {selectedTags.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedTags([])}
                    className="text-[11px] font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-red-50 transition cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Xóa tất cả thẻ</span>
                  </button>
                )}
              </div>

              {/* Danh sách thẻ đang chọn */}
              <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200 min-h-[48px] flex items-center">
                {selectedTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2 w-full">
                    {selectedTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-600 text-white rounded-lg text-xs font-semibold shadow-xs"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:bg-orange-700 rounded-full p-0.5 transition cursor-pointer"
                          title={`Xóa thẻ ${tag}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">
                    Chưa chọn thẻ nào. Khi lưu, trên danh sách ngoài trang chủ sẽ hiển thị: &quot;Chưa cập nhật kỹ năng&quot;.
                  </p>
                )}
              </div>

              {/* Gợi ý mẫu */}
              <div>
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                  Gợi ý chọn nhanh thẻ phổ biến:
                </span>
                <div className="flex flex-wrap gap-2">
                  {PRESET_SKILLS.map((skill) => {
                    const isSelected = selectedTags.includes(skill);
                    return (
                      <button
                        type="button"
                        key={skill}
                        onClick={() => (isSelected ? handleRemoveTag(skill) : handleAddTag(skill))}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition font-medium cursor-pointer ${
                          isSelected
                            ? 'bg-orange-100 text-orange-800 border-orange-300 font-semibold'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {isSelected ? `✓ ${skill}` : `+ ${skill}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Thêm thẻ tùy chỉnh */}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag(customTagInput);
                    }
                  }}
                  placeholder="Nhập kỹ năng tùy chỉnh khác rồi bấm Thêm..."
                  className="input text-xs flex-1"
                />
                <button
                  type="button"
                  onClick={() => handleAddTag(customTagInput)}
                  className="btn btn-outline text-xs px-4 cursor-pointer"
                >
                  Thêm thẻ
                </button>
              </div>
            </div>

            {/* Public Profile 5000 ký tự Markdown */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCode2 className="w-4 h-4 text-purple-600" />
                  Bài viết giới thiệu chi tiết (Markdown 5000 ký tự)
                </label>
                <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
                  <button
                    type="button"
                    onClick={() => setMarkdownPreview(false)}
                    className={`px-3 py-1 font-medium transition ${
                      !markdownPreview ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Soạn thảo
                  </button>
                  <button
                    type="button"
                    onClick={() => setMarkdownPreview(true)}
                    className={`px-3 py-1 font-medium transition ${
                      markdownPreview ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Xem trước
                  </button>
                </div>
              </div>

              {!markdownPreview ? (
                <textarea
                  value={publicProfile}
                  onChange={(e) => setPublicProfile(e.target.value)}
                  maxLength={5000}
                  rows={10}
                  className="input font-mono text-xs leading-relaxed"
                  placeholder={`### Xin chào! Mình là KTV IT Supporter HaUI 🛠️\n\n- **Chuyên môn**: Vệ sinh laptop gaming nhiệt độ cao, bảo dưỡng PC phòng máy.\n- **Cam kết**: Thao tác cẩn thận, không làm gãy ngàm máy, keo tản nhiệt loại xịn.\n- **Kinh nghiệm**: Đã xử lý hơn 100+ máy tính cho sinh viên & cán bộ trường.\n\n*Hẹn gặp các bạn tại phòng 1603 Tòa A1 nhé!*`}
                />
              ) : (
                <div className="min-h-[220px] p-4 bg-gray-50/70 border border-gray-200 rounded-xl max-w-none text-xs leading-relaxed text-gray-800">
                  {publicProfile.trim() ? (
                    <MarkdownRenderer content={publicProfile} />
                  ) : (
                    <p className="text-gray-400 italic">Chưa có nội dung xem trước.</p>
                  )}
                </div>
              )}

              <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                <span>Hỗ trợ định dạng in đậm (**text**), tiêu đề (###), danh sách (-), bảng...</span>
                <span className={publicProfile.length > 4500 ? 'text-orange-600 font-bold' : ''}>
                  {publicProfile.length}/5000
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                disabled={profileSaving}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-md transition disabled:opacity-50"
              >
                {profileSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Lưu hồ sơ Kỹ thuật viên</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* LIVE PREVIEW CARD (Mô phỏng hiển thị trên Website) */}
          <div className="card p-6 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <span className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                Xem trước Thẻ Kỹ thuật viên (Khách hàng nhìn thấy)
              </span>
              <span className="text-[11px] text-slate-500">Live Preview</span>
            </div>

            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Avatar
                src={user?.avatar_url}
                name={user?.name || name}
                email={user?.email}
                size={64}
              />
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-white">{name || user?.name}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md">
                    KTV HaUI
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {bio || 'Chưa cập nhật phần giới thiệu ngắn...'}
                </p>

                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedTags.map((t) => (
                      <span key={t} className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      )}

      {/* TAB CONTENT: ĐỔI MẬT KHẨU */}
      {tab === 'password' && (
        <form onSubmit={handlePasswordSubmit} className="card p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-gray-900">Đổi mật khẩu tài khoản</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Để bảo mật tài khoản, vui lòng sử dụng mật khẩu mạnh có tối thiểu 8 ký tự.
            </p>
          </div>

          {pwSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800 flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{pwSuccess}</span>
            </div>
          )}

          {pwError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span>{pwError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Mật khẩu hiện tại <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="input pr-10 text-sm"
                placeholder="Nhập mật khẩu hiện tại"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="input pr-10 text-sm"
                  placeholder="Tối thiểu 8 ký tự"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Xác nhận mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="input text-sm"
                placeholder="Nhập lại mật khẩu mới"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={pwSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-md transition disabled:opacity-50"
            >
              {pwSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang đổi mật khẩu...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Cập nhật mật khẩu</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* AVATAR UPLOAD & CROP MODAL */}
      <AvatarUploadModal
        isOpen={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        currentAvatarUrl={user?.avatar_url || null}
        userName={user?.name || ''}
        userEmail={user?.email || ''}
        onSuccess={() => {
          refreshUser();
          setProfileSuccess('Đã cập nhật ảnh đại diện thành công!');
        }}
      />
    </div>
  );
}