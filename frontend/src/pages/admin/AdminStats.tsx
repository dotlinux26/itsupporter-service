import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { adminApi } from '../../api/client';

export function AdminStats() {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTechnicians: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await adminApi.stats();
      const d = response.data?.data || {};
      setStats({
        totalUsers: d.totalUsers ?? 0,
        totalTechnicians: d.totalTechnicians ?? 0,
        totalOrders: d.totalOrders ?? 0,
        totalRevenue: d.totalRevenue ?? d.revenue ?? 0,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 sm:py-8 md:py-12 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card p-6">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5 sm:py-8 md:py-12 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-text mb-6 sm:mb-8">{t('admin.systemStats')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <h3 className="text-text-secondary text-sm font-medium">{t('admin.totalUsers')}</h3>
          <p className="text-3xl font-bold text-text mt-2">{(stats.totalUsers ?? 0).toLocaleString(isEn ? 'en-US' : 'vi-VN')}</p>
        </div>
        <div className="card p-6">
          <h3 className="text-text-secondary text-sm font-medium">{t('admin.totalTechnicians')}</h3>
          <p className="text-3xl font-bold text-primary mt-2">{(stats.totalTechnicians ?? 0).toLocaleString(isEn ? 'en-US' : 'vi-VN')}</p>
        </div>
        <div className="card p-6">
          <h3 className="text-text-secondary text-sm font-medium">{t('admin.totalOrders')}</h3>
          <p className="text-3xl font-bold text-info mt-2">{(stats.totalOrders ?? 0).toLocaleString(isEn ? 'en-US' : 'vi-VN')}</p>
        </div>
        <div className="card p-6">
          <h3 className="text-text-secondary text-sm font-medium">{t('admin.totalRevenue')}</h3>
          <p className="text-3xl font-bold text-success mt-2">
            {(stats.totalRevenue ?? 0).toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? 'VND' : 'VNĐ'}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-text">{t('admin.chartStats')}</h3>
        </div>
        <div className="p-4">
          <p className="text-center text-text-secondary py-8">{t('admin.chartStatsDesc')}</p>
        </div>
      </div>
    </div>
  );
}