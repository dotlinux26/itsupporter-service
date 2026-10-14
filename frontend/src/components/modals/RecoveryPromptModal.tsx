import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  QrCode,
  Download,
  Copy,
  Check,
  AlertTriangle,
  HelpCircle,
  Clock,
  Key,
  ShieldCheck,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { authApi } from '../../api/client';
import { AuthenticatorGuideModal } from './AuthenticatorGuideModal';
import { useAuth } from '../../context/AuthContext';

interface RecoveryPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RecoveryPromptModal: React.FC<RecoveryPromptModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, refreshUser } = useAuth();
  const [countdown, setCountdown] = useState<number>(15);
  const [loading, setLoading] = useState<boolean>(true);
  const [setupData, setSetupData] = useState<{
    secret: string;
    qrCodeDataUrl: string;
    backupCodes: string[];
  } | null>(null);

  const [verifyCode, setVerifyCode] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [hasDownloadedCodes, setHasDownloadedCodes] = useState<boolean>(false);

  const timerRef = useRef<any>(null);

  // Initialize countdown of 15 seconds whenever modal opens
  useEffect(() => {
    if (!isOpen) return;

    setCountdown(15);
    setErrorMsg('');
    setVerifyCode('');
    setHasDownloadedCodes(false);

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Fetch setup keys
    loadSetupData();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen]);

  const loadSetupData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await authApi.setupRecovery();
      const data = res.data?.data || res.data;
      setSetupData(data);
      // Automatically download backup codes file
      if (data?.backupCodes && data.backupCodes.length > 0) {
        triggerDownload(data.backupCodes);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Không thể tạo khóa TOTP');
    } finally {
      setLoading(false);
    }
  };

  const triggerDownload = (codes: string[]) => {
    try {
      const fileContent = [
        `=============================================================`,
        `IT SUPPORTER HaUI - MÃ DỰ PHÒNG KHÔI PHỤC TÀI KHOẢN (BACKUP CODES)`,
        `=============================================================`,
        `Tài khoản: ${user?.email || 'N/A'} (Họ tên: ${user?.name || 'N/A'})`,
        `Thời gian cấp: ${new Date().toLocaleString('vi-VN')}`,
        ``,
        `HƯỚNG DẪN SỬ DỤNG:`,
        `1. Các mã dưới đây dùng để ĐẶT LẠI MẬT KHẨU khi bạn không có điện thoại hoặc app Authenticator.`,
        `2. Mỗi mã chỉ dùng được DUY NHẤT 1 LẦN. Hệ thống sẽ tự động vô hiệu hóa mã sau khi dùng.`,
        `3. Vui lòng cất giữ file này ở nơi an toàn, không chia sẻ cho bất kỳ ai.`,
        ``,
        `DANH SÁCH 8 MÃ DỰ PHÒNG:`,
        ...codes.map((c, i) => `  [${i + 1}]  ${c}`),
        ``,
        `=============================================================`,
      ].join('\n');

      const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `itsupporter-recovery-codes-${user?.email || 'user'}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setHasDownloadedCodes(true);
    } catch (e) {
      console.warn('Auto download blocked', e);
    }
  };

  const handleCopyKey = () => {
    if (!setupData?.secret) return;
    navigator.clipboard.writeText(setupData.secret);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupData) return;
    if (!verifyCode || verifyCode.trim().length !== 6) {
      setErrorMsg('Vui lòng nhập đúng 6 chữ số hiển thị trên Google Authenticator.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      await authApi.confirmRecovery(
        verifyCode.trim(),
        setupData.secret,
        setupData.backupCodes
      );
      if (refreshUser) {
        await refreshUser();
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message ||
          'Mã xác thực không hợp lệ. Vui lòng kiểm tra lại giờ trên điện thoại và thử lại.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
        <div className="relative w-full max-w-xl bg-slate-900 border-2 border-orange-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600/20 via-amber-600/20 to-orange-600/10 border-b border-orange-500/20 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-orange-500 text-slate-950 font-black shadow-lg shadow-orange-500/30">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white tracking-wide">
                    Bắt buộc thiết lập Khôi phục mật khẩu (TOTP)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    Bảo mật chuẩn
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm text-slate-300">
            {/* Warning banner */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed text-amber-200">
                <b>Khuyến cáo an toàn:</b> Hệ thống không sử dụng Email để cấp lại mật khẩu. Bạn bắt buộc cài đặt ứng dụng <b>Google Authenticator</b> để có thể tự khôi phục mật khẩu khi bị quên.
              </div>
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                <p className="text-xs font-medium">Đang sinh mã hóa và bộ mã dự phòng bảo mật...</p>
              </div>
            ) : setupData ? (
              <div className="space-y-5">
                {/* Step 1: Scan QR */}
                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                      <QrCode className="w-4 h-4" /> Bước 1: Quét mã vào Google Authenticator
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowGuideModal(true)}
                      className="text-xs text-orange-400 hover:text-orange-300 underline font-medium flex items-center gap-1"
                    >
                      <HelpCircle className="w-3.5 h-3.5" /> Hướng dẫn & Video
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                    {setupData.qrCodeDataUrl ? (
                      <div className="p-2 bg-white rounded-xl shrink-0 shadow-md">
                        <img
                          src={setupData.qrCodeDataUrl}
                          alt="Recovery QR"
                          className="w-32 h-32 block"
                        />
                      </div>
                    ) : (
                      <div className="w-32 h-32 bg-slate-800 flex items-center justify-center rounded-xl text-xs text-slate-500">
                        Lỗi tải QR
                      </div>
                    )}

                    <div className="flex-1 space-y-2 text-xs w-full">
                      <p className="text-slate-400 leading-relaxed">
                        Mở Google Authenticator → bấm <b>(+)</b> → <b>Quét mã QR</b>.
                        Dòng mã hiển thị sẽ có tên: <code className="text-orange-300 bg-orange-950/60 px-1.5 py-0.5 rounded font-mono">KhoiPhuc_MatKhau</code>
                      </p>
                      <div>
                        <span className="text-[11px] text-slate-500 block mb-1">
                          Hoặc nhập khóa bí mật (nếu không quét được):
                        </span>
                        <div className="flex items-center gap-1.5 bg-slate-950 p-2 rounded-lg border border-slate-800">
                          <code className="text-[11px] font-mono text-emerald-400 tracking-wider break-all flex-1 select-all">
                            {setupData.secret}
                          </code>
                          <button
                            type="button"
                            onClick={handleCopyKey}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white shrink-0"
                            title="Sao chép khóa"
                          >
                            {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2: Backup codes */}
                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                      <Key className="w-4 h-4" /> Bước 2: Lưu trữ 8 mã dự phòng (Backup Codes)
                    </span>
                    <button
                      type="button"
                      onClick={() => triggerDownload(setupData.backupCodes)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-semibold transition-colors"
                    >
                      {hasDownloadedCodes ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
                      <span>{hasDownloadedCodes ? 'Đã tải .txt (Tải lại)' : 'Tải file .txt'}</span>
                    </button>
                  </div>

                  <p className="text-xs text-slate-400">
                    File <b className="text-white">itsupporter-recovery-codes.txt</b> đã được tải xuống tự động. Mỗi mã dùng được 1 lần khi không có điện thoại:
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                    {setupData.backupCodes.map((code, idx) => (
                      <div
                        key={idx}
                        className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-center font-mono text-xs font-bold text-amber-300 tracking-wider"
                      >
                        {code}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step 3: Trial verification */}
                <form onSubmit={handleVerify} className="p-4 rounded-2xl bg-orange-950/20 border border-orange-500/30 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> Bước 3: Xác minh thử lần 1 để kích hoạt
                  </span>
                  <p className="text-xs text-slate-400">
                    Nhập 6 chữ số đang hiển thị trên dòng <b className="text-white">KhoiPhuc_MatKhau</b> để hoàn tất:
                  </p>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-center text-xl font-mono tracking-[0.4em] font-bold text-white focus:outline-none focus:border-orange-500"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={submitting || verifyCode.length !== 6}
                      className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Kích hoạt ngay
                    </button>
                  </div>

                  {errorMsg && (
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Lưu ý: Nếu mã luôn báo sai, vui lòng kiểm tra tính năng "Đặt giờ tự động" trên điện thoại.</span>
                  </div>
                </form>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                Không thể tải thông tin. Bấm nút thử lại bên dưới.
                <div className="mt-3">
                  <button
                    onClick={loadSetupData}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium inline-flex items-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Thử lại
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer with 15-second countdown lock button */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/60">
            <div className="text-xs text-slate-500">
              {countdown > 0 ? (
                <span className="flex items-center gap-1.5 text-amber-400/90 font-medium">
                  <Clock className="w-3.5 h-3.5 animate-pulse" /> Nút bỏ qua mở sau {countdown}s
                </span>
              ) : (
                <span className="text-slate-400">Bạn có thể tạm bỏ qua và cài đặt sau trong Cài đặt</span>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={countdown > 0}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                countdown > 0
                  ? 'bg-slate-800/50 text-slate-600 border border-slate-800 cursor-not-allowed'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              {countdown > 0 ? `Bỏ qua sau (${countdown}s)` : 'Để sau (Chưa an toàn)'}
            </button>
          </div>
        </div>
      </div>

      <AuthenticatorGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
      />
    </>
  );
};
