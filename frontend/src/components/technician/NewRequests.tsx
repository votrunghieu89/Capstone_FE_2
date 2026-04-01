import { useState, useEffect } from 'react';
import { MapPin, Clock, Star, Filter, CheckCircle, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import technicianOrderService from '@/services/technicianOrderService';
import useAuthStore from '@/store/authStore';
import { toast } from 'sonner';

export function NewRequests() {
  const { user } = useAuthStore();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const data = await technicianOrderService.getConfirmingOrders(user.id);
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Không thể tải danh sách yêu cầu mới');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (orderId: string) => {
    try {
      await technicianOrderService.confirmOrder({ orderId });
      toast.success('Đã chấp nhận yêu cầu công việc!');
      fetchOrders(); // Refresh list
    } catch (error) {
      console.error('Error accepting order:', error);
      toast.error('Không thể chấp nhận yêu cầu này');
    }
  };

  const filteredRequests = orders; // Simplify filter for now, can add back later if Backend supports Urgency

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Yêu Cầu Dịch Vụ Mới</h1>
        <p className="text-muted-foreground mt-1">
          Chọn công việc phù hợp với khả năng và chuyên môn của bạn
        </p>
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        {[
          { id: 'all', label: 'Tất Cả Yêu Cầu' },
          { id: 'urgent', label: 'Chỉ Cấp Bách' },
          { id: 'normal', label: 'Thường Xuyên' },
          { id: 'low', label: 'Đã Lên Lịch' },
        ].map((filter) => (
          <button
            key={filter.id}
            onClick={() => setSelectedFilter(filter.id)}
            className={`px-4 py-2 rounded-full font-medium transition-colors border flex items-center gap-2 ${
              selectedFilter === filter.id
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-border hover:bg-secondary'
            }`}
          >
            <Filter className="w-4 h-4" />
            {filter.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            Không có yêu cầu mới nào vào lúc này.
          </div>
        ) : filteredRequests.map((request) => (
          <Card key={request.id} className="p-5 hover:shadow-lg transition-all border border-border shadow-sm">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4 pb-4 border-b border-border/50">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-foreground">{request.title || 'Dịch vụ sửa chữa'}</h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400`}
                  >
                    ⏱️ Mới
                  </span>
                </div>
                <p className="text-sm text-foreground/80 font-medium">{request.customerName || 'Khách hàng ẩn danh'}</p>
              </div>
              <div className="text-left md:text-right">
                <p className="text-2xl font-bold text-foreground">
                   {request.totalPrice ? `${request.totalPrice.toLocaleString()}đ` : 'Thỏa thuận'}
                </p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-6 line-clamp-2">
              {request.description || 'Không có mô tả chi tiết'}
            </p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="flex items-center gap-2 text-sm text-foreground/80">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="truncate">{request.address || 'Liên hệ để biết vị trí'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground/80">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="truncate">
                  {request.createdAt ? new Date(request.createdAt).toLocaleDateString('vi-VN') : 'Vừa xong'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground/80">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>
                  {request.customerRating || 4.5} <span className="text-muted-foreground">(Đánh giá)</span>
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="default"
                onClick={() => handleAccept(request.id)}
                className="flex-1 bg-foreground text-background hover:bg-foreground/90 font-semibold h-11"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Chấp Nhận Công Việc
              </Button>
              <Button
                variant="outline"
                className="flex-1 bg-background text-foreground border-border hover:bg-secondary font-semibold h-11"
              >
                <X className="w-4 h-4 mr-2" />
                Bỏ Qua
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
