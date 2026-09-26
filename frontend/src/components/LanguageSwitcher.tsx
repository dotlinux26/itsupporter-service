import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'compact' | 'pill';
}

export function LanguageSwitcher({ className = '', variant = 'pill' }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'vi';

  const switchLanguage = (lang: 'vi' | 'en') => {
    if (lang === currentLang) return;
    i18n.changeLanguage(lang);
    try {
      localStorage.setItem('i18n_lang', lang);
    } catch {
      // ignore storage errors
    }
  };

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={() => switchLanguage(currentLang === 'vi' ? 'en' : 'vi')}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
          currentLang === 'vi'
            ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
            : 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 hover:border-orange-300'
        } ${className}`}
        title={currentLang === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
        aria-label="Chuyển đổi ngôn ngữ"
      >
        <Languages className="w-3.5 h-3.5 text-primary" />
        <span className="uppercase tracking-wider font-bold">
          {currentLang.toUpperCase()}
        </span>
      </button>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-0.5 bg-slate-100/90 border border-slate-200/80 rounded-lg p-0.5 text-xs font-semibold select-none ${className}`}
      role="group"
      aria-label="Chọn ngôn ngữ"
    >
      <div className="pl-1.5 pr-1 text-slate-400 flex items-center" aria-hidden="true">
        <Languages className="w-3.5 h-3.5 text-slate-500" />
      </div>
      <button
        type="button"
        onClick={() => switchLanguage('vi')}
        className={`px-1.5 py-0.5 rounded transition-all text-[11px] font-bold ${
          currentLang === 'vi'
            ? 'bg-white text-orange-600 shadow-xs'
            : 'text-slate-500 hover:text-slate-900'
        }`}
        title="Tiếng Việt"
        aria-pressed={currentLang === 'vi'}
      >
        VI
      </button>
      <button
        type="button"
        onClick={() => switchLanguage('en')}
        className={`px-1.5 py-0.5 rounded transition-all text-[11px] font-bold ${
          currentLang === 'en'
            ? 'bg-white text-orange-600 shadow-xs'
            : 'text-slate-500 hover:text-slate-900'
        }`}
        title="English"
        aria-pressed={currentLang === 'en'}
      >
        EN
      </button>
    </div>
  );
}
