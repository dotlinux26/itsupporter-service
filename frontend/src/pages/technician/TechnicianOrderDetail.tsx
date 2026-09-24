import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { technicianApi, publicApi, voucherApi } from '../../api/client';
import { MarkdownRenderer } from '../../components/MarkdownRenderer';
import { ZoomableImage } from '../../components/ImageModal';
import {
  Clock,
  AlertTriangle,
  PlusCircle,
  QrCode,
  CheckCircle2,
  MessageSquare,
  ArrowLeft,
  DollarSign,
  Ticket,
  AlertCircle
} from 'lucide-react';

export function TechnicianOrderDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Live timer for IN_PROGRESS
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const timerRef = useRef<any>(null);

  // Active bank payment QR
  const [bankQrUrl, setBankQrUrl] = useState<string | null>(null);

  // Modals / forms
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [salePrograms, setSalePrograms] = useState<any[]>([]);
  const [selectedSaleProgramId, setSelectedSaleProgramId] = useState<number | null>(null);

  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendFeeInput, setExtendFeeInput] = useState('50000');
  const [extendReasonInput, setExtendReasonInput] = useState('Làm thêm dịch vụ theo yêu cầu khách');

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatusChoice, setPaymentStatusChoice] = useState<'PAID' | 'UNPAID'>('PAID');
  const [unpaidReason, setUnpaidReason] = useState('');

  const loadOrder = async () => {
    if (!id) return;
    try {
      const response = await technicianApi.orderDetail(Number(id));
      setOrder(response.data.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('Không tìm thấy đơn hàng hoặc bạn không được phân công đơn này');
      } else {
        setError(err.response?.data?.error?.message || 'Lỗi tải đơn hàng');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadBankQr = async () => {
    try {
      const res = await publicApi.activeQr();
      if (res.data.data?.path) {
        setBankQrUrl(res.data.data.path);
      }
    } catch (err) {
      console.error('Failed to load active QR:', err);
    }
  };

  const loadSalePrograms = async () => {
    try {
      const res = await voucherApi.programs();
      const list = res.data.data || [];
      setSalePrograms(list.filter((p: any) => p.is_active));
    } catch (err) {
      console.error('Failed to load programs:', err);
    }
  };

  useEffect(() => {
    loadOrder();
    loadBankQr();
    loadSalePrograms();
  }, [id]);

  // Handle timer
  useEffect(() => {
    if (order?.status === 'IN_PROGRESS' && order?.started_at) {
      const startTime = new Date(order.started_at).getTime();
      const updateTimer = () => {
        const now = Date.now();
        const diff = Math.max(0, Math.floor((now - startTime) / 1000));
        setElapsedSeconds(diff);
      };
      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [order?.status, order?.started_at]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAction = async (action: 'confirm' | 'start' | 'complete', completionResult?: 'SUCCESS' | 'FAILED' | 'CANCELLED') => {
    if (!id) return;
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      if (action === 'confirm') {
        await technicianApi.confirm(Number(id));
        setSuccess('Đã xác nhận nhận đơn hàng thành công');
      } else if (action === 'start') {
        await technicianApi.start(Number(id));
        setSuccess('Đã bắt đầu đơn hàng! Bộ đếm thời gian đang chạy.');
      } else if (action === 'complete') {
        await technicianApi.complete(Number(id), { completion_result: completionResult || 'SUCCESS' });
        setSuccess('Đã hoàn thành đơn hàng và kết toán tài chính vào sổ cái!');
      }
      loadOrder();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Thao tác thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  // Late Penalty Free Service button handler
  const handleApplyPenalty = async (percent: number) => {
    if (!id) return;
    const confirmMsg =
      percent === 100
        ? 'Xác nhận áp dụng vi phạm muộn > 30p: Làm MIỄN PHÍ cho khách (Đơn hàng 0đ, Kỹ thuật viên không nhận tiền)?'
        : 'Xác nhận trừ phạt 15% cho đơn này?';
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    setError('');
    try {
      await technicianApi.penalty(Number(id), {
        penalty_percent: percent,
        reason: percent === 100 ? 'Muộn > 30p - Làm FREE cho khách hàng' : 'Đến muộn 15%',
      });
      setSuccess(`Đã áp dụng mức phạt ${percent}% thành công!`);
      loadOrder();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Lỗi áp dụng phạt');
    } finally {
      setActionLoading(false);
    }
  };

  // Redeem customer's voucher code
  const handleRedeemVoucher = async () => {
    if (!id || !voucherCodeInput.trim()) return;
    setActionLoading(true);
    setError('');
    try {
      await technicianApi.redeemVoucher(Number(id), voucherCodeInput.trim());
      setSuccess('Đã áp dụng voucher của khách hàng thành công và gạch mã trên hệ thống!');
      setVoucherCodeInput('');
      setShowVoucherModal(false);
      loadOrder();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Mã voucher không hợp lệ');
    } finally {
      setActionLoading(false);
    }
  };

  // Select Sale program
  const handleApplySaleProgram = async () => {
    if (!id || !selectedSaleProgramId) return;
    setActionLoading(true);
    setError('');
    try {
      await technicianApi.saleProgram(Number(id), selectedSaleProgramId);
      setSuccess('Đã áp dụng chương trình giảm giá thành công!');
      setShowVoucherModal(false);
      loadOrder();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Lỗi áp dụng chương trình');
    } finally {
      setActionLoading(false);
    }
  };

  // Add extend fee
  const handleAddExtendFee = async () => {
    if (!id) return;
    setActionLoading(true);
    setError('');
    try {
      await technicianApi.extend(Number(id), {
        extend_fee: Number(extendFeeInput),
        reason: extendReasonInput,
      });
      setSuccess('Đã thêm phụ phí dịch vụ (100% phần này thuộc về KTV)!');
      setShowExtendModal(false);
      loadOrder();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Lỗi thêm phụ phí');
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm payment
  const handleSavePayment = async () => {
    if (!id) return;
    setActionLoading(true);
    setError('');
    try {
      await technicianApi.payment(Number(id), {
        payment_status: paymentStatusChoice,
        unpaid_reason: paymentStatusChoice === 'UNPAID' ? unpaidReason : null,
        payment_qr_path: bankQrUrl,
      });
      setSuccess(`Đã cập nhật trạng thái thanh toán: ${paymentStatusChoice === 'PAID' ? 'Đã thu tiền' : 'Chưa thu'}`);
      setShowPaymentModal(false);
      loadOrder();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Lỗi lưu thanh toán');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-16 text-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-2xl font-bold text-text mb-4">Không tìm thấy đơn hàng</h1>
        <button onClick={() => navigate('/technician/orders')} className="btn btn-primary">Quay lại danh sách</button>
      </div>
    );
  }

  return (
    <div className="container py-10 md:py-12 max-w-5xl">
      {/* Top back bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/technician/orders')}
          className="btn btn-ghost btn-sm flex items-center gap-1 text-text-secondary"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
        </button>

        <Link
          to={`/orders/${id}/chat`}
          className="btn btn-outline text-orange-600 border-orange-300 hover:bg-orange-50 flex items-center gap-1.5 text-sm"
        >
          <MessageSquare className="w-4 h-4" />
          Mở khung Chat với khách
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 flex items-center gap-2 text-sm border border-red-200">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-lg bg-green-50 text-green-700 flex items-center gap-2 text-sm border border-green-200">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Main Order Header Card */}
      <div className="card p-6 mb-6 border border-border">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-text font-mono">{order.code}</h1>
              <span
                className={`badge ${
                  order.status === 'PENDING'
                    ? 'badge-pending'
                    : order.status === 'CONFIRMED'
                    ? 'badge-confirmed'
                    : order.status === 'IN_PROGRESS'
                    ? 'badge-in_progress'
                    : order.status === 'COMPLETED'
                    ? 'badge-completed'
                    : 'badge-cancelled'
                }`}
              >
                {order.status === 'PENDING'
                  ? 'Chờ xác nhận'
                  : order.status === 'CONFIRMED'
                  ? 'Đã xác nhận'
                  : order.status === 'IN_PROGRESS'
                  ? 'Đang thực hiện'
                  : order.status === 'COMPLETED'
                  ? 'Hoàn thành'
                  : 'Đã hủy'}
              </span>

              {order.penalty_percent > 0 && (
                <span className="badge bg-red-100 text-red-700 border border-red-300 font-bold">
                  {order.penalty_percent === 100 ? 'LÀM MIỄN PHÍ (0đ)' : `Phạt -${order.penalty_percent}%`}
                </span>
              )}
            </div>
            <p className="text-sm text-text-secondary mt-1">
              Khách hàng: <strong className="text-text">{order.customer_name}</strong> • SĐT: <strong className="text-text">{order.customer_phone || 'Chưa cung cấp'}</strong>
            </p>
          </div>

          {/* Real-time Timer widget when IN_PROGRESS */}
          {order.status === 'IN_PROGRESS' && (
            <div className={`p-4 rounded-xl flex items-center gap-3 border shadow-sm ${
              elapsedSeconds >= 3600
                ? 'bg-red-50 border-red-200 text-red-700'
                : elapsedSeconds >= 3000
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-orange-50 border-orange-200 text-orange-800'
            }`}>
              <Clock className="w-6 h-6 animate-pulse" />
              <div>
                <div className="text-xs uppercase font-bold tracking-wider opacity-80">Thời gian làm việc</div>
                <div className="text-2xl font-mono font-extrabold">{formatTimer(elapsedSeconds)}</div>
              </div>
            </div>
          )}
        </div>

        {/* Detailed Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Gói dịch vụ</h4>
            <p className="font-bold text-text text-base">{order.package_name}</p>
            <div className="text-sm text-text-secondary pt-1">
              <MarkdownRenderer content={order.note || 'Không có ghi chú thêm'} />
            </div>
          </div>

          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Lịch hẹn dịch vụ</h4>
            <p className="font-semibold text-text">
              {new Date(order.scheduled_date).toLocaleDateString('vi-VN')}
            </p>
            <p className="text-sm text-orange-600 font-bold">
              Ca: {order.scheduled_start} - {order.scheduled_end}
            </p>
          </div>

          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Địa chỉ phục vụ</h4>
            <p className="text-sm text-text font-medium leading-snug">{order.location}</p>
          </div>
        </div>

        {/* Financial Details Box */}
        <div className="bg-slate-50 p-4 rounded-xl border border-border mb-6">
          <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Chi tiết thanh toán đơn hàng</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-text-secondary">Giá gốc gói:</span>
              <div className="font-semibold text-text">{Number(order.price).toLocaleString('vi-VN')}đ</div>
            </div>
            <div>
              <span className="text-text-secondary">Phụ phí (Tech 100%):</span>
              <div className="font-semibold text-green-600">+{Number(order.extend_fee || 0).toLocaleString('vi-VN')}đ</div>
            </div>
            <div>
              <span className="text-text-secondary">Giảm giá / Voucher:</span>
              <div className="font-semibold text-orange-600">-{Number(order.discount || 0).toLocaleString('vi-VN')}đ</div>
            </div>
            <div>
              <span className="text-text-secondary">Khách cần thanh toán:</span>
              <div className="text-xl font-extrabold text-orange-600">
                {Number(order.final_amount).toLocaleString('vi-VN')}đ
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span>Trạng thái tiền:</span>
              <span className={`font-bold px-2 py-0.5 rounded ${order.payment_status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {order.payment_status === 'PAID' ? 'Đã thu tiền' : 'Chưa thu tiền'}
              </span>
              {order.unpaid_reason && <span className="text-red-600">({order.unpaid_reason})</span>}
            </div>

            {order.status === 'IN_PROGRESS' && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="text-orange-600 hover:text-orange-700 font-semibold underline"
              >
                Cập nhật đã thu/chưa thu
              </button>
            )}
          </div>
        </div>

        {/* In-Session Technician Feature Toolbar */}
        {order.status === 'IN_PROGRESS' && (
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-border">
            {/* Sale Program & Voucher button */}
            <button
              onClick={() => setShowVoucherModal(true)}
              className="btn btn-outline flex items-center gap-1.5 text-xs py-2"
              type="button"
            >
              <Ticket className="w-4 h-4 text-orange-600" />
              Áp dụng Voucher / Giảm giá
            </button>

            {/* Extra service fee button */}
            <button
              onClick={() => setShowExtendModal(true)}
              className="btn btn-outline flex items-center gap-1.5 text-xs py-2"
              type="button"
            >
              <PlusCircle className="w-4 h-4 text-green-600" />
              Thêm phụ phí / gia hạn (100% KTV)
            </button>

            {/* Late penalty button */}
            {order.penalty_percent < 100 && (
              <button
                onClick={() => handleApplyPenalty(100)}
                className="btn btn-outline text-red-600 hover:bg-red-50 border-red-300 flex items-center gap-1.5 text-xs py-2 ml-auto"
                type="button"
              >
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Vi phạm muộn &gt; 30p: Làm FREE cho khách (0đ)
              </button>
            )}
          </div>
        )}

        {/* State Transition Actions */}
        <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-border">
          {order.status === 'PENDING' && (
            <button
              onClick={() => handleAction('confirm')}
              disabled={actionLoading}
              className="btn btn-primary"
            >
              {actionLoading ? 'Đang xử lý...' : 'Xác nhận nhận đơn'}
            </button>
          )}

          {order.status === 'CONFIRMED' && (
            <button
              onClick={() => handleAction('start')}
              disabled={actionLoading}
              className="btn btn-primary bg-orange-600 hover:bg-orange-700 flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              {actionLoading ? 'Đang xử lý...' : 'Bắt đầu làm việc (Bật Timer)'}
            </button>
          )}

          {order.status === 'IN_PROGRESS' && (
            <>
              <button
                onClick={() => handleAction('complete', 'SUCCESS')}
                disabled={actionLoading}
                className="btn btn-primary bg-green-600 hover:bg-green-700 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {actionLoading ? 'Đang lưu...' : 'Hoàn thành dịch vụ (Kết toán)'}
              </button>

              <button
                onClick={() => handleAction('complete', 'FAILED')}
                disabled={actionLoading}
                className="btn btn-outline text-red-600 hover:bg-red-50"
              >
                Hủy / Thất bại
              </button>
            </>
          )}
        </div>
      </div>

      {/* Payment QR Section */}
      <div className="card p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <QrCode className="w-6 h-6 text-orange-600" />
            <h3 className="font-bold text-text text-lg">QR Chuyển khoản thanh toán</h3>
          </div>
          <span className="text-xs text-text-muted">Ảnh QR chính thức do Admin tải lên</span>
        </div>

        <div className="text-center py-4 bg-slate-50 rounded-xl border border-dashed border-gray-300">
          {bankQrUrl ? (
            <div className="inline-block p-4 bg-white rounded-xl shadow-sm border border-border">
              <ZoomableImage
                src={bankQrUrl}
                alt="QR thanh toán ngân hàng"
                className="w-56 h-56 mx-auto object-contain rounded-lg transition-transform"
                title="QR Chuyển khoản thanh toán ngân hàng"
                caption={`Quét mã QR để chuyển khoản • Số tiền: ${Number(order.final_amount).toLocaleString('vi-VN')} VNĐ`}
              />
              <p className="text-xs font-semibold text-gray-700 mt-2">
                Quét mã để chuyển khoản thanh toán
              </p>
              <p className="text-sm font-bold text-orange-600 mt-1">
                Số tiền: {Number(order.final_amount).toLocaleString('vi-VN')} VNĐ
              </p>
              <p className="text-[11px] text-text-muted mt-1">
                (Click vào ảnh để phóng to toàn màn hình)
              </p>
            </div>
          ) : (
            <div className="py-8 text-text-secondary">
              <QrCode className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium">Chưa có ảnh QR nào được cấu hình bởi Admin.</p>
              <p className="text-xs text-text-muted mt-1">Kỹ thuật viên có thể thu tiền mặt trực tiếp từ khách hàng.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Áp dụng Voucher & Sale Event */}
      {showVoucherModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-orange-600" />
              Ưu đãi & Voucher cho đơn này
            </h3>

            {/* Mục 1: Khách đọc mã Voucher dùng 1 lần */}
            <div className="mb-6 pb-6 border-b border-border">
              <h4 className="text-sm font-semibold text-text mb-2">1. Nhập mã Voucher của khách</h4>
              <p className="text-xs text-text-secondary mb-3">
                Khách hàng đọc mã voucher cá nhân (dùng 1 lần gạch luôn sau khi áp dụng).
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="VD: WELCOME10-A9B2C3"
                  value={voucherCodeInput}
                  onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
                  className="input font-mono uppercase text-sm flex-1"
                />
                <button
                  type="button"
                  onClick={handleRedeemVoucher}
                  disabled={!voucherCodeInput.trim() || actionLoading}
                  className="btn btn-primary text-xs"
                >
                  Áp dụng
                </button>
              </div>
            </div>

            {/* Mục 2: KTV chọn chương trình Sale chung */}
            <div>
              <h4 className="text-sm font-semibold text-text mb-2">2. Chọn chương trình khuyến mãi chung</h4>
              <p className="text-xs text-text-secondary mb-3">
                Chọn chương trình giảm giá hệ thống (có thể cộng dồn với mã voucher riêng).
              </p>
              <div className="space-y-3">
                <select
                  value={selectedSaleProgramId || ''}
                  onChange={(e) => setSelectedSaleProgramId(Number(e.target.value))}
                  className="input text-sm"
                >
                  <option value="">-- Chọn chương trình giảm giá --</option>
                  {salePrograms.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.discount_type === 'percent' ? `-${p.discount_value}%` : `-${p.discount_value.toLocaleString('vi-VN')}đ`})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleApplySaleProgram}
                  disabled={!selectedSaleProgramId || actionLoading}
                  className="btn btn-primary w-full text-xs"
                >
                  Áp dụng chương trình
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-4 mt-6 border-t border-border">
              <button
                type="button"
                onClick={() => setShowVoucherModal(false)}
                className="btn btn-ghost text-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Thêm phụ phí extend */}
      {showExtendModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-text mb-2 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Thêm phụ phí dịch vụ / Gia hạn thời gian
            </h3>
            <p className="text-xs text-text-secondary mb-4">
              Theo quy định thỏa thuận, Kỹ thuật viên hưởng 100% phần phụ phí làm thêm này.
            </p>

            <div className="space-y-4">
              <div>
                <label className="label">Số tiền phụ phí (VNĐ)</label>
                <input
                  type="number"
                  step={10000}
                  min={10000}
                  value={extendFeeInput}
                  onChange={(e) => setExtendFeeInput(e.target.value)}
                  className="input font-semibold"
                />
              </div>

              <div>
                <label className="label">Lý do phụ phí / thỏa thuận</label>
                <textarea
                  rows={2}
                  value={extendReasonInput}
                  onChange={(e) => setExtendReasonInput(e.target.value)}
                  className="input"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowExtendModal(false)}
                  className="btn btn-ghost"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleAddExtendFee}
                  disabled={actionLoading}
                  className="btn btn-primary bg-green-600 hover:bg-green-700"
                >
                  Xác nhận thêm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cập nhật thanh toán */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-text mb-4">Xác nhận thu tiền từ khách hàng</h3>

            <div className="space-y-4">
              <div>
                <label className="label">Trạng thái thu tiền</label>
                <select
                  value={paymentStatusChoice}
                  onChange={(e) => setPaymentStatusChoice(e.target.value as 'PAID' | 'UNPAID')}
                  className="input"
                >
                  <option value="PAID">Đã thu tiền thành công (Khách đã quét QR hoặc trả tiền mặt)</option>
                  <option value="UNPAID">Chưa thu được tiền</option>
                </select>
              </div>

              {paymentStatusChoice === 'UNPAID' && (
                <div>
                  <label className="label">Lý do chưa thu (bắt buộc)</label>
                  <textarea
                    rows={2}
                    value={unpaidReason}
                    onChange={(e) => setUnpaidReason(e.target.value)}
                    placeholder="VD: Khách xin chuyển khoản sau trong ngày..."
                    className="input"
                    required
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="btn btn-ghost"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSavePayment}
                  disabled={actionLoading || (paymentStatusChoice === 'UNPAID' && !unpaidReason.trim())}
                  className="btn btn-primary"
                >
                  Lưu xác nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}