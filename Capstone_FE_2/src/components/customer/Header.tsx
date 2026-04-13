import { Menu, Bell, LogOut, CheckCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '@/store/authStore';
import { useNotificationSignalR } from '@/hooks/useNotificationSignalR';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const { notifications, markAsRead, markAllAsRead } = useNotificationSignalR();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
        setShowLogoutConfirm(false);
    };

    const userName = user?.fullName || 'Khách Hàng';
    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <>
            <header className="h-16 border-b border-white/5 bg-[#050b18]/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <button onClick={onMenuClick} className="p-2 hover:bg-white/10 rounded-lg md:hidden text-white">
                        <Menu className="w-5 h-5" />
                    </button>
                    <h2 className="text-lg font-semibold text-white hidden md:block">
                        Xin chào, {userName.split(' ')[0] || userName} 👋
                    </h2>
                </div>

                <div className="flex items-center gap-4">
                    {/* ── Notifications ── */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="p-2 hover:bg-white/10 rounded-lg relative text-zinc-400 hover:text-white transition-colors outline-none">
                                <Bell className="w-5 h-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-[#050b18]" />
                                )}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-80 max-h-[85vh] overflow-y-auto" align="end" forceMount>
                            <DropdownMenuLabel className="flex justify-between items-center text-white">
                                <span>Thông báo mới</span>
                                {unreadCount > 0 && (
                                    <button onClick={markAllAsRead} className="text-xs text-primary-light hover:underline flex items-center gap-1">
                                        <CheckCheck size={14} /> Đọc tất cả
                                    </button>
                                )}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {notifications.length === 0 ? (
                                <div className="p-4 text-center text-sm text-text-secondary">Chưa có thông báo nào</div>
                            ) : (
                                <div className="flex flex-col">
                                    {notifications.map((notif: any, idx: number) => (
                                        <DropdownMenuItem
                                            key={notif.id || notif.notificationId || `notif-${idx}`}
                                            onClick={() => {
                                                const nid = notif.id || notif.notificationId;
                                                if (!notif.isRead && nid) markAsRead(nid);
                                            }}
                                            className={`flex flex-col items-start p-3 cursor-pointer ${notif.isRead ? 'opacity-60' : 'bg-primary/5'} border-b border-white/5 last:border-0`}
                                        >
                                            <p className={`text-sm ${notif.isRead ? 'text-text-secondary' : 'text-white font-medium'} leading-snug`}>
                                                {notif.message || notif.action || notif.Action || 'Cập nhật hệ thống'}
                                            </p>
                                            <span className="text-[10px] text-text-secondary mt-1">
                                                {new Date(notif.createAt || notif.createdAt || Date.now()).toLocaleString('vi-VN')}
                                            </span>
                                        </DropdownMenuItem>
                                    ))}
                                </div>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* ── User Profile ── */}
                    <div className="flex items-center gap-2 pl-4 border-l border-white/10">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-2 pl-2 hover:bg-white/5 py-1 px-2 rounded-lg transition-colors outline-none">
                                    <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                                        <AvatarImage src={user?.avatarUrl || ''} alt={userName} />
                                        <AvatarFallback className="bg-primary/20 text-primary-light font-bold">
                                            {userName.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium hidden sm:inline text-white">{userName}</span>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none text-white">{userName}</p>
                                        <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link to="/customer/profile" className="cursor-pointer"><span>Hồ sơ cá nhân</span></Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link to="/customer/orders" className="cursor-pointer"><span>Đơn sửa chữa</span></Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => setShowLogoutConfirm(true)}
                                    className="text-red-500 hover:text-red-500 focus:text-red-500 hover:bg-red-500/10 focus:bg-red-500/10 cursor-pointer"
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Đăng xuất</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            {/* Logout Confirmation Modal */}
            <AnimatePresence>
                {showLogoutConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[300] flex items-center justify-center p-4"
                        onClick={() => setShowLogoutConfirm(false)}
                    >
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative bg-[#0a1122] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
                        >
                            <div className="text-center mb-5">
                                <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3">
                                    <LogOut className="w-7 h-7 text-red-400" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-1">Xác nhận đăng xuất</h3>
                                <p className="text-sm text-zinc-400">Bạn có chắc chắn muốn đăng xuất khỏi FastFix không?</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-3 rounded-xl border border-white/10 text-sm font-semibold text-zinc-300 hover:bg-white/5 transition-all">Không, ở lại</button>
                                <button onClick={handleLogout} className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-sm font-bold text-white transition-all">Có, đăng xuất</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
