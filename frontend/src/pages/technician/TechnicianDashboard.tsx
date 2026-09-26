import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { technicianApi } from '../../api/client';
import type { OrderRow } from '../../types';
import { format } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import {
  Wallet,
  TrendingUp,
  Receipt,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Package,
  Wrench,
  ChevronRight,
  CalendarRange,
} from 'lucide-react';

export function TechnicianDashboard() {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');
  const dateLocale = isEn ? enUS : vi;
  const [currentOrders, setCurrentOrders] = useState<OrderRow[]>([]);
  const [pendingOrders, setPendingOrders] = useState<OrderRow[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  const [financeData, setFinanceData] = useState<{
    current_balance: number;
    total_earned: number;
    total_settled: number;
    settlements: any[];
    transactions: any[];
  }>({
    current_balance: 0,
    total_earned: 0,
    total_settled: 0,
    settlements: [],
    transactions: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const [allOrdersRes, schedRes, finRes] = await Promise.all([
        technicianApi.orders(),
        technicianApi.schedule(today),
        technicianApi.finance(),
      ]);

      const allOrders: any[] = allOrdersRes.data?.data || [];
      const pending = allOrders.filter((o) => o.status === 'PENDING');
      const inProgress = allOrders.filter((o) => o.status === 'IN_PROGRESS' || o.status === 'CONFIRMED');

      setPendingOrders(pending);
      setCurrentOrders(inProgress);
      setTodaySchedule(schedRes.data?.data || []);

      if (finRes.data?.data) {
        setFinanceData(finRes.data.data);
      }
    } catch (error) {
      console.error('Failed to load technician dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 sm:py-8 md:py-12 max-w-6xl mx-auto space-y-6 sm:space-y-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded-lg w-64"></div>
          <div className="h-4 bg-gray-100 rounded w-96"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-6 bg-white space-y-3 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-gray-100"></div>
              <div className="h-7 bg-gray-200 rounded w-32"></div>
              <div className="h-4 bg-gray-100 rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5 sm:py-8 md:py-12 max-w-6xl mx-auto space-y-6 sm:space-y-8">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Wrench className="w-7 h-7 text-primary" />
            {t('technician.workspaceTitle')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('technician.workspaceSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/technician/schedule"
            className="btn btn-primary text-xs font-semibold px-4 py-2.5 shadow-sm"
          >
            <CalendarRange className="w-4 h-4" />
            {t('technician.registerShiftBtn')}
          </Link>
          <Link
            to="/technician/orders"
            className="btn btn-outline text-xs font-semibold px-4 py-2.5"
          >
            <Package className="w-4 h-4" />
            {t('technician.allAssignedOrdersBtn')}
          </Link>
        </div>
      </div>

      {/* FINANCIAL METRICS (REAL LEDGER BALANCES) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Current Available Balance */}
        <div className="card p-6 bg-gradient-to-br from-orange-500/10 via-orange-50/50 to-white border-orange-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-bold shadow-md shadow-orange-500/20">
              <Wallet className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-800 bg-orange-100 px-2.5 py-1 rounded-full">
              {t('technician.availableBalanceBadge')}
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-semibold text-gray-500 block">{t('technician.pendingSettlementTitle')}</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-primary font-mono tracking-tight mt-1">
              {(financeData.current_balance || 0).toLocaleString(isEn ? 'en-US' : 'vi-VN')} <span className="text-base font-semibold">{isEn ? 'VND' : 'đ'}</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              {t('technician.pendingSettlementHint')}
            </p>
          </div>
        </div>

        {/* Total Earned */}
        <div className="card p-6 bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              {t('technician.totalCommissionBadge')}
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-semibold text-gray-500 block">{t('technician.totalEarnedTitle')}</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono tracking-tight mt-1">
              {(financeData.total_earned || 0).toLocaleString(isEn ? 'en-US' : 'vi-VN')} <span className="text-base font-semibold">{isEn ? 'VND' : 'đ'}</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              {t('technician.totalEarnedHint')}
            </p>
          </div>
        </div>

        {/* Total Settled */}
        <div className="card p-6 bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Receipt className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
              {t('technician.settledBadge')}
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-semibold text-gray-500 block">{t('technician.totalSettledTitle')}</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-mono tracking-tight mt-1">
              {(financeData.total_settled || 0).toLocaleString(isEn ? 'en-US' : 'vi-VN')} <span className="text-base font-semibold">{isEn ? 'VND' : 'đ'}</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              {t('technician.settledCountHint', { count: financeData.settlements?.length || 0 })}
            </p>
          </div>
        </div>
      </div>

      {/* TWO COLUMNS: ACTIVE ORDERS & SCHEDULE / TRANSACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CURRENT & PENDING ORDERS (2 COLS) */}
        <div className="lg:col-span-2 space-y-6">
          {/* In Progress Orders */}
          <div className="card bg-white border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-base">{t('technician.inProgressSectionTitle')}</h3>
              </div>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                {t('technician.shiftsCount', { count: currentOrders.length })}
              </span>
            </div>

            <div className="p-5">
              {currentOrders.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="text-xs font-semibold text-gray-600">{t('technician.noOngoingOrders')}</p>
                  <p className="text-[11px] text-gray-400">{t('technician.checkPendingPrompt')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentOrders.map((order) => (
                    <Link
                      key={order.id}
                      to={`/technician/orders/${order.id}`}
                      className="p-4 rounded-xl border border-gray-200 hover:border-primary hover:bg-orange-50/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold flex-shrink-0 group-hover:scale-105 transition-transform">
                          <Package className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-gray-900 group-hover:text-primary">
                              #{order.code}
                            </span>
                            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                              {order.status === 'CONFIRMED' ? t('status.confirmed') : t('status.in_progress')}
                            </span>
                          </div>
                          <div className="text-xs font-medium text-gray-800 mt-1">
                            {order.package_name} · <span className="text-gray-500">{order.customer_name}</span>
                          </div>
                          <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-1">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span>
                              {order.scheduled_date ? format(new Date(order.scheduled_date), 'dd/MM/yyyy', { locale: dateLocale }) : ''}{' '}
                              {order.scheduled_start}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <span className="text-xs font-bold text-primary inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          {t('technician.processAndDetail')} <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pending Confirmation Orders */}
          <div className="card bg-white border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-gray-900 text-base">{t('technician.pendingIntakeSectionTitle', { count: pendingOrders.length })}</h3>
              </div>
              <Link to="/technician/orders" className="text-xs font-semibold text-primary hover:underline">
                {t('technician.viewAll')}
              </Link>
            </div>

            <div className="p-5">
              {pendingOrders.length === 0 ? (
                <p className="text-center text-gray-400 py-6 text-xs">
                  {t('technician.noPendingOrders')}
                </p>
              ) : (
                <div className="space-y-3">
                  {pendingOrders.map((order) => (
                    <Link
                      key={order.id}
                      to={`/technician/orders/${order.id}`}
                      className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 hover:bg-amber-50 transition-all flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-gray-900">#{order.code}</span>
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                            {t('technician.waitingIntakeBadge')}
                          </span>
                        </div>
                        <div className="text-xs text-gray-700 mt-1">
                          {order.package_name} · {t('orders.customer')}: {order.customer_name}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          {order.scheduled_start} ({order.scheduled_date ? format(new Date(order.scheduled_date), 'dd/MM/yyyy', { locale: dateLocale }) : ''})
                        </div>
                      </div>

                      <span className="btn btn-primary text-xs px-3 py-1.5 font-semibold">
                        {t('technician.intakeNow')}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TODAY SCHEDULE & SETTLEMENTS (1 COL) */}
        <div className="space-y-6">
          {/* Today's Schedule */}
          <div className="card bg-white border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-gray-900 text-base">{t('technician.todayScheduleTitle')}</h3>
              </div>
              <span className="text-[11px] text-gray-500 font-medium font-mono">
                {format(new Date(), 'dd/MM/yyyy', { locale: dateLocale })}
              </span>
            </div>

            <div className="p-4">
              {todaySchedule.length === 0 ? (
                <div className="py-6 text-center space-y-1">
                  <p className="text-xs text-gray-600 font-medium">{t('technician.noScheduleToday')}</p>
                  <p className="text-[11px] text-gray-400">{t('technician.prepareToolsPrompt')}</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {todaySchedule.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-primary font-mono bg-white px-2 py-1 rounded-md border border-gray-200">
                          {item.scheduled_start}
                        </span>
                        <div>
                          <span className="font-bold text-gray-900 block">{item.customer_name}</span>
                          <span className="text-[11px] text-gray-500 block">{item.package_name}</span>
                        </div>
                      </div>
                      <Link
                        to={`/technician/orders/${item.id}`}
                        className="text-primary hover:underline font-semibold text-[11px]"
                      >
                        {t('common.view')}
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-gray-100 bg-gray-50/50 text-center">
              <Link to="/technician/schedule" className="text-xs font-semibold text-primary hover:underline">
                {t('technician.viewWholeWeekSchedule')}
              </Link>
            </div>
          </div>

          {/* Recent Settlements */}
          <div className="card bg-white border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-gray-900 text-base">{t('technician.settlementHistoryTitle')}</h3>
              </div>
            </div>

            <div className="p-4 divide-y divide-gray-100 text-xs">
              {financeData.settlements?.length === 0 ? (
                <p className="text-center text-gray-400 py-6">{t('technician.noSettlements')}</p>
              ) : (
                financeData.settlements.slice(0, 4).map((s: any) => (
                  <div key={s.id} className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
                    <div>
                      <span className="font-mono font-bold text-gray-800 block">#{s.settlement_code}</span>
                      <span className="text-[10px] text-gray-400 block">
                        {s.created_at ? format(new Date(s.created_at), 'dd/MM/yyyy HH:mm', { locale: dateLocale }) : ''}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold font-mono text-emerald-600 block">
                        +{Number(s.amount).toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? 'VND' : 'đ'}
                      </span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                        {t('technician.paidSettlementBadge')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}