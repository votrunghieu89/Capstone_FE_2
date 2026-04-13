import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
    Users,
    ClipboardList,
    MessageSquare,
    History,
    Star,
    LogOut,
} from 'lucide-react';
import useAuthStore from '@/store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const menuItems = [
    { href: '/customer/technicians', label: 'Tìm thợ sửa chữa', icon: Users },
    {
        href: '/customer/orders',
        label: 'Đơn hàng',
        icon: ClipboardList,
        subItems: [
            { href: '/customer/orders?status=pending', label: 'Đang chờ' },
            { href: '/customer/orders?status=in-progress', label: 'Đang thực hiện' },
        ]
    },
    { href: '/customer/orders?status=cancelled', label: 'Đơn hàng bị hủy', icon: ClipboardList },
    { href: '/customer/orders?status=rejected', label: 'Đơn hàng từ chối', icon: ClipboardList },
    { href: '/customer/contact', label: 'Liên hệ thợ', icon: MessageSquare },
    { href: '/customer/history', label: 'Lịch sử', icon: History },
    { href: '/customer/reviews', label: 'Đánh giá', icon: Star },
];

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const pathname = location.pathname;
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
        setShowLogoutConfirm(false);
    };

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                className={cn(
                    'fixed left-0 top-0 z-40 h-screen w-72 bg-[#050b18] border-r border-white/5 transition-transform duration-300 md:relative md:translate-x-0 overflow-hidden',
                    !isOpen && '-translate-x-full'
                )}
            >
                <div className="flex flex-col h-full">
                    <div className="p-8">
                        {/* Logo → points to /customer (stays inside customer portal) */}
                        <Link to="/customer" className="group no-underline">
                            <motion.h1
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-2xl font-black text-white tracking-tighter flex items-center gap-3"
                            >
                                <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center font-black italic text-lg shadow-lg shadow-primary/20 text-white">F</div>
                                <span>Fast<span className="text-primary-light">Fix</span></span>
                            </motion.h1>
                        </Link>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mt-2 ml-1">Customer Portal</p>
                    </div>

                    <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1 text-white">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname.startsWith(item.href.split('?')[0]);
                            const hasSubItems = item.subItems && item.subItems.length > 0;

                            return (
                                <div key={item.href} className="space-y-1">
                                    <Link
                                        to={item.href}
                                        onClick={() => {
                                            if (window.innerWidth < 768 && !hasSubItems) onClose();
                                        }}
                                        className={cn(
                                            'group flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 relative',
                                            isActive
                                                ? 'bg-white/10 text-white font-bold'
                                                : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                        )}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="active-cust-nav"
                                                className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                                            />
                                        )}
                                        <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive ? "text-primary" : "")} />
                                        <span className="text-sm tracking-wide">{item.label}</span>
                                    </Link>
                                    
                                    {/* Submenu */}
                                    {hasSubItems && isActive && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="ml-12 space-y-1 border-l border-white/10 pl-4 py-1"
                                        >
                                            {item.subItems?.map((sub) => (
                                                <Link
                                                    key={sub.href}
                                                    to={sub.href}
                                                    onClick={() => {
                                                        if (window.innerWidth < 768) onClose();
                                                    }}
                                                    className={cn(
                                                        "block py-2 text-sm transition-colors",
                                                        (location.pathname + location.search) === sub.href
                                                            ? "text-primary-light font-medium"
                                                            : "text-zinc-500 hover:text-zinc-300"
                                                    )}
                                                >
                                                    {sub.label}
                                                </Link>
                                            ))}
                                        </motion.div>
                                    )}
                                </div>
                            );
                        })}
                    </nav>

                    <div className="p-6 border-t border-white/5">
                        <button
                            onClick={() => setShowLogoutConfirm(true)}
                            className="w-full flex items-center gap-4 px-6 py-4 text-sm font-bold text-red-400 hover:bg-red-500/10 rounded-2xl transition-all mt-4 group"
                        >
                            <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                            <span>Đăng xuất</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Logout Confirmation Modal */}
            <AnimatePresence>
                {showLogoutConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[300] flex items-center justify-center p-4"
                        onClick={() => setShowLogoutConfirm(false)}
                    >
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative bg-[#0a1122] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl shadow-black/50"
                        >
                            <div className="text-center mb-5">
                                <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3">
                                    <LogOut className="w-7 h-7 text-red-400" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-1">Xác nhận đăng xuất</h3>
                                <p className="text-sm text-zinc-400">Bạn có chắc chắn muốn đăng xuất khỏi FastFix không?</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowLogoutConfirm(false)}
                                    className="flex-1 py-3 rounded-xl border border-white/10 text-sm font-semibold text-zinc-300 hover:bg-white/5 transition-all"
                                >
                                    Không, ở lại
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-sm font-bold text-white transition-all"
                                >
                                    Có, đăng xuất
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
