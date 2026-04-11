import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import MainLayout from '@/layouts/MainLayout';
import TechnicianLayout from '@/layouts/TechnicianLayout';

// Lazy-loaded pages — Home
const HomePage = lazy(() => import('@/pages/customer/HomePage'));

// Lazy-loaded pages — Technician
const TechDashboardPage = lazy(() => import('@/pages/technician/DashboardPage'));
const TechProfilePage = lazy(() => import('@/pages/technician/ProfilePage'));
const TechNewRequestsPage = lazy(() => import('@/pages/technician/NewRequestsPage'));
const TechAcceptedRequestsPage = lazy(() => import('@/pages/technician/AcceptedRequestsPage'));
const TechInProgressPage = lazy(() => import('@/pages/technician/InProgressPage'));
const TechHistoryPage = lazy(() => import('@/pages/technician/HistoryPage'));
const TechChatPage = lazy(() => import('@/pages/technician/ChatPage'));

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
        {/* Trang chủ - Public */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
        </Route>

        {/* Technician Portal - Chế độ tập trung chính */}
        <Route path="/technician" element={<TechnicianLayout />}>
          <Route index element={<TechDashboardPage />} />
          <Route path="ho-so" element={<TechProfilePage />} />
          <Route path="don-hang/dang-cho" element={<TechNewRequestsPage />} />
          <Route path="don-hang/da-tiep-nhan" element={<TechAcceptedRequestsPage />} />
          <Route path="don-hang/dang-thuc-hien" element={<TechInProgressPage />} />
          <Route path="lich-su" element={<TechHistoryPage />} />
          <Route path="chat" element={<TechChatPage />} />
        </Route>

        {/* Chuyển hướng các trang cũ về Home */}
        <Route path="/admin/*" element={<Navigate to="/" replace />} />
        <Route path="/customer/*" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
