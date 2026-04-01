import { useState } from 'react';
import { Search, Phone, Mail, MapPin, Star, MoreVertical, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function CustomerHub() {
  const [searchQuery, setSearchQuery] = useState('');

  const customers = [
    {
      id: 1,
      name: 'Công Ty John',
      phone: '+84 (0555) 123-4567',
      email: 'john@enterprises.com',
      location: 'Trung Tâm',
      totalJobs: 8,
      averageRating: 4.9,
      lastJob: '03-03-2025',
      totalSpent: '8.400.000đ',
    },
    {
      id: 2,
      name: 'Sarah Martinez',
      phone: '+84 (0555) 234-5678',
      email: 'sarah.m@email.com',
      location: 'Giữa Thành Phố',
      totalJobs: 5,
      averageRating: 4.8,
      lastJob: '28-02-2025',
      totalSpent: '5.200.000đ',
    },
    {
      id: 3,
      name: 'Công Ty Tech Solutions',
      phone: '+84 (0555) 345-6789',
      email: 'tech@solutions.com',
      location: 'Khu Kinh Doanh',
      totalJobs: 12,
      averageRating: 4.9,
      lastJob: '01-03-2025',
      totalSpent: '12.400.000đ',
    },
    {
      id: 4,
      name: 'Michael Chen',
      phone: '+84 (0555) 456-7890',
      email: 'michael.chen@mail.com',
      location: 'Phía Đông',
      totalJobs: 3,
      averageRating: 4.7,
      lastJob: '25-02-2025',
      totalSpent: '2.800.000đ',
    },
    {
      id: 5,
      name: 'Tòa Nhà Công Ty Xanh',
      phone: '+84 (0555) 567-8901',
      email: 'facilities@greenoffice.com',
      location: 'Đại Lộ Công Viên',
      totalJobs: 6,
      averageRating: 4.8,
      lastJob: '02-03-2025',
      totalSpent: '6.500.000đ',
    },
  ];

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Trung Tâm Khách Hàng</h1>
        <p className="text-muted-foreground mt-1">Quản lý và theo dõi tất cả khách hàng</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Tìm kiếm khách hàng theo tên, điện thoại hoặc email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder-muted-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </div>

      <div className="space-y-4">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id} className="p-5 hover:shadow-md transition-shadow border border-border shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground">{customer.name}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mt-4">
                  <a
                    href={`tel:${customer.phone}`}
                    className="flex items-center gap-2.5 text-sm text-foreground/80 hover:text-foreground font-medium transition-colors"
                  >
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{customer.phone}</span>
                  </a>
                  <a
                    href={`mailto:${customer.email}`}
                    className="flex items-center gap-2.5 text-sm text-foreground/80 hover:text-foreground font-medium transition-colors"
                  >
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="truncate">{customer.email}</span>
                  </a>
                  <div className="flex items-center gap-2.5 text-sm font-medium text-foreground/80">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{customer.location}</span>
                  </div>
                </div>
              </div>

              <div className="sm:text-right mt-2 sm:mt-0 flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start">
                <div className="mb-0 sm:mb-3">
                  <div className="flex items-center sm:justify-end gap-1.5 sm:mb-1">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="font-bold text-foreground text-lg sm:text-base leading-none">{customer.averageRating}</span>
                  </div>
                  <p className="hidden sm:block text-xs font-medium text-muted-foreground">{customer.totalJobs} công việc</p>
                </div>
                <div className="sm:hidden text-sm font-medium text-foreground">
                  <span className="text-muted-foreground mr-1">Tỷ lệ:</span>
                  {customer.totalJobs} công việc
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex gap-6 text-sm">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Tổng Chi</p>
                  <p className="font-bold text-foreground">{customer.totalSpent}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Công Việc Cuối</p>
                  <p className="font-bold text-foreground">{customer.lastJob}</p>
                </div>
              </div>
              <div className="flex gap-2 self-start sm:self-auto w-full sm:w-auto">
                <Button size="sm" variant="outline" className="flex-1 sm:flex-none border-border">
                  <Phone className="w-4 h-4 max-sm:mr-2" />
                  <span className="sm:hidden">Gọi</span>
                </Button>
                <Button size="sm" variant="outline" className="flex-1 sm:flex-none border-border">
                  <MessageSquare className="w-4 h-4 max-sm:mr-2" />
                  <span className="sm:hidden">Nhắn tin</span>
                </Button>
                <Button size="sm" variant="outline" className="flex-1 sm:flex-none border-border">
                  <MoreVertical className="w-4 h-4 max-sm:mr-2" />
                  <span className="sm:hidden">Thêm</span>
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Không tìm thấy khách hàng nào.</p>
          </div>
        )}
      </div>
    </div>
  );
}
