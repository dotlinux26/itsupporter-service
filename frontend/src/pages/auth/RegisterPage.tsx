import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft } from 'lucide-react';
import { useSEO } from '../../hooks/useSEO';

export function RegisterPage() {
  useSEO({
    title: 'Đăng Ký Tài Khoản | IT Supporter HaUI',
    description: 'Tạo tài khoản thành viên IT Supporter HaUI để đặt lịch vệ sinh laptop nhanh chóng, tích lũy điểm và nhận ưu đãi sinh viên.',
    canonical: 'https://itsupporter.vn/register',
  });

  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }

    setLoading(true);

    try {
      await register(name, email, password);
      navigate('/orders', { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.error?.message 
        || err.response?.data?.message 
        || (typeof err.response?.data?.error === 'string' ? err.response?.data?.error : null)
        || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center bg-gray-50 pt-10 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-block mb-6" aria-label="Về trang chủ">
            <img src="/logo_bo3goc.png" alt="IT Supporter" className="w-20 h-20 mx-auto" />
          </Link>
          <h2 className="text-3xl font-bold text-text">{t('auth.register')}</h2>
          <Link to="/" className="mt-2 inline-flex items-center gap-1 text-sm text-text-secondary hover:text-primary transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Trang chủ
          </Link>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-error-light border border-error text-error p-4 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="label">{t('auth.name')}</label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="input"
                placeholder="Nguyễn Văn A"
              />
            </div>

            <div>
              <label htmlFor="email" className="label">{t('auth.email')}</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input"
                placeholder="email@itsupporter.vn"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">{t('auth.password')}</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input"
                minLength={8}
                placeholder="Tối thiểu 8 ký tự"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label">{t('auth.password')} (xác nhận)</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="input"
                placeholder="Nhập lại mật khẩu"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full py-3"
          >
            {loading ? t('common.loading') : t('auth.registerButton')}
          </button>
        </form>

        <div className="text-center">
          <p className="text-sm text-text-secondary">
            {t('auth.haveAccount')}
            <Link to="/login" className="font-medium text-primary hover:underline ml-1">
              {t('auth.login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}