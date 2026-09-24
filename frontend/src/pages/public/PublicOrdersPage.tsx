import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { publicApi } from '../../api/client';

export function PublicOrdersPage() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 10;

  useEffect(() => {
    loadOrders(true);
  }, []);

  const loadOrders = async (reset = false) => {
    if (reset) {
      setPage(0);
      setOrders([]);
      setHasMore(true);
    }
    setLoading(true);
    try {
      const response = await publicApi.orders({ limit: LIMIT, offset: page * LIMIT });
      const newOrders = response.data.data;
      if (reset) setOrders(newOrders);
      else setOrders(prev => [...prev, ...newOrders]);
      setHasMore(newOrders.length === LIMIT);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-10 md:py-12 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-text mb-8">{t('nav.orders')}</h1>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1,2,3].map(i => <div key={i} className="card p-4 h-24 bg-gray-100 rounded" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-text-secondary">Chưa có đơn hàng công khai nào</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="card p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-primary-light flex items-center justify-center flex-shrink-0">
                      <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 002-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-text">{order.code}</h3>
                      <p className="text-sm text-text-secondary">{order.package_name}</p>
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
                    <p className="text-text-secondary">{new Date(order.scheduled_date).toLocaleDateString('vi-VN')} {order.scheduled_start}</p>
                    <p className="text-text-secondary">{order.technician_name || 'Chưa phân công'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="text-center mt-8">
              <button onClick={() => { setPage(p => p + 1); }} disabled={false} className="btn btn-outline">
                Tải thêm
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}