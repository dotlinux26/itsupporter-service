import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { technicianApi } from '../../api/client';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Save,
  Send,
  Sun,
  Sunset,
  Zap,
  Info,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';

interface ShiftItem {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean | number;
}

const DAY_NAMES: Record<number, string> = {
  1: 'Thứ Hai',
  2: 'Thứ Ba',
  3: 'Thứ Tư',
  4: 'Thứ Năm',
  5: 'Thứ Sáu',
  6: 'Thứ Bảy',
  7: 'Chủ Nhật',
};

const TIME_OPTIONS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
];

export function TechnicianSchedule() {
  const [activeTab, setActiveTab] = useState<'weekly' | 'orders'>('weekly');

  // Weekly shift state
  const [shifts, setShifts] = useState<ShiftItem[]>([]);
  const [shiftsLoading, setShiftsLoading] = useState(true);
  const [savingShifts, setSavingShifts] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Daily orders state
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [dailyOrders, setDailyOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    loadShifts();
  }, []);

  useEffect(() => {
    if (activeTab === 'orders') {
      loadDailyOrders(selectedDate);
    }
  }, [activeTab, selectedDate]);

  const loadShifts = async () => {
    setShiftsLoading(true);
    try {
      const res = await technicianApi.getShifts();
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      if (list.length > 0) {
        setShifts(list.map((s: any) => ({ ...s, is_active: !!s.is_active })));
      } else {
        // Default template: Mon-Sat active 07:00-19:00, Sun off
        setShifts(
          [1, 2, 3, 4, 5, 6, 7].map((dow) => ({
            day_of_week: dow,
            start_time: '07:00',
            end_time: '19:00',
            is_active: dow <= 6,
          }))
        );
      }
    } catch (err) {
      console.error('Failed to load shifts:', err);
      showFeedback('error', 'Không thể tải cấu hình ca trực.');
    } finally {
      setShiftsLoading(false);
    }
  };

  const loadDailyOrders = async (dateStr: string) => {
    setOrdersLoading(true);
    try {
      const res = await technicianApi.schedule(dateStr);
      setDailyOrders(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.error('Failed to load daily orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleToggleDay = (dow: number) => {
    setShifts((prev) =>
      prev.map((s) => (s.day_of_week === dow ? { ...s, is_active: !s.is_active } : s))
    );
  };

  const handleTimeChange = (dow: number, field: 'start_time' | 'end_time', value: string) => {
    setShifts((prev) =>
      prev.map((s) => (s.day_of_week === dow ? { ...s, [field]: value } : s))
    );
  };

  const applyPreset = (dow: number, preset: 'morning' | 'afternoon' | 'fullday') => {
    setShifts((prev) =>
      prev.map((s) => {
        if (s.day_of_week !== dow) return s;
        if (preset === 'morning') return { ...s, is_active: true, start_time: '07:00', end_time: '12:00' };
        if (preset === 'afternoon') return { ...s, is_active: true, start_time: '13:00', end_time: '19:00' };
        return { ...s, is_active: true, start_time: '07:00', end_time: '19:00' };
      })
    );
  };

  const handlePublishShifts = async () => {
    setSavingShifts(true);
    setFeedback(null);
    try {
      await technicianApi.updateShifts(shifts);
      showFeedback(
        'success',
        'Đã xuất bản lịch trực thành công! Khách hàng đặt lịch trên Trang chủ sẽ thấy ca trực mới của bạn.'
      );
    } catch (err: any) {
      console.error('Failed to publish shifts:', err);
      showFeedback('error', err.response?.data?.message || 'Xuất bản lịch trực thất bại.');
    } finally {
      setSavingShifts(false);
    }
  };

  return (
    <div className="container py-10 md:py-12 max-w-5xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Calendar className="w-7 h-7 text-primary" />
            Quản lý Lịch trực & Đăng ký Ca làm việc
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Thiết lập các khung giờ bạn rảnh trong tuần để xuất bản lên hệ thống đặt lịch công khai.
          </p>
        </div>

        {activeTab === 'weekly' && (
          <button
            type="button"
            onClick={handlePublishShifts}
            disabled={savingShifts || shiftsLoading}
            className="btn btn-primary text-xs font-semibold px-5 py-2.5 shadow-md flex items-center gap-2 self-start sm:self-auto"
          >
            {savingShifts ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>{savingShifts ? 'Đang xuất bản...' : 'Xuất bản Lịch trực'}</span>
          </button>
        )}
      </div>

      {/* FEEDBACK ALERT */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm border shadow-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          )}
          <span className="flex-1 font-medium">{feedback.message}</span>
        </div>
      )}

      {/* TABS SELECTOR */}
      <div className="flex border-b border-border gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('weekly')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'weekly'
              ? 'border-primary text-primary bg-orange-50/40 rounded-t-xl'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Lịch trực hàng tuần (Publish ca rảnh)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'orders'
              ? 'border-primary text-primary bg-orange-50/40 rounded-t-xl'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Đơn hàng theo ngày trực</span>
        </button>
      </div>

      {/* TAB 1: WEEKLY SHIFT REGISTRATION */}
      {activeTab === 'weekly' && (
        <div className="space-y-6">
          {/* EXPLANATION BANNER */}
          <div className="card p-5 bg-gradient-to-r from-orange-50/70 via-amber-50/50 to-white border border-orange-200/80 rounded-2xl flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Info className="w-5 h-5" />
            </div>
            <div className="text-xs text-gray-700 space-y-1">
              <p className="font-bold text-gray-900 text-sm">
                Lịch trực hoạt động như thế nào?
              </p>
              <p>
                1. <strong>Đăng ký ca trực</strong>: Bật/Tắt những ngày trong tuần bạn có thể nhận bảo dưỡng máy tính tại Phòng 1603 A1 (ĐH Công nghiệp Hà Nội).
              </p>
              <p>
                2. <strong>Đồng bộ tức thì với Trang chủ</strong>: Khi bạn bấm <em>"Xuất bản Lịch trực"</em>, hệ thống sẽ mở các khung giờ tương ứng trên Lịch Đặt chỗ công khai. Khách hàng chọn khung giờ đó sẽ thấy bạn trong danh sách KTV sẵn sàng hỗ trợ.
              </p>
            </div>
          </div>

          {/* 7 DAYS SHIFTS CONFIGURATION */}
          <div className="card bg-white border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
            {shiftsLoading ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-gray-500">Đang tải lịch trực tuần...</p>
              </div>
            ) : (
              shifts.map((shift) => {
                const dayName = DAY_NAMES[shift.day_of_week] || `Thứ ${shift.day_of_week}`;
                const isActive = !!shift.is_active;

                return (
                  <div
                    key={shift.day_of_week}
                    className={`p-5 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isActive ? 'bg-white' : 'bg-gray-50/60 opacity-80'
                    }`}
                  >
                    {/* Day name & toggle */}
                    <div className="flex items-center gap-4 min-w-[200px]">
                      <button
                        type="button"
                        onClick={() => handleToggleDay(shift.day_of_week)}
                        className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                          isActive ? 'bg-orange-600' : 'bg-gray-300'
                        }`}
                        title={isActive ? 'Đang bật ca trực' : 'Đang tắt ca trực'}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            isActive ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>

                      <div>
                        <span className={`text-sm font-bold block ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                          {dayName}
                        </span>
                        <span className="text-[11px] text-gray-500">
                          {isActive ? '🟢 Đăng ký trực' : '⚪ Nghỉ trực'}
                        </span>
                      </div>
                    </div>

                    {/* Time selection */}
                    {isActive ? (
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-500 font-medium">Từ:</label>
                          <select
                            value={shift.start_time}
                            onChange={(e) => handleTimeChange(shift.day_of_week, 'start_time', e.target.value)}
                            className="input text-xs font-semibold py-1.5 px-2.5 w-24 bg-gray-50 border-gray-200"
                          >
                            {TIME_OPTIONS.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-500 font-medium">Đến:</label>
                          <select
                            value={shift.end_time}
                            onChange={(e) => handleTimeChange(shift.day_of_week, 'end_time', e.target.value)}
                            className="input text-xs font-semibold py-1.5 px-2.5 w-24 bg-gray-50 border-gray-200"
                          >
                            {TIME_OPTIONS.filter((t) => t > shift.start_time).map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>

                        {/* Quick Presets */}
                        <div className="flex items-center gap-1.5 pl-2 border-l border-gray-200">
                          <button
                            type="button"
                            onClick={() => applyPreset(shift.day_of_week, 'morning')}
                            className="px-2 py-1 text-[11px] font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 flex items-center gap-1"
                            title="07:00 - 12:00"
                          >
                            <Sun className="w-3 h-3" /> Ca Sáng
                          </button>
                          <button
                            type="button"
                            onClick={() => applyPreset(shift.day_of_week, 'afternoon')}
                            className="px-2 py-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 flex items-center gap-1"
                            title="13:00 - 19:00"
                          >
                            <Sunset className="w-3 h-3" /> Ca Chiều
                          </button>
                          <button
                            type="button"
                            onClick={() => applyPreset(shift.day_of_week, 'fullday')}
                            className="px-2 py-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 flex items-center gap-1"
                            title="07:00 - 19:00"
                          >
                            <Zap className="w-3 h-3" /> Cả ngày
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs italic text-gray-400">
                        Không nhận lịch đặt trong ngày này.
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* BOTTOM SAVE BUTTON */}
          <div className="flex items-center justify-between p-4 card bg-gray-50 border border-gray-200 rounded-2xl">
            <span className="text-xs text-gray-600">
              Nhớ bấm <strong>Xuất bản Lịch trực</strong> để áp dụng các thay đổi lên hệ thống công khai.
            </span>

            <button
              type="button"
              onClick={handlePublishShifts}
              disabled={savingShifts || shiftsLoading}
              className="btn btn-primary text-xs font-semibold px-6 py-2.5 shadow-md flex items-center gap-2"
            >
              {savingShifts ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{savingShifts ? 'Đang lưu...' : 'Xuất bản Lịch trực'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: DAILY ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="card p-5 bg-white border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Danh sách đơn phục vụ trong ngày</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Xem lịch hẹn chi tiết của các đơn hàng đã được phân công cho bạn.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-700">Chọn ngày:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="input text-xs font-medium py-2 px-3 bg-gray-50 border-gray-200 w-auto"
              />
            </div>
          </div>

          {ordersLoading ? (
            <div className="p-8 text-center space-y-3 card bg-white">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-gray-500">Đang tải danh sách đơn ngày {selectedDate}...</p>
            </div>
          ) : dailyOrders.length === 0 ? (
            <div className="card p-12 text-center bg-white border border-gray-100 space-y-2">
              <ClipboardList className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="font-semibold text-gray-700 text-sm">
                Không có đơn hàng nào trong ngày {format(new Date(selectedDate), 'dd/MM/yyyy', { locale: vi })}
              </p>
              <p className="text-xs text-gray-400">
                Hãy sẵn sàng tại phòng làm việc 1603 A1 khi đến ca trực đã đăng ký.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {dailyOrders.map((order) => (
                <div
                  key={order.id}
                  className="card p-5 bg-white border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-primary text-sm">
                        {order.code}
                      </span>
                      <span className="text-xs font-bold text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded-md">
                        {order.package_name}
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                          order.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : order.status === 'CONFIRMED'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : order.status === 'IN_PROGRESS'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : order.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 flex items-center gap-2">
                      <span>👤 Khách hàng: <strong>{order.customer_name}</strong></span>
                      <span>·</span>
                      <span>📍 {order.location || 'Phòng 1603, Tòa A1, ĐH Công nghiệp HN'}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center">
                    <div className="text-right">
                      <span className="text-xs text-gray-400 block font-mono">Khung giờ:</span>
                      <span className="text-sm font-bold text-gray-800 font-mono">
                        {order.scheduled_start} - {order.scheduled_end}
                      </span>
                    </div>

                    <Link
                      to={`/technician/orders/${order.id}`}
                      className="btn btn-primary text-xs font-semibold px-4 py-2 flex items-center gap-1.5"
                    >
                      <span>Thực hiện đơn</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}