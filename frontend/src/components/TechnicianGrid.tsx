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
  Laptop,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import type { TechnicianBrief } from '@/types';

interface TechnicianGridProps {
  technicians: TechnicianBrief[];
  loading: boolean;
}

export function TechnicianGrid({ technicians, loading }: TechnicianGridProps) {
  const { t } = useTranslation();
  const [startIndex, setStartIndex] = useState(0);
  const [selectedTech, setSelectedTech] = useState<TechnicianBrief | null>(null);
  const [isArticleExpanded, setIsArticleExpanded] = useState(false);

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
        <p>{t('home.technicians')}: {t('home.noTechniciansInShift')}</p>
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
            {t('home.techniciansSubtitle')}
          </p>
        </div>

        {/* Carousel controls: round < and > buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handlePrev}
            disabled={!canPrev}
            aria-label={t('common.previous')}
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
            aria-label={t('common.next')}
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

          const skills = parsedProfile.skills || [];

          return (
            <div
              key={tech.id}
              onClick={() => {
                setSelectedTech(tech);
                setIsArticleExpanded(false);
              }}
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
                    title={t('home.techReadyForDuty')}
                  />
                </div>

                {/* Name & Role */}
                <h4 className="font-bold text-slate-900 text-base group-hover:text-orange-600 transition-colors">
                  {tech.name}
                </h4>
                <p className="text-slate-500 text-xs mt-1 flex items-center gap-1 font-medium">
                  <Wrench className="w-3.5 h-3.5 text-orange-500" /> {t('home.techRoleBadge')}
                </p>

                {/* Short Bio snippet */}
                <p className="text-slate-600 text-xs mt-2 line-clamp-2 leading-relaxed px-1">
                  {tech.bio || t('home.techDefaultBio')}
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
                  {skills.length === 0 && (
                    <span className="text-[11px] text-slate-400 italic">
                      {t('home.techNoSkills')}
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom rating & detail link */}
              <div className="w-full pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                {tech.rating_count && tech.rating_count > 0 ? (
                  <div className="inline-flex items-center gap-1 font-semibold text-slate-800">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{Number(tech.rating).toFixed(1)}</span>
                    <span className="text-slate-400 text-[10px]">({tech.rating_count})</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                    <Star className="w-3.5 h-3.5 text-slate-300" />
                    <span>{t('common.new')}</span>
                  </div>
                )}
                <span className="text-orange-600 font-semibold group-hover:underline flex items-center gap-0.5 text-xs">
                  {t('home.viewProfile')} <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
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
            className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative animate-scaleUp max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedTech(null)}
              aria-label={t('common.close')}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-start gap-4 mb-4 pr-8 shrink-0">
              <Avatar
                name={selectedTech.name}
                src={selectedTech.avatar_url}
                size={72}
                className="shadow-sm border-2 border-orange-100 shrink-0"
              />
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {t('home.techReadyToReceive')}
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  {selectedTech.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <Laptop className="w-3.5 h-3.5 text-orange-500 shrink-0" /> {t('home.techDefaultBio')}
                </p>
                {selectedTech.rating_count && selectedTech.rating_count > 0 ? (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center text-amber-500 text-xs font-bold gap-1 bg-amber-50 px-2 py-0.5 rounded-md">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{Number(selectedTech.rating).toFixed(1)} / 5.0</span>
                    </div>
                    <span className="text-slate-400 text-xs">({selectedTech.rating_count} {t('home.completedReviews')})</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-slate-400 text-xs bg-slate-50 border border-slate-200/60 px-2.5 py-0.5 rounded-md">
                      {t('home.techNewNoReviews')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="space-y-4 text-sm overflow-y-auto pr-1 flex-1">
              {/* Bio description */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  {t('home.techIntroTitle')}
                </h4>
                <p className="text-slate-700 leading-relaxed text-xs sm:text-sm bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {selectedTech.bio || t('home.techDefaultBio')}
                </p>
              </div>

              {/* Skills */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  {t('home.techSkillsTitle')}
                </h4>
                <div className="flex flex-wrap gap-1.5">
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
                      return (
                        <span className="text-xs text-slate-400 italic">
                          {t('home.techNoSkills')}
                        </span>
                      );
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

              {/* Detailed Markdown Article */}
              {(() => {
                let markdownContent = '';
                try {
                  if (selectedTech.public_profile) {
                    const parsed = typeof selectedTech.public_profile === 'string'
                      ? JSON.parse(selectedTech.public_profile)
                      : selectedTech.public_profile;
                    if (typeof parsed === 'string') {
                      markdownContent = parsed;
                    } else if (parsed && typeof parsed === 'object') {
                      markdownContent = parsed.article || parsed.markdown || parsed.content || parsed.story || parsed.bio_detail || '';
                    }
                  }
                } catch {
                  markdownContent = selectedTech.public_profile || '';
                }

                if (!markdownContent) {
                  markdownContent = `### ${selectedTech.name}
- **${t('footer.servicesAndLinks')}**: IT Supporter - HaUI.
- **${t('home.stepsTitle')}**: 9 steps PC/Laptop care.`;
                }

                const isLongContent = markdownContent.length > 220;

                return (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-orange-500" />
                        {t('home.techArticleTitle')}
                      </h4>
                      {isLongContent && (
                        <button
                          type="button"
                          onClick={() => setIsArticleExpanded(!isArticleExpanded)}
                          className="text-[11px] font-bold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-orange-50 transition cursor-pointer"
                        >
                          {isArticleExpanded ? (
                            <>
                              <span>{t('home.collapse')}</span>
                              <ChevronUp className="w-3.5 h-3.5" />
                            </>
                          ) : (
                            <>
                              <span>{t('home.viewMore')}</span>
                              <ChevronDown className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    <div 
                      className={`bg-slate-50/90 p-3.5 rounded-xl border border-slate-200/80 overflow-y-auto text-xs text-slate-700 leading-relaxed transition-all duration-200 ${
                        isArticleExpanded ? 'max-h-72 shadow-inner' : 'max-h-36'
                      }`}
                    >
                      <MarkdownRenderer content={markdownContent} />
                    </div>
                  </div>
                );
              })()}

              {/* Shift info */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs text-slate-600 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span>{t('home.techShiftTime')}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{t('home.techBookMinAhead')}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedTech(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition cursor-pointer"
              >
                {t('common.close')}
              </button>
              <Link
                to={`/booking?technicianId=${selectedTech.id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-600/20 transition cursor-pointer"
              >
                <span>{t('home.bookWithTechnician', { name: selectedTech.name })}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}