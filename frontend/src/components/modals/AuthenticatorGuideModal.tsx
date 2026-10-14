import React, { useState } from 'react';
import {
  X,
  Smartphone,
  ShieldAlert,
  Clock,
  Play,
  CheckCircle2,
  ExternalLink,
  Info,
} from 'lucide-react';

interface AuthenticatorGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthenticatorGuideModal: React.FC<AuthenticatorGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'sync'>('android');
  const [showVideo, setShowVideo] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Hướng dẫn cài đặt Google Authenticator</h3>
              <p className="text-xs text-slate-400">Bảo mật mã một lần chuẩn RFC 6238</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video demonstration embed / popup if activated */}
        {showVideo && (
          <div className="p-4 bg-slate-950 border-b border-slate-800 animate-slide-down">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 fill-current" /> Video hướng dẫn nhanh (1 phút)
              </span>
              <button
                onClick={() => setShowVideo(false)}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                Đóng video
              </button>
            </div>
            <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
              <iframe
                title="Google Authenticator Tutorial"
                src="https://www.youtube-nocookie.com/embed/n4sM0fK6n8A?autoplay=1"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('android')}
            className={`pb-3 px-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'android'
                ? 'border-orange-500 text-orange-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" /> Android (Samsung, Xiaomi, Oppo...)
          </button>
          <button
            onClick={() => setActiveTab('ios')}
            className={`pb-3 px-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'ios'
                ? 'border-orange-500 text-orange-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" /> iOS (iPhone / iPad)
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`pb-3 px-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'sync'
                ? 'border-orange-500 text-orange-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" /> Sửa lỗi lệch giờ
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm text-slate-300">
          {activeTab === 'android' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-white">Tải ứng dụng</h4>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Mở <b>Google Play Store</b>, tìm kiếm <b>Google Authenticator</b> và bấm Cài đặt.
                  </p>
                  <a
                    href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 mt-2 font-medium"
                  >
                    Mở Google Play Store <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-white">Quét mã QR hoặc Nhập khóa bí mật</h4>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Mở ứng dụng, bấm dấu <b>(+)</b> ở góc dưới bên phải màn hình:
                  </p>
                  <ul className="list-disc list-inside text-xs text-slate-300 mt-1.5 space-y-1">
                    <li>Chọn <b>Quét mã QR</b> và hướng camera vào mã QR trên màn hình máy tính.</li>
                    <li>Hoặc chọn <b>Nhập khóa thiết lập</b> nếu camera không nhận diện được.</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center shrink-0 text-xs">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-white">Lưu mã dự phòng & Xác minh</h4>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Lưu trữ 8 mã dự phòng (Backup Codes) vào nơi an toàn. Sau đó nhập 6 chữ số đang hiển thị trên điện thoại để hoàn tất kích hoạt.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ios' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-white">Tải ứng dụng trên App Store</h4>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Mở <b>App Store</b> trên iPhone/iPad, tìm và cài đặt <b>Google Authenticator</b>.
                  </p>
                  <a
                    href="https://apps.apple.com/us/app/google-authenticator/id388497605"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 mt-2 font-medium"
                  >
                    Mở Apple App Store <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-white">Thêm tài khoản</h4>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Bấm dấu <b>(+)</b> $\rightarrow$ <b>Quét mã QR</b>. Cấp quyền truy cập Camera cho ứng dụng khi được hỏi.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center shrink-0 text-xs">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-white">Hoàn tất thiết lập</h4>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Tải file mã dự phòng về máy và nhập 6 số trên màn hình iPhone vào để xác nhận.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sync' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <b className="font-semibold text-amber-200">Tại sao nhập đúng 6 số nhưng hệ thống báo sai?</b>
                  <p className="mt-1 text-amber-300/90 leading-relaxed">
                    Mã TOTP được sinh ra dựa trên đồng hồ thời gian chuẩn (30 giây/mã). Nếu giờ trên điện thoại của bạn chạy nhanh hoặc chậm hơn thời gian thực dù chỉ vài giây, mã sinh ra sẽ không khớp với máy chủ!
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-white text-xs uppercase tracking-wider">Cách khắc phục nhanh:</h4>
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                  <p className="font-medium text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Cách 1: Bật "Đặt giờ tự động" trên điện thoại
                  </p>
                  <p className="text-xs text-slate-400 pl-6">
                    Vào <b>Cài đặt (Settings)</b> $\rightarrow$ <b>Ngày & Giờ (Date & Time)</b> $\rightarrow$ Bật công tắc <b>"Đặt tự động" (Set Automatically)</b>.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                  <p className="font-medium text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Cách 2: Đồng bộ giờ trong Google Authenticator (Android)
                  </p>
                  <p className="text-xs text-slate-400 pl-6">
                    Mở Google Authenticator $\rightarrow$ bấm menu <b>3 chấm</b> ở góc trên $\rightarrow$ <b>Cài đặt (Settings)</b> $\rightarrow$ <b>Khắc phục sự cố về thời gian cho các mã</b> $\rightarrow$ <b>Đồng bộ hóa ngay (Sync now)</b>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-800/30">
          {!showVideo ? (
            <button
              onClick={() => setShowVideo(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-orange-400 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Xem Video hướng dẫn
            </button>
          ) : (
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" /> Video đang mở ở phía trên
            </div>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-lg shadow-orange-600/20 transition-colors"
          >
            Đã hiểu, quay lại
          </button>
        </div>
      </div>
    </div>
  );
};
