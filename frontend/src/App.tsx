import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MainLayout } from './components/Layout';
import { useAuth } from './context/AuthContext';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// Public pages
import { HomePage } from './pages/public/HomePage';
import { ServicesPage } from './pages/public/ServicesPage';
import { AboutPage } from './pages/public/AboutPage';
import { TermsPage } from './pages/public/TermsPage';
import { PublicOrdersPage } from './pages/public/PublicOrdersPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Authenticated pages
import { OrdersPage } from './pages/customer/OrdersPage';
import { OrderDetailPage } from './pages/customer/OrderDetailPage';
import { BookingPage } from './pages/customer/BookingPage';
import { ProfilePage } from './pages/customer/ProfilePage';
import { ChatPage } from './pages/customer/ChatPage';

// Technician pages
import { TechnicianDashboard } from './pages/technician/TechnicianDashboard';
import { TechnicianSchedule } from './pages/technician/TechnicianSchedule';
import { TechnicianOrders } from './pages/technician/TechnicianOrders';
import { TechnicianOrderDetail } from './pages/technician/TechnicianOrderDetail';

// Manager pages
import { ManagerDashboard } from './pages/manager/ManagerDashboard';
import { ManagerOrders } from './pages/manager/ManagerOrders';
import { ManagerTechnicians } from './pages/manager/ManagerTechnicians';
import { ManagerPackages } from './pages/manager/ManagerPackages';
import { ManagerSettlements } from './pages/manager/ManagerSettlements';
import { ManagerReviews } from './pages/manager/ManagerReviews';
import { ManagerSettings } from './pages/manager/ManagerSettings';

// Admin pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminStats } from './pages/admin/AdminStats';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AdminQR } from './pages/admin/AdminQR';

import { MyVouchersPage } from './pages/customer/MyVouchersPage';
import { AdminVouchers } from './pages/admin/AdminVouchers';

// Error pages
import { NotFoundPage } from './pages/NotFoundPage';

function ProtectedRoute({ allowedRoles = [], children }: { allowedRoles?: string[]; children?: React.ReactNode }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role || '')) {
    switch (user?.role) {
      case 'ADMIN': return <Navigate to="/admin" replace />;
      case 'MANAGER': return <Navigate to="/manager" replace />;
      case 'TECHNICIAN': return <Navigate to="/technician" replace />;
      default: return <Navigate to="/orders" replace />;
    }
  }

  return <>{children || <Outlet />}</>;
}

function PublicOnly({ children }: { children?: React.ReactNode }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    switch (user?.role) {
      case 'ADMIN': return <Navigate to="/admin" replace />;
      case 'MANAGER': return <Navigate to="/manager" replace />;
      case 'TECHNICIAN': return <Navigate to="/technician" replace />;
      default: return <Navigate to="/orders" replace />;
    }
  }

  return <>{children || <Outlet />}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="public-orders" element={<PublicOrdersPage />} />
        <Route path="login" element={<PublicOnly><LoginPage /></PublicOnly>} />
        <Route path="register" element={<PublicOnly><RegisterPage /></PublicOnly>} />

        {/* Customer authenticated routes */}
        <Route element={<ProtectedRoute allowedRoles={['GUEST']} />}>
          <Route path="booking" element={<BookingPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="my-vouchers" element={<MyVouchersPage />} />
        </Route>

        {/* Shared authenticated routes (Chat, Profile) */}
        <Route element={<ProtectedRoute allowedRoles={['GUEST', 'TECHNICIAN', 'MANAGER', 'ADMIN']} />}>
          <Route path="orders/:id/chat" element={<ChatPage />} />
          <Route path="technician/orders/:id/chat" element={<ChatPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Technician routes */}
        <Route element={<ProtectedRoute allowedRoles={['TECHNICIAN', 'MANAGER', 'ADMIN']} />}>
          <Route path="technician" element={<TechnicianDashboard />} />
          <Route path="technician/schedule" element={<TechnicianSchedule />} />
          <Route path="technician/orders" element={<TechnicianOrders />} />
          <Route path="technician/orders/:id" element={<TechnicianOrderDetail />} />
        </Route>

        {/* Manager routes */}
        <Route element={<ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']} />}>
          <Route path="manager" element={<ManagerDashboard />} />
          <Route path="manager/orders" element={<ManagerOrders />} />
          <Route path="manager/technicians" element={<ManagerTechnicians />} />
          <Route path="manager/packages" element={<ManagerPackages />} />
          <Route path="manager/settlements" element={<ManagerSettlements />} />
          <Route path="manager/reviews" element={<ManagerReviews />} />
          <Route path="manager/settings" element={<ManagerSettings />} />
        </Route>

        {/* Admin routes */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin/users" element={<AdminUsers />} />
          <Route path="admin/stats" element={<AdminStats />} />
          <Route path="admin/settings" element={<AdminSettings />} />
          <Route path="admin/vouchers" element={<AdminVouchers />} />
          <Route path="admin/qr" element={<AdminQR />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

function App() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = t('home.heroTitle');
  }, [t]);

  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;