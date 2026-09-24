import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CalendarWidget } from '../../components/CalendarWidget';
import { ServicePackages } from '../../components/ServicePackages';
import { ReviewSection } from '../../components/ReviewSection';
import { TechnicianGrid } from '../../components/TechnicianGrid';
import { publicApi } from '../../api/client';
import type { ServicePackage, TechnicianBrief } from '../../types';
import { 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Cpu, 
  Gift
} from 'lucide-react';

export function HomePage() {
  const location = useLocation();
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [technicians, setTechnicians] = useState<TechnicianBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [siteInfo, setSiteInfo] = useState<{
    workshop_address: string;
    team_name: string;
    contact_phone: string;
    booking_notice: string;
    warranty_policy_enabled?: boolean | string;
    warranty_policy_days?: string;
    warranty_policy_title?: string;
    stats?: {
      completed_orders_count?: number;
      total_orders_count?: number;
      total_reviews?: number;
      avg_rating?: number;
      satisfaction_percent?: number;
      active_technicians_count?: number;
    };
  }>({
    workshop_address: 'Phòng 1603, Tòa A1, Cơ sở 1 - Đại học Công nghiệp Hà Nội',
    team_name: 'IT Supporter HaUI',
    contact_phone: '0981.234.567',
    booking_notice: 'Khách hàng đặt lịch trước tối thiểu 4 tiếng, sau đó mang máy tới phòng làm việc để kỹ thuật viên kiểm tra & bảo dưỡng trực tiếp.',
    warranty_policy_enabled: false,
    warranty_policy_days: '30 Ngày',
    warranty_policy_title: 'Bảo hành hỗ trợ kỹ thuật',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [pkgsRes, techsRes, infoRes] = await Promise.all([
          publicApi.packages(),
          publicApi.technicians(new Date().toISOString().slice(0, 10)),
          publicApi.info().catch(() => null),
        ]);
        const pkgsList = Array.isArray(pkgsRes.data?.data)
          ? pkgsRes.data.data
          : Array.isArray(pkgsRes.data)
          ? pkgsRes.data
          : [];
        const techsList = Array.isArray(techsRes.data?.data)
          ? techsRes.data.data
          : Array.isArray(techsRes.data)
          ? techsRes.data
          : [];
        setPackages(pkgsList.filter((p: any) => p.is_active === 1));
        setTechnicians(techsList);
        if (infoRes?.data?.data) {
          const d = infoRes.data.data;
          setSiteInfo(prev => ({
            ...prev,
            ...d,
            workshop_address: d.workshop_address || d.workshopAddress || prev.workshop_address,
            team_name: d.team_name || d.teamName || prev.team_name,
            booking_notice: d.booking_notice || d.bookingNotice || prev.booking_notice,
            warranty_policy_enabled: d.warranty_policy_enabled ?? d.warrantyPolicyEnabled ?? false,
            warranty_policy_days: d.warranty_policy_days || d.warrantyPolicyDays || '30 Ngày',
            warranty_policy_title: d.warranty_policy_title || d.warrantyPolicyTitle || 'Bảo hành hỗ trợ kỹ thuật',
          }));
        }
      } catch (error) {
        console.error('Failed to load home data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const timer = setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [location.hash, loading]);

  const scrollToCalendar = () => {
    const el = document.getElementById('booking-calendar');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const isWarrantyActive = siteInfo.warranty_policy_enabled === true || siteInfo.warranty_policy_enabled === 'true' || siteInfo.warranty_policy_enabled === '1';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-orange-500 selection:text-white">
      {/* 1. HERO SECTION WITH DYNAMIC ANIMATED COG BACKGROUND */}
      <section className="relative pt-10 pb-16 md:pt-14 md:pb-20 overflow-hidden bg-gradient-to-b from-orange-50/60 via-white to-slate-50">
        {/* Dynamic Animated Gear Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
          {/* Ambient warm orange glows */}
          <div className="absolute -top-24 right-1/4 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-20 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl" />

          {/* Primary large rotating gear */}
          <div className="absolute -top-12 -right-12 md:right-10 md:top-6 w-56 h-56 md:w-72 md:h-72 opacity-[0.14] animate-[spin_40s_linear_infinite]">
            <img src="/cog-orange.svg" alt="" className="w-full h-full object-contain" />
          </div>

          {/* Interlocking counter-rotating gear */}
          <div className="absolute top-44 -right-8 md:right-64 md:top-40 w-36 h-36 md:w-44 md:h-44 opacity-[0.10] animate-[spin_24s_linear_infinite_reverse]">
            <img src="/cog-orange.svg" alt="" className="w-full h-full object-contain" />
          </div>

          {/* Left accent floating gear */}
          <div className="absolute top-28 -left-8 md:left-12 w-28 h-28 md:w-36 md:h-36 opacity-[0.09] animate-[spin_32s_linear_infinite]">
            <img src="/cog-orange.svg" alt="" className="w-full h-full object-contain" />
          </div>
        </div>

        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Main Headline - Bold, Thick typography */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.12] mb-6">
              Hạ nhiệt tức thì cho PC &amp; Laptop.{' '}
              <span className="text-[#ff6b35] block sm:inline font-black">
                Đặt lịch tiếp nhận tại {siteInfo.team_name}.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Giải pháp chăm sóc phần cứng chuẩn phòng lab của {siteInfo.team_name}. Đặt lịch hẹn trước tối thiểu 4 tiếng, mang máy tới phòng làm việc ({siteInfo.workshop_address}) để kỹ thuật viên đón tiếp, kiểm tra &amp; bảo dưỡng trực tiếp!
            </p>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <button
                onClick={scrollToCalendar}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#ff6b35] hover:bg-[#e85d2d] text-white font-bold text-base rounded-xl shadow-lg shadow-orange-500/25 transition cursor-pointer"
              >
                <span>Xem lịch trống &amp; Đặt ngay</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <Link
                to="/services"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-base rounded-xl border border-slate-200 shadow-2xs transition"
              >
                Xem chi tiết các gói
              </Link>
            </div>

            {/* Guarantee Pills */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm font-semibold text-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Đặt trước tối thiểu 4 tiếng</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-orange-600" />
                <span>KTV trễ hẹn &gt; 30p làm FREE 100% (0đ)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>{siteInfo.workshop_address}</span>
              </div>
            </div>
          </div>

          {/* Interactive Calendar Widget (Primary Hero Conversion Asset) */}
          <div id="booking-calendar" className="mt-14 scroll-mt-24">
            <CalendarWidget />
          </div>
        </div>
      </section>

      {/* 2. STATS & PROOF SECTION (Dynamic real stats from database; warranty shown dynamically if enabled by Admin) */}
      <section className="py-12 bg-white border-y border-slate-200">
        <div className="container">
          <div className={`grid gap-8 text-center ${isWarrantyActive ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'}`}>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono">
                {siteInfo.stats?.completed_orders_count !== undefined && siteInfo.stats.completed_orders_count > 0
                  ? `${siteInfo.stats.completed_orders_count}+`
                  : `${siteInfo.stats?.total_orders_count || 10}+`}
              </div>
              <div className="text-xs sm:text-sm text-slate-500 font-medium mt-1">Máy tính đã vệ sinh an toàn</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-orange-600 font-mono">
                {siteInfo.stats?.satisfaction_percent ? `${siteInfo.stats.satisfaction_percent}%` : '100%'}
              </div>
              <div className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Khách hàng hài lòng 5 sao ({siteInfo.stats?.total_reviews || 0} đánh giá)
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono">&lt; 30p</div>
              <div className="text-xs sm:text-sm text-slate-500 font-medium mt-1">Cam kết đúng hẹn tuyệt đối</div>
            </div>
            {isWarrantyActive && (
              <div>
                <div className="text-3xl sm:text-4xl font-black text-emerald-600 font-mono">{siteInfo.warranty_policy_days || '30 Ngày'}</div>
                <div className="text-xs sm:text-sm text-slate-500 font-medium mt-1">{siteInfo.warranty_policy_title || 'Bảo hành hỗ trợ kỹ thuật'}</div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS (4 STEPS - Sharp high-contrast numbers 01, 02, 03, 04, removed 'Quy trình phục vụ' badge) */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              4 Bước tiếp nhận &amp; bảo dưỡng máy tính chuyên nghiệp
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Trực tiếp quan sát kỹ thuật viên thao tác trên thiết bị của bạn với đầy đủ đồ nghề chuyên dụng.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs relative">
              <span className="text-lg font-black text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200/80 absolute top-5 right-5">
                01
              </span>
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">Đặt lịch online</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Chọn slot giờ trước tối thiểu 4 tiếng, chọn gói dịch vụ và kỹ thuật viên bạn mong muốn.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs relative">
              <span className="text-lg font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/80 absolute top-5 right-5">
                02
              </span>
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">Mang máy tới phòng làm việc</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Mang máy tới {siteInfo.workshop_address} theo giờ hẹn đã đặt. Kỹ thuật viên đón tiếp và xử lý đúng hẹn.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs relative">
              <span className="text-lg font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80 absolute top-5 right-5">
                03
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">Vệ sinh &amp; Tối ưu</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tháo lắp cẩn thận, làm sạch cánh quạt, tra keo tản nhiệt gốm/kim loại lỏng, test stress test nhiệt độ.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs relative">
              <span className="text-lg font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/80 absolute top-5 right-5">
                04
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
                <Gift className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">Nghiệm thu &amp; Voucher</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Kiểm tra máy mượt mà, quét mã QR thanh toán nhanh và nhận Voucher giảm giá cho lần bảo trì sau.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SERVICE PACKAGES */}
      <section className="py-16 md:py-24 bg-white border-t border-slate-200">
        <div className="container">
          <ServicePackages packages={packages} loading={loading} />
        </div>
      </section>

      {/* 5. CUSTOMER REVIEWS */}
      <section className="py-16 md:py-24 bg-slate-50 border-t border-slate-200">
        <div className="container">
          <ReviewSection />
        </div>
      </section>

      {/* 6. TECHNICIAN TEAM */}
      <section className="py-16 md:py-24 bg-white border-t border-slate-200">
        <div className="container">
          <TechnicianGrid technicians={technicians} loading={loading} />
        </div>
      </section>
    </div>
  );
}