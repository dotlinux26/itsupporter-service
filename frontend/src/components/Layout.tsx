import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useMemo } from 'react';
import { Avatar } from './Avatar';
import { publicApi } from '../api/client';
import { ExternalLink, ChevronLeft, ChevronRight, Ticket } from 'lucide-react';
import { ScrollToTopButton } from './ScrollToTopButton';
import { NotificationBell } from './NotificationBell';
import { LanguageSwitcher } from './LanguageSwitcher';

export function AppHeader() {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, logout, user } = useAuth();

  // Role-based navigation links
  const navItems = useMemo<{ path: string; label: string }[]>(() => {
    if (!isAuthenticated || user?.role === 'GUEST') {
      return [
        { path: '/', label: t('nav.home') || 'Trang chủ' },
        { path: '/services', label: t('nav.services') || 'Gói dịch vụ' },
        { path: '/about', label: t('nav.about') || 'Về chúng tôi' },
        { path: '/terms', label: t('nav.terms') || 'Quy định' },
      ];
    } else if (user?.role === 'TECHNICIAN') {
      return [
        { path: '/technician', label: 'Bàn làm việc' },
        { path: '/technician/schedule', label: 'Lịch trực' },
        { path: '/technician/orders', label: 'Đơn phụ trách' },
      ];
    } else if (user?.role === 'MANAGER') {
      return [
        { path: '/manager', label: 'Bảng điều khiển' },
        { path: '/manager/orders', label: 'Đơn hàng' },
        { path: '/manager/technicians', label: 'Kỹ thuật viên' },
        { path: '/manager/packages', label: 'Gói dịch vụ' },
        { path: '/manager/settlements', label: 'Quyết toán' },
        { path: '/manager/reviews', label: 'Đánh giá' },
        { path: '/manager/settings', label: 'Cài đặt' },
      ];
    } else if (user?.role === 'ADMIN') {
      return [
        { path: '/admin', label: 'Bảng điều khiển' },
        { path: '/admin/users', label: 'Người dùng' },
        { path: '/admin/stats', label: 'Thống kê' },
        { path: '/admin/vouchers', label: 'Mã giảm giá' },
        { path: '/admin/qr', label: 'Mã QR' },
        { path: '/admin/settings', label: 'Cài đặt' },
      ];
    }
    return [];
  }, [isAuthenticated, user?.role, t]);

  const isCustomer = !user?.role || user?.role === 'GUEST';
  const location = useLocation();
  const PAGE_SIZE = 4;
  const [navPage, setNavPage] = useState(0);

  const totalNavPages = Math.ceil(navItems.length / PAGE_SIZE);

  // Auto-focus the nav page containing the currently active route only when location.pathname changes
  useEffect(() => {
    const activeIndex = navItems.findIndex((item) =>
      item.path === '/' || item.path === '/admin' || item.path === '/manager' || item.path === '/technician'
        ? location.pathname === item.path
        : location.pathname.startsWith(item.path)
    );
    if (activeIndex !== -1) {
      const targetPage = Math.floor(activeIndex / PAGE_SIZE);
      setNavPage(targetPage);
    }
  }, [location.pathname]);

  const displayedNavItems = navItems.length > PAGE_SIZE
    ? navItems.slice(navPage * PAGE_SIZE, (navPage + 1) * PAGE_SIZE)
    : navItems;

  return (
    <header className="border-b border-border bg-white sticky top-0 z-40">
      <div className="container flex items-center justify-between h-16">
        <div className="flex items-center gap-4 lg:gap-8">
          <button
            className="md:hidden p-2 text-text-secondary hover:text-text"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo_bo3goc.png" alt="IT Supporter Service" className="w-9 h-9 object-contain" />
            <span className="font-bold text-lg text-[#ff6b35] hidden sm:block tracking-tight">IT Supporter Service</span>
          </Link>
        </div>

        {/* DESKTOP NAV */}
        <nav className="hidden md:flex flex-1 justify-center px-4">
          {navItems.length > PAGE_SIZE ? (
            <div className="flex items-center gap-1.5 bg-gray-50/90 p-1 rounded-xl border border-gray-100">
              <button
                type="button"
                onClick={() => setNavPage((p) => Math.max(0, p - 1))}
                disabled={navPage === 0}
                className="p-1 rounded-lg text-gray-500 hover:text-primary hover:bg-white disabled:opacity-20 disabled:pointer-events-none transition"
                title="Trang chức năng trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <ul className="flex items-center gap-1 lg:gap-2 px-1 whitespace-nowrap">
                {displayedNavItems.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.path === '/' || item.path === '/admin' || item.path === '/manager' || item.path === '/technician'}
                      className={({ isActive }) =>
                        `text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all ${
                          isActive
                            ? 'bg-white text-primary shadow-xs font-bold'
                            : 'text-text-secondary hover:text-primary hover:bg-white/60'
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => setNavPage((p) => Math.min(totalNavPages - 1, p + 1))}
                disabled={navPage >= totalNavPages - 1}
                className="p-1 rounded-lg text-gray-500 hover:text-primary hover:bg-white disabled:opacity-20 disabled:pointer-events-none transition"
                title="Trang chức năng tiếp"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <ul className="flex items-center gap-4 lg:gap-6 whitespace-nowrap">
              {navItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.path === '/' || item.path === '/admin' || item.path === '/manager' || item.path === '/technician'}
                    className={({ isActive }) =>
                      `text-sm font-medium transition-colors ${
                        isActive ? 'text-primary font-semibold' : 'text-text-secondary hover:text-primary'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          )}
        </nav>

        {/* RIGHT ACTIONS */}
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher className="hidden sm:inline-flex" />
          {isAuthenticated ? (
            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* Role badge */}
              {user?.role === 'ADMIN' && (
                <NavLink to="/admin" className="text-xs font-bold px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg border border-purple-200 hover:bg-purple-100">
                  Admin
                </NavLink>
              )}
              {user?.role === 'MANAGER' && (
                <NavLink to="/manager" className="text-xs font-bold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100">
                  Quản lý
                </NavLink>
              )}
              {user?.role === 'TECHNICIAN' && (
                <NavLink to="/technician" className="text-xs font-bold px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-200 hover:bg-amber-100">
                  Kỹ thuật viên
                </NavLink>
              )}

              {/* Customer specific navigation */}
              {isCustomer && (
                <>
                  <NavLink
                    to="/my-vouchers"
                    className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200 hover:bg-orange-100 hidden sm:flex items-center gap-1.5"
                  >
                    <Ticket className="w-3.5 h-3.5" />
                    <span>Vé ưu đãi</span>
                  </NavLink>
                  <NavLink
                    to="/orders"
                    className="text-sm font-medium text-text-secondary hover:text-primary hidden sm:block"
                  >
                    {t('nav.orders')}
                  </NavLink>
                </>
              )}

              {/* Interactive notification bell */}
              <NotificationBell />

              {/* Profile link */}
              <NavLink to="/profile" className="flex items-center gap-2 hover:opacity-80 transition" title={user?.name}>
                <Avatar name={user?.name || ''} email={user?.email || ''} src={user?.avatar_url} size={32} />
                <span className="hidden xl:block text-xs font-semibold text-slate-700 max-w-[100px] truncate">{user?.name}</span>
              </NavLink>

              {/* Logout button */}
              <button
                onClick={() => logout()}
                className="btn btn-ghost text-xs text-slate-500 hover:text-red-600 px-2"
                title={t('nav.logout')}
              >
                {t('nav.logout')}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <NavLink
                to="/login"
                className="text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors"
              >
                {t('nav.login')}
              </NavLink>
              <span className="text-gray-300">/</span>
              <NavLink
                to="/register"
                className="text-sm font-semibold text-gray-800 hover:text-orange-600 transition-colors"
              >
                {t('nav.register')}
              </NavLink>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border py-4 bg-white shadow-lg animate-in slide-in-from-top-2 duration-200">
          <ul className="flex flex-col gap-1 px-4">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/' || item.path === '/admin' || item.path === '/manager' || item.path === '/technician'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `block px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive ? 'bg-orange-50 text-primary font-semibold' : 'text-text-secondary hover:bg-gray-50'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
            {isAuthenticated ? (
              <div className="pt-3 mt-2 border-t border-gray-100 space-y-1">
                {isCustomer && (
                  <>
                    <li>
                      <NavLink
                        to="/orders"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-2 text-sm font-medium text-text-secondary hover:text-primary"
                      >
                        📦 {t('nav.orders')}
                      </NavLink>
                    </li>
                    <li>
                      <NavLink
                        to="/my-vouchers"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-orange-600 hover:text-orange-700"
                      >
                        <Ticket className="w-4 h-4" />
                        <span>Vé ưu đãi của tôi</span>
                      </NavLink>
                    </li>
                  </>
                )}
                <li>
                  <NavLink
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-sm font-medium text-text-secondary hover:text-primary"
                  >
                    👤 {t('nav.profile')}
                  </NavLink>
                </li>
                <li>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    🚪 {t('nav.logout')}
                  </button>
                </li>
              </div>
            ) : (
              <div className="flex items-center gap-4 px-3 py-3 pt-4 border-t border-border mt-2">
                <NavLink
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors"
                >
                  {t('nav.login')}
                </NavLink>
                <span className="text-gray-300">/</span>
                <NavLink
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-semibold text-gray-800 hover:text-orange-600 transition-colors"
                >
                  {t('nav.register')}
                </NavLink>
              </div>
            )}
            <li className="pt-3 mt-2 border-t border-gray-100 px-3 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Ngôn ngữ / Language:</span>
              <LanguageSwitcher />
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}

// Backward compatibility aliases
export const PublicHeader = AppHeader;
export const AuthenticatedHeader = AppHeader;

export function Footer() {
  const [info, setInfo] = useState<{
    team_name: string;
    university: string;
    workshop_address: string;
    contact_phone: string;
    email: string;
    facebook_page: string;
    distributor_name: string;
    distributor_url: string;
    google_map_embed_url: string;
    google_map_direct_url: string;
    working_hours_display: string;
    booking_notice: string;
  }>({
    team_name: 'IT Supporter HaUI',
    university: 'Đại học Công nghiệp Hà Nội',
    workshop_address: 'Phòng 1603, Tòa A1, Cơ sở 1 - Đại học Công nghiệp Hà Nội',
    contact_phone: '0981.234.567',
    email: 'support@itsupporter.vn',
    facebook_page: 'https://www.facebook.com/itsupporter.haui/',
    distributor_name: 'dotlinux26',
    distributor_url: 'https://github.com/dotlinux26',
    google_map_embed_url:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3723.863985044336!2d105.7445984154024!3d21.05372429283389!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31345457e292d5bf%3A0x20ac91903d45e803!2zVHLGsOG7nW5nIMSQ4bqhaSBI4buNYyBDw7RuZyBOZ2hp4buHcCBIw6AgTuG7mWk!5e0!3m2!1svi!2s!4v1700000000000!5m2!1svi!2s',
    google_map_direct_url: 'https://maps.google.com/?q=21.053724,105.744598',
    working_hours_display: '07:00 - 19:00 (Thứ 2 - Thứ 7)',
    booking_notice:
      'Khách hàng đặt lịch trước tối thiểu 4 tiếng, sau đó mang máy tới phòng 1603 Tòa A1 để kỹ thuật viên kiểm tra & bảo dưỡng trực tiếp.',
  });

  useEffect(() => {
    publicApi
      .info()
      .then(res => {
        if (res.data?.data) {
          const d = res.data.data;
          setInfo(prev => ({
            ...prev,
            ...d,
            team_name: d.team_name || d.teamName || prev.team_name,
            university: d.university || prev.university,
            workshop_address: d.workshop_address || d.workshopAddress || prev.workshop_address,
            contact_phone: d.contact_phone || d.contactPhone || prev.contact_phone,
            email: d.email || d.contactEmail || prev.email,
            facebook_page: d.facebook_page || d.facebookPage || prev.facebook_page,
            distributor_name: d.distributor_name || d.distributorName || prev.distributor_name,
            distributor_url: d.distributor_url || d.distributorUrl || prev.distributor_url,
            google_map_embed_url: d.google_map_embed_url || d.googleMapEmbedUrl || prev.google_map_embed_url,
            google_map_direct_url: d.google_map_direct_url || d.googleMapDirectUrl || prev.google_map_direct_url,
            working_hours_display: d.working_hours_display || d.workingHoursDisplay || prev.working_hours_display,
            booking_notice: d.booking_notice || d.bookingNotice || prev.booking_notice,
          }));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-400 mt-auto text-xs">
      {/* KHỐI NỘI DUNG 4 CỘT */}
      <div className="container mx-auto px-4 pt-8 pb-4 md:pt-10 md:pb-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 items-start">
          {/* CỘT 1: VỀ CHÚNG TÔI */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <img 
                src="/logo_bo3goc.png" 
                alt="IT Supporter" 
                className="w-8 h-8 object-contain rounded-[2px]" 
              />
              <div>
                <span className="font-bold text-sm text-slate-100 block tracking-tight">{info.team_name}</span>
                <span className="text-[11px] text-slate-500 block">{info.university}</span>
              </div>
            </div>
            <p className="text-slate-400 leading-relaxed text-[12px]">
              Dịch vụ vệ sinh & bảo dưỡng máy tính trực tiếp tại phòng làm việc trường Đại học Công nghiệp Hà Nội. Đặt lịch online trước tối thiểu 4 tiếng, tiếp nhận và hỗ trợ tận tâm.
            </p>
            <div className="pt-1">
              <a
                href={info.facebook_page}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>Fanpage chính thức</span>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </a>
            </div>
          </div>

          {/* CỘT 2: ĐIỀU HƯỚNG & DỊCH VỤ */}
          <div>
            <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider mb-3">
              Dịch vụ & Liên kết
            </h4>
            <ul className="space-y-2.5 text-[12px]">
              <li>
                <Link to="/services" className="text-slate-400 hover:text-slate-200 transition-colors">
                  Gói dịch vụ bảo dưỡng PC/Laptop
                </Link>
              </li>
              <li>
                <Link to="/#booking-calendar" className="text-slate-400 hover:text-slate-200 transition-colors">
                  Đặt lịch tiếp nhận trực tuyến
                </Link>
              </li>
              <li>
                <Link to="/orders" className="text-slate-400 hover:text-slate-200 transition-colors">
                  Tra cứu đơn hàng
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-slate-400 hover:text-slate-200 transition-colors">
                  Quy định & Cam kết chất lượng
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-slate-400 hover:text-slate-200 transition-colors">
                  Giới thiệu Đội IT Supporter
                </Link>
              </li>
            </ul>
          </div>

          {/* CỘT 3: THÔNG TIN TIẾP NHẬN */}
          <div>
            <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider mb-3">
              Tiếp nhận & Liên hệ
            </h4>
            <div className="space-y-2.5 text-[12px] text-slate-400">
              <div>
                <span className="text-slate-500 block text-[11px]">Phòng làm việc tiếp nhận:</span>
                <span className="text-slate-200 font-medium">{info.workshop_address}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Hotline kỹ thuật:</span>
                <a href={`tel:${info.contact_phone.replace(/\./g, '')}`} className="text-slate-200 hover:text-orange-400 transition-colors font-medium">
                  {info.contact_phone}
                </a>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Email hỗ trợ:</span>
                <a href={`mailto:${info.email}`} className="text-slate-300 hover:text-white transition-colors">
                  {info.email}
                </a>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Thời gian làm việc:</span>
                <span className="text-slate-300">{info.working_hours_display}</span>
              </div>
            </div>
          </div>

          {/* CỘT 4: BẢN ĐỒ GOOGLE MAPS (RADIUS 2PX) */}
          <div>
            <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider mb-3">
              Vị trí phòng làm việc
            </h4>
            <div className="rounded-[2px] overflow-hidden border border-slate-800 bg-slate-900">
              <iframe
                title="Bản đồ phòng tiếp nhận máy IT Supporter HaUI"
                src={info.google_map_embed_url}
                width="100%"
                height="130"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full filter contrast-[0.95] opacity-90 hover:opacity-100 transition-opacity"
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Tòa A1, ĐH Công nghiệp HN</span>
              <a
                href={info.google_map_direct_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
              >
                <span>Chỉ đường Maps</span>
                <ExternalLink className="w-2.5 h-2.5 text-slate-500" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* THANH BẢN QUYỀN - KHÔNG DÙNG VIỀN NGĂN CÁCH (HR) */}
      <div className="bg-slate-950">
        <div className="container mx-auto px-4 pt-2 pb-8 md:pb-10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-slate-500">
          <div>
            <p>© 2026 {info.team_name} · {info.university}. All rights reserved.</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-end">
            <LanguageSwitcher className="bg-slate-900 border-slate-800 text-slate-300" />
            <span>·</span>
            <span>
              Phát triển bởi{' '}
              <a href={info.facebook_page} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-200 transition-colors">
                {info.team_name}
              </a>
            </span>
            <span>·</span>
            <span>
              Nhà phân phối{' '}
              <a href={info.distributor_url} target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
                {info.distributor_name}
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function MainLayout({ children }: { children?: React.ReactNode }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1 w-full">
        {children || <Outlet />}
      </main>
      <Footer />
      <ScrollToTopButton />
    </div>
  );
}