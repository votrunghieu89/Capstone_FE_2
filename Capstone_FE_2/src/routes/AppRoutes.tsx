import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { getAnyAccessToken, isAdminAccessToken } from '@/utils/authToken';

// Layouts - loaded eagerly
import MainLayout from '@/layouts/MainLayout';
import CustomerLayout from '@/layouts/CustomerLayout';
import AdminLayout from '@/layouts/AdminLayout';
import TechnicianLayout from '@/layouts/TechnicianLayout';
import { CustomerHub } from '@/components/technician/CustomerHub';
import { Communication } from '@/components/technician/Communication';
import { Analytics } from '@/components/technician/Analytics';
import { PaymentManager } from '@/components/technician/PaymentManager';
import { Settings } from '@/components/technician/Settings';
// Lazy-loaded pages
const HomePage = lazy(() => import('@/pages/customer/HomePage'));
const ProfilePage = lazy(() => import('@/pages/customer/ProfilePage'));
const TechnicianListPage = lazy(() => import('@/pages/customer/TechnicianListPage'));
const OrdersPage = lazy(() => import('@/pages/customer/OrdersPage'));
const ContactTechnicianPage = lazy(() => import('@/pages/customer/ContactTechnicianPage'));
const HistoryPage = lazy(() => import('@/pages/customer/HistoryPage'));
const ReviewsPage = lazy(() => import('@/pages/customer/ReviewsPage'));

const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const RequestsPage = lazy(() => import('@/pages/admin/RequestsPage'));
const TechniciansPage = lazy(() => import('@/pages/admin/TechniciansPage'));
const ServicesPage = lazy(() => import('@/pages/admin/ServicesPage'));
const CitiesPage = lazy(() => import('@/pages/admin/CitiesPage'));
const NotificationsPage = lazy(() => import('@/pages/admin/NotificationsPage'));
const TechDashboardPage = lazy(() => import('@/pages/technician/DashboardPage'));
const TechProfilePage = lazy(() => import('@/pages/technician/ProfilePage'));
const TechNewRequestsPage = lazy(() => import('@/pages/technician/NewRequestsPage'));
const TechAcceptedRequestsPage = lazy(() => import('@/pages/technician/AcceptedRequestsPage'));
const TechInProgressPage = lazy(() => import('@/pages/technician/InProgressPage'));
const TechHistoryPage = lazy(() => import('@/pages/technician/HistoryPage'));
const TechChatPage = lazy(() => import('@/pages/technician/ChatPage'));
const TechOrderDetailPage = lazy(() => import('@/pages/technician/OrderDetailPage'));

const TechCustomerHubPage = CustomerHub;
const TechCommunicationPage = Communication;
const TechAnalyticsPage = Analytics;
const TechPaymentManagerPage = PaymentManager;
const TechSettingsPage = Settings;

function Loading() {
  return (
    <div className="flex items-center justify-center h-screen bg-[#02050b]">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function AppRoutes() {
  const location = useLocation();
  const accessToken = getAnyAccessToken();
  const isAdmin = isAdminAccessToken(accessToken);
  const isOnAdminPath = location.pathname.startsWith('/admin');

  if (isAdmin && !isOnAdminPath) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* ── Public Routes ── */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
        </Route>

        {/* ── Customer Portal Routes ── */}
        <Route path="/customer" element={<CustomerLayout />}>
          <Route index element={<TechnicianListPage />} />
          <Route path="technicians" element={<TechnicianListPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="contact" element={<ContactTechnicianPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="reviews" element={<ReviewsPage />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="yeu-cau" element={<RequestsPage />} />
          <Route path="ky-thuat-vien" element={<TechniciansPage />} />
          <Route path="dich-vu" element={<ServicesPage />} />
          <Route path="thanh-pho" element={<CitiesPage />} />
          <Route path="thong-bao" element={<NotificationsPage />} />
        </Route>

        {/* Technician */}
        <Route path="/technician" element={<TechnicianLayout />}>
          <Route index element={<TechDashboardPage />} />
          <Route path="ho-so" element={<TechProfilePage />} />
          <Route path="yeu-cau-moi" element={<TechNewRequestsPage />} />
          <Route path="don-hang/dang-cho" element={<TechNewRequestsPage />} />
          <Route path="don-hang/da-tiep-nhan" element={<TechAcceptedRequestsPage />} />
          <Route path="don-hang/chi-tiet/:id" element={<TechOrderDetailPage />} />
          <Route path="dang-thuc-hien" element={<TechInProgressPage />} />
          <Route path="don-hang/dang-thuc-hien" element={<TechInProgressPage />} />
          <Route path="lich-su" element={<TechHistoryPage />} />
          <Route path="chat" element={<TechChatPage />} />
          <Route path="khach-hang" element={<TechCustomerHubPage />} />
          <Route path="giao-tiep" element={<TechCommunicationPage />} />
          <Route path="phan-tich" element={<TechAnalyticsPage />} />
          <Route path="thanh-toan" element={<TechPaymentManagerPage />} />
          <Route path="cai-dat" element={<TechSettingsPage />} />
        </Route>

        {/* Legacy redirects */}
        <Route path="/admin/*" element={<Navigate to="/" replace />} />
        <Route path="/customer/*" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
