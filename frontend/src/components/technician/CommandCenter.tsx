import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock, CheckCircle, AlertCircle, MapPin, DollarSign,
  TrendingUp, Phone, Briefcase, Star, ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area
} from 'recharts';

const completedJobsData = [
  { name: 'Th 2', count: 4 },
  { name: 'Th 3', count: 6 },
  { name: 'Th 4', count: 3 },
  { name: 'Th 5', count: 7 },
  { name: 'Th 6', count: 5 },
  { name: 'Th 7', count: 8 },
  { name: 'CN', count: 6 },
];

export function CommandCenter() {
  const [isOnline, setIsOnline] = useState(true);

  const stats = [
    { label: 'Công Việc Hôm Nay', value: '4', icon: Briefcase, color: 'blue', trend: '+2' },
    { label: 'Hoàn Thành', value: '2', icon: CheckCircle, color: 'green', trend: '100%' },
    { label: 'Đang Thực Hiện', value: '1', icon: Clock, color: 'amber', trend: 'Active' },
  ];

  const colorMap: Record<string, { icon: string; iconBg: string; text: string }> = {
    blue: { icon: 'text-blue-400', iconBg: 'bg-blue-500/10', text: 'text-blue-400' },
    green: { icon: 'text-emerald-400', iconBg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    emerald: { icon: 'text-emerald-400', iconBg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    amber: { icon: 'text-amber-400', iconBg: 'bg-amber-500/10', text: 'text-amber-400' },
    red: { icon: 'text-red-400', iconBg: 'bg-red-500/10', text: 'text-red-400' },
  };

  const upcomingJobs = [
    { id: 1, title: 'Sửa Chữa Điều Hòa - Văn Phòng Trung Tâm', customer: 'Công Ty John', time: '10:30 SA', location: 'Trung Tâm, cách 2.3 km', price: '85.000đ', priority: 'high' },
    { id: 2, title: 'Lắp Đặt Ống Nước', customer: 'Sarah Martinez', time: '13:00', location: 'Giữa Thành Phố, cách 5.1 km', price: '120.000đ', priority: 'medium' },
  ];

  const priorityMap: Record<string, { label: string; bg: string; text: string; border: string }> = {
    high: { label: 'Ưu Tiên Cao', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-l-rose-500' },
    medium: { label: 'Ưu Tiên Trung Bình', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-l-amber-500' },
    low: { label: 'Ưu Tiên Thấp', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-l-blue-500' },
  };

  return (
    <div className="p-2 md:p-6 space-y-6 pb-20 overflow-x-hidden">
      {/* Header with Online/Offline Toggle */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            Bảng Điều Khiển
            <span className="text-blue-500">Live</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <button
          onClick={() => setIsOnline(!isOnline)}
          className={cn(
            'relative flex items-center gap-3 px-1 py-1 rounded-full transition-all duration-500 border-2 w-[160px]',
            isOnline
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-slate-500/10 border-slate-500/30'
          )}
        >
          <motion.div
            layout
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center shadow-lg',
              isOnline ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'
            )}
            initial={false}
            animate={{ x: isOnline ? 116 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            {isOnline ? <TrendingUp size={16} /> : <Clock size={16} />}
          </motion.div>
          
          <AnimatePresence mode="wait">
            <motion.span
              key={isOnline ? 'online' : 'offline'}
              initial={{ opacity: 0, x: isOnline ? -10 : 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isOnline ? 10 : -10 }}
              className={cn(
                'absolute text-[11px] font-bold uppercase tracking-widest',
                isOnline ? 'left-4 text-emerald-400' : 'right-4 text-slate-500'
              )}
            >
              {isOnline ? 'Trực Tuyến' : 'Ngoại Tuyến'}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          const colors = colorMap[stat.color];
          return (
            <motion.div
              key={idx}
              whileHover={{ y: -5 }}
              className="bg-[#0f172a]/50 backdrop-blur-md rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={cn('p-3 rounded-xl', colors.iconBg)}>
                  <Icon className={cn('w-5 h-5', colors.icon)} />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                  <ArrowUpRight size={10} />
                  {stat.trend}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-extrabold text-foreground mt-1">{stat.value}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Earnings Chart */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#0f172a]/50 backdrop-blur-md rounded-2xl p-6 border border-white/5 shadow-xl h-full">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-bold text-foreground">Công Việc Đã Hoàn Thành Trong Tuần</h2>
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-2 text-blue-400">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  Số lượng công việc
                </div>
              </div>
            </div>
            
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={completedJobsData}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#f1f5f9', fontWeight: 'bold' }}
                    formatter={(value) => [`${value} công việc`, 'Số lượng']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorCount)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Quick Actions & Tips */}
        <div className="space-y-6">
          <div className="bg-[#0f172a]/50 backdrop-blur-md rounded-2xl p-6 border border-white/5 shadow-xl">
            <h2 className="text-base font-bold text-foreground mb-4">Lịch Công Việc</h2>
            <div className="space-y-4">
              {upcomingJobs.map((job) => {
                const p = priorityMap[job.priority];
                return (
                  <div key={job.id} className={cn('p-4 rounded-xl bg-white/[0.03] border border-white/5 border-l-4 transition-all hover:bg-white/[0.05]', p.border)}>
                    <p className="text-xs font-bold text-blue-400 mb-1">{job.time}</p>
                    <h3 className="text-sm font-bold text-slate-200">{job.title}</h3>
                    <p className="text-[11px] text-slate-500 mt-1">{job.customer} • {job.location}</p>
                  </div>
                );
              })}
            </div>
            <Link 
              to="/technician/don-hang/da-tiep-nhan"
              className="w-full mt-4 flex items-center justify-center py-2 text-xs font-bold text-blue-500 hover:text-blue-400 transition-colors uppercase tracking-widest no-underline border border-blue-500/20 rounded-lg hover:bg-blue-500/5"
            >
              Xem Toàn Bộ Lịch
            </Link>
          </div>

          <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl p-6 border border-blue-500/20">
            <h3 className="font-bold text-blue-400 mb-2 flex items-center gap-2 text-sm">
              <Star className="w-4 h-4 fill-blue-400" />
              Mẹo Của Ngày
            </h3>
            <p className="text-[13px] text-slate-300 leading-relaxed italic">
              "Giao tiếp là chìa khóa. Luôn thông báo cho khách hàng nếu bạn đến trễ hơn 5 phút để bảo vệ đánh giá 5 sao của mình."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
