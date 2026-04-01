import { useState, useEffect } from 'react';
import { MapPin, Clock, Phone, MessageSquare, CheckCircle, AlertCircle, Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import technicianOrderService from '@/services/technicianOrderService';
import useAuthStore from '@/store/authStore';
import { toast } from 'sonner';

export function InProgress() {
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState<any[]>([]);
  const [completedJobs, setCompletedJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const [activeData, historyData] = await Promise.all([
        technicianOrderService.getInProgressOrders(user.id),
        technicianOrderService.getHistoryOrders(user.id)
      ]);
      setJobs(activeData || []);
      setCompletedJobs((historyData || []).slice(0, 5)); // Show latest 5
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Không thể tải danh sách công việc');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async (orderId: string) => {
    try {
      await technicianOrderService.completeOrder({ orderId });
      toast.success('Đã hoàn thành công việc!');
      fetchData();
    } catch (error) {
      console.error('Error completing job:', error);
      toast.error('Không thể hoàn thành yêu cầu này');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Công Việc Đang Thực Hiện</h1>
        <p className="text-muted-foreground mt-1">Theo dõi công việc hiện tại và đã hoàn thành</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {jobs.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">Đang Làm Việc</h2>
              {jobs.map((job) => (
                <Card key={job.id} className="p-6 border-l-4 border-l-blue-500 shadow-sm transition-all hover:shadow-md">
                  <div className="mb-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-foreground">{job.title || 'Dịch vụ sửa chữa'}</h3>
                        <p className="text-sm text-foreground/80 font-medium mt-1">{job.customerName || 'Khách hàng'}</p>
                      </div>
                      <span className="self-start px-3 py-1 bg-blue-100/80 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-xs font-bold">
                        Đang Thực Hiện
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                      <div className="flex items-start gap-3 text-sm">
                        <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground font-medium mb-1">Địa Chỉ</p>
                          <p className="font-semibold text-foreground line-clamp-2">{job.address || 'Hà Nội'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 text-sm">
                        <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground font-medium mb-1">Bắt Đầu</p>
                          <p className="font-semibold text-foreground">
                            {job.updatedAt ? new Date(job.updatedAt).toLocaleTimeString('vi-VN') : 'Vừa xong'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 text-sm">
                        <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground font-medium mb-1">Số Điện Thoại</p>
                          <p className="font-semibold text-foreground">{job.customerPhone || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6 p-4 bg-secondary/50 rounded-xl border border-border/50">
                    <p className="text-sm font-bold text-foreground mb-2">Mô Tả</p>
                    <p className="text-sm text-foreground/80">{job.description || 'Không có ghi chú'}</p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      className="flex-1 bg-background text-foreground border-border hover:bg-secondary font-semibold h-11" 
                      variant="outline"
                      onClick={() => window.open(`tel:${job.customerPhone}`, '_self')}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Gọi Khách Hàng
                    </Button>
                    <Button className="flex-1 bg-foreground text-background hover:bg-foreground/90 font-semibold h-11" 
                      variant="default"
                      onClick={() => handleComplete(job.id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Đánh Dấu Hoàn Thành
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
             <div className="text-center py-10 text-muted-foreground border rounded-xl border-dashed">
                Bạn chưa có công việc nào đang thực hiện.
             </div>
          )}

          {completedJobs.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground mt-8">Hoàn Thành Gần Đây</h2>
              <div className="grid gap-3">
                {completedJobs.map((job) => (
                  <Card key={job.id} className="p-5 border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-foreground">{job.title || 'Dịch vụ đã xong'}</h4>
                        <p className="text-sm font-medium text-foreground/80 mt-1">{job.customerName || 'Khách hàng'}</p>
                      </div>
                      <div className="sm:text-right">
                        <p className="text-sm font-medium text-muted-foreground">
                          {job.updatedAt ? new Date(job.updatedAt).toLocaleDateString('vi-VN') : 'Mới đây'}
                        </p>
                        <div className="flex items-center sm:justify-end gap-1 mt-2">
                          <div className="flex gap-0.5">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          </div>
                          <span className="text-xs font-bold text-muted-foreground ml-1">{job.rating || 5.0}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
