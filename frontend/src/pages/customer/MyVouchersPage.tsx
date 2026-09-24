import { useEffect, useState } from 'react';
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
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách voucher';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVouchers();
  }, []);

  return (
    <div className="container py-10 md:py-12 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            <Ticket className="w-7 h-7 text-orange-600" />
            Voucher của tôi
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Danh sách các mã ưu đãi đặc biệt dành riêng cho bạn khi sử dụng dịch vụ IT Supporter.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 flex items-center gap-2 text-sm border border-red-200">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-text-secondary mt-3">Đang tải voucher...</p>
        </div>
      ) : vouchers.length === 0 ? (
        <div className="card p-12 text-center text-text-secondary">
          <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-base text-gray-700">Bạn chưa có voucher nào</p>
          <p className="text-sm text-gray-500 mt-1">
            Sau khi kỹ thuật viên hoàn thành dịch vụ, bạn có thể nhận được voucher tri ân qua khung chat!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
          {vouchers.map((v) => (
            <VoucherCard
              key={v.id}
              code={v.code}
              name={v.program_name}
              description={v.description || 'Ưu đãi dành cho khách hàng thân thiết'}
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
