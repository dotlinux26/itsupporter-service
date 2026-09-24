import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { orderApi, reviewApi } from '../../api/client';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { formatVietnamTime } from '../../utils/date';
import { MarkdownRenderer } from '../../components/MarkdownRenderer';
import { ZoomableImage } from '../../components/ImageModal';
import { OrderTimeline } from '../../components/OrderTimeline';
import type { OrderTimelineItem } from '../../types';
import {
  MessageSquare,
  AlertCircle,
  QrCode,
  CheckCircle2,
  ArrowLeft,
  Phone,
  Mail,
  User,
  Star,
  Clock,
  MapPin,
  Calendar,
  Send,
  Sparkles
} from 'lucide-react';

export function OrderDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [timeline, setTimeline] = useState<OrderTimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Review states
  const [review, setReview] = useState<any>(null);
  const [ratingInput, setRatingInput] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const loadOrderData = async () => {
    if (!id) return;
    try {
      const response = await orderApi.get(Number(id));
      const orderData = response.data.data;
      setOrder(orderData);

      // Load timeline
      try {
        const tlRes = await orderApi.timeline(Number(id));
        setTimeline(tlRes.data.data || []);
      } catch {
        // timeline fallback handles this
      }

      // Load review if completed
      if (orderData.status === 'COMPLETED') {
        try {
          const revRes = await reviewApi.getByOrder(Number(id));
          if (revRes.data.data) {
            setReview(revRes.data.data);
          }
        } catch {
          // 404 indicates not yet reviewed
        }
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError(t('error.notFound'));
      } else {
        setError(t('error.serverError'));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrderData();
  }, [id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !id) return;
    setSubmittingReview(true);
    setReviewError('');
    try {
      const res = await reviewApi.create({
        orderId: Number(id),
        rating: ratingInput,
        content: commentInput.trim(),
      });
      setReview(res.data.data);
      setReviewSuccess(true);
    } catch (err: any) {
      setReviewError(err.response?.data?.error?.message || 'Không thể gửi đánh giá');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-10 md:py-12 max-w-5xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-32 bg-gray-200 rounded-xl"></div>
            <div className="h-32 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container py-16 text-center max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-text mb-4">{error || t('error.notFound')}</h1>
        <Link to="/orders" className="btn btn-primary inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          <span>{t('orders.backToOrders')}</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-10 md:py-12 max-w-5xl mx-auto">
      {/* Top navigation bar */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/orders"
          className="btn btn-ghost btn-sm inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('orders.backToOrders')}</span>
        </Link>

        <Link
          to={`/orders/${order.id}/chat`}
          className="btn btn-outline text-orange-600 border-orange-300 hover:bg-orange-50 flex items-center gap-2 text-sm"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Mở khung Chat với KTV</span>
        </Link>
      </div>

      {/* Main Order Header Card */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-text font-mono tracking-tight">{order.code}</h1>
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
            </div>
            <p className="text-xs text-text-muted mt-1">
              Thời gian tạo đơn: {formatVietnamTime(order.created_at, 'dd/MM/yyyy HH:mm:ss')}
            </p>
          </div>

          <div className="text-left md:text-right">
            <span className="text-xs text-text-muted uppercase tracking-wider font-semibold block">Tổng chi phí</span>
            <div className="flex items-baseline gap-2 md:justify-end">
              <span className={`text-2xl font-black ${order.final_amount === 0 ? 'text-emerald-600' : 'text-primary'}`}>
                {Number(order.final_amount).toLocaleString('vi-VN')} VNĐ
              </span>
              {order.price !== order.final_amount && (
                <span className="text-sm text-slate-400 line-through">
                  {Number(order.price).toLocaleString('vi-VN')} đ
                </span>
              )}
            </div>
            <div className="mt-1">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                order.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {order.payment_status === 'PAID' ? '✓ Đã thanh toán' : 'Chưa thanh toán'}
              </span>
            </div>
          </div>
        </div>

        {/* Assigned Technician Profile Card (If confirmed/in-progress/completed) */}
        {order.technician_name ? (
          <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-200 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                {order.technician_avatar_url ? (
                  <img
                    src={order.technician_avatar_url}
                    alt={order.technician_name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-orange-300 shadow-xs"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-orange-200 text-orange-800 font-bold text-xl flex items-center justify-center border-2 border-orange-300 shadow-xs">
                    {order.technician_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-extrabold tracking-wider px-2 py-0.5 rounded bg-orange-100 text-orange-800">
                      Kỹ thuật viên phụ trách
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">{order.technician_name}</h3>
                  {order.technician_bio && (
                    <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">{order.technician_bio}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                {order.technician_phone && (
                  <a
                    href={`tel:${order.technician_phone}`}
                    className="btn btn-outline btn-sm bg-white hover:bg-orange-50 text-slate-700 flex items-center gap-1.5 text-xs shadow-2xs"
                  >
                    <Phone className="w-3.5 h-3.5 text-orange-600" />
                    <span>{order.technician_phone}</span>
                  </a>
                )}
                {order.technician_email && (
                  <a
                    href={`mailto:${order.technician_email}`}
                    className="btn btn-outline btn-sm bg-white hover:bg-orange-50 text-slate-700 flex items-center gap-1.5 text-xs shadow-2xs"
                  >
                    <Mail className="w-3.5 h-3.5 text-orange-600" />
                    <span>{order.technician_email}</span>
                  </a>
                )}
                <Link
                  to={`/orders/${order.id}/chat`}
                  className="btn btn-primary btn-sm flex items-center gap-1.5 text-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Nhắn tin KTV</span>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-6 flex items-center gap-3 text-slate-600">
            <User className="w-5 h-5 text-slate-400" />
            <div className="text-sm">
              <strong className="text-slate-800">Kỹ thuật viên:</strong> Hệ thống đang điều phối kỹ thuật viên chuyên trách cho đơn của bạn.
            </div>
          </div>
        )}

        {/* Detailed Grid: Service Package vs Customer Note vs Schedule & Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Service Package Box */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
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

          {/* Customer Note Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Ghi chú của bạn / Yêu cầu thêm</span>
            {order.note ? (
              <div className="text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed max-h-36 overflow-y-auto">
                <MarkdownRenderer content={order.note} />
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic py-2">Không có ghi chú thêm khi đặt đơn.</p>
            )}
          </div>
        </div>

        {/* Schedule & Location & Penalties */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pt-4 border-t border-border">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5" />
              <span>Thời gian hẹn</span>
            </div>
            <p className="text-slate-900 font-semibold">
              {format(new Date(order.scheduled_date), 'dd/MM/yyyy', { locale: vi })}
            </p>
            <p className="text-xs text-orange-600 font-bold flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Khung giờ: {order.scheduled_start} - {order.scheduled_end}</span>
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5" />
              <span>Địa điểm thực hiện</span>
            </div>
            <p className="text-slate-900 font-medium text-sm leading-snug">{order.location}</p>
          </div>
        </div>

        {order.penalty_percent > 0 && (
          <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-orange-900 text-xs mb-6 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <strong>
                {order.penalty_percent >= 100
                  ? '🎉 Áp dụng chính sách vi phạm giờ hẹn > 30p: MIỄN PHÍ 100% (0đ)'
                  : `Áp dụng giảm trừ vi phạm giờ hẹn: -${order.penalty_percent}%`}
              </strong>
              {order.penalty_reason && <p className="text-slate-600 mt-0.5">{order.penalty_reason}</p>}
            </div>
          </div>
        )}

        {/* Timeline / Status History Section */}
        <div className="border-t border-border pt-6">
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

      {/* Payment QR Section if available and not PAID */}
      {order.payment_qr_path && order.payment_status !== 'PAID' && (
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <QrCode className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold text-text">Mã QR Thanh Toán Ngân Hàng</h3>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex flex-col items-center">
              <ZoomableImage
                src={order.payment_qr_path}
                alt="QR Thanh Toán"
                className="w-48 h-48 object-contain rounded-xl border border-slate-200 shadow-xs bg-white p-2"
                title="Mã QR Thanh Toán Ngân Hàng"
                caption={`Mã đơn hàng: ${order.code} • Số tiền: ${Number(order.final_amount).toLocaleString('vi-VN')} VNĐ`}
              />
              <span className="text-[11px] text-slate-400 mt-1">Nhấn để phóng to ảnh</span>
            </div>
            <div className="text-sm text-slate-600 space-y-1">
              <p className="font-bold text-slate-800">Quét mã QR bằng ứng dụng Ngân hàng</p>
              <p>Số tiền thanh toán: <strong className="text-orange-600 text-base">{Number(order.final_amount).toLocaleString('vi-VN')} VNĐ</strong></p>
              <p className="text-xs text-slate-500">Nội dung chuyển khoản: <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-semibold">{order.code}</span></p>
              <div className="pt-2 text-xs text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Kỹ thuật viên sẽ xác nhận thanh toán trực tiếp khi nhận được thông báo biến động số dư.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Review & Rating Section (Shown when COMPLETED) */}
      {order.status === 'COMPLETED' && (
        <div className="card p-6 mb-6 border border-border shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <h3 className="font-bold text-text text-base">Đánh giá & Phản hồi dịch vụ</h3>
            </div>
            {review && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                ✓ Bạn đã đánh giá
              </span>
            )}
          </div>

          {review ? (
            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= review.rating
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-slate-300'
                      }`}
                    />
                  ))}
                  <span className="font-bold text-slate-800 text-sm ml-2">{review.rating} / 5 sao</span>
                </div>
                <span className="text-xs text-slate-500 font-mono">
                  {formatVietnamTime(review.created_at, 'dd/MM/yyyy HH:mm:ss')}
                </span>
              </div>
              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{review.content}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <p className="text-xs text-slate-600">
                Cảm ơn bạn đã sử dụng dịch vụ IT Supporter! Hãy chia sẻ trải nghiệm để giúp kỹ thuật viên nâng cao chất lượng phục vụ.
              </p>

              {reviewSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs border border-emerald-200">
                  🎉 Cảm ơn bạn! Đánh giá đã được ghi nhận thành công.
                </div>
              )}

              {reviewError && (
                <div className="p-3 rounded-lg bg-rose-50 text-rose-800 text-xs border border-rose-200">
                  {reviewError}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Mức độ hài lòng:</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = (hoverRating !== null ? hoverRating : ratingInput) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingInput(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-7 h-7 transition-colors ${
                            active ? 'text-amber-500 fill-amber-500' : 'text-slate-300'
                          }`}
                        />
                      </button>
                    );
                  })}
                  <span className="text-sm font-bold text-amber-600 ml-2">
                    {hoverRating !== null ? hoverRating : ratingInput} / 5 sao
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nhận xét chi tiết (Thái độ phục vụ, chuyên môn, tốc độ...):
                </label>
                <textarea
                  rows={3}
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Hãy chia sẻ cảm nhận thực tế của bạn..."
                  className="input w-full text-sm resize-none"
                  required
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingReview || !commentInput.trim()}
                  className="btn btn-primary flex items-center gap-2 text-sm"
                >
                  <Send className="w-4 h-4" />
                  <span>{submittingReview ? 'Đang gửi...' : 'Gửi đánh giá dịch vụ'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Chat Quick Action Card */}
      <Link to={`/orders/${order.id}/chat`} className="card p-6 hover:shadow-md transition-shadow block mb-6 group border border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-text group-hover:text-orange-600 transition-colors">{t('orders.chat')}</h3>
              <p className="text-text-secondary text-sm">Trò chuyện trực tiếp, gửi ảnh máy hoặc nhận Voucher từ Kỹ thuật viên</p>
            </div>
          </div>
          <span className="text-sm font-semibold text-orange-600">Mở Chat →</span>
        </div>
      </Link>
    </div>
  );
}