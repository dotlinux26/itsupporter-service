import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { managerApi } from '../../api/client';
import {
  FileSpreadsheet,
  FileText,
  Plus,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  X,
  Receipt,
  QrCode,
  CreditCard,
  Copy,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';

export function ManagerSettlements() {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');

  const [settlements, setSettlements] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTechId, setSelectedTechId] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [creating, setCreating] = useState(false);

  // Payment Info Modal state
  const [paymentModalItem, setPaymentModalItem] = useState<any | null>(null);
  const [copiedBank, setCopiedBank] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [settleRes, techRes] = await Promise.all([
        managerApi.settlements({ limit: 100, offset: 0 }),
        managerApi.technicians(),
      ]);
      const settleItems = Array.isArray(settleRes.data?.data)
        ? settleRes.data.data
        : Array.isArray(settleRes.data?.data?.data)
        ? settleRes.data.data.data
        : Array.isArray(settleRes.data)
        ? settleRes.data
        : [];
      setSettlements(settleItems);
      setTechnicians(techRes.data?.data || []);
    } catch (error) {
      console.error('Failed to load settlements:', error);
      showFeedback('error', isEn ? 'Failed to load settlements list.' : 'Không thể tải danh sách quyết toán.');
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleCreateSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTechId) return;

    setCreating(true);
    try {
      await managerApi.createSettlement(Number(selectedTechId), notes.trim() || undefined);
      showFeedback('success', isEn ? 'Settlement voucher created successfully.' : 'Đã tạo phiếu quyết toán hoa hồng thành công.');
      setModalOpen(false);
      setSelectedTechId('');
      setNotes('');
      loadData();
    } catch (err: any) {
      showFeedback(
        'error',
        err.response?.data?.message || err.response?.data?.error?.message || (isEn ? 'Failed to create settlement (Technician may have no pending balance).' : 'Tạo quyết toán thất bại (KTV có thể không có số dư khả dụng).')
      );
    } finally {
      setCreating(false);
    }
  };

  const handleExport = async (formatType: 'xlsx' | 'csv') => {
    try {
      setExporting(formatType);
      const res = await managerApi.exportReport({
        type: 'settlements',
        format: formatType,
      });
      const blob = new Blob([res.data], {
        type:
          formatType === 'xlsx'
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'text/csv;charset=utf-8;',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `settlements_${new Date().toISOString().slice(0, 10)}.${formatType}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showFeedback('success', isEn ? `Exported ${formatType.toUpperCase()} settlement file successfully!` : `Đã xuất file quyết toán ${formatType.toUpperCase()} thành công!`);
    } catch (err) {
      console.error('Export failed:', err);
      showFeedback('error', isEn ? 'Export failed. Please try again!' : 'Xuất quyết toán thất bại. Vui lòng thử lại!');
    } finally {
      setExporting(null);
    }
  };

  const safeSettlements = Array.isArray(settlements) ? settlements : [];
  const totalSettled = safeSettlements.reduce((acc, s) => acc + (s?.amount || 0), 0);

  return (
    <div className="container py-5 sm:py-8 md:py-12 max-w-6xl mx-auto space-y-6 sm:space-y-8">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Receipt className="w-7 h-7 text-primary" />
            {t('manager.settlementMgmtTitle')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('manager.settlementMgmtSubtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t('manager.createSettlement')}</span>
          </button>
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

      {/* TOTAL STATS BANNER */}
      <div className="card p-6 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <span className="text-xs text-orange-400 font-semibold uppercase tracking-wider">
            {isEn ? 'Total settled value' : 'Tổng giá trị đã quyết toán'}
          </span>
          <p className="text-3xl font-bold text-white">
            {(totalSettled || 0).toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? 'VND' : 'đ'}
          </p>
        </div>
        <div className="text-xs text-slate-400 text-center sm:text-right">
          <p>{isEn ? 'Disbursements count: ' : 'Số lần giải ngân: '}<strong className="text-white">{safeSettlements.length}</strong>{isEn ? ' batches' : ' đợt'}</p>
          <p>{isEn ? 'All transactions are automatically recorded in the ledger' : 'Tất cả giao dịch được ghi nhận tự động vào Sổ cái Ledger'}</p>
        </div>
      </div>

      {/* SETTLEMENTS TABLE */}
      <div className="card overflow-hidden bg-white">
        {loading ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-500">{isEn ? 'Loading settlement history...' : 'Đang tải lịch sử quyết toán...'}</p>
          </div>
        ) : safeSettlements.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Receipt className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="text-base font-semibold text-gray-700">{isEn ? 'No settlement vouchers yet' : 'Chưa có phiếu quyết toán nào'}</p>
            <p className="text-xs text-gray-400">
              {isEn ? 'Click "Create settlement voucher" when you need to pay commission to technicians.' : 'Bấm "Tạo phiếu quyết toán" khi cần chi trả hoa hồng cho kỹ thuật viên.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">{isEn ? 'Settlement Code' : 'Mã quyết toán'}</th>
                  <th className="py-3 px-4">{t('orders.technician')}</th>
                  <th className="py-3 px-4">{isEn ? 'Approver' : 'Người duyệt'}</th>
                  <th className="py-3 px-4">{isEn ? 'Settled Amount' : 'Số tiền kết toán'}</th>
                  <th className="py-3 px-4">{isEn ? 'Audit Notes' : 'Ghi chú đối soát'}</th>
                  <th className="py-3 px-4 text-center">{isEn ? 'Payment / QR' : 'Thông tin thanh toán'}</th>
                  <th className="py-3 px-4 text-right">{t('orders.dateTime')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {safeSettlements.map((s) => (
                  <tr key={s.id} className="hover:bg-orange-50/20 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-primary">
                      {s.settlement_code || `SETTLE-${s.id}`}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      {s.technician_name || (isEn ? `Tech #${s.technician_id}` : `KTV #${s.technician_id}`)}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">
                      {s.manager_name || (isEn ? `Manager #${s.manager_id}` : `Quản lý #${s.manager_id}`)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600 text-sm">
                      {(s.amount || 0).toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? 'VND' : 'đ'}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 max-w-xs truncate">
                      {s.notes || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => setPaymentModalItem(s)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition cursor-pointer"
                        title={isEn ? 'View Bank info & QR' : 'Xem thông tin STK & mã QR'}
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>{isEn ? 'Bank / QR' : 'STK & QR'}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-gray-400 text-right text-[11px]">
                      {s.created_at
                        ? format(new Date(s.created_at), 'dd/MM/yyyy HH:mm', { locale: isEn ? enUS : vi })
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* TECHNICIAN PAYMENT INFO POPUP MODAL */}
      {paymentModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-gray-900 text-base">
                  {isEn ? 'Technician Payout Details' : 'Thông tin chi trả hoa hồng KTV'}
                </h3>
              </div>
              <button
                onClick={() => setPaymentModalItem(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Voucher info summary */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-600">{isEn ? 'Technician:' : 'Kỹ thuật viên:'}</span>
                  <span className="font-bold text-gray-900 text-sm">{paymentModalItem.technician_name}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-600">{isEn ? 'Settlement Code:' : 'Mã phiếu:'}</span>
                  <span className="font-mono font-bold text-emerald-800">{paymentModalItem.settlement_code || `SETTLE-${paymentModalItem.id}`}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-emerald-200/60">
                  <span className="text-xs font-bold text-emerald-950 uppercase">{isEn ? 'Amount to transfer:' : 'Số tiền cần chuyển:'}</span>
                  <span className="text-lg font-black text-emerald-700">
                    {(paymentModalItem.amount || 0).toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? 'VND' : 'đ'}
                  </span>
                </div>
              </div>

              {/* Bank details text description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {isEn ? 'Bank Account Details (Text):' : 'Thông tin STK Ngân hàng (Mô tả):'}
                  </label>
                  {paymentModalItem.bank_info && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(paymentModalItem.bank_info);
                        setCopiedBank(true);
                        setTimeout(() => setCopiedBank(false), 2000);
                      }}
                      className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedBank ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedBank ? (isEn ? 'Copied' : 'Đã sao chép') : (isEn ? 'Copy' : 'Sao chép')}</span>
                    </button>
                  )}
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 whitespace-pre-wrap leading-relaxed select-all">
                  {paymentModalItem.bank_info || (
                    <span className="text-rose-500 italic">
                      {isEn ? 'Technician has not provided bank account text.' : 'KTV chưa cập nhật thông tin số tài khoản.'}
                    </span>
                  )}
                </div>
              </div>

              {/* Bank QR Image */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  {isEn ? 'Bank QR Code:' : 'Mã QR thanh toán ngân hàng:'}
                </label>
                {paymentModalItem.bank_qr_path ? (
                  <div className="p-3 bg-white border border-gray-200 rounded-2xl flex flex-col items-center justify-center space-y-2">
                    <img
                      src={paymentModalItem.bank_qr_path}
                      alt="Bank QR"
                      className="max-h-56 w-auto rounded-xl object-contain shadow-xs border border-gray-100"
                    />
                    <span className="text-[11px] text-gray-400">
                      {isEn ? 'Scan with banking app to transfer' : 'Quét bằng app ngân hàng để chuyển tiền'}
                    </span>
                  </div>
                ) : (
                  <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-gray-400">
                    <QrCode className="w-8 h-8 text-gray-300 mx-auto mb-1.5" />
                    <span>{isEn ? 'No QR code image uploaded by this technician.' : 'KTV chưa tải lên ảnh mã QR thanh toán.'}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setPaymentModalItem(null)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  {isEn ? 'Close' : 'Đóng'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE SETTLEMENT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-gray-900 text-base">{t('manager.createSettlementModalTitle')}</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSettlement} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  {isEn ? 'Select technician to pay' : 'Chọn kỹ thuật viên nhận thanh toán'} <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedTechId}
                  onChange={(e) => setSelectedTechId(e.target.value ? Number(e.target.value) : '')}
                  required
                  className="input text-sm w-full font-medium"
                >
                  <option value="">{isEn ? '-- Select technician --' : '-- Chọn kỹ thuật viên --'}</option>
                  {technicians.map((tItem) => (
                    <option key={tItem.id} value={tItem.id}>
                      {tItem.name} ({tItem.email})
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-gray-500 mt-1 block">
                  {isEn ? 'The system will automatically tally all pending eligible balances for this technician.' : 'Hệ thống sẽ tự động tổng hợp toàn bộ số dư khả dụng chưa quyết toán của KTV.'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  {t('manager.settlementNotes')} ({isEn ? 'Optional' : 'Tùy chọn'})
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="input text-sm resize-none"
                  placeholder={isEn ? "E.g.: Commission payout for shift week 3 of September 2026..." : "Ví dụ: Quyết toán hoa hồng ca trực tuần 3 tháng 9/2026..."}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  {t('common.cancel', isEn ? 'Cancel' : 'Hủy')}
                </button>
                <button
                  type="submit"
                  disabled={creating || !selectedTechId}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {creating ? (isEn ? 'Settling...' : 'Đang quyết toán...') : (isEn ? 'Confirm Settlement' : 'Xác nhận kết toán')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}