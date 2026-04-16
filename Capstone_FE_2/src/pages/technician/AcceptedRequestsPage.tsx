import { useState, useEffect } from 'react';
import { 
  Clock, MapPin, User, ChevronRight, X, Phone, 
  Map as MapIcon, Play, AlertCircle, CheckCircle2,
  Activity, Navigation, Target, ShieldCheck, Zap,
  BarChart3, Settings2, RefreshCcw, Cloud
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/authStore';
import technicianOrderService from '@/services/technicianOrderService';
import orderService from '@/services/orderService';
import { statisticService } from '@/services/statisticService';
import type { ViewOrderDTO, OrderDetailDTO } from '@/types/order';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function TechAcceptedRequestsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [acceptedRequests, setAcceptedRequests] = useState<ViewOrderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsMap, setDetailsMap] = useState<Record<string, OrderDetailDTO>>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [stats, setStats] = useState({
    rating: 0,
    total: 0,
    completed: 0
  });

  useEffect(() => {
    if (user?.id) {
      loadAcceptedOrders();
      loadStats();
    }
  }, [user?.id]);

  const loadStats = async () => {
    if (!user?.id) return;
    try {
      const [rating, total, completed] = await Promise.all([
        statisticService.getAverageRating(user.id),
        statisticService.getTotalOrders(user.id),
        statisticService.getTotalCompletedCount(user.id)
      ]);
      setStats({ rating, total, completed });
    } catch (err) {
      console.warn('Could not load stats', err);
    }
  };

  const loadAcceptedOrders = async () => {
    try {
      setLoading(true);
      const data = await technicianOrderService.getConfirmedOrders(user!.id);
      setAcceptedRequests(Array.isArray(data) ? data : []);
      enrichWithDetails(data);
    } catch (err: any) {
      console.error('Error loading orders:', err);
      toast.error('Không thể tải đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const enrichWithDetails = async (orders: ViewOrderDTO[]) => {
    for (const order of orders) {
      if (detailsMap[order.orderId]) continue;
      try {
        const detail = await orderService.getOrderDetail(order.orderId);
        if (detail) {
          setDetailsMap(prev => ({ ...prev, [order.orderId]: detail }));
        }
      } catch (err) {
        console.warn(`Failed to fetch detail for order ${order.orderId}`, err);
      }
    }
  };

  const handleStartWork = async (orderId: string) => {
    if (!user?.id) return;
    setActionLoading(true);
    try {
      await technicianOrderService.startOrder({ 
        orderId, 
        technicianId: user.id 
      });
      toast.success('Đã bắt đầu công việc!');
      setTimeout(() => navigate('/technician/don-hang/dang-thuc-hien'), 500);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể bắt đầu đơn hàng');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-80px)] bg-[#020617] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] bg-[#020617] text-slate-200 overflow-hidden flex flex-col">
      <div className="max-w-[1600px] w-full mx-auto px-4 md:px-8 py-8 flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
        
        {/* === MAIN CONTENT === */}
        <div className="flex-1 flex flex-col min-h-0 space-y-8">
          <div className="shrink-0 flex items-end justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-1 bg-emerald-500 rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Lịch trình công việc</span>
              </div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Đã tiếp nhận</h1>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Quản lý hiệu quả các đơn hàng đã xác nhận</p>
            </div>

            <button 
              onClick={() => loadAcceptedOrders()}
              className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl flex items-center gap-2 transition-all group"
            >
              <RefreshCcw size={16} className={cn("text-emerald-400 group-hover:rotate-180 transition-transform duration-500")} />
              <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">Cập nhật đơn mới</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
            <AnimatePresence mode='popLayout'>
              {acceptedRequests.length === 0 ? (
                <div className="bg-[#0f172a]/40 border border-dashed border-white/10 rounded-[40px] p-24 text-center">
                  <AlertCircle size={48} className="mx-auto text-slate-600 mb-4" />
                  <h2 className="text-xl font-black text-white uppercase mb-2">Chưa có công việc</h2>
                  <p className="text-slate-500 mb-8 max-w-sm mx-auto text-sm">Mọi yêu cầu bạn đã tiếp nhận sẽ hiển thị chi tiết tại đây.</p>
                  <Link to="/technician/don-hang/dang-cho" className="inline-flex items-center gap-2 text-emerald-400 font-bold uppercase text-[10px] tracking-widest hover:underline">
                    Tìm việc ngay <ChevronRight size={14} />
                  </Link>
                </div>
              ) : (
                acceptedRequests.map((req, idx) => (
                  <motion.div 
                    key={req.orderId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-[#0f172a]/40 border border-white/5 rounded-[32px] overflow-hidden group hover:border-white/10 transition-all shadow-xl"
                  >
                    <div className="p-8 space-y-8">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                            {req.serviceName}
                          </span>
                          <span className="text-[11px] font-bold text-slate-600 uppercase">ID: #{req.orderId.slice(0, 8).toUpperCase()}</span>
                        </div>
                        <div className="flex flex-col items-end">
                           <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Khoảng cách</span>
                           <span className="text-2xl font-black text-white uppercase tabular-nums tracking-tighter">2.1 <span className="text-xs text-slate-400">KM</span></span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h2 className="text-3xl font-black text-white tracking-tight group-hover:text-emerald-400 transition-colors uppercase leading-tight">
                          {req.title}
                        </h2>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-3xl line-clamp-2">
                          {detailsMap[req.orderId]?.description || "Đang tải mô tả chi tiết từ hệ thống..."}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 pt-4">
                        <div className="space-y-6">
                           <div className="flex items-center gap-4 group/item">
                              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover/item:text-blue-400 transition-colors">
                                 <User size={18} />
                              </div>
                              <div className="space-y-0.5">
                                 <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Khách hàng</p>
                                 <h4 className="text-sm font-bold text-slate-200">{req.customerName}</h4>
                              </div>
                           </div>
                           <div className="flex items-center gap-4 group/item">
                              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover/item:text-blue-400 transition-colors">
                                 <MapPin size={18} />
                              </div>
                              <div className="space-y-0.5 min-w-0">
                                 <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Khu vực</p>
                                 <h4 className="text-sm font-bold text-slate-200 truncate pr-4">{req.address}</h4>
                              </div>
                           </div>
                        </div>

                        <div className="space-y-6">
                           <div className="flex items-center gap-4 group/item">
                              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                 <CheckCircle2 size={18} />
                              </div>
                              <div className="space-y-0.5">
                                 <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Trạng thái</p>
                                 <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-tighter">Đã xác nhận</h4>
                              </div>
                           </div>
                           <div className="flex items-center gap-4 group/item">
                              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover/item:text-blue-400 transition-colors">
                                 <Clock size={18} />
                              </div>
                              <div className="space-y-0.5">
                                 <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Thời gian xác nhận</p>
                                 <h4 className="text-sm font-bold text-slate-200 tabular-nums">
                                    {format(new Date(req.orderDate), "HH:mm 'ngày' dd/MM", { locale: vi })}
                                 </h4>
                              </div>
                           </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-6">
                         <button 
                           onClick={() => navigate(`/technician/don-hang/chi-tiet/${req.orderId}`)}
                           className="py-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] transition-all"
                         >
                           Chi tiết
                         </button>
                         <button 
                           onClick={() => handleStartWork(req.orderId)}
                           disabled={actionLoading}
                           className="py-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-900/40 transition-all flex items-center justify-center gap-2 group/btn active:scale-95 disabled:opacity-50"
                         >
                           Bắt đầu ngay
                           <Zap size={16} className="group-hover/btn:scale-125 transition-transform" />
                         </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* === SIDEBAR (PERSISTENT DESIGN) === */}
        <div className="w-full lg:w-[380px] space-y-8 h-full shrink-0 flex flex-col min-h-0 overflow-y-auto lg:overflow-visible pr-2 md:pr-0">
          
          {/* Dashboard Stats */}
          <div className="bg-[#0f172a]/60 backdrop-blur-3xl border border-white/10 rounded-[40px] p-8 space-y-8 relative overflow-hidden shadow-2xl shrink-0">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none text-white">
                <Activity size={120} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Nhiệm vụ đã nhận</p>
                <div className="flex items-baseline gap-2">
                   <span className="text-5xl font-black text-white tabular-nums">{acceptedRequests.length}</span>
                   <span className="text-[11px] font-bold text-emerald-400 uppercase">Hiện có</span>
                </div>
              </div>
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400 shadow-xl">
                 <CheckCircle2 size={32} />
              </div>
            </div>

            <button onClick={loadStats} className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl flex items-center justify-between group transition-all">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <Cloud size={20} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black text-white uppercase leading-none mb-1">Đồng bộ đám mây</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase">UPDATING...</p>
                  </div>
               </div>
               <ChevronRight size={18} className="text-slate-600 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Map Insight (SYNCED) */}
          <div className="bg-[#0f172a]/60 backdrop-blur-3xl border border-white/10 rounded-[40px] p-8 space-y-8 shadow-2xl shrink-0">
            <div className="flex items-center justify-between">
               <div className="space-y-1">
                 <h3 className="text-xs font-black text-white uppercase tracking-widest leading-none mb-1">Khu vực triển khai</h3>
                 <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter font-black">Hoạt động trực tuyến</p>
               </div>
               <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[9px] font-black text-emerald-500 uppercase tracking-tighter shadow-md">TRỰC TUYẾN</div>
            </div>

            <div className="relative rounded-3xl overflow-hidden aspect-video bg-slate-900 border border-white/5 group shadow-xl">
               <iframe width="100%" height="100%" frameBorder="0" style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%)' }} src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d122691.61914371526!2d108.132717088925!3d16.047165882643883!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x314219c7922b6539%3A0x1390977800000000!2zxJDDoCBO4bq5bmcsIFZp4buHdCBOYW0!5e0!3m2!1svi!2s!4v1713170000000!5m2!1svi!2s" allowFullScreen></iframe>
               <div className="absolute bottom-4 left-4 right-4 p-4 bg-black/80 backdrop-blur-md rounded-2xl border border-white/10 text-center">
                  <p className="text-[11px] font-black text-white uppercase leading-none mb-1 tracking-tight">ĐÀ NẴNG CITY</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">ACTIVE COVERAGE</p>
               </div>
            </div>

            <div className="space-y-5 px-1">
               <div className="flex items-center gap-5 group">
                  <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 border border-white/5">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">VÙNG ĐĂNG KÝ</p>
                    <p className="text-[13px] font-bold text-slate-200">Việt Nam</p>
                  </div>
               </div>
               <div className="flex items-center gap-5 group">
                  <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 border border-white/5">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">HIỆN DIỆN</p>
                    <p className="text-[13px] font-bold text-slate-200">Thành phố Đà Nẵng</p>
                  </div>
               </div>
            </div>

            <div className="pt-8 border-t border-white/10 space-y-5 px-1">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target size={16} className="text-indigo-400" />
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">CHỈ TIÊU</span>
                  </div>
                  <span className="text-sm font-black text-white tabular-nums">{stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%</span>
               </div>
               <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden shadow-inner flex">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%` }} transition={{ duration: 1.5 }} className="h-full bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
               </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

const Loader2 = ({ size, className }: { size: number, className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("lucide lucide-loader-2", className)}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
