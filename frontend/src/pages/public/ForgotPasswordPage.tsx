import React, { useState } from 'react';
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
import { AuthenticatorGuideModal } from '../../components/modals/AuthenticatorGuideModal';

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

    setSubmitting(true);
    try {
      await authApi.forgotPasswordTotp(identifier.trim(), code.trim(), newPassword);
      setIsSuccess(true);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || err.message;
      setErrorMsg(msg || 'Mã xác thực không hợp lệ hoặc đã hết hạn.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glowing decorations */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Back button */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Quay lại trang Đăng nhập
        </Link>

        {/* Logo & Title */}
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/10 mb-4">
            <KeyRound className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Khôi phục mật khẩu</h2>
          <p className="mt-1 text-xs text-slate-400">
            Xác thực toán học thuần túy qua ứng dụng <b className="text-slate-300">Google Authenticator</b>
          </p>
        </div>

        {/* Card */}
        <div className="mt-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          {isSuccess ? (
            <div className="text-center space-y-4 py-4 animate-fade-in">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Đổi mật khẩu thành công!</h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Mật khẩu tài khoản của bạn đã được cập nhật an toàn. Bạn có thể sử dụng mật khẩu mới để đăng nhập ngay bây giờ.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-orange-500/20 transition-all"
                >
                  Đăng nhập ngay
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Identifier */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Email hoặc Tên tài khoản:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="email@example.com hoặc username"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 pl-10 text-sm text-white focus:outline-none focus:border-orange-500"
                    required
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                </div>
              </div>

              {/* TOTP Code or Backup Code */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Mã 6 số TOTP hoặc Mã dự phòng:
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowGuideModal(true)}
                    className="text-[11px] text-orange-400 hover:underline flex items-center gap-1"
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
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 pl-10 text-sm font-mono text-white tracking-wider focus:outline-none focus:border-orange-500"
                    required
                  />
                  <Shield className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                </div>
                <p className="text-[11px] text-slate-500">
                  Mở Google Authenticator chọn dòng <b className="text-orange-400">KhoiPhuc_MatKhau</b>
                </p>
              </div>

              {/* New Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Mật khẩu mới (ít nhất 8 ký tự):
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 pl-10 text-sm text-white focus:outline-none focus:border-orange-500"
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Xác nhận lại mật khẩu:
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 pl-10 text-sm text-white focus:outline-none focus:border-orange-500"
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                </div>
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">{errorMsg}</div>
                </div>
              )}

              {/* Clock Sync Warning Banner */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300/90 text-[11px] flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Nếu mã luôn báo không hợp lệ, vui lòng kiểm tra xem điện thoại của bạn có bật <b>"Đặt giờ tự động"</b> hay chưa (hoặc vào Google Authenticator chọn "Đồng bộ hóa thời gian").
                </span>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 mt-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                Xác nhận đổi mật khẩu
              </button>
            </form>
          )}

          {/* Helpdesk link */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Mất cả điện thoại lẫn mã dự phòng?
            </p>
            <Link
              to="/account-recovery"
              className="inline-flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 font-semibold mt-1"
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
