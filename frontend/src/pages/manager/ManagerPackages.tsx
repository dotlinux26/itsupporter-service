import { useEffect, useState } from 'react';
import { managerApi } from '../../api/client';

export function ManagerPackages() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const response = await managerApi.packages();
      setPackages(response.data.data);
    } catch (error) {
      console.error('Failed to load packages:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-10 md:py-12 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-text mb-6">Quản lý gói dịch vụ</h1>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1,2].map(i => <div key={i} className="card p-4 h-64 bg-gray-100 rounded" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {packages.map(pkg => (
            <div key={pkg.id} className="card p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-text">{pkg.name}</h3>
                <span className={`badge ${pkg.is_active ? 'badge-completed' : 'badge-cancelled'}`}>{pkg.is_active ? 'Hoạt động' : 'Tắt'}</span>
              </div>
              <p className="text-text-secondary mb-4">{pkg.description}</p>
              <ul className="space-y-2 mb-4">
                {pkg.features.split('\n').map((feature: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                    <svg className="w-4 h-4 text-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className="text-2xl font-bold text-primary">{pkg.price.toLocaleString('vi-VN')} VNĐ</span>
                <span className="text-sm text-text-secondary">{pkg.duration_minutes} phút</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}