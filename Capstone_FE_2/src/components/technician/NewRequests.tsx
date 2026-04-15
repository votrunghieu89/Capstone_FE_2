import { useState, useEffect } from 'react';
import { 
  MapPin, Clock, AlertCircle, 
  Phone, User, ChevronRight,
  CheckCircle2, Cloud, Navigation,
  Activity, Target, ArrowRight, RefreshCcw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '@/store/authStore';
import technicianOrderService from '@/services/technicianOrderService';
import orderService from '@/services/orderService';
import { statisticService } from '@/services/statisticService';
import { ViewOrderDTO, OrderDetailDTO } from '@/types/order';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { vi } from 'date-fns/locale';

export function NewRequests() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<ViewOrderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsMap, setDetailsMap] = useState<Record<string, OrderDetailDTO>>({});
  const [fetchingMedia, setFetchingMedia] = useState<Set<string>>(new Set());
  
  // Real-time stats states
  const [stats, setStats] = useState({
    todayReceived: 0,
    completionRate: 0,
    acceptedCount: 0
  });

  useEffect(() => {
    if (user?.id) {
      loadRequests();
      loadStats();
    }
  }, [user?.id]);

  const loadRequests = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const pendingOrders = await technicianOrderService.getConfirmingOrders(user.id);
      const sortedData = [...pendingOrders].sort((a, b) => 
        new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime()
      );
      setRequests(sortedData);
      enrichWithMedia(sortedData);
    } catch (err) {
      console.error('Error loading requests:', err);
      toast.error('Không thể tải danh sách yêu cầu mới');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user?.id) return;
    try {
      // Fetch stats and the real accepted orders list
      const [receivedToday, completed, total, confirmedOrders] = await Promise.all([
        statisticService.getTodayReceivedCount(user.id),
        statisticService.getTotalCompletedCount(user.id),
        statisticService.getTotalOrders(user.id),
        technicianOrderService.getConfirmedOrders(user.id) // Lấy danh sách đã tiếp nhận
      ]);
      
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      setStats({
        todayReceived: receivedToday,
        completionRate: rate,
        acceptedCount: confirmedOrders.length // Gán số lượng đơn đã tiếp nhận
      });
    } catch (err) {
      console.warn('Could not load sidebar stats', err);
    }
  };

  const enrichWithMedia = async (orders: ViewOrderDTO[]) => {
    for (const order of orders) {
      if (detailsMap[order.orderId] || fetchingMedia.has(order.orderId)) continue;
      setFetchingMedia(prev => new Set(prev).add(order.orderId));
      try {
        const detail: OrderDetailDTO = await orderService.getOrderDetail(order.orderId);
        if (detail) {
          setDetailsMap(prev => ({ ...prev, [order.orderId]: detail }));
        }
      } catch (err) {
        console.warn(`Failed to fetch detail for order ${order.orderId}`, err);
      } finally {
        setFetchingMedia(prev => {
          const next = new Set(prev);
          next.delete(order.orderId);
          return next;
        });
      }
    }
  };

  const handleAccept = async (orderId: string) => {
    if (!user?.id) return;
    try {
      await technicianOrderService.confirmOrder({ orderId, technicianId: user.id });
      toast.success('Đã chấp nhận đơn hàng!');
      setTimeout(() => navigate('/technician/don-hang/da-tiep-nhan'), 500);
    } catch (err: any) {
      toast.error('Lỗi khi chấp nhận đơn hàng');
    }
  };

  if (loading) {
    return (
      <div className="flex bg-[#020617] items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] bg-[#020617] text-slate-200 overflow-hidden flex flex-col">
      <div className="max-w-[1600px] w-full mx-auto px-4 md:px-8 py-8 flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
        
        {/* === MAIN CONTENT: Requests List (SCROLLABLE AREA) === */}
        <div className="flex-1 flex flex-col min-h-0 space-y-8">
          {/* Header Title & Badge */}
          <div className="flex items-center justify-between shrink-0">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-1 bg-blue-600 rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Hệ thống tiếp nhận</span>
              </div>
              <div className="flex items-center gap-4">
                <h1 className="text-4xl font-black text-white tracking-tighter">Yêu cầu mới</h1>
                <div className="px-3 py-1 bg-blue-600/10 border border-blue-500/20 rounded-full flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                   <span className="text-[11px] font-bold text-blue-400">Hôm nay có {requests.length || 0} yêu cầu</span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => { loadRequests(); loadStats(); }}
              className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl flex items-center gap-2 transition-all group"
            >
              <RefreshCcw size={16} className={cn("text-emerald-400 group-hover:rotate-180 transition-transform duration-500")} />
              <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">Cập nhật đơn mới</span>
            </button>
          </div>

          {/* List Area (Independent Scroll) */}
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-5">
            <AnimatePresence mode='popLayout'>
              {requests.length === 0 ? (
                <div className="bg-[#0f172a]/40 border border-dashed border-white/10 rounded-[32px] p-24 text-center">
                  <AlertCircle size={48} className="mx-auto text-slate-600 mb-4" />
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Hiện tại không có yêu cầu nào</p>
                </div>
              ) : (
                requests.map((request, idx) => (
                  <motion.div
                    key={request.orderId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="group bg-[#0f172a]/60 backdrop-blur-xl border border-white/5 hover:border-blue-500/30 rounded-[28px] p-6 transition-all duration-300 relative overflow-hidden flex flex-col gap-6"
                  >
                    {/* Card Header: Tag + ID + Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider rounded-lg">
                          {detailsMap[request.orderId]?.serviceName || 'DỊCH VỤ MỚI'}
                        </span>
                        <span className="text-[11px] font-bold text-slate-600">
                          #TK-{(request.orderId || '').slice(-5).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Đang chờ xác nhận</span>
                      </div>
                    </div>

                    {/* Card Body: Title & Core Info */}
                    <div className="flex flex-col xl:flex-row gap-8">
                       <div className="flex-1 space-y-4">
                          <h2 className="text-2xl font-black text-white group-hover:text-blue-400 transition-colors">
                            {request.title || 'Yêu cầu sửa chữa thiết bị'}
                          </h2>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div className="flex items-center gap-3 text-slate-400">
                               <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                                 <User size={18} />
                               </div>
                               <div>
                                 <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Khách hàng</p>
                                 <p className="text-sm font-bold text-slate-200">{request.customerName}</p>
                               </div>
                             </div>
                             <div className="flex items-center gap-3 text-slate-400">
                               <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                                 <Phone size={18} />
                               </div>
                               <div>
                                 <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Liên hệ</p>
                                 <p className="text-sm font-bold text-slate-200">Hiển thị khi nhận việc</p>
                               </div>
                             </div>
                          </div>

                          <div className="flex items-start gap-3">
                             <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 shrink-0">
                               <MapPin size={18} className="text-blue-400" />
                             </div>
                             <div>
                               <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Địa chỉ</p>
                               <p className="text-sm font-medium text-slate-300 break-words line-clamp-2">
                                 {detailsMap[request.orderId]?.address || request.address}
                               </p>
                             </div>
                          </div>
                       </div>

                       {/* Call to Action Buttons */}
                       <div className="flex flex-row xl:flex-col items-center justify-end gap-3 shrink-0">
                          <button 
                            onClick={() => handleAccept(request.orderId)}
                            className="w-full sm:w-auto px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-500/10"
                          >
                            Chấp nhận ngay <ArrowRight size={16} />
                          </button>
                          <button 
                            onClick={() => navigate(`/technician/don-hang/chi-tiet/${request.orderId}`)}
                            className="w-full sm:w-auto px-8 py-3.5 bg-white/5 hover:bg-white/10 text-slate-300 font-black text-xs uppercase tracking-widest rounded-2xl border border-white/5 transition-all"
                          >
                            Chi tiết
                          </button>
                       </div>
                    </div>

                    {/* Card Footer: Time Badge */}
                    <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                      <Clock size={14} className="text-slate-600" />
                      <span className="text-[11px] font-bold text-slate-500">
                        Hẹn lúc: <span className="text-white">{format(new Date(request.orderDate), "HH:mm")}</span> - Hôm nay ({formatDistanceToNow(new Date(request.orderDate), { addSuffix: true, locale: vi })})
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* === SIDEBAR: Stats & Insights (Fixed in place) === */}
        <div className="w-full lg:w-[380px] space-y-8 h-full shrink-0">
          
          {/* Dashboard Stats */}
          <div className="bg-[#0f172a]/60 backdrop-blur-3xl border border-white/5 rounded-[32px] p-8 space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                <Activity size={120} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Nhiệm vụ đã nhận</p>
                <div className="flex items-baseline gap-2">
                   <span className="text-5xl font-black text-white leading-none">{stats.acceptedCount}</span>
                   <span className="text-[11px] font-bold text-emerald-400 uppercase">Hiện có</span>
                </div>
              </div>
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                 <CheckCircle2 size={32} />
              </div>
            </div>

            <button className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl flex items-center justify-between group transition-all">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <Cloud size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white uppercase leading-none mb-1">Đồng bộ đám mây</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase">Cập nhật 2 phút trước</p>
                  </div>
               </div>
               <ChevronRight size={18} className="text-slate-600 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Deployment Map Insight */}
          <div className="bg-[#0f172a]/60 backdrop-blur-3xl border border-white/5 rounded-[32px] p-8 space-y-6">
            <div className="flex items-center justify-between">
               <div className="space-y-1">
                 <h3 className="text-xs font-black text-white uppercase tracking-widest">Khu vực triển khai</h3>
                 <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter">Hoạt động trực tuyến</p>
               </div>
               <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[9px] font-black text-emerald-500 uppercase">Trực tuyến</div>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-white/5 aspect-video bg-slate-900 group cursor-crosshair shrink-0">
               <iframe 
                  width="100%" 
                  height="100%" 
                  frameBorder="0" 
                  style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%)' }} 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d122691.61914371526!2d108.132717088925!3d16.047165882643883!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x314219c7922b6539%3A0x1390977800000000!2zxJDDoCBO4bq5bmcsIFZp4buHdCBOYW0!5e0!3m2!1svi!2s!4v1713170000000!5m2!1svi!2s" 
                  allowFullScreen
                ></iframe>
               <div className="absolute bottom-4 left-4 right-4 p-4 bg-black/80 backdrop-blur-md rounded-2xl border border-white/10 text-center">
                  <p className="text-[11px] font-black text-white uppercase leading-none mb-1 tracking-tight">ĐÀ NẴNG CITY</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em]">ACTIVE COVERAGE</p>
               </div>
            </div>

            <div className="space-y-5 px-1">
               <div className="flex items-center gap-5 group">
                  <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 border border-white/5 shadow-inner">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">VÙNG ĐĂNG KÝ</p>
                    <p className="text-[13px] font-bold text-slate-200">Việt Nam</p>
                  </div>
               </div>
               <div className="flex items-center gap-5 group">
                  <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 border border-white/5 shadow-inner">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">HIỆN DIỆN</p>
                    <p className="text-[13px] font-bold text-slate-200">Thành phố Đà Nẵng</p>
                  </div>
               </div>
            </div>

            {/* Daily Goal Progress */}
            <div className="pt-8 border-t border-white/10 space-y-5 px-1">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target size={16} className="text-indigo-400" />
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">CHỈ TIÊU</span>
                  </div>
                  <span className="text-sm font-black text-white tabular-nums">{stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%</span>
               </div>
               <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden shadow-inner flex">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                  />
               </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
