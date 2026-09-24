import { useEffect, useState } from 'react';
import { managerApi } from '../../api/client';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export function ManagerReviews() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const response = await managerApi.reviews();
      setReviews(response.data.data);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-10 md:py-12 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-text mb-6">Quản lý đánh giá</h1>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1,2,3].map(i => <div key={i} className="card p-4 h-20 bg-gray-100 rounded" />)}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-text-secondary border-b border-border">
                <th className="pb-2">Mã đơn</th>
                <th className="pb-2">Khách hàng</th>
                <th className="pb-2">Kỹ thuật viên</th>
                <th className="pb-2">Gói dịch vụ</th>
                <th className="pb-2">Đánh giá</th>
                <th className="pb-2">Nội dung</th>
                <th className="pb-2">Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map(review => (
                <tr key={review.id} className="border-b border-border last:border-none hover:bg-gray-50">
                  <td className="py-3 font-medium">{review.order_code}</td>
                  <td>{review.customer_name}</td>
                  <td>{review.technician_name || '-'}</td>
                  <td>{review.package_name}</td>
                  <td className="flex items-center gap-1">
                    {[...Array(review.rating)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8-2.034c-.784.57-1.638-.197-1.54-1.118l1.07-3.292a1 1 0 00-1.175 0l-2.8-2.034c-.784.57-1.638-.197-1.54-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.78-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    ))}
                  </td>
                  <td className="text-text-secondary max-w-xs truncate">{review.content}</td>
                  <td className="text-text-secondary">{format(new Date(review.created_at), 'dd/MM/yyyy', { locale: vi })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}