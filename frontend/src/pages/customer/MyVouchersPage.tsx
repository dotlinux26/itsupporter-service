import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { voucherApi } from '../../api/client';
import { VoucherCard } from '../../components/VoucherCard';
import { Ticket, AlertCircle } from 'lucide-react';

interface VoucherItem {
  id: number;
  code: string;
  status: 'active' | 'used' | 'expired' | 'voided';
  program_name: string;
  description?: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  valid_to?: string | null;
}

export function MyVouchersPage() {
  const { t } = useTranslation();
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVouchers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await voucherApi.myVouchers();
      setVouchers(res.data.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('voucher.loadError');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVouchers();
  }, []);

  return (
    <div className="container py-5 sm:py-8 md:py-12 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            <Ticket className="w-6 h-6 sm:w-7 sm:h-7 text-orange-600" />
            {t('voucher.myVouchers')}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {t('voucher.myVouchersDesc')}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 sm:mb-6 p-4 rounded-lg bg-red-50 text-red-700 flex items-center gap-2 text-sm border border-red-200">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-12 sm:py-16 text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-text-secondary mt-3">{t('voucher.loadingVouchers')}</p>
        </div>
      ) : vouchers.length === 0 ? (
        <div className="card p-8 sm:p-12 text-center text-text-secondary">
          <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-base text-gray-700">{t('voucher.noVouchers')}</p>
          <p className="text-sm text-gray-500 mt-1">
            {t('voucher.noVouchersDesc')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
          {vouchers.map((v) => (
            <VoucherCard
              key={v.id}
              code={v.code}
              name={v.program_name}
              description={v.description || t('voucher.loyalCustomerDesc')}
              discountType={v.discount_type}
              discountValue={v.discount_value}
              status={v.status}
              validTo={v.valid_to}
            />
          ))}
        </div>
      )}
    </div>
  );
}
