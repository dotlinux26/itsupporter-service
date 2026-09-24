import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Avatar } from './Avatar';
import { 
  Star, 
  Wrench, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Calendar, 
  ArrowRight,
  Clock,
  Laptop
} from 'lucide-react';
import type { TechnicianBrief } from '@/types';

interface TechnicianGridProps {
  technicians: TechnicianBrief[];
  loading: boolean;
}

export function TechnicianGrid({ technicians, loading }: TechnicianGridProps) {
  const { t } = useTranslation();
  const [startIndex, setStartIndex] = useState(0);
  const [selectedTech, setSelectedTech] = useState<TechnicianBrief | null>(null);

  const CARDS_PER_VIEW = 4;

  const handlePrev = () => {
    setStartIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setStartIndex((prev) => Math.min(technicians.length - CARDS_PER_VIEW, prev + 1));
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse bg-slate-100 rounded-2xl h-56" />
        ))}
      </div>
    );
  }

  if (!technicians.length) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p>{t('home.technicians')}: Hiện chưa có kỹ thuật viên nào trong ca</p>
      </div>
    );
  }

  const visibleTechnicians = technicians.slice(startIndex, startIndex + CARDS_PER_VIEW);
  const canPrev = startIndex > 0;
  const canNext = startIndex + CARDS_PER_VIEW < technicians.length;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {t('home.technicians')}
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Đội ngũ sinh viên kỹ thuật nhiệt huyết HaUI, thao tác cẩn thận, minh bạch và tận tâm hỗ trợ trực tiếp.
          </p>
        </div>

        {/* Carousel controls: round < and > buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handlePrev}
            disabled={!canPrev}
            aria-label="Kỹ thuật viên trước"
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
              canPrev
                ? 'bg-white border-slate-300 text-slate-700 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 shadow-xs cursor-pointer active:scale-95'
                : 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            disabled={!canNext}
            aria-label="Kỹ thuật viên tiếp theo"
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
              canNext
                ? 'bg-white border-slate-300 text-slate-700 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 shadow-xs cursor-pointer active:scale-95'
                : 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed'
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Grid of Cards (Slider view) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {visibleTechnicians.map((tech) => {
          let parsedProfile: { skills?: string[]; experience_years?: number } = {};
          try {
            if (tech.public_profile) {
              parsedProfile = typeof tech.public_profile === 'string' 
                ? JSON.parse(tech.public_profile) 
                : tech.public_profile;
            }
          } catch {}

          const skills = parsedProfile.skills || ['Vệ sinh PC/Laptop', 'Tra keo tản nhiệt'];

          return (
            <div
              key={tech.id}
              onClick={() => setSelectedTech(tech)}
              className="bg-white rounded-2xl p-6 text-center border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-orange-400 transition-all group flex flex-col justify-between items-center cursor-pointer relative"
            >
              <div className="w-full flex flex-col items-center">
                {/* Avatar with Online/Active Badge */}
                <div className="mb-4 relative">
                  <Avatar
                    name={tech.name}
                    src={tech.avatar_url}
                    size={72}
                    className="shadow-2xs group-hover:scale-105 transition-transform"
                  />
                  <span
                    className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-2xs"
                    title="Sẵn sàng nhận ca"
                  />
                </div>

                {/* Name & Role */}
                <h4 className="font-bold text-slate-900 text-base group-hover:text-orange-600 transition-colors">
                  {tech.name}
                </h4>
                <p className="text-slate-500 text-xs mt-1 flex items-center gap-1 font-medium">
                  <Wrench className="w-3.5 h-3.5 text-orange-500" /> KTV IT Supporter HaUI
                </p>

                {/* Short Bio snippet */}
                <p className="text-slate-600 text-xs mt-2 line-clamp-2 leading-relaxed px-1">
                  {tech.bio || 'Chuyên viên kỹ thuật phần cứng máy tính và tối ưu hệ thống nhiệt độ.'}
                </p>

                {/* Skills tags preview */}
                <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                  {skills.slice(0, 2).map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                  {skills.length > 2 && (
                    <span className="px-1.5 py-0.5 bg-orange-50 text-orange-600 rounded-md text-[10px] font-semibold">
                      +{skills.length - 2}
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom rating & detail link */}
              <div className="w-full pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="inline-flex items-center gap-1 font-semibold text-slate-800">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{tech.rating ? tech.rating.toFixed(1) : '5.0'}</span>
                  <span className="text-slate-400 text-[10px]">({tech.rating_count || 12})</span>
                </div>
                <span className="text-orange-600 font-semibold group-hover:underline flex items-center gap-0.5 text-xs">
                  Xem hồ sơ <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* DETAIL MODAL / WIDGET */}
      {selectedTech && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setSelectedTech(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative overflow-hidden animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedTech(null)}
              aria-label="Đóng"
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-start gap-4 mb-6">
              <Avatar
                name={selectedTech.name}
                src={selectedTech.avatar_url}
                size={80}
                className="shadow-sm border-2 border-orange-100 shrink-0"
              />
              <div className="pr-6">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Sẵn sàng tiếp nhận máy
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  {selectedTech.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <Laptop className="w-3.5 h-3.5 text-orange-500" /> Kỹ thuật viên IT Supporter · ĐH Công nghiệp Hà Nội
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center text-amber-500 text-xs font-bold gap-1 bg-amber-50 px-2 py-0.5 rounded-md">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{selectedTech.rating ? selectedTech.rating.toFixed(1) : '5.0'} / 5.0</span>
                  </div>
                  <span className="text-slate-400 text-xs">({selectedTech.rating_count || 12} đánh giá hoàn tất)</span>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="space-y-5 text-sm">
              {/* Bio description */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Giới thiệu & Chuyên môn
                </h4>
                <p className="text-slate-700 leading-relaxed text-xs sm:text-sm bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  {selectedTech.bio || 'Kỹ thuật viên sinh viên khoa CNTT - Đại học Công nghiệp Hà Nội. Đã qua đào tạo bài bản quy trình 9 bước vệ sinh phần cứng an toàn, tra keo tản nhiệt và stress-test hiệu năng.'}
                </p>
              </div>

              {/* Skills */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Kỹ năng thao tác thực tế
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    let skills: string[] = [];
                    try {
                      if (selectedTech.public_profile) {
                        const parsed = typeof selectedTech.public_profile === 'string' 
                          ? JSON.parse(selectedTech.public_profile) 
                          : selectedTech.public_profile;
                        skills = parsed.skills || [];
                      }
                    } catch {}
                    if (!skills.length) {
                      skills = [
                        'Tháo lắp Laptop / PC chống tĩnh điện',
                        'Tra keo tản nhiệt gốm & kim loại lỏng',
                        'Vệ sinh cánh quạt & tra dầu trục quạt',
                        'Kiểm tra nhiệt độ & Stress-test'
                      ];
                    }
                    return skills.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-orange-50 text-orange-800 border border-orange-200/60 rounded-lg text-xs font-medium flex items-center gap-1.5"
                      >
                        <Wrench className="w-3 h-3 text-orange-600" />
                        {s}
                      </span>
                    ));
                  })()}
                </div>
              </div>

              {/* Shift info */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 text-xs text-slate-600 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span>Ca tiếp nhận: 07:00 - 19:00 (Thứ 2 - Thứ 7)</span>
                </div>
                <div className="flex items-center gap-1 text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Đặt trước ≥ 4h</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-7 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedTech(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition cursor-pointer"
              >
                Đóng
              </button>
              <Link
                to={`/booking?technicianId=${selectedTech.id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-600/20 transition cursor-pointer"
              >
                <span>Đặt lịch với KTV {selectedTech.name}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}