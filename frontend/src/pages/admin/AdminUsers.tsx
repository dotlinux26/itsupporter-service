import { useEffect, useState } from 'react';
import { adminApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Search,
  Shield,
  UserX,
  KeyRound,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  Wrench,
  Briefcase,
} from 'lucide-react';
import { Avatar } from '../../components/Avatar';

interface UserRow {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: 'GUEST' | 'TECHNICIAN' | 'MANAGER' | 'ADMIN';
  status: 'ACTIVE' | 'DISABLED';
  avatar_url: string | null;
  contact_info: string | null;
  created_at: string;
  updated_at: string;
}

export function AdminUsers() {
  const { user: currentUser, refreshUser } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingRoleId, setUpdatingRoleId] = useState<number | null>(null);

  // Modals state
  const [resetModalUser, setResetModalUser] = useState<UserRow | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadUsers();
  }, [roleFilter, statusFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await adminApi.users({
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        q: searchQuery || undefined,
      });
      setUsers(response.data?.data || []);
    } catch (error: any) {
      console.error('Failed to load users:', error);
      showFeedback('error', 'Không thể tải danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers();
  };

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleRoleChange = async (userId: number, newRole: 'GUEST' | 'TECHNICIAN' | 'MANAGER' | 'ADMIN') => {
    setUpdatingRoleId(userId);
    try {
      await adminApi.updateUserRole(userId, newRole);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      if (currentUser && currentUser.id === userId) {
        await refreshUser();
      }
      showFeedback('success', `Đã cập nhật vai trò thành công.`);
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Cập nhật vai trò thất bại.');
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const handleStatusToggle = async (user: UserRow) => {
    const nextStatus = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    try {
      await adminApi.updateUserStatus(user.id, nextStatus);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u)));
      showFeedback('success', nextStatus === 'ACTIVE' ? 'Đã kích hoạt tài khoản.' : 'Đã vô hiệu hóa tài khoản.');
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Cập nhật trạng thái thất bại.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser) return;
    if (newPasswordInput.length < 8) {
      alert('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }
    setResetLoading(true);
    try {
      await adminApi.resetPassword(resetModalUser.id, newPasswordInput);
      showFeedback('success', `Đã đổi mật khẩu cho ${resetModalUser.name} thành công.`);
      setResetModalUser(null);
      setNewPasswordInput('');
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Đặt lại mật khẩu thất bại.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleDeleteUser = async (user: UserRow) => {
    if (user.role === 'ADMIN') {
      alert('Không thể xóa tài khoản Quản trị viên (Admin).');
      return;
    }
    if (!confirm(`Bạn có chắc chắn muốn xóa tài khoản "${user.name}" (${user.email})?`)) return;

    try {
      await adminApi.deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      showFeedback('success', `Đã xóa người dùng ${user.name}.`);
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Xóa người dùng thất bại.');
    }
  };

  // Quick stats calculation
  const totalCount = users.length;
  const techCount = users.filter((u) => u.role === 'TECHNICIAN').length;
  const guestCount = users.filter((u) => u.role === 'GUEST').length;
  const managerCount = users.filter((u) => u.role === 'MANAGER').length;
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;

  return (
    <div className="container py-5 sm:py-8 md:py-12 max-w-6xl mx-auto space-y-6 sm:space-y-8">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Users className="w-7 h-7 text-primary" />
            Quản lý người dùng hệ thống
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Phân quyền vai trò, quản lý trạng thái hoạt động và cấp lại mật khẩu tài khoản.
          </p>
        </div>

        <button
          onClick={() => loadUsers()}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm transition disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
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

      {/* QUICK STATS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-3.5 bg-white">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-gray-500 block font-medium">Tổng người dùng</span>
            <span className="text-xl font-bold text-gray-900">{totalCount}</span>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3.5 bg-white">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-gray-500 block font-medium">Kỹ thuật viên</span>
            <span className="text-xl font-bold text-amber-700">{techCount}</span>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3.5 bg-white">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-gray-500 block font-medium">Quản lý</span>
            <span className="text-xl font-bold text-blue-700">{managerCount}</span>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3.5 bg-white">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-gray-500 block font-medium">Admin / Khách</span>
            <span className="text-xl font-bold text-purple-700">{adminCount} / {guestCount}</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div className="card p-5 bg-white space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo họ tên, email hoặc số điện thoại..."
              className="input input-search pl-11 pr-4 text-sm w-full"
            />
          </div>

          {/* Role select */}
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-44">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="input text-xs font-semibold appearance-none pr-8 py-2.5"
              >
                <option value="">Tất cả vai trò</option>
                <option value="GUEST">👤 Khách hàng (Guest)</option>
                <option value="TECHNICIAN">🛠️ Kỹ thuật viên (Tech)</option>
                <option value="MANAGER">👔 Quản lý (Manager)</option>
                <option value="ADMIN">🛡️ Quản trị viên (Admin)</option>
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                ▼
              </div>
            </div>

            {/* Status select */}
            <div className="relative w-full sm:w-44">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input text-xs font-semibold appearance-none pr-8 py-2.5"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="ACTIVE">🟢 Đang hoạt động</option>
                <option value="DISABLED">🔴 Bị vô hiệu hóa</option>
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                ▼
              </div>
            </div>

            <button type="submit" className="btn btn-primary text-xs px-4 whitespace-nowrap">
              Tìm kiếm
            </button>
          </div>
        </form>
      </div>

      {/* USERS DATA TABLE */}
      <div className="card overflow-hidden bg-white">
        {loading ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-500">Đang tải dữ liệu người dùng...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <UserX className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="text-sm font-semibold text-gray-700">Không tìm thấy người dùng nào</p>
            <p className="text-xs text-gray-400">Hãy thử tìm kiếm từ khóa khác hoặc bỏ bộ lọc.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Người dùng</th>
                  <th className="py-3 px-4">Số điện thoại</th>
                  <th className="py-3 px-4">Vai trò (Role)</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4">Ngày tạo</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-orange-50/20 transition-colors">
                    {/* User info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={user.avatar_url}
                          name={user.name}
                          email={user.email}
                          size={36}
                        />
                        <div>
                          <span className="font-bold text-gray-900 block text-sm">{user.name}</span>
                          <span className="text-gray-500 font-mono text-[11px] block">{user.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="py-3.5 px-4 font-mono text-gray-600">
                      {user.phone || <span className="text-gray-300">-</span>}
                    </td>

                    {/* Role selector dropdown */}
                    <td className="py-3.5 px-4">
                      <div className="relative inline-block">
                        <select
                          value={user.role}
                          disabled={updatingRoleId === user.id}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg border cursor-pointer transition ${
                            user.role === 'ADMIN'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : user.role === 'MANAGER'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : user.role === 'TECHNICIAN'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-gray-50 text-gray-700 border-gray-200'
                          } ${updatingRoleId === user.id ? 'opacity-50 cursor-wait' : ''}`}
                        >
                          <option value="GUEST">Guest (Khách)</option>
                          <option value="TECHNICIAN">Technician (KTV)</option>
                          <option value="MANAGER">Manager (Quản lý)</option>
                          <option value="ADMIN">Admin (Quản trị)</option>
                        </select>
                      </div>
                    </td>

                    {/* Status badge */}
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleStatusToggle(user)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition ${
                          user.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                        title="Bấm để đổi trạng thái"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            user.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        {user.status === 'ACTIVE' ? 'Hoạt động' : 'Vô hiệu hóa'}
                      </button>
                    </td>

                    {/* Created date */}
                    <td className="py-3.5 px-4 text-gray-500 text-[11px]">
                      {new Date(user.created_at).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setResetModalUser(user);
                            setNewPasswordInput('');
                          }}
                          className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          title="Đặt lại mật khẩu"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>

                        {user.role !== 'ADMIN' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Xóa tài khoản"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RESET PASSWORD MODAL */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-sm w-full overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-gray-900 text-sm">Đặt lại mật khẩu</h3>
              </div>
              <button
                onClick={() => setResetModalUser(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-5 space-y-4">
              <div>
                <p className="text-xs text-gray-600 mb-2">
                  Đặt lại mật khẩu mới cho người dùng <strong className="text-gray-900">{resetModalUser.name}</strong> ({resetModalUser.email}).
                </p>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Mật khẩu mới
                </label>
                <input
                  type="text"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)..."
                  required
                  minLength={8}
                  className="input text-sm"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="btn btn-primary text-xs px-4"
                >
                  {resetLoading ? 'Đang lưu...' : 'Xác nhận đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}