import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-9xl font-bold text-primary-light mb-4">404</h1>
        <h2 className="text-2xl font-bold text-text mb-4">{t('common.pageNotFound')}</h2>
        <p className="text-text-secondary mb-8">
          {t('common.pageNotFoundDesc')}
        </p>
        <Link to="/" className="btn btn-primary inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> {t('common.backToHome')}
        </Link>
      </div>
    </div>
  );
}