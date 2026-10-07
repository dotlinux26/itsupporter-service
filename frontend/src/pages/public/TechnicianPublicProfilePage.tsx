import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { publicApi } from '../../api/client';
import { Avatar } from '../../components/Avatar';
import { MarkdownRenderer } from '../../components/MarkdownRenderer';
import { useSEO } from '../../hooks/useSEO';
import {
  Star,
  CheckCircle2,
  Calendar,
  Share2,
  Wrench,
  Award,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';

export function TechnicianPublicProfilePage() {
  const { alias } = useParams<{ alias: string }>();
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');
  const navigate = useNavigate();

  const [tech, setTech] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!alias) return;
    loadProfile();
  }, [alias]);

  const loadProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await publicApi.technicianProfile(alias!);
      setTech(res.data?.data);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
        (isEn ? 'Technician profile not found or inactive.' : 'Không tìm thấy hồ sơ kỹ thuật viên hoặc tài khoản tạm dừng.')
      );
    } finally {
      setLoading(false);
    }
  };

  useSEO({
    title: tech ? `${tech.name} | Kỹ thuật viên IT Supporter HaUI` : 'Kỹ thuật viên IT Supporter',
    description: tech?.bio || 'Hồ sơ kỹ thuật viên dịch vụ bảo dưỡng, sửa chữa máy tính IT Supporter.',
    canonical: `https://service.ghedahaui.online/ktv/${alias}`,
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Parse public profile skills and article if JSON
  let skills: string[] = [];
  let articleMarkdown = '';

  if (tech?.public_profile) {
    try {
      const parsed = JSON.parse(tech.public_profile);
      if (parsed && typeof parsed === 'object') {
        skills = Array.isArray(parsed.skills) ? parsed.skills : [];
        articleMarkdown = parsed.article || parsed.markdown || parsed.content || '';
      } else {
        articleMarkdown = String(parsed);
      }
    } catch {
      articleMarkdown = tech.public_profile;
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500 font-medium">
            {isEn ? 'Loading technician profile...' : 'Đang tải thông tin kỹ thuật viên...'}
          </p>
        </div>
      </div>
    );
  }

  if (error || !tech) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-sm space-y-4">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">
            {isEn ? 'Profile Not Found' : 'Không tìm thấy Kỹ thuật viên'}
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {error || (isEn ? 'The requested technician profile does not exist.' : 'Đường dẫn kỹ thuật viên không chính xác hoặc đã thay đổi.')}
          </p>
          <div className="pt-2">
            <Link
              to="/services"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <span>{isEn ? 'Browse Services' : 'Xem các dịch vụ IT'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12">
      <div className="container max-w-4xl mx-auto px-4 space-y-6">
        {/* Profile Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs relative overflow-hidden">
          {/* Subtle decorative background gradient */}
          <div className="absolute top-0 right-0 w-80 h-40 bg-gradient-to-bl from-orange-100/60 via-amber-50/30 to-transparent rounded-bl-full pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
            <div className="relative">
              <Avatar
                src={tech.avatar_url}
                name={tech.name}
                size={96}
                className="ring-4 ring-orange-100 shadow-md"
              />
              <div
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center text-white"
                title={isEn ? 'Verified Technician' : 'Kỹ thuật viên chính thức'}
              >
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {tech.name}
                </h1>
                {tech.alias && (
                  <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                    @{tech.alias}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {isEn ? 'Certified Tech · IT Supporter' : 'KTV Chính thức · IT Supporter'}
                </span>
              </div>

              {tech.bio ? (
                <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
                  {tech.bio}
                </p>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  {isEn ? 'Professional IT Supporter Technician at HaUI Workshop.' : 'Kỹ thuật viên hỗ trợ máy tính chuyên nghiệp tại Workshop IT Supporter HaUI.'}
                </p>
              )}

              {/* Stats Bar */}
              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-6 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <div className="flex text-amber-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= Math.round(Number(tech.rating || 5))
                            ? 'fill-amber-500 text-amber-500'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-amber-600 font-extrabold">{Number(tech.rating || 5).toFixed(1)}</span>
                  <span className="text-slate-400 font-normal">({tech.rating_count || 0} {isEn ? 'reviews' : 'đánh giá'})</span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                  <Wrench className="w-4 h-4 text-orange-600" />
                  <span>{tech.completed_orders_count || 0} {isEn ? 'completed jobs' : 'ca hoàn thành'}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-col gap-2.5 w-full sm:w-auto mt-2 sm:mt-0">
              <button
                type="button"
                onClick={() => navigate(`/booking?techId=${tech.id}`)}
                className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-orange-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>{isEn ? 'Book With This Tech' : 'Đặt lịch với KTV này'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4 text-slate-600" />}
                <span>{copied ? (isEn ? 'Link Copied!' : 'Đã sao chép link!') : (isEn ? 'Share Profile' : 'Chia sẻ trang')}</span>
              </button>
            </div>
          </div>

          {/* Skills / Specializations tags */}
          {skills.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-primary" />
                <span>{isEn ? 'Specializations & Skills' : 'Chuyên môn & Kỹ năng nổi bật'}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold border border-slate-200"
                  >
                    ✓ {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Detailed Article / Introduction if available */}
        {articleMarkdown && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-600" />
              <span>{isEn ? 'About the Technician' : 'Giới thiệu chi tiết & Kinh nghiệm'}</span>
            </h2>
            <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed">
              <MarkdownRenderer content={articleMarkdown} />
            </div>
          </div>
        )}

        {/* Customer Reviews Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-500" />
                <span>{isEn ? 'Customer Reviews' : 'Đánh giá từ khách hàng thực tế'}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEn ? 'Genuine feedback from completed service appointments' : 'Phản hồi thực tế từ các ca sửa chữa đã hoàn thành'}
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-amber-50 text-amber-800 rounded-xl border border-amber-200">
              {tech.reviews?.length || 0} {isEn ? 'Reviews' : 'Nhận xét'}
            </span>
          </div>

          {!tech.reviews || tech.reviews.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200/60 text-slate-400 space-y-2">
              <Star className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-medium">
                {isEn ? 'No customer reviews yet for this technician.' : 'Chưa có lượt đánh giá nào cho kỹ thuật viên này.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {tech.reviews.map((rev: any) => (
                <div
                  key={rev.id}
                  className="p-4 bg-slate-50/80 hover:bg-slate-50 rounded-2xl border border-slate-200/70 transition space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-700 font-bold text-xs flex items-center justify-center">
                        {rev.customer_name ? rev.customer_name[0] : 'K'}
                      </div>
                      <div>
                        <span className="font-bold text-xs text-slate-800 block">
                          {rev.customer_name}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {rev.package_name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="flex text-amber-500">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              star <= rev.rating
                                ? 'fill-amber-500 text-amber-500'
                                : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        {rev.created_at ? new Date(rev.created_at).toLocaleDateString(isEn ? 'en-US' : 'vi-VN') : ''}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap pl-9">
                    {rev.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
