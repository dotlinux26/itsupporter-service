import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  CheckCircle2,
  Clock,
  CalendarCheck,
  XCircle,
  FileText,
  UserCheck
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

function getStatusBadge(status: string) {
  switch (status.toUpperCase()) {
    case 'PENDING':
      return { label: 'Chờ xác nhận', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock };
    case 'CONFIRMED':
      return { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CalendarCheck };
    case 'IN_PROGRESS':
      return { label: 'Đang thực hiện', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: Clock };
    case 'COMPLETED':
      return { label: 'Hoàn thành', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle2 };
    case 'CANCELLED':
      return { label: 'Đã hủy', color: 'bg-rose-100 text-rose-800 border-rose-200', icon: XCircle };
    default:
      return { label: status, color: 'bg-slate-100 text-slate-800 border-slate-200', icon: FileText };
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
  return (
    <div className="space-y-4">
      {/* 1. Initial creation entry */}
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

      {/* 2. Detailed history logs if present */}
      {timeline && timeline.length > 0 ? (
        timeline.map((item, idx) => {
          const config = getStatusBadge(item.to_status);
          const IconComp = config.icon;
          const isLast = idx === timeline.length - 1;

          return (
            <div key={item.id || idx} className="flex items-start gap-3.5 relative">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-xs border ${config.color}`}>
                <IconComp className="w-4 h-4" />
              </div>
              <div className={`flex-1 ${!isLast ? 'border-l-2 border-slate-200 pb-4' : 'pb-1'} pl-4 -ml-7 mt-8`}>
                <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-sm">
                      {item.to_status === 'CONFIRMED'
                        ? 'Kỹ thuật viên tiếp nhận đơn'
                        : item.to_status === 'IN_PROGRESS'
                        ? 'Bắt đầu thực hiện công việc'
                        : item.to_status === 'COMPLETED'
                        ? 'Hoàn thành dịch vụ & kết toán'
                        : item.to_status === 'CANCELLED'
                        ? 'Đơn hàng bị hủy'
                        : `Chuyển trạng thái: ${item.to_status}`}
                    </span>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${config.color}`}>
                      {config.label}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">{formatTime(item.created_at)}</span>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  {item.changed_by_name && (
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span>Thực hiện bởi: <strong className="text-slate-700">{item.changed_by_name}</strong></span>
                    </div>
                  )}

                  {item.reason && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700 mt-1.5 inline-block text-xs">
                      {item.reason}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })
      ) : (
        /* Fallback if timeline array is not yet populated */
        <>
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
