import { useState } from 'react';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  MapPin,
  DollarSign,
  TrendingUp,
  Users,
  Phone,
  Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';

export function CommandCenter() {
  const [isOnline, setIsOnline] = useState(true);

  const stats = [
    {
      label: 'Công Việc Hôm Nay',
      value: '4',
      icon: Briefcase,
      color: 'text-blue-600',
    },
    {
      label: 'Hoàn Thành',
      value: '2',
      icon: CheckCircle,
      color: 'text-green-600',
    },
    {
      label: 'Đang Thực Hiện',
      value: '1',
      icon: Clock,
      color: 'text-amber-600',
    },
    {
      label: 'Chờ Xử Lý',
      value: '1',
      icon: AlertCircle,
      color: 'text-red-600',
    },
    {
      label: 'Thu Nhập Hôm Nay',
      value: '180.000đ',
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      label: 'Đánh Giá',
      value: '4.9',
      icon: TrendingUp,
      color: 'text-amber-600',
    },
  ];

  const upcomingJobs = [
    {
      id: 1,
      title: 'Sửa Chữa Điều Hòa - Văn Phòng Trung Tâm',
      customer: 'Công Ty John',
      time: '10:30 SA',
      location: 'Trung Tâm, cách 2.3 km',
      price: '85.000đ',
      priority: 'high',
    },
    {
      id: 2,
      title: 'Lắp Đặt Ống Nước',
      customer: 'Sarah Martinez',
      time: '13:00',
      location: 'Giữa Thành Phố, cách 5.1 km',
      price: '120.000đ',
      priority: 'medium',
    },
    {
      id: 3,
      title: 'Kiểm Tra Điện',
      customer: 'Công Ty Tech Solutions',
      time: '15:00',
      location: 'Khu Kinh Doanh, cách 8.4 km',
      price: '95.000đ',
      priority: 'low',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Bảng Điều Khiển</h1>
          <p className="text-muted-foreground mt-1">Thứ Hai, 3 Tháng 3, 2025</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isOnline ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-zinc-500'}`}>
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
            <span className="font-semibold text-xs uppercase tracking-wider">{isOnline ? 'Trực Tuyến' : 'Ngoại Tuyến'}</span>
          </div>
          <Button
            onClick={() => setIsOnline(!isOnline)}
            variant={isOnline ? 'default' : 'outline'}
          >
            {isOnline ? 'Chuyển Ngoại Tuyến' : 'Chuyển Trực Tuyến'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="p-6 bg-white/5 border-white/5 rounded-2xl shadow-sm hover:shadow-md transition-all hover:bg-white/[0.07] group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-2xl font-black text-white mt-1 italic tracking-tight">{stat.value}</p>
                </div>
                <div className={cn("p-3 rounded-xl bg-white/5 group-hover:scale-110 transition-transform", stat.color.replace('text-', 'bg-').replace('600', '500/10'))}>
                  <Icon className={cn("w-6 h-6", stat.color.replace('600', '500'))} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4">Lịch Hôm Nay</h2>
            <div className="space-y-3">
              {upcomingJobs.map((job) => (
                <Card
                  key={job.id}
                  className="p-5 bg-white/5 border-white/5 border-l-4 border-l-blue-500 hover:shadow-lg transition-all hover:bg-white/[0.07] group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg group-hover:text-blue-400 transition-colors">{job.title}</h3>
                      <p className="text-sm text-zinc-400 font-medium mt-0.5">{job.customer}</p>
                    </div>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      job.priority === 'high' ? 'bg-rose-500/10 text-rose-500' :
                      job.priority === 'medium' ? 'bg-amber-500/10 text-amber-500' :
                      'bg-blue-500/10 text-blue-500'
                    )}>
                      {job.priority === 'high' ? 'Ưu Tiên Cao' : job.priority === 'medium' ? 'Trung Bình' : 'Thấp'}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-xs font-bold uppercase tracking-widest">
                    <div className="flex items-center gap-2 text-zinc-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{job.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-500">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{job.location}</span>
                    </div>
                    <div className="text-blue-500 ml-auto text-sm">{job.price}</div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4">Hành Động Nhanh</h2>
            <div className="space-y-2">
              <Button className="w-full justify-start gap-2" variant="outline">
                <Phone className="w-4 h-4" />
                Gọi Khách Hàng Tiếp Theo
              </Button>
              <Button className="w-full justify-start gap-2" variant="outline">
                <MapPin className="w-4 h-4" />
                Lấy Hướng Dẫn
              </Button>
              <Button className="w-full justify-start gap-2" variant="outline">
                <CheckCircle className="w-4 h-4" />
                Đánh Dấu Công Việc Hoàn Thành
              </Button>
              <Button className="w-full justify-start gap-2" variant="outline">
                <AlertCircle className="w-4 h-4" />
                Báo Cáo Vấn Đề
              </Button>
            </div>
          </div>

          <Card className="p-6 bg-blue-600/5 border-blue-500/10 rounded-2xl">
            <h3 className="font-bold text-blue-400 mb-2 flex items-center gap-2">
              <Star className="w-4 h-4 fill-blue-400" />
              Mẹo Của Ngày
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed font-medium">
              Hoàn thành công việc kịp thời và giao tiếp tốt với khách hàng để duy trì đánh giá 4.9!
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
