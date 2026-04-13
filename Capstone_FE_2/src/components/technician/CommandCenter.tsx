import { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  MapPin,
  DollarSign,
  TrendingUp,
  Briefcase,
  Phone,
  ArrowRight,
  Star,
  MessageSquare,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  ArrowUpRight,
  TrendingDown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '@/store/authStore';
import technicianOrderService from '@/services/technicianOrderService';
import technicianService from '@/services/technicianService';
import authService from '@/services/authService';
import { ViewOrderDTO } from '@/types/order';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function CommandCenter() {
  const { user, isOnline, setOnlineStatus } = useAuthStore();
  const [summary, setSummary] = useState<any>(null);
  const [newRequests, setNewRequests] = useState<ViewOrderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('month');

  const weekData = [
    { day: 'T2', count: 4 },
    { day: 'T3', count: 7 },
    { day: 'T4', count: 5 },
    { day: 'T5', count: 9 },
    { day: 'T6', count: 12 },
    { day: 'T7', count: 10 },
    { day: 'CN', count: 6 },
  ];

  const monthData = [
    { day: 'Tuần 1', count: 25 },
    { day: 'Tuần 2', count: 32 },
    { day: 'Tuần 3', count: 28 },
    { day: 'Tuần 4', count: 45 },
  ];

  const chartData = timeRange === 'week' ? weekData : monthData;

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const [summaryData, pending] = await Promise.all([
        technicianService.getDashboardSummary(user.id).catch(() => null),
        technicianOrderService.getConfirmingOrders(user.id).catch(() => [])
      ]);
      setSummary(summaryData);
      setNewRequests(pending);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleOnline = async () => {
    const newStatus = !isOnline;
    setOnlineStatus(newStatus);
    try {
      if (user?.id) {
        await authService.updateOnlineStatus(user.id, newStatus ? 1 : 0);
        toast.success(newStatus ? 'Đã trực tuyến' : 'Đã ngoại tuyến');
      }
    } catch (err) {
      setOnlineStatus(!newStatus);
      toast.error('Lỗi cập nhật trạng thái');
    }
  };

  const stats = [
    {
      label: 'Tổng công việc',
      value: summary?.totalOrders || '0',
      sub: 'Tất cả đơn',
      icon: Briefcase,
      color: 'text-blue-400',
      trend: '+12%',
      bg: 'from-blue-600/20 to-transparent',
    },
    {
      label: 'Đã hoàn thành',
      value: summary?.completedOrders || '0',
      sub: 'Đơn thành công',
      icon: CheckCircle,
      color: 'text-emerald-400',
      trend: '+5%',
      bg: 'from-emerald-500/20 to-transparent',
    },
    {
      label: 'Đang xử lý',
      value: newRequests.length.toString(),
      sub: 'Chờ phản hồi',
      icon: Clock,
      color: 'text-amber-400',
      trend: (summary?.pendingOrders || '0') + ' đơn',
      bg: 'from-amber-500/20 to-transparent',
    },
    {
      label: 'Đánh giá trung bình',
      value: summary?.averageRating?.toFixed(1) || '5.0',
      sub: 'Điểm uy tín',
      icon: Star,
      color: 'text-indigo-400',
      trend: '4.9+',
      bg: 'from-indigo-400/20 to-transparent',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden relative dashboard-panel w-full bg-[#020617]">
      <div className="absolute inset-0 z-0 opacity-10">
        <img 
          src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop" 
          alt="dashboard background" 
          className="w-full h-full object-cover background-image" 
        />
      </div>
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#020617] to-[#0f172a]/95"></div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-col w-full h-full px-8 py-6 sm:px-12 lg:px-16 max-w-[1920px] mx-auto overflow-hidden dashboard-content"
      >
        {/* Premium Header Section */}
        <section className="flex shrink-0 flex-col lg:flex-row lg:items-center justify-between gap-8 mb-6">
          <motion.div variants={itemVariants} className="space-y-2">
            <div className="flex items-center gap-5 mb-2">
              <div className="w-16 h-1 bg-indigo-600 rounded-full"></div>
              <h3 className="text-[13px] font-black text-slate-500 uppercase tracking-[0.4em]">Hệ thống trung tâm</h3>
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter leading-none">Bảng điều khiển</h1>
            <p className="text-slate-500 font-bold uppercase text-[12px] tracking-[0.2em]">
              Hôm nay, {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </motion.div>
          
          <motion.div variants={itemVariants} className="flex items-center gap-8">
            <div className="bg-[#0f172a]/60 backdrop-blur-xl border border-white/5 rounded-full p-1.5 flex items-center gap-1.5 shadow-2xl">
              <div className={cn(
                "flex items-center gap-2.5 px-4 py-2 rounded-full transition-all duration-500",
                isOnline ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-slate-500"
              )}>
                <div className="relative">
                  <div className={cn("w-2 h-2 rounded-full", isOnline ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-slate-600")} />
                  {isOnline && <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-40"></div>}
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.15em]">{isOnline ? 'Đang trực tuyến' : 'Ngoại tuyến'}</span>
              </div>
              
              <button
                onClick={handleToggleOnline}
                className={cn(
                  "relative group px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.15em] transition-all overflow-hidden",
                  isOnline 
                    ? "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10" 
                    : "bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:scale-105 active:scale-95"
                )}
              >
                {isOnline ? 'Chuyển ngoại tuyến' : 'Bật trực tuyến ngay'}
              </button>
            </div>
          </motion.div>
        </section>

        {/* Modern Stats Grid - Premium Boxed Style */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 shrink-0">
          {/* Stat 1: Tổng công việc */}
          <motion.div variants={itemVariants} className="bg-[#0f172a]/80 backdrop-blur-xl border border-white/5 rounded-[24px] p-6 shadow-xl relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                   Tổng công việc
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white tracking-tighter">{summary?.totalOrders || 0}</span>
                  <span className="text-[11px] text-blue-400/70 font-bold uppercase">đã nhận</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400 shadow-inner">
                 <Briefcase size={24} />
              </div>
            </div>
            <div className="mt-4">
               <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[70%] rounded-full shadow-[0_0_10px_rgba(59,130,246,0.4)]" />
               </div>
               <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider italic">Tất cả đơn hàng</p>
            </div>
          </motion.div>

          {/* Stat 2: Đã hoàn thành */}
          <motion.div variants={itemVariants} className="bg-[#0f172a]/80 backdrop-blur-xl border border-white/5 rounded-[24px] p-6 shadow-xl relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                   Đã hoàn thành
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white tracking-tighter">{summary?.completedOrders || 0}</span>
                  <span className="text-[11px] text-emerald-500/70 font-bold uppercase">success unit</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400 shadow-inner">
                 <CheckCircle size={24} />
              </div>
            </div>
            <div className="mt-4">
               <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[85%] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
               </div>
               <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider italic">Đơn đã hoàn tất</p>
            </div>
          </motion.div>

          {/* Stat 3: Đang xử lý */}
          <motion.div variants={itemVariants} className="bg-[#0f172a]/80 backdrop-blur-xl border border-white/5 rounded-[24px] p-6 shadow-xl relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                   Đang xử lý
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white tracking-tighter">{newRequests.length}</span>
                  <span className="text-[11px] text-amber-500/70 font-bold uppercase">chờ phản hồi</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-400 shadow-inner">
                 <Clock size={24} />
              </div>
            </div>
            <div className="mt-4">
               <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 w-[50%] rounded-full shadow-[0_0_10px_rgba(245,158,11,0.4)]" />
               </div>
               <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider italic">Yêu cầu mới nhất</p>
            </div>
          </motion.div>

          {/* Stat 4: Đánh giá */}
          <motion.div variants={itemVariants} className="bg-[#0f172a]/80 backdrop-blur-xl border border-white/5 rounded-[24px] p-6 shadow-xl relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                   Đánh giá TB
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white tracking-tighter">{summary?.averageRating?.toFixed(1) || '5.0'}</span>
                  <span className="text-[11px] text-indigo-400/70 font-bold uppercase">trust point</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400 shadow-inner">
                 <Star size={24} />
              </div>
            </div>
            <div className="mt-4">
               <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 w-[90%] rounded-full shadow-[0_0_10px_rgba(99,102,241,0.4)]" />
               </div>
               <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider italic">Uy tín hệ thống</p>
            </div>
          </motion.div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0 overflow-hidden items-stretch">
          {/* Main Analytics Card - Flex Child */}
          <motion.div variants={itemVariants} className="lg:col-span-8 flex flex-col min-h-0">
            <div className="bg-[#0f172a]/80 backdrop-blur-3xl rounded-[32px] border border-white/5 p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col flex-1 min-h-0">
              <div className="relative z-10 flex shrink-0 flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                <div className="space-y-1">
                  <h3 className="text-[13px] font-black text-white uppercase tracking-[0.2em]">Hiệu năng công việc</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Đơn hàng hoàn thành theo thời gian</p>
                </div>
                
                <div className="flex items-center p-1 bg-white/5 backdrop-blur-xl rounded-xl border border-white/5 shrink-0">
                  {[
                    { id: 'week', label: 'Tuần' },
                    { id: 'month', label: 'Tháng' }
                  ].map((range) => (
                    <button 
                      key={range.id}
                      onClick={() => setTimeRange(range.id as any)}
                      className={cn(
                        "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-[0.1em] transition-all",
                        timeRange === range.id ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                      )}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex-1 w-full min-h-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.02)" />
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#475569', fontSize: 11, fontWeight: 900 }}
                      dy={15}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#475569', fontSize: 11, fontWeight: 900 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0f172a', 
                        borderColor: 'rgba(255,255,255,0.1)', 
                        borderRadius: '20px',
                        padding: '16px',
                        borderWidth: '1px'
                      }}
                      itemStyle={{ color: '#818cf8', fontWeight: '900', textTransform: 'uppercase', fontSize: '11px' }}
                      labelStyle={{ color: '#f8fafc', fontWeight: '900', marginBottom: '6px', fontSize: '13px' }}
                      formatter={(value: any) => [`${value} đơn`, 'Hoàn thành']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#6366f1" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorArea)" 
                      dot={{ fill: '#0f172a', stroke: '#6366f1', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 7, strokeWidth: 0, fill: '#818cf8' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>

          {/* Sidebar: Quick Actions - Large Font */}
          <motion.div variants={itemVariants} className="lg:col-span-4 flex flex-col min-h-0">
            <div className="bg-[#0f172a]/80 backdrop-blur-3xl rounded-[32px] border border-white/5 p-6 sm:p-8 shadow-2xl flex flex-col flex-1 min-h-0 space-y-6">
              <section className="space-y-6">
                <h3 className="text-[12px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center justify-between">
                  Hành động nhanh
                  <Zap size={14} className="opacity-20" />
                </h3>
                
                <div className="grid grid-cols-1 gap-3 overflow-y-auto custom-scrollbar flex-1 pr-2">
                  {[
                    { label: 'Gọi khách hàng', icon: Phone, color: 'hover:bg-blue-600', link: null },
                    { label: 'Nhắn tin hỗ trợ', icon: MessageSquare, color: 'hover:bg-indigo-600', link: '/technician/chat' },
                    { label: 'Bản đồ dẫn đường', icon: MapPin, color: 'hover:bg-emerald-600', link: null },
                    { label: 'Xem đánh giá', icon: Star, color: 'hover:bg-amber-600', link: '/technician/lich-su?tab=reviews' }
                  ].map((action, idx) => {
                    const Content = (
                      <div className={cn(
                        "group flex items-center justify-between p-4 bg-white/[0.02] rounded-[20px] border border-white/5 transition-all duration-300",
                        action.color,
                        "hover:translate-x-1.5"
                      )}>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-white transition-colors shrink-0">
                            <action.icon size={18} />
                          </div>
                          <span className="text-[12px] font-black text-slate-300 uppercase tracking-widest group-hover:text-white">{action.label}</span>
                        </div>
                        <ArrowUpRight size={16} className="text-slate-600 group-hover:text-white opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                      </div>
                    );

                    return action.link ? (
                      <Link key={idx} to={action.link} className="block w-full">{Content}</Link>
                    ) : (
                      <button key={idx} className="w-full text-left">{Content}</button>
                    );
                  })}
                </div>
              </section>


            </div>
          </motion.div>
        </section>
      </motion.div>
    </div>
  );
}
