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
  CheckCircle,
  AlertCircle,
  Bell
} from 'lucide-react';
import useAuthStore from '@/store/authStore';
import technicianOrderService from '@/services/technicianOrderService';

const menuItems = [
  { href: '/technician', label: 'Bảng Điều Khiển', icon: LayoutDashboard },
  { 
    label: 'Đơn hàng', 
    icon: ClipboardList,
    id: 'orders',
    children: [
      { href: '/technician/don-hang/dang-cho', label: 'Yêu Cầu Mới', icon: FileText },
      { href: '/technician/don-hang/da-tiep-nhan', label: 'Đã Tiếp Nhận', icon: CheckCircle },
      { href: '/technician/don-hang/dang-thuc-hien', label: 'Đang Thực Hiện', icon: Briefcase },
    ]
  },
  { href: '/technician/chat', label: 'Liên hệ', icon: MessageSquare },
  { href: '/technician/lich-su', label: 'Lịch Sử', icon: TrendingUp },
  { href: '/technician/ho-so', label: 'Profile', icon: User },
];

export function Sidebar({ isOpen }: { isOpen: boolean }) {
  const location = useLocation();
  const { user, isOnline } = useAuthStore();
  const [counts, setCounts] = useState({
    confirming: 0,
    confirmed: 0,
    inProgress: 0,
  });
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    orders: location.pathname.includes('/technician/don-hang'),
    history: location.pathname.includes('/technician/lich-su')
  });

  useEffect(() => {
    if (user?.id) {
      loadCounts();
    }
  }, [user?.id, location.pathname]);

  const loadCounts = async () => {
    if (!user?.id) return;
    try {
      const results = await Promise.allSettled([
        technicianOrderService.getConfirmingOrders(user.id),
        technicianOrderService.getConfirmedOrders(user.id),
        technicianOrderService.getInProgressOrder(user.id)
      ]);
      
      const confirming = results[0].status === 'fulfilled' ? results[0].value : [];
      const confirmed = results[1].status === 'fulfilled' ? results[1].value : [];
      const inProgress = results[2].status === 'fulfilled' ? results[2].value : null;
      
      const getLength = (data: any, isSingle = false) => {
        if (!data) return 0;
        if (Array.isArray(data)) return data.length;
        if (data.value && Array.isArray(data.value)) return data.value.length;
        if (data.data && Array.isArray(data.data)) return data.data.length;
        if (data.$values && Array.isArray(data.$values)) return data.$values.length;
        // If it's expected to be a single object (like inProgress), return 1 if it exists
        if (isSingle && typeof data === 'object') return 1;
        return 0;
      };

      setCounts({
        confirming: getLength(confirming),
        confirmed: getLength(confirmed),
        inProgress: getLength(inProgress, true)
      });
    } catch (err) {
      console.error('Failed to load sidebar counts:', err);
    }
  };

  // Auto-expand if on a sub-route
  useEffect(() => {
    setOpenMenus(prev => ({
      ...prev,
      orders: prev.orders || location.pathname.includes('/technician/don-hang'),
      history: prev.history || location.pathname.includes('/technician/lich-su')
    }));
  }, [location.pathname]);

  const toggleMenu = (id: string) => {
    setOpenMenus(prev => ({ ...prev, [id]: !prev[id] }));
  };

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
              const isChildActive = item.children.some(child => location.pathname === child.href || location.search.includes(child.href.split('?')[1] || 'never_match'));
              const isOpen = item.id ? openMenus[item.id] : false;
              
              return (
                <div key={item.label} className="space-y-1">
                  <button
                    onClick={() => item.id && toggleMenu(item.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-bold group',
                      isChildActive && !isOpen
                        ? 'bg-blue-600/10 text-blue-400'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    )}
                  >
                    <Icon className={cn("w-5 h-5 transition-transform duration-200 group-hover:scale-110", isChildActive ? "text-blue-400" : "text-slate-500")} />
                    <span>{item.label}</span>
                    
                    {/* Parent Notification Bell */}
                    {item.id === 'orders' && (counts.confirming > 0 || counts.confirmed > 0 || counts.inProgress > 0) && (
                      <Bell size={14} className="ml-1 text-rose-500 animate-pulse drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                    )}

                    <ChevronDown className={cn(
                      "ml-auto w-4 h-4 transition-transform duration-300",
                      isOpen ? "rotate-180" : ""
                    )} />
                  </button>

                  {isOpen && (
                    <div className="space-y-1 ml-4 pl-4 border-l border-slate-800/50">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const isActive = location.pathname === child.href.split('?')[0] && 
                          (child.href.includes('?') ? location.search.includes(child.href.split('?')[1]) : true);
                        
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
                            {child.href.includes('dang-cho') && counts.confirming > 0 && (
                              <Bell size={14} className="ml-auto text-rose-500 animate-pulse drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]" />
                            )}
                            {child.href.includes('da-tiep-nhan') && counts.confirmed > 0 && (
                              <Bell size={14} className="ml-auto text-rose-500 animate-pulse drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]" />
                            )}
                            {child.href.includes('dang-thuc-hien') && counts.inProgress > 0 && (
                              <Bell size={14} className="ml-auto text-rose-500 animate-pulse drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]" />
                            )}
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
