import React, { useState } from 'react';
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

export const AccountRecoveryPage: React.FC = () => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [reason, setReason] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

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

    setSubmitting(true);
    try {
      await publicApi.submitRecoveryRequest({
        usernameOrEmail: usernameOrEmail.trim(),
        fullName: fullName.trim(),
        contactPhone: contactPhone.trim(),
        contactEmail: contactEmail.trim() || undefined,
        reason: reason.trim(),
      });
      setIsSuccess(true);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || err.message;
      setErrorMsg(msg || 'Lỗi khi gửi yêu cầu. Vui lòng thử lại sau.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-xl relative z-10 px-4">
        {/* Back Link */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Quay lại trang Đăng nhập
        </Link>

        {/* Title */}
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/10 mb-4">
            <LifeBuoy className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Trung tâm Cứu trợ Tài khoản</h2>
          <p className="mt-1 text-xs text-slate-400">
            Dành cho người dùng mất thiết bị Authenticator và mất toàn bộ mã dự phòng
          </p>
        </div>

        {/* Form Card */}
        <div className="mt-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {isSuccess ? (
            <div className="text-center space-y-4 py-6 animate-fade-in">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Đã gửi yêu cầu thành công!</h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Thông tin yêu cầu cứu trợ của bạn đã được chuyển tới Ban Quản trị IT Supporter HaUI qua kênh thông báo bảo mật. Quản trị viên sẽ liên hệ với bạn qua Số điện thoại hoặc phòng làm việc để hỗ trợ cấp lại quyền truy cập.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to="/"
                  className="inline-block py-2.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
                >
                  Quay về Trang chủ
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username / Email */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Tài khoản hoặc Email cần cứu trợ <span className="text-rose-400">*</span>:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    placeholder="email@haui.edu.vn hoặc tên đăng nhập"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 pl-10 text-sm text-white focus:outline-none focus:border-rose-500"
                    required
                  />
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Họ và tên chủ tài khoản <span className="text-rose-400">*</span>:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 pl-10 text-sm text-white focus:outline-none focus:border-rose-500"
                    required
                  />
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                </div>
              </div>

              {/* Contact Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Số điện thoại liên hệ <span className="text-rose-400">*</span>:
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="0981234567"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 pl-10 text-sm text-white focus:outline-none focus:border-rose-500"
                      required
                    />
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Email liên hệ phụ (nếu có):
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="email.phu@gmail.com"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 pl-10 text-sm text-white focus:outline-none focus:border-rose-500"
                    />
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  </div>
                </div>
              </div>

              {/* Reason / Details */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Mô tả lý do & Hoàn cảnh mất quyền truy cập <span className="text-rose-400">*</span>:
                  </label>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Cấm nhập đường link
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ví dụ: Em bị mất điện thoại vào ngày hôm qua, chưa kịp sao lưu file mã dự phòng ra máy tính. Em là sinh viên lớp K16 CNTT..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-rose-500 resize-none leading-relaxed"
                  required
                />
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">{errorMsg}</div>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center gap-2 mt-3"
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
