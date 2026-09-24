import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/client';
import { User, KeyRound, Save, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

type Tab = 'profile' | 'password';

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState<Tab>('profile');

  // --- Profile form state ---
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [contactInfo, setContactInfo] = useState('');
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

  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setPhone(user.phone ?? '');
      setContactInfo(user.contact_info ?? '');
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setProfileSaving(true);
    try {
      await authApi.updateProfile({
        name: name.trim(),
        phone: phone.trim() || null,
        contactInfo: contactInfo.trim() || null,
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

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'profile', label: 'Thông tin cá nhân', icon: <User className="w-4 h-4" /> },
    { key: 'password', label: 'Đổi mật khẩu', icon: <KeyRound className="w-4 h-4" /> },
  ];

  return (
    <div className="container py-10 md:py-12 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center text-2xl font-black text-[#ff6b35] shrink-0">
            {user?.name?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text">{user?.name}</h1>
            <p className="text-sm text-text-secondary">{user?.email} · <span className="capitalize">{user?.role?.toLowerCase()}</span></p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? 'bg-white text-[#ff6b35] shadow-sm'
                : 'text-text-secondary hover:text-text'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Profile */}
      {tab === 'profile' && (
        <div className="card p-6">
          {profileError && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">{profileError}</div>
          )}
          {profileSuccess && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg mb-4 text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {profileSuccess}
            </div>
          )}
          <form onSubmit={handleProfileSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="label">Họ và tên <span className="text-red-500">*</span></label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="input"
                required
                minLength={1}
                maxLength={100}
                placeholder="Nguyễn Văn A"
              />
            </div>

            <div>
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email"
                type="email"
                value={user?.email ?? ''}
                className="input bg-slate-50 cursor-not-allowed text-text-secondary"
                readOnly
                disabled
              />
              <p className="text-xs text-text-muted mt-1">Email không thể thay đổi.</p>
            </div>

            <div>
              <label htmlFor="phone" className="label">Số điện thoại</label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="input"
                maxLength={20}
                placeholder="0912.345.678"
              />
            </div>

            <div>
              <label htmlFor="contactInfo" className="label">Ghi chú liên hệ</label>
              <textarea
                id="contactInfo"
                value={contactInfo}
                onChange={e => setContactInfo(e.target.value)}
                className="input resize-none"
                rows={3}
                maxLength={300}
                placeholder="Zalo, Facebook, địa chỉ nhận máy..."
              />
              <p className="text-xs text-text-muted mt-1">{contactInfo.length}/300 ký tự</p>
            </div>

            <div className="pt-2 flex justify-end">
              <button type="submit" disabled={profileSaving} className="btn btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" />
                {profileSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab: Password */}
      {tab === 'password' && (
        <div className="card p-6">
          {pwError && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">{pwError}</div>
          )}
          {pwSuccess && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg mb-4 text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {pwSuccess}
            </div>
          )}
          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div>
              <label htmlFor="currentPassword" className="label">Mật khẩu hiện tại <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  id="currentPassword"
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="input pr-10"
                  required
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
                  tabIndex={-1}
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="newPassword" className="label">Mật khẩu mới <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="input pr-10"
                  required
                  minLength={8}
                  placeholder="Tối thiểu 8 ký tự"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {newPassword.length > 0 && newPassword.length < 8 && (
                <p className="text-xs text-red-500 mt-1">Ít nhất 8 ký tự</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label">Xác nhận mật khẩu mới <span className="text-red-500">*</span></label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="input"
                required
                placeholder="Nhập lại mật khẩu mới"
              />
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-xs text-red-500 mt-1">Mật khẩu không khớp</p>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button type="submit" disabled={pwSaving} className="btn btn-primary flex items-center gap-2">
                <KeyRound className="w-4 h-4" />
                {pwSaving ? 'Đang đổi...' : 'Đổi mật khẩu'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}