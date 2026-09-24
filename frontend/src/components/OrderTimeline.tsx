import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  CheckCircle2,
  Clock,
  CalendarCheck,
  XCircle,
  FileText,
  UserCheck,
  Ticket,
  PlusCircle,
  AlertTriangle,
  DollarSign
} from 'lucide-react';
import type { OrderTimelineItem } from '../types';

interface OrderTimelineProps {
  timeline: OrderTimelineItem[];
  createdAt: string;
  orderStatus: string;
  startedAt?: string | null;
  completedAt?: string | null;
  completionResult?: string | null;
}

function formatTime(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    return format(new Date(dateStr), 'dd/MM/yyyy HH:mm:ss', { locale: vi });
  } catch {
    return dateStr;
  }
}

interface EventConfig {
  title: string;
  badgeLabel: string;
  badgeColor: string;
  icon: any;
  defaultDesc?: string;
}

function resolveTimelineEvent(item: OrderTimelineItem, index: number): EventConfig {
  const noteText = (item.note || item.reason || '').toLowerCase();

  // 1. Initial creation (first entry or from_status is null or to_status is PENDING with null from_status)
  if (index === 0 && (!item.from_status || item.to_status === 'PENDING')) {
    return {
      title: 'Đơn hàng được khởi tạo',
      badgeLabel: 'Chờ xác nhận',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: FileText,
      defaultDesc: 'Khách hàng đặt lịch dịch vụ thành công trên hệ thống',
    };
  }

  // 2. Action events occurring within the same status (e.g. from IN_PROGRESS to IN_PROGRESS)
  if (item.from_status && item.from_status === item.to_status) {
    if (noteText.includes('chương trình') || noteText.includes('voucher') || noteText.includes('giảm')) {
      return {
        title: 'Áp dụng ưu đãi / Khuyến mãi',
        badgeLabel: 'Ưu đãi',
        badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: Ticket,
      };
    }
    if (noteText.includes('phụ phí')) {
      return {
        title: 'Thêm phụ phí dịch vụ (100% KTV)',
        badgeLabel: 'Phụ phí',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        icon: PlusCircle,
      };
    }
    if (noteText.includes('phạt')) {
      return {
        title: 'Áp dụng giảm trừ vi phạm giờ hẹn',
        badgeLabel: 'Giảm trừ',
        badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
        icon: AlertTriangle,
      };
    }
    if (noteText.includes('thanh toán')) {
      return {
        title: 'Cập nhật trạng thái thu tiền',
        badgeLabel: 'Thanh toán',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: DollarSign,
      };
    }
    return {
      title: 'Cập nhật tiến trình dịch vụ',
      badgeLabel: 'Ghi nhận',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
      icon: FileText,
    };
  }

  // 3. Status transitions
  switch (item.to_status.toUpperCase()) {
    case 'CONFIRMED':
      return {
        title: 'Kỹ thuật viên tiếp nhận đơn',
        badgeLabel: 'Đã xác nhận',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: CalendarCheck,
        defaultDesc: 'Kỹ thuật viên đã nhận đơn và chuẩn bị hỗ trợ',
      };
    case 'IN_PROGRESS':
      return {
        title: 'Bắt đầu thực hiện công việc',
        badgeLabel: 'Đang thực hiện',
        badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: Clock,
        defaultDesc: 'Kỹ thuật viên bắt đầu xử lý thiết bị của khách hàng (Bật timer)',
      };
    case 'COMPLETED':
      return {
        title: 'Hoàn thành dịch vụ & kết toán',
        badgeLabel: 'Hoàn thành',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        icon: CheckCircle2,
        defaultDesc: 'Dịch vụ hoàn tất và kết toán tài chính vào sổ cái',
      };
    case 'CANCELLED':
      return {
        title: 'Đơn hàng bị hủy',
        badgeLabel: 'Đã hủy',
        badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
        icon: XCircle,
        defaultDesc: 'Đơn hàng đã kết thúc',
      };
    default:
      return {
        title: `Chuyển trạng thái: ${item.to_status}`,
        badgeLabel: item.to_status,
        badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
        icon: FileText,
      };
  }
}

export function OrderTimeline({
  timeline,
  createdAt,
  orderStatus,
  startedAt,
  completedAt,
  completionResult,
}: OrderTimelineProps) {
  // If timeline data from order_status_history is available, render each real audit log event
  const hasHistory = Array.isArray(timeline) && timeline.length > 0;

  return (
    <div className="space-y-4">
      {hasHistory ? (
        timeline.map((item, idx) => {
          const config = resolveTimelineEvent(item, idx);
          const IconComp = config.icon;
          const isLast = idx === timeline.length - 1;
          const noteContent = item.note || item.reason;
          const changedBy = item.changed_by_name;

          return (
            <div key={item.id || idx} className="flex items-start gap-3.5 relative">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-xs border ${config.badgeColor}`}>
                <IconComp className="w-4 h-4" />
              </div>
              <div className={`flex-1 ${!isLast ? 'border-l-2 border-slate-200 pb-4' : 'pb-1'} pl-4 -ml-7 mt-8`}>
                <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-sm">
                      {config.title}
                    </span>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${config.badgeColor}`}>
                      {config.badgeLabel}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">{formatTime(item.created_at)}</span>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  {changedBy && (
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span>Thực hiện bởi: <strong className="text-slate-700">{changedBy}</strong></span>
                    </div>
                  )}

                  {noteContent ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700 mt-1 inline-block text-xs">
                      {noteContent}
                    </div>
                  ) : config.defaultDesc ? (
                    <p className="text-slate-500">{config.defaultDesc}</p>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })
      ) : (
        /* Fallback if timeline array is not yet populated */
        <>
          <div className="flex items-start gap-3.5 relative">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-xs border border-blue-200">
              <FileText className="w-4 h-4" />
            </div>
            <div className="flex-1 pb-4 border-l-2 border-slate-200 pl-4 -ml-7 mt-8">
              <div className="flex flex-wrap items-center justify-between gap-1 mb-0.5">
                <span className="font-semibold text-slate-900 text-sm">Đơn hàng được khởi tạo</span>
                <span className="text-xs text-slate-500 font-mono">{formatTime(createdAt)}</span>
              </div>
              <p className="text-xs text-slate-600">Khách hàng đặt lịch dịch vụ thành công trên hệ thống</p>
            </div>
          </div>

          {orderStatus !== 'PENDING' && (
            <div className="flex items-start gap-3.5 relative">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <div className="flex-1 pb-4 border-l-2 border-slate-200 pl-4 -ml-7 mt-8">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 text-sm">Kỹ thuật viên đã nhận đơn</span>
                  <span className="text-xs text-slate-400 font-medium">Đã ghi nhận</span>
                </div>
                <p className="text-xs text-slate-600">Đơn hàng đã được xác nhận</p>
              </div>
            </div>
          )}

          {(orderStatus === 'IN_PROGRESS' || orderStatus === 'COMPLETED') && (
            <div className="flex items-start gap-3.5 relative">
              <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 border border-orange-200 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className={`flex-1 ${orderStatus === 'COMPLETED' ? 'border-l-2 border-slate-200 pb-4' : 'pb-1'} pl-4 -ml-7 mt-8`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 text-sm">Đang thực hiện dịch vụ</span>
                  <span className="text-xs text-slate-500 font-mono">{formatTime(startedAt)}</span>
                </div>
                <p className="text-xs text-slate-600">Kỹ thuật viên đang xử lý thiết bị của khách hàng</p>
              </div>
            </div>
          )}

          {orderStatus === 'COMPLETED' && (
            <div className="flex items-start gap-3.5 relative">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="flex-1 pb-1 pl-4 -ml-7 mt-8">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 text-sm">Hoàn thành & kết toán</span>
                  <span className="text-xs text-slate-500 font-mono">{formatTime(completedAt)}</span>
                </div>
                <p className="text-xs text-slate-600">
                  {completionResult === 'SUCCESS' ? 'Dịch vụ hoàn tất thành công' : 'Đơn hàng đã kết thúc'}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
