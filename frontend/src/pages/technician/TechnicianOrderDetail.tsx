import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t, i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');
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
  const [extendReasonInput, setExtendReasonInput] = useState(() => t('technician.detail.defaultExtendReason'));

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatusChoice, setPaymentStatusChoice] = useState<'PAID' | 'UNPAID'>('PAID');
  const [unpaidReason, setUnpaidReason] = useState('');

  // System penalty settings from manager
  const [systemSettings, setSystemSettings] = useState<{
    latePenaltyMinutes: number;
    latePenaltyPercent: number;
    freeServiceAfterMinutes: number;
  }>({
    latePenaltyMinutes: 10,
    latePenaltyPercent: 15,
    freeServiceAfterMinutes: 45,
  });

  // Modal: Late penalty
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [lateMinutesInput, setLateMinutesInput] = useState<number>(0);
  const [penaltyPercentInput, setPenaltyPercentInput] = useState<number>(0);
  const [penaltyReasonInput, setPenaltyReasonInput] = useState('');

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
        setError(t('technician.detail.orderNotFoundOrForbidden'));
      } else {
        setError(err.response?.data?.error?.message || t('technician.detail.orderLoadError'));
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

  const loadSystemSettings = async () => {
    try {
      const res = await publicApi.info();
      const data = res.data?.data;
      if (data) {
        setSystemSettings({
          latePenaltyMinutes: Number(data.latePenaltyMinutes ?? data.late_penalty_minutes ?? 10),
          latePenaltyPercent: Number(data.latePenaltyPercent ?? data.late_penalty_percent ?? 15),
          freeServiceAfterMinutes: Number(data.freeServiceAfterMinutes ?? data.free_service_after_minutes ?? 45),
        });
      }
    } catch (err) {
      console.error('Failed to load system settings:', err);
    }
  };

  useEffect(() => {
    loadOrder();
    loadBankQr();
    loadSalePrograms();
    loadSystemSettings();
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
        setSuccess(t('technician.detail.confirmSuccess'));
      } else if (action === 'start') {
        await technicianApi.start(Number(id));
        setSuccess(t('technician.detail.startSuccess'));
      } else if (action === 'fail') {
        if (!window.confirm(t('technician.detail.confirmFailPrompt'))) {
          setActionLoading(false);
          return;
        }
        await technicianApi.complete(Number(id), { completion_result: 'FAILED' });
        setSuccess(t('technician.detail.failSuccess'));
      }
      loadOrder();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || t('technician.detail.actionFailed'));
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
      setSuccess(t('technician.detail.completeSuccess'));
      setShowCompleteModal(false);
      loadOrder();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || t('technician.detail.completeError'));
    } finally {
      setActionLoading(false);
    }
  };

  // Calculate minutes late relative to scheduled time
  const getMinutesLate = () => {
    if (!order?.scheduled_date || !order?.scheduled_start) return 0;
    const [year, month, day] = order.scheduled_date.split('-').map(Number);
    const [hour, min] = order.scheduled_start.split(':').map(Number);
    if (!year || !month || !day || isNaN(hour) || isNaN(min)) return 0;

    const referenceTime = order.started_at ? parseServerDate(order.started_at).getTime() : Date.now();
    const scheduledTime = new Date(year, month - 1, day, hour, min, 0, 0).getTime();
    const diffMinutes = Math.floor((referenceTime - scheduledTime) / (60 * 1000));
    return Math.max(0, diffMinutes);
  };

  // Automatically compute penalty percent based on late minutes and manager's system settings
  const computePenaltyPercentFromMinutes = (minutes: number) => {
    if (minutes >= systemSettings.freeServiceAfterMinutes) {
      return 100;
    }
    if (minutes >= systemSettings.latePenaltyMinutes) {
      return systemSettings.latePenaltyPercent;
    }
    return 0;
  };

  // Open Late Penalty Modal
  const openPenaltyModal = () => {
    const detectedMinutes = getMinutesLate();
    const initialMinutes = (order?.penalty_percent > 0 && detectedMinutes === 0)
      ? (order.penalty_percent >= 100 ? systemSettings.freeServiceAfterMinutes : systemSettings.latePenaltyMinutes)
      : detectedMinutes;
    setLateMinutesInput(initialMinutes);
    const initialPct = computePenaltyPercentFromMinutes(initialMinutes);
    setPenaltyPercentInput(initialPct);
    setPenaltyReasonInput(
      initialPct >= 100
        ? t('technician.detail.penaltyReasonTemplateFree', { minutes: initialMinutes, threshold: systemSettings.freeServiceAfterMinutes })
        : initialPct > 0
        ? t('technician.detail.penaltyReasonTemplatePercent', { minutes: initialMinutes, percent: initialPct })
        : t('technician.detail.penaltyReasonTemplateOnTime', { minutes: initialMinutes, threshold: systemSettings.latePenaltyMinutes })
    );
    setShowPenaltyModal(true);
  };

  // When technician edits or clicks minute presets
  const handleLateMinutesChange = (minutes: number) => {
    const validMinutes = Math.max(0, isNaN(minutes) ? 0 : minutes);
    setLateMinutesInput(validMinutes);
    const pct = computePenaltyPercentFromMinutes(validMinutes);
    setPenaltyPercentInput(pct);
    setPenaltyReasonInput(
      pct >= 100
        ? t('technician.detail.penaltyReasonTemplateFree', { minutes: validMinutes, threshold: systemSettings.freeServiceAfterMinutes })
        : pct > 0
        ? t('technician.detail.penaltyReasonTemplatePercent', { minutes: validMinutes, percent: pct })
        : t('technician.detail.penaltyReasonTemplateOnTime', { minutes: validMinutes, threshold: systemSettings.latePenaltyMinutes })
    );
  };

  // Confirm applying penalty
  const handleConfirmPenalty = async () => {
    if (!id) return;
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await technicianApi.penalty(Number(id), {
        penalty_percent: penaltyPercentInput,
        late_minutes: lateMinutesInput,
        reason: penaltyReasonInput,
      });
      setSuccess(
        penaltyPercentInput > 0
          ? t('technician.detail.penaltySuccess', { percent: penaltyPercentInput, minutes: lateMinutesInput })
          : t('technician.detail.penaltyResetSuccess')
      );
      setShowPenaltyModal(false);
      loadOrder();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || t('technician.detail.penaltyError'));
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
      setSuccess(t('technician.detail.voucherSuccess'));
      setVoucherCodeInput('');
      setShowVoucherModal(false);
      loadOrder();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || t('technician.detail.voucherInvalid'));
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
      setSuccess(t('technician.detail.saleSuccess'));
      setShowVoucherModal(false);
      loadOrder();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || t('technician.detail.saleError'));
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
      setSuccess(t('technician.detail.extendSuccess'));
      setShowExtendModal(false);
      loadOrder();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || t('technician.detail.extendError'));
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
      setSuccess(
        t('technician.detail.paymentUpdateSuccess', {
          status: paymentStatusChoice === 'PAID' ? t('technician.detail.paidStatusName') : t('technician.detail.unpaidStatusName'),
        })
      );
      setShowPaymentModal(false);
      loadOrder();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || t('technician.detail.paymentUpdateError'));
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
        <h1 className="text-2xl font-bold text-text mb-4">{t('technician.detail.orderNotFound')}</h1>
        <button
          onClick={() => navigate('/technician/orders')}
          className="btn btn-primary inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('technician.detail.backToOrdersList')}</span>
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
          <span>{t('technician.detail.backToOrdersList')}</span>
        </button>

        <Link
          to={`/orders/${id}/chat`}
          className="btn btn-outline text-orange-600 border-orange-300 hover:bg-orange-50 flex items-center justify-center gap-1.5 text-sm"
        >
          <MessageSquare className="w-4 h-4" />
          <span>{t('technician.detail.openChatWithCustomer')}</span>
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
                {t('status.' + (order.status || '').toLowerCase(), { defaultValue: order.status })}
              </span>

              {order.penalty_percent > 0 && (
                <span className="badge bg-red-100 text-red-700 border border-red-300 font-bold">
                  {order.penalty_percent === 100
                    ? t('technician.detail.penaltyFree100')
                    : t('technician.detail.penaltyMinus', { percent: order.penalty_percent })}
                </span>
              )}
            </div>
            <p className="text-xs text-text-muted mt-1">
              {t('technician.detail.intakeTime')} {formatVietnamTime(order.created_at, 'dd/MM/yyyy HH:mm:ss')}
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
                <div className="text-xs uppercase font-bold tracking-wider opacity-80">{t('technician.detail.workingTime')}</div>
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
                    {t('technician.detail.bookingCustomer')}
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
                <span>{t('technician.detail.openChatShort')}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Distinct Blocks: Service Package vs Customer Note */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          {/* Service Package */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">{t('technician.detail.servicePackage')}</span>
            <div className="flex items-baseline justify-between mb-2">
              <h3 className="text-lg font-bold text-slate-900">{order.package_name}</h3>
              <span className="text-sm font-extrabold text-orange-600">
                {Number(order.package_price || order.price).toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? 'VND' : 'đ'}
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
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">{t('technician.detail.customerNote')}</span>
            {order.note ? (
              <div className="text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed max-h-36 overflow-y-auto">
                <MarkdownRenderer content={order.note} />
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic py-2">{t('technician.detail.noCustomerNote')}</p>
            )}
          </div>
        </div>

        {/* Schedule & Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6 pt-4 border-t border-border">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5" />
              <span>{t('technician.detail.appointmentTime')}</span>
            </div>
            <p className="text-slate-900 font-semibold">
              {new Date(order.scheduled_date).toLocaleDateString(isEn ? 'en-US' : 'vi-VN')}
            </p>
            <p className="text-xs text-orange-600 font-bold flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{t('technician.detail.scheduledSlot', { start: order.scheduled_start, end: order.scheduled_end })}</span>
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5" />
              <span>{t('technician.detail.serviceLocation')}</span>
            </div>
            <p className="text-slate-900 font-medium text-sm leading-snug">{order.location}</p>
          </div>
        </div>

        {/* Financial Details Box */}
        <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-border mb-4 sm:mb-6">
          <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">{t('technician.detail.financialDetailsTitle')}</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 text-sm">
            <div>
              <span className="text-text-secondary text-xs">{t('technician.detail.packageBasePrice')}</span>
              <div className="font-semibold text-text">{Number(order.price).toLocaleString(isEn ? 'en-US' : 'vi-VN')}{isEn ? ' VND' : 'đ'}</div>
            </div>
            <div>
              <span className="text-text-secondary text-xs">{t('technician.detail.techSurcharge')}</span>
              <div className="font-semibold text-green-600">+{Number(order.extend_fee || 0).toLocaleString(isEn ? 'en-US' : 'vi-VN')}{isEn ? ' VND' : 'đ'}</div>
            </div>
            <div>
              <span className="text-text-secondary text-xs">{t('technician.detail.discountVoucher')}</span>
              <div className="font-semibold text-orange-600">-{Number(order.discount || 0).toLocaleString(isEn ? 'en-US' : 'vi-VN')}{isEn ? ' VND' : 'đ'}</div>
            </div>
            {order.penalty > 0 && (
              <div>
                <span className="text-rose-600 text-xs font-semibold">{t('technician.detail.latePenaltyTitle', { percent: order.penalty_percent })}</span>
                <div className="font-semibold text-rose-600">-{Number(order.penalty).toLocaleString(isEn ? 'en-US' : 'vi-VN')}{isEn ? ' VND' : 'đ'}</div>
              </div>
            )}
            <div>
              <span className="text-text-secondary text-xs">{t('technician.detail.customerMustPay')}</span>
              <div className="text-xl font-extrabold text-orange-600">
                {Number(order.final_amount).toLocaleString(isEn ? 'en-US' : 'vi-VN')}{isEn ? ' VND' : 'đ'}
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-600">{t('technician.detail.paymentStatusTitle')}</span>
              <span
                className={`font-bold px-2.5 py-0.5 rounded-full ${
                  order.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {order.payment_status === 'PAID' ? t('technician.detail.paidBadge') : t('technician.detail.unpaidBadge')}
              </span>
              {order.unpaid_reason && <span className="text-rose-600">({order.unpaid_reason})</span>}
            </div>

            {order.status === 'IN_PROGRESS' && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="text-orange-600 hover:text-orange-700 font-semibold underline"
              >
                {t('technician.detail.updatePaymentBtn')}
              </button>
            )}
          </div>
        </div>

        {/* In-Session Technician Feature Toolbar */}
        {(order.status === 'IN_PROGRESS' || order.status === 'CONFIRMED') && (
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-border">
            {order.status === 'IN_PROGRESS' && (
              <>
                {/* Sale Program & Voucher button */}
                <button
                  onClick={() => setShowVoucherModal(true)}
                  className="btn btn-outline flex items-center gap-1.5 text-xs py-2"
                  type="button"
                >
                  <Ticket className="w-4 h-4 text-orange-600" />
                  <span>{t('technician.detail.applyVoucherBtn')}</span>
                </button>

                {/* Extra service fee button */}
                <button
                  onClick={() => setShowExtendModal(true)}
                  className="btn btn-outline flex items-center gap-1.5 text-xs py-2"
                  type="button"
                >
                  <PlusCircle className="w-4 h-4 text-green-600" />
                  <span>{t('technician.detail.addExtendFeeBtn')}</span>
                </button>
              </>
            )}

            {/* Late penalty button */}
            <button
              onClick={openPenaltyModal}
              className={`btn btn-outline flex items-center gap-1.5 text-xs py-2 ml-auto ${
                order.penalty_percent > 0
                  ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                  : 'text-amber-700 hover:bg-amber-50 border-amber-300'
              }`}
              type="button"
            >
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>
                {order.penalty_percent > 0
                  ? t('technician.detail.latePenaltyResolved', {
                      percent: order.penalty_percent,
                      amount: Number(order.penalty).toLocaleString(isEn ? 'en-US' : 'vi-VN'),
                    })
                  : t('technician.detail.handleLatePenaltyBtn')}
              </span>
            </button>
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
              {actionLoading ? t('technician.detail.processing') : t('technician.detail.confirmOrderBtn')}
            </button>
          )}

          {order.status === 'CONFIRMED' && (
            <button
              onClick={() => handleAction('start')}
              disabled={actionLoading}
              className="btn btn-primary bg-orange-600 hover:bg-orange-700 flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              <span>{actionLoading ? t('technician.detail.processing') : t('technician.detail.startWorkBtn')}</span>
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
                <span>{t('technician.detail.completeServiceBtn')}</span>
              </button>

              <button
                onClick={() => handleAction('fail')}
                disabled={actionLoading}
                className="btn btn-outline text-rose-600 hover:bg-rose-50 border-rose-300"
              >
                {t('technician.detail.reportFailedBtn')}
              </button>
            </>
          )}
        </div>

        {/* Order Status Timeline Section */}
        <div className="border-t border-border pt-6 mt-6">
          <h3 className="font-bold text-text text-base mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-600" />
            <span>{t('technician.detail.timelineTitle')}</span>
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
            <h3 className="font-bold text-text text-lg">{t('technician.detail.transferQrTitle')}</h3>
          </div>
          <span className="text-xs text-text-muted">{t('technician.detail.officialAdminQr')}</span>
        </div>

        <div className="text-center py-4 bg-slate-50 rounded-xl border border-dashed border-gray-300">
          {bankQrUrl ? (
            <div className="inline-block p-4 bg-white rounded-xl shadow-sm border border-border">
              <ZoomableImage
                src={bankQrUrl}
                alt="QR"
                className="w-56 h-56 mx-auto object-contain rounded-lg transition-transform"
                title={t('technician.detail.transferQrTitle')}
                caption={`${t('technician.detail.scanToTransfer')} • ${t('technician.detail.transferAmount', { amount: Number(order.final_amount).toLocaleString(isEn ? 'en-US' : 'vi-VN') })}`}
              />
              <p className="text-xs font-semibold text-gray-700 mt-2">
                {t('technician.detail.scanToTransfer')}
              </p>
              <p className="text-sm font-bold text-orange-600 mt-1">
                {t('technician.detail.transferAmount', { amount: Number(order.final_amount).toLocaleString(isEn ? 'en-US' : 'vi-VN') })}
              </p>
              <p className="text-[11px] text-text-muted mt-1">
                {t('technician.detail.clickToZoom')}
              </p>
            </div>
          ) : (
            <div className="py-8 text-text-secondary">
              <QrCode className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium">{t('technician.detail.noAdminQr')}</p>
              <p className="text-xs text-text-muted mt-1">{t('technician.detail.cashPaymentHint')}</p>
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
                <h3 className="text-lg font-bold text-text">{t('technician.detail.confirmModalTitle')}</h3>
                <p className="text-xs text-slate-500">{t('technician.detail.confirmModalSubtitle')}</p>
              </div>
            </div>

            {/* Summary */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 mb-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">{t('technician.detail.orderCode')}</span>
                <span className="font-mono font-bold text-slate-800">{order.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('technician.detail.customer')}</span>
                <span className="font-semibold text-slate-800">{order.customer_name} ({order.customer_phone || t('technician.detail.noPhone')})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('technician.detail.servicePackage')}</span>
                <span className="font-semibold text-slate-800">{order.package_name}</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-700">{t('technician.detail.totalPaymentAmount')}</span>
                <span className="font-black text-base text-orange-600">
                  {Number(order.final_amount).toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? 'VND' : 'VNĐ'}
                </span>
              </div>
            </div>

            {/* Ledger Breakdown Notice */}
            <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200 text-emerald-900 text-xs mb-4 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                <Check className="w-3.5 h-3.5" />
                <span>{t('technician.detail.ledgerAllocationTitle')}</span>
              </div>
              <div className="flex justify-between text-slate-700 pl-5">
                <span>{t('technician.detail.techEarningsFormula')}</span>
                <strong>
                  {(
                    Math.round(
                      (Number(order.final_amount) - Number(order.extend_fee || 0)) * 0.7 +
                        Number(order.extend_fee || 0)
                    )
                  ).toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? 'VND' : 'đ'}
                </strong>
              </div>
              <div className="flex justify-between text-slate-700 pl-5">
                <span>{t('technician.detail.clubFundFormula')}</span>
                <strong>
                  {(
                    Math.round(
                      (Number(order.final_amount) - Number(order.extend_fee || 0)) * 0.3
                    )
                  ).toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? 'VND' : 'đ'}
                </strong>
              </div>
            </div>

            {/* Payment Status Option */}
            <div className="space-y-3 mb-4">
              <label className="text-xs font-bold text-slate-700 block">
                {t('technician.detail.paymentStatusLabel')}
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
                    <div>{t('technician.detail.paidFullOption')}</div>
                    <div className="text-[10px] text-slate-500 font-normal">{t('technician.detail.paidFullDesc')}</div>
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
                    <div>{t('technician.detail.unpaidOption')}</div>
                    <div className="text-[10px] text-slate-500 font-normal">{t('technician.detail.unpaidDesc')}</div>
                  </div>
                </label>
              </div>

              {completePaymentStatus === 'UNPAID' && (
                <div>
                  <label className="text-xs font-semibold text-rose-700 block mb-1">
                    {t('technician.detail.unpaidReasonLabel')}
                  </label>
                  <textarea
                    rows={2}
                    value={completeUnpaidReason}
                    onChange={(e) => setCompleteUnpaidReason(e.target.value)}
                    placeholder={t('technician.detail.unpaidReasonPlaceholder')}
                    className="input text-xs w-full resize-none"
                    required
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {t('technician.detail.settlementNoteLabel')}
                </label>
                <textarea
                  rows={2}
                  value={completeNote}
                  onChange={(e) => setCompleteNote(e.target.value)}
                  placeholder={t('technician.detail.settlementNotePlaceholder')}
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
                {t('technician.detail.cancelBtn')}
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
                <span>{actionLoading ? t('technician.detail.processingSettlement') : t('technician.detail.confirmCompleteBtn')}</span>
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
              <span>{t('technician.detail.voucherModalTitle')}</span>
            </h3>

            {/* Mục 1: Khách đọc mã Voucher dùng 1 lần */}
            <div className="mb-6 pb-6 border-b border-border">
              <h4 className="text-sm font-semibold text-text mb-2">{t('technician.detail.voucherSection1Title')}</h4>
              <p className="text-xs text-text-secondary mb-3">
                {t('technician.detail.voucherSection1Desc')}
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={t('technician.detail.voucherPlaceholder')}
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
                  {t('technician.detail.applyBtn')}
                </button>
              </div>
            </div>

            {/* Mục 2: KTV chọn chương trình Sale chung */}
            <div>
              <h4 className="text-sm font-semibold text-text mb-2">{t('technician.detail.voucherSection2Title')}</h4>
              <p className="text-xs text-text-secondary mb-3">
                {t('technician.detail.voucherSection2Desc')}
              </p>
              <div className="space-y-3">
                <select
                  value={selectedSaleProgramId || ''}
                  onChange={(e) => setSelectedSaleProgramId(Number(e.target.value))}
                  className="input text-sm"
                >
                  <option value="">{t('technician.detail.selectSaleProgramPrompt')}</option>
                  {salePrograms.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.discount_type === 'percent' ? `-${p.discount_value}%` : `-${Number(p.discount_value).toLocaleString(isEn ? 'en-US' : 'vi-VN')}${isEn ? ' VND' : 'đ'}`})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleApplySaleProgram}
                  disabled={!selectedSaleProgramId || actionLoading}
                  className="btn btn-primary w-full text-xs"
                >
                  {t('technician.detail.applySaleProgramBtn')}
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-4 mt-6 border-t border-border">
              <button
                type="button"
                onClick={() => setShowVoucherModal(false)}
                className="btn btn-ghost text-sm"
              >
                {t('technician.detail.closeBtn')}
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
              <span>{t('technician.detail.extendModalTitle')}</span>
            </h3>
            <p className="text-xs text-text-secondary mb-4">
              {t('technician.detail.extendModalDesc')}
            </p>

            <div className="space-y-4">
              <div>
                <label className="label text-xs">{t('technician.detail.extendFeeInputLabel')}</label>
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
                <label className="label text-xs">{t('technician.detail.extendReasonInputLabel')}</label>
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
                  {t('technician.detail.cancelBtn')}
                </button>
                <button
                  type="button"
                  onClick={handleAddExtendFee}
                  disabled={actionLoading}
                  className="btn btn-primary bg-green-600 hover:bg-green-700 text-xs"
                >
                  {t('technician.detail.confirmAddFeeBtn')}
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
            <h3 className="text-lg font-bold text-text mb-4">{t('technician.detail.paymentModalTitle')}</h3>

            <div className="space-y-4">
              <div>
                <label className="label text-xs">{t('technician.detail.paymentCollectStatusLabel')}</label>
                <select
                  value={paymentStatusChoice}
                  onChange={(e) => setPaymentStatusChoice(e.target.value as 'PAID' | 'UNPAID')}
                  className="input text-sm"
                >
                  <option value="PAID">{t('technician.detail.paymentPaidChoice')}</option>
                  <option value="UNPAID">{t('technician.detail.paymentUnpaidChoice')}</option>
                </select>
              </div>

              {paymentStatusChoice === 'UNPAID' && (
                <div>
                  <label className="label text-xs">{t('technician.detail.unpaidReasonMandatory')}</label>
                  <textarea
                    rows={2}
                    value={unpaidReason}
                    onChange={(e) => setUnpaidReason(e.target.value)}
                    placeholder={t('technician.detail.unpaidReasonSample')}
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
                  {t('technician.detail.cancelBtn')}
                </button>
                <button
                  type="button"
                  onClick={handleSavePayment}
                  disabled={actionLoading || (paymentStatusChoice === 'UNPAID' && !unpaidReason.trim())}
                  className="btn btn-primary text-xs"
                >
                  {t('technician.detail.saveConfirmBtn')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Xử lý vi phạm giờ hẹn & Phạt muộn */}
      {showPenaltyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="card max-w-lg w-full p-4 sm:p-6 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{t('technician.detail.penaltyModalTitle')}</h3>
                  <p className="text-xs text-slate-500">{t('technician.detail.penaltyModalSubtitle')}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPenaltyModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-base font-bold"
              >
                ✕
              </button>
            </div>

            {/* Quy định gốc từ Quản lý */}
            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 sm:p-3.5 mb-4 text-xs text-amber-950 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{t('technician.detail.managerSettingsTitle')}</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-700 pl-0.5">
                <li>
                  {t('technician.detail.ruleUnder', { minutes: systemSettings.latePenaltyMinutes })}
                </li>
                <li>
                  {t('technician.detail.ruleBetween', { start: systemSettings.latePenaltyMinutes, end: systemSettings.freeServiceAfterMinutes, percent: systemSettings.latePenaltyPercent })}
                </li>
                <li>
                  {t('technician.detail.ruleOver', { minutes: systemSettings.freeServiceAfterMinutes })}
                </li>
              </ul>
            </div>

            {/* Thông tin lịch hẹn đơn hàng */}
            <div className="bg-slate-50 p-3 rounded-xl border border-border mb-4 text-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">{t('technician.detail.clientAppointment')}</span>
                <span className="font-semibold text-slate-800">
                  {order.scheduled_start} - {order.scheduled_end} ({new Date(order.scheduled_date).toLocaleDateString(isEn ? 'en-US' : 'vi-VN')})
                </span>
              </div>
              {order.started_at && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">{t('technician.detail.actualStart')}</span>
                  <span className="font-medium text-slate-800">{formatVietnamTime(order.started_at)}</span>
                </div>
              )}
              {getMinutesLate() > 0 && (
                <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                  <span className="text-rose-600 font-medium">{t('technician.detail.systemMeasuredDelay')}</span>
                  <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    ~{getMinutesLate()} {t('technician.detail.minuteUnit')}
                  </span>
                </div>
              )}
            </div>

            {/* Input số phút muộn */}
            <div className="space-y-4">
              <div>
                <label className="label text-xs font-bold text-slate-800 flex justify-between items-center">
                  <span>{t('technician.detail.actualLateMinutesLabel')}</span>
                  <span className="text-xs text-orange-600 font-semibold">{t('technician.detail.autoCalcNote')}</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={360}
                    value={lateMinutesInput}
                    onChange={(e) => handleLateMinutesChange(Math.max(0, parseInt(e.target.value) || 0))}
                    className="input font-bold text-base pr-14"
                    placeholder="VD: 15"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    {t('technician.detail.minuteUnit')}
                  </span>
                </div>

                {/* Quick preset buttons */}
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  <button
                    type="button"
                    onClick={() => handleLateMinutesChange(0)}
                    className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-colors ${
                      lateMinutesInput === 0
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {t('technician.detail.presetOnTime')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLateMinutesChange(systemSettings.latePenaltyMinutes)}
                    className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-colors ${
                      lateMinutesInput === systemSettings.latePenaltyMinutes
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    {t('technician.detail.presetLate', { minutes: systemSettings.latePenaltyMinutes, percent: systemSettings.latePenaltyPercent })}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLateMinutesChange(20)}
                    className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-colors ${
                      lateMinutesInput === 20
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    {t('technician.detail.presetLate', { minutes: 20, percent: systemSettings.latePenaltyPercent })}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLateMinutesChange(systemSettings.freeServiceAfterMinutes)}
                    className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-colors ${
                      lateMinutesInput >= systemSettings.freeServiceAfterMinutes
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    {t('technician.detail.presetFree', { minutes: systemSettings.freeServiceAfterMinutes })}
                  </button>
                </div>
              </div>

              {/* Tạm tính kết quả theo % phạt */}
              {(() => {
                const previewPenalty = penaltyPercentInput >= 100
                  ? Number(order.price)
                  : Math.round((Number(order.price) * penaltyPercentInput) / 100);
                const previewFinal = Math.max(
                  0,
                  Number(order.price) + Number(order.extend_fee || 0) - Number(order.discount || 0) - previewPenalty
                );

                return (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                      <span className="font-semibold text-slate-700">{t('technician.detail.systemCalculatedPenalty')}</span>
                      <span
                        className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                          penaltyPercentInput >= 100
                            ? 'bg-red-100 text-red-700'
                            : penaltyPercentInput > 0
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {penaltyPercentInput >= 100
                          ? t('technician.detail.freeZeroVnd')
                          : penaltyPercentInput > 0
                          ? t('technician.detail.deductPkgPercent', { percent: penaltyPercentInput })
                          : t('technician.detail.noPenalty')}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-600">
                      <span>{t('technician.detail.packageBasePrice')}</span>
                      <span className="font-medium text-slate-800">{Number(order.price).toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? 'VND' : 'đ'}</span>
                    </div>
                    {Number(order.extend_fee || 0) > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>{t('technician.detail.techSurcharge')}</span>
                        <span className="font-semibold">+{Number(order.extend_fee).toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? 'VND' : 'đ'}</span>
                      </div>
                    )}
                    {Number(order.discount || 0) > 0 && (
                      <div className="flex justify-between text-orange-600">
                        <span>{t('technician.detail.discountVoucher')}</span>
                        <span className="font-semibold">-{Number(order.discount).toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? 'VND' : 'đ'}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-rose-600 font-semibold">
                      <span>{t('technician.detail.latePenaltyDeducted', { percent: penaltyPercentInput })}</span>
                      <span>-{previewPenalty.toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? 'VND' : 'đ'}</span>
                    </div>
                    <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                      <span>{t('technician.detail.customerMustPay')}</span>
                      <span className="text-orange-600">{previewFinal.toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? 'VND' : 'đ'}</span>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="label text-xs">{t('technician.detail.penaltyReasonNote')}</label>
                <input
                  type="text"
                  value={penaltyReasonInput}
                  onChange={(e) => setPenaltyReasonInput(e.target.value)}
                  className="input text-xs"
                  placeholder={t('technician.detail.penaltyReasonPlaceholder')}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowPenaltyModal(false)}
                  className="btn btn-ghost text-xs"
                >
                  {t('technician.detail.cancelBtn')}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPenalty}
                  disabled={actionLoading}
                  className={`btn text-xs text-white ${
                    penaltyPercentInput >= 100
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : penaltyPercentInput > 0
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'btn-primary'
                  }`}
                >
                  {penaltyPercentInput > 0
                    ? t('technician.detail.confirmPenaltyText', { percent: penaltyPercentInput, minutes: lateMinutesInput })
                    : t('technician.detail.confirmOnTimeText')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}