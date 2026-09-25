import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { technicianApi, publicApi, voucherApi } from '../../api/client';
import { MarkdownRenderer } from '../../components/MarkdownRenderer';
import { ZoomableImage } from '../../components/ImageModal';
import { OrderTimeline } from '../../components/OrderTimeline';
import type { OrderTimelineItem } from '../../types';
import { parseServerDate, formatVietnamTime } from '../../utils/date';
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
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Sparkles,
  ShieldCheck,
  Check
} from 'lucide-react';

export function TechnicianOrderDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [timeline, setTimeline] = useState<OrderTimelineItem[]>([]);
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

  // 2nd Confirmation Modal for Completion & Settlement
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completePaymentStatus, setCompletePaymentStatus] = useState<'PAID' | 'UNPAID'>('PAID');
  const [completeUnpaidReason, setCompleteUnpaidReason] = useState('');
  const [completeNote, setCompleteNote] = useState('');

  const loadOrder = async () => {
    if (!id) return;
    try {
      const response = await technicianApi.orderDetail(Number(id));
      setOrder(response.data.data);

      try {
        const tlRes = await technicianApi.timeline(Number(id));
        setTimeline(tlRes.data.data || []);
      } catch {
        // fallback
      }
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
      const startTime = parseServerDate(order.started_at).getTime();
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

  const handleAction = async (action: 'confirm' | 'start' | 'fail') => {
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
      } else if (action === 'fail') {
        if (!window.confirm('Xác nhận báo đơn này thất bại / hủy?')) {
          setActionLoading(false);
          return;
        }
        await technicianApi.complete(Number(id), { completion_result: 'FAILED' });
        setSuccess('Đã chuyển đơn hàng sang trạng thái thất bại.');
      }
      loadOrder();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Thao tác thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm completion & financial settlement from modal
  const handleConfirmComplete = async () => {
    if (!id) return;
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await technicianApi.complete(Number(id), {
        completion_result: 'SUCCESS',
        payment_status: completePaymentStatus,
        unpaid_reason: completePaymentStatus === 'UNPAID' ? completeUnpaidReason : null,
        note: completeNote || null,
      });
      setSuccess('Đã hoàn thành đơn hàng và kết toán tài chính thành công!');
      setShowCompleteModal(false);
      loadOrder();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Lỗi hoàn thành đơn hàng');
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
      <div className="container py-10 sm:py-16 text-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container py-10 sm:py-16 text-center max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-text mb-4">Không tìm thấy đơn hàng</h1>
        <button
          onClick={() => navigate('/technician/orders')}
          className="btn btn-primary inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách đơn</span>
        </button>
      </div>
    );
  }

  return (
    <div className="container py-5 sm:py-8 md:py-12 max-w-5xl mx-auto">
      {/* Top navigation bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <button
          onClick={() => navigate('/technician/orders')}
          className="btn btn-ghost btn-sm inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách đơn</span>
        </button>

        <Link
          to={`/orders/${id}/chat`}
          className="btn btn-outline text-orange-600 border-orange-300 hover:bg-orange-50 flex items-center justify-center gap-1.5 text-sm"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Mở khung Chat với khách</span>
        </Link>
      </div>

      {error && (
        <div className="mb-4 sm:mb-6 p-4 rounded-lg bg-red-50 text-red-700 flex items-center gap-2 text-sm border border-red-200">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 sm:mb-6 p-4 rounded-lg bg-green-50 text-green-700 flex items-center gap-2 text-sm border border-green-200">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Main Order Header Card */}
      <div className="card p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 border border-border">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-text font-mono">{order.code}</h1>
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
            <p className="text-xs text-text-muted mt-1">
              Thời gian tiếp nhận: {formatVietnamTime(order.created_at, 'dd/MM/yyyy HH:mm:ss')}
            </p>
          </div>

          {/* Real-time Timer widget when IN_PROGRESS */}
          {order.status === 'IN_PROGRESS' && (
            <div
              className={`p-4 rounded-xl flex items-center gap-3 border shadow-sm ${
                elapsedSeconds >= 3600
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : elapsedSeconds >= 3000
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-orange-50 border-orange-200 text-orange-800'
              }`}
            >
              <Clock className="w-6 h-6 animate-pulse" />
              <div>
                <div className="text-xs uppercase font-bold tracking-wider opacity-80">Thời gian làm việc</div>
                <div className="text-2xl font-mono font-extrabold">{formatTimer(elapsedSeconds)}</div>
              </div>
            </div>
          )}
        </div>

        {/* Customer Information Card */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-800 font-bold text-lg flex items-center justify-center border border-slate-300 shadow-2xs">
                {order.customer_name ? order.customer_name.charAt(0).toUpperCase() : 'K'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-extrabold tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                    Khách hàng đặt lịch
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">{order.customer_name}</h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="line-clamp-1">{order.location}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {order.customer_phone && (
                <a
                  href={`tel:${order.customer_phone}`}
                  className="btn btn-outline btn-sm bg-white hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 text-xs shadow-2xs"
                >
                  <Phone className="w-3.5 h-3.5 text-orange-600" />
                  <span>{order.customer_phone}</span>
                </a>
              )}
              {order.customer_email && (
                <a
                  href={`mailto:${order.customer_email}`}
                  className="btn btn-outline btn-sm bg-white hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 text-xs shadow-2xs"
                >
                  <Mail className="w-3.5 h-3.5 text-orange-600" />
                  <span>{order.customer_email}</span>
                </a>
              )}
              <Link
                to={`/orders/${order.id}/chat`}
                className="btn btn-primary btn-sm flex items-center gap-1.5 text-xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Mở Chat</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Distinct Blocks: Service Package vs Customer Note */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          {/* Service Package */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Gói dịch vụ</span>
            <div className="flex items-baseline justify-between mb-2">
              <h3 className="text-lg font-bold text-slate-900">{order.package_name}</h3>
              <span className="text-sm font-extrabold text-orange-600">
                {Number(order.package_price || order.price).toLocaleString('vi-VN')} đ
              </span>
            </div>
            {order.package_description && (
              <p className="text-xs text-slate-600 mb-2 leading-relaxed">{order.package_description}</p>
            )}
            {order.package_features && (
              <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <span className="line-clamp-2">{order.package_features}</span>
              </div>
            )}
          </div>

          {/* Customer Note */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Ghi chú từ khách hàng</span>
            {order.note ? (
              <div className="text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed max-h-36 overflow-y-auto">
                <MarkdownRenderer content={order.note} />
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic py-2">Khách hàng không có ghi chú thêm.</p>
            )}
          </div>
        </div>

        {/* Schedule & Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6 pt-4 border-t border-border">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5" />
              <span>Thời gian hẹn</span>
            </div>
            <p className="text-slate-900 font-semibold">
              {new Date(order.scheduled_date).toLocaleDateString('vi-VN')}
            </p>
            <p className="text-xs text-orange-600 font-bold flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Khung giờ: {order.scheduled_start} - {order.scheduled_end}</span>
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5" />
              <span>Địa chỉ phục vụ</span>
            </div>
            <p className="text-slate-900 font-medium text-sm leading-snug">{order.location}</p>
          </div>
        </div>

        {/* Financial Details Box */}
        <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-border mb-4 sm:mb-6">
          <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Chi tiết tài chính đơn hàng</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-text-secondary text-xs">Giá gốc gói:</span>
              <div className="font-semibold text-text">{Number(order.price).toLocaleString('vi-VN')}đ</div>
            </div>
            <div>
              <span className="text-text-secondary text-xs">Phụ phí (Tech 100%):</span>
              <div className="font-semibold text-green-600">+{Number(order.extend_fee || 0).toLocaleString('vi-VN')}đ</div>
            </div>
            <div>
              <span className="text-text-secondary text-xs">Giảm giá / Voucher:</span>
              <div className="font-semibold text-orange-600">-{Number(order.discount || 0).toLocaleString('vi-VN')}đ</div>
            </div>
            <div>
              <span className="text-text-secondary text-xs">Khách cần thanh toán:</span>
              <div className="text-xl font-extrabold text-orange-600">
                {Number(order.final_amount).toLocaleString('vi-VN')}đ
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-600">Trạng thái tiền:</span>
              <span
                className={`font-bold px-2.5 py-0.5 rounded-full ${
                  order.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {order.payment_status === 'PAID' ? '✓ Đã thu tiền' : 'Chưa thu tiền'}
              </span>
              {order.unpaid_reason && <span className="text-rose-600">({order.unpaid_reason})</span>}
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
              <span>Áp dụng Voucher / Giảm giá</span>
            </button>

            {/* Extra service fee button */}
            <button
              onClick={() => setShowExtendModal(true)}
              className="btn btn-outline flex items-center gap-1.5 text-xs py-2"
              type="button"
            >
              <PlusCircle className="w-4 h-4 text-green-600" />
              <span>Thêm phụ phí / gia hạn (100% KTV)</span>
            </button>

            {/* Late penalty button */}
            {order.penalty_percent < 100 && (
              <button
                onClick={() => handleApplyPenalty(100)}
                className="btn btn-outline text-red-600 hover:bg-red-50 border-red-300 flex items-center gap-1.5 text-xs py-2 ml-auto"
                type="button"
              >
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>Vi phạm muộn &gt; 30p: Làm FREE cho khách (0đ)</span>
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
              <span>{actionLoading ? 'Đang xử lý...' : 'Bắt đầu làm việc (Bật Timer)'}</span>
            </button>
          )}

          {order.status === 'IN_PROGRESS' && (
            <>
              {/* Opens 2nd step confirmation modal */}
              <button
                onClick={() => {
                  setCompletePaymentStatus('PAID');
                  setCompleteUnpaidReason('');
                  setCompleteNote('');
                  setShowCompleteModal(true);
                }}
                disabled={actionLoading}
                className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Hoàn thành dịch vụ (Kết toán)</span>
              </button>

              <button
                onClick={() => handleAction('fail')}
                disabled={actionLoading}
                className="btn btn-outline text-rose-600 hover:bg-rose-50 border-rose-300"
              >
                Hủy / Báo Thất bại
              </button>
            </>
          )}
        </div>

        {/* Order Status Timeline Section */}
        <div className="border-t border-border pt-6 mt-6">
          <h3 className="font-bold text-text text-base mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-600" />
            <span>Tiến trình & Lịch sử trạng thái đơn hàng</span>
          </h3>
          <OrderTimeline
            timeline={timeline}
            createdAt={order.created_at}
            orderStatus={order.status}
            startedAt={order.started_at}
            completedAt={order.completed_at}
            completionResult={order.completion_result}
          />
        </div>
      </div>

      {/* Payment QR Section */}
      <div className="card p-4 sm:p-6 md:p-8 border border-border">
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

      {/* 2nd Confirmation Modal: Hoàn thành & Kết toán */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card max-w-lg w-full p-6 animate-in fade-in zoom-in-95 shadow-xl">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              <div>
                <h3 className="text-lg font-bold text-text">Xác nhận hoàn thành & kết toán đơn hàng</h3>
                <p className="text-xs text-slate-500">Bước kiểm tra và xác nhận lần 2 trước khi kết thúc đơn</p>
              </div>
            </div>

            {/* Summary */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 mb-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Mã đơn hàng:</span>
                <span className="font-mono font-bold text-slate-800">{order.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Khách hàng:</span>
                <span className="font-semibold text-slate-800">{order.customer_name} ({order.customer_phone || 'Không có SĐT'})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gói dịch vụ:</span>
                <span className="font-semibold text-slate-800">{order.package_name}</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-700">Tổng tiền khách thanh toán:</span>
                <span className="font-black text-base text-orange-600">
                  {Number(order.final_amount).toLocaleString('vi-VN')} VNĐ
                </span>
              </div>
            </div>

            {/* Ledger Breakdown Notice */}
            <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200 text-emerald-900 text-xs mb-4 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                <Check className="w-3.5 h-3.5" />
                <span>Phân bổ tài chính tự động vào sổ cái:</span>
              </div>
              <div className="flex justify-between text-slate-700 pl-5">
                <span>• Thu nhập KTV (70% gói + 100% phụ phí):</span>
                <strong>
                  {(
                    Math.round(
                      (Number(order.final_amount) - Number(order.extend_fee || 0)) * 0.7 +
                        Number(order.extend_fee || 0)
                    )
                  ).toLocaleString('vi-VN')} đ
                </strong>
              </div>
              <div className="flex justify-between text-slate-700 pl-5">
                <span>• Quỹ IT Supporter (30% gói dịch vụ):</span>
                <strong>
                  {(
                    Math.round(
                      (Number(order.final_amount) - Number(order.extend_fee || 0)) * 0.3
                    )
                  ).toLocaleString('vi-VN')} đ
                </strong>
              </div>
            </div>

            {/* Payment Status Option */}
            <div className="space-y-3 mb-4">
              <label className="text-xs font-bold text-slate-700 block">
                Trạng thái thu tiền từ khách:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                    completePaymentStatus === 'PAID'
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-semibold'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="completePaymentStatus"
                    value="PAID"
                    checked={completePaymentStatus === 'PAID'}
                    onChange={() => setCompletePaymentStatus('PAID')}
                    className="accent-emerald-600"
                  />
                  <div className="text-xs">
                    <div>✓ Đã thu đủ tiền (PAID)</div>
                    <div className="text-[10px] text-slate-500 font-normal">Đã nhận chuyển khoản hoặc tiền mặt</div>
                  </div>
                </label>

                <label
                  className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                    completePaymentStatus === 'UNPAID'
                      ? 'bg-amber-50 border-amber-400 text-amber-900 font-semibold'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="completePaymentStatus"
                    value="UNPAID"
                    checked={completePaymentStatus === 'UNPAID'}
                    onChange={() => setCompletePaymentStatus('UNPAID')}
                    className="accent-amber-600"
                  />
                  <div className="text-xs">
                    <div>Chưa thu tiền (UNPAID)</div>
                    <div className="text-[10px] text-slate-500 font-normal">Khách nợ hoặc thanh toán sau</div>
                  </div>
                </label>
              </div>

              {completePaymentStatus === 'UNPAID' && (
                <div>
                  <label className="text-xs font-semibold text-rose-700 block mb-1">
                    Lý do chưa thu tiền (bắt buộc):
                  </label>
                  <textarea
                    rows={2}
                    value={completeUnpaidReason}
                    onChange={(e) => setCompleteUnpaidReason(e.target.value)}
                    placeholder="VD: Khách hàng hẹn thanh toán qua tài khoản vào buổi tối..."
                    className="input text-xs w-full resize-none"
                    required
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Ghi chú kết toán (tuỳ chọn):
                </label>
                <textarea
                  rows={2}
                  value={completeNote}
                  onChange={(e) => setCompleteNote(e.target.value)}
                  placeholder="Ghi chú thêm về thiết bị, quá trình bảo dưỡng hoặc trao đổi với khách..."
                  className="input text-xs w-full resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setShowCompleteModal(false)}
                disabled={actionLoading}
                className="btn btn-ghost text-xs"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmComplete}
                disabled={
                  actionLoading ||
                  (completePaymentStatus === 'UNPAID' && !completeUnpaidReason.trim())
                }
                className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 text-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{actionLoading ? 'Đang xử lý kết toán...' : 'Xác nhận hoàn tất & kết toán'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Áp dụng Voucher & Sale Event */}
      {showVoucherModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-orange-600" />
              <span>Ưu đãi & Voucher cho đơn này</span>
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
                      {p.name} ({p.discount_type === 'percent' ? `-${p.discount_value}%` : `-${Number(p.discount_value).toLocaleString('vi-VN')}đ`})
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
              <span>Thêm phụ phí dịch vụ / Gia hạn thời gian</span>
            </h3>
            <p className="text-xs text-text-secondary mb-4">
              Theo quy định thỏa thuận, Kỹ thuật viên hưởng 100% phần phụ phí làm thêm này.
            </p>

            <div className="space-y-4">
              <div>
                <label className="label text-xs">Số tiền phụ phí (VNĐ)</label>
                <input
                  type="number"
                  step={10000}
                  min={10000}
                  value={extendFeeInput}
                  onChange={(e) => setExtendFeeInput(e.target.value)}
                  className="input font-semibold text-sm"
                />
              </div>

              <div>
                <label className="label text-xs">Lý do phụ phí / thỏa thuận</label>
                <textarea
                  rows={2}
                  value={extendReasonInput}
                  onChange={(e) => setExtendReasonInput(e.target.value)}
                  className="input text-sm resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowExtendModal(false)}
                  className="btn btn-ghost text-xs"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleAddExtendFee}
                  disabled={actionLoading}
                  className="btn btn-primary bg-green-600 hover:bg-green-700 text-xs"
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
                <label className="label text-xs">Trạng thái thu tiền</label>
                <select
                  value={paymentStatusChoice}
                  onChange={(e) => setPaymentStatusChoice(e.target.value as 'PAID' | 'UNPAID')}
                  className="input text-sm"
                >
                  <option value="PAID">Đã thu tiền thành công (Khách đã quét QR hoặc trả tiền mặt)</option>
                  <option value="UNPAID">Chưa thu được tiền</option>
                </select>
              </div>

              {paymentStatusChoice === 'UNPAID' && (
                <div>
                  <label className="label text-xs">Lý do chưa thu (bắt buộc)</label>
                  <textarea
                    rows={2}
                    value={unpaidReason}
                    onChange={(e) => setUnpaidReason(e.target.value)}
                    placeholder="VD: Khách xin chuyển khoản sau trong ngày..."
                    className="input text-sm resize-none"
                    required
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="btn btn-ghost text-xs"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSavePayment}
                  disabled={actionLoading || (paymentStatusChoice === 'UNPAID' && !unpaidReason.trim())}
                  className="btn btn-primary text-xs"
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