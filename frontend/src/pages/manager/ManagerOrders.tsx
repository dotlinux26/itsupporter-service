import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { managerApi } from '../../api/client';
import { FileSpreadsheet, FileText } from 'lucide-react';

export function ManagerOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const [filters, setFilters] = useState({ status: '', technician_id: '', from: '', to: '' });

  useEffect(() => {
    loadOrders();
  }, [filters]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const apiFilters: any = { ...filters };
      if (filters.technician_id) {
        apiFilters.technician_id = Number(filters.technician_id);
      }
      const response = await managerApi.orders(apiFilters);
      setOrders(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load orders:', error);
      setLoading(false);
    }
  };

  const handleExport = async (format: 'xlsx' | 'csv') => {
    try {
      setExporting(format);
      const res = await managerApi.exportReport({
        type: 'orders',
        format,
        from: filters.from || undefined,
        to: filters.to || undefined,
        status: filters.status || undefined,
        technician_id: filters.technician_id ? Number(filters.technician_id) : undefined,
      });
      const blob = new Blob([res.data], {
        type: format === 'xlsx'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/csv;charset=utf-8;'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders_${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Xuất file thất bại. Vui lòng thử lại!');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="container py-10 md:py-12 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Quản lý đơn hàng</h1>
          <p className="text-sm text-text-secondary">Theo dõi, điều phối và trích xuất báo cáo đơn hàng</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('xlsx')}
            disabled={!!exporting}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            {exporting === 'xlsx' ? 'Đang xuất...' : 'Xuất Excel (.xlsx)'}
          </button>
          <button
            onClick={() => handleExport('csv')}
            disabled={!!exporting}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition disabled:opacity-50"
          >
            <FileText className="w-4 h-4 text-slate-600" />
            {exporting === 'csv' ? 'Đang xuất...' : 'Xuất CSV (.csv)'}
          </button>
        </div>
      </div>

      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="label">Trạng thái</label>
            <select value={filters.status} onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))} className="input">
              <option value="">Tất cả</option>
              <option value="PENDING">Chờ xác nhận</option>
              <option value="CONFIRMED">Đã xác nhận</option>
              <option value="IN_PROGRESS">Đang thực hiện</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>
          <div>
            <label className="label">Kỹ thuật viên</label>
            <input type="text" placeholder="ID kỹ thuật viên" value={filters.technician_id} onChange={e => setFilters(prev => ({ ...prev, technician_id: e.target.value }))} className="input" />
          </div>
          <div>
            <label className="label">Từ ngày</label>
            <input type="date" value={filters.from} onChange={e => setFilters(prev => ({ ...prev, from: e.target.value }))} className="input" />
          </div>
          <div>
            <label className="label">Đến ngày</label>
            <input type="date" value={filters.to} onChange={e => setFilters(prev => ({ ...prev, to: e.target.value }))} className="input" />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={() => loadOrders()} className="btn btn-primary">Lọc</button>
          <button onClick={() => setFilters({ status: '', technician_id: '', from: '', to: '' })} className="btn btn-outline">Xóa bộ lọc</button>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1,2,3].map(i => <div key={i} className="card p-4 h-24 bg-gray-100 rounded" />)}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-text-secondary border-b border-border">
                  <th className="pb-2">Mã đơn</th>
                  <th className="pb-2">Khách hàng</th>
                  <th className="pb-2">Kỹ thuật viên</th>
                  <th className="pb-2">Gói dịch vụ</th>
                  <th className="pb-2">Thời gian</th>
                  <th className="pb-2">Trạng thái</th>
                  <th className="pb-2">Thanh toán</th>
                  <th className="pb-2">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} className="border-b border-border last:border-none hover:bg-gray-50">
                    <td className="py-3 font-medium">{order.code}</td>
                    <td>{order.customer_name}</td>
                    <td>{order.technician_name || 'Chưa phân công'}</td>
                    <td>{order.package_name}</td>
                    <td className="text-text-secondary">{new Date(order.scheduled_date).toLocaleDateString('vi-VN')} {order.scheduled_start}</td>
                    <td><span className={`badge ${order.status === 'PENDING' ? 'badge-pending' : order.status === 'CONFIRMED' ? 'badge-confirmed' : order.status === 'IN_PROGRESS' ? 'badge-in_progress' : order.status === 'COMPLETED' ? 'badge-completed' : 'badge-cancelled'}`}>
                      {order.status === 'PENDING' ? 'Chờ xác nhận' : order.status === 'CONFIRMED' ? 'Đã xác nhận' : order.status === 'IN_PROGRESS' ? 'Đang thực hiện' : order.status === 'COMPLETED' ? 'Hoàn thành' : 'Đã hủy'}
                    </span></td>
                    <td><span className={`badge ${order.payment_status === 'PAID' ? 'badge-paid' : 'badge-unpaid'}`}>{order.payment_status === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}</span></td>
                    <td>
                      <Link to={`/manager/orders/${order.id}`} className="btn btn-ghost btn-sm">Xem</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}