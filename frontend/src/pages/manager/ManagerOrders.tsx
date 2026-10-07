import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { managerApi, publicApi, orderApi } from '../../api/client';
import { Avatar } from '../../components/Avatar';
import { OrderTimeline } from '../../components/OrderTimeline';
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
  Zap,
  Sparkles,
  Wrench,
  Clock,
  ShieldAlert,
  Receipt,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  Tag,
  ExternalLink,
} from 'lucide-react';

export function ManagerOrders() {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');

  const [orders, setOrders] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ status: '', technician_id: '', from: '', to: '' });

  // Assign modal state
  const [assignModalOrder, setAssignModalOrder] = useState<any | null>(null);
  const [selectedTechId, setSelectedTechId] = useState<number | ''>('');
  const [slotCandidates, setSlotCandidates] = useState<any[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);

  // Order Detail & Invoice Modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<any | null>(null);
  const [orderTimeline, setOrderTimeline] = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const openOrderDetail = async (orderId: number) => {
    setDetailModalOpen(true);
    setLoadingDetail(true);
    setSelectedOrderDetail(null);
    setOrderTimeline([]);
    try {
      const [res, timeRes] = await Promise.all([
        orderApi.get(orderId),
        orderApi.timeline(orderId).catch(() => ({ data: { data: [] } })),
      ]);
      setSelectedOrderDetail(res.data?.data || null);
      setOrderTimeline(timeRes.data?.data || []);
    } catch (err) {
      console.error('Failed to load order detail:', err);
      showFeedback('error', isEn ? 'Failed to load order invoice details.' : 'Không thể tải chi tiết hóa đơn đơn hàng.');
    } finally {
      setLoadingDetail(false);
    }
  };

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
      showFeedback('error', t('orders.loadError', 'Không thể tải danh sách đơn hàng.'));
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const openAssignModal = async (order: any) => {
    setAssignModalOrder(order);
    setSelectedTechId(order.technician_id || '');
    setSlotCandidates([]);
    setCandidatesLoading(true);
    try {
      const res = await managerApi.orderAvailableTechnicians(order.id);
      const data = res.data?.data;
      const list = data?.available_technicians || [];
      setSlotCandidates(list);
      if (data?.all_technicians?.length) {
        setTechnicians(data.all_technicians);
      }
      if (!order.technician_id && data?.auto_recommended_id) {
        setSelectedTechId(data.auto_recommended_id);
      }
    } catch (err) {
      console.error('Failed to load candidates:', err);
      try {
        const fallbackRes = await publicApi.technicians(order.scheduled_date, order.scheduled_start);
        const list = Array.isArray(fallbackRes.data?.data) ? fallbackRes.data.data : [];
        setSlotCandidates(list);
        if (!order.technician_id && list.length > 0) {
          setSelectedTechId(list[0].id);
        }
      } catch (fbErr) {
        console.error('Fallback failed:', fbErr);
      }
    } finally {
      setCandidatesLoading(false);
    }
  };

  const handleAutoPickCandidate = () => {
    if (slotCandidates.length === 0) return;
    const others = slotCandidates.filter((c) => c.id !== selectedTechId);
    if (others.length > 0) {
      const randomCandidate = others[Math.floor(Math.random() * others.length)];
      setSelectedTechId(randomCandidate.id);
    } else {
      setSelectedTechId(slotCandidates[0].id);
    }
  };

  const handleStatusChange = async (orderId: number, nextStatus: string) => {
    try {
      await managerApi.updateOrderStatus(orderId, nextStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o)));
      showFeedback('success', t('orders.statusUpdated', 'Đã cập nhật trạng thái đơn hàng.'));
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || t('orders.statusUpdateFail', 'Cập nhật trạng thái thất bại.'));
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
      showFeedback('success', t('manager.assignedSuccess', 'Đã phân công {{name}} cho đơn {{code}}.', { name: tech?.name, code: assignModalOrder.code }));
      setAssignModalOrder(null);
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || t('manager.assignFail', 'Phân công kỹ thuật viên thất bại.'));
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
      showFeedback('success', t('manager.exportSuccess', { type: 'ORDERS', format: format.toUpperCase() }));
    } catch (err) {
      console.error('Export failed:', err);
      showFeedback('error', t('manager.exportFail'));
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
    <div className="container py-5 sm:py-8 md:py-12 max-w-6xl mx-auto space-y-6 sm:space-y-8">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Package className="w-7 h-7 text-primary" />
            {t('manager.orderMgmtTitle')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('manager.orderMgmtSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => handleExport('xlsx')}
            disabled={!!exporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            {exporting === 'xlsx' ? (isEn ? 'Exporting...' : 'Đang xuất...') : t('manager.exportExcel')}
          </button>
          <button
            onClick={() => handleExport('csv')}
            disabled={!!exporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition disabled:opacity-50"
          >
            <FileText className="w-4 h-4 text-slate-600" />
            {exporting === 'csv' ? (isEn ? 'Exporting...' : 'Đang xuất...') : t('manager.exportCsv')}
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
              placeholder={isEn ? "Search code, customer, technician..." : "Tìm mã đơn, tên khách, KTV..."}
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
              <option value="">{t('orders.allStatuses')}</option>
              <option value="PENDING">{t('status.pending')}</option>
              <option value="CONFIRMED">{t('status.confirmed')}</option>
              <option value="IN_PROGRESS">{t('status.in_progress')}</option>
              <option value="COMPLETED">{t('status.completed')}</option>
              <option value="CANCELLED">{t('status.cancelled')}</option>
            </select>
          </div>

          {/* Technician filter */}
          <div>
            <select
              value={filters.technician_id}
              onChange={(e) => setFilters((prev) => ({ ...prev, technician_id: e.target.value }))}
              className="input text-xs font-medium w-full"
            >
              <option value="">{isEn ? "All Technicians" : "Tất cả Kỹ thuật viên"}</option>
              {technicians.map((tItem) => (
                <option key={tItem.id} value={tItem.id}>
                  {tItem.name}
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
              {isEn ? "Clear filters" : "Xóa lọc"}
            </button>
          </div>
        </div>

        {/* Date range filter */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 text-xs text-gray-600">
          <span className="font-semibold flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            {isEn ? "Date range:" : "Khoảng ngày:"}
          </span>
          <div className="flex items-center gap-2">
            <span>{isEn ? "From" : "Từ"}</span>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))}
              className="input text-xs py-1 px-2.5 w-36"
            />
            <span>{isEn ? "to" : "đến"}</span>
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
            <p className="text-sm text-gray-500">{isEn ? 'Loading orders list...' : 'Đang tải danh sách đơn hàng...'}</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Package className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="text-sm font-semibold text-gray-700">{isEn ? 'No matching orders found' : 'Không có đơn hàng nào phù hợp'}</p>
            <p className="text-xs text-gray-400">{isEn ? 'Try adjusting your filters or search keywords.' : 'Hãy thay đổi bộ lọc hoặc từ khóa tìm kiếm.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">{t('orders.orderCode')}</th>
                  <th className="py-3 px-4">{t('manager.customer')}</th>
                  <th className="py-3 px-4">{t('orders.technician')}</th>
                  <th className="py-3 px-4">{t('orders.servicePackage')}</th>
                  <th className="py-3 px-4">{t('orders.scheduledTime')}</th>
                  <th className="py-3 px-4">{t('orders.status')}</th>
                  <th className="py-3 px-4">{t('orders.payment')}</th>
                  <th className="py-3 px-4 text-right">{isEn ? 'Assignment / Action' : 'Phân công / Thao tác'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-orange-50/20 transition-colors">
                    {/* Code */}
                    <td className="py-3.5 px-4 font-mono font-bold">
                      <button
                        type="button"
                        onClick={() => openOrderDetail(order.id)}
                        className="text-primary hover:underline hover:text-primary-hover inline-flex items-center gap-1 group font-mono font-bold"
                        title={isEn ? 'View invoice & full details' : 'Xem hóa đơn & chi tiết đơn hàng'}
                      >
                        <span>{order.code}</span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
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
                        <span className="font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 inline-flex items-center gap-1">
                          <Wrench className="w-3 h-3 text-amber-600" />
                          {order.technician_name}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openAssignModal(order)}
                          className="text-xs text-orange-600 hover:text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200 font-semibold"
                        >
                          + {t('manager.assignTech')}
                        </button>
                      )}
                    </td>

                    {/* Package */}
                    <td className="py-3.5 px-4 font-medium text-gray-800">
                      {order.package_name}
                      <span className="text-[11px] text-gray-400 block">
                        {(order.final_amount ?? order.price ?? 0).toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? 'VND' : 'đ'}
                      </span>
                    </td>

                    {/* Date & Time */}
                    <td className="py-3.5 px-4 text-gray-600">
                      <span className="block font-medium">
                        {new Date(order.scheduled_date).toLocaleDateString(isEn ? 'en-US' : 'vi-VN')}
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
                        <option value="PENDING">{t('status.pending')}</option>
                        <option value="CONFIRMED">{t('status.confirmed')}</option>
                        <option value="IN_PROGRESS">{t('status.in_progress')}</option>
                        <option value="COMPLETED">{t('status.completed')}</option>
                        <option value="CANCELLED">{t('status.cancelled')}</option>
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
                        {order.payment_status === 'PAID' ? (isEn ? '✓ Paid' : '✓ Đã thu') : (isEn ? 'Unpaid' : 'Chưa thu')}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openOrderDetail(order.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition shadow-sm"
                          title={isEn ? 'View invoice & full details' : 'Xem chi tiết & hóa đơn'}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{isEn ? 'Invoice' : 'Hóa đơn'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openAssignModal(order)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>{order.technician_id ? t('manager.reassignTech') : t('manager.assignTech')}</span>
                        </button>
                      </div>
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
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-lg w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-gray-900 text-base">{isEn ? 'Dispatch Technician' : 'Điều phối Kỹ thuật viên'}</h3>
              </div>
              <button
                onClick={() => setAssignModalOrder(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Order summary info */}
              <div className="p-3.5 bg-orange-50/60 rounded-xl border border-orange-100 text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-orange-950 font-mono text-sm">#{assignModalOrder.code}</span>
                  <span className="text-gray-600 font-medium">
                    {new Date(assignModalOrder.scheduled_date).toLocaleDateString(isEn ? 'en-US' : 'vi-VN')} · {assignModalOrder.scheduled_start}
                  </span>
                </div>
                <div className="text-gray-700">
                  <strong>{isEn ? 'Customer:' : 'Khách hàng:'}</strong> {assignModalOrder.customer_name} ({assignModalOrder.customer_phone || (isEn ? 'No phone' : 'Không có SĐT')})
                </div>
                <div className="text-gray-700">
                  <strong>{isEn ? 'Service Package:' : 'Gói dịch vụ:'}</strong> {assignModalOrder.package_name}
                </div>
              </div>

              {/* Slot Candidate Technicians */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    {isEn ? 'Available Shift Technicians' : 'KTV trực ca khả dụng'} ({slotCandidates.length})
                  </label>
                  {slotCandidates.length > 1 && (
                    <button
                      type="button"
                      onClick={handleAutoPickCandidate}
                      className="text-xs font-semibold text-primary hover:text-orange-700 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200 transition flex items-center gap-1"
                      title={isEn ? "Randomly pick 1 on-duty technician" : "Chọn ngẫu nhiên 1 KTV trong ca"}
                    >
                      <Zap className="w-3 h-3" /> {isEn ? 'Auto-pick Tech' : 'Auto-pick KTV'}
                    </button>
                  )}
                </div>

                {candidatesLoading ? (
                  <div className="p-4 text-center text-xs text-gray-500 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-1" />
                    {isEn ? 'Searching for on-duty technicians...' : 'Đang tìm kiếm KTV trực ca này...'}
                  </div>
                ) : slotCandidates.length === 0 ? (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>
                      {isEn
                        ? `No technicians registered for shift ${assignModalOrder.scheduled_start} on ${new Date(assignModalOrder.scheduled_date).toLocaleDateString('en-US')}. You can assign any technician from the list below:`
                        : `Không có KTV nào đăng ký lịch trực trong ca ${assignModalOrder.scheduled_start} ngày ${new Date(assignModalOrder.scheduled_date).toLocaleDateString('vi-VN')}. Bạn có thể chỉ định KTV từ danh mục bên dưới:`}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {slotCandidates.map((cand) => (
                      <label
                        key={cand.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                          selectedTechId === cand.id
                            ? 'border-primary bg-orange-50/50 shadow-xs ring-1 ring-primary'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="candidate"
                          checked={selectedTechId === cand.id}
                          onChange={() => setSelectedTechId(cand.id)}
                          className="text-primary focus:ring-primary"
                        />
                        <Avatar name={cand.name} src={cand.avatar_url} size={36} />
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-xs text-gray-900 truncate">{cand.name}</div>
                          <div className="text-[11px] text-gray-500 truncate">{cand.email || cand.bio || (isEn ? 'IT Supporter Technician' : 'Kỹ thuật viên IT Supporter')}</div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {isEn ? 'Free shift' : 'Rảnh ca'}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* All technicians fallback selector */}
              <div className="pt-2 border-t border-gray-100">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                  {isEn ? 'Or pick any technician (Full directory)' : 'Hoặc chọn KTV bất kỳ (Tất cả danh sách)'}
                </label>
                <select
                  value={selectedTechId}
                  onChange={(e) => setSelectedTechId(e.target.value ? Number(e.target.value) : '')}
                  required
                  className="input text-xs w-full font-medium"
                >
                  <option value="">{isEn ? '-- Select technician --' : '-- Chọn kỹ thuật viên --'}</option>
                  {technicians.map((tItem) => (
                    <option key={tItem.id} value={tItem.id}>
                      {tItem.name} ({tItem.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setAssignModalOrder(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  {t('common.cancel', isEn ? 'Cancel' : 'Hủy')}
                </button>
                <button
                  type="submit"
                  disabled={assignLoading || !selectedTechId}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {assignLoading ? (isEn ? 'Assigning...' : 'Đang điều phối...') : (isEn ? 'Confirm Assignment' : 'Xác nhận phân công')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ORDER DETAIL & INVOICE MODAL (TRANSPARENCY & SETTLEMENT) */}
      {detailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 text-base">
                      {isEn ? 'Order Invoice & Full Details' : 'Hóa đơn & Chi tiết toàn bộ đơn hàng'}
                    </h3>
                    {selectedOrderDetail && (
                      <span className="font-mono text-xs font-bold text-primary bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md">
                        {selectedOrderDetail.code}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    IT Supporter • {isEn ? 'Full Transparency Service Invoice' : 'Chứng từ minh bạch dịch vụ'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDetailModalOpen(false);
                  setSelectedOrderDetail(null);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingDetail ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm text-gray-500 font-medium">
                    {isEn ? 'Loading invoice details...' : 'Đang tải hóa đơn chi tiết...'}
                  </p>
                </div>
              ) : selectedOrderDetail ? (
                <>
                  {/* Status Banner */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                        {isEn ? 'Status & Payment' : 'Trạng thái & Thanh toán'}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            selectedOrderDetail.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : selectedOrderDetail.status === 'IN_PROGRESS'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : selectedOrderDetail.status === 'CONFIRMED'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : selectedOrderDetail.status === 'CANCELLED'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          }`}
                        >
                          {selectedOrderDetail.status}
                        </span>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            selectedOrderDetail.payment_status === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-gray-100 text-gray-700 border-gray-200'
                          }`}
                        >
                          {selectedOrderDetail.payment_status === 'PAID'
                            ? (isEn ? '✓ Paid' : '✓ Đã thanh toán')
                            : (isEn ? 'Unpaid' : 'Chưa thu tiền')}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-semibold text-gray-500 block">
                        {isEn ? 'Scheduled Slot' : 'Lịch hẹn thực hiện'}
                      </span>
                      <span className="text-xs font-bold text-gray-800 flex items-center justify-end gap-1 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {selectedOrderDetail.scheduled_date} ({selectedOrderDetail.scheduled_start})
                      </span>
                    </div>
                  </div>

                  {/* Financial Invoice Breakdown */}
                  <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                        <h4 className="text-sm font-bold text-gray-900">
                          {isEn ? 'Financial Invoice Statement' : 'Bảng kê chi phí & Quyết toán'}
                        </h4>
                      </div>
                      <span className="text-xs text-gray-500 font-medium">
                        {selectedOrderDetail.payment_method || (isEn ? 'Standard' : 'Tiền mặt / Chuyển khoản')}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-600 font-medium">
                          {isEn ? 'Service Package:' : 'Gói dịch vụ:'} <strong>{selectedOrderDetail.package_name}</strong>
                        </span>
                        <span className="font-semibold text-gray-900">
                          {(selectedOrderDetail.package_price ?? selectedOrderDetail.price ?? 0).toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? 'VND' : 'đ'}
                        </span>
                      </div>

                      {Number(selectedOrderDetail.discount_amount) > 0 && (
                        <div className="flex justify-between items-center py-1 text-emerald-600">
                          <span className="flex items-center gap-1">
                            <Tag className="w-3.5 h-3.5" />
                            {isEn ? 'Discount / Voucher' : 'Giảm trừ khuyến mãi'}
                            {selectedOrderDetail.voucher_code ? ` (${selectedOrderDetail.voucher_code})` : ''}:
                          </span>
                          <span className="font-semibold">
                            -{Number(selectedOrderDetail.discount_amount).toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? 'VND' : 'đ'}
                          </span>
                        </div>
                      )}

                      {Number(selectedOrderDetail.penalty_amount) > 0 && (
                        <div className="flex justify-between items-center py-1 text-rose-600">
                          <span className="flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            {isEn ? 'Surcharge / Penalty fee:' : 'Phụ phí / Phạt phát sinh:'}
                          </span>
                          <span className="font-semibold">
                            +{Number(selectedOrderDetail.penalty_amount).toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? 'VND' : 'đ'}
                          </span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-sm font-bold">
                        <span className="text-gray-900">
                          {isEn ? 'Final Settlement Total:' : 'Tổng tiền quyết toán:'}
                        </span>
                        <span className="text-lg text-primary font-black">
                          {(selectedOrderDetail.final_amount ?? selectedOrderDetail.price ?? 0).toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? 'VND' : 'đ'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Device Condition & Customer Note */}
                  <div className="p-4 bg-amber-50/40 border border-amber-200/80 rounded-xl space-y-2">
                    <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                      {isEn ? 'Device Condition & Notes' : 'Tình trạng máy & Ghi chú khách hàng'}
                    </h4>
                    <div className="text-xs text-gray-800 bg-white p-3 rounded-lg border border-amber-100 whitespace-pre-wrap">
                      {selectedOrderDetail.note || (isEn ? 'No notes provided' : 'Không có ghi chú thêm.')}
                    </div>
                    {selectedOrderDetail.location && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 pt-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span><strong>{isEn ? 'Location:' : 'Địa chỉ phục vụ:'}</strong> {selectedOrderDetail.location}</span>
                      </div>
                    )}
                    {selectedOrderDetail.completion_notes && (
                      <div className="pt-2 border-t border-amber-100 text-xs">
                        <span className="font-bold text-gray-700 block mb-0.5">
                          {isEn ? 'Technician completion report:' : 'Báo cáo nghiệm thu của KTV:'}
                        </span>
                        <p className="text-gray-600 italic bg-white p-2.5 rounded-lg border border-gray-100">
                          {selectedOrderDetail.completion_notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Parties Information (Customer vs Technician) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Customer Info */}
                    <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50 space-y-2">
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                        {isEn ? 'Customer Information' : 'Thông tin Khách hàng'}
                      </span>
                      <div className="font-bold text-sm text-gray-900">{selectedOrderDetail.customer_name}</div>
                      <div className="space-y-1 text-xs text-gray-600">
                        {selectedOrderDetail.customer_phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            <a href={`tel:${selectedOrderDetail.customer_phone}`} className="text-primary hover:underline font-mono">
                              {selectedOrderDetail.customer_phone}
                            </a>
                          </div>
                        )}
                        {selectedOrderDetail.customer_email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                            <a href={`mailto:${selectedOrderDetail.customer_email}`} className="hover:underline">
                              {selectedOrderDetail.customer_email}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Technician Info */}
                    <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50 space-y-2">
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                        {isEn ? 'Assigned Technician' : 'Kỹ thuật viên phụ trách'}
                      </span>
                      {selectedOrderDetail.technician_name ? (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar name={selectedOrderDetail.technician_name} src={selectedOrderDetail.technician_avatar_url} size={32} />
                            <div>
                              <div className="font-bold text-sm text-gray-900">{selectedOrderDetail.technician_name}</div>
                              {selectedOrderDetail.technician_bio && (
                                <p className="text-[11px] text-gray-500 line-clamp-1">{selectedOrderDetail.technician_bio}</p>
                              )}
                            </div>
                          </div>
                          <div className="space-y-1 text-xs text-gray-600">
                            {selectedOrderDetail.technician_phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-3.5 h-3.5 text-gray-400" />
                                <a href={`tel:${selectedOrderDetail.technician_phone}`} className="text-primary hover:underline font-mono">
                                  {selectedOrderDetail.technician_phone}
                                </a>
                              </div>
                            )}
                            {selectedOrderDetail.technician_email && (
                              <div className="flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-gray-700">{selectedOrderDetail.technician_email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 py-3 italic">
                          {isEn ? 'No technician assigned yet' : 'Chưa được phân công KTV'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Timeline */}
                  {orderTimeline.length > 0 && (
                    <div className="p-4 border border-gray-200 rounded-xl space-y-3">
                      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-500" />
                        {isEn ? 'Order Event Timeline' : 'Nhật ký tiến trình thực hiện'}
                      </h4>
                      <OrderTimeline
                        timeline={orderTimeline}
                        createdAt={selectedOrderDetail.created_at}
                        orderStatus={selectedOrderDetail.status}
                        startedAt={selectedOrderDetail.started_at}
                        completedAt={selectedOrderDetail.completed_at}
                        completionResult={selectedOrderDetail.completion_result}
                      />
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-3.5 border-t border-gray-100 bg-gray-50/50">
              <span className="text-[11px] text-gray-400">
                IT Supporter Service Management v2.0
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition shadow-sm"
                >
                  {isEn ? 'Print / Export' : 'In / Lưu chứng từ'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDetailModalOpen(false);
                    setSelectedOrderDetail(null);
                  }}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl transition shadow-sm"
                >
                  {t('common.close', isEn ? 'Close' : 'Đóng')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}