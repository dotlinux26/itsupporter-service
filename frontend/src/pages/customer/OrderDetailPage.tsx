import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { orderApi } from '../../api/client';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { MarkdownRenderer } from '../../components/MarkdownRenderer';
import { ZoomableImage } from '../../components/ImageModal';
import { 
  MessageSquare, 
  AlertCircle, 
  QrCode, 
  CheckCircle2
} from 'lucide-react';

export function OrderDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadOrder = async () => {
      if (!id) return;
      try {
        const response = await orderApi.get(Number(id));
        setOrder(response.data.data);
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
    loadOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="container py-10 md:py-12 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-2xl font-bold text-text mb-4">{error}</h1>
        <Link to="/orders" className="btn btn-primary">{t('common.back')}</Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-2xl font-bold text-text mb-4">{t('error.notFound')}</h1>
        <Link to="/orders" className="btn btn-primary">{t('common.back')}</Link>
      </div>
    );
  }

  return (
    <div className="container py-10 md:py-12 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link to="/orders" className="btn btn-ghost btn-sm inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900">
          ← {t('orders.backToOrders')}
        </Link>
      </div>

      {error && (
        <div className="bg-error-light border border-error text-error p-4 rounded-lg mb-6">{error}</div>
      )}

      <div className="card p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text">{order.code}</h1>
            <span className={`badge ${order.status === 'PENDING' ? 'badge-pending' :
                              order.status === 'CONFIRMED' ? 'badge-confirmed' :
                              order.status === 'IN_PROGRESS' ? 'badge-in_progress' :
                              order.status === 'COMPLETED' ? 'badge-completed' : 'badge-cancelled'}`}>
              {order.status === 'PENDING' ? 'Chờ xác nhận' :
               order.status === 'CONFIRMED' ? 'Đã xác nhận' :
               order.status === 'IN_PROGRESS' ? 'Đang thực hiện' :
               order.status === 'COMPLETED' ? 'Hoàn thành' : 'Đã hủy'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div className="space-y-3">
            <h4 className="font-semibold text-text">{t('orders.customerInfo')}</h4>
            <p>{order.customer_name}</p>
            <p className="text-text-secondary text-sm">{order.customer_email}</p>
            <p className="text-text-secondary text-sm">{order.customer_phone}</p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-text">{t('orders.serviceInfo')}</h4>
            <p className="font-medium">{order.package_name}</p>
            {order.note ? (
              <div className="text-text-secondary text-sm bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <MarkdownRenderer content={order.note} />
              </div>
            ) : (
              <p className="text-text-secondary text-sm">Không có ghi chú</p>
            )}
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-text">{t('orders.priceInfo')}</h4>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-black ${order.final_amount === 0 ? 'text-emerald-600' : 'text-primary'}`}>
                {order.final_amount.toLocaleString('vi-VN')} VNĐ
              </span>
              {order.price !== order.final_amount && (
                <span className="text-sm text-slate-400 line-through">
                  {order.price.toLocaleString('vi-VN')} đ
                </span>
              )}
            </div>

            {order.penalty_percent > 0 && (
              <div className="p-2.5 rounded-lg bg-orange-50 border border-orange-200 text-orange-800 text-xs">
                <div className="font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-orange-600" />
                  {order.penalty_percent >= 100 
                    ? '🎉 Vi phạm trễ giờ > 30p: MIỄN PHÍ 100% (0đ)' 
                    : `Áp dụng giảm trừ trễ giờ: -${order.penalty_percent}%`}
                </div>
                {order.penalty_reason && <div className="mt-0.5 text-slate-600">{order.penalty_reason}</div>}
              </div>
            )}

            <p className="text-text-secondary text-sm">
              Trạng thái: <span className={`font-semibold ${order.payment_status === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>
                {order.payment_status === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
              </span>
            </p>
          </div>

          <div className="space-y-3 md:col-span-2">
            <h4 className="font-semibold text-text">{t('orders.scheduleInfo')}</h4>
            <p>{format(new Date(order.scheduled_date), 'dd/MM/yyyy', { locale: vi })}</p>
            <p className="text-text-secondary text-sm">{order.scheduled_start} - {order.scheduled_end}</p>
          </div>

          <div className="space-y-3 md:col-span-2">
            <h4 className="font-semibold text-text">{t('orders.locationInfo')}</h4>
            <p>{order.location}</p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-text">{t('orders.statusInfo')}</h4>
            <span className={`badge ${order.status === 'PENDING' ? 'badge-pending' :
                              order.status === 'CONFIRMED' ? 'badge-confirmed' :
                              order.status === 'IN_PROGRESS' ? 'badge-in_progress' :
                              order.status === 'COMPLETED' ? 'badge-completed' : 'badge-cancelled'}`}>
              {order.status === 'PENDING' ? 'Chờ xác nhận' :
               order.status === 'CONFIRMED' ? 'Đã xác nhận' :
               order.status === 'IN_PROGRESS' ? 'Đang thực hiện' :
               order.status === 'COMPLETED' ? 'Hoàn thành' : 'Đã hủy'}
            </span>
            <p className="text-text-secondary text-sm">Cập nhật: {format(new Date(order.updated_at), 'dd/MM/yyyy HH:mm', { locale: vi })}</p>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <h3 className="font-semibold text-text mb-4">{t('orders.timeline')}</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="font-medium">Đơn được tạo</p>
                <p className="text-text-secondary text-sm">{format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}</p>
              </div>
            </div>
            {order.status !== 'PENDING' && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-success rounded-full mt-2 flex-shrink-0" />
                <div>
                  <p className="font-medium">Đã xác nhận</p>
                  <p className="text-text-secondary text-sm">Kỹ thuật viên đã nhận đơn</p>
                </div>
              </div>
            )}
            {order.status === 'IN_PROGRESS' || order.status === 'COMPLETED' && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-warning rounded-full mt-2 flex-shrink-0" />
                <div>
                  <p className="font-medium">Đang thực hiện</p>
                  <p className="text-text-secondary text-sm">{order.started_at ? format(new Date(order.started_at), 'dd/MM/yyyy HH:mm', { locale: vi }) : ''}</p>
                </div>
              </div>
            )}
            {order.status === 'COMPLETED' && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-success rounded-full mt-2 flex-shrink-0" />
                <div>
                  <p className="font-medium">Hoàn thành</p>
                  <p className="text-text-secondary text-sm">{order.completed_at ? format(new Date(order.completed_at), 'dd/MM/yyyy HH:mm', { locale: vi }) : ''} - {order.completion_result === 'SUCCESS' ? 'Thành công' : order.completion_result === 'FAILED' ? 'Thất bại' : 'Đã hủy'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment QR Section if available */}
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
                caption={`Mã đơn hàng: ${order.code} • Số tiền: ${order.final_amount.toLocaleString('vi-VN')} VNĐ`}
              />
              <span className="text-[11px] text-slate-400 mt-1">Nhấn để phóng to ảnh</span>
            </div>
            <div className="text-sm text-slate-600 space-y-1">
              <p className="font-bold text-slate-800">Quét mã QR bằng ứng dụng Ngân hàng</p>
              <p>Số tiền thanh toán: <strong className="text-orange-600 text-base">{order.final_amount.toLocaleString('vi-VN')} VNĐ</strong></p>
              <p className="text-xs text-slate-500">Nội dung chuyển khoản: <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-semibold">{order.code}</span></p>
              <div className="pt-2 text-xs text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Kỹ thuật viên sẽ xác nhận thanh toán trực tiếp khi nhận được thông báo biến động số dư.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat section */}
      <Link to={`/orders/${order.id}/chat`} className="card p-6 hover:shadow-md transition-shadow block mb-6 group">
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

      {/* Actions */}
      <div className="flex flex-wrap gap-4 mt-6">
        {order.status === 'PENDING' && (
          <button className="btn btn-outline" disabled>
            {t('orders.reschedule')}
          </button>
        )}
        {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
          <button className="btn btn-danger" disabled>
            {t('orders.cancelOrder')}
          </button>
        )}
        {order.status === 'COMPLETED' && !order.completion_result && (
          <button className="btn btn-primary" disabled>
            {t('orders.review')}
          </button>
        )}
        <button className="btn btn-secondary" disabled>
          {t('orders.payment')}
        </button>
      </div>
    </div>
  );
}