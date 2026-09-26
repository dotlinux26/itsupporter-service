import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { publicApi } from '../api/client';
import { Avatar } from './Avatar';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Star, ChevronDown } from 'lucide-react';

interface PublicReview {
  id: number;
  order_id: number;
  rating: number;
  content: string;
  created_at: string;
  order_code: string;
  package_name: string;
  customer_name: string;
  technician_name: string | null;
}

export function ReviewSection() {
  const { t, i18n } = useTranslation();
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const fetchReviews = async (currentOffset: number, append = false) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);

      const res = await publicApi.reviews({ limit: 10, offset: currentOffset });
      const fetched: PublicReview[] = res.data.data || [];
      const more = res.data.hasMore ?? false;

      if (append) {
        setReviews((prev) => [...prev, ...fetched]);
      } else {
        setReviews(fetched);
      }
      setHasMore(more);
      setOffset(currentOffset + fetched.length);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchReviews(0, false);
  }, []);

  const handleLoadMore = () => {
    fetchReviews(offset, true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-text">{t('home.customerReviews')}</h2>
          <p className="text-sm text-text-secondary mt-1">
            {t('home.reviewsSubtitle')}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-44" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="card p-10 text-center text-text-secondary">
          <p className="text-base font-semibold text-gray-700">{t('home.noReviewsYet')}</p>
          <p className="text-sm text-gray-500 mt-1">{t('home.noReviewsDesc')}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review) => (
              <div key={review.id} className="card p-5 flex flex-col justify-between hover:shadow-md transition-shadow border border-border">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={review.customer_name} size={34} />
                      <div>
                        <div className="text-sm font-semibold text-text">{review.customer_name}</div>
                        <div className="text-xs text-text-muted">
                          {new Date(review.created_at).toLocaleDateString(i18n.language?.startsWith('en') ? 'en-US' : 'vi-VN')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                  </div>

                  <MarkdownRenderer content={review.content} className="text-sm line-clamp-4" />
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-text-muted">
                  <span className="font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                    {review.package_name}
                  </span>
                  {review.technician_name && (
                    <span>{t('orders.technician')}: <strong className="text-gray-700">{review.technician_name}</strong></span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="mt-8 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="btn btn-outline inline-flex items-center gap-1.5 text-sm"
              >
                {loadingMore ? (
                  <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                {t('pagination.loadMore')} ({t('home.olderReviews')})
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}