import { Outlet, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/technician/Sidebar';
import { Header } from '@/components/technician/Header';
import FloatingGemini from '@/components/shared/FloatingGemini';
import useAuthStore from '@/store/authStore';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function TechnicianLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, isAuthenticated, fetchMe } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }
      if (!user) {
        try {
          await fetchMe();
        } catch (error) {
          navigate('/login');
        }
      }
    };
    checkAuth();
  }, [isAuthenticated, user, navigate, fetchMe]);

  // Show a high-fidelity loading state instead of a blank page
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-blue-500/10 rounded-full animate-pulse" />
          </div>
        </div>
        <p className="mt-6 text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] animate-pulse">
          Đang xác thực hệ thống...
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#020617] text-slate-200 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} />
      
      <div className={cn(
        "flex-1 transition-all duration-300 min-w-0 flex flex-col h-screen",
        sidebarOpen ? "md:pl-0" : "pl-0"
      )}>
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* Global AI Assistant */}
      <FloatingGemini />
    </div>
  );
}
