import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LifeBuoy,
  Send,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  User,
  Phone,
  Mail,
  Loader2,
  Lock,
} from 'lucide-react';
import { publicApi } from '../../api/client';
import { TurnstileWidget } from '../../components/TurnstileWidget';

export const AccountRecoveryPage: React.FC = () => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [reason, setReason] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
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

  // Client-side link and HTML detector to protect against spam and XSS
  const containsUrlOrLink = (str: string) => {
    // Loại bỏ định dạng email trước để không báo nhầm đuôi tên miền email (@gmail.com, ...)
    const withoutEmail = str.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '');
    const urlPattern = /(https?:\/\/|ftp:\/\/|www\.[a-zA-Z0-9-]+\.[a-zA-Z]{2,})/i;
    return urlPattern.test(withoutEmail);
  };

  const containsHtml = (str: string) => {
    return /<[^>]*>/i.test(str);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Security check: no HTML tags and no web links in text fields
    if (containsHtml(usernameOrEmail) || containsHtml(fullName) || containsHtml(contactPhone) || containsHtml(contactEmail) || containsHtml(reason)) {
      setErrorMsg('Vui lòng chỉ nhập ký tự văn bản thuần túy, không chứa mã HTML.');
      return;
    }

    if (containsUrlOrLink(fullName)) {
      setErrorMsg('Vui lòng không cung cấp đường dẫn liên kết trong trường Họ và tên.');
      return;
    }

    if (containsUrlOrLink(reason)) {
      setErrorMsg('Vì lý do an toàn bảo mật, form cứu trợ nghiêm cấm cung cấp đường dẫn liên kết (links/URLs). Vui lòng xóa link trong phần Lý do.');
      return;
    }

    if (!usernameOrEmail.trim() || !fullName.trim() || !contactPhone.trim() || !reason.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }
    if (turnstileEnabled && !turnstileToken) {
      setErrorMsg('Vui lòng hoàn thành xác thực chống bot Cloudflare Turnstile.');
      return;
    }

    if (reason.trim().length > 1000) {
      setErrorMsg('Mô tả lý do không được vượt quá 1000 ký tự.');
      return;
    }

    setSubmitting(true);
    try {
      await publicApi.submitRecoveryRequest({
        usernameOrEmail: usernameOrEmail.trim(),
        fullName: fullName.trim(),
        contactPhone: contactPhone.trim(),
        contactEmail: contactEmail.trim() || undefined,
        reason: reason.trim(),
        'cf-turnstile-response': turnstileToken,
        turnstileToken,
      });
      setIsSuccess(true);
    } catch (err: any) {
      setTurnstileResetKey((prev) => prev + 1);
      setTurnstileToken('');
      const msg = err.response?.data?.error?.message || err.response?.data?.message || err.message;
      setErrorMsg(msg || 'Lỗi khi gửi yêu cầu. Vui lòng thử lại sau.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl relative z-10 px-4">
        {/* Back Link */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Quay lại trang Đăng nhập
        </Link>

        {/* Title */}
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mb-4">
            <LifeBuoy className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Trung tâm Cứu trợ Tài khoản</h2>
          <p className="mt-1 text-xs text-gray-500">
            Dành cho người dùng mất thiết bị Authenticator và mất toàn bộ mã dự phòng
          </p>
        </div>

        {/* Form Card */}
        <div className="mt-8 bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          {isSuccess ? (
            <div className="text-center space-y-4 py-6 animate-fade-in">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Đã gửi yêu cầu thành công!</h3>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                  Thông tin yêu cầu cứu trợ của bạn đã được chuyển tới Ban Quản trị IT Supporter HaUI qua kênh thông báo bảo mật. Quản trị viên sẽ liên hệ với bạn qua Số điện thoại hoặc phòng làm việc để hỗ trợ cấp lại quyền truy cập.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to="/"
                  className="btn btn-primary inline-block py-2.5 px-6 text-xs"
                >
                  Quay về Trang chủ
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username / Email */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">
                  Tài khoản hoặc Email cần cứu trợ <span className="text-rose-400">*</span>:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    placeholder="email@haui.edu.vn hoặc tên đăng nhập"
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 pl-10 text-sm text-gray-900 focus:outline-none focus:border-rose-500"
                    required
                  />
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">
                  Họ và tên chủ tài khoản <span className="text-rose-400">*</span>:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 pl-10 text-sm text-gray-900 focus:outline-none focus:border-rose-500"
                    required
                  />
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                </div>
              </div>

              {/* Contact Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">
                    Số điện thoại liên hệ <span className="text-rose-400">*</span>:
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="0981234567"
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 pl-10 text-sm text-gray-900 focus:outline-none focus:border-rose-500"
                      required
                    />
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">
                    Email liên hệ phụ (nếu có):
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="email.phu@gmail.com"
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 pl-10 text-sm text-gray-900 focus:outline-none focus:border-rose-500"
                    />
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  </div>
                </div>
              </div>

              {/* Reason / Details */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-700">
                    Mô tả lý do & Hoàn cảnh mất quyền truy cập <span className="text-rose-400">*</span>:
                  </label>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[11px] text-gray-500 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Cấm nhập đường link
                    </span>
                    <span className="text-gray-300 text-[10px]">|</span>
                    <span className={`text-[11px] font-mono ${reason.length >= 1000 ? 'text-rose-600 font-bold' : reason.length > 900 ? 'text-amber-600' : 'text-gray-500'}`}>
                      {reason.length}/1000
                    </span>
                  </div>
                </div>
                <textarea
                  rows={4}
                  maxLength={1000}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ví dụ: Em bị mất điện thoại vào ngày hôm qua, chưa kịp sao lưu file mã dự phòng ra máy tính. Em là sinh viên lớp K16 CNTT..."
                  className="w-full bg-white border border-gray-300 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-rose-500 resize-none leading-relaxed"
                  required
                />
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-error-light border border-error text-error text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">{errorMsg}</div>
                </div>
              )}

              {turnstileEnabled && (
                <TurnstileWidget
                  siteKey={turnstileSiteKey}
                  action="booking"
                  theme="light"
                  resetKey={turnstileResetKey}
                  onVerify={setTurnstileToken}
                  onError={() => setTurnstileToken('')}
                  onExpire={() => setTurnstileToken('')}
                />
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={submitting || (turnstileEnabled && !turnstileToken)}
                className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 mt-3"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Gửi yêu cầu cứu trợ khẩn cấp
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
