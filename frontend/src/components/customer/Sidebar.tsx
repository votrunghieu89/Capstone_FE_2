import { Link, useLocation } from 'react-router-dom';
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
import { motion } from 'framer-motion';

const menuItems = [
    { href: '/customer/technicians', label: 'Tìm thợ sửa chữa', icon: Users },
    { href: '/customer/orders', label: 'Đơn hàng', icon: ClipboardList },
    { href: '/customer/contact', label: 'Liên hệ thợ', icon: MessageSquare },
    { href: '/customer/history', label: 'Lịch sử', icon: History },
    { href: '/customer/reviews', label: 'Đánh giá', icon: Star },
];

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { logout } = useAuthStore();
    const location = useLocation();
    const pathname = location.pathname;

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
                        <Link to="/" className="group no-underline">
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
                            const isActive = pathname.startsWith(item.href);

                            return (
                                <Link
                                    key={item.href}
                                    to={item.href}
                                    onClick={() => {
                                        if (window.innerWidth < 768) onClose();
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
                            );
                        })}
                    </nav>

                    <div className="p-6 border-t border-white/5">
                        <button
                            onClick={() => logout()}
                            className="w-full flex items-center gap-4 px-6 py-4 text-sm font-bold text-red-400 hover:bg-red-500/10 rounded-2xl transition-all mt-4 group"
                        >
                            <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                            <span>Đăng xuất</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
