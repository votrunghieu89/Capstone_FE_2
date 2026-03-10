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
  LogOut,
  Star,
} from 'lucide-react';
import useAuthStore from '@/store/authStore';
import { motion } from 'framer-motion';

const menuItems = [
  { href: '/technician', label: 'Bảng Điều Khiển', icon: LayoutDashboard },
  { href: '/technician/yeu-cau-moi', label: 'Yêu Cầu Mới', icon: FileText },
  { href: '/technician/dang-thuc-hien', label: 'Đang Thực Hiện', icon: Briefcase },
  { href: '/technician/khach-hang', label: 'Khách Hàng', icon: Users },
  { href: '/technician/giao-tiep', label: 'Giao Tiếp', icon: MessageSquare },
  { href: '/technician/phan-tich', label: 'Phân Tích', icon: TrendingUp },
  { href: '/technician/thanh-toan', label: 'Thanh Toán', icon: CreditCard },
  { href: '/technician/cai-dat', label: 'Cài Đặt', icon: Settings },
];

export function Sidebar({ isOpen }: { isOpen: boolean }) {
  const { logout } = useAuthStore();
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen w-72 bg-zinc-950 border-r border-white/5 transition-transform duration-300 md:relative md:translate-x-0 overflow-hidden',
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
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center font-black italic text-lg shadow-lg shadow-blue-600/20">F</div>
              <span>Fast<span className="text-blue-500">Fix</span></span>
            </motion.h1>
          </Link>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mt-2 ml-1">Technician Portal</p>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = item.href === '/technician'
                ? pathname === '/technician'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'group flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 relative',
                  isActive
                    ? 'bg-white/10 text-white font-bold'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav"
                    className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full"
                  />
                )}
                <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive ? "text-blue-500" : "")} />
                <span className="text-sm tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6">
          <div className="bg-zinc-900/50 rounded-3xl p-6 border border-white/5 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-blue-600/10 rounded-full group-hover:scale-150 transition-transform duration-700" />
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">
              Performance Rating
            </p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-white italic">4.9</span>
              <div className="flex mb-1.5">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />)}
              </div>
            </div>
            <p className="text-[10px] font-bold text-zinc-500 mt-2">428 Reviews analysis</p>
          </div>
          
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-4 px-6 py-4 text-sm font-bold text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all mt-4 group"
          >
            <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
