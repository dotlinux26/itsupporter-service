import { useEffect, useState } from 'react';
import { managerApi } from '../../api/client';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { FileSpreadsheet, FileText } from 'lucide-react';

export function ManagerSettlements() {
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    loadSettlements();
  }, []);

  const loadSettlements = async () => {
    try {
      const response = await managerApi.settlements({ limit: 50, offset: 0 });
      setSettlements(response.data.data);
    } catch (error) {
      console.error('Failed to load settlements:', error);
    } finally {
      setLoading(false);
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
        type: formatType === 'xlsx'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/csv;charset=utf-8;'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `settlements_${new Date().toISOString().slice(0, 10)}.${formatType}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Xuất quyết toán thất bại. Vui lòng thử lại!');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="container py-10 md:py-12 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Quản lý quyết toán</h1>
          <p className="text-sm text-text-secondary">Theo dõi đối soát thu chi và thanh toán hoa hồng cho kỹ thuật viên</p>
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

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1,2,3].map(i => <div key={i} className="card p-4 h-20 bg-gray-100 rounded" />)}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-text-secondary border-b border-border">
                <th className="pb-2">Mã quyết toán</th>
                <th className="pb-2">Kỹ thuật viên</th>
                <th className="pb-2">Quản lý</th>
                <th className="pb-2">Số tiền</th>
                <th className="pb-2">Ghi chú</th>
                <th className="pb-2">Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {settlements.map(settlement => (
                <tr key={settlement.id} className="border-b border-border last:border-none hover:bg-gray-50">
                  <td className="py-3 font-medium">{settlement.code}</td>
                  <td>{settlement.technician_name}</td>
                  <td>{settlement.manager_name}</td>
                  <td className="font-medium text-primary">{settlement.amount.toLocaleString('vi-VN')} VNĐ</td>
                  <td className="text-text-secondary">{settlement.notes || '-'}</td>
                  <td className="text-text-secondary">{format(new Date(settlement.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}