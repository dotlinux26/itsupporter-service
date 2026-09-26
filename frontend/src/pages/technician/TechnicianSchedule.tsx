import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { technicianApi } from '../../api/client';
import { format } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Save,
  Send,
  Sun,
  Sunset,
  Info,
  ChevronRight,
  ClipboardList,
  CheckSquare,
  Square,
  Sparkles,
  Trash2,
  User,
  MapPin,
} from 'lucide-react';

export interface ShiftItem {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean | number;
  slots: string[];
}

const DAY_NAMES_VI: Record<number, string> = {
  1: 'Thứ Hai',
  2: 'Thứ Ba',
  3: 'Thứ Tư',
  4: 'Thứ Năm',
  5: 'Thứ Sáu',
  6: 'Thứ Bảy',
  7: 'Chủ Nhật',
};

const DAY_NAMES_EN: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
};

const ALL_12_SLOTS = [
  { start: '07:00', end: '08:00', label: '07:00 - 08:00', shift: 'morning' },
  { start: '08:00', end: '09:00', label: '08:00 - 09:00', shift: 'morning' },
  { start: '09:00', end: '10:00', label: '09:00 - 10:00', shift: 'morning' },
  { start: '10:00', end: '11:00', label: '10:00 - 11:00', shift: 'morning' },
  { start: '11:00', end: '12:00', label: '11:00 - 12:00', shift: 'morning' },
  { start: '12:00', end: '13:00', label: '12:00 - 13:00', shift: 'afternoon' },
  { start: '13:00', end: '14:00', label: '13:00 - 14:00', shift: 'afternoon' },
  { start: '14:00', end: '15:00', label: '14:00 - 15:00', shift: 'afternoon' },
  { start: '15:00', end: '16:00', label: '15:00 - 16:00', shift: 'afternoon' },
  { start: '16:00', end: '17:00', label: '16:00 - 17:00', shift: 'afternoon' },
  { start: '17:00', end: '18:00', label: '17:00 - 18:00', shift: 'afternoon' },
  { start: '18:00', end: '19:00', label: '18:00 - 19:00', shift: 'afternoon' },
];

export function TechnicianSchedule() {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');
  const dateLocale = isEn ? enUS : vi;
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
        setShifts(
          list.map((s: any) => ({
            ...s,
            is_active: !!s.is_active,
            slots: Array.isArray(s.slots) ? s.slots : ALL_12_SLOTS.map((slot) => slot.start),
          }))
        );
      } else {
        // Default template: Mon-Sat active all 12 slots, Sun off
        setShifts(
          [1, 2, 3, 4, 5, 6, 7].map((dow) => ({
            day_of_week: dow,
            start_time: '07:00',
            end_time: '19:00',
            is_active: dow <= 6,
            slots: dow <= 6 ? ALL_12_SLOTS.map((s) => s.start) : [],
          }))
        );
      }
    } catch (err) {
      console.error('Failed to load shifts:', err);
      showFeedback('error', t('technician.loadConfigError'));
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
      prev.map((s) => {
        if (s.day_of_week !== dow) return s;
        const willBeActive = !s.is_active;
        return {
          ...s,
          is_active: willBeActive,
          // If turning on and no slots selected, default to all 12 slots
          slots: willBeActive && s.slots.length === 0 ? ALL_12_SLOTS.map((slot) => slot.start) : s.slots,
        };
      })
    );
  };

  const handleToggleSlot = (dow: number, slotStart: string) => {
    setShifts((prev) =>
      prev.map((s) => {
        if (s.day_of_week !== dow) return s;
        const currentSlots = s.slots || [];
        const isTicked = currentSlots.includes(slotStart);
        const nextSlots = isTicked
          ? currentSlots.filter((st) => st !== slotStart)
          : [...currentSlots, slotStart].sort();

        return {
          ...s,
          is_active: nextSlots.length > 0,
          slots: nextSlots,
        };
      })
    );
  };

  const applyPreset = (dow: number, preset: 'all' | 'morning' | 'afternoon' | 'none') => {
    setShifts((prev) =>
      prev.map((s) => {
        if (s.day_of_week !== dow) return s;
        let newSlots: string[] = [];
        if (preset === 'all') {
          newSlots = ALL_12_SLOTS.map((slot) => slot.start);
        } else if (preset === 'morning') {
          newSlots = ['07:00', '08:00', '09:00', '10:00', '11:00'];
        } else if (preset === 'afternoon') {
          newSlots = ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
        } else if (preset === 'none') {
          newSlots = [];
        }

        return {
          ...s,
          is_active: newSlots.length > 0,
          slots: newSlots,
        };
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
        t('technician.publishSuccessNotice')
      );
    } catch (err: any) {
      console.error('Failed to publish shifts:', err);
      showFeedback('error', err.response?.data?.message || t('technician.publishErrorNotice'));
    } finally {
      setSavingShifts(false);
    }
  };

  return (
    <div className="container py-5 sm:py-8 md:py-12 max-w-5xl mx-auto space-y-6 sm:space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Calendar className="w-7 h-7 text-primary" />
            {t('technician.scheduleMgmtTitle')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('technician.scheduleMgmtSubtitle')}
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
            <span>{savingShifts ? t('technician.publishingBtn') : t('technician.publishScheduleBtn')}</span>
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
          <span>{t('technician.weeklyScheduleTab')}</span>
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
          <span>{t('technician.ordersByDayTab')}</span>
        </button>
      </div>

      {/* TAB 1: WEEKLY SHIFT REGISTRATION WITH 12-SLOT TICKING */}
      {activeTab === 'weekly' && (
        <div className="space-y-6">
          {/* EXPLANATION BANNER */}
          <div className="card p-5 bg-gradient-to-r from-orange-50/70 via-amber-50/50 to-white border border-orange-200/80 rounded-2xl flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Info className="w-5 h-5" />
            </div>
            <div className="text-xs text-gray-700 space-y-1">
              <p className="font-bold text-gray-900 text-sm">
                {t('technician.freedomNoticeTitle')}
              </p>
              <p>
                {t('technician.freedomNotice1')}
              </p>
              <p>
                {t('technician.freedomNotice2')}
              </p>
            </div>
          </div>

          {/* 7 DAYS SHIFTS CONFIGURATION */}
          <div className="space-y-4">
            {shiftsLoading ? (
              <div className="p-8 text-center space-y-3 card bg-white">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-gray-500">{t('technician.loadingWeeklySchedule')}</p>
              </div>
            ) : (
              shifts.map((shift) => {
                const dayName = t('common.days.' + shift.day_of_week, { defaultValue: (isEn ? DAY_NAMES_EN : DAY_NAMES_VI)[shift.day_of_week] || (isEn ? `Day ${shift.day_of_week}` : `Thứ ${shift.day_of_week}`) });
                const isActive = !!shift.is_active;
                const tickedSlots = shift.slots || [];

                return (
                  <div
                    key={shift.day_of_week}
                    className={`card p-5 border transition-all duration-200 ${
                      isActive
                        ? 'bg-white border-orange-200 shadow-sm'
                        : 'bg-gray-50/70 border-gray-200 opacity-80'
                    }`}
                  >
                    {/* Day Header with Master Switch & Presets */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-gray-100">
                      {/* Master Day Toggle */}
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleDay(shift.day_of_week)}
                          className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                            isActive ? 'bg-orange-600' : 'bg-gray-300'
                          }`}
                          title={isActive ? t('technician.dayEnabledTitle') : t('technician.dayDisabledTitle')}
                        >
                          <div
                            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                              isActive ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-base font-extrabold ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                              {dayName}
                            </span>
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                isActive
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-gray-200 text-gray-500'
                              }`}
                            >
                              {isActive ? t('technician.slotsSelectedCount', { count: tickedSlots.length }) : t('technician.offDuty')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Presets Toolbar */}
                      {isActive && (
                        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
                          <button
                            type="button"
                            onClick={() => applyPreset(shift.day_of_week, 'all')}
                            className="px-2.5 py-1 text-[11px] font-semibold text-primary bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3" /> {t('technician.all12Slots')}
                          </button>
                          <button
                            type="button"
                            onClick={() => applyPreset(shift.day_of_week, 'morning')}
                            className="px-2.5 py-1 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition flex items-center gap-1"
                          >
                            <Sun className="w-3 h-3" /> {t('technician.morningSlots')}
                          </button>
                          <button
                            type="button"
                            onClick={() => applyPreset(shift.day_of_week, 'afternoon')}
                            className="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition flex items-center gap-1"
                          >
                            <Sunset className="w-3 h-3" /> {t('technician.afternoonSlots')}
                          </button>
                          <button
                            type="button"
                            onClick={() => applyPreset(shift.day_of_week, 'none')}
                            className="px-2 py-1 text-[11px] font-medium text-gray-500 hover:text-rose-600 bg-gray-100 hover:bg-rose-50 rounded-lg border border-gray-200 transition flex items-center gap-1"
                            title={t('technician.clearAllSlotsTooltip')}
                          >
                            <Trash2 className="w-3 h-3" /> {t('technician.clearAllSlots')}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 12 Slot Interactive Ticking Grid */}
                    {isActive ? (
                      <div className="pt-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                          {ALL_12_SLOTS.map((slot) => {
                            const isTicked = tickedSlots.includes(slot.start);
                            return (
                              <button
                                key={slot.start}
                                type="button"
                                onClick={() => handleToggleSlot(shift.day_of_week, slot.start)}
                                className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between gap-1.5 cursor-pointer select-none ${
                                  isTicked
                                    ? 'bg-primary text-white border-primary shadow-xs ring-2 ring-orange-500/20 active:scale-95'
                                    : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:bg-orange-50/40 active:scale-95'
                                }`}
                              >
                                <span className="font-mono text-xs">{slot.label}</span>
                                {isTicked ? (
                                  <CheckSquare className="w-4 h-4 text-white flex-shrink-0" />
                                ) : (
                                  <Square className="w-4 h-4 text-gray-300 flex-shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="pt-3 text-xs italic text-gray-400">
                        {t('technician.dayDisabledHint', { day: dayName })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* BOTTOM SAVE BUTTON */}
          <div className="flex items-center justify-between p-4 card bg-gray-50 border border-gray-200 rounded-2xl">
            <span className="text-xs text-gray-600">
              {t('technician.rememberPublishNoticePart1')} <strong>{t('technician.publishScheduleBtn')}</strong> {t('technician.rememberPublishNoticePart2')}
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
              <span>{savingShifts ? t('technician.savingBtn') : t('technician.publishScheduleBtn')}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: DAILY ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="card p-5 bg-white border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-gray-900 text-base">{t('technician.dailyOrdersTitle')}</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {t('technician.dailyOrdersSubtitle')}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-700">{t('technician.selectDateLabel')}</label>
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
              <p className="text-sm text-gray-500">{t('technician.loadingOrdersForDate', { date: selectedDate })}</p>
            </div>
          ) : dailyOrders.length === 0 ? (
            <div className="card p-12 text-center bg-white border border-gray-100 space-y-2">
              <ClipboardList className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="font-semibold text-gray-700 text-sm">
                {t('technician.noOrdersOnDate', { date: format(new Date(selectedDate), 'dd/MM/yyyy', { locale: dateLocale }) })}
              </p>
              <p className="text-xs text-gray-400">
                {t('technician.beReadyPrompt')}
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
                        {t('status.' + (order.status || '').toLowerCase(), { defaultValue: order.status })}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>{t('technician.customerLabel')} <strong>{order.customer_name}</strong></span>
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span>{order.location || (isEn ? 'Room 1603, Building A1, HaUI' : 'Phòng 1603, Tòa A1, ĐH Công nghiệp HN')}</span>
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center">
                    <div className="text-right">
                      <span className="text-xs text-gray-400 block font-mono">{t('technician.timeSlotLabel')}</span>
                      <span className="text-sm font-bold text-gray-800 font-mono">
                        {order.scheduled_start} - {order.scheduled_end}
                      </span>
                    </div>

                    <Link
                      to={`/technician/orders/${order.id}`}
                      className="btn btn-primary text-xs font-semibold px-4 py-2 flex items-center gap-1.5"
                    >
                      <span>{t('technician.executeOrderBtn')}</span>
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