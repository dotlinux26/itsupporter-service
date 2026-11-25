import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  KeyRound,
  Shield,
  Lock,
  Mail,
  AlertTriangle,
  CheckCircle2,
  Clock,
  HelpCircle,
  ArrowLeft,
  LifeBuoy,
  Loader2,
} from 'lucide-react';
import { authApi } from '../../api/client';
import { publicApi } from '../../api/client';
import { AuthenticatorGuideModal } from '../../components/modals/AuthenticatorGuideModal';
import { TurnstileWidget } from '../../components/TurnstileWidget';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [turnstileEnabled, setTurnstileEnabled] = useState(true);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState('0x4AAAAAAFD6cbdGSfQ4qeog');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);

  useEffect(() => {
    publicApi.info().then((res) => {
      const info = res.data?.data;
      if (!info) return;
      if (info.turnstile_site_key || info.turnstileSiteKey) {
        setTurnstileSiteKey(info.turnstile_site_key || info.turnstileSiteKey);
      }
      if (info.turnstile_enabled !== undefined) {
        setTurnstileEnabled(Boolean(info.turnstile_enabled));
      } else if (info.turnstileEnabled !== undefined) {
        setTurnstileEnabled(Boolean(info.turnstileEnabled));
      }
    }).catch((err) => {
      console.error('Failed to load Turnstile settings:', err);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!identifier.trim()) {
      setErrorMsg('Vui lòng nhập Email hoặc Tên tài khoản.');
      return;
    }
    if (!code.trim()) {
      setErrorMsg('Vui lòng nhập mã 6 số từ Google Authenticator hoặc mã dự phòng.');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setErrorMsg('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (turnstileEnabled && !turnstileToken) {
      setErrorMsg('Vui lòng hoàn thành xác thực chống bot Cloudflare Turnstile.');
      return;
    }

    setSubmitting(true);
    try {
      await authApi.forgotPasswordTotp(identifier.trim(), code.trim(), newPassword, turnstileToken);
      setIsSuccess(true);
    } catch (err: any) {
      setTurnstileResetKey((prev) => prev + 1);
      setTurnstileToken('');
      const msg = err.response?.data?.error?.message || err.response?.data?.message || err.message;
      setErrorMsg(msg || 'Mã xác thực không hợp lệ hoặc đã hết hạn.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Back button */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Quay lại trang Đăng nhập
        </Link>

        {/* Logo & Title */}
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 text-orange-600 flex items-center justify-center mb-4">
            <KeyRound className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Khôi phục mật khẩu</h2>
          <p className="mt-1 text-xs text-gray-500">
            Xác thực toán học thuần túy qua ứng dụng <b className="text-gray-700">Google Authenticator</b>
          </p>
        </div>

        {/* Card */}
        <div className="mt-8 bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm">
          {isSuccess ? (
            <div className="text-center space-y-4 py-4 animate-fade-in">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Đổi mật khẩu thành công!</h3>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                  Mật khẩu tài khoản của bạn đã được cập nhật an toàn. Bạn có thể sử dụng mật khẩu mới để đăng nhập ngay bây giờ.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => navigate('/login')}
                  className="btn btn-primary w-full py-3 text-xs uppercase tracking-wider"
                >
                  Đăng nhập ngay
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Identifier */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">
                  Email hoặc Tên tài khoản:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="email@example.com hoặc username"
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 pl-10 text-sm text-gray-900 focus:outline-none focus:border-orange-500"
                    required
                  />
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                </div>
              </div>

              {/* TOTP Code or Backup Code */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-700">
                    Mã 6 số TOTP hoặc Mã dự phòng:
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowGuideModal(true)}
                    className="text-[11px] text-orange-600 hover:underline flex items-center gap-1"
                  >
                    <HelpCircle className="w-3 h-3" /> Hướng dẫn
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Ví dụ: 839201 hoặc XXXX-XXXX"
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 pl-10 text-sm font-mono text-gray-900 tracking-wider focus:outline-none focus:border-orange-500"
                    required
                  />
                  <Shield className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                </div>
                <p className="text-[11px] text-gray-500">
                  Mở Google Authenticator chọn dòng                   <b className="text-orange-600">KhoiPhuc_MatKhau</b>
                </p>
              </div>

              {/* New Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">
                  Mật khẩu mới (ít nhất 8 ký tự):
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 pl-10 text-sm text-gray-900 focus:outline-none focus:border-orange-500"
                    required
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">
                  Xác nhận lại mật khẩu:
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 pl-10 text-sm text-gray-900 focus:outline-none focus:border-orange-500"
                    required
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                </div>
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-error-light border border-error text-error text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">{errorMsg}</div>
                </div>
              )}

              {/* Clock Sync Warning Banner */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Nếu mã luôn báo không hợp lệ, vui lòng kiểm tra xem điện thoại của bạn có bật <b>"Đặt giờ tự động"</b> hay chưa (hoặc vào Google Authenticator chọn "Đồng bộ hóa thời gian").
                </span>
              </div>

              {turnstileEnabled && (
                <TurnstileWidget
                  siteKey={turnstileSiteKey}
                  action="booking"
                  resetKey={turnstileResetKey}
                  onVerify={setTurnstileToken}
                  onExpire={() => setTurnstileToken('')}
                  onError={() => setTurnstileToken('')}
                />
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary w-full py-3 disabled:opacity-50 text-xs uppercase tracking-wider flex items-center justify-center gap-2 mt-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                Xác nhận đổi mật khẩu
              </button>
            </form>
          )}

          {/* Helpdesk link */}
          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">
              Mất cả điện thoại lẫn mã dự phòng?
            </p>
            <Link
              to="/account-recovery"
              className="inline-flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-700 font-semibold mt-1"
            >
              <LifeBuoy className="w-3.5 h-3.5" /> Gửi yêu cầu qua Trung tâm Cứu trợ tài khoản
            </Link>
          </div>
        </div>
      </div>

      <AuthenticatorGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
      />
    </div>
  );
};
