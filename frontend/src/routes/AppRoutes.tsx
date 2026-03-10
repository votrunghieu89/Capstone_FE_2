import { Routes, Route } from 'react-router-dom';

// Layouts
import MainLayout from '@/layouts/MainLayout';
import AdminLayout from '@/layouts/AdminLayout';
import TechnicianLayout from '@/layouts/TechnicianLayout';

// Customer pages
import HomePage from '@/pages/customer/HomePage';

// Admin pages
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import RequestsPage from '@/pages/admin/RequestsPage';
import TechniciansPage from '@/pages/admin/TechniciansPage';

// Technician (Worker) pages
import TechDashboardPage from '@/pages/technician/DashboardPage';
import TechNewRequestsPage from '@/pages/technician/NewRequestsPage';
import TechInProgressPage from '@/pages/technician/InProgressPage';
import TechCustomerHubPage from '@/pages/technician/CustomerHubPage';
import TechCommunicationPage from '@/pages/technician/CommunicationPage';
import AnalyticsPage from '@/pages/technician/AnalyticsPage';
import PaymentManagerPage from '@/pages/technician/PaymentManagerPage';
import SettingsPage from '@/pages/technician/SettingsPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* ── Customer Routes ── */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        {/* Sprint 2 - Customer routes */}
        {/* <Route path="request/new" element={<NewRequestPage />} /> */}
        {/* <Route path="my-requests" element={<MyRequestsPage />} /> */}
        {/* <Route path="technicians" element={<TechniciansPage />} /> */}
        {/* <Route path="chat/:roomId" element={<ChatPage />} /> */}
        {/* <Route path="profile" element={<ProfilePage />} /> */}
        {/* <Route path="support" element={<SupportPage />} /> */}
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
  );
}
