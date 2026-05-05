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
  FileText,
  XCircle,
  ShieldAlert
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import useAuthStore from '@/store/authStore';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { getMapEmbedSrc, getMapEmbedSrcByAddress } from '@/utils/mapUtils';

const currentLocationIcon = new L.DivIcon({
  className: 'custom-location-icon',
  html: '<div class="relative flex items-center justify-center w-8 h-8"><div class="absolute w-full h-full bg-rose-500 rounded-full animate-ping opacity-75"></div><div class="relative w-4 h-4 bg-rose-500 rounded-full border-2 border-white shadow-[0_0_20px_rgba(244,63,94,1)]"></div></div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});
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
  const [orderLocations, setOrderLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');
  const [isMapOpen, setIsMapOpen] = useState(false);
  const { location: currentLoc } = useCurrentLocation();
  
  // Real statistical data states
  const [todayReceived, setTodayReceived] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0); // Dùng để hiển thị số đơn hoàn thành TRONG NGÀY
  const [allTimeCompleted, setAllTimeCompleted] = useState(0); // Dùng cho thanh tiến trình
  const [totalOrders, setTotalOrders] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);
  const [totalCanceled, setTotalCanceled] = useState(0);
  const [totalRejected, setTotalRejected] = useState(0);
  const [techLocation, setTechLocation] = useState<{address: string, cityName: string} | null>(null);
  const [profile, setProfile] = useState<any>(null);

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
      const [pending, todayCompleted, totalCompleted, avgRating, totalAll, profile, canceledTotal, rejectedTotal] = await Promise.all([
        technicianOrderService.getConfirmingOrders(user.id).catch(() => []),
        statisticService.getTodayCompletedCount(user.id).catch(() => 0),
        statisticService.getTotalCompletedCount(user.id).catch(() => 0),
        statisticService.getAverageRating(user.id).catch(() => 0),
        statisticService.getTotalOrders(user.id).catch(() => 0),
        technicianService.getProfile(user.id).catch(() => null),
        statisticService.getTotalCanceled(user.id).catch(() => 0),
        statisticService.getTotalRejected(user.id).catch(() => 0)
      ]);
      
      setNewRequests(Array.isArray(pending) ? pending : []);
      setTodayReceived(pending.length);
      setTotalCompleted(todayCompleted);
      setAllTimeCompleted(totalCompleted);
      setAvgRating(avgRating);
      setTotalOrders(totalAll);
      setProfile(profile);
      setTotalCanceled(canceledTotal);
      setTotalRejected(rejectedTotal);

      try {
        const loc = await technicianOrderService.getTechnicianLocation(user.id);
        setTechLocation(loc);
      } catch (err) {
        console.error("Lỗi lấy vị trí KTV:", err);
      }
      // Fetch Locations for the map
      if (Array.isArray(pending) && pending.length > 0) {
        const locs = await Promise.all(
          pending.map(async (order: ViewOrderDTO) => {
            try {
              // coords is { address, cityName }, no latitude/longitude
              // if (coords?.latitude != null && coords?.longitude != null) { ... }
              return null;
            } catch {
              return null;
            }
          })
        );
        setOrderLocations(locs.filter(l => l !== null));
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    if (!user?.id) return;
    try {
      // Gọi song song 3 API: Hoàn thành, Đã hủy, Từ chối
      const [completedOrders, canceledOrders, rejectedOrders] = await Promise.all([
        technicianOrderService.getHistoryOrders(user.id).catch(() => []),
        technicianOrderService.getCanceledOrders(user.id).catch(() => []),
        technicianOrderService.getRejectedOrders(user.id).catch(() => []),
      ]);

      if (timeRange === 'month') {
        const year = new Date().getFullYear();
        
        const completedMap = new Map<number, number>();
        const canceledMap = new Map<number, number>();
        const rejectedMap = new Map<number, number>();
        for (let i = 1; i <= 12; i++) { completedMap.set(i, 0); canceledMap.set(i, 0); rejectedMap.set(i, 0); }
        
        (completedOrders || []).filter(o => new Date(o.orderDate).getFullYear() === year).forEach(o => {
          const m = new Date(o.orderDate).getMonth() + 1;
          completedMap.set(m, completedMap.get(m)! + 1);
        });
        (canceledOrders || []).filter(o => new Date(o.orderDate).getFullYear() === year).forEach(o => {
          const m = new Date(o.orderDate).getMonth() + 1;
          canceledMap.set(m, canceledMap.get(m)! + 1);
        });
        (rejectedOrders || []).filter(o => new Date(o.orderDate).getFullYear() === year).forEach(o => {
          const m = new Date(o.orderDate).getMonth() + 1;
          rejectedMap.set(m, rejectedMap.get(m)! + 1);
        });

        const formattedData = Array.from({ length: 12 }, (_, i) => i + 1).map(m => ({
          day: `${m}/${year}`,
          completed: completedMap.get(m) || 0,
          canceled: canceledMap.get(m) || 0,
          rejected: rejectedMap.get(m) || 0,
        }));
        setChartData(formattedData);
      } else {
        // timeRange === 'week' (7 ngày gần nhất)
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        const start = new Date();
        start.setDate(end.getDate() - 6);
        start.setHours(0, 0, 0, 0);

        const labels: string[] = [];
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          labels.push(format(new Date(d), 'dd/MM/yyyy'));
        }

        const completedMap = new Map<string, number>();
        const canceledMap = new Map<string, number>();
        const rejectedMap = new Map<string, number>();
        labels.forEach(l => { completedMap.set(l, 0); canceledMap.set(l, 0); rejectedMap.set(l, 0); });

        const inRange = (o: any) => { const d = new Date(o.orderDate); return d >= start && d <= end; };

        (completedOrders || []).filter(inRange).forEach(o => {
          const label = format(new Date(o.orderDate), 'dd/MM/yyyy');
          if (completedMap.has(label)) completedMap.set(label, completedMap.get(label)! + 1);
        });
        (canceledOrders || []).filter(inRange).forEach(o => {
          const label = format(new Date(o.orderDate), 'dd/MM/yyyy');
          if (canceledMap.has(label)) canceledMap.set(label, canceledMap.get(label)! + 1);
        });
        (rejectedOrders || []).filter(inRange).forEach(o => {
          const label = format(new Date(o.orderDate), 'dd/MM/yyyy');
          if (rejectedMap.has(label)) rejectedMap.set(label, rejectedMap.get(label)! + 1);
        });

        const formattedData = labels.map(label => ({
          day: label.substring(0, 5),
          completed: completedMap.get(label) || 0,
          canceled: canceledMap.get(label) || 0,
          rejected: rejectedMap.get(label) || 0,
        }));
        setChartData(formattedData);
      }
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
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
          
          <motion.div variants={itemVariants} className="flex items-center gap-4">
             {/* Dynamic Live Indicator */}
             <div className="bg-indigo-500/10 border border-indigo-500/20 px-6 py-3 rounded-2xl backdrop-blur-md flex items-center gap-3 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
                <div className="relative">
                   <div className={cn("w-2.5 h-2.5 rounded-full", isOnline ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                </div>
                <div className="flex flex-col">
                   <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Trạng thái hiện tại</span>
                   <span className={cn("text-xs font-black uppercase tracking-widest", isOnline ? "text-emerald-400" : "text-rose-400")}>
                      {isOnline ? 'Đang trực tuyến' : 'Đang ngoại tuyến'}
                   </span>
                </div>
             </div>
          </motion.div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0 overflow-hidden">
          {/* Row 1: 4 Stats Cards — chia đều toàn bộ chiều ngang */}
          <div className="lg:col-span-12">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Stat 1: Hoàn thành */}
              <motion.div variants={itemVariants} className="bg-[#0f172a]/80 backdrop-blur-xl border border-white/5 rounded-[24px] p-6 shadow-xl relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                       Hoàn thành
                    </p>
                    <span className="text-5xl font-black text-white tracking-tighter">{totalCompleted}</span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                     <CheckCircle size={24} />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${totalOrders > 0 ? (allTimeCompleted / totalOrders) * 100 : 0}%` }} className="h-full bg-emerald-500 rounded-full" />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider italic">Đơn đã hoàn thành</p>
                </div>
              </motion.div>

              {/* Stat 2: Đơn hủy */}
              <motion.div variants={itemVariants} className="bg-[#0f172a]/80 backdrop-blur-xl border border-white/5 rounded-[24px] p-6 shadow-xl relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                       Đơn hủy
                    </p>
                    <span className="text-5xl font-black text-white tracking-tighter">{totalCanceled}</span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 text-rose-400">
                     <XCircle size={24} />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${totalOrders > 0 ? (totalCanceled / totalOrders) * 100 : 0}%` }} className="h-full bg-rose-500 rounded-full" />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider italic">Đơn bị hủy</p>
                </div>
              </motion.div>

              {/* Stat 3: Từ chối */}
              <motion.div variants={itemVariants} className="bg-[#0f172a]/80 backdrop-blur-xl border border-white/5 rounded-[24px] p-6 shadow-xl relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                       Từ chối
                    </p>
                    <span className="text-5xl font-black text-white tracking-tighter">{totalRejected}</span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-orange-400">
                     <ShieldAlert size={24} />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${totalOrders > 0 ? (totalRejected / totalOrders) * 100 : 0}%` }} className="h-full bg-orange-500 rounded-full" />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider italic">Đơn đã từ chối</p>
                </div>
              </motion.div>

              {/* Stat 4: Đánh giá TB */}
              <motion.div variants={itemVariants} className="bg-[#0f172a]/80 backdrop-blur-xl border border-white/5 rounded-[24px] p-6 shadow-xl relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                       Đánh giá TB
                    </p>
                    <span className="text-5xl font-black text-white tracking-tighter">{avgRating > 0 ? avgRating.toFixed(1) : '5.0'}</span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-400">
                     <Star size={24} />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(avgRating / 5) * 100}%` }} className="h-full bg-amber-500 rounded-full" />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider italic">{avgRating > 0 ? `Uy tín ${avgRating.toFixed(1)}/5` : 'Chưa có đánh giá'}</p>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Row 2 Left: Biểu đồ Hiệu năng công việc (col-span-8) */}
          <motion.div variants={itemVariants} className="lg:col-span-8 flex flex-col min-h-0">
              <div className="bg-[#0f172a]/80 backdrop-blur-3xl rounded-[32px] border border-white/5 p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col flex-1 min-h-0">
                <div className="relative z-10 flex shrink-0 flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                  <div className="space-y-1">
                    <h3 className="text-[13px] font-black text-white uppercase tracking-[0.2em]">Hiệu năng công việc</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Thống kê đơn hàng theo thời gian</p>
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
                        <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorCanceled" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorRejected" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.02)" />
                      <XAxis 
                        dataKey="day" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#475569', fontSize: 10, fontWeight: 800 }}
                        dy={10}
                      />
                      <YAxis 
                        allowDecimals={false}
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
                        labelStyle={{ color: '#f8fafc', fontWeight: '900', marginBottom: '6px', fontSize: '13px' }}
                        formatter={(value: any, name: any) => {
                          const labels: Record<string, string> = { completed: 'Hoàn thành', canceled: 'Đã hủy', rejected: 'Từ chối' };
                          return [`${value} đơn`, labels[name as string] || name];
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="completed" 
                        name="completed"
                        stroke="#6366f1" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorCompleted)" 
                        dot={{ fill: '#0f172a', stroke: '#6366f1', strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 6, strokeWidth: 0, fill: '#818cf8' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="canceled" 
                        name="canceled"
                        stroke="#ef4444" 
                        strokeWidth={2.5}
                        fillOpacity={1} 
                        fill="url(#colorCanceled)" 
                        dot={{ fill: '#0f172a', stroke: '#ef4444', strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 6, strokeWidth: 0, fill: '#f87171' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="rejected" 
                        name="rejected"
                        stroke="#f97316" 
                        strokeWidth={2.5}
                        fillOpacity={1} 
                        fill="url(#colorRejected)" 
                        dot={{ fill: '#0f172a', stroke: '#f97316', strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 6, strokeWidth: 0, fill: '#fb923c' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
          </motion.div>

          {/* Row 2 Right: Vị trí dịch vụ (col-span-4) — ngang đều với biểu đồ */}
          <motion.div variants={itemVariants} className="lg:col-span-4 flex flex-col">
              <div 
                className="bg-white/[0.02] backdrop-blur-3xl rounded-[32px] border border-white/5 p-6 lg:p-8 flex flex-col flex-1 shadow-2xl relative overflow-hidden group transition-colors"
              >
                <div className="flex items-start justify-between mb-8 shrink-0 px-2">
                  <div className="space-y-4 shrink-0">
                    <h3 className="text-[11px] font-black text-[#2DD4BF] uppercase tracking-[0.4em] mb-2 shrink-0">VỊ TRÍ DỊCH VỤ</h3>
                    {[
                      { label: 'THÀNH PHỐ', value: profile?.city || 'Đà Nẵng' },
                      { label: 'ĐỊA CHỈ CỤ THỂ', value: profile?.address || 'Chưa cập nhật' }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-4">
                        <div className="mt-0.5 w-8 h-8 rounded-full bg-[#2DD4BF]/10 flex items-center justify-center text-[#2DD4BF] shrink-0">
                          <MapPin size={14} />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{item.label}</p>
                          <p className="text-sm font-bold text-slate-200 uppercase">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative rounded-2xl overflow-hidden border border-white/5 flex-1 min-h-[200px] bg-slate-900 group cursor-crosshair">
                   <iframe 
                      key={techLocation ? `${techLocation.address}-${techLocation.cityName}` : (currentLoc ? `${currentLoc.lat},${currentLoc.lng}` : 'profile')}
                      width="100%" 
                      height="100%" 
                      frameBorder="0" 
                      style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%)' }} 
                      src={techLocation ? getMapEmbedSrcByAddress(`${techLocation.address}, ${techLocation.cityName}`, 13) : getMapEmbedSrc(currentLoc, profile?.latitude, profile?.longitude, 13)} 
                      allowFullScreen
                    ></iframe>
                   <div className="absolute bottom-4 left-4 right-4 p-4 bg-black/80 backdrop-blur-md rounded-2xl border border-white/10 text-center">
                      <p className="text-[11px] font-black text-white uppercase leading-none mb-1 tracking-tight">{profile?.city ? `${profile.city} CITY` : 'ĐÀ NẴNG CITY'}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em]">ACTIVE COVERAGE</p>
                   </div>
                </div>

              </div>
          </motion.div>
        </section>
      </motion.div>


    </div>
  );
}
