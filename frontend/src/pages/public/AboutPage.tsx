import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { publicApi } from '../../api/client';
import { useSEO } from '../../hooks/useSEO';
import { MarkdownRenderer } from '../../components/MarkdownRenderer';

export function AboutPage() {
  const { t } = useTranslation();

  useSEO({
    title: t('about.seoTitle'),
    description: t('about.seoDesc'),
    keywords: t('about.seoKeywords'),
    canonical: 'https://itsupporter.io.vn/about',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      '@id': 'https://itsupporter.io.vn/about#webpage',
      url: 'https://itsupporter.io.vn/about',
      name: 'Về chúng tôi - IT Supporter HaUI',
      isPartOf: {
        '@type': 'WebSite',
        '@id': 'https://itsupporter.io.vn/#website',
        name: 'IT Supporter Service HaUI',
        url: 'https://itsupporter.io.vn/'
      },
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Trang chủ',
            item: 'https://itsupporter.io.vn/'
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Về chúng tôi',
            item: 'https://itsupporter.io.vn/about'
          }
        ]
      }
    }
  });

  const [info, setInfo] = useState<any>({
    team_name: 'IT Supporter HaUI',
    university: 'Đại học Công nghiệp Hà Nội',
    workshop_address: 'Phòng 1603, Tòa A1, Cơ sở 1 - Đại học Công nghiệp Hà Nội',
    contact_phone: '0337.616.423',
    email: 'it.supporter@fit-haui.edu.vn',
    facebook_page: 'https://www.facebook.com/itsupporter.haui/',
    distributor_name: 'dotlinux26',
    distributor_url: 'https://github.com/dotlinux26',
    about_markdown: '',
  });

  useEffect(() => {
    publicApi.info().then(res => {
      if (res.data?.data) {
        setInfo((prev: any) => ({ ...prev, ...res.data.data }));
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="container py-5 sm:py-8 md:py-12 max-w-4xl mx-auto space-y-10">
      {info.about_markdown ? (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs">
          <MarkdownRenderer content={info.about_markdown} className="leading-relaxed" />
        </div>
      ) : (
        <div className="space-y-8">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {t('about.title', { team: info.team_name })}
            </h1>
            <p className="text-sm sm:text-base text-slate-500 mt-2">
              {t('about.subtitle', { university: info.university })}
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">{t('about.introTitle')}</h2>
            <p className="text-text-secondary leading-relaxed">
              {t('about.introDesc', { team: info.team_name })}
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-text mb-4">{t('about.teamTitle')}</h2>
            <p className="text-text-secondary leading-relaxed">
              {t('about.teamDesc', { team: info.team_name, university: info.university })}
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-text mb-4">{t('about.purposeTitle')}</h2>
            <p className="text-text-secondary leading-relaxed">
              {t('about.purposeDesc')}
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-text mb-4">{t('about.servicesTitle')}</h2>
            <ul className="space-y-2 text-text-secondary">
              <li>• {t('about.service1')}</li>
              <li>• {t('about.service2')}</li>
              <li>• {t('about.service3')}</li>
              <li>• {t('about.service4')}</li>
              <li>• {t('about.service5')}</li>
            </ul>
          </div>
        </div>
      )}

      {/* Official Contact & Organization info */}

        <div>
          <h2 className="text-xl font-semibold text-text mb-4">{t('about.contactTitle')}</h2>
          <ul className="space-y-2 text-text-secondary">
            <li>{t('about.hotline')} <a href={`tel:${info.contact_phone?.replace(/\./g, '')}`} className="font-semibold text-orange-600 hover:underline">{info.contact_phone}</a></li>
            <li>{t('about.email')} <a href={`mailto:${info.email}`} className="text-blue-600 hover:underline">{info.email}</a></li>
            <li>
              {t('about.fanpage')}{' '}
              <a 
                href={info.facebook_page} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 hover:text-blue-700 font-semibold underline decoration-blue-300 underline-offset-2"
              >
                {info.team_name}
              </a>
            </li>
            <li>{t('about.workshopAddress')} <strong>{info.workshop_address}</strong></li>
            <li>{t('about.affiliatedUnit')} {info.university}</li>
            <li>
              {t('about.officialDistributor')}{' '}
              <a 
                href={info.distributor_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-orange-600 hover:text-orange-700 font-semibold underline decoration-orange-300 underline-offset-2"
              >
                {info.distributor_name}
              </a>
            </li>
          </ul>
        </div>
    </div>
  );
}