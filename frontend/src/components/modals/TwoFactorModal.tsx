import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  ShieldOff,
  QrCode,
  Key,
  Copy,
  Check,
  Download,
  AlertTriangle,
  Loader2,
  Lock,
} from 'lucide-react';
import { authApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { AuthenticatorGuideModal } from './AuthenticatorGuideModal';

interface TwoFactorModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'ENABLE' | 'DISABLE';
  onSuccess?: () => void;
}

export const TwoFactorModal: React.FC<TwoFactorModalProps> = ({
  isOpen,
  onClose,
  mode,
  onSuccess,
}) => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Enable flow states
  const [setupData, setSetupData] = useState<{
    secret: string;
    qrCodeDataUrl: string;
    backupCodes: string[];
  } | null>(null);
  const [tokenInput, setTokenInput] = useState('');

  // Disable flow states
  const [disableSecretOrPass, setDisableSecretOrPass] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg('');
    setTokenInput('');
    setDisableSecretOrPass('');

    if (mode === 'ENABLE') {
      load2FASetup();
    }
  }, [isOpen, mode]);

  const load2FASetup = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await authApi.setup2FA();
      const data = res.data?.data || res.data;
      setSetupData(data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Không thể tạo khóa 2FA.');
    } finally {
      setLoading(false);
    }
  };

  const downloadBackupCodes = (codes: string[]) => {
    const text = [
      `=============================================================`,
      `IT SUPPORTER HaUI - MÃ DỰ PHÒNG 2FA ĐĂNG NHẬP (BACKUP CODES)`,
      `=============================================================`,
      `Tài khoản: ${user?.email || 'N/A'} (Họ tên: ${user?.name || 'N/A'})`,
      `Ngày cấp: ${new Date().toLocaleString('vi-VN')}`,
      ``,
      `HƯỚNG DẪN:`,
      `Mỗi mã dưới đây dùng được 1 lần thay cho mã 6 số khi đăng nhập.`,
      ``,
      `DANH SÁCH 8 MÃ DỰ PHÒNG:`,
      ...codes.map((c, i) => `  [${i + 1}]  ${c}`),
      `=============================================================`,
    ].join('\n');

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `itsupporter-2fa-backup-codes-${user?.email || 'user'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyKey = () => {
    if (!setupData?.secret) return;
    navigator.clipboard.writeText(setupData.secret);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleEnableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupData || tokenInput.length !== 6) return;

    setSubmitting(true);
    setErrorMsg('');
    try {
      await authApi.confirm2FA(tokenInput, setupData.secret, setupData.backupCodes);
      if (refreshUser) await refreshUser();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || 'Mã xác thực không hợp lệ. Vui lòng kiểm tra lại giờ thiết bị.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disableSecretOrPass.trim()) return;

    setSubmitting(true);
    setErrorMsg('');
    try {
      await authApi.disable2FA(disableSecretOrPass.trim());
      if (refreshUser) await refreshUser();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Mật khẩu hoặc mã 2FA không chính xác.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
        <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/40">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl ${
                  mode === 'ENABLE'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                {mode === 'ENABLE' ? <ShieldCheck className="w-5 h-5" /> : <ShieldOff className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {mode === 'ENABLE' ? 'Bật xác thực 2 bước (2FA)' : 'Tắt xác thực 2 bước (2FA)'}
                </h3>
                <p className="text-xs text-slate-400">
                  {mode === 'ENABLE'
                    ? 'Yêu cầu mã 6 số mỗi khi đăng nhập tài khoản'
                    : 'Hạ cấp bảo mật, chỉ cần mật khẩu để đăng nhập'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm text-slate-300">
            {mode === 'ENABLE' ? (
              loading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                  <p className="text-xs">Đang sinh mã khóa 2FA bảo mật...</p>
                </div>
              ) : setupData ? (
                <form onSubmit={handleEnableSubmit} className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <QrCode className="w-4 h-4" /> Quét mã vào Google Authenticator
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowGuideModal(true)}
                        className="text-xs text-emerald-400 hover:text-emerald-300 underline font-medium"
                      >
                        Xem hướng dẫn
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                      {setupData.qrCodeDataUrl && (
                        <div className="p-2 bg-white rounded-xl shrink-0">
                          <img
                            src={setupData.qrCodeDataUrl}
                            alt="2FA QR"
                            className="w-32 h-32 block"
                          />
                        </div>
                      )}
                      <div className="flex-1 space-y-2 text-xs w-full">
                        <p className="text-slate-400 leading-relaxed">
                          Tên khóa sẽ hiển thị trên app là: <code className="text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded font-mono">2FA_DangNhap</code>
                        </p>
                        <div>
                          <span className="text-[11px] text-slate-500 block mb-1">Khóa nhập tay:</span>
                          <div className="flex items-center gap-1.5 bg-slate-950 p-2 rounded-lg border border-slate-800">
                            <code className="text-[11px] font-mono text-emerald-400 tracking-wider break-all flex-1 select-all">
                              {setupData.secret}
                            </code>
                            <button
                              type="button"
                              onClick={handleCopyKey}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                            >
                              {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Backup codes */}
                  <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <Key className="w-4 h-4" /> Bộ mã dự phòng 2FA
                      </span>
                      <button
                        type="button"
                        onClick={() => downloadBackupCodes(setupData.backupCodes)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold"
                      >
                        <Download className="w-3.5 h-3.5" /> Tải về (.txt)
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      {setupData.backupCodes.map((code, idx) => (
                        <div key={idx} className="p-1 text-center font-mono text-xs font-bold text-amber-300 bg-slate-900 rounded">
                          {code}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Verification input */}
                  <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">
                      Nhập mã 6 số từ Google Authenticator để xác nhận:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        value={tokenInput}
                        onChange={(e) => setTokenInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="000000"
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-center text-xl font-mono tracking-[0.4em] font-bold text-white focus:outline-none focus:border-emerald-500"
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={submitting || tokenInput.length !== 6}
                        className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2"
                      >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Bật 2FA
                      </button>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}
                </form>
              ) : null
            ) : (
              // DISABLE FLOW
              <form onSubmit={handleDisableSubmit} className="space-y-4">
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-rose-200 leading-relaxed">
                    <b>Cảnh báo:</b> Khi tắt xác thực 2 bước, tài khoản của bạn sẽ chỉ được bảo vệ bằng mật khẩu. Bất kỳ ai có mật khẩu đều có thể đăng nhập mà không cần xác nhận điện thoại.
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Nhập Mật khẩu hiện tại HOẶC Mã 2FA 6 số để xác nhận:
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={disableSecretOrPass}
                      onChange={(e) => setDisableSecretOrPass(e.target.value)}
                      placeholder="Mật khẩu hoặc mã 6 số..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 pl-10 text-sm text-white focus:outline-none focus:border-rose-500"
                      autoFocus
                    />
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !disableSecretOrPass.trim()}
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-rose-600/20"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Xác nhận tắt 2FA
                  </button>
                </div>
              </form>
            )}
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
