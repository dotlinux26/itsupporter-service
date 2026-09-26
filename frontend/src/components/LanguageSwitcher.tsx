import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

interface LanguageSwitcherProps {
  className?: string;
  theme?: 'light' | 'dark';
}

export function LanguageSwitcher({ className = '', theme = 'light' }: LanguageSwitcherProps) {
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

  const isDark = theme === 'dark';

  return (
    <div
      className={`inline-flex items-center gap-1.5 text-xs select-none ${className}`}
      role="group"
      aria-label={currentLang === 'en' ? 'Select language' : 'Chọn ngôn ngữ'}
    >
      <Languages
        className={`w-3.5 h-3.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
        aria-hidden="true"
      />
      <button
        type="button"
        onClick={() => switchLanguage('vi')}
        className={`transition-colors p-0 text-xs bg-transparent border-none cursor-pointer ${
          currentLang === 'vi'
            ? 'text-orange-600 font-bold'
            : isDark
            ? 'text-slate-500 hover:text-slate-300 font-medium'
            : 'text-slate-400 hover:text-slate-700 font-medium'
        }`}
        title="Tiếng Việt"
        aria-pressed={currentLang === 'vi'}
      >
        VI
      </button>
      <span className={isDark ? 'text-slate-700' : 'text-slate-300'}>/</span>
      <button
        type="button"
        onClick={() => switchLanguage('en')}
        className={`transition-colors p-0 text-xs bg-transparent border-none cursor-pointer ${
          currentLang === 'en'
            ? 'text-orange-600 font-bold'
            : isDark
            ? 'text-slate-500 hover:text-slate-300 font-medium'
            : 'text-slate-400 hover:text-slate-700 font-medium'
        }`}
        title="English"
        aria-pressed={currentLang === 'en'}
      >
        EN
      </button>
    </div>
  );
}
