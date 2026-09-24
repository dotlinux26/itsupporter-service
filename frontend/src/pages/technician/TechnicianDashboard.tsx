import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { technicianApi, orderApi } from '../../api/client';
import type { OrderRow } from '../../types';
import { format } from 'date-fns';

export function TechnicianDashboard() {
  const { t } = useTranslation();
  const [currentOrders, setCurrentOrders] = useState<OrderRow[]>([]);
  const [pendingOrders, setPendingOrders] = useState<OrderRow[]>([]);
  const [balance, setBalance] = useState({ earned: 0, settled: 0, current: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [_currentRes, _pendingRes, _notifRes] = await Promise.all([
        orderApi.listMy({ limit: 5, offset: 0 }),
        orderApi.listMy({ limit: 5, offset: 0 }),
        technicianApi.schedule(format(new Date(), 'yyyy-MM-dd')),
      ]);
      // Mock data for now
      setCurrentOrders([]);
      setPendingOrders([]);
      setBalance({ earned: 1000000, settled: 700000, current: 300000 });
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-10 md:py-12 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-6"><div className="h-4 bg-gray-200 rounded w-1/3"></div></div>
            <div className="card p-6"><div className="h-4 bg-gray-200 rounded w-1/3"></div></div>
            <div className="card p-6"><div className="h-4 bg-gray-200 rounded w-1/3"></div></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10 md:py-12 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-text">{t('technician.dashboard')}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <h3 className="text-text-secondary text-sm font-medium">{t('technician.balanceInfo')}</h3>
          <p className="text-3xl font-bold text-primary mt-2">{balance.current.toLocaleString('vi-VN')} VNĐ</p>
          <p className="text-sm text-text-muted mt-2">{t('technician.currentBalance')}</p>
        </div>
        <div className="card p-6">
          <h3 className="text-text-secondary text-sm font-medium">{t('technician.earned')}</h3>
          <p className="text-3xl font-bold text-success mt-2">{balance.earned.toLocaleString('vi-VN')} VNĐ</p>
        </div>
        <div className="card p-6">
          <h3 className="text-text-secondary text-sm font-medium">{t('technician.settled')}</h3>
          <p className="text-3xl font-bold text-text mt-2">{balance.settled.toLocaleString('vi-VN')} VNĐ</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-text">{t('technician.pendingOrders')}</h3>
            <Link to="/technician/orders" className="text-sm text-primary hover:underline">{t('common.view')}</Link>
          </div>
          <div className="p-4">
            {pendingOrders.length === 0 ? (
              <p className="text-center text-text-secondary py-8">{t('common.noData')}</p>
            ) : (
              <div className="space-y-3">
                {pendingOrders.slice(0, 3).map(order => (
                  <Link key={order.id} to={`/technician/orders/${order.id}`} className="card p-4 hover:shadow-md transition-shadow block">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-text">{order.code}</h4>
                        <p className="text-sm text-text-secondary">{order.package_name}</p>
                      </div>
                      <span className="badge badge-pending">{t('status.pending')}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <div className="p-4 border-t border-border">
              <Link to="/technician/orders" className="btn btn-outline w-full">{t('common.view')}</Link>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-text">{t('technician.currentOrders')}</h3>
            <Link to="/technician/orders" className="text-sm text-primary hover:underline">{t('common.view')}</Link>
          </div>
          <div className="p-4">
            {currentOrders.length === 0 ? (
              <p className="text-center text-text-secondary py-8">{t('common.noData')}</p>
            ) : (
              <div className="space-y-3">
                {currentOrders.slice(0, 3).map(order => (
                  <Link key={order.id} to={`/technician/orders/${order.id}`} className="card p-4 hover:shadow-md transition-shadow block">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-text">{order.code}</h4>
                        <p className="text-sm text-text-secondary">{order.package_name}</p>
                      </div>
                      <span className="badge badge-in_progress">{t('status.in_progress')}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <div className="p-4 border-t border-border">
              <Link to="/technician/orders" className="btn btn-outline w-full">{t('common.view')}</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-text">{t('technician.schedule')}</h3>
          <Link to="/technician/schedule" className="text-sm text-primary hover:underline">{t('common.view')}</Link>
        </div>
        <div className="p-4">
          <p className="text-center text-text-secondary py-8">Lịch làm việc hôm nay sẽ hiển thị ở đây</p>
        </div>
      </div>
    </div>
  );
}