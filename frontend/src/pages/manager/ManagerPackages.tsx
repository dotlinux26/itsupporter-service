import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { managerApi } from '../../api/client';
import {
  Package,
  Plus,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
} from 'lucide-react';

export function ManagerPackages() {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');

  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<any | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [durationMinutes, setDurationMinutes] = useState<number | ''>(60);
  const [features, setFeatures] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    setLoading(true);
    try {
      const response = await managerApi.packages();
      setPackages(response.data?.data || []);
    } catch (error) {
      console.error('Failed to load packages:', error);
      showFeedback('error', isEn ? 'Failed to load packages list.' : 'Không thể tải danh sách gói dịch vụ.');
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const openCreateModal = () => {
    setEditingPkg(null);
    setName('');
    setDescription('');
    setPrice('');
    setDurationMinutes(60);
    setFeatures('');
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (pkg: any) => {
    setEditingPkg(pkg);
    setName(pkg.name);
    setDescription(pkg.description || '');
    setPrice(pkg.price);
    setDurationMinutes(pkg.duration_minutes || 60);
    setFeatures(pkg.features || '');
    setIsActive(!!pkg.is_active);
    setModalOpen(true);
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || price === '') return;

    setSaving(true);
    try {
      if (editingPkg) {
        await managerApi.updatePackage(editingPkg.id, {
          name: name.trim(),
          description: description.trim(),
          price: Number(price),
          duration_minutes: Number(durationMinutes) || 60,
          features: features.trim(),
          is_active: isActive ? 1 : 0,
        });
        showFeedback('success', isEn ? `Updated package "${name}".` : `Đã cập nhật gói "${name}".`);
      } else {
        await managerApi.createPackage({
          name: name.trim(),
          description: description.trim(),
          price: Number(price),
          duration_minutes: Number(durationMinutes) || 60,
          features: features.trim(),
          is_active: isActive ? 1 : 0,
        });
        showFeedback('success', isEn ? `Created new service package.` : `Đã tạo gói dịch vụ mới.`);
      }
      setModalOpen(false);
      loadPackages();
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || (isEn ? 'Failed to save package.' : 'Lưu gói dịch vụ thất bại.'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (pkg: any) => {
    try {
      await managerApi.deletePackage(pkg.id);
      setPackages((prev) =>
        prev.map((p) => (p.id === pkg.id ? { ...p, is_active: p.is_active ? 0 : 1 } : p))
      );
      showFeedback('success', isEn ? `Updated status of package "${pkg.name}".` : `Đã đổi trạng thái gói "${pkg.name}".`);
    } catch (err: any) {
      showFeedback('error', isEn ? 'Failed to toggle package status.' : 'Đổi trạng thái thất bại.');
    }
  };

  return (
    <div className="container py-5 sm:py-8 md:py-12 max-w-6xl mx-auto space-y-6 sm:space-y-8">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-primary" />
            {t('manager.pkgTitle')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('manager.pkgSubtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-md transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t('manager.createPkg')}</span>
        </button>
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

      {/* PACKAGES GRID */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-6 h-64 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : packages.length === 0 ? (
        <div className="card p-12 text-center space-y-3 bg-white">
          <Package className="w-12 h-12 text-gray-300 mx-auto" />
          <p className="text-base font-semibold text-gray-700">{isEn ? 'No service packages yet' : 'Chưa có gói dịch vụ nào'}</p>
          <button onClick={openCreateModal} className="btn btn-primary text-xs px-4">
            {isEn ? '+ Create first package' : '+ Tạo gói dịch vụ đầu tiên'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`card p-6 flex flex-col justify-between transition-all bg-white hover:shadow-lg border ${
                pkg.is_active ? 'border-gray-200' : 'border-gray-200 opacity-60 bg-gray-50'
              }`}
            >
              <div className="space-y-4">
                {/* Title & Status */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
                      {isEn ? `Package #${pkg.id}` : `Gói #${pkg.id}`}
                    </span>
                    <h3 className="font-bold text-lg text-gray-900">{pkg.name}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(pkg)}
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold border transition ${
                      pkg.is_active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {pkg.is_active ? (isEn ? 'Active' : 'Đang mở') : (isEn ? 'Inactive' : 'Đã tắt')}
                  </button>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                  {pkg.description || (isEn ? 'No short description...' : 'Chưa có mô tả ngắn...')}
                </p>

                {/* Features list */}
                {pkg.features && (
                  <ul className="space-y-1.5 pt-2 border-t border-gray-100 text-xs text-gray-700">
                    {pkg.features.split('\n').map((feature: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold">✓</span>
                        <span className="line-clamp-1">{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Price & Actions */}
              <div className="pt-4 mt-6 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400 block font-medium">{isEn ? 'Price / Duration' : 'Đơn giá / Thời lượng'}</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-bold text-primary">
                      {(pkg.price || 0).toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? 'VND' : 'đ'}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">({pkg.duration_minutes}{isEn ? 'm' : 'p'})</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openEditModal(pkg)}
                  className="p-2 text-gray-600 hover:text-primary hover:bg-orange-50 rounded-xl border border-gray-200 transition"
                  title={isEn ? "Edit package" : "Chỉnh sửa gói"}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT PACKAGE MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-lg w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-gray-900 text-base">
                  {editingPkg ? (isEn ? 'Edit Service Package' : 'Chỉnh sửa gói dịch vụ') : (isEn ? 'Create Service Package' : 'Tạo gói dịch vụ mới')}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  {t('manager.pkgName')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isEn ? "E.g.: Gaming Laptop Cleaning & Thermal Repaste" : "Ví dụ: Vệ sinh & Tra keo tản nhiệt Laptop Gaming"}
                  required
                  className="input text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    {t('manager.pkgPrice')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')}
                    placeholder="150000"
                    min="0"
                    step="1000"
                    required
                    className="input text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    {t('manager.pkgDuration')}
                  </label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value ? Number(e.target.value) : '')}
                    placeholder="60"
                    min="15"
                    step="5"
                    className="input text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  {isEn ? 'Short description' : 'Mô tả ngắn gói dịch vụ'}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="input text-sm resize-none"
                  placeholder={isEn ? "Brief service summary for customers..." : "Mô tả tóm tắt dịch vụ cho khách hàng..."}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  {t('manager.pkgFeatures')}
                </label>
                <textarea
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  rows={4}
                  className="input text-xs font-mono leading-relaxed"
                  placeholder={isEn ? "Deep cleaning fan & exhaust vents\nHigh-grade thermal repaste\nCPU/GPU thermal stress test\n3-month paste warranty" : `Vệ sinh sạch quạt & khe tản nhiệt\nTra keo tản nhiệt chuyên dụng\nKiểm tra nhiệt độ CPU/GPU trước & sau\nBảo hành keo 3 tháng`}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="pkgActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 accent-primary rounded"
                />
                <label htmlFor="pkgActive" className="text-xs font-semibold text-gray-800 cursor-pointer">
                  {isEn ? 'Display publicly for customers to book' : 'Mở hiển thị công khai cho khách hàng đặt lịch'}
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  {t('common.cancel', isEn ? 'Cancel' : 'Hủy')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {saving ? (isEn ? 'Saving...' : 'Đang lưu...') : editingPkg ? (isEn ? 'Update' : 'Cập nhật') : (isEn ? 'Create' : 'Tạo mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}