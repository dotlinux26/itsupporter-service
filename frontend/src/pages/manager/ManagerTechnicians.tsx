import { useEffect, useState } from 'react';
import { managerApi, adminApi } from '../../api/client';
import {
  Wrench,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Phone,
  Mail,
  UserX,
  Calendar,
} from 'lucide-react';
import { Avatar } from '../../components/Avatar';

export function ManagerTechnicians() {
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadTechnicians();
  }, []);

  const loadTechnicians = async () => {
    setLoading(true);
    try {
      const response = await managerApi.technicians();
      setTechnicians(response.data?.data || []);
    } catch (error) {
      console.error('Failed to load technicians:', error);
      showFeedback('error', 'Không thể tải danh sách kỹ thuật viên.');
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleStatusToggle = async (tech: any) => {
    const nextStatus = tech.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    try {
      await adminApi.updateUserStatus(tech.id, nextStatus);
      setTechnicians((prev) =>
        prev.map((t) => (t.id === tech.id ? { ...t, status: nextStatus } : t))
      );
      showFeedback('success', `Đã cập nhật trạng thái của ${tech.name}.`);
    } catch (err: any) {
      showFeedback('error', 'Cập nhật trạng thái thất bại.');
    }
  };

  const filteredTechnicians = technicians.filter((t) => {
    if (statusFilter && t.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.name?.toLowerCase().includes(q) ||
        t.email?.toLowerCase().includes(q) ||
        t.phone?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeCount = technicians.filter((t) => t.status === 'ACTIVE').length;

  return (
    <div className="container py-10 md:py-12 max-w-6xl mx-auto space-y-8">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Wrench className="w-7 h-7 text-primary" />
            Đội ngũ Kỹ thuật viên HaUI
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý danh sách sinh viên kỹ thuật trực tiếp nhận máy và hỗ trợ bảo dưỡng.
          </p>
        </div>

        <div className="card px-5 py-3 bg-amber-50/60 border-amber-200 flex items-center gap-3 self-start sm:self-auto">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-amber-800 font-semibold block">Đang hoạt động</span>
            <span className="text-xl font-bold text-amber-900">
              {activeCount} / {technicians.length} KTV
            </span>
          </div>
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

      {/* FILTER & SEARCH */}
      <div className="card p-5 bg-white flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo tên KTV, email hoặc số điện thoại..."
            className="input input-search pl-11 pr-4 text-xs font-medium w-full"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input text-xs font-medium w-full sm:w-44"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">🟢 Đang hoạt động</option>
            <option value="DISABLED">🔴 Tạm ngưng</option>
          </select>

          {(statusFilter || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter('');
                setSearchQuery('');
              }}
              className="btn btn-outline text-xs px-3 whitespace-nowrap"
            >
              Xóa lọc
            </button>
          )}
        </div>
      </div>

      {/* TECHNICIANS GRID */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-6 h-48 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredTechnicians.length === 0 ? (
        <div className="card p-12 text-center space-y-3 bg-white">
          <UserX className="w-12 h-12 text-gray-300 mx-auto" />
          <p className="text-base font-semibold text-gray-700">Không tìm thấy kỹ thuật viên nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTechnicians.map((tech) => (
            <div
              key={tech.id}
              className={`card p-6 flex flex-col justify-between transition-all bg-white hover:shadow-lg border ${
                tech.status === 'ACTIVE' ? 'border-gray-200' : 'border-gray-200 opacity-60 bg-gray-50'
              }`}
            >
              <div className="space-y-4">
                {/* Header info */}
                <div className="flex items-start gap-4">
                  <Avatar
                    src={tech.avatar_url}
                    name={tech.name}
                    email={tech.email}
                    size={56}
                  />
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-base text-gray-900">{tech.name}</h3>
                      <button
                        type="button"
                        onClick={() => handleStatusToggle(tech)}
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold border transition ${
                          tech.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        {tech.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm dừng'}
                      </button>
                    </div>
                    <span className="text-xs text-amber-700 font-medium block">
                      🛠️ Kỹ thuật viên HaUI #{tech.id}
                    </span>
                  </div>
                </div>

                {/* Contact details */}
                <div className="space-y-2 pt-3 border-t border-gray-100 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-mono text-gray-800">{tech.email}</span>
                  </div>
                  {tech.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-mono text-gray-800">{tech.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-400 text-[11px]">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Tham gia: {new Date(tech.created_at).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}