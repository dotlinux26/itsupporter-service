import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { orderApi, publicApi } from '../../api/client';
import { MarkdownRenderer } from '../../components/MarkdownRenderer';
import { Avatar } from '../../components/Avatar';
import { TurnstileWidget } from '../../components/TurnstileWidget';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  FileText, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import type { ServicePackage, TechnicianBrief } from '../../types';

const SLOTS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

export function isSlotTooSoon(dateStr: string, timeStr: string): boolean {
  if (!dateStr || !timeStr) return false;
  try {
    const [h, m] = timeStr.split(':').map(Number);
    const scheduled = new Date(`${dateStr}T00:00:00`);
    scheduled.setHours(h, m, 0, 0);
    const now = new Date();
    const diffHours = (scheduled.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours < 4;
  } catch {
    return false;
  }
}

export function BookingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [technicians, setTechnicians] = useState<TechnicianBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTechs, setLoadingTechs] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Anti-race condition refs
  const activeSlotReqRef = useRef<number>(0);
  const submittingRef = useRef<boolean>(false);

  // Turnstile protection states
  const [turnstileEnabled, setTurnstileEnabled] = useState<boolean>(true);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState<string>('0x4AAAAAAFD6cbdGSfQ4qeog');
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [turnstileResetKey, setTurnstileResetKey] = useState<number>(0);

  // Form states
  const initialPackageId = searchParams.get('packageId') ? Number(searchParams.get('packageId')) : 0;
  const initialDate = searchParams.get('date') || new Date().toISOString().slice(0, 10);
  const initialTime = searchParams.get('time') || '09:00';
  const initialTechId = searchParams.get('technicianId') ? Number(searchParams.get('technicianId')) : null;

  const [selectedPackageId, setSelectedPackageId] = useState<number>(initialPackageId);
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [selectedTime, setSelectedTime] = useState<string>(initialTime);
  const [selectedTechId, setSelectedTechId] = useState<number | null>(initialTechId);
  const [workshopAddress, setWorkshopAddress] = useState<string>('Phòng 1603, Tòa A1, Cơ sở 1 - Đại học Công nghiệp Hà Nội');
  const [note, setNote] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedDate && selectedTime) {
      loadTechniciansForSlot(selectedDate, selectedTime);
    }
  }, [selectedDate, selectedTime]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [res, infoRes] = await Promise.all([
        publicApi.packages(),
        publicApi.info().catch(() => null),
      ]);
      const pkgList = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];
      const activePkgs = pkgList.filter((p: any) => p.is_active === undefined || p.is_active === 1);
      setPackages(activePkgs);
      if (!selectedPackageId && activePkgs.length > 0) {
        setSelectedPackageId(activePkgs[0].id);
      }
      if (infoRes?.data?.data) {
        const info = infoRes.data.data;
        if (info.workshop_address) {
          setWorkshopAddress(info.workshop_address);
        }
        if (info.turnstile_site_key || info.turnstileSiteKey) {
          setTurnstileSiteKey(info.turnstile_site_key || info.turnstileSiteKey);
        }
        if (info.turnstile_enabled !== undefined) {
          setTurnstileEnabled(Boolean(info.turnstile_enabled));
        } else if (info.turnstileEnabled !== undefined) {
          setTurnstileEnabled(Boolean(info.turnstileEnabled));
        }
      }
    } catch (err) {
      console.error('Failed to load packages:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTechniciansForSlot = async (date: string, time: string) => {
    const reqId = ++activeSlotReqRef.current;
    setLoadingTechs(true);
    try {
      const res = await publicApi.technicians(date, time);
      // Chống Race: Bỏ qua response nếu user đã chuyển sang slot khác
      if (reqId !== activeSlotReqRef.current) return;

      const techList = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];
      setTechnicians(techList);
      if (techList.length > 0) {
        setSelectedTechId((prev) => {
          if (prev && techList.some((t: any) => t.id === prev)) return prev;
          return null; // default to auto-dispatch
        });
      } else {
        setSelectedTechId(null);
      }
    } catch (err) {
      if (reqId === activeSlotReqRef.current) {
        console.error('Failed to load slot technicians:', err);
        setTechnicians([]);
        setSelectedTechId(null);
      }
    } finally {
      if (reqId === activeSlotReqRef.current) {
        setLoadingTechs(false);
      }
    }
  };

  const handlePickRandomTech = () => {
    if (technicians.length === 0) return;
    const others = technicians.filter((t) => t.id !== selectedTechId);
    if (others.length > 0) {
      const randomTech = others[Math.floor(Math.random() * others.length)];
      setSelectedTechId(randomTech.id);
    } else {
      setSelectedTechId(technicians[0].id);
    }
  };

  const selectedPackage = packages.find((p) => p.id === selectedPackageId);
  const isTooSoon = isSlotTooSoon(selectedDate, selectedTime);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || submittingRef.current) return;
    setErrorMessage(null);

    if (!selectedPackageId) {
      setErrorMessage('Vui lòng chọn gói dịch vụ.');
      return;
    }
    if (isTooSoon) {
      setErrorMessage('Theo quy định, Quý khách cần đặt lịch trước tối thiểu 4 tiếng so với giờ bắt đầu ca dịch vụ.');
      return;
    }
    if (turnstileEnabled && !turnstileToken) {
      setErrorMessage('Vui lòng hoàn thành xác thực bảo vệ chống bot (Cloudflare Turnstile) trước khi đặt lịch.');
      return;
    }

    try {
      submittingRef.current = true;
      setSubmitting(true);
      const res = await orderApi.create({
        packageId: selectedPackageId,
        scheduledDate: selectedDate,
        scheduledStart: selectedTime,
        requestedTechnicianId: selectedTechId || null,
        location: workshopAddress,
        note: note.trim() || null,
        'cf-turnstile-response': turnstileToken,
        turnstileToken: turnstileToken,
      });

      const orderId = res.data.data.id;
      navigate(`/orders/${orderId}`);
    } catch (err: any) {
      console.error('Booking failed:', err);
      setTurnstileResetKey((prev) => prev + 1);
      setTurnstileToken('');
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Đặt lịch thất bại. Vui lòng thử lại!';
      setErrorMessage(msg);
      // Nếu KTV bị xung đột (409 Conflict - đã có người nhận trước), tự động làm mới danh sách KTV khả dụng
      if (err.response?.status === 409 && selectedDate && selectedTime) {
        loadTechniciansForSlot(selectedDate, selectedTime);
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 sm:py-8 md:py-12 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-40 bg-gray-100 rounded-xl" />
          <div className="h-60 bg-gray-100 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-5 sm:py-8 md:py-12">
      <div className="container max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Đặt lịch tiếp nhận tại IT Supporter HaUI
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Đặt lịch bảo dưỡng & vệ sinh máy tính
          </h1>
          <p className="text-slate-600 mt-1 text-sm">
            Quý khách đặt lịch trước, sau đó mang thiết bị tới phòng làm việc của đội để kỹ thuật viên kiểm tra & bảo dưỡng trực tiếp.
          </p>
        </div>

        {/* Advance 4h Rule Alert Banner */}
        <div className="mb-6 p-4 rounded-xl border border-blue-200 bg-blue-50/80 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-900 leading-relaxed">
            <span className="font-bold">Quy chuẩn lịch hẹn:</span> Hệ thống áp dụng quy định đặt lịch trước{' '}
            <strong className="text-blue-950 font-bold underline">tối thiểu 4 tiếng</strong> để kỹ thuật viên chuẩn bị đầy đủ trang thiết bị và vật tư chuyên dụng.
            Quý khách vui lòng mang máy đến đúng giờ hẹn tại{' '}
            <span className="font-bold text-orange-700">{workshopAddress}</span>.
            Nếu kỹ thuật viên trễ ca &gt; 30 phút, dịch vụ sẽ được{' '}
            <span className="font-bold text-orange-600">HOÀN TOÀN MIỄN PHÍ (0đ)</span> theo cam kết chất lượng.
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 flex items-center gap-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          {/* Step 1: Choose Package */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-6 h-6 rounded-full bg-orange-600 text-white text-xs font-bold flex items-center justify-center">1</span>
              <h2 className="text-lg font-bold text-slate-800">Chọn gói dịch vụ</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {packages.map((pkg) => {
                const isSelected = pkg.id === selectedPackageId;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackageId(pkg.id)}
                    className={`cursor-pointer rounded-xl p-5 border-2 transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50/40 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-slate-900 text-base">{pkg.name}</h3>
                        <span className="text-lg font-extrabold text-orange-600 whitespace-nowrap">
                          {pkg.price.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 line-clamp-3 mb-3">
                        <MarkdownRenderer content={pkg.description || ''} />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Thời lượng ước tính: ~{pkg.duration_minutes || 60} phút</span>
                      <span className={`font-semibold ${isSelected ? 'text-orange-600' : 'text-slate-400'}`}>
                        {isSelected ? '✓ Đang chọn' : 'Chọn gói'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: Date & Time Slot */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-6 h-6 rounded-full bg-orange-600 text-white text-xs font-bold flex items-center justify-center">2</span>
              <h2 className="text-lg font-bold text-slate-800">Chọn thời gian phục vụ (Tối thiểu trước 4 tiếng)</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4 text-orange-600" /> Ngày làm việc
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-orange-600" /> Khung giờ bắt đầu
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {SLOTS.map((slot) => {
                    const slotDisabled = isSlotTooSoon(selectedDate, slot);
                    const isSlotSelected = selectedTime === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={slotDisabled}
                        onClick={() => setSelectedTime(slot)}
                        className={`py-2 px-1 text-center rounded-lg text-xs font-medium border transition-all ${
                          slotDisabled
                            ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed line-through'
                            : isSlotSelected
                            ? 'bg-orange-600 text-white border-orange-600 font-bold shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-orange-300 hover:bg-orange-50/50'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {isTooSoon && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                <span>Khung giờ bạn chọn ({selectedTime} ngày {selectedDate}) chưa đủ 4 tiếng chuẩn bị. Vui lòng chọn khung giờ muộn hơn!</span>
              </div>
            )}
          </div>

          {/* Step 3: Technician Selection */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-orange-600 text-white text-xs font-bold flex items-center justify-center">3</span>
                <h2 className="text-lg font-bold text-slate-800">Kỹ thuật viên phụ trách ca trực</h2>
              </div>

              {technicians.length > 1 && (
                <button
                  type="button"
                  onClick={handlePickRandomTech}
                  className="px-3 py-1.5 text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl transition flex items-center gap-1.5"
                  title="Chọn ngẫu nhiên một kỹ thuật viên khác trong ca này"
                >
                  <span>🎲 Chọn ngẫu nhiên KTV</span>
                </button>
              )}
            </div>

            {loadingTechs ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-center gap-2.5 animate-pulse">
                <Clock className="w-4 h-4 text-orange-600 animate-spin" />
                <span>Đang tải danh sách kỹ thuật viên sẵn sàng cho ca {selectedTime} ngày {selectedDate}...</span>
              </div>
            ) : technicians.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                <span>
                  Chưa có Kỹ thuật viên nào đăng ký trực vào khung giờ <strong>{selectedTime} ngày {selectedDate}</strong>. Quý khách vui lòng chọn một khung giờ hoặc ngày khác để tiếp tục.
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  Có <strong>{technicians.length}</strong> Kỹ thuật viên sẵn sàng trong ca này. Bạn có thể để Quản lý tự phân công hoặc chỉ định kỹ thuật viên bạn mong muốn:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option: Auto-dispatch */}
                  <label
                    onClick={() => setSelectedTechId(null)}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedTechId === null
                        ? 'border-orange-500 bg-orange-50/50 shadow-xs ring-1 ring-orange-500'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="technician"
                      checked={selectedTechId === null}
                      onChange={() => setSelectedTechId(null)}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                    <div className="w-9 h-9 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center text-base flex-shrink-0">
                      🤖
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-slate-800 truncate flex items-center gap-1.5">
                        <span>Hệ thống / Quản lý điều phối</span>
                        <span className="text-[10px] font-extrabold bg-orange-500 text-white px-1.5 py-0.5 rounded-full">
                          Tự động
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        Ban quản lý sẽ giao ca cho KTV rảnh & tối ưu nhất
                      </div>
                    </div>
                  </label>

                  {/* Specific technicians */}
                  {technicians.map((tech) => (
                    <label
                      key={tech.id}
                      onClick={() => setSelectedTechId(tech.id)}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        selectedTechId === tech.id
                          ? 'border-orange-500 bg-orange-50/50 shadow-xs ring-1 ring-orange-500'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="technician"
                        checked={selectedTechId === tech.id}
                        onChange={() => setSelectedTechId(tech.id)}
                        className="text-orange-600 focus:ring-orange-500"
                      />
                      <Avatar name={tech.name} src={tech.avatar_url} size={36} />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-slate-800 truncate">{tech.name}</div>
                        <div className="text-xs text-slate-500 truncate">
                          {tech.bio || 'Kỹ thuật viên IT Supporter HaUI'}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Step 4: Workshop Address & Device Notes */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-6 h-6 rounded-full bg-orange-600 text-white text-xs font-bold flex items-center justify-center">4</span>
              <h2 className="text-lg font-bold text-slate-800">Địa điểm tiếp nhận & Ghi chú thiết bị</h2>
            </div>

            <div className="space-y-4">
              <div className="p-3.5 sm:p-4 rounded-xl bg-orange-50/80 border border-orange-200 flex items-start gap-3">
                <MapPin className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-orange-800 mb-0.5">
                    Địa chỉ phòng làm việc tiếp nhận máy của IT Supporter HaUI:
                  </div>
                  <div className="text-base font-extrabold text-slate-900">
                    {workshopAddress}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    👉 Quý khách vui lòng mang thiết bị (PC, Laptop, sạc) tới trực tiếp phòng làm việc theo đúng khung giờ đã chọn. Kỹ thuật viên của đội sẽ đón tiếp và tiến hành kiểm tra, vệ sinh ngay trước sự quan sát của quý khách!
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-500" /> Tình trạng máy / Ghi chú cho kỹ thuật viên
                </label>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Laptop Dell XPS 15 bị nóng quạt kêu to, cần tra keo gốm và vệ sinh bụi kẹt..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Summary & Submit */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-semibold">Tóm tắt thanh toán</div>
                <div className="text-2xl font-black text-orange-400">
                  {selectedPackage ? `${selectedPackage.price.toLocaleString('vi-VN')} VNĐ` : '0 VNĐ'}
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  Thanh toán sau khi hoàn thành · Hỗ trợ Voucher & Giảm giá tại buổi làm việc
                </div>
              </div>

              <div className="w-full sm:w-auto flex flex-col items-center sm:items-end gap-3">
                {turnstileEnabled && (
                  <div className="bg-white/5 p-2 rounded-xl backdrop-blur-xs flex flex-col items-center border border-white/10">
                    <TurnstileWidget
                      siteKey={turnstileSiteKey}
                      action="booking"
                      theme="dark"
                      resetKey={turnstileResetKey}
                      onVerify={(token) => setTurnstileToken(token)}
                      onError={() => setTurnstileToken('')}
                      onExpire={() => setTurnstileToken('')}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || isTooSoon || (turnstileEnabled && !turnstileToken) || loadingTechs}
                  className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-md transition-all ${
                    submitting ? 'opacity-80 pointer-events-none cursor-wait' : 'cursor-pointer'
                  }`}
                >
                  {submitting ? 'Đang khởi tạo đơn...' : 'Xác nhận Đặt Lịch Ngay'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
