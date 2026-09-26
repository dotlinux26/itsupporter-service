import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MarkdownRenderer } from './MarkdownRenderer';
import { CheckCircle2, ArrowRight, Clock } from 'lucide-react';
import type { ServicePackage } from '@/types';

interface ServicePackagesProps {
  packages: ServicePackage[];
  loading: boolean;
}

export function ServicePackages({ packages, loading }: ServicePackagesProps) {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');
  const { isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse bg-slate-100 rounded-2xl h-80" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {t('home.selectPackage')}
        </h2>
        <p className="text-sm text-slate-500 mt-2">
          {t('packages.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {packages.map((pkg: ServicePackage) => {
          const bookingUrl = isAuthenticated 
            ? `/booking?packageId=${pkg.id}`
            : `/login?redirect=/booking&packageId=${pkg.id}`;

          return (
            <div 
              key={pkg.id} 
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-6 md:p-8">
                {pkg.image && (
                  <img 
                    src={pkg.image} 
                    alt={pkg.name} 
                    className="w-full h-48 object-cover rounded-xl mb-6 group-hover:scale-101 transition-transform" 
                  />
                )}

                <div className="flex items-start justify-between gap-4 mb-3">
                  <h3 className="text-2xl font-bold text-slate-900">{pkg.name}</h3>
                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-orange-600 block">
                      {pkg.price.toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? 'VND' : 'đ'}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{t('packages.allInclusive')}</span>
                  </div>
                </div>

                <div className="text-sm text-slate-600 mb-6 prose prose-sm max-w-none">
                  <MarkdownRenderer content={pkg.description || ''} />
                </div>

                {(() => {
                  let featureList: string[] = [];
                  if (pkg.features) {
                    if (Array.isArray(pkg.features)) {
                      featureList = pkg.features;
                    } else {
                      try {
                        const parsed = JSON.parse(pkg.features);
                        if (Array.isArray(parsed)) featureList = parsed;
                        else featureList = String(pkg.features).split('\n').filter(Boolean);
                      } catch {
                        featureList = String(pkg.features).split('\n').filter(Boolean);
                      }
                    }
                  }
                  if (featureList.length === 0) return null;
                  return (
                    <ul className="space-y-2.5 mb-6 pt-4 border-t border-slate-100">
                      {featureList.map((feature: string, i: number) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  );
                })()}
              </div>

              <div className="px-6 md:px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>{t('packages.duration', { minutes: pkg.duration_minutes || 60 })}</span>
                </div>

                <Link
                  to={bookingUrl}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold rounded-xl shadow-sm transition group"
                >
                  <span>{t('packages.bookThisPackage')}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}