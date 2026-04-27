import { Menu, Settings, LogOut, User, Zap } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import technicianOrderService from '@/services/technicianOrderService';
import technicianService from '@/services/technicianService';
import toast from 'react-hot-toast';

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout, isOnline, setOnlineStatus } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.id) {
      syncProfileData();
    }
  }, [user?.id]);

  const syncProfileData = async () => {
    if (!user?.id) return;
    try {
      const profileInfo = await technicianService.getProfile(user.id);
      if (
        profileInfo && 
        (profileInfo.fullName !== user.fullName || profileInfo.avatarURL !== user.avatarUrl)
      ) {
        useAuthStore.getState().setUser({
          ...user,
          fullName: profileInfo.fullName || user.fullName,
          avatarUrl: profileInfo.avatarURL || user.avatarUrl,
          phone: profileInfo.phoneNumber || user.phone
        });
      }
    } catch (err) {
      console.error('Failed to sync profile data for header:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Đã đăng xuất');
  };

  return (
    <header className="h-20 border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2.5 hover:bg-slate-800 rounded-xl transition-all md:hidden text-slate-400"
        >
          <Menu className="w-5 h-5" />
        </button>
        


        <div className="hidden lg:flex items-center gap-6 ml-4">
          {/* Full Segmented Toggle - Positioned to the LEFT of greeting */}
          <div className="flex items-center bg-slate-900 border border-white/5 p-1 rounded-2xl relative scale-90 origin-left">
            <motion.div 
                className={cn(
                  "absolute h-[calc(100%-8px)] rounded-xl z-0",
                  isOnline ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-rose-500/10 border border-rose-500/20"
                )}
                initial={false}
                animate={{ x: isOnline ? 0 : 110 }}
                style={{ width: isOnline ? '110px' : '125px' }}
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
            />

            <button 
              onClick={() => !isOnline && setOnlineStatus(true)}
              className={cn(
                "relative z-10 px-4 py-1.5 flex items-center gap-2 transition-all duration-300 w-[110px] justify-center",
                isOnline ? "text-emerald-400" : "text-slate-600 hover:text-slate-500"
              )}
            >
                <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", isOnline ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-slate-700")} />
                <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Trực tuyến</span>
                {isOnline && <Zap size={10} className="fill-emerald-400 shrink-0" />}
            </button>

            <button 
              onClick={() => isOnline && setOnlineStatus(false)}
              className={cn(
                "relative z-10 px-4 py-1.5 flex items-center gap-2 transition-all duration-300 w-[125px] justify-center",
                !isOnline ? "text-rose-400" : "text-slate-600 hover:text-slate-500"
              )}
            >
                <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", !isOnline ? "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.4)]" : "bg-slate-700")} />
                <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Ngoại tuyến</span>
            </button>
          </div>

          <h2 className="text-sm font-bold text-slate-200">
            Chào mừng quay lại, <span className="text-blue-400">{user?.fullName || 'Kỹ thuật viên'}</span> 👋
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-8 w-px bg-slate-800 mx-2 hidden sm:block" />

        <div className="flex items-center gap-2 sm:pl-2">
          <button 
            onClick={() => navigate('/technician/ho-so')}
            className="p-2.5 hover:bg-slate-800 rounded-xl text-slate-400 transition-all group" title="Profile"
          >
            <User className="w-5 h-5 group-hover:text-amber-400" />
          </button>
          
          <button 
            onClick={handleLogout}
            className="p-2.5 hover:bg-red-500/10 rounded-xl text-slate-400 hover:text-red-400 transition-all group" title="Đăng xuất"
          >
            <LogOut className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 ml-2 pl-4 border-l border-slate-800">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-200">{user?.fullName || user?.email || 'Thành viên'}</p>

            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 border border-blue-500/20 flex items-center justify-center p-0.5 overflow-hidden ring-2 ring-blue-500/10 shadow-lg shadow-blue-900/40">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-[10px]" />
              ) : (
                <span className="text-white font-black text-lg transition-all">
                  {user?.fullName ? user.fullName.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'U')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
