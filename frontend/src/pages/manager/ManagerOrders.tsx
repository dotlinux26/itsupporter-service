import { useEffect, useState } from 'react';
import { managerApi } from '../../api/client';
import {
  FileSpreadsheet,
  FileText,
  Search,
  UserCheck,
  Calendar,
  CheckCircle2,
  AlertCircle,
  X,
  Package,
} from 'lucide-react';

export function ManagerOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ status: '', technician_id: '', from: '', to: '' });

  // Assign modal state
  const [assignModalOrder, setAssignModalOrder] = useState<any | null>(null);
  const [selectedTechId, setSelectedTechId] = useState<number | ''>('');
  const [assignLoading, setAssignLoading] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadTechnicians();
  }, []);

  useEffect(() => {
    loadOrders();
  }, [filters]);

  const loadTechnicians = async () => {
    try {
      const res = await managerApi.technicians();
      setTechnicians(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load technicians:', err);
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const apiFilters: any = { ...filters };
      if (filters.technician_id) {
        apiFilters.technician_id = Number(filters.technician_id);
      }
      const response = await managerApi.orders(apiFilters);
      setOrders(response.data?.data || []);
    } catch (error) {
      console.error('Failed to load orders:', error);
      showFeedback('error', 'Không thể tải danh sách đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleStatusChange = async (orderId: number, nextStatus: string) => {
    try {
      await managerApi.updateOrderStatus(orderId, nextStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o)));
      showFeedback('success', `Đã cập nhật trạng thái đơn hàng.`);
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Cập nhật trạng thái thất bại.');
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalOrder || !selectedTechId) return;
    setAssignLoading(true);
    try {
      await managerApi.assignTechnician(assignModalOrder.id, Number(selectedTechId));
      const tech = technicians.find((t) => t.id === Number(selectedTechId));
      setOrders((prev) =>
        prev.map((o) =>
          o.id === assignModalOrder.id
            ? {
                ...o,
                technician_id: Number(selectedTechId),
                technician_name: tech?.name || 'KTV',
                status: o.status === 'PENDING' ? 'CONFIRMED' : o.status,
              }
            : o
        )
      );
      showFeedback('success', `Đã phân công ${tech?.name} cho đơn ${assignModalOrder.code}.`);
      setAssignModalOrder(null);
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Phân công kỹ thuật viên thất bại.');
    } finally {
      setAssignLoading(false);
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
        type:
          format === 'xlsx'
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'text/csv;charset=utf-8;',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders_${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showFeedback('success', `Đã xuất file ${format.toUpperCase()} thành công!`);
    } catch (err) {
      console.error('Export failed:', err);
      showFeedback('error', 'Xuất file thất bại. Vui lòng thử lại!');
    } finally {
      setExporting(null);
    }
  };

  // Client-side search filter
  const filteredOrders = orders.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.code?.toLowerCase().includes(q) ||
      o.customer_name?.toLowerCase().includes(q) ||
      o.technician_name?.toLowerCase().includes(q) ||
      o.package_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="container py-10 md:py-12 max-w-6xl mx-auto space-y-8">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Package className="w-7 h-7 text-primary" />
            Quản lý điều phối đơn hàng
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Theo dõi tiến độ, phân công kỹ thuật viên và trích xuất báo cáo doanh thu.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => handleExport('xlsx')}
            disabled={!!exporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            {exporting === 'xlsx' ? 'Đang xuất...' : 'Xuất Excel'}
          </button>
          <button
            onClick={() => handleExport('csv')}
            disabled={!!exporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition disabled:opacity-50"
          >
            <FileText className="w-4 h-4 text-slate-600" />
            {exporting === 'csv' ? 'Đang xuất...' : 'Xuất CSV'}
          </button>
        </div>
      </div>

      {/* FEEDBACK TOAST */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2.5 text-sm font-medium">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* FILTER & SEARCH CARD */}
      <div className="card p-5 bg-white space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Keyword Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm mã đơn, tên khách, KTV..."
              className="input input-search pl-11 pr-4 text-xs font-medium w-full"
            />
          </div>

          {/* Status filter */}
          <div>
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="input text-xs font-medium w-full"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">Chờ xác nhận</option>
              <option value="CONFIRMED">Đã xác nhận</option>
              <option value="IN_PROGRESS">Đang thực hiện</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>

          {/* Technician filter */}
          <div>
            <select
              value={filters.technician_id}
              onChange={(e) => setFilters((prev) => ({ ...prev, technician_id: e.target.value }))}
              className="input text-xs font-medium w-full"
            >
              <option value="">Tất cả Kỹ thuật viên</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setFilters({ status: '', technician_id: '', from: '', to: '' });
                setSearchQuery('');
              }}
              className="btn btn-outline text-xs px-3 w-full"
            >
              Xóa lọc
            </button>
          </div>
        </div>

        {/* Date range filter */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 text-xs text-gray-600">
          <span className="font-semibold flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            Khoảng ngày:
          </span>
          <div className="flex items-center gap-2">
            <span>Từ</span>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))}
              className="input text-xs py-1 px-2.5 w-36"
            />
            <span>đến</span>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))}
              className="input text-xs py-1 px-2.5 w-36"
            />
          </div>
        </div>
      </div>

      {/* ORDERS DATA TABLE */}
      <div className="card overflow-hidden bg-white">
        {loading ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-500">Đang tải danh sách đơn hàng...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Package className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="text-sm font-semibold text-gray-700">Không có đơn hàng nào phù hợp</p>
            <p className="text-xs text-gray-400">Hãy thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Mã đơn</th>
                  <th className="py-3 px-4">Khách hàng</th>
                  <th className="py-3 px-4">Kỹ thuật viên phụ trách</th>
                  <th className="py-3 px-4">Gói dịch vụ</th>
                  <th className="py-3 px-4">Thời gian hẹn</th>
                  <th className="py-3 px-4">Trạng thái đơn</th>
                  <th className="py-3 px-4">Thanh toán</th>
                  <th className="py-3 px-4 text-right">Phân công / Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-orange-50/20 transition-colors">
                    {/* Code */}
                    <td className="py-3.5 px-4 font-mono font-bold text-primary">
                      {order.code}
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-gray-900 block">{order.customer_name}</span>
                      {order.customer_phone && (
                        <span className="text-gray-400 font-mono text-[11px] block">{order.customer_phone}</span>
                      )}
                    </td>

                    {/* Technician */}
                    <td className="py-3.5 px-4">
                      {order.technician_name ? (
                        <span className="font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 inline-block">
                          🛠️ {order.technician_name}
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setAssignModalOrder(order);
                            setSelectedTechId(order.technician_id || '');
                          }}
                          className="text-xs text-orange-600 hover:text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200 font-semibold"
                        >
                          + Gán KTV
                        </button>
                      )}
                    </td>

                    {/* Package */}
                    <td className="py-3.5 px-4 font-medium text-gray-800">
                      {order.package_name}
                      <span className="text-[11px] text-gray-400 block">
                        {(order.final_amount ?? order.price ?? 0).toLocaleString('vi-VN')} đ
                      </span>
                    </td>

                    {/* Date & Time */}
                    <td className="py-3.5 px-4 text-gray-600">
                      <span className="block font-medium">
                        {new Date(order.scheduled_date).toLocaleDateString('vi-VN')}
                      </span>
                      <span className="text-[11px] text-gray-400 block">{order.scheduled_start}</span>
                    </td>

                    {/* Status dropdown */}
                    <td className="py-3.5 px-4">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`text-[11px] font-semibold px-2 py-1 rounded-lg border appearance-none cursor-pointer transition ${
                          order.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : order.status === 'IN_PROGRESS'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : order.status === 'CONFIRMED'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : order.status === 'CANCELLED'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                        }`}
                      >
                        <option value="PENDING">Chờ xác nhận</option>
                        <option value="CONFIRMED">Đã xác nhận</option>
                        <option value="IN_PROGRESS">Đang làm</option>
                        <option value="COMPLETED">Hoàn thành</option>
                        <option value="CANCELLED">Đã hủy</option>
                      </select>
                    </td>

                    {/* Payment status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                          order.payment_status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}
                      >
                        {order.payment_status === 'PAID' ? '✓ Đã thu' : 'Chưa thu'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setAssignModalOrder(order);
                          setSelectedTechId(order.technician_id || '');
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{order.technician_id ? 'Đổi KTV' : 'Gán KTV'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ASSIGN TECHNICIAN MODAL */}
      {assignModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-gray-900 text-base">Phân công Kỹ thuật viên</h3>
              </div>
              <button
                onClick={() => setAssignModalOrder(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-orange-50/50 rounded-xl border border-orange-100 text-xs space-y-1">
                <p>
                  <strong>Mã đơn:</strong> {assignModalOrder.code} · <strong>Khách:</strong>{' '}
                  {assignModalOrder.customer_name}
                </p>
                <p>
                  <strong>Dịch vụ:</strong> {assignModalOrder.package_name} (
                  {new Date(assignModalOrder.scheduled_date).toLocaleDateString('vi-VN')}{' '}
                  {assignModalOrder.scheduled_start})
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Chọn kỹ thuật viên phụ trách <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedTechId}
                  onChange={(e) => setSelectedTechId(e.target.value ? Number(e.target.value) : '')}
                  required
                  className="input text-sm w-full font-medium"
                >
                  <option value="">-- Chọn kỹ thuật viên --</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setAssignModalOrder(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={assignLoading || !selectedTechId}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {assignLoading ? 'Đang phân công...' : 'Xác nhận gán'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}