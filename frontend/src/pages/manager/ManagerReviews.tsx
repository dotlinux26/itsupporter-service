import { useEffect, useState } from 'react';
import { managerApi } from '../../api/client';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Star,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  MessageSquare,
  Search,
} from 'lucide-react';

export function ManagerReviews() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const response = await managerApi.reviews();
      setReviews(response.data?.data || []);
    } catch (error) {
      console.error('Failed to load reviews:', error);
      showFeedback('error', 'Không thể tải danh sách đánh giá.');
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleDeleteReview = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa đánh giá này khỏi hệ thống?')) return;
    try {
      await managerApi.deleteReview(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      showFeedback('success', 'Đã xóa đánh giá thành công.');
    } catch (err: any) {
      showFeedback('error', 'Xóa đánh giá thất bại.');
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (ratingFilter && r.rating !== Number(ratingFilter)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.order_code?.toLowerCase().includes(q) ||
        r.customer_name?.toLowerCase().includes(q) ||
        r.technician_name?.toLowerCase().includes(q) ||
        r.content?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length).toFixed(1)
      : '5.0';

  return (
    <div className="container py-10 md:py-12 max-w-6xl mx-auto space-y-8">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Star className="w-7 h-7 text-amber-500 fill-amber-500" />
            Quản lý đánh giá & Phản hồi khách hàng
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Theo dõi chất lượng dịch vụ của kỹ thuật viên và kiểm duyệt đánh giá công khai.
          </p>
        </div>

        <div className="card px-5 py-3 bg-amber-50/60 border-amber-200 flex items-center gap-3 self-start sm:self-auto">
          <div className="flex items-center gap-1 text-amber-500">
            <Star className="w-6 h-6 fill-current" />
          </div>
          <div>
            <span className="text-xs text-amber-800 font-semibold block">Đánh giá trung bình</span>
            <span className="text-xl font-bold text-amber-900">{avgRating} / 5.0 ⭐</span>
          </div>
        </div>
      </div>

      {/* FEEDBACK TOAST */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2.5 text-sm font-medium">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* FILTER & SEARCH */}
      <div className="card p-5 bg-white flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo mã đơn, khách hàng, KTV hoặc nội dung..."
            className="input pl-10 pr-4 text-xs font-medium w-full"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="input text-xs font-medium w-full sm:w-44"
          >
            <option value="">Tất cả số sao</option>
            <option value="5">⭐⭐⭐⭐⭐ 5 Sao</option>
            <option value="4">⭐⭐⭐⭐ 4 Sao</option>
            <option value="3">⭐⭐⭐ 3 Sao</option>
            <option value="2">⭐⭐ 2 Sao</option>
            <option value="1">⭐ 1 Sao</option>
          </select>

          {(ratingFilter || searchQuery) && (
            <button
              onClick={() => {
                setRatingFilter('');
                setSearchQuery('');
              }}
              className="btn btn-outline text-xs px-3 whitespace-nowrap"
            >
              Xóa lọc
            </button>
          )}
        </div>
      </div>

      {/* REVIEWS TABLE */}
      <div className="card overflow-hidden bg-white">
        {loading ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-500">Đang tải danh sách đánh giá...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="text-base font-semibold text-gray-700">Chưa có đánh giá nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Mã đơn</th>
                  <th className="py-3 px-4">Khách hàng</th>
                  <th className="py-3 px-4">Kỹ thuật viên</th>
                  <th className="py-3 px-4">Gói dịch vụ</th>
                  <th className="py-3 px-4">Số sao</th>
                  <th className="py-3 px-4">Nội dung phản hồi</th>
                  <th className="py-3 px-4">Ngày gửi</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredReviews.map((review) => (
                  <tr key={review.id} className="hover:bg-orange-50/20 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-primary">
                      {review.order_code}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      {review.customer_name}
                    </td>
                    <td className="py-3.5 px-4">
                      {review.technician_name ? (
                        <span className="font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          🛠️ {review.technician_name}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">{review.package_name}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-0.5">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-700 max-w-sm">
                      <p className="line-clamp-2">{review.content || 'Khách hàng không để lại lời nhắn.'}</p>
                    </td>
                    <td className="py-3.5 px-4 text-gray-400 text-[11px]">
                      {review.created_at
                        ? format(new Date(review.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })
                        : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteReview(review.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Xóa đánh giá"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}