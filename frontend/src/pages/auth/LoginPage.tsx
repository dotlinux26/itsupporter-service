import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Shield, Clock, HelpCircle, Loader2, ArrowRight } from 'lucide-react';
import { useSEO } from '../../hooks/useSEO';
import { AuthenticatorGuideModal } from '../../components/modals/AuthenticatorGuideModal';

export function LoginPage() {
  const { t } = useTranslation();
  useSEO({
    title: t('auth.loginTitle'),
    description: t('auth.loginDesc'),
    canonical: 'https://itsupporter.io.vn/login',
  });

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, login2FA } = useAuth();

  const [step, setStep] = useState<'CREDENTIALS' | '2FA'>('CREDENTIALS');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  const getRoleDefaultPath = (role?: string) => {
    switch (role) {
      case 'ADMIN': return '/admin';
      case 'MANAGER': return '/manager';
      case 'TECHNICIAN': return '/technician';
      default: return '/orders';
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password, rememberMe);
      if (res?.require2FA) {
        setTempToken(res.tempToken);
        setStep('2FA');
        setLoading(false);
        return;
      }
      const targetUrl = searchParams.get('redirect') || getRoleDefaultPath(res?.role);
      navigate(targetUrl, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!twoFactorCode.trim()) {
      setError('Vui lòng nhập mã xác thực 6 số hoặc mã dự phòng.');
      return;
    }

    setLoading(true);
    try {
      const loggedUser = await login2FA(tempToken, twoFactorCode.trim(), rememberMe);
      const targetUrl = searchParams.get('redirect') || getRoleDefaultPath(loggedUser?.role);
      navigate(targetUrl, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Mã xác thực không hợp lệ hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center bg-gray-50 pt-10 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-block mb-6" aria-label={t('auth.backToHome')}>
            <img src="/logo_bo3goc.png" alt="IT Supporter" className="w-20 h-20 mx-auto" />
          </Link>
          <h2 className="text-3xl font-bold text-text">
            {step === 'CREDENTIALS' ? t('auth.login') : 'Xác thực 2 bước (2FA)'}
          </h2>
          <p className="mt-1 text-xs text-text-secondary">
            {step === 'CREDENTIALS' ? (
              <Link to="/" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-primary transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                {t('auth.backToHome')}
              </Link>
            ) : (
              'Bảo mật đăng nhập 2 lớp (Google Authenticator)'
            )}
          </p>
        </div>

        {step === 'CREDENTIALS' ? (
          <form className="mt-8 space-y-6" onSubmit={handleCredentialsSubmit}>
            {error && (
              <div className="bg-error-light border border-error text-error p-4 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
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
                  placeholder="email@itsupporter.io.vn"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="password" className="label mb-0">{t('auth.password')}</label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input"
                  placeholder={t('auth.password')}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                  />
                  <span>{t('auth.rememberMe')}</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3"
            >
              {loading ? t('common.loading') : t('auth.loginButton')}
            </button>
          </form>
        ) : (
          /* STEP 2: 2FA VERIFICATION */
          <form className="mt-8 space-y-6" onSubmit={handle2FASubmit}>
            {error && (
              <div className="bg-error-light border border-error text-error p-4 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 text-xs text-orange-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-orange-900">
                <Shield className="w-4 h-4 text-orange-600" /> Nhập mã bảo mật từ Google Authenticator
              </div>
              <p className="leading-relaxed">
                Tài khoản của bạn đã bật xác thực 2 bước. Mở ứng dụng chọn dòng <b className="text-orange-950 font-mono">2FA_DangNhap</b> để lấy mã 6 chữ số:
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="twoFactorCode" className="label mb-0">Mã 6 chữ số hoặc Mã dự phòng:</label>
                <button
                  type="button"
                  onClick={() => setShowGuideModal(true)}
                  className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
                >
                  <HelpCircle className="w-3 h-3" /> Hướng dẫn
                </button>
              </div>
              <input
                id="twoFactorCode"
                name="twoFactorCode"
                type="text"
                autoFocus
                required
                value={twoFactorCode}
                onChange={e => setTwoFactorCode(e.target.value)}
                placeholder="000000 hoặc XXXX-XXXX"
                className="input text-center text-xl font-mono tracking-widest font-bold"
              />
            </div>

            <div className="text-[11px] text-text-secondary flex items-start gap-1.5 bg-gray-100 p-3 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-gray-500 shrink-0 mt-0.5" />
              <span>Nếu mã luôn báo không hợp lệ, hãy kiểm tra "Đặt giờ tự động" trên điện thoại.</span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setStep('CREDENTIALS');
                  setError('');
                }}
                className="btn btn-secondary flex-1 py-3"
              >
                Quay lại
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary flex-1 py-3 flex items-center justify-center gap-1.5"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Xác thực & Vào
              </button>
            </div>

            <div className="text-center pt-2">
              <Link
                to="/account-recovery"
                className="text-xs text-text-secondary hover:text-primary transition-colors underline"
              >
                Mất thiết bị & không còn mã dự phòng? Cứu tài khoản
              </Link>
            </div>
          </form>
        )}

        <div className="text-center">
          <p className="text-sm text-text-secondary">
            {t('auth.noAccount')}
            <Link to="/register" className="font-medium text-primary hover:underline ml-1">
              {t('auth.register')}
            </Link>
          </p>
        </div>
      </div>

      <AuthenticatorGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
      />
    </div>
  );
}