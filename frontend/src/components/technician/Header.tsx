import { useState, useRef, useEffect } from 'react';
import { Menu, Bell, User, LogOut, ChevronDown } from 'lucide-react';
import useAuthStore from '@/store/authStore';

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuthStore();
  const userName = user?.fullName || 'Người dùng';
  const userEmail = user?.email || '';
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 border-b border-white/5 bg-[#050b18]/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-white/5 rounded-lg md:hidden transition-colors"
        >
          <Menu className="w-5 h-5 text-slate-400" />
        </button>
        <h2 className="text-base font-medium text-slate-300 hidden md:block">
          Chào mừng, {userName.split(' ')[0] || userName} 👋
        </h2>
      </div>

      <div className="flex items-center gap-3">

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 rounded-xl transition-colors border border-transparent hover:border-white/10"
          >
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <User className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-sm font-medium text-slate-300 hidden sm:inline">{userName}</span>
            <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-[#0f172a] rounded-xl shadow-2xl shadow-black/40 border border-white/10 py-2 z-50 backdrop-blur-2xl">
              <div className="px-4 py-3 border-b border-white/5">
                <p className="text-sm font-semibold text-white">{userName}</p>
                <p className="text-xs text-slate-500 mt-0.5">{userEmail}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => { logout(); setDropdownOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/5 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng Xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
