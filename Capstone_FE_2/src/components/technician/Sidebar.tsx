import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Users,
  TrendingUp,
  CreditCard,
  Settings,
  MessageSquare,
  User,
  ChevronDown,
  ClipboardList,
  CheckCircle
} from 'lucide-react';
import useAuthStore from '@/store/authStore';

const menuItems = [
  { href: '/technician', label: 'Bảng Điều Khiển', icon: LayoutDashboard },
  { 
    label: 'Đơn hàng', 
    icon: ClipboardList,
    id: 'orders',
    children: [
      { href: '/technician/don-hang/dang-cho', label: 'Yêu Cầu Mới', icon: FileText },
      { href: '/technician/don-hang/da-tiep-nhan', label: 'Đã Tiếp Nhận', icon: CheckCircle },
      { href: '/technician/don-hang/dang-thuc-hien', label: 'Đơn Thực Hiện', icon: Briefcase },
    ]
  },
  { href: '/technician/chat', label: 'Liên hệ', icon: MessageSquare },
  { href: '/technician/lich-su', label: 'Lịch Sử', icon: TrendingUp },
  { href: '/technician/ho-so', label: 'Profile', icon: Settings },
];

export function Sidebar({ isOpen }: { isOpen: boolean }) {
  const location = useLocation();
  const { user, isOnline } = useAuthStore();
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);

  // Auto-expand if on a sub-route
  useEffect(() => {
    const isOrderRoute = location.pathname.includes('/technician/don-hang');
    if (isOrderRoute) {
      setIsOrdersOpen(true);
    }
  }, [location.pathname]);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen w-64 bg-[#0f172a] border-r border-slate-800 transition-transform duration-300 md:relative md:translate-x-0',
        !isOpen && '-translate-x-full'
      )}
    >
      <div className="flex flex-col h-full">
        <div className="p-6 border-b border-slate-800">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-600/20">
              F
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">FastFix</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Technician Portal</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
          {menuItems.map((item) => {
            if (item.children) {
              const Icon = item.icon;
              const isChildActive = item.children.some(child => location.pathname === child.href);
              
              return (
                <div key={item.label} className="space-y-1">
                  <button
                    onClick={() => setIsOrdersOpen(!isOrdersOpen)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-bold group',
                      isChildActive && !isOrdersOpen
                        ? 'bg-blue-600/10 text-blue-400'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    )}
                  >
                    <Icon className={cn("w-5 h-5 transition-transform duration-200 group-hover:scale-110", isChildActive ? "text-blue-400" : "text-slate-500")} />
                    <span>{item.label}</span>
                    <ChevronDown className={cn(
                      "ml-auto w-4 h-4 transition-transform duration-300",
                      isOrdersOpen ? "rotate-180" : ""
                    )} />
                  </button>

                  {isOrdersOpen && (
                    <div className="space-y-1 ml-4 pl-4 border-l border-slate-800/50">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const isActive = location.pathname === child.href;
                        
                        return (
                          <Link
                            key={child.href}
                            to={child.href}
                            className={cn(
                              'flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-xs font-bold group',
                              isActive
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
                            )}
                          >
                            <ChildIcon className={cn("w-4 h-4", isActive ? "text-white" : "text-slate-600")} />
                            <span>{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-bold group',
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                )}
              >
                <Icon className={cn("w-5 h-5 transition-transform duration-200 group-hover:scale-110", isActive ? "text-white" : "text-slate-500")} />
                <span>{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>


      </div>
    </aside>
  );
}
