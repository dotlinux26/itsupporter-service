import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { voucherApi } from '../../api/client';
import {
  Ticket,
  Plus,
  Sparkles,
  Check,
  AlertCircle,
  Edit2,
  Trash2,
  ListFilter,
  X,
  Ban,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { format } from 'date-fns';

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

interface VoucherCodeItem {
  id: number;
  program_id: number;
  code: string;
  status: 'active' | 'used' | 'voided';
  customer_id?: number | null;
  order_id?: number | null;
  used_at?: string | null;
  created_at: string;
  expires_at?: string | null;
  customer_name?: string | null;
}

export function AdminVouchers() {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');

  const [programs, setPrograms] = useState<VoucherProgramItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [generateModalProgram, setGenerateModalProgram] = useState<VoucherProgramItem | null>(null);
  const [generateCount, setGenerateCount] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit Program state
  const [editingProgram, setEditingProgram] = useState<VoucherProgramItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIsActive, setEditIsActive] = useState(1);
  const [editValidTo, setEditValidTo] = useState('');
  const [updating, setUpdating] = useState(false);

  // Delete Program state
  const [deletingProgram, setDeletingProgram] = useState<VoucherProgramItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Codes View state
  const [viewCodesProgram, setViewCodesProgram] = useState<VoucherProgramItem | null>(null);
  const [programCodes, setProgramCodes] = useState<VoucherCodeItem[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [voidingId, setVoidingId] = useState<number | null>(null);

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
      const msg = err instanceof Error ? err.message : t('voucher.loadError');
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
      setSuccess(t('admin.programCreated', 'Đã tạo chương trình voucher thành công!'));
      setShowCreateModal(false);
      setCode('');
      setName('');
      setDescription('');
      loadPrograms();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('admin.programCreateFail', 'Tạo chương trình thất bại');
      setError(msg);
    }
  };

  const handleGenerateCodes = async () => {
    if (!generateModalProgram) return;
    try {
      setError(null);
      await voucherApi.generateCodes(generateModalProgram.id, generateCount);
      setSuccess(
        t('admin.codesGenerated', 'Đã tạo thành công {{count}} mã voucher mới cho chương trình {{name}}!', {
          count: generateCount,
          name: generateModalProgram.name,
        })
      );
      setGenerateModalProgram(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('admin.generateCodesFail', 'Tạo mã voucher thất bại');
      setError(msg);
    }
  };

  // Open Edit Program Modal
  const openEditModal = (p: VoucherProgramItem) => {
    setEditingProgram(p);
    setEditName(p.name);
    setEditDescription(p.description || '');
    setEditIsActive(p.is_active);
    setEditValidTo(p.valid_to ? p.valid_to.slice(0, 10) : '');
  };

  const handleUpdateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProgram) return;
    setUpdating(true);
    try {
      setError(null);
      await voucherApi.updateProgram(editingProgram.id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        is_active: editIsActive,
        valid_to: editValidTo ? new Date(editValidTo).toISOString() : undefined,
      });
      setSuccess(isEn ? 'Voucher program updated successfully!' : 'Đã cập nhật chương trình voucher thành công!');
      setEditingProgram(null);
      loadPrograms();
    } catch (err: any) {
      setError(err.response?.data?.message || (isEn ? 'Failed to update program.' : 'Cập nhật chương trình thất bại.'));
    } finally {
      setUpdating(false);
    }
  };

  // Handle Delete Program
  const handleDeleteProgram = async () => {
    if (!deletingProgram) return;
    setDeleting(true);
    try {
      setError(null);
      const res = await voucherApi.deleteProgram(deletingProgram.id);
      setSuccess(res.data?.message || (isEn ? 'Program processed successfully!' : 'Đã xử lý xóa/vô hiệu hóa chương trình thành công!'));
      setDeletingProgram(null);
      loadPrograms();
    } catch (err: any) {
      setError(err.response?.data?.message || (isEn ? 'Failed to delete program.' : 'Xóa chương trình thất bại.'));
    } finally {
      setDeleting(false);
    }
  };

  // Open Codes View Modal
  const openCodesModal = async (p: VoucherProgramItem) => {
    setViewCodesProgram(p);
    setLoadingCodes(true);
    setProgramCodes([]);
    try {
      const res = await voucherApi.programVouchers(p.id);
      setProgramCodes(res.data?.data || []);
    } catch (err: any) {
      console.error('Failed to load vouchers:', err);
      setError(err.response?.data?.message || (isEn ? 'Failed to load voucher codes.' : 'Không thể tải danh sách mã voucher.'));
    } finally {
      setLoadingCodes(false);
    }
  };

  // Void a single code
  const handleVoidCode = async (voucherId: number) => {
    if (!window.confirm(isEn ? 'Are you sure you want to void this voucher code?' : 'Bạn có chắc chắn muốn hủy (thu hồi) mã voucher này không?')) return;
    setVoidingId(voucherId);
    try {
      await voucherApi.voidVoucher(voucherId);
      setProgramCodes((prev) =>
        prev.map((c) => (c.id === voucherId ? { ...c, status: 'voided' } : c))
      );
      setSuccess(isEn ? 'Voucher code voided successfully.' : 'Đã hủy mã voucher thành công.');
    } catch (err: any) {
      setError(err.response?.data?.message || (isEn ? 'Failed to void voucher.' : 'Hủy mã voucher thất bại.'));
    } finally {
      setVoidingId(null);
    }
  };

  return (
    <div className="container py-5 sm:py-8 md:py-12 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Ticket className="w-7 h-7 text-orange-600" />
            {t('admin.voucherTitle', 'Quản lý Chương trình Voucher & Mã giảm giá')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('admin.voucherSubtitle', 'Cấu hình các chương trình ưu đãi, phát hành mã giảm giá, kiểm soát và thu hồi an toàn.')}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>{t('admin.createProgram', 'Tạo chương trình mới')}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 flex items-center justify-between gap-2 text-sm border border-red-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-between gap-2 text-sm border border-emerald-200">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : programs.length === 0 ? (
        <div className="card p-12 text-center text-gray-500">
          <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-gray-700">{t('admin.noPrograms', 'Chưa có chương trình voucher nào')}</p>
          <p className="text-sm text-gray-500 mt-1">{t('admin.noProgramsDesc', 'Nhấn nút bên trên để tạo chương trình giảm giá đầu tiên.')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {programs.map((p) => (
            <div key={p.id} className="card p-5 border border-gray-200 hover:shadow-md transition-shadow bg-white rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-orange-100 text-orange-700 border border-orange-200">
                        {p.code}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                          p.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {p.is_active ? t('admin.active', 'Đang áp dụng') : t('admin.inactive', 'Tạm dừng')}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mt-2">{p.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">{p.description || t('common.noDesc', 'Không có mô tả')}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xl font-extrabold text-orange-600">
                      {p.discount_type === 'percent'
                        ? p.discount_value === 100
                          ? 'FREE 100%'
                          : `-${p.discount_value}%`
                        : `-${p.discount_value.toLocaleString(isEn ? 'en-US' : 'vi-VN')}${isEn ? ' VND' : 'đ'}`}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {p.valid_to
                      ? `${t('admin.validTo', 'HSD')}: ${format(new Date(p.valid_to), 'dd/MM/yyyy')}`
                      : t('admin.noExpiration', 'Không giới hạn thời gian')}
                  </span>
                </div>
              </div>

              {/* Action buttons row */}
              <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openCodesModal(p)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition"
                    title={isEn ? 'View generated codes' : 'Xem danh sách mã đã sinh'}
                  >
                    <ListFilter className="w-3.5 h-3.5" />
                    <span>{isEn ? 'Codes List' : 'Xem mã'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGenerateModalProgram(p)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-semibold transition"
                    title={isEn ? 'Generate new batch' : 'Sinh thêm mã'}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isEn ? 'Batch Generate' : 'Sinh mã'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditModal(p)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition"
                    title={isEn ? 'Edit program' : 'Sửa thông tin chương trình'}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingProgram(p)}
                    className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition"
                    title={isEn ? 'Delete or deactivate program' : 'Xóa hoặc ngừng kích hoạt chương trình'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: TẠO CHƯƠNG TRÌNH MỚI */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h2 className="text-lg font-bold text-gray-900">{t('admin.createModalTitle', 'Tạo chương trình ưu đãi')}</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateProgram} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  {t('admin.programCode', 'Mã chương trình (Code prefix)')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: WELCOME10, SALE20"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="input font-mono w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  {t('admin.programName', 'Tên chương trình')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={isEn ? 'e.g. 20% off customer appreciation' : 'VD: Giảm 20% tri ân sinh viên'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  {t('admin.description', 'Mô tả chi tiết')} ({t('admin.optional', 'tùy chọn')})
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    {t('admin.discountType', 'Loại giảm giá')}
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as 'percent' | 'fixed')}
                    className="input w-full"
                  >
                    <option value="percent">{t('admin.percent', 'Theo phần trăm (%)')}</option>
                    <option value="fixed">{t('admin.fixedAmount', 'Số tiền cố định (VNĐ)')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    {t('admin.discountValue', 'Mức giảm')}
                  </label>
                  {discountType === 'percent' ? (
                    <select
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                      className="input w-full"
                    >
                      <option value={5}>5%</option>
                      <option value={10}>10%</option>
                      <option value={15}>15%</option>
                      <option value={20}>20%</option>
                      <option value={30}>30%</option>
                      <option value={50}>50%</option>
                      <option value={100}>100%</option>
                    </select>
                  ) : (
                    <input
                      type="number"
                      step={5000}
                      min={5000}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                      className="input w-full"
                      placeholder="50000"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  {t('admin.validTo', 'Hạn sử dụng')} ({t('admin.optional', 'tùy chọn')})
                </label>
                <input
                  type="date"
                  value={validTo}
                  onChange={(e) => setValidTo(e.target.value)}
                  className="input w-full"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  {t('common.cancel', 'Hủy')}
                </button>
                <button type="submit" className="px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-sm transition">
                  {t('common.save', 'Tạo chương trình')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CHỈNH SỬA CHƯƠNG TRÌNH (UPDATE) */}
      {editingProgram && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-primary" />
                <h2 className="text-base font-bold text-gray-900">
                  {isEn ? 'Edit Program' : 'Chỉnh sửa chương trình'}: <span className="font-mono text-primary">{editingProgram.code}</span>
                </h2>
              </div>
              <button onClick={() => setEditingProgram(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateProgram} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  {t('admin.programName', 'Tên chương trình')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  {t('admin.description', 'Mô tả chi tiết')}
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="input w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    {isEn ? 'Status' : 'Trạng thái hoạt động'}
                  </label>
                  <select
                    value={editIsActive}
                    onChange={(e) => setEditIsActive(Number(e.target.value))}
                    className="input w-full font-semibold"
                  >
                    <option value={1}>{isEn ? 'Active' : 'Đang kích hoạt'}</option>
                    <option value={0}>{isEn ? 'Inactive / Paused' : 'Tạm dừng (Ngừng áp dụng)'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    {t('admin.validTo', 'Hạn sử dụng')}
                  </label>
                  <input
                    type="date"
                    value={editValidTo}
                    onChange={(e) => setEditValidTo(e.target.value)}
                    className="input w-full"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingProgram(null)}
                  disabled={updating}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition disabled:opacity-50"
                >
                  {t('common.cancel', 'Hủy')}
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {updating && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{isEn ? 'Save Changes' : 'Lưu thay đổi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: XÓA CHƯƠNG TRÌNH (SAFE DELETE) */}
      {deletingProgram && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100 mb-3 text-rose-600">
              <div className="p-2 bg-rose-100 rounded-xl">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">
                  {isEn ? 'Delete Voucher Program' : 'Xác nhận xóa chương trình'}
                </h3>
                <span className="text-xs font-mono font-bold text-primary">#{deletingProgram.code} - {deletingProgram.name}</span>
              </div>
            </div>

            <div className="text-xs text-gray-600 leading-relaxed space-y-2 py-2">
              <p>
                {isEn
                  ? 'If any voucher from this program was already used in completed orders, the system will safely deactivate the program and void remaining unused vouchers to protect order and financial records.'
                  : 'Để đảm bảo toàn vẹn dữ liệu kế toán và lịch sử đơn hàng:'}
              </p>
              <ul className="list-disc list-inside bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900 space-y-1">
                <li>{isEn ? 'If vouchers were used in orders: Program will be paused and remaining active codes will be voided.' : 'Nếu đã có mã được dùng trong đơn hàng: Chương trình sẽ chuyển sang Tạm dừng và thu hồi các mã chưa dùng.'}</li>
                <li>{isEn ? 'If no vouchers were ever used: Program and all codes will be deleted completely.' : 'Nếu chưa từng có mã nào được sử dụng: Toàn bộ chương trình sẽ được xóa hoàn toàn.'}</li>
              </ul>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeletingProgram(null)}
                disabled={deleting}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition disabled:opacity-50"
              >
                {t('common.cancel', 'Hủy bỏ')}
              </button>
              <button
                type="button"
                onClick={handleDeleteProgram}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition disabled:opacity-50"
              >
                {deleting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <span>{isEn ? 'Confirm Safe Delete' : 'Xác nhận xóa an toàn'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: XEM DANH SÁCH MÃ & THU HỒI / HỦY MÃ */}
      {viewCodesProgram && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70">
              <div className="flex items-center gap-2.5">
                <ListFilter className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="font-bold text-gray-900 text-base">
                    {isEn ? 'Generated Voucher Codes' : 'Danh sách mã phát hành'}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {viewCodesProgram.name} (<span className="font-mono font-bold text-primary">{viewCodesProgram.code}</span>)
                  </span>
                </div>
              </div>
              <button onClick={() => setViewCodesProgram(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {loadingCodes ? (
                <div className="py-12 text-center">
                  <div className="w-7 h-7 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-gray-500 mt-2">{isEn ? 'Loading codes...' : 'Đang tải danh sách mã...'}</p>
                </div>
              ) : programCodes.length === 0 ? (
                <div className="py-12 text-center text-gray-400 space-y-2">
                  <Ticket className="w-10 h-10 mx-auto text-gray-300" />
                  <p className="text-sm font-semibold text-gray-600">{isEn ? 'No codes generated yet' : 'Chưa có mã voucher nào được sinh'}</p>
                  <p className="text-xs">{isEn ? 'Click "Batch Generate" to create voucher codes.' : 'Bấm "Sinh mã" để cấp phát mã cho chương trình này.'}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        <th className="py-2.5 px-3">{isEn ? 'Voucher Code' : 'Mã Voucher'}</th>
                        <th className="py-2.5 px-3">{isEn ? 'Status' : 'Trạng thái'}</th>
                        <th className="py-2.5 px-3">{isEn ? 'Order / Used' : 'Đơn hàng / Dùng'}</th>
                        <th className="py-2.5 px-3">{isEn ? 'Created At' : 'Ngày sinh'}</th>
                        <th className="py-2.5 px-3 text-right">{isEn ? 'Action' : 'Thao tác'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {programCodes.map((c) => (
                        <tr key={c.id} className="hover:bg-orange-50/20">
                          <td className="py-2.5 px-3 font-mono font-bold text-gray-900 select-all">
                            {c.code}
                          </td>
                          <td className="py-2.5 px-3">
                            {c.status === 'active' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                {isEn ? 'Active' : 'Chưa dùng'}
                              </span>
                            ) : c.status === 'used' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800">
                                <Clock className="w-3 h-3 text-blue-600" />
                                {isEn ? 'Used' : 'Đã dùng'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-gray-100 text-gray-600">
                                <Ban className="w-3 h-3 text-gray-400" />
                                {isEn ? 'Voided' : 'Đã hủy'}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-gray-600">
                            {c.order_id ? (
                              <span className="font-mono text-[11px] text-primary font-semibold">
                                #{c.order_id}
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-gray-400 text-[11px]">
                            {format(new Date(c.created_at), 'dd/MM/yyyy HH:mm')}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {c.status === 'active' ? (
                              <button
                                type="button"
                                onClick={() => handleVoidCode(c.id)}
                                disabled={voidingId === c.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition disabled:opacity-50"
                              >
                                <Ban className="w-3 h-3" />
                                <span>{voidingId === c.id ? (isEn ? 'Voiding...' : 'Đang hủy...') : (isEn ? 'Void' : 'Hủy mã')}</span>
                              </button>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {isEn ? 'Total codes: ' : 'Tổng số mã: '}<strong>{programCodes.length}</strong>
              </span>
              <button
                type="button"
                onClick={() => setViewCodesProgram(null)}
                className="px-4 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition shadow-xs"
              >
                {isEn ? 'Close' : 'Đóng'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: SINH MÃ BATCH */}
      {generateModalProgram && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h2 className="text-base font-bold text-gray-900 mb-1">{t('admin.generateModalTitle', 'Sinh mã voucher hàng loạt')}</h2>
            <p className="text-xs text-gray-500 mb-4">
              {t('admin.generateModalDesc', { name: generateModalProgram.name })}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  {t('admin.codeQuantity', 'Số lượng mã muốn sinh')}
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={generateCount}
                  onChange={(e) => setGenerateCount(Number(e.target.value))}
                  className="input w-full"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setGenerateModalProgram(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  {t('common.close', 'Đóng')}
                </button>
                <button
                  type="button"
                  onClick={handleGenerateCodes}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-sm transition"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{t('admin.generateCodes', 'Tạo mã ngay')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
