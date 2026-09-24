import { useState, useEffect } from 'react';
import { voucherApi } from '../../api/client';
import { Ticket, Plus, Sparkles, Check, AlertCircle } from 'lucide-react';

interface VoucherProgramItem {
  id: number;
  code: string;
  name: string;
  description?: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  max_usage: number;
  valid_from?: string;
  valid_to?: string;
  is_active: number;
  created_at: string;
}

export function AdminVouchers() {
  const [programs, setPrograms] = useState<VoucherProgramItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [generateModalProgram, setGenerateModalProgram] = useState<VoucherProgramItem | null>(null);
  const [generateCount, setGenerateCount] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state for new program
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [validTo, setValidTo] = useState('');

  const loadPrograms = async () => {
    try {
      setLoading(true);
      const res = await voucherApi.programs();
      setPrograms(res.data.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi tải chương trình voucher';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrograms();
  }, []);

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      await voucherApi.createProgram({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim() || undefined,
        discount_type: discountType,
        discount_value: Number(discountValue),
        valid_to: validTo ? new Date(validTo).toISOString() : undefined,
      });
      setSuccess('Đã tạo chương trình voucher thành công!');
      setShowCreateModal(false);
      setCode('');
      setName('');
      setDescription('');
      loadPrograms();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tạo chương trình thất bại';
      setError(msg);
    }
  };

  const handleGenerateCodes = async () => {
    if (!generateModalProgram) return;
    try {
      setError(null);
      await voucherApi.generateCodes(generateModalProgram.id, generateCount);
      setSuccess(`Đã tạo thành công ${generateCount} mã voucher mới cho chương trình ${generateModalProgram.name}!`);
      setGenerateModalProgram(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tạo mã voucher thất bại';
      setError(msg);
    }
  };

  return (
    <div className="container py-10 md:py-12 max-w-5xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            <Ticket className="w-7 h-7 text-orange-600" />
            Quản lý chương trình Voucher & Giảm giá
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Thiết lập các chương trình khuyến mãi (5%, 10%, 15%, 20%, 30%, 50%, 100%) và phát hành mã voucher cho khách hàng.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary flex items-center gap-2 text-sm shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Tạo chương trình mới
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 flex items-center gap-2 text-sm border border-red-200">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-lg bg-green-50 text-green-700 flex items-center gap-2 text-sm border border-green-200">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : programs.length === 0 ? (
        <div className="card p-12 text-center text-text-secondary">
          <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-gray-700">Chưa có chương trình voucher nào</p>
          <p className="text-sm text-gray-500 mt-1">Nhấn nút bên trên để tạo chương trình giảm giá đầu tiên.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {programs.map((p) => (
            <div key={p.id} className="card p-5 border border-border hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-orange-100 text-orange-700">
                      {p.code}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {p.is_active ? 'Đang hoạt động' : 'Tạm dừng'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-text mt-2">{p.name}</h3>
                  <p className="text-sm text-text-secondary mt-1">{p.description || 'Không có mô tả'}</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-extrabold text-orange-600">
                    {p.discount_type === 'percent'
                      ? p.discount_value === 100
                        ? 'FREE 100%'
                        : `-${p.discount_value}%`
                      : `-${p.discount_value.toLocaleString('vi-VN')}đ`}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-text-muted">
                <div>
                  {p.valid_to ? `Hạn dùng: ${new Date(p.valid_to).toLocaleDateString('vi-VN')}` : 'Không thời hạn'}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setGenerateModalProgram(p)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded bg-orange-50 hover:bg-orange-100 text-orange-700 font-semibold transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Sinh mã batch
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Tạo chương trình mới */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
            <h2 className="text-xl font-bold text-text mb-4">Tạo chương trình Voucher / Giảm giá mới</h2>
            <form onSubmit={handleCreateProgram} className="space-y-4">
              <div>
                <label className="label">Mã chương trình (viết hoa liền không dấu)</label>
                <input
                  type="text"
                  required
                  placeholder="VD: WELCOME10, SALE20, TRIAN50"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="input font-mono"
                />
              </div>

              <div>
                <label className="label">Tên chương trình hiển thị</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Giảm 20% tri ân khách hàng mới"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Mô tả chi tiết</label>
                <textarea
                  rows={2}
                  placeholder="Áp dụng cho mọi dịch vụ vệ sinh bảo trì máy tính"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Hình thức giảm</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as 'percent' | 'fixed')}
                    className="input"
                  >
                    <option value="percent">Phần trăm (%)</option>
                    <option value="fixed">Số tiền cố định (VNĐ)</option>
                  </select>
                </div>

                <div>
                  <label className="label">Mức giảm</label>
                  {discountType === 'percent' ? (
                    <select
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                      className="input"
                    >
                      <option value={5}>5%</option>
                      <option value={10}>10%</option>
                      <option value={15}>15%</option>
                      <option value={20}>20%</option>
                      <option value={30}>30%</option>
                      <option value={50}>50%</option>
                      <option value={100}>100% (Làm FREE)</option>
                    </select>
                  ) : (
                    <input
                      type="number"
                      step={5000}
                      min={5000}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                      className="input"
                      placeholder="VD: 50000"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="label">Ngày hết hạn (tùy chọn)</label>
                <input
                  type="date"
                  value={validTo}
                  onChange={(e) => setValidTo(e.target.value)}
                  className="input"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-ghost"
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  Lưu chương trình
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Sinh mã batch */}
      {generateModalProgram && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <h2 className="text-xl font-bold text-text mb-2">Sinh mã Voucher hàng loạt</h2>
            <p className="text-sm text-text-secondary mb-4">
              Chương trình: <strong className="text-orange-600">{generateModalProgram.name}</strong>
            </p>

            <div className="space-y-4">
              <div>
                <label className="label">Số lượng mã cần tạo</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={generateCount}
                  onChange={(e) => setGenerateCount(Number(e.target.value))}
                  className="input"
                />
                <p className="text-xs text-text-muted mt-1">
                  Mỗi mã là duy nhất (dùng 1 lần gạch luôn trên hệ thống khi kỹ thuật viên xác nhận hoàn tất).
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setGenerateModalProgram(null)}
                  className="btn btn-ghost"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleGenerateCodes}
                  className="btn btn-primary flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  Tạo mã ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
