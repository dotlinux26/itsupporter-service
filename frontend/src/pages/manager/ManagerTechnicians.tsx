import { useEffect, useState } from 'react';
import { managerApi } from '../../api/client';

export function ManagerTechnicians() {
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTechnicians();
  }, []);

  const loadTechnicians = async () => {
    try {
      const response = await managerApi.technicians();
      setTechnicians(response.data.data);
    } catch (error) {
      console.error('Failed to load technicians:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-10 md:py-12 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-text mb-6">Quản lý kỹ thuật viên</h1>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1,2,3].map(i => <div key={i} className="card p-4 h-20 bg-gray-100 rounded" />)}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-text-secondary border-b border-border">
                <th className="pb-2">ID</th>
                <th className="pb-2">Họ tên</th>
                <th className="pb-2">Email</th>
                <th className="pb-2">Số điện thoại</th>
                <th className="pb-2">Trạng thái</th>
                <th className="pb-2">Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {technicians.map(tech => (
                <tr key={tech.id} className="border-b border-border last:border-none hover:bg-gray-50">
                  <td className="py-3">{tech.id}</td>
                  <td className="font-medium">{tech.name}</td>
                  <td className="text-text-secondary">{tech.email}</td>
                  <td>{tech.phone || '-'}</td>
                  <td><span className={`badge ${tech.status === 'ACTIVE' ? 'badge-completed' : 'badge-cancelled'}`}>{tech.status === 'ACTIVE' ? 'Hoạt động' : 'Vô hiệu hóa'}</span></td>
                  <td className="text-text-secondary">{new Date(tech.created_at).toLocaleDateString('vi-VN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}