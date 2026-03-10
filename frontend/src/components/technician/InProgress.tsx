import { useState } from 'react';
import { MapPin, Clock, Phone, MessageSquare, CheckCircle, AlertCircle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function InProgress() {
  const [jobs] = useState([
    {
      id: 1,
      title: 'Sửa Chữa Điều Hòa - Văn Phòng Trung Tâm',
      customer: 'Công Ty John',
      customerPhone: '+84 (0555) 123-4567',
      location: 'Trung Tâm, cách 2.3 km',
      address: '456 Đường Sồi, Phòng 200',
      startTime: '10:30',
      elapsedTime: '45 phút',
      estimatedRemaining: '15 phút',
      progress: 75,
      notes: 'Thay thế máy nén, đang kiểm tra hệ thống',
    },
  ]);

  const completedJobs = [
    {
      id: 2,
      title: 'Lắp Đặt Vòi Nước Bếp',
      customer: 'Sarah Martinez',
      completedTime: '13:30',
      rating: 5,
      price: '95.000đ',
    },
    {
      id: 3,
      title: 'Thay Thế Ổ Cắm Điện',
      customer: 'Michael Chen',
      completedTime: '09:45',
      rating: 4.8,
      price: '60.000đ',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Công Việc Đang Thực Hiện</h1>
        <p className="text-muted-foreground mt-1">Theo dõi công việc hiện tại và đã hoàn thành</p>
      </div>

      {jobs.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Đang Làm Việc</h2>
          {jobs.map((job) => (
            <Card key={job.id} className="p-6 border-l-4 border-l-blue-500 shadow-sm transition-all hover:shadow-md">
              <div className="mb-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{job.title}</h3>
                    <p className="text-sm text-foreground/80 font-medium mt-1">{job.customer}</p>
                  </div>
                  <span className="self-start px-3 py-1 bg-blue-100/80 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-xs font-bold">
                    Đang Thực Hiện
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6 pb-6 border-b border-border/50">
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-1">Vị Trí</p>
                      <p className="font-semibold text-foreground">{job.location}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-1">Đã Làm</p>
                      <p className="font-semibold text-foreground">{job.elapsedTime}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-1">Còn Lại (Dự Kiến)</p>
                      <p className="font-semibold text-foreground">{job.estimatedRemaining}</p>
                    </div>
                  </div>
                  <div className="text-sm">
                    <p className="text-xs text-muted-foreground font-medium mb-1">Địa Chỉ</p>
                    <p className="font-semibold text-foreground">{job.address}</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm font-bold text-foreground mb-3">Tiến Độ</p>
                <div className="w-full bg-secondary rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-foreground h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
                <p className="text-xs font-medium text-muted-foreground mt-2">{job.progress}% hoàn thành</p>
              </div>

              <div className="mb-6 p-4 bg-secondary/50 rounded-xl border border-border/50">
                <p className="text-sm font-bold text-foreground mb-2">Ghi Chú Công Việc</p>
                <p className="text-sm text-foreground/80">{job.notes}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button className="flex-1 bg-background text-foreground border-border hover:bg-secondary font-semibold h-11" variant="outline">
                  <Phone className="w-4 h-4 mr-2" />
                  Gọi Khách Hàng
                </Button>
                <Button className="flex-1 bg-background text-foreground border-border hover:bg-secondary font-semibold h-11" variant="outline">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Gửi Tin Nhắn
                </Button>
                <Button className="flex-1 bg-foreground text-background hover:bg-foreground/90 font-semibold h-11" variant="default">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Đánh Dấu Hoàn Thành
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {completedJobs.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground mt-8">Hoàn Thành Hôm Nay</h2>
          <div className="grid gap-3">
            {completedJobs.map((job) => (
              <Card key={job.id} className="p-5 border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-foreground">{job.title}</h4>
                    <p className="text-sm font-medium text-foreground/80 mt-1">{job.customer}</p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-sm font-medium text-muted-foreground">Hoàn thành lúc {job.completedTime}</p>
                    <div className="flex items-center sm:justify-end gap-1 mt-2">
                      <div className="flex gap-0.5">
                        {Array.from({ length: Math.floor(job.rating) }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-amber-500 fill-amber-500" />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-muted-foreground ml-1">{job.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
