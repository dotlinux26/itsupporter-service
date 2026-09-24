import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationApi } from '../api/client';
import type { NotificationRecord } from '../types';
import {
  Bell,
  CheckCircle2,
  Calendar,
  MessageSquare,
  Ticket,
  AlertCircle,
  Info,
  Check,
} from 'lucide-react';

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return 'Vừa xong';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} giờ trước`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `${diffDay} ngày trước`;

    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  } catch {
    return dateString;
  }
}

function getNotificationIcon(type: string) {
  switch (type.toUpperCase()) {
    case 'ORDER_CREATED':
    case 'BOOKING':
      return <Calendar className="w-4 h-4 text-blue-600" />;
    case 'ORDER_CONFIRMED':
    case 'ORDER_COMPLETED':
      return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    case 'CHAT':
    case 'MESSAGE':
      return <MessageSquare className="w-4 h-4 text-purple-600" />;
    case 'VOUCHER':
    case 'PROMOTION':
      return <Ticket className="w-4 h-4 text-orange-600" />;
    case 'WARNING':
    case 'PENALTY':
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    default:
      return <Info className="w-4 h-4 text-slate-600" />;
  }
}

export function NotificationBell() {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = async () => {
    try {
      const res = await notificationApi.unreadCount();
      const count = res.data?.data?.count ?? res.data?.data?.unreadCount ?? (typeof res.data?.data === 'number' ? res.data.data : 0);
      setUnreadCount(Number(count) || 0);
    } catch {
      // Ignore background fetch error
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationApi.list({ limit: 15 });
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      setNotifications(list);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // 30s polling
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleItemClick = async (notif: NotificationRecord) => {
    if (notif.is_read === 0) {
      try {
        await notificationApi.markRead(notif.id);
        setNotifications((prev) =>
          prev.map((item) => (item.id === notif.id ? { ...item, is_read: 1 } : item))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark read:', err);
      }
    }

    setIsOpen(false);

    // Navigate to related order if order_id is present
    if (notif.order_id) {
      navigate(`/orders/${notif.order_id}`);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const unreadItems = notifications.filter((n) => n.is_read === 0);
      await Promise.all(unreadItems.map((n) => notificationApi.markRead(n.id)));
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* BELL BUTTON */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Thông báo"
        className="relative p-2 rounded-full text-slate-600 hover:text-orange-600 hover:bg-orange-50/80 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/20"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-black text-white bg-[#ff6b35] rounded-full ring-2 ring-white animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN POPOVER */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="px-4 py-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900">Thông báo</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-orange-100 text-orange-700 rounded-full">
                  {unreadCount} mới
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                Đã đọc tất cả
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {loading && notifications.length === 0 ? (
              <div className="p-6 text-center space-y-3">
                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400">Đang tải thông báo...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <Bell className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-800">Chưa có thông báo nào</p>
                <p className="text-xs text-slate-400 mt-1">
                  Khi có cập nhật đơn hàng hoặc tin nhắn mới, bạn sẽ nhận được thông báo tại đây.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 cursor-pointer transition-colors ${
                    item.is_read === 0 ? 'bg-orange-50/30' : ''
                  }`}
                >
                  <div className="p-2 rounded-xl bg-slate-100 shrink-0 mt-0.5">
                    {getNotificationIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p
                        className={`text-xs truncate ${
                          item.is_read === 0 ? 'font-bold text-slate-900' : 'font-medium text-slate-700'
                        }`}
                      >
                        {item.title}
                      </p>
                      <span className="text-[11px] text-slate-400 shrink-0 whitespace-nowrap">
                        {formatRelativeTime(item.created_at)}
                      </span>
                    </div>
                    {item.content && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {item.content}
                      </p>
                    )}
                  </div>
                  {item.is_read === 0 && (
                    <span className="w-2 h-2 rounded-full bg-[#ff6b35] shrink-0 mt-2" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
