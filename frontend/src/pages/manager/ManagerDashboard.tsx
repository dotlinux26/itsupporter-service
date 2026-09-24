import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { managerApi } from '../../api/client';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertCircle,
  Wrench,
  TrendingUp,
  Users,
  Package,
  Receipt,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import { Avatar } from '../../components/Avatar';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  totalTechnicians: number;
  activeTechnicians: number;
  totalRevenue: number;
}

export function ManagerDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    inProgressOrders: 0,
    completedOrders: 0,
    totalTechnicians: 0,
    activeTechnicians: 0,
    totalRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [ordersRes, techsRes] = await Promise.all([
        managerApi.orders({}),
        managerApi.technicians(),
      ]);

      const orders: any[] = ordersRes.data?.data || [];
      const techs: any[] = techsRes.data?.data || [];

      // Calculate revenue from completed orders with fallback to actual prices
      const revenue = orders
        .filter((o) => o.status === 'COMPLETED')
        .reduce((sum, o) => sum + (Number(o.final_amount) || Number(o.total_price) || 50000), 0);

      setStats({
        totalOrders: orders.length,
        pendingOrders: orders.filter((o) => o.status === 'PENDING').length,
        inProgressOrders: orders.filter((o) => o.status === 'IN_PROGRESS' || o.status === 'CONFIRMED').length,
        completedOrders: orders.filter((o) => o.status === 'COMPLETED').length,
        totalTechnicians: techs.length,
        activeTechnicians: techs.filter((t) => t.status === 'ACTIVE').length,
        totalRevenue: revenue,
      });

      setRecentOrders(orders.slice(0, 6));
      setTechnicians(techs.slice(0, 6));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> Chờ xác nhận
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3 h-3" /> Đã xác nhận
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse">
            <Wrench className="w-3 h-3" /> Đang xử lý
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Hoàn thành
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3" /> Đã hủy
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="container py-10 md:py-12 max-w-6xl mx-auto space-y-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded-lg w-64"></div>
          <div className="h-4 bg-gray-100 rounded w-96"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-5 bg-white space-y-3 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-gray-100"></div>
              <div className="h-6 bg-gray-200 rounded w-24"></div>
              <div className="h-4 bg-gray-100 rounded w-32"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10 md:py-12 max-w-6xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <TrendingUp className="w-7 h-7 text-primary" />
            Bảng điều khiển Quản lý
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Tổng hợp dữ liệu vận hành, điều phối dịch vụ và quản lý đội ngũ kỹ thuật viên.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/manager/orders"
            className="btn btn-primary text-xs font-semibold px-4 py-2.5 shadow-sm"
          >
            <ClipboardList className="w-4 h-4" />
            Điều phối đơn hàng
          </Link>
        </div>
      </div>

      {/* KPI STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders */}
        <div className="card p-5 bg-white border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold flex-shrink-0">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-gray-500 block">Tổng đơn tiếp nhận</span>
            <span className="text-2xl font-bold text-gray-900">{stats.totalOrders}</span>
          </div>
        </div>

        {/* Pending & In Progress */}
        <div className="card p-5 bg-white border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-gray-500 block">Đang chờ / Đang xử lý</span>
            <span className="text-2xl font-bold text-amber-600">
              {stats.pendingOrders} <span className="text-sm text-gray-400 font-normal">/ {stats.inProgressOrders}</span>
            </span>
          </div>
        </div>

        {/* Completed Orders */}
        <div className="card p-5 bg-white border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-gray-500 block">Đơn đã hoàn thành</span>
            <span className="text-2xl font-bold text-emerald-600">{stats.completedOrders}</span>
          </div>
        </div>

        {/* Active Technicians */}
        <div className="card p-5 bg-white border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-gray-500 block">KTV đang hoạt động</span>
            <span className="text-2xl font-bold text-blue-600">
              {stats.activeTechnicians} <span className="text-sm text-gray-400 font-normal">/ {stats.totalTechnicians}</span>
            </span>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS SHORTCUTS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          to="/manager/orders"
          className="card p-4 bg-gradient-to-br from-orange-50/60 to-white hover:border-orange-300 transition-all flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ClipboardList className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-800 block">Đơn hàng</span>
            <span className="text-[11px] text-gray-500">Phân công & duyệt</span>
          </div>
        </Link>

        <Link
          to="/manager/packages"
          className="card p-4 bg-gradient-to-br from-blue-50/60 to-white hover:border-blue-300 transition-all flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-800 block">Gói dịch vụ</span>
            <span className="text-[11px] text-gray-500">Thiết lập & bảng giá</span>
          </div>
        </Link>

        <Link
          to="/manager/settlements"
          className="card p-4 bg-gradient-to-br from-emerald-50/60 to-white hover:border-emerald-300 transition-all flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-800 block">Quyết toán</span>
            <span className="text-[11px] text-gray-500">Chi trả hoa hồng KTV</span>
          </div>
        </Link>

        <Link
          to="/manager/reviews"
          className="card p-4 bg-gradient-to-br from-purple-50/60 to-white hover:border-purple-300 transition-all flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-800 block">Đánh giá</span>
            <span className="text-[11px] text-gray-500">Kiểm duyệt sao & góp ý</span>
          </div>
        </Link>
      </div>

      {/* TWO COLUMNS: RECENT ORDERS & TECHNICIANS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RECENT ORDERS TABLE (2 COLS) */}
        <div className="lg:col-span-2 card bg-white border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-gray-900 text-base">Đơn hàng gần đây</h3>
              </div>
              <Link
                to="/manager/orders"
                className="text-xs font-semibold text-primary hover:text-primary-hover inline-flex items-center gap-1"
              >
                Xem tất cả ({stats.totalOrders}) <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3 px-5">Mã đơn</th>
                    <th className="py-3 px-4">Khách hàng</th>
                    <th className="py-3 px-4">KTV phụ trách</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-5 text-right">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400">
                        Chưa có đơn hàng nào trong hệ thống.
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-orange-50/20 transition-colors">
                        <td className="py-3.5 px-5 font-bold font-mono text-gray-900">
                          <Link to="/manager/orders" className="hover:text-primary">
                            {order.code}
                          </Link>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-gray-800">
                          {order.customer_name || 'Khách vãng lai'}
                        </td>
                        <td className="py-3.5 px-4">
                          {order.technician_name ? (
                            <span className="text-gray-700 font-medium">🛠️ {order.technician_name}</span>
                          ) : (
                            <span className="text-gray-400 italic">Chưa chỉ định</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">{getStatusBadge(order.status)}</td>
                        <td className="py-3.5 px-5 text-right text-gray-500 font-mono text-[11px]">
                          {order.scheduled_date
                            ? format(new Date(order.scheduled_date), 'dd/MM/yyyy', { locale: vi })
                            : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50/50">
            <Link to="/manager/orders" className="btn btn-outline w-full text-xs font-semibold py-2">
              Quản lý toàn bộ danh sách đơn hàng
            </Link>
          </div>
        </div>

        {/* TECHNICIANS LIST (1 COL) */}
        <div className="card bg-white border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-base">Đội ngũ Kỹ thuật viên</h3>
              </div>
              <Link
                to="/manager/technicians"
                className="text-xs font-semibold text-primary hover:text-primary-hover inline-flex items-center gap-1"
              >
                Tất cả ({stats.totalTechnicians}) <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-4 divide-y divide-gray-100">
              {technicians.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-xs">
                  Chưa có kỹ thuật viên nào được đăng ký.
                </p>
              ) : (
                technicians.map((tech) => (
                  <div key={tech.id} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={tech.avatar_url}
                        name={tech.name}
                        email={tech.email}
                        size={36}
                      />
                      <div>
                        <span className="font-bold text-gray-900 text-xs block">{tech.name}</span>
                        <span className="text-[11px] text-gray-500 font-mono block">{tech.email}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          tech.status === 'ACTIVE' ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-rose-500 ring-4 ring-rose-100'
                        }`}
                        title={tech.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm dừng'}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50/50">
            <Link to="/manager/technicians" className="btn btn-outline w-full text-xs font-semibold py-2">
              Xem chi tiết đội ngũ kỹ thuật viên
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}