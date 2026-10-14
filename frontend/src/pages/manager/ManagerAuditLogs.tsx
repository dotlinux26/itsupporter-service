import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { managerApi } from '../../api/client';
import { Avatar } from '../../components/Avatar';
import type { AuditLogItem } from '../../types';
import {
  History,
  Search,
  RotateCw,
  FileCode,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';

export function ManagerAuditLogs() {
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');

  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('');
  const [actionCategory, setActionCategory] = useState('');

  // Metadata detail modal
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit,
      };
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      if (targetTypeFilter) {
        params.target_type = targetTypeFilter;
      }
      if (actionCategory) {
        params.action = actionCategory;
      }

      const res = await managerApi.auditLogs(params);
      const data = res.data?.data || [];
      const pagination = res.data?.pagination;
      setLogs(data);
      setTotal(pagination?.total || data.length);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page, limit, targetTypeFilter, actionCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadLogs();
  };

  const totalPages = Math.ceil(total / limit) || 1;

  // Render readable label & color badge for actions
  const getActionBadge = (action: string) => {
    switch (action) {
      case 'ORDER_ASSIGN_TECHNICIAN':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">Phân công KTV</span>;
      case 'ORDER_REASSIGN_TECHNICIAN':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Đổi KTV phụ trách</span>;
      case 'ORDER_STATUS_CHANGE':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Đổi trạng thái đơn</span>;
      case 'SETTLEMENT_CREATE':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Tạo phiếu quyết toán</span>;
      case 'SETTLEMENT_PAYOUT_STATUS_CHANGE':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">Đổi trạng thái chi trả</span>;
      case 'USER_ROLE_CHANGE':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Đổi vai trò người dùng</span>;
      case 'USER_STATUS_CHANGE':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-yellow-50 text-yellow-800 border border-yellow-200">Khóa / Mở tài khoản</span>;
      case 'USER_RESET_PASSWORD':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Đặt lại mật khẩu</span>;
      case 'USER_DELETE':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">Xóa tài khoản</span>;
      case 'VOUCHER_CREATE':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Tạo chương trình voucher</span>;
      case 'VOUCHER_UPDATE':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">Cập nhật voucher</span>;
      case 'VOUCHER_DELETE':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Xóa / Dừng voucher</span>;
      case 'VOUCHER_GENERATE':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200">Sinh mã voucher</span>;
      case 'VOUCHER_VOID':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Thu hồi mã voucher</span>;
      case 'SETTINGS_UPDATE':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">Cập nhật cấu hình</span>;
      case 'QR_UPLOAD':
      case 'QR_DELETE':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">Cập nhật QR Admin</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-gray-100 text-gray-700">{action}</span>;
    }
  };

  // Format short metadata summary
  const renderMetadataSnippet = (meta: Record<string, any> | null) => {
    if (!meta || Object.keys(meta).length === 0) return <span className="text-gray-400">-</span>;
    const parts: string[] = [];
    if (meta.order_code) parts.push(`Đơn #${meta.order_code}`);
    if (meta.from_status && meta.to_status) parts.push(`${meta.from_status} ➔ ${meta.to_status}`);
    if (meta.new_technician_name) parts.push(`KTV: ${meta.new_technician_name}`);
    if (meta.new_role) parts.push(`Role: ${meta.new_role}`);
    if (meta.new_status) parts.push(`Status: ${meta.new_status}`);
    if (meta.amount) parts.push(`${Number(meta.amount).toLocaleString('vi-VN')} đ`);
    if (meta.count) parts.push(`${meta.count} mã`);
    if (meta.keys) parts.push(`Keys: ${Array.isArray(meta.keys) ? meta.keys.join(', ') : meta.keys}`);
    if (parts.length === 0) {
      const keys = Object.keys(meta);
      return <span className="font-mono text-gray-500">{keys.slice(0, 2).map((k) => `${k}: ${meta[k]}`).join(', ')}</span>;
    }
    return <span>{parts.join(' • ')}</span>;
  };

  return (
    <div className="container py-5 sm:py-8 md:py-12 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <History className="w-7 h-7 text-primary" />
            <span>{isEn ? 'System Activity & Audit Logs' : 'Nhật ký hoạt động hệ thống (Audit Logs)'}</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isEn
              ? 'Complete traceable log of administrative operations: tech reassignments, order status, voucher RUD, user roles, settlements, and configs.'
              : 'Ghi nhận minh bạch toàn bộ thao tác của Ban Quản lý và Quản trị viên: phân công/đổi KTV, đổi trạng thái đơn, quyết toán, người dùng, mã giảm giá, cấu hình.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadLogs()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition shadow-xs disabled:opacity-50 self-start sm:self-auto cursor-pointer"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{isEn ? 'Refresh' : 'Làm mới'}</span>
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="card p-4 bg-white rounded-2xl border border-gray-200 space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isEn ? 'Search by actor name, email, target code, IP...' : 'Tìm theo tên, email người thực hiện, mã đơn, mã KTV, IP...'}
              className="input pl-9 text-xs w-full"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={targetTypeFilter}
              onChange={(e) => {
                setTargetTypeFilter(e.target.value);
                setPage(1);
              }}
              className="input text-xs w-full"
            >
              <option value="">{isEn ? '-- All Targets --' : '-- Tất cả loại đối tượng --'}</option>
              <option value="ORDER">Đơn hàng (ORDER)</option>
              <option value="USER">Người dùng (USER)</option>
              <option value="SETTLEMENT">Phiếu quyết toán (SETTLEMENT)</option>
              <option value="VOUCHER">Mã giảm giá (VOUCHER)</option>
              <option value="SETTINGS">Cài đặt hệ thống (SETTINGS)</option>
              <option value="QR">Mã QR (QR)</option>
            </select>
          </div>

          <div className="sm:col-span-3 flex gap-2">
            <select
              value={actionCategory}
              onChange={(e) => {
                setActionCategory(e.target.value);
                setPage(1);
              }}
              className="input text-xs flex-1"
            >
              <option value="">{isEn ? '-- All Actions --' : '-- Tất cả hành động --'}</option>
              <option value="ORDER_ASSIGN_TECHNICIAN">Phân công KTV</option>
              <option value="ORDER_REASSIGN_TECHNICIAN">Đổi KTV</option>
              <option value="ORDER_STATUS_CHANGE">Đổi trạng thái đơn</option>
              <option value="SETTLEMENT_PAYOUT_STATUS_CHANGE">Chi trả quyết toán</option>
              <option value="USER_ROLE_CHANGE">Đổi vai trò tài khoản</option>
              <option value="USER_STATUS_CHANGE">Khóa/Mở tài khoản</option>
              <option value="USER_RESET_PASSWORD">Đặt lại mật khẩu</option>
              <option value="USER_DELETE">Xóa người dùng</option>
              <option value="VOUCHER_CREATE">Tạo voucher</option>
              <option value="VOUCHER_VOID">Thu hồi voucher</option>
              <option value="SETTINGS_UPDATE">Cập nhật cấu hình</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              {isEn ? 'Filter' : 'Lọc'}
            </button>
          </div>
        </form>
      </div>

      {/* LOGS TABLE */}
      <div className="card overflow-hidden bg-white rounded-2xl border border-gray-200">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-gray-500">{isEn ? 'Loading audit records...' : 'Đang tải nhật ký kiểm toán...'}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center space-y-2 text-gray-400">
            <History className="w-12 h-12 mx-auto text-gray-300" />
            <p className="text-sm font-semibold text-gray-700">{isEn ? 'No activity logs found' : 'Không có nhật ký hoạt động nào phù hợp'}</p>
            <p className="text-xs">{isEn ? 'Try adjusting your search criteria.' : 'Thử xóa bộ lọc để xem toàn bộ lịch sử.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">{isEn ? 'Timestamp' : 'Thời gian'}</th>
                  <th className="py-3 px-4">{isEn ? 'Actor' : 'Người thực hiện'}</th>
                  <th className="py-3 px-4">{isEn ? 'Action' : 'Hành động'}</th>
                  <th className="py-3 px-4">{isEn ? 'Target' : 'Đối tượng'}</th>
                  <th className="py-3 px-4">{isEn ? 'Details Summary' : 'Tóm tắt nội dung'}</th>
                  <th className="py-3 px-4">{isEn ? 'IP Address' : 'Địa chỉ IP'}</th>
                  <th className="py-3 px-4 text-right">{isEn ? 'Metadata' : 'Chi tiết'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-orange-50/20 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap text-gray-500 font-mono text-[11px]">
                      {log.created_at
                        ? format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: isEn ? enUS : vi })
                        : '-'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Avatar name={log.actor_name || 'System'} src={log.actor_avatar} size={28} />
                        <div>
                          <div className="font-bold text-gray-900 leading-tight">
                            {log.actor_name || (isEn ? 'System / Auto' : 'Hệ thống')}
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            {log.actor_email || (isEn ? 'Internal' : 'Nội bộ')}
                          </div>
                        </div>
                        {log.actor_role && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                            log.actor_role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {log.actor_role}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                        {log.target_type} {log.target_id ? `#${log.target_id}` : ''}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 max-w-xs truncate text-[11px]">
                      {renderMetadataSnippet(log.metadata)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-gray-400 whitespace-nowrap">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition cursor-pointer shadow-2xs"
                      >
                        <FileCode className="w-3.5 h-3.5 text-primary" />
                        <span>{isEn ? 'Payload' : 'Xem JSON'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION BAR */}
        <div className="px-6 py-3.5 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <div>
            {isEn ? 'Showing ' : 'Hiển thị '}
            <strong>{logs.length}</strong> / <strong>{total}</strong> {isEn ? 'audit records' : 'hành động đã ghi'}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-gray-700 px-2">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* METADATA INSPECTION POPUP MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70">
              <div className="flex items-center gap-2.5">
                <FileCode className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="font-bold text-gray-900 text-base">
                    {isEn ? 'Audit Log Entry Details' : 'Chi tiết bản ghi kiểm toán'}
                  </h3>
                  <span className="text-xs text-gray-500 font-mono">
                    ID #{selectedLog.id} • {selectedLog.action}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <span className="text-gray-400 block text-[11px]">{isEn ? 'Actor' : 'Người thực hiện'}</span>
                  <span className="font-bold text-gray-800">{selectedLog.actor_name || 'Hệ thống'}</span>
                  <span className="block text-[11px] text-gray-500">{selectedLog.actor_email}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">{isEn ? 'Timestamp' : 'Thời điểm'}</span>
                  <span className="font-medium text-gray-800">
                    {selectedLog.created_at ? format(new Date(selectedLog.created_at), 'dd/MM/yyyy HH:mm:ss') : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">{isEn ? 'Target' : 'Đối tượng tác động'}</span>
                  <span className="font-mono font-bold text-primary">
                    {selectedLog.target_type} {selectedLog.target_id ? `#${selectedLog.target_id}` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">{isEn ? 'IP Address' : 'Địa chỉ IP'}</span>
                  <span className="font-mono text-gray-700">{selectedLog.ip_address || '127.0.0.1'}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  {isEn ? 'Recorded Metadata (JSON Payload):' : 'Dữ liệu ngữ cảnh Metadata đã lưu:'}
                </label>
                <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto leading-relaxed border border-slate-800">
                  {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-xs transition"
              >
                {isEn ? 'Close' : 'Đóng'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
