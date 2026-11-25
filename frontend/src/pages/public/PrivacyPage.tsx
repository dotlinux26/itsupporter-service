import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { publicApi } from '../../api/client';
import { MarkdownRenderer } from '../../components/MarkdownRenderer';
import { useSEO } from '../../hooks/useSEO';

export function PrivacyPage() {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');
  const [content, setContent] = useState<{ vi: string; en: string }>({ vi: '', en: '' });

  useSEO({
    title: `${t('termsPage.dataUseTitle')} | IT Supporter HaUI`,
    description: t('termsPage.dataUseIntro'),
    canonical: 'https://itsupporter.io.vn/privacy',
  });

  useEffect(() => {
    publicApi.info().then((res) => {
      const info = res.data?.data;
      if (!info) return;
      setContent({
        vi: info.privacy_markdown || '',
        en: info.privacy_markdown_en || info.privacy_markdown || '',
      });
    }).catch((err) => {
      console.error('Failed to load privacy policy:', err);
    });
  }, []);

  const localizedContent = isEn ? content.en || content.vi : content.vi;

  return (
    <div className="container py-5 sm:py-8 md:py-12 max-w-4xl mx-auto space-y-8">
      {localizedContent ? (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs">
          <MarkdownRenderer content={localizedContent} className="leading-relaxed" />
        </div>
      ) : (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h1 className="text-3xl font-black text-slate-900">{t('termsPage.dataUseTitle')}</h1>
          <p className="text-text-secondary">{t('termsPage.dataUseIntro')}</p>
          <ul className="space-y-3 text-text-secondary">
            <li>• {t('termsPage.dataUseAccount')}</li>
            <li>• {t('termsPage.dataUseOrder')}</li>
            <li>• {t('termsPage.dataUseRecovery')}</li>
            <li>• {t('termsPage.dataUseTurnstile')}</li>
          </ul>
        </div>
      )}
    </div>
  );
}
