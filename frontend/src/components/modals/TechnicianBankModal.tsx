import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/client';
import { CreditCard, QrCode, AlertCircle, Loader2, Upload, CheckCircle2 } from 'lucide-react';

export function TechnicianBankModal() {
  const { user, refreshUser } = useAuth();
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');

  // Trigger fallback only when logged in user is a TECHNICIAN and has not configured bank_info
  const isMissingBankInfo = Boolean(
    user && user.role === 'TECHNICIAN' && (!user.bank_info || !user.bank_info.trim())
  );

  const [bankInfo, setBankInfo] = useState('');
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isMissingBankInfo) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
        setError(isEn ? 'Please choose PNG, JPG or WEBP image.' : 'Chỉ chấp nhận file ảnh định dạng PNG, JPG hoặc WEBP.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(isEn ? 'Image size must be under 5MB.' : 'Dung lượng ảnh tối đa 5MB.');
        return;
      }
      setQrFile(file);
      setQrPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!bankInfo.trim() || bankInfo.trim().length < 8) {
      setError(
        isEn
          ? 'Please enter detailed bank info (e.g. Bank name - Account number - Account holder).'
          : 'Vui lòng nhập rõ thông tin tài khoản (VD: MB Bank - 0988123456 - NGUYEN VAN A).'
      );
      return;
    }

    setLoading(true);
    try {
      // 1. Upload QR file if provided
      if (qrFile) {
        await authApi.uploadBankQr(qrFile);
      }

      // 2. Update bank_info text
      await authApi.updateProfile({
        bankInfo: bankInfo.trim(),
      });

      await refreshUser();
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        (isEn ? 'Failed to save bank information.' : 'Lưu thông tin thất bại. Vui lòng thử lại.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-orange-100 max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-orange-600 to-amber-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">
                {isEn ? 'Technician Payout Account' : 'Tài khoản nhận quyết toán KTV'}
              </h3>
              <p className="text-xs text-orange-100 mt-0.5">
                {isEn ? 'Required for manager commission disbursement' : 'Bắt buộc để Quản lý giải ngân hoa hồng đơn hàng'}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <p className="text-xs text-slate-600 leading-relaxed">
            {isEn
              ? 'To receive automated commission settlements from management, please provide your bank account information:'
              : 'Để Quản lý có thể chuyển khoản hoa hồng cho bạn trực tiếp trên phiếu quyết toán, vui lòng cập nhật số tài khoản nhận tiền bên dưới:'}
          </p>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-orange-600" />
              <span>{isEn ? 'Bank details (Text description)' : 'Thông tin tài khoản ngân hàng (Bắt buộc)'}</span>
              <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={bankInfo}
              onChange={(e) => setBankInfo(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-orange-50/40 border border-orange-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder={isEn ? 'Example: MB Bank - 0988123456 - NGUYEN VAN A' : 'VD: MB Bank - 0988123456 - NGUYEN VAN A'}
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              {isEn
                ? 'Format: [Bank name] - [Account number] - [Account holder name]'
                : 'Định dạng: [Tên Ngân hàng] - [Số tài khoản] - [Tên chủ tài khoản]'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-slate-500" />
              <span>{isEn ? 'Payment QR code image (Optional)' : 'Ảnh mã QR nhận tiền (Tùy chọn)'}</span>
            </label>
            <div className="flex items-center gap-4 mt-1.5">
              <label className="cursor-pointer px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 flex items-center gap-2 transition">
                <Upload className="w-4 h-4 text-slate-600" />
                <span>{qrFile ? (isEn ? 'Change QR image' : 'Đổi ảnh QR khác') : (isEn ? 'Upload QR image' : 'Tải ảnh mã QR lên')}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {qrFile && (
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {qrFile.name}
                </span>
              )}
            </div>

            {qrPreview && (
              <div className="mt-3 p-2 bg-slate-50 border border-slate-200 rounded-xl max-w-[160px]">
                <img
                  src={qrPreview}
                  alt="Bank QR Preview"
                  className="w-full h-auto rounded-lg object-contain"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3 px-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold text-sm rounded-xl shadow-md shadow-orange-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isEn ? 'Saving...' : 'Đang lưu...'}</span>
              </>
            ) : (
              <span>{isEn ? 'Save & Continue' : 'Lưu thông tin thanh toán & Tiếp tục'}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
