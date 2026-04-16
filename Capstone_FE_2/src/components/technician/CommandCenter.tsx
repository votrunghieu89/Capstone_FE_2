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
  TrendingDown,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import useAuthStore from '@/store/authStore';
import technicianOrderService from '@/services/technicianOrderService';
import technicianService from '@/services/technicianService';
import authService from '@/services/authService';
import { ViewOrderDTO } from '@/types/order';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { statisticService } from '@/services/statisticService';
import { startOfWeek, endOfWeek, format } from 'date-fns';

export function CommandCenter() {
  const { user, isOnline, setOnlineStatus } = useAuthStore();
  const [summary, setSummary] = useState<any>(null);
  const [newRequests, setNewRequests] = useState<ViewOrderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('month');
  const [isMapOpen, setIsMapOpen] = useState(false);
  
  // Real statistical data states
  const [todayReceived, setTodayReceived] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);

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
    { day: 'Tuần 4', count: 38 },
  ];

  const danangDistricts = [
    { name: 'Hải Châu', coords: [16.0678, 108.2135] as [number, number], count: 24, color: '#6366f1' },
    { name: 'Thanh Khê', coords: [16.06, 108.18] as [number, number], count: 18, color: '#10b981' },
    { name: 'Sơn Trà', coords: [16.08, 108.24] as [number, number], count: 12, color: '#f59e0b' },
    { name: 'Ngũ Hành Sơn', coords: [16.02, 108.25] as [number, number], count: 15, color: '#8b5cf6' },
    { name: 'Liên Chiểu', coords: [16.09, 108.14] as [number, number], count: 20, color: '#3b82f6' },
    { name: 'Cẩm Lệ', coords: [16.01, 108.19] as [number, number], count: 10, color: '#ef4444' },
  ];

  const activeChartData = chartData.length > 0 ? chartData : (timeRange === 'week' ? weekData : monthData);

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchChartData();
    }
  }, [user?.id, timeRange]);

  const fetchDashboardData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [today, total, rating, all, pending, profile] = await Promise.all([
        statisticService.getTodayReceivedCount(user.id).catch(() => 0),
        statisticService.getTotalCompletedCount(user.id).catch(() => 0),
        statisticService.getAverageRating(user.id).catch(() => 0),
        statisticService.getTotalOrders(user.id).catch(() => 0),
        technicianOrderService.getConfirmingOrders(user.id).catch(() => []),
        technicianService.getProfile(user.id).catch(() => null)
      ]);
      setTodayReceived(today);
      setTotalCompleted(total);
      setAvgRating(rating);
      setTotalOrders(all);
      setNewRequests(pending);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    if (!user?.id) return;
    try {
      if (timeRange === 'month') {
        const year = new Date().getFullYear();
        const data = await statisticService.getMonthlyPerformance(user.id, year);
        const formattedData = data.map((item: any) => ({
          day: item.label || '?',
          count: item.value || 0
        }));
        setChartData(formattedData);
      } else {
        const from = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
        const to = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
        const data = await statisticService.getWeeklyPerformance(user.id, from, to);
        const formattedData = data.map((item: any) => ({
          day: item.label || '?',
          count: item.value || 0
        }));
        setChartData(formattedData);
      }
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
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
            <div 
              onClick={handleToggleOnline}
              className="bg-[#0f172a]/60 backdrop-blur-xl border border-white/5 rounded-full p-1 flex items-center relative cursor-pointer shadow-2xl w-[280px] h-[48px] overflow-hidden"
            >
              {/* Sliding Background */}
              <motion.div
                initial={false}
                animate={{
                  x: isOnline ? 0 : 138,
                  backgroundColor: isOnline ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  borderColor: isOnline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                }}
                className="absolute inset-y-1 w-[138px] rounded-full border border-white/10 z-0"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />

              {/* Online Option */}
              <div className={cn(
                "flex-1 flex items-center justify-center gap-2.5 z-10 transition-colors duration-300",
                isOnline ? "text-emerald-400" : "text-slate-500"
              )}>
                <div className="relative">
                  <div className={cn("w-2 h-2 rounded-full", isOnline ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" : "bg-slate-600")} />
                  {isOnline && (
                    <motion.div 
                      layoutId="pulse"
                      className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-40" 
                    />
                  )}
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.15em]">Trực tuyến</span>
                {isOnline && <Zap size={12} className="animate-pulse" />}
              </div>

              {/* Offline Option */}
              <div className={cn(
                "flex-1 flex items-center justify-center gap-2.5 z-10 transition-colors duration-300",
                !isOnline ? "text-red-400" : "text-slate-500"
              )}>
                <div className="relative">
                  <div className={cn("w-2 h-2 rounded-full", !isOnline ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" : "bg-slate-600")} />
                  {!isOnline && (
                    <motion.div 
                      layoutId="pulse"
                      className="absolute inset-0 w-2 h-2 rounded-full bg-red-500 animate-ping opacity-40" 
                    />
                  )}
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.15em]">Ngoại tuyến</span>
                {!isOnline && <ShieldCheck size={12} />}
              </div>
            </div>
          </motion.div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0 overflow-hidden items-stretch">
          {/* Left Column: Stats + Performance Chart */}
          <div className="lg:col-span-8 flex flex-col gap-8 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
            {/* Stats Sub-Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 shrink-0">
               {/* Stat 1: Yêu cầu mới */}
              <motion.div variants={itemVariants} className="bg-[#0f172a]/80 backdrop-blur-xl border border-white/5 rounded-[24px] p-6 shadow-xl relative overflow-hidden group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                       YÊU CẦU MỚI
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-black text-white tracking-tighter">{newRequests.length}</span>
                      <span className="text-[12px] text-indigo-400/80 font-bold uppercase tracking-tight">Chờ xác nhận</span>
                    </div>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400 shadow-inner">
                     <FileText size={28} />
                  </div>
                </div>
                <div className="mt-4">
                   <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 w-[45%] rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-1000" />
                   </div>
                   <p className="text-[11px] text-slate-500 mt-3 font-black uppercase tracking-[0.1em] italic">SẴN SÀNG TIẾP NHẬN</p>
                </div>
              </motion.div>

              {/* Stat 2: Đã hoàn thành */}
              <motion.div variants={itemVariants} className="bg-[#0f172a]/80 backdrop-blur-xl border border-white/5 rounded-[24px] p-6 shadow-xl relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                       Hoàn thành
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-white tracking-tighter">{totalCompleted}</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400 shadow-inner">
                     <CheckCircle size={24} />
                  </div>
                </div>
                 <div className="mt-4">
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                       <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${totalOrders > 0 ? (totalCompleted / totalOrders) * 100 : 0}%` }}
                        className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.4)]" 
                       />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider italic">
                      {totalOrders > 0 ? `Tỷ lệ hoàn thành ${Math.round((totalCompleted / totalOrders) * 100)}%` : 'Chưa có đơn hàng'}
                    </p>
                 </div>
              </motion.div>

              {/* Stat 4: Đánh giá */}
              <motion.div variants={itemVariants} className="bg-[#0f172a]/80 backdrop-blur-xl border border-white/5 rounded-[24px] p-6 shadow-xl relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                       Đánh giá TB
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-white tracking-tighter">
                        {avgRating > 0 ? avgRating.toFixed(1) : '5.0'}
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-400 shadow-inner">
                     <Star size={24} />
                  </div>
                </div>
                 <div className="mt-4">
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                       <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(avgRating / 5) * 100}%` }}
                        className="h-full bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.4)]" 
                       />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider italic">
                      {avgRating > 0 ? `Uy tín vượt trội ${avgRating.toFixed(1)}/5` : 'Chưa có đánh giá'}
                    </p>
                 </div>
              </motion.div>
            </div>

            {/* Performance Chart Card */}
            <motion.div variants={itemVariants} className="flex-1 flex flex-col min-h-0">
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
                
                <div className="flex-1 w-full min-h-[300px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activeChartData}>
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
          </div>

          {/* Right Column: Full-Height Map */}
          <div className="lg:col-span-4 flex flex-col h-full min-h-0 overflow-y-auto pr-2 custom-scrollbar">
            {/* Da Nang Map (Bản đồ Đà Nẵng) - Expanded to Full Height */}
            <motion.div variants={itemVariants} className="flex-1 min-h-[500px] h-full">
              <div 
                onClick={() => setIsMapOpen(true)}
                className="bg-[#0f172a]/80 backdrop-blur-3xl rounded-[32px] border border-white/5 p-6 shadow-2xl h-full flex flex-col relative overflow-hidden group cursor-pointer hover:border-white/10 transition-colors"
              >
                <div className="flex items-center justify-between mb-8 shrink-0 px-2">
                  <div className="space-y-1">
                    <h3 className="text-[14px] font-black text-white uppercase tracking-[0.2em]">Bản đồ Đà Nẵng</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Phân bổ nhân sự trực tuyến toàn khu vực</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 text-slate-400 group-hover:text-indigo-400 transition-colors">
                    <Layers size={20} />
                  </div>
                </div>

                <div className="flex-1 w-full rounded-[24px] overflow-hidden border border-white/5 relative z-10 leaflet-dark-theme pointer-events-none">
                  <MapContainer 
                    center={[16.0544, 108.2022]} 
                    zoom={12} 
                    scrollWheelZoom={false} 
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                    attributionControl={false}
                  >
                    <TileLayer
                      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    />
                    {danangDistricts.map((district, idx) => (
                      <CircleMarker 
                        key={idx}
                        center={district.coords}
                        radius={10 + (district.count / 2.5)}
                        fillColor={district.color}
                        color="white"
                        weight={1.5}
                        fillOpacity={0.65}
                      />
                    ))}
                  </MapContainer>
                </div>

                {/* Bottom Stats Overlay */}
                <div className="absolute bottom-8 left-8 right-8 z-20 flex justify-between gap-6 pointer-events-none">
                   <div className="bg-slate-900/90 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/5 shadow-2xl">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-tighter mb-1">Khu vực ưu tiên</p>
                      <p className="text-[14px] font-black text-white tracking-wide">Hải Châu & Sơn Trà</p>
                   </div>
                   <div className="bg-emerald-500/20 backdrop-blur-md px-4 py-3 rounded-2xl border border-emerald-500/20 shadow-2xl">
                      <p className="text-[9px] font-black text-emerald-400 uppercase tracking-tighter mb-1">Kênh giám sát</p>
                      <p className="text-[14px] font-black text-emerald-400 flex items-center gap-2">
                         ON-SIDE <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      </p>
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </motion.div>

      {/* Map Insight Modal */}
      <AnimatePresence>
        {isMapOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#0f172a] border border-white/10 rounded-[40px] w-full max-w-[1400px] h-full max-h-[85vh] overflow-hidden relative shadow-[0_0_100px_rgba(0,0,0,0.5)]"
            >
              <div className="absolute top-8 left-10 z-20 space-y-2 pointer-events-none">
                <h2 className="text-4xl font-black text-white tracking-tighter">PHÂN BỔ CHI TIẾT</h2>
                <p className="text-indigo-400 font-bold uppercase text-[12px] tracking-[0.3em]">TP. Đà Nẵng | Chế độ theo dõi nâng cao</p>
              </div>

              <button 
                onClick={() => setIsMapOpen(false)}
                className="absolute top-8 right-10 z-20 w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 hover:border-white/20 transition-all hover:rotate-90 group"
              >
                < Zap className="group-hover:text-indigo-400 transition-colors" />
              </button>

              <div className="absolute inset-0 z-10">
                <MapContainer 
                  center={[16.0544, 108.2022]} 
                  zoom={13} 
                  style={{ height: '100%', width: '100%' }}
                  attributionControl={false}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  />
                  {danangDistricts.map((district, idx) => (
                    <CircleMarker 
                      key={idx}
                      center={district.coords}
                      radius={12 + (district.count / 2)}
                      fillColor={district.color}
                      color="white"
                      weight={2}
                      fillOpacity={0.7}
                    >
                      <Popup className="custom-leaflet-popup detail-popup">
                        <div className="p-4 min-w-[200px] bg-[#0f172a] rounded-xl">
                          <h4 className="font-black text-white border-b border-white/10 pb-2 mb-3 uppercase text-[12px] tracking-wider">
                            {district.name}
                          </h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center text-[12px]">
                              <span className="text-slate-400 font-bold">NHÂN SỰ TRỰC TUYẾN:</span>
                              <span className="font-black text-indigo-400">{district.count} KTV</span>
                            </div>
                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500" style={{ width: `${(district.count/40)*100}%` }} />
                            </div>
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-slate-500 font-medium">TỶ LỆ PHỦ SÓNG:</span>
                              <span className="text-emerald-400 font-black">CAO</span>
                            </div>
                          </div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>
              </div>

              {/* Bottom Decorative Element */}
              <div className="absolute bottom-8 left-10 right-10 z-20 flex items-center justify-between pointer-events-none">
                 <div className="flex gap-4">
                    {danangDistricts.slice(0, 3).map((d, i) => (
                       <div key={i} className="bg-white/5 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/5">
                          <div className="flex items-center gap-3">
                             <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                             <span className="text-[10px] font-black text-white uppercase">{d.name}</span>
                          </div>
                          <p className="text-[14px] font-black text-indigo-400 mt-1">{d.count}</p>
                       </div>
                    ))}
                 </div>
                 <div className="text-right">
                    <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest mb-1">Dữ liệu cập nhật thời gian thực</p>
                    <p className="text-white font-black text-[12px]">HỆ THỐNG PHÂN BỔ FASTFIX v.2.0</p>
                 </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

