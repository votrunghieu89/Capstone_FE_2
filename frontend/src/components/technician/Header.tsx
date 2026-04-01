import { Menu, Bell, Settings, User, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuthStore from '@/store/authStore';

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuthStore();
  const userName = user?.fullName || 'Tham Khách Hàng';
  
  return (
    <header className="h-16 border-b border-white/5 bg-background/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-secondary rounded-lg md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-foreground hidden md:block">
          Chào mừng, {userName.split(' ')[0] || userName} 👋
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-secondary rounded-lg relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        </button>

        <div className="flex items-center gap-2 pl-4 border-l border-border">
          <Link to="/technician/cai-dat" className="p-2 hover:bg-secondary rounded-lg">
            <Settings className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 hover:bg-secondary rounded-lg">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium hidden sm:inline">{userName}</span>
            </button>
            <button 
              onClick={() => logout()}
              className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"
              title="Đăng xuất"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
