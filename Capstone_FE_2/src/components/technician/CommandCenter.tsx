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
      const [pending, todayCompleted, totalCompleted, avgRating, totalAll, profile] = await Promise.all([
        technicianOrderService.getConfirmingOrders(user.id).catch(() => []),
        statisticService.getTodayCompletedCount(user.id).catch(() => 0),
        statisticService.getTotalCompletedCount(user.id).catch(() => 0),
        statisticService.getAverageRating(user.id).catch(() => 0),
        statisticService.getTotalOrders(user.id).catch(() => 0),
        technicianService.getProfile(user.id).catch(() => null)
      ]);
      
      setNewRequests(Array.isArray(pending) ? pending : []);
      setTodayReceived(pending.length);
      setTotalCompleted(todayCompleted);
      setAllTimeCompleted(totalCompleted);
      setAvgRating(avgRating);
      setTotalOrders(totalAll);
      setProfile(profile);

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
      if (timeRange === 'day') {
        const orders = await technicianOrderService.getHistoryOrders(user.id);
        const todayDate = new Date().toDateString();
        
        const todayOrders = (orders || []).filter(o => new Date(o.orderDate).toDateString() === todayDate);
        
        const labels = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
        const dataMap = new Map<string, number>();
        labels.forEach(l => dataMap.set(l, 0));
        
        todayOrders.forEach(o => {
           const hour = new Date(o.orderDate).getHours();
           let slot = '00:00';
           if (hour >= 3 && hour < 6) slot = '03:00';
           else if (hour >= 6 && hour < 9) slot = '06:00';
           else if (hour >= 9 && hour < 12) slot = '09:00';
           else if (hour >= 12 && hour < 15) slot = '12:00';
           else if (hour >= 15 && hour < 18) slot = '15:00';
           else if (hour >= 18 && hour < 21) slot = '18:00';
           else if (hour >= 21) slot = '21:00';
           
           dataMap.set(slot, dataMap.get(slot)! + 1);
        });

        const formattedData = labels.map(l => ({ day: l, count: dataMap.get(l) || 0 }));
        setChartData(formattedData);
      } else if (timeRange === 'month') {
        const year = new Date().getFullYear();
        const data = await statisticService.getMonthlyPerformance(user.id, year);
        const formattedData = data.map((item: any) => ({
          day: item.label ? `${item.label.replace('Tháng ', '')}/${year}` : '?',
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
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((newRequests.length / 10) * 100, 100)}%` }}
                        className="h-full bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                      />
                   </div>
                   <p className="text-[11px] text-slate-500 mt-3 font-black uppercase tracking-[0.1em] italic">
                      {newRequests.length > 5 ? 'LƯU LƯỢNG CAO' : 'SẴN SÀNG TIẾP NHẬN'}
                   </p>
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
                      <span className="text-5xl font-black text-white tracking-tighter">{totalCompleted}</span>
                    </div>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400 shadow-inner">
                     <CheckCircle size={28} />
                  </div>
                </div>
                 <div className="mt-4">
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                       <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${totalOrders > 0 ? (allTimeCompleted / totalOrders) * 100 : 0}%` }}
                        className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.4)]" 
                       />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider italic">
                      Đơn đã hoàn thành
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
                      <span className="text-5xl font-black text-white tracking-tighter">
                        {avgRating > 0 ? avgRating.toFixed(1) : '5.0'}
                      </span>
                    </div>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-400 shadow-inner">
                     <Star size={28} />
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
                      {avgRating > 0 ? `Uy tín vượt trội ${avgRating.toFixed(1)}` : 'Chưa có đánh giá'}
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
                        tick={{ fill: '#475569', fontSize: 10, fontWeight: 800 }}
                        dy={10}
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
            <motion.div variants={itemVariants} className="flex-1 w-full">
              <div 
                className="bg-white/[0.02] backdrop-blur-3xl rounded-[32px] border border-white/5 p-6 lg:p-8 flex flex-col shadow-2xl relative overflow-hidden group transition-colors"
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

                <div className="relative rounded-2xl overflow-hidden border border-white/5 aspect-video bg-slate-900 group cursor-crosshair shrink-0">
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
          </div>
        </section>
      </motion.div>


    </div>
  );
}
