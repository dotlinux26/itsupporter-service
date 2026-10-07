import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/client';
import { ShieldCheck, Phone, User as UserIcon, Mail, AlertCircle, Loader2 } from 'lucide-react';

export function BasicInfoModal() {
  const { user, refreshUser } = useAuth();
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');

  // Trigger fallback when user is logged in as GUEST and is missing phone or name
  const isMissingInfo = Boolean(
    user &&
    user.role === 'GUEST' &&
    (!user.phone || !user.phone.trim() || !user.name || !user.name.trim() || !user.email || !user.email.trim())
  );

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  if (!isMissingInfo) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanPhone = phone.trim().replace(/\s+/g, '');
    if (!cleanPhone) {
      setError(isEn ? 'Please enter your phone number.' : 'Vui lòng nhập số điện thoại liên hệ.');
      return;
    }

    if (!/^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(cleanPhone)) {
      setError(
        isEn
          ? 'Invalid phone number format (must be 10 digits starting with 03, 05, 07, 08, 09).'
          : 'Số điện thoại không hợp lệ (gồm 10 số, bắt đầu bằng 03, 05, 07, 08, 09).'
      );
      return;
    }

    if (!name.trim()) {
      setError(isEn ? 'Please enter your full name.' : 'Vui lòng nhập họ và tên.');
      return;
    }

    setLoading(true);
    try {
      await authApi.updateProfile({
        name: name.trim(),
        phone: cleanPhone,
      });
      await refreshUser();
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        (isEn ? 'Failed to update profile. Please try again.' : 'Cập nhật thất bại. Vui lòng thử lại.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-orange-100 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-orange-600 to-amber-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">
                {isEn ? 'Complete Basic Information' : 'Bổ sung thông tin cơ bản'}
              </h3>
              <p className="text-xs text-orange-100 mt-0.5">
                {isEn ? 'Required for support & order confirmation' : 'Bắt buộc để KTV liên hệ tiếp nhận đơn'}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            {isEn
              ? 'To ensure our technicians can reach you and process service requests smoothly, please update your contact details below:'
              : 'Để đảm bảo kỹ thuật viên có thể liên hệ và xử lý đơn máy của bạn chu đáo, vui lòng cập nhật thông tin liên hệ bên dưới:'}
          </p>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>{isEn ? 'Full name' : 'Họ và tên'}</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder={isEn ? 'John Doe' : 'Nguyễn Văn A'}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              <span>{isEn ? 'Email' : 'Email'}</span>
            </label>
            <input
              type="email"
              disabled
              value={email}
              className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-orange-600" />
              <span>{isEn ? 'Phone number (Required)' : 'Số điện thoại liên hệ (Bắt buộc)'}</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-orange-50/40 border border-orange-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
              placeholder="0912345678"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              {isEn ? 'Example: 0988123456 (10 digits)' : 'Ví dụ: 0988123456 (10 chữ số)'}
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold text-sm rounded-xl shadow-md shadow-orange-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isEn ? 'Saving...' : 'Đang lưu...'}</span>
              </>
            ) : (
              <span>{isEn ? 'Save & Continue' : 'Lưu thông tin & Tiếp tục'}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
