import { Outlet, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/technician/Sidebar';
import { Header } from '@/components/technician/Header';
import useAuthStore from '@/store/authStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function TechnicianLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('fastfix_token');
      // In a more robust app, you'd check role here too
      if (!token || !isAuthenticated) {
        navigate('/?login=technician');
      } else {
        setIsAuthorized(true);
      }
    };
    checkAuth();
  }, [user, isAuthenticated, navigate]);

  if (isAuthorized === null) return null;

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar isOpen={sidebarOpen} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={window.location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="max-w-7xl mx-auto w-full h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
