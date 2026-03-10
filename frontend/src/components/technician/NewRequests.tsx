import { useState } from 'react';
import { MapPin, Clock, Star, Filter, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function NewRequests() {
  const [selectedFilter, setSelectedFilter] = useState('all');

  const requests = [
    {
      id: 1,
      title: 'Sửa Chữa Điều Hòa Cấp Bách',
      customer: 'Công Ty John',
      description: 'Máy lạnh phát ra tiếng lạ, cần sự chú ý ngay lập tức',
      location: 'Trung Tâm, cách 2.3 km',
      time: 'Ngay Bây Giờ',
      price: '120.000đ',
      rating: 4.8,
      reviews: 142,
      distance: 2.3,
      urgency: 'urgent',
    },
    {
      id: 2,
      title: 'Lắp Đặt Bình Nước Nóng',
      customer: 'Sarah Martinez',
      description: 'Cần lắp đặt bình nước nóng 50 gallon mới',
      location: 'Giữa Thành Phố, cách 5.1 km',
      time: 'Hôm Nay 16:00',
      price: '200.000đ',
      rating: 4.9,
      reviews: 89,
      distance: 5.1,
      urgency: 'normal',
    },
    {
      id: 3,
      title: 'Kiểm Tra Tủ Điện',
      customer: 'Công Ty Tech Solutions',
      description: 'Kiểm tra an toàn hàng năm cần thiết cho tài sản thương mại',
      location: 'Khu Kinh Doanh, cách 8.4 km',
      time: 'Ngày Mai 09:00',
      price: '150.000đ',
      rating: 4.7,
      reviews: 245,
      distance: 8.4,
      urgency: 'low',
    },
    {
      id: 4,
      title: 'Sửa Chữa Rò Rỉ Ống Nước',
      customer: 'Michael Chen',
      description: 'Vòi rửa bát bị rò rỉ, cần sửa ngay lập tức',
      location: 'Phía Đông, cách 3.2 km',
      time: 'Hôm Nay 14:00',
      price: '95.000đ',
      rating: 4.6,
      reviews: 67,
      distance: 3.2,
      urgency: 'urgent',
    },
    {
      id: 5,
      title: 'Bảo Dưỡng HVAC',
      customer: 'Tòa Nhà Công Ty Xanh',
      description: 'Bảo dưỡng thường xuyên và thay thế bộ lọc',
      location: 'Đại Lộ Công Viên, cách 6.7 km',
      time: 'Ngày Mai 10:00',
      price: '85.000đ',
      rating: 4.9,
      reviews: 312,
      distance: 6.7,
      urgency: 'normal',
    },
  ];

  const filteredRequests =
    selectedFilter === 'all'
      ? requests
      : requests.filter((r) => r.urgency === selectedFilter);

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
        {filteredRequests.map((request) => (
          <Card key={request.id} className="p-5 hover:shadow-lg transition-all border border-border shadow-sm">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4 pb-4 border-b border-border/50">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-foreground">{request.title}</h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      request.urgency === 'urgent'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : request.urgency === 'normal'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}
                  >
                    {request.urgency === 'urgent'
                      ? '🔴 Cấp Bách'
                      : request.urgency === 'normal'
                      ? '⏱️ Hôm Nay'
                      : '📅 Đã Lên Lịch'}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 font-medium">{request.customer}</p>
              </div>
              <div className="text-left md:text-right">
                <p className="text-2xl font-bold text-foreground">{request.price}</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-6 line-clamp-2">
              {request.description}
            </p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="flex items-center gap-2 text-sm text-foreground/80">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="truncate">{request.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground/80">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="truncate">{request.time}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground/80">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>
                  {request.rating} <span className="text-muted-foreground">({request.reviews})</span>
                </span>
              </div>
              <div className="flex items-center lg:justify-end text-sm font-medium text-foreground/80">
                {request.distance.toFixed(1)} km away
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="default"
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
