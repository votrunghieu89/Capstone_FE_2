import { Menu, Bell, Settings, LogOut, User } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

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
        


        <h2 className="text-sm font-bold text-slate-200 hidden lg:block ml-4">
          Chào mừng quay lại, <span className="text-blue-400">{user?.fullName || 'Kỹ thuật viên'}</span> 👋
        </h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button 
          onClick={() => navigate('/technician/don-hang/dang-cho')}
          className="p-2.5 hover:bg-slate-800 rounded-xl relative text-slate-400 transition-all group"
        >
          <Bell className="w-5 h-5 group-hover:text-red-400" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0f172a] animate-pulse" />
        </button>

        <div className="h-8 w-px bg-slate-800 mx-2 hidden sm:block" />

        <div className="flex items-center gap-2 sm:pl-2">
          <button 
            onClick={() => navigate('/technician/ho-so')}
            className="p-2.5 hover:bg-slate-800 rounded-xl text-slate-400 transition-all group" title="Profile"
          >
            <Settings className="w-5 h-5 group-hover:text-amber-400" />
          </button>
          
          <button 
            onClick={handleLogout}
            className="p-2.5 hover:bg-red-500/10 rounded-xl text-slate-400 hover:text-red-400 transition-all group" title="Đăng xuất"
          >
            <LogOut className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 ml-2 pl-4 border-l border-slate-800">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-200">{user?.fullName || 'User'}</p>

            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center p-0.5 overflow-hidden ring-2 ring-blue-500/10">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-[10px]" />
              ) : (
                <User size={20} className="text-blue-400" />
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
