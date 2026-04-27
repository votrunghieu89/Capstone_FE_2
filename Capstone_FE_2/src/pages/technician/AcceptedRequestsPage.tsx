import { useState, useEffect } from 'react';
import { 
  MapPin, Clock, AlertCircle, 
  Phone, User, ChevronRight,
  CheckCircle2, Cloud, Navigation,
  Activity, Target, ArrowRight, RefreshCcw, Zap, LocateFixed
} from 'lucide-react';
import { openGoogleMapsRoute, getMapEmbedSrc, getMapEmbedSrcByAddress } from '@/utils/mapUtils';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '@/store/authStore';
import technicianOrderService from '@/services/technicianOrderService';
import orderService from '@/services/orderService';
import { statisticService } from '@/services/statisticService';
import type { ViewOrderDTO, ViewOrderDetailDTO } from '@/types/order';
import { TechnicianProfileViewDTO } from '@/types/technician';
import technicianService from '@/services/technicianService';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function TechAcceptedRequestsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<ViewOrderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsMap, setDetailsMap] = useState<Record<string, ViewOrderDetailDTO>>({});
  const [fetchingMedia, setFetchingMedia] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState(false);
  const [profile, setProfile] = useState<TechnicianProfileViewDTO | null>(null);
  
  // Real-time stats states
  const [stats, setStats] = useState({
    todayReceived: 0,
    completionRate: 0,
    acceptedCount: 0,
    total: 0,
    completed: 0
  });
  
  // Real-time GPS device location
  const { location: gpsLocation, loading: gpsLoading, error: gpsError } = useCurrentLocation();
  const [techLocation, setTechLocation] = useState<{ address: string, cityName: string } | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadRequests();
      loadStats();
      loadLocation();
    }
  }, [user?.id]);

  const loadLocation = async () => {
    if (!user?.id) return;
    try {
      const loc = await technicianOrderService.getTechnicianLocation(user.id);
      setTechLocation(loc);
    } catch (err) {
      console.warn('Could not fetch technician live location', err);
    }
  };

  const loadRequests = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const confirmedOrders = await technicianOrderService.getConfirmedOrders(user.id);
      const sortedData = [...confirmedOrders].sort((a, b) => 
        new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime()
      );
      setRequests(sortedData);
      enrichWithMedia(sortedData);
    } catch (err) {
      console.error('Error loading requests:', err);
      toast.error('Không thể tải danh sách đơn đã tiếp nhận');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user?.id) return;
    try {
      const [receivedToday, completed, total, profileData] = await Promise.all([
        statisticService.getTodayReceivedCount(user.id),
        statisticService.getTotalCompletedCount(user.id),
        statisticService.getTotalOrders(user.id),
        technicianService.getProfile(user.id)
      ]);
      
      setProfile(profileData);
      
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      setStats({
        todayReceived: receivedToday,
        completionRate: rate,
        acceptedCount: requests.length,
        total,
        completed
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
        const detail: ViewOrderDetailDTO = await orderService.getOrderDetail(order.orderId);
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

  const handleStartWork = async (orderId: string) => {
    if (!user?.id) return;
    setActionLoading(true);
    try {
      await technicianOrderService.startOrder({ orderId, technicianId: user.id });
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
                <div className="w-8 h-1 bg-emerald-500 rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Lịch trình công việc</span>
              </div>
              <div className="flex items-center gap-4">
                <h1 className="text-4xl font-black text-white tracking-tighter">Đã tiếp nhận</h1>

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
                  <h2 className="text-xl font-black text-white uppercase mb-2">Chưa có công việc</h2>
                  <p className="text-slate-500 mb-8 max-w-sm mx-auto text-sm">Mọi yêu cầu bạn đã tiếp nhận sẽ hiển thị chi tiết tại đây.</p>
                  <Link to="/technician/don-hang/dang-cho" className="inline-flex items-center gap-2 text-emerald-400 font-bold uppercase text-[10px] tracking-widest hover:underline">
                    Tìm việc ngay <ChevronRight size={14} />
                  </Link>
                </div>
              ) : (
                requests.map((request, idx) => (
                  <motion.div
                    key={request.orderId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="group bg-[#0f172a]/60 backdrop-blur-xl border border-white/5 hover:border-emerald-500/30 rounded-[28px] p-6 transition-all duration-300 relative overflow-hidden flex flex-col gap-6"
                  >
                    {/* Card Header: Tag + ID + Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider rounded-lg">
                          {detailsMap[request.orderId]?.serviceName || request.serviceName || 'DỊCH VỤ'}
                        </span>
                        <span className="text-[11px] font-bold text-slate-600">
                          #TK-{(request.orderId || '').slice(-5).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Đã tiếp nhận</span>
                      </div>
                    </div>

                    {/* Card Body: Title & Core Info */}
                    <div className="flex flex-col xl:flex-row gap-8">
                       <div className="flex-1 space-y-6">
                          <h2 className="text-2xl font-black text-white group-hover:text-emerald-400 transition-colors">
                            {request.title || 'Yêu cầu sửa chữa thiết bị'}
                          </h2>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             {/* Customer Info */}
                             <div className="flex items-center gap-4">
                               <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 shrink-0">
                                 <User size={20} className="text-slate-400" />
                               </div>
                               <div className="min-w-0">
                                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Khách hàng</p>
                                 <p className="text-sm font-bold text-white truncate">{request.customerName}</p>
                               </div>
                             </div>

                             {/* Address Info */}
                             <div className="flex items-start gap-4">
                               <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
                                 <MapPin size={20} className="text-blue-400" />
                               </div>
                               <div className="min-w-0">
                                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Địa chỉ</p>
                                 <p className="text-sm font-medium text-slate-300 line-clamp-2 leading-tight">
                                   {detailsMap[request.orderId]?.address || request.address}
                                 </p>
                               </div>
                             </div>

                             {/* Phone Number */}
                             <div className="flex items-center gap-4">
                               <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
                                 <Phone size={20} className="text-emerald-400" />
                               </div>
                               <div>
                                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Số điện thoại</p>
                                 <p className="text-sm font-bold text-white">
                                   {request.phoneNumber || request.customerPhone || detailsMap[request.orderId]?.customerPhone || 'Chưa có SĐT'}
                                 </p>
                               </div>
                             </div>
                          </div>
                       </div>

                       {/* Call to Action Buttons */}
                       <div className="flex flex-row xl:flex-col items-center justify-end gap-3 shrink-0">
                          <button 
                            onClick={() => handleStartWork(request.orderId)}
                            disabled={actionLoading}
                            className="w-full sm:w-auto px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                          >
                            Bắt đầu ngay <Zap size={15} />
                          </button>
                          <div className="flex w-full gap-3">
                             <button 
                               onClick={() => openGoogleMapsRoute(
                                 techLocation ? `${techLocation.address}, ${techLocation.cityName}` : gpsLocation, 
                                 detailsMap[request.orderId]?.address || request.address
                               )}
                               className="flex-1 px-4 py-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-black text-[10px] uppercase tracking-widest rounded-xl border border-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                             >
                               <Navigation size={13} />
                               Chỉ đường
                             </button>
                             <button 
                               onClick={() => navigate(`/technician/don-hang/chi-tiet/${request.orderId}`)}
                               className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-black text-[10px] uppercase tracking-widest rounded-xl border border-white/5 transition-all active:scale-95"
                             >
                               Chi tiết
                             </button>
                          </div>
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
        <div className="w-full lg:w-[380px] space-y-4 h-full shrink-0 pb-4">
          
          {/* Dashboard Stats */}
          <div className="bg-[#0f172a]/60 backdrop-blur-3xl border border-white/5 rounded-[32px] p-6 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                <Activity size={120} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Nhiệm vụ đã nhận</p>
                <div className="flex items-baseline gap-2">
                   <span className="text-5xl font-black text-white leading-none">{requests.length}</span>
                   <span className="text-[11px] font-bold text-emerald-400 uppercase">Hiện có</span>
                </div>
              </div>
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                 <CheckCircle2 size={32} />
              </div>
            </div>


          </div>

          {/* Deployment Map Insight */}
          <div className="bg-[#0f172a]/60 backdrop-blur-3xl border border-white/5 rounded-[32px] p-6 space-y-5">
            <div className="space-y-4 px-1 mb-4">
               <h3 className="text-[11px] font-black text-[#2DD4BF] uppercase tracking-[0.4em]">VỊ TRÍ DỊCH VỤ</h3>
               {[
                 { label: 'THÀNH PHỐ', value: profile?.city || 'Đà Nẵng' },
                 { label: 'ĐỊA CHỈ CỤ THỂ', value: profile?.address || 'Chưa cập nhật' }
               ].map((item, idx) => (
                 <div key={idx} className="flex items-start gap-4">
                   <div className="mt-0.5 w-8 h-8 rounded-full bg-[#2DD4BF]/10 flex items-center justify-center text-[#2DD4BF] shrink-0">
                     <MapPin size={14} />
                   </div>
                   <div className="space-y-0.5">
                     <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{item.label}</p>
                     <p className="text-sm font-bold text-slate-200 uppercase">{item.value}</p>
                   </div>
                 </div>
               ))}
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-white/5 aspect-video bg-slate-900 group cursor-crosshair shrink-0">
               <iframe 
                  key={techLocation ? `${techLocation.address}-${techLocation.cityName}` : (gpsLocation ? `${gpsLocation.lat},${gpsLocation.lng}` : 'profile')}
                  width="100%" 
                  height="100%" 
                  frameBorder="0" 
                  style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%)' }} 
                  src={techLocation ? getMapEmbedSrcByAddress(`${techLocation.address}, ${techLocation.cityName}`, 13) : getMapEmbedSrc(gpsLocation, profile?.latitude, profile?.longitude, 13)} 
                  allowFullScreen
                ></iframe>
               <div className="absolute bottom-4 left-4 right-4 p-4 bg-black/80 backdrop-blur-md rounded-2xl border border-white/10 text-center">
                  <p className="text-[11px] font-black text-white uppercase leading-none mb-1 tracking-tight">{profile?.city ? `${profile.city} CITY` : 'ĐÀ NẴNG CITY'}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em]">ACTIVE COVERAGE</p>
               </div>
            </div>




          </div>

        </div>

      </div>
    </div>
  );
}
