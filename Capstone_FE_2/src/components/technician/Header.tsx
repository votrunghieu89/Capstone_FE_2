import { Menu, Bell, Settings, LogOut, User } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import technicianOrderService from '@/services/technicianOrderService';
import toast from 'react-hot-toast';

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [newRequestsCount, setNewRequestsCount] = useState<number>(0);

  useEffect(() => {
    if (user?.id) {
      loadNewRequestsCount();
    }
  }, [user?.id]);

  const loadNewRequestsCount = async () => {
    if (!user?.id) return;
    try {
      const pendingOrders = await technicianOrderService.getConfirmingOrders(user.id);
      setNewRequestsCount(pendingOrders.length);
    } catch (err) {
      console.error('Error fetching notification count:', err);
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
        


        <h2 className="text-sm font-bold text-slate-200 hidden lg:block ml-4">
          Chào mừng quay lại, <span className="text-blue-400">{user?.fullName || 'Kỹ thuật viên'}</span> 👋
        </h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button 
          onClick={() => navigate('/technician/don-hang/dang-cho')}
          className="p-2.5 hover:bg-slate-800 rounded-xl relative text-slate-400 transition-all group"
          title={newRequestsCount > 0 ? `Bạn đang có ${newRequestsCount} yêu cầu mới cần xử lý` : "Không có yêu cầu mới"}
        >
          <Bell className="w-5 h-5 group-hover:text-red-400" />
          {newRequestsCount > 0 && (
            <span className="absolute top-1 right-1 text-[10px] font-black text-rose-500 animate-in zoom-in duration-300">
              {newRequestsCount}
            </span>
          )}
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
