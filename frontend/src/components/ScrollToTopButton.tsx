import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronUp } from 'lucide-react';

export function ScrollToTopButton() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label={t('common.scrollToTop')}
      title={t('common.scrollToTop')}
      className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-[#ff6b35] text-white shadow-lg flex items-center justify-center hover:bg-[#e85d2d] active:scale-95 transition-all duration-200"
    >
      <ChevronUp className="w-5 h-5" />
    </button>
  );
}
