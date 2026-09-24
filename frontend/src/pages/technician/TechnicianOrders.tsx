import { useEffect, useState } from 'react';
import { technicianApi } from '../../api/client';

export function TechnicianOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await technicianApi.orders({ status: filterStatus || undefined });
      setOrders(response.data.data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [filterStatus]);

  return (
    <div className="container py-10 md:py-12 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text">Đơn hàng của tôi</h1>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="input w-auto"
        >
          <option value="">{'Tất cả trạng thái'}</option>
          <option value="PENDING">Chờ xác nhận</option>
          <option value="CONFIRMED">Đã xác nhận</option>
          <option value="IN_PROGRESS">Đang thực hiện</option>
          <option value="COMPLETED">Hoàn thành</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>
      </div>

      <div className="space-y-4">
        {orders.map(order => (
          <a key={order.id} href={`/technician/orders/${order.id}`} className="card p-4 hover:shadow-md transition-shadow block">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-primary-light flex items-center justify-center flex-shrink-0">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 002-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
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
                <p className="text-text-secondary">{order.scheduled_date} {order.scheduled_start}</p>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}