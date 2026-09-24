import { useEffect, useState } from 'react';
import { managerApi } from '../../api/client';

export function ManagerDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    inProgressOrders: 0,
    completedOrders: 0,
    totalTechnicians: 0,
    totalRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ordersRes, techsRes] = await Promise.all([
        managerApi.orders({}),
        managerApi.technicians(),
      ]);
      const orders = ordersRes.data.data;
      setStats({
        totalOrders: orders.length,
        pendingOrders: orders.filter((o: any) => o.status === 'PENDING').length,
        inProgressOrders: orders.filter((o: any) => o.status === 'IN_PROGRESS').length,
        completedOrders: orders.filter((o: any) => o.status === 'COMPLETED').length,
        totalTechnicians: techsRes.data.data.length,
        totalRevenue: 15000000,
      });
      setRecentOrders(orders.slice(0, 5));
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-10 md:py-12 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => <div key={i} className="card p-6"><div className="h-4 bg-gray-200 rounded w-1/3"></div></div>)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10 md:py-12 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-text mb-8">Dashboard Quản lý</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <h3 className="text-text-secondary text-sm font-medium">Tổng đơn hàng</h3>
          <p className="text-3xl font-bold text-text mt-2">{stats.totalOrders}</p>
        </div>
        <div className="card p-6">
          <h3 className="text-text-secondary text-sm font-medium">Chờ xử lý</h3>
          <p className="text-3xl font-bold text-warning mt-2">{stats.pendingOrders}</p>
        </div>
        <div className="card p-6">
          <h3 className="text-text-secondary text-sm font-medium">Đang thực hiện</h3>
          <p className="text-3xl font-bold text-info mt-2">{stats.inProgressOrders}</p>
        </div>
        <div className="card p-6">
          <h3 className="text-text-secondary text-sm font-medium">Hoàn thành</h3>
          <p className="text-3xl font-bold text-success mt-2">{stats.completedOrders}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-text">Đơn hàng gần đây</h3>
            <a href="/manager/orders" className="text-sm text-primary hover:underline">Xem tất cả</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-text-secondary border-b border-border">
                  <th className="pb-2">Mã đơn</th>
                  <th className="pb-2">Khách hàng</th>
                  <th className="pb-2">Trạng thái</th>
                  <th className="pb-2">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.slice(0, 5).map((order: any) => (
                  <tr key={order.id} className="border-b border-border last:border-none">
                    <td className="py-3 font-medium">{order.code}</td>
                    <td>{order.customer_name}</td>
                    <td><span className={`badge ${order.status === 'PENDING' ? 'badge-pending' : order.status === 'CONFIRMED' ? 'badge-confirmed' : order.status === 'IN_PROGRESS' ? 'badge-in_progress' : order.status === 'COMPLETED' ? 'badge-completed' : 'badge-cancelled'}`}>
                      {order.status === 'PENDING' ? 'Chờ xác nhận' : order.status === 'CONFIRMED' ? 'Đã xác nhận' : order.status === 'IN_PROGRESS' ? 'Đang thực hiện' : order.status === 'COMPLETED' ? 'Hoàn thành' : 'Đã hủy'}
                    </span></td>
                    <td className="text-text-secondary">{new Date(order.scheduled_date).toLocaleDateString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-4 border-t border-border">
              <a href="/manager/orders" className="btn btn-outline w-full">Xem tất cả đơn hàng</a>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-text">Kỹ thuật viên</h3>
            <a href="/manager/technicians" className="text-sm text-primary hover:underline">Xem tất cả</a>
          </div>
          <div className="p-4">
            <p className="text-center text-text-secondary py-8">Danh sách kỹ thuật viên sẽ hiển thị ở đây</p>
          </div>
        </div>
      </div>
    </div>
  );
}