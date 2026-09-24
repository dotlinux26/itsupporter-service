import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { orderApi } from '../../api/client';
import type { OrderRow } from '../../types';

export function OrdersPage() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 10;

  const loadOrders = async (reset = false) => {
    if (reset) {
      setPage(0);
      setOrders([]);
      setHasMore(true);
    }
    setLoading(true);
    try {
      const response = await orderApi.listMy({ limit: LIMIT, offset: page * LIMIT });
      const newOrders = response.data.data;
      if (reset) {
        setOrders(newOrders);
      } else {
        setOrders(prev => [...prev, ...newOrders]);
      }
      setHasMore(newOrders.length === LIMIT);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(true);
  }, []);

  return (
    <div className="container py-10 md:py-12 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{t('orders.myOrders')}</h1>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi trạng thái tiếp nhận, tiến độ bảo dưỡng và lịch sử đơn hàng của bạn.
          </p>
        </div>
      </div>

      {loading && orders.length === 0 ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse card p-6">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mt-4"></div>
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="card p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-text-muted mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 002-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <h3 className="text-lg font-medium text-text mb-2">{t('orders.noOrders')}</h3>
          <p className="text-text-secondary mb-4">Bạn chưa có đơn hàng nào. Hãy đặt lịch dịch vụ đầu tiên của bạn!</p>
          <Link to="/#booking-calendar" className="btn btn-primary">{t('home.bookNow')}</Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order) => (
              <Link key={order.id} to={`/orders/${order.id}`} className="card p-6 hover:shadow-md transition-shadow block">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-primary-light flex items-center justify-center flex-shrink-0">
                      <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 002-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-text">{order.code}</h3>
                      <p className="text-sm text-text-secondary">{order.package_name || 'Gói dịch vụ'}</p>
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end gap-2 text-sm">
                    <span className={`badge ${order.status === 'PENDING' ? 'badge-pending' :
                                          order.status === 'CONFIRMED' ? 'badge-confirmed' :
                                          order.status === 'IN_PROGRESS' ? 'badge-in_progress' :
                                          order.status === 'COMPLETED' ? 'badge-completed' : 'badge-cancelled'}`}>
                      {order.status === 'PENDING' ? 'Chờ xác nhận' :
                       order.status === 'CONFIRMED' ? 'Đã xác nhận' :
                       order.status === 'IN_PROGRESS' ? 'Đang thực hiện' :
                       order.status === 'COMPLETED' ? 'Hoàn thành' : 'Đã hủy'}
                    </span>
                    <p className="text-text-secondary">
                      {new Date(order.scheduled_date).toLocaleDateString('vi-VN')} {order.scheduled_start}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-4 text-sm text-text-secondary">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span>{order.location}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>{order.technician_name || t('orders.technician')}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>{new Date(order.updated_at).toLocaleString('vi-VN')}</span>
                  </span>
                  {order.has_unread && (
                    <span className="badge badge-pending flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        {t('orders.hasNewMessage')}
                      </span>
                    )}
                </div>
              </Link>
            ))}
          </div>

          {hasMore && (
            <div className="text-center mt-8">
              <button
                onClick={() => { setPage(p => p + 1); loadOrders(false); }}
                disabled={loading}
                className="btn btn-outline"
              >
                {loading ? t('pagination.loading') : t('pagination.loadMore')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}