import { useEffect, useState } from 'react';
import { adminApi } from '../../api/client';

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTechnicians: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await adminApi.stats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
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
      <h1 className="text-2xl font-bold text-text mb-8">Dashboard Quản trị</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <h3 className="text-text-secondary text-sm font-medium">Tổng người dùng</h3>
          <p className="text-3xl font-bold text-text mt-2">{stats.totalUsers}</p>
        </div>
        <div className="card p-6">
          <h3 className="text-text-secondary text-sm font-medium">Tổng kỹ thuật viên</h3>
          <p className="text-3xl font-bold text-primary mt-2">{stats.totalTechnicians}</p>
        </div>
        <div className="card p-6">
          <h3 className="text-text-secondary text-sm font-medium">Tổng đơn hàng</h3>
          <p className="text-3xl font-bold text-info mt-2">{stats.totalOrders}</p>
        </div>
        <div className="card p-6">
          <h3 className="text-text-secondary text-sm font-medium">Tổng doanh thu</h3>
          <p className="text-3xl font-bold text-success mt-2">{stats.totalRevenue.toLocaleString('vi-VN')} VNĐ</p>
        </div>
      </div>

      <div className="card">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-text">Thống kê nhanh</h3>
        </div>
        <div className="p-4">
          <p className="text-center text-text-secondary py-8">Chi tiết thống kê sẽ hiển thị ở đây</p>
        </div>
      </div>
    </div>
  );
}