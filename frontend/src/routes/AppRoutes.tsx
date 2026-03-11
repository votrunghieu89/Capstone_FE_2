import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

// Layouts - loaded eagerly
import MainLayout from '@/layouts/MainLayout';
import CustomerLayout from '@/layouts/CustomerLayout';
import AdminLayout from '@/layouts/AdminLayout';
import TechnicianLayout from '@/layouts/TechnicianLayout';

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

const TechDashboardPage = lazy(() => import('@/pages/technician/DashboardPage'));
const TechNewRequestsPage = lazy(() => import('@/pages/technician/NewRequestsPage'));
const TechInProgressPage = lazy(() => import('@/pages/technician/InProgressPage'));
const TechCustomerHubPage = lazy(() => import('@/pages/technician/CustomerHubPage'));
const TechCommunicationPage = lazy(() => import('@/pages/technician/CommunicationPage'));
const AnalyticsPage = lazy(() => import('@/pages/technician/AnalyticsPage'));
const PaymentManagerPage = lazy(() => import('@/pages/technician/PaymentManagerPage'));
const SettingsPage = lazy(() => import('@/pages/technician/SettingsPage'));

function Loading() {
  return (
    <div className="flex items-center justify-center h-screen bg-[#02050b]">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function AppRoutes() {
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

        {/* ── Admin Routes ── */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="yeu-cau" element={<RequestsPage />} />
          <Route path="ky-thuat-vien" element={<TechniciansPage />} />
        </Route>

        {/* ── Technician (Worker) Routes ── */}
        <Route path="/technician" element={<TechnicianLayout />}>
          <Route index element={<TechDashboardPage />} />
          <Route path="yeu-cau-moi" element={<TechNewRequestsPage />} />
          <Route path="dang-thuc-hien" element={<TechInProgressPage />} />
          <Route path="khach-hang" element={<TechCustomerHubPage />} />
          <Route path="giao-tiep" element={<TechCommunicationPage />} />
          <Route path="phan-tich" element={<AnalyticsPage />} />
          <Route path="thanh-toan" element={<PaymentManagerPage />} />
          <Route path="cai-dat" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
