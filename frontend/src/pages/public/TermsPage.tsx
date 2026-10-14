import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSEO } from '../../hooks/useSEO';
import { publicApi } from '../../api/client';
import { MarkdownRenderer } from '../../components/MarkdownRenderer';

export function TermsPage() {
  const { t } = useTranslation();
  const [termsMarkdown, setTermsMarkdown] = useState<string>('');

  useSEO({
    title: t('termsPage.seoTitle'),
    description: t('termsPage.seoDesc'),
    keywords: t('termsPage.seoKeywords'),
    canonical: 'https://itsupporter.io.vn/terms',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': 'https://itsupporter.io.vn/terms#webpage',
      url: 'https://itsupporter.io.vn/terms',
      name: 'Quy định & Cam kết dịch vụ - IT Supporter HaUI',
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
            name: 'Điều khoản dịch vụ',
            item: 'https://itsupporter.io.vn/terms'
          }
        ]
      }
    }
  });

  useEffect(() => {
    publicApi.info().then((res) => {
      if (res.data?.data?.terms_markdown) {
        setTermsMarkdown(res.data.data.terms_markdown);
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="container py-5 sm:py-8 md:py-12 max-w-4xl mx-auto space-y-8">
      {termsMarkdown ? (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs">
          <MarkdownRenderer content={termsMarkdown} className="leading-relaxed" />
        </div>
      ) : (
        <>
          <div className="mb-10 text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">{t('termsPage.title')}</h1>
            <p className="text-sm sm:text-base text-slate-500 mt-2">
              {t('termsPage.subtitle')}
            </p>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-text mb-4">{t('termsPage.forCustomers')}</h2>
              <ul className="space-y-2 text-text-secondary">
                <li>• {t('termsPage.bookingRules')}</li>
                <li>• {t('termsPage.rescheduleRules')}</li>
                <li>• {t('termsPage.cancelRules')}</li>
                <li>• <strong>{t('termsPage.punctualityCommitment')}</strong>
                  <ul className="pl-6 mt-1 space-y-1 list-disc text-sm">
                    <li>{t('termsPage.late10to29')}</li>
                    <li>{t('termsPage.lateOver30')}</li>
                  </ul>
                </li>
                <li>• <strong>{t('termsPage.voucherRules')}</strong>
                  <ul className="pl-6 mt-1 space-y-1 list-disc text-sm">
                    <li>{t('termsPage.voucherSaleEvent')}</li>
                    <li>{t('termsPage.voucherGift')}</li>
                  </ul>
                </li>
                <li>• {t('termsPage.paymentRules')}</li>
                <li>• {t('termsPage.usageRules')}</li>
                <li>• {t('termsPage.reviewRules')}</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-text mb-4">{t('termsPage.forTechnicians')}</h2>
              <ul className="space-y-2 text-text-secondary">
                <li>• {t('termsPage.techAcceptOrder')}</li>
                <li>• {t('termsPage.techPunctuality')}</li>
                <li>• {t('termsPage.techExecution')}</li>
                <li>• {t('termsPage.techVouchers')}</li>
                <li>• {t('termsPage.techPayment')}</li>
                <li>• {t('termsPage.techResponsibility')}</li>
              </ul>
            </div>
          </div>
        </>
      )}

        <div>
          <h2 className="text-xl font-semibold text-text mb-4">{t('termsPage.complaints')}</h2>
          <p className="text-text-secondary mb-4">{t('termsPage.complaintsNotice')}</p>
          <ul className="space-y-2 text-text-secondary">
            <li>
              {t('termsPage.fanpage')}{' '}
              <a 
                href="https://www.facebook.com/itsupporter.haui/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 hover:text-blue-700 font-semibold underline decoration-blue-300 underline-offset-2"
              >
                IT Supporter HaUI
              </a>
            </li>
          </ul>
        </div>
    </div>
  );
}