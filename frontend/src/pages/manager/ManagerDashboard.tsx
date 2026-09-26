import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { managerApi } from '../../api/client';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertCircle,
  Wrench,
  TrendingUp,
  Users,
  Package,
  Receipt,
  MessageSquare,
  ArrowRight,
  Wallet,
  Building2,
  FileSpreadsheet,
  Sparkles,
  BarChart3,
  Star,
  Award,
} from 'lucide-react';
import { Avatar } from '../../components/Avatar';
import { format } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';

interface AnalyticsData {
  summary: {
    total_revenue: number;
    team_fund_balance: number;
    total_technician_share: number;
    pending_settlements_total: number;
    total_orders: number;
    completed_orders: number;
    pending_orders: number;
    in_progress_orders: number;
    cancelled_orders: number;
  };
  revenue_by_date: Array<{
    date: string;
    revenue: number;
    order_count: number;
    team_share: number;
    tech_share: number;
  }>;
  package_stats: Array<{
    id: number;
    name: string;
    price: number;
    order_count: number;
    total_revenue: number;
  }>;
  top_technicians: Array<{
    id: number;
    name: string;
    email: string;
    avatar_url: string | null;
    current_balance: number;
    completed_jobs: number;
    generated_revenue: number;
    avg_rating: number;
    review_count: number;
  }>;
}

export function ManagerDashboard() {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language?.startsWith('en') ? enUS : vi;
  const isEn = i18n.language?.startsWith('en');

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [timeframeDays, setTimeframeDays] = useState<number>(14);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [timeframeDays]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, ordersRes, techsRes] = await Promise.all([
        managerApi.analytics({ days: timeframeDays }),
        managerApi.orders({}),
        managerApi.technicians(),
      ]);

      setAnalytics(analyticsRes.data?.data || null);
      setRecentOrders((ordersRes.data?.data || []).slice(0, 6));
      setTechnicians((techsRes.data?.data || []).slice(0, 6));
    } catch (error) {
      console.error('Failed to load manager dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type: 'orders' | 'settlements' | 'financial', fileFormat: 'xlsx' | 'csv') => {
    try {
      setExporting(`${type}-${fileFormat}`);
      const res = await managerApi.exportReport({
        type,
        format: fileFormat,
      });
      const blob = new Blob([res.data], {
        type:
          fileFormat === 'xlsx'
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'text/csv;charset=utf-8;',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${type}_${new Date().toISOString().slice(0, 10)}.${fileFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setExportFeedback(t('manager.exportSuccess', { type: type.toUpperCase(), format: fileFormat.toUpperCase() }));
      setTimeout(() => setExportFeedback(null), 4000);
    } catch (err) {
      console.error('Export failed:', err);
      setExportFeedback(t('manager.exportFail'));
      setTimeout(() => setExportFeedback(null), 4000);
    } finally {
      setExporting(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> {t('status.pending')}
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3 h-3" /> {t('status.confirmed')}
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse">
            <Wrench className="w-3 h-3" /> {t('status.in_progress')}
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> {t('status.completed')}
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3" /> {t('status.cancelled')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  // Calculate highest revenue in dateSeries for chart height scaling
  const maxRevenue = Math.max(
    ...(analytics?.revenue_by_date?.map((d) => d.revenue) || [100000]),
    100000
  );

  const summary = analytics?.summary || {
    total_revenue: 0,
    team_fund_balance: 0,
    total_technician_share: 0,
    pending_settlements_total: 0,
    total_orders: 0,
    completed_orders: 0,
    pending_orders: 0,
    in_progress_orders: 0,
    cancelled_orders: 0,
  };

  if (loading && !analytics) {
    return (
      <div className="container py-5 sm:py-8 md:py-12 max-w-6xl mx-auto space-y-6 sm:space-y-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded-lg w-64"></div>
          <div className="h-4 bg-gray-100 rounded w-96"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-5 bg-white space-y-3 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-gray-100"></div>
              <div className="h-6 bg-gray-200 rounded w-24"></div>
              <div className="h-4 bg-gray-100 rounded w-32"></div>
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
            <TrendingUp className="w-7 h-7 text-primary" />
            {t('manager.dashboardTitle')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('manager.dashboardSubtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/manager/orders"
            className="btn btn-primary text-xs font-semibold px-3.5 py-2.5 shadow-sm"
          >
            <ClipboardList className="w-4 h-4" />
            {t('manager.dispatchOrders')}
          </Link>
          <Link
            to="/manager/settlements"
            className="btn btn-outline text-xs font-semibold px-3.5 py-2.5"
          >
            <Receipt className="w-4 h-4" />
            {t('manager.techSettlements')}
          </Link>
        </div>
      </div>

      {/* EXPORT FEEDBACK TOAST */}
      {exportFeedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{exportFeedback}</span>
        </div>
      )}

      {/* 4 FINANCIAL KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Gross Revenue */}
        <div className="card p-5 bg-gradient-to-br from-orange-50/60 to-white border-orange-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold shadow-md shadow-orange-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-800 bg-orange-100 px-2 py-0.5 rounded-full">
              {t('manager.revenue')}
            </span>
          </div>
          <div className="mt-3">
            <span className="text-xs font-medium text-gray-500 block">{t('manager.totalGrossRevenue')}</span>
            <div className="text-2xl font-extrabold text-primary font-mono tracking-tight mt-0.5">
              {summary.total_revenue.toLocaleString(isEn ? 'en-US' : 'vi-VN')} <span className="text-sm font-semibold">{isEn ? 'VND' : 'đ'}</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              {t('manager.completedOrdersRatio', { completed: summary.completed_orders, total: summary.total_orders })}
            </p>
          </div>
        </div>

        {/* 2. Team Fund Balance */}
        <div className="card p-5 bg-gradient-to-br from-emerald-50/60 to-white border-emerald-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/20">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
              {t('manager.teamFund')}
            </span>
          </div>
          <div className="mt-3">
            <span className="text-xs font-medium text-gray-500 block">{t('manager.teamFundDesc')}</span>
            <div className="text-2xl font-extrabold text-emerald-700 font-mono tracking-tight mt-0.5">
              {summary.team_fund_balance.toLocaleString(isEn ? 'en-US' : 'vi-VN')} <span className="text-sm font-semibold">{isEn ? 'VND' : 'đ'}</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              {t('manager.teamFundUsage')}
            </p>
          </div>
        </div>

        {/* 3. Total Technician Share */}
        <div className="card p-5 bg-gradient-to-br from-blue-50/60 to-white border-blue-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-600/20">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full">
              {t('manager.commission70')}
            </span>
          </div>
          <div className="mt-3">
            <span className="text-xs font-medium text-gray-500 block">{t('manager.technicianShareDesc')}</span>
            <div className="text-2xl font-extrabold text-blue-700 font-mono tracking-tight mt-0.5">
              {summary.total_technician_share.toLocaleString(isEn ? 'en-US' : 'vi-VN')} <span className="text-sm font-semibold">{isEn ? 'VND' : 'đ'}</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              {t('manager.technicianShareUsage')}
            </p>
          </div>
        </div>

        {/* 4. Pending Settlements Total */}
        <div className="card p-5 bg-gradient-to-br from-purple-50/60 to-white border-purple-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-md shadow-purple-600/20">
              <Receipt className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full">
              {t('manager.pendingPayout')}
            </span>
          </div>
          <div className="mt-3">
            <span className="text-xs font-medium text-gray-500 block">{t('manager.pendingPayoutDesc')}</span>
            <div className="text-2xl font-extrabold text-purple-700 font-mono tracking-tight mt-0.5">
              {summary.pending_settlements_total.toLocaleString(isEn ? 'en-US' : 'vi-VN')} <span className="text-sm font-semibold">{isEn ? 'VND' : 'đ'}</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              {t('manager.pendingPayoutUsage')}
            </p>
          </div>
        </div>
      </div>

      {/* REVENUE TIMELINE CHART & PACKAGE DISTRIBUTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* REVENUE TIMELINE BAR CHART (2 COLS) */}
        <div className="lg:col-span-2 card bg-white border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                {t('manager.chartTitle')}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {t('manager.chartSubtitle')}
              </p>
            </div>

            {/* Timeframe Selector */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl self-start sm:self-auto text-xs font-semibold">
              <button
                onClick={() => setTimeframeDays(7)}
                className={`px-3 py-1 rounded-lg transition ${
                  timeframeDays === 7
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {t('manager.days7')}
              </button>
              <button
                onClick={() => setTimeframeDays(14)}
                className={`px-3 py-1 rounded-lg transition ${
                  timeframeDays === 14
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {t('manager.days14')}
              </button>
              <button
                onClick={() => setTimeframeDays(30)}
                className={`px-3 py-1 rounded-lg transition ${
                  timeframeDays === 30
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {t('manager.days30')}
              </button>
            </div>
          </div>

          {/* Visual Bar Chart */}
          <div className="space-y-2">
            <div className="h-56 flex items-end gap-1.5 sm:gap-2 pt-6 px-2 border-b border-gray-100">
              {analytics?.revenue_by_date?.map((item) => {
                const heightPercent = maxRevenue > 0 ? Math.max((item.revenue / maxRevenue) * 100, 6) : 6;
                const hasRev = item.revenue > 0;
                return (
                  <div key={item.date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-gray-900 text-white text-[10px] font-medium py-1 px-2 rounded-lg shadow-xl z-20 whitespace-nowrap">
                      <div className="font-bold text-amber-300">{format(new Date(item.date), 'dd/MM/yyyy', { locale: dateLocale })}</div>
                      <div>{t('manager.revenue')}: {item.revenue.toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? 'VND' : 'đ'}</div>
                      <div className="text-gray-300">({t('manager.completedOrdersRatio', { completed: item.order_count, total: item.order_count })})</div>
                    </div>

                    {/* Bar visual */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-lg transition-all duration-300 flex flex-col justify-end overflow-hidden ${
                        hasRev
                          ? 'bg-gradient-to-t from-orange-500 to-amber-400 group-hover:brightness-110 shadow-xs'
                          : 'bg-gray-100 group-hover:bg-gray-200'
                      }`}
                    >
                      {hasRev && heightPercent > 25 && (
                        <div className="text-[9px] text-white font-mono font-bold text-center pb-1 hidden sm:block">
                          {(item.revenue / 1000).toFixed(0)}k
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Date labels */}
            <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono px-1">
              <span>{analytics?.revenue_by_date?.[0] ? format(new Date(analytics.revenue_by_date[0].date), 'dd/MM', { locale: dateLocale }) : ''}</span>
              <span>{analytics?.revenue_by_date?.[Math.floor((analytics.revenue_by_date.length - 1) / 2)] ? format(new Date(analytics.revenue_by_date[Math.floor((analytics.revenue_by_date.length - 1) / 2)].date), 'dd/MM', { locale: dateLocale }) : ''}</span>
              <span>{analytics?.revenue_by_date?.[analytics.revenue_by_date.length - 1] ? format(new Date(analytics.revenue_by_date[analytics.revenue_by_date.length - 1].date), 'dd/MM', { locale: dateLocale }) : ''}</span>
            </div>
          </div>

          {/* Quick Export Toolbar inside Chart card */}
          <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-gray-600 font-semibold">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>{t('manager.exportToolbarTitle')}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExport('orders', 'xlsx')}
                disabled={!!exporting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-50 transition shadow-2xs disabled:opacity-50"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                {exporting === 'orders-xlsx' ? t('manager.exporting') : t('manager.exportOrdersExcel')}
              </button>
              <button
                onClick={() => handleExport('financial', 'xlsx')}
                disabled={!!exporting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary bg-white border border-orange-200 rounded-lg hover:bg-orange-50 transition shadow-2xs disabled:opacity-50"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-primary" />
                {exporting === 'financial-xlsx' ? t('manager.exporting') : t('manager.exportFinancialExcel')}
              </button>
            </div>
          </div>
        </div>

        {/* REVENUE BY PACKAGE BREAKDOWN (1 COL) */}
        <div className="card bg-white border border-gray-100 shadow-sm p-6 space-y-5 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              {t('manager.packageDistribution')}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {t('manager.packageDistributionSubtitle')}
            </p>

            <div className="space-y-4 mt-5">
              {analytics?.package_stats?.map((pkg) => {
                const percent =
                  summary.total_revenue > 0
                    ? Math.round((pkg.total_revenue / summary.total_revenue) * 100)
                    : 0;
                return (
                  <div key={pkg.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-gray-800">{pkg.name}</span>
                      <span className="font-mono font-bold text-primary">
                        {pkg.total_revenue.toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? 'VND' : 'đ'} ({percent}%)
                      </span>
                    </div>

                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        style={{ width: `${percent}%` }}
                        className="bg-primary h-full rounded-full transition-all duration-500"
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
                      <span>{t('manager.unitPrice', { price: `${pkg.price.toLocaleString(isEn ? 'en-US' : 'vi-VN')} ${isEn ? 'VND' : 'đ'}` })}</span>
                      <span>{t('manager.orderCountSuffix', { count: pkg.order_count })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 text-center">
            <Link to="/manager/packages" className="text-xs font-semibold text-primary hover:underline">
              {t('manager.managePackagesLink')}
            </Link>
          </div>
        </div>
      </div>

      {/* TECHNICIAN LEADERBOARD */}
      <div className="card bg-white border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-gray-900 text-base">{t('manager.techLeaderboard')}</h3>
          </div>
          <Link to="/manager/technicians" className="text-xs font-semibold text-primary hover:underline">
            {t('manager.viewAllTechs')}
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-5">{t('manager.techTeam')}</th>
                <th className="py-3 px-4 text-center">{t('manager.completedJobs')}</th>
                <th className="py-3 px-4 text-right">{t('manager.generatedRevenue')}</th>
                <th className="py-3 px-4 text-center">{t('manager.avgRating')}</th>
                <th className="py-3 px-4 text-right">{t('manager.pendingBalance')}</th>
                <th className="py-3 px-5 text-right">{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {analytics?.top_technicians?.map((tech, idx) => (
                <tr key={tech.id} className="hover:bg-orange-50/20 transition-colors">
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          idx === 0
                            ? 'bg-amber-100 text-amber-800'
                            : idx === 1
                            ? 'bg-slate-200 text-slate-800'
                            : 'bg-orange-50 text-orange-700'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <Avatar name={tech.name} src={tech.avatar_url} size={32} />
                      <div>
                        <span className="font-bold text-gray-900 block">{tech.name}</span>
                        <span className="text-[11px] text-gray-400 font-mono block">{tech.email}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-center font-bold text-gray-800">
                    {tech.completed_jobs} {isEn ? 'jobs' : 'ca'}
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono font-bold text-primary">
                    {tech.generated_revenue.toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? 'VND' : 'đ'}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                      {tech.avg_rating} ({tech.review_count})
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono font-bold text-purple-700">
                    {tech.current_balance.toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? 'VND' : 'đ'}
                  </td>

                  <td className="py-3.5 px-5 text-right">
                    <Link
                      to={`/manager/settlements`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
                    >
                      <Receipt className="w-3 h-3" /> {t('manager.settleNow')}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* QUICK ACTIONS SHORTCUTS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          to="/manager/orders"
          className="card p-4 bg-gradient-to-br from-orange-50/60 to-white hover:border-orange-300 transition-all flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ClipboardList className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-800 block">{t('manager.orders')}</span>
            <span className="text-[11px] text-gray-500">{t('manager.dispatchShortcutDesc')}</span>
          </div>
        </Link>

        <Link
          to="/manager/packages"
          className="card p-4 bg-gradient-to-br from-blue-50/60 to-white hover:border-blue-300 transition-all flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-800 block">{t('manager.packages')}</span>
            <span className="text-[11px] text-gray-500">{t('manager.packageShortcutDesc')}</span>
          </div>
        </Link>

        <Link
          to="/manager/settlements"
          className="card p-4 bg-gradient-to-br from-emerald-50/60 to-white hover:border-emerald-300 transition-all flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-800 block">{t('manager.settlements')}</span>
            <span className="text-[11px] text-gray-500">{t('manager.settlementShortcutDesc')}</span>
          </div>
        </Link>

        <Link
          to="/manager/reviews"
          className="card p-4 bg-gradient-to-br from-purple-50/60 to-white hover:border-purple-300 transition-all flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-800 block">{t('manager.reviews')}</span>
            <span className="text-[11px] text-gray-500">{t('manager.reviewShortcutDesc')}</span>
          </div>
        </Link>
      </div>

      {/* TWO COLUMNS: RECENT ORDERS & TECHNICIANS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RECENT ORDERS TABLE (2 COLS) */}
        <div className="lg:col-span-2 card bg-white border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-gray-900 text-base">{t('manager.recentOrders')}</h3>
              </div>
              <Link
                to="/manager/orders"
                className="text-xs font-semibold text-primary hover:text-primary-hover inline-flex items-center gap-1"
              >
                {t('manager.viewAllOrders', { count: summary.total_orders })} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3 px-5">{t('manager.orderCode')}</th>
                    <th className="py-3 px-4">{t('manager.customer')}</th>
                    <th className="py-3 px-4">{t('manager.assignedTech')}</th>
                    <th className="py-3 px-4">{t('admin.status')}</th>
                    <th className="py-3 px-5 text-right">{t('orders.time', 'Thời gian')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400">
                        {t('manager.noRecentOrders')}
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-orange-50/20 transition-colors">
                        <td className="py-3.5 px-5 font-bold font-mono text-gray-900">
                          <Link to="/manager/orders" className="hover:text-primary">
                            {order.code}
                          </Link>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-gray-800">
                          {order.customer_name || t('manager.walkInCustomer')}
                        </td>
                        <td className="py-3.5 px-4">
                          {order.technician_name ? (
                            <span className="text-gray-700 font-medium inline-flex items-center gap-1">
                              <Wrench className="w-3.5 h-3.5 text-orange-600" />
                              {order.technician_name}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">{t('manager.unassigned')}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">{getStatusBadge(order.status)}</td>
                        <td className="py-3.5 px-5 text-right text-gray-500 font-mono text-[11px]">
                          {order.scheduled_date
                            ? format(new Date(order.scheduled_date), 'dd/MM/yyyy', { locale: dateLocale })
                            : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50/50">
            <Link to="/manager/orders" className="btn btn-outline w-full text-xs font-semibold py-2">
              {t('manager.manageAllOrdersBtn')}
            </Link>
          </div>
        </div>

        {/* TECHNICIANS LIST (1 COL) */}
        <div className="card bg-white border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-base">{t('manager.techTeam')}</h3>
              </div>
              <Link
                to="/manager/technicians"
                className="text-xs font-semibold text-primary hover:text-primary-hover inline-flex items-center gap-1"
              >
                {t('manager.allTechCount', { count: technicians.length })} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-4 divide-y divide-gray-100">
              {technicians.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-xs">
                  {t('manager.noTechsFound')}
                </p>
              ) : (
                technicians.map((tech) => (
                  <div key={tech.id} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={tech.avatar_url}
                        name={tech.name}
                        email={tech.email}
                        size={36}
                      />
                      <div>
                        <span className="font-bold text-gray-900 text-xs block">{tech.name}</span>
                        <span className="text-[11px] text-gray-500 font-mono block">{tech.email}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          tech.status === 'ACTIVE' ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-rose-500 ring-4 ring-rose-100'
                        }`}
                        title={tech.status === 'ACTIVE' ? t('admin.active') : t('admin.inactive')}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50/50">
            <Link to="/manager/technicians" className="btn btn-outline w-full text-xs font-semibold py-2">
              {t('manager.viewTechTeamBtn')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}