import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { publicApi } from '@/api/client';
import type { DaySlots } from '@/types';
import { format, startOfWeek, addDays, isToday, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Avatar } from './Avatar';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  ShieldCheck, 
  ArrowRight,
  X
} from 'lucide-react';

const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
const SLOTS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

interface SlotData {
  start: string;
  end: string;
  available: boolean;
  technicians: Array<{ id: number; name: string; avatar_url: string | null }>;
}

interface SlotResponse {
  data: SlotData[];
}

export function isSlotWithin4Hours(dateStr: string, timeStr: string): boolean {
  if (!dateStr || !timeStr) return false;
  try {
    const [h, m] = timeStr.split(':').map(Number);
    const scheduled = new Date(`${dateStr}T00:00:00`);
    scheduled.setHours(h, m, 0, 0);
    const now = new Date();
    const diffMs = scheduled.getTime() - now.getTime();
    return diffMs < 4 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function CalendarWidget() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [weekSlots, setWeekSlots] = useState<DaySlots[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; start: string; technicians: any[] } | null>(null);

  useEffect(() => {
    loadWeekSlots();
  }, [currentWeekStart]);

  const loadWeekSlots = async () => {
    setLoading(true);
    try {
      const slotsPromises: Promise<SlotResponse>[] = [];
      for (let i = 0; i < 7; i++) {
        const date = format(addDays(currentWeekStart, i), 'yyyy-MM-dd');
        slotsPromises.push(publicApi.slots(date));
      }
      const results = await Promise.all(slotsPromises);
      const slotsData: DaySlots[] = results.map((res: any, i: number) => {
        const rawSlots: SlotData[] = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
          ? res.data
          : [];
        return {
          date: format(addDays(currentWeekStart, i), 'yyyy-MM-dd'),
          dayName: DAYS[i],
          dayNumber: parseInt(format(addDays(currentWeekStart, i), 'd')),
          slots: SLOTS.map(start => {
            const slotData = rawSlots.find((s: SlotData) => s.start === start);
            const startHour = parseInt(start.split(':')[0], 10);
            const fallbackEnd = `${String(startHour + 1).padStart(2, '0')}:00`;
            return {
              start,
              end: slotData?.end || fallbackEnd,
              available: Boolean(slotData?.available),
              technicians: slotData?.technicians || [],
            };
          }),
        };
      });
      setWeekSlots(slotsData);
    } catch (error) {
      console.error('Failed to load slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const prevWeek = () => setCurrentWeekStart(addDays(currentWeekStart, -7));
  const nextWeek = () => setCurrentWeekStart(addDays(currentWeekStart, 7));
  const goToCurrentWeek = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const handleSlotClick = (date: string, start: string, technicians: any[]) => {
    if (!technicians.length) return;
    if (isSlotWithin4Hours(date, start)) return;

    if (!isAuthenticated) {
      setSelectedSlot({ date, start, technicians });
      return;
    }
    navigate(`/booking?date=${date}&time=${start}`);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/4" />
          <div className="grid grid-cols-7 gap-2 h-72">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="border border-slate-100 rounded-lg bg-slate-50" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
      {/* Calendar Header */}
      <div className="p-4 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-bold text-slate-900">{t('home.calendarWidget')}</h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              ● Trực quan 7 ngày
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            Khung giờ màu xanh khả dụng · Quy định đặt trước tối thiểu 4 tiếng
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button 
            onClick={prevWeek} 
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
            title="Tuần trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs sm:text-sm font-bold text-slate-800 px-3 py-1 bg-slate-100/80 rounded-lg min-w-[130px] text-center">
            {format(currentWeekStart, 'dd/MM', { locale: vi })} – {format(addDays(currentWeekStart, 6), 'dd/MM', { locale: vi })}
          </span>

          <button 
            onClick={nextWeek} 
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
            title="Tuần kế tiếp"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button 
            onClick={goToCurrentWeek} 
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition"
          >
            Hôm nay
          </button>
        </div>
      </div>

      {/* Calendar Grid Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200">
              {DAYS.map((day, i) => {
                const dayDate = addDays(currentWeekStart, i);
                const isCurrentDay = isToday(dayDate);
                return (
                  <th key={i} className="p-2.5 text-center border-r border-slate-200 last:border-none">
                    <div className="text-[11px] font-semibold uppercase text-slate-500">{day}</div>
                    <div className={`text-sm font-extrabold ${isCurrentDay ? 'text-orange-600' : 'text-slate-800'}`}>
                      {format(dayDate, 'd', { locale: vi })} {isCurrentDay && <span className="text-[10px] font-medium text-orange-500 block">Hôm nay</span>}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {SLOTS.map((start, slotIndex) => (
              <tr key={start} className="border-b border-slate-100 last:border-none">
                {weekSlots.map((day, dayIndex) => {
                  const currentSlot = day.slots[slotIndex];
                  return (
                    <td key={dayIndex} className="p-1 border-r border-slate-100 last:border-none h-16 md:h-20 align-top">
                      {currentSlot ? (
                        <SlotCell
                          slot={currentSlot}
                          date={day.date}
                          onClick={handleSlotClick}
                        />
                      ) : (
                        <div className="h-full bg-slate-50/30 rounded" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for Unauthenticated Users */}
      {selectedSlot && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setSelectedSlot(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </span>
              <h3 className="text-lg font-bold text-slate-900">Đặt lịch dịch vụ</h3>
            </div>

            <p className="text-sm text-slate-600 mb-4">
              Bạn đang chọn khung giờ:{' '}
              <strong className="text-slate-900">
                {selectedSlot.start} ngày {format(parseISO(selectedSlot.date), 'dd/MM/yyyy', { locale: vi })}
              </strong>
            </p>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-5">
              <div className="text-xs font-semibold text-slate-500 mb-2">Kỹ thuật viên sẵn sàng:</div>
              <div className="flex flex-wrap gap-2">
                {selectedSlot.technicians.map((tech: any) => (
                  <div key={tech.id} className="flex items-center gap-2 px-2.5 py-1 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-700">
                    <Avatar name={tech.name} src={tech.avatar_url} size={20} />
                    <span>{tech.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Link 
                to={`/login?redirect=/booking&date=${selectedSlot.date}&time=${selectedSlot.start}`} 
                className="w-full inline-flex items-center justify-center gap-2 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl shadow-md transition"
              >
                Đăng nhập để đặt lịch
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to={`/register?redirect=/booking&date=${selectedSlot.date}&time=${selectedSlot.start}`}
                className="w-full inline-flex items-center justify-center py-2.5 text-xs text-slate-600 hover:text-orange-600 font-semibold"
              >
                Chưa có tài khoản? Đăng ký ngay
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface SlotCellProps {
  slot: SlotData;
  date: string;
  onClick: (date: string, start: string, techs: any[]) => void;
}

function SlotCell({ slot, date, onClick }: SlotCellProps) {
  const isTooSoon = isSlotWithin4Hours(date, slot.start);
  const isAvailable = slot.available && slot.technicians.length > 0;

  if (!isAvailable) {
    return (
      <div className="w-full h-full bg-slate-50/50 rounded-lg flex items-center justify-center text-[10px] text-slate-300 font-mono">
        {slot.start}
      </div>
    );
  }

  if (isTooSoon) {
    return (
      <div
        className="w-full h-full bg-slate-100/80 rounded-lg p-1 flex flex-col items-center justify-center text-slate-400 cursor-not-allowed border border-slate-200/60"
        title="Không thể đặt lịch: Cần đặt trước tối thiểu 4 tiếng"
      >
        <span className="text-[11px] font-bold line-through">{slot.start}</span>
        <span className="text-[9px] text-amber-600 font-medium">Khóa (&lt;4h)</span>
      </div>
    );
  }

  return (
    <button
      onClick={() => onClick(date, slot.start, slot.technicians)}
      className="w-full h-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-300 text-emerald-900 rounded-lg p-1 flex flex-col items-center justify-between transition-all cursor-pointer group shadow-2xs hover:shadow-xs"
      title={`Khung giờ ${slot.start}: Có ${slot.technicians.length} kỹ thuật viên sẵn sàng`}
    >
      <div className="flex items-center justify-between w-full px-1">
        <span className="text-[11px] font-black text-emerald-800">{slot.start}</span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      </div>

      <div className="flex -space-x-1.5 my-0.5">
        {slot.technicians.slice(0, 3).map((tech: any) => (
          <Avatar
            key={tech.id}
            name={tech.name}
            src={tech.avatar_url}
            size={18}
            className="ring-1 ring-white"
          />
        ))}
        {slot.technicians.length > 3 && (
          <span className="w-4.5 h-4.5 rounded-full bg-emerald-200 text-emerald-800 text-[9px] font-bold flex items-center justify-center ring-1 ring-white">
            +{slot.technicians.length - 3}
          </span>
        )}
      </div>

      <div className="text-[9px] font-semibold text-emerald-700 group-hover:text-emerald-900 transition-colors">
        Đặt lịch
      </div>
    </button>
  );
}