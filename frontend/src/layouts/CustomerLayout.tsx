import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/customer/Sidebar';
import { Header } from '@/components/customer/Header';
import useAuthStore from '@/store/authStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function CustomerLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
    const { user, isAuthenticated } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Open sidebar on larger screens by default
        if (window.innerWidth >= 768) {
            setSidebarOpen(true);
        }
    }, []);

    useEffect(() => {
        const checkAuth = () => {
            // Temporarily bypass auth check so we can view the UI
            // if (!token || !isAuthenticated) {
            //    navigate('/?login=true');
            // } else {
            setIsAuthorized(true);
            // }
        };
        checkAuth();
    }, [user, isAuthenticated, navigate]);

    if (isAuthorized === null) return null;

    return (
        <div className="flex h-screen bg-[#02050b] text-text overflow-hidden font-sans">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

                <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="max-w-6xl mx-auto w-full h-full"
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}
