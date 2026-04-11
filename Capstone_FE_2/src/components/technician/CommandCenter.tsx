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
    <div className="max-w-[1920px] mx-auto px-8 sm:px-16 lg:px-24">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-8 pb-20 pt-10"
      >
        {/* Premium Header Section */}
        <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
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
            <div className="bg-[#0f172a]/60 backdrop-blur-xl border border-white/5 rounded-[32px] p-2 flex items-center gap-3 shadow-2xl">
              <div className={cn(
                "flex items-center gap-4 px-6 py-3 rounded-2xl transition-all duration-500",
                isOnline ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-slate-500"
              )}>
                <div className="relative">
                  <div className={cn("w-2.5 h-2.5 rounded-full", isOnline ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" : "bg-slate-600")} />
                  {isOnline && <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping opacity-40"></div>}
                </div>
                <span className="text-[12px] font-black uppercase tracking-[0.2em]">{isOnline ? 'Đang trực tuyến' : 'Ngoại tuyến'}</span>
              </div>
              
              <button
                onClick={handleToggleOnline}
                className={cn(
                  "relative group px-8 py-3 rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] transition-all overflow-hidden",
                  isOnline 
                    ? "bg-white/5 text-slate-400 hover:text-white" 
                    : "bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:scale-105 active:scale-95"
                )}
              >
                {isOnline ? 'Chuyển ngoại tuyến' : 'Bật trực tuyến ngay'}
              </button>
            </div>
          </motion.div>
        </section>

        {/* Modern Stats Grid - Compact P-6 */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div 
                key={idx} 
                variants={itemVariants}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="group relative overflow-hidden bg-[#0f172a]/40 backdrop-blur-3xl rounded-[32px] border border-white/5 p-8 transition-all hover:border-white/10"
              >
                <div className="relative flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 shadow-inner", stat.color)}>
                      <Icon size={24} />
                    </div>
                    <div className={cn("text-[10px] font-black px-2.5 py-1 rounded-lg bg-white/5", stat.trend.includes('+') ? "text-emerald-400" : "text-amber-400")}>
                      {stat.trend}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-[36px] font-black text-white leading-none tracking-tighter">{stat.value}</span>
                      <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">{stat.sub}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          {/* Main Analytics Card - Fixed 425px Height */}
          <motion.div variants={itemVariants} className="lg:col-span-8">
            <div className="bg-[#0f172a]/40 backdrop-blur-3xl rounded-[40px] border border-white/5 p-8 md:p-10 shadow-2xl relative overflow-hidden h-full">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="space-y-1">
                  <h3 className="text-[14px] font-black text-white uppercase tracking-[0.2em]">Hiệu năng công việc</h3>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Đơn hàng hoàn thành theo thời gian</p>
                </div>
                
                <div className="flex items-center p-1 bg-white/5 backdrop-blur-xl rounded-xl border border-white/5">
                  {[
                    { id: 'week', label: 'Tuần' },
                    { id: 'month', label: 'Tháng' }
                  ].map((range) => (
                    <button 
                      key={range.id}
                      onClick={() => setTimeRange(range.id as any)}
                      className={cn(
                        "px-5 py-2 rounded-lg text-[11px] font-black uppercase tracking-[0.1em] transition-all",
                        timeRange === range.id ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                      )}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="h-[320px] w-full relative">
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
          <motion.div variants={itemVariants} className="lg:col-span-4 h-full">
            <div className="bg-[#0f172a]/40 backdrop-blur-3xl rounded-[40px] border border-white/5 p-8 md:p-10 shadow-2xl flex flex-col h-full space-y-10">
              <section className="space-y-6">
                <h3 className="text-[12px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center justify-between">
                  Hành động nhanh
                  <Zap size={14} className="opacity-20" />
                </h3>
                
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { label: 'Gọi khách hàng', icon: Phone, color: 'hover:bg-blue-600', link: null },
                    { label: 'Nhắn tin hỗ trợ', icon: MessageSquare, color: 'hover:bg-indigo-600', link: '/technician/chat' },
                    { label: 'Bản đồ dẫn đường', icon: MapPin, color: 'hover:bg-emerald-600', link: null },
                    { label: 'Xem đánh giá', icon: Star, color: 'hover:bg-amber-600', link: '/technician/lich-su?tab=reviews' }
                  ].map((action, idx) => {
                    const Content = (
                      <div className={cn(
                        "group flex items-center justify-between p-5 bg-white/[0.02] rounded-2xl border border-white/5 transition-all duration-300",
                        action.color,
                        "hover:translate-x-1.5"
                      )}>
                        <div className="flex items-center gap-5">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
                            <action.icon size={20} />
                          </div>
                          <span className="text-[13px] font-black text-slate-300 uppercase tracking-widest group-hover:text-white">{action.label}</span>
                        </div>
                        <ArrowUpRight size={18} className="text-slate-600 group-hover:text-white opacity-0 group-hover:opacity-100 transition-all" />
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

              <div className="p-8 bg-gradient-to-br from-indigo-600/10 to-transparent rounded-[32px] border border-white/5 relative overflow-hidden mt-auto">
                 <div className="relative z-10 space-y-2.5">
                   <div className="flex items-center gap-3 text-indigo-400">
                      <Star size={16} fill="currentColor" />
                      <h4 className="text-[13px] font-black text-white uppercase tracking-widest">Mẹo Pro</h4>
                   </div>
                   <p className="text-[12px] text-slate-400 leading-relaxed font-medium">
                     Tỷ lệ hoàn thành &gt; <span className="text-white font-bold">95%</span> để nhận huy hiệu <span className="text-indigo-400 font-bold tracking-tighter uppercase px-2 py-0.5 bg-indigo-400/10 rounded-md">Elite Expert</span>.
                   </p>
                 </div>
              </div>
            </div>
          </motion.div>
        </section>
      </motion.div>
    </div>
  );
}
