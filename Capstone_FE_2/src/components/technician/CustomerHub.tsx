import { useState, useEffect } from 'react';
import { Search, Phone, Mail, MapPin, Star, MoreVertical, MessageSquare, Loader2, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import useAuthStore from '@/store/authStore';
import technicianOrderService from '@/services/technicianOrderService';
import type { ViewOrderDTO } from '@/types/order';

interface CustomerSummary {
    id: string;
    name: string;
    phone: string;
    email: string;
    location: string;
    totalJobs: number;
    averageRating: number;
    lastJob: string;
    totalSpent: number;
}

export function CustomerHub() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);

  useEffect(() => {
    if (user?.id) {
      loadCustomers();
    }
  }, [user?.id]);

  const loadCustomers = async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const history = await technicianOrderService.getHistoryOrders(user.id);
      
      // Group unique customers from history
      const customerMap: Record<string, CustomerSummary> = {};
      
      history.forEach(order => {
        const customerName = order.customerName || 'Khách hàng ẩn danh';
        if (!customerMap[customerName]) {
          customerMap[customerName] = {
            id: order.orderId,
            name: customerName,
            phone: 'Liên hệ qua đơn', // BE limited phone for privacy in some views
            email: 'N/A',
            location: order.address || 'Đà Nẵng',
            totalJobs: 0,
            averageRating: 5.0,
            lastJob: order.orderDate,
            totalSpent: 0
          };
        }
        
        customerMap[customerName].totalJobs += 1;
        customerMap[customerName].totalSpent += (order as any).price || 0;
        
        // Update last job if newer
        if (new Date(order.orderDate) > new Date(customerMap[customerName].lastJob)) {
            customerMap[customerName].lastJob = order.orderDate;
        }
      });

      setCustomers(Object.values(customerMap));
    } catch (err) {
      console.error('Error loading customers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  if (isLoading) {
    return (
      <div className="flex bg-[#020617] items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-[#020617] min-h-screen text-slate-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Trung Tâm Khách Hàng</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1 italic">Quản lý mạng lưới khách hàng từ lịch sử dịch vụ</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
           <UserIcon size={16} className="text-indigo-400" />
           <span className="text-[11px] font-black text-white uppercase tracking-widest">{customers.length} Khách hàng</span>
        </div>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
        <input
          type="text"
          placeholder="Tìm kiếm khách hàng theo tên hoặc số điện thoại..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 rounded-2xl border border-white/5 bg-[#0f172a]/50 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/30 transition-all font-medium"
        />
      </div>

      <div className="space-y-4">
        {filteredCustomers.length === 0 ? (
          <div className="bg-[#0f172a]/40 border border-dashed border-white/10 rounded-[32px] p-24 text-center">
             <UserIcon size={48} className="mx-auto text-slate-700 mb-4" />
             <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Chưa có dữ liệu khách hàng</p>
          </div>
        ) : (
          filteredCustomers.map((customer) => (
            <Card key={customer.id} className="p-6 bg-[#0f172a]/40 hover:bg-[#0f172a]/60 transition-all border-white/5 hover:border-indigo-500/30 rounded-[32px] shadow-xl group">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                <div className="flex-1 space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                       <UserIcon size={24} />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-white uppercase tracking-tight group-hover:text-indigo-400 transition-colors">{customer.name}</h3>
                       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Khách hàng định danh</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 text-sm font-medium text-slate-400 bg-white/5 px-4 py-2.5 rounded-xl border border-white/5">
                      <MapPin className="w-4 h-4 text-indigo-400" />
                      <span className="truncate">{customer.location}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-medium text-slate-400 bg-white/5 px-4 py-2.5 rounded-xl border border-white/5">
                      <Phone className="w-4 h-4 text-emerald-400" />
                      <span>{customer.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-4 shrink-0">
                  <div className="text-right">
                    <div className="flex items-center sm:justify-end gap-2 mb-1">
                      <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                      <span className="font-black text-white text-2xl tabular-nums leading-none tracking-tighter">{customer.averageRating.toFixed(1)}</span>
                    </div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{customer.totalJobs} Lần dịch vụ</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex gap-8">
                  <div>
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1.5">Tổng Phí Dịch Vụ</p>
                    <p className="font-black text-white text-lg tracking-tight">{customer.totalSpent.toLocaleString('vi-VN')} VNĐ</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1.5">Lần Cuối Phục Vụ</p>
                    <p className="font-black text-white text-lg tracking-tight">{new Date(customer.lastJob).toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-6 font-black uppercase text-[10px] tracking-widest py-5 h-auto">
                    <MessageSquare className="w-4 h-4 mr-2" /> Nhắn tin
                  </Button>
                  <Button size="sm" variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl px-4 py-5 h-auto">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
