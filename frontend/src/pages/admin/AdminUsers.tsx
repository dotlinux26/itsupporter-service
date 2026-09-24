import { useEffect, useState } from 'react';
import { adminApi } from '../../api/client';

export function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [filters, setFilters] = useState({ role: '', status: '' });

  const loadUsers = async () => {
    try {
      const response = await adminApi.users(filters);
      setUsers(response.data.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [filters]);

  return (
    <div className="container py-10 md:py-12 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-text mb-6">Quản lý người dùng</h1>

      <div className="card p-4 mb-6">
        <div className="flex gap-4">
          <select value={filters.role} onChange={e => setFilters(prev => ({ ...prev, role: e.target.value }))} className="input w-auto">
            <option value="">Tất cả vai trò</option>
            <option value="GUEST">Guest</option>
            <option value="TECHNICIAN">Technician</option>
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
          </select>
          <select value={filters.status} onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))} className="input w-auto">
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="DISABLED">Vô hiệu hóa</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-text-secondary border-b border-border">
              <th className="pb-2">ID</th>
              <th className="pb-2">Họ tên</th>
              <th className="pb-2">Email</th>
              <th className="pb-2">Số điện thoại</th>
              <th className="pb-2">Vai trò</th>
              <th className="pb-2">Trạng thái</th>
              <th className="pb-2">Ngày tạo</th>
              <th className="pb-2">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b border-border last:border-none hover:bg-gray-50">
                <td className="py-3">{user.id}</td>
                <td className="font-medium">{user.name}</td>
                <td className="text-text-secondary">{user.email}</td>
                <td>{user.phone || '-'}</td>
                <td>
                  <select value={user.role} onChange={e => adminApi.updateUserRole(user.id, e.target.value as any)} className="input w-auto text-sm">
                    <option value="GUEST">Guest</option>
                    <option value="TECHNICIAN">Technician</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </td>
                <td>
                  <select value={user.status} onChange={e => adminApi.updateUserStatus(user.id, e.target.value as any)} className="input w-auto text-sm">
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="DISABLED">Vô hiệu hóa</option>
                  </select>
                </td>
                <td className="text-text-secondary">{new Date(user.created_at).toLocaleDateString('vi-VN')}</td>
                <td></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}