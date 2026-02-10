import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        {/* Sprint 1 - Thêm routes sau */}
        {/* <Route path="auth" element={<AuthPage />} /> */}
        {/* <Route path="request/new" element={<NewRequestPage />} /> */}
        {/* <Route path="my-requests" element={<MyRequestsPage />} /> */}
        {/* <Route path="technicians" element={<TechniciansPage />} /> */}
        {/* <Route path="chat/:roomId" element={<ChatPage />} /> */}
        {/* <Route path="profile" element={<ProfilePage />} /> */}
        {/* <Route path="support" element={<SupportPage />} /> */}
        {/* <Route path="technician/dashboard" element={<TechDashboardPage />} /> */}
        {/* <Route path="admin/dashboard" element={<AdminDashboardPage />} /> */}
      </Route>
    </Routes>
  );
}

export default App;
