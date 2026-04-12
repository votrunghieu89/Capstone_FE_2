import {
  Users,
  Award,
  TrendingUp,
  DollarSign,
  Star,
  ArrowUpRight,
  Target
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';

export function Analytics() {
  const stats = [
    {
      label: 'Tổng Công Việc',
      value: '24',
      change: '+12%',
      isPositive: true,
      icon: Users,
    },
    {
      label: 'Tỷ Lệ Hoàn Thành',
      value: '98%',
      change: '+3%',
      isPositive: true,
      icon: Award,
    },
    {
      label: 'Đánh Giá Trung Bình',
      value: '4.85',
      change: '+0.2',
      isPositive: true,
      icon: Star,
    },
    {
      label: 'Tổng Thu Nhập',
      value: '28.400.000đ',
      change: '+18%',
      isPositive: true,
      icon: DollarSign,
    },
  ];

  const weeklyPerformance = [
    { day: 'Thứ 2', jobs: 3, earnings: '2.100.000đ', percentage: 60 },
    { day: 'Thứ 3', jobs: 4, earnings: '3.200.000đ', percentage: 80 },
    { day: 'Thứ 4', jobs: 5, earnings: '4.100.000đ', percentage: 100 },
    { day: 'Thứ 5', jobs: 4, earnings: '3.400.000đ', percentage: 80 },
    { day: 'Thứ 6', jobs: 3, earnings: '2.400.000đ', percentage: 60 },
    { day: 'Thứ 7', jobs: 2, earnings: '1.800.000đ', percentage: 40 },
    { day: 'CN', jobs: 1, earnings: '900.000đ', percentage: 20 },
  ];

  const topServices = [
    { name: 'Lắp Đặt Hệ Thống HVAC', jobs: 8, revenue: '12.000.000đ', percentage: 100 },
    { name: 'Nâng Cấp Tủ Điện', jobs: 6, revenue: '9.000.000đ', percentage: 75 },
    { name: 'Sửa Chữa Ống Nước', jobs: 5, revenue: '5.000.000đ', percentage: 62 },
    { name: 'Dịch Vụ Sửa Chữa Điều Hòa', jobs: 4, revenue: '4.000.000đ', percentage: 50 },
    { name: 'Thay Thế Bình Nước Nóng', jobs: 3, revenue: '6.000.000đ', percentage: 37 },
  ];

  const ratingBreakdown = [
    { stars: 5, reviews: 320, percentage: 75 },
    { stars: 4, reviews: 85, percentage: 20 },
    { stars: 3, reviews: 15, percentage: 4 },
    { stars: 2, reviews: 3, percentage: 1 },
    { stars: 1, reviews: 1, percentage: 0 },
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

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Phân Tích Hiệu Suất</h1>
        <p className="text-muted-foreground mt-1 text-lg">Theo dõi hiệu suất và thu nhập của bạn</p>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div variants={itemVariants} key={idx}>
              <Card className="p-6 h-full flex flex-col justify-between border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-zinc-50 dark:bg-zinc-900 rounded-xl">
                    <Icon className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${stat.isPositive ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' : 'bg-rose-50 text-rose-600'}`}>
                    {stat.change}
                    <ArrowUpRight className="w-3 h-3" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-500 uppercase tracking-wider">{stat.label}</p>
                  <h3 className="text-2xl font-bold mt-1 tracking-tight">{stat.value}</h3>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-8 border-zinc-100 dark:border-zinc-800 rounded-3xl shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold">Weekly Performance</h2>
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
               <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
               Số lượng công việc
            </div>
          </div>
          <div className="space-y-5">
            {weeklyPerformance.map((day, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-12 text-sm font-bold text-zinc-400">{day.day}</div>
                <div className="flex-1 flex items-center">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${day.percentage}%` }}
                    transition={{ duration: 1, delay: idx * 0.1, ease: "easeOut" }}
                    className="h-9 bg-zinc-900 dark:bg-zinc-100 rounded-xl flex items-center px-4 relative group cursor-pointer overflow-hidden"
                  >
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                    <span className="text-xs text-white dark:text-zinc-900 font-bold z-10">{day.jobs} jobs</span>
                  </motion.div>
                </div>
                <div className="w-24 text-right text-sm font-bold tracking-tight">{day.earnings}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-8 border-zinc-100 dark:border-zinc-800 rounded-3xl shadow-sm">
          <h2 className="text-xl font-bold mb-8">Top Service Types</h2>
          <div className="space-y-8">
            {topServices.map((service, idx) => (
              <div key={idx} className="group cursor-pointer">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-500 transition-colors">{service.name}</span>
                    <p className="text-xs text-zinc-400 mt-1 uppercase font-bold tracking-widest">{service.jobs} JOBS COMPLETED</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg tracking-tight">{service.revenue}</div>
                  </div>
                </div>
                <div className="relative h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                   <motion.div 
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: service.percentage / 100 }}
                      transition={{ duration: 1, delay: 0.5 + (idx * 0.1) }}
                      style={{ originX: 0 }}
                      className="absolute inset-0 bg-blue-500 rounded-full"
                   />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-8 border-zinc-100 dark:border-zinc-800 rounded-3xl shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h2 className="text-2xl font-bold">Rating Breakdown</h2>
            <p className="text-zinc-500 mt-1">Dựa trên 428 đánh giá từ khách hàng</p>
          </div>
          <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl">
             <div className="text-center px-4">
                <div className="text-3xl font-black italic">4.9</div>
                <div className="flex gap-0.5 mt-1">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                </div>
             </div>
             <div className="h-10 w-px bg-zinc-200 dark:bg-zinc-800" />
             <div className="px-4">
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Năng suất</div>
                <div className="text-sm font-bold text-emerald-500">+15% vs Tháng trước</div>
             </div>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8 items-end">
          {ratingBreakdown.map((rating, idx) => (
            <div key={idx} className="flex-1 w-full flex flex-col items-center group">
              <div className="flex items-center gap-2 mb-4 font-black text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
                {rating.stars} <Star className={`w-4 h-4 ${rating.stars === 5 ? 'fill-amber-400 text-amber-400' : 'fill-zinc-200 text-zinc-200'}`} />
              </div>
              <div className="w-full h-40 bg-zinc-50 dark:bg-zinc-900 rounded-2xl relative overflow-hidden mb-4 border border-zinc-100 dark:border-zinc-800">
                 <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${rating.percentage}%` }}
                    transition={{ duration: 1.5, delay: 0.8 + (idx * 0.1), ease: "circOut" }}
                    className="w-full bg-zinc-900 dark:bg-zinc-100 absolute bottom-0 transition-all duration-300 group-hover:bg-blue-600"
                 />
              </div>
              <div className="text-center">
                 <div className="text-sm font-black tracking-tight">{rating.reviews}</div>
                 <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{rating.percentage}%</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
