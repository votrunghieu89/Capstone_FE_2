import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  User,
  Package,
  Clock,
  CheckCircle2,
  Loader2,
  History,
  Star,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import useAuthStore from '@/store/authStore';
import { motion, AnimatePresence } from 'framer-motion';

interface MenuItem {
  href: string;
  label: string;
  icon: React.ElementType;
  children?: { href: string; label: string; icon: React.ElementType }[];
}

const menuItems: MenuItem[] = [
  { href: '/technician', label: 'Bảng Điều Khiển', icon: LayoutDashboard },
  { href: '/technician/ho-so', label: 'Hồ Sơ', icon: User },
  {
    href: '/technician/don-hang',
    label: 'Đơn Hàng',
    icon: Package,
    children: [
      { href: '/technician/don-hang/dang-cho', label: 'Đơn hàng đang chờ', icon: Clock },
      { href: '/technician/don-hang/da-tiep-nhan', label: 'Đơn hàng đã tiếp nhận', icon: CheckCircle2 },
      { href: '/technician/don-hang/dang-thuc-hien', label: 'Đơn hàng đang thực hiện', icon: Loader2 },
    ],
  },
  { href: '/technician/lich-su', label: 'Lịch Sử', icon: History },
];

export function Sidebar({ isOpen }: { isOpen: boolean }) {
  const { logout } = useAuthStore();
  const location = useLocation();
  const pathname = location.pathname;
  const [ordersOpen, setOrdersOpen] = useState(
    pathname.startsWith('/technician/don-hang')
  );

  const isItemActive = (href: string, hasChildren?: boolean) => {
    if (hasChildren) return pathname.startsWith(href);
    if (href === '/technician') return pathname === '/technician';
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen w-64 bg-[#0a1122] border-r border-white/5 transition-transform duration-300 md:relative md:translate-x-0 overflow-hidden',
        !isOpen && '-translate-x-full'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/5">
          <Link to="/" className="group no-underline">
            <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-1">
              <span className="text-white">Fast</span>
              <span className="text-blue-400">Fix</span>
            </h1>
          </Link>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em] mt-1">
            Trung Tâm Kỹ Thuật Viên
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item.href, !!item.children);

            if (item.children) {
              return (
                <div key={item.href}>
                  <button
                    onClick={() => setOrdersOpen(!ordersOpen)}
                    className={cn(
                      'w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-left',
                      active
                        ? 'bg-blue-500/10 text-blue-400 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={cn('w-[18px] h-[18px]', active ? 'text-blue-400' : 'text-slate-500')} />
                      <span className="text-sm">{item.label}</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 transition-transform duration-200',
                        ordersOpen && 'rotate-180',
                        active ? 'text-blue-400' : 'text-slate-500'
                      )}
                    />
                  </button>

                  <AnimatePresence>
                    {ordersOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-4 mt-1 space-y-0.5 border-l border-white/10 pl-3">
                          {item.children.map((child) => {
                            const ChildIcon = child.icon;
                            const childActive = pathname === child.href || pathname.startsWith(child.href + '/');
                            return (
                              <Link
                                key={child.href}
                                to={child.href}
                                className={cn(
                                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm no-underline',
                                  childActive
                                    ? 'bg-blue-500/10 text-blue-400 font-semibold'
                                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                                )}
                              >
                                <ChildIcon className={cn('w-4 h-4', childActive ? 'text-blue-400' : 'text-slate-600')} />
                                <span>{child.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 no-underline',
                  active
                    ? 'bg-blue-500/10 text-blue-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                )}
              >
                <Icon className={cn('w-[18px] h-[18px]', active ? 'text-blue-400' : 'text-slate-500')} />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="px-3 pb-4 space-y-2 border-t border-white/5 pt-4">
          <div className="mx-2 px-4 py-3 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-center gap-3 group hover:bg-white/10 transition-all duration-300">
            <span className="text-xl font-bold text-white tracking-tight">4.9</span>
            <Star className="w-5 h-5 fill-amber-400 text-amber-400 group-hover:scale-110 transition-transform duration-300" />
          </div>

          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
          >
            <LogOut className="w-[18px] h-[18px]" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
