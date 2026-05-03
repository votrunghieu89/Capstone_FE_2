import { useState, useEffect } from 'react';
import { 
  MapPin, Clock, AlertCircle, 
  Phone, User, ChevronRight,
  CheckCircle2, Cloud, Navigation,
  Activity, Target, ArrowRight, RefreshCcw,
  ZoomIn, X, Image as ImageIcon
} from 'lucide-react';
import { openGoogleMapsLocation, getMapEmbedSrc, openGoogleMapsRoute, getMapEmbedSrcByAddress } from '@/utils/mapUtils';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '@/store/authStore';
import technicianOrderService from '@/services/technicianOrderService';
import orderService from '@/services/orderService';
import { statisticService } from '@/services/statisticService';
import { ViewOrderDTO, OrderDetailDTO } from '@/types/order';
import { TechnicianProfileViewDTO } from '@/types/technician';
import technicianService from '@/services/technicianService';
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
  const { location: gpsLocation } = useCurrentLocation();
  const [techLocation, setTechLocation] = useState<{ address: string, cityName: string } | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectOrderId, setRejectOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);
  const [hasInProgress, setHasInProgress] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadRequests();
      loadStats();
      loadLocation();
      checkInProgress();
    }
  }, [user?.id]);

  const checkInProgress = async () => {
    if (!user?.id) return;
    try {
      const order = await technicianOrderService.getInProgressOrder(user.id);
      setHasInProgress(!!order);
    } catch {
      setHasInProgress(false);
    }
  };

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
      const [receivedToday, completed, total, confirmedOrders, profileData] = await Promise.all([
        statisticService.getTodayReceivedCount(user.id),
        statisticService.getTotalCompletedCount(user.id),
        statisticService.getTotalOrders(user.id),
        technicianOrderService.getConfirmedOrders(user.id), // Lấy danh sách đã tiếp nhận
        technicianService.getProfile(user.id)
      ]);
      
      setProfile(profileData);
      
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      setStats({
        todayReceived: receivedToday,
        completionRate: rate,
        acceptedCount: confirmedOrders.length,
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

  const handleReject = (orderId: string) => {
    setRejectOrderId(orderId);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!user?.id || !rejectOrderId || !rejectReason.trim()) return;
    setRejectLoading(true);
    try {
      await technicianOrderService.rejectOrder({ orderId: rejectOrderId, technicianId: user.id, reason: rejectReason });
      toast.success('Đã từ chối đơn hàng');
      setShowRejectModal(false);
      setRejectOrderId(null);
      setRejectReason('');
      loadRequests();
    } catch (err: any) {
      toast.error('Không thể từ chối đơn hàng lúc này');
    } finally {
      setRejectLoading(false);
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
    <>
    <div className="h-[calc(100vh-80px)] bg-[#020617] text-slate-200 overflow-hidden flex flex-col">
      <div className="max-w-[1600px] w-full mx-auto px-4 md:px-8 py-8 flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
        
        {/* === MAIN CONTENT: Requests List (SCROLLABLE AREA) === */}
        <div className="flex-1 flex flex-col min-h-0 space-y-8">
          {hasInProgress && requests.length > 0 && (
            <div className="w-full bg-[#0f172a]/90 backdrop-blur-md border border-amber-500/30 rounded-3xl p-5 flex flex-col items-center justify-center text-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.1)] shrink-0">
              <AlertCircle size={28} className="text-amber-500 mb-1 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              <p className="text-[11px] font-black text-amber-500 uppercase tracking-[0.2em] leading-relaxed drop-shadow-md">
                BẠN ĐANG CÓ 1 ĐƠN ĐANG THỰC HIỆN, HÃY HOÀN THÀNH ĐƠN NÀY <br /> ĐỂ NHẬN ĐƯỢC ĐƠN HÀNG MỚI !
              </p>
            </div>
          )}

          {/* Header Title & Badge */}
          <div className="flex items-center justify-between shrink-0">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-1 bg-blue-600 rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Hệ thống tiếp nhận</span>
              </div>
              <div className="flex items-center gap-4">
                <h1 className="text-4xl font-black text-white tracking-tighter">Yêu cầu mới</h1>

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
                hasInProgress ? (
                  <div className="bg-[#0f172a]/90 backdrop-blur-md border border-amber-500/30 rounded-[32px] p-24 text-center shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                    <AlertCircle size={48} className="mx-auto text-amber-500 mb-6 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                    <p className="text-amber-500 font-black uppercase tracking-[0.2em] leading-relaxed drop-shadow-md text-[13px]">
                      BẠN ĐANG CÓ 1 ĐƠN ĐANG THỰC HIỆN, HÃY HOÀN THÀNH ĐƠN NÀY <br /> ĐỂ NHẬN ĐƯỢC ĐƠN HÀNG MỚI !
                    </p>
                  </div>
                ) : (
                  <div className="bg-[#0f172a]/40 border border-dashed border-white/10 rounded-[32px] p-24 text-center">
                    <AlertCircle size={48} className="mx-auto text-slate-600 mb-4" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Hiện tại không có yêu cầu nào</p>
                  </div>
                )
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
                      </div>
                      <div className="flex items-center gap-2 text-amber-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)] animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Đang chờ xác nhận</span>
                      </div>
                    </div>

                    {/* Card Body: Title & Core Info */}
                    <div className="flex flex-col xl:flex-row gap-8">
                       <div className="flex-1 space-y-6">
                          <h2 className="text-2xl font-black text-white group-hover:text-blue-400 transition-colors">
                            {request.title || 'Yêu cầu sửa chữa thiết bị'}
                          </h2>


                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          </div>
                       </div>

                       {/* Column 2: Specific Contact & Navigation */}
                       <div className="w-full xl:w-64 space-y-6">
                          {/* Contact Info */}
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 shrink-0">
                               <Phone size={20} className="text-slate-400" />
                             </div>
                             <div>
                               <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Liên hệ</p>
                               <p className="text-xs font-bold text-slate-400 italic">Hiển thị khi nhận việc</p>
                             </div>
                          </div>
                          
                          <button
                            onClick={() => openGoogleMapsRoute(
                              techLocation ? `${techLocation.address}, ${techLocation.cityName}` : gpsLocation, 
                              detailsMap[request.orderId]?.address || request.address
                            )}
                            className="flex items-center gap-4 group/nav w-full text-left"
                          >
                             <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 group-hover/nav:bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center text-indigo-400 transition-all shrink-0">
                               <Navigation size={20} className="group-hover/nav:scale-110 transition-transform" />
                             </div>
                             <div>
                               <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Lộ trình</p>
                               <p className="text-sm font-black text-indigo-400 group-hover/nav:underline">CHỈ ĐƯỜNG</p>
                             </div>
                          </button>
                       </div>

                       {/* Call to Action Buttons */}
                       <div className="flex flex-row xl:flex-col items-center justify-end gap-3 shrink-0">
                          <button 
                            onClick={() => handleAccept(request.orderId)}
                            className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
                          >
                            Chấp nhận ngay <ArrowRight size={16} />
                          </button>
                          <div className="flex w-full gap-3">
                             <button 
                               onClick={() => handleReject(request.orderId)}
                               className="flex-1 px-4 py-3.5 bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-400 font-black text-[10px] uppercase tracking-widest rounded-2xl border border-amber-500/30 transition-all active:scale-95"
                             >
                               Từ chối
                             </button>
                             <button 
                               onClick={() => navigate(`/technician/don-hang/chi-tiet/${request.orderId}`)}
                               className="flex-1 px-4 py-3.5 bg-white/5 hover:bg-white/10 text-slate-300 font-black text-[10px] uppercase tracking-widest rounded-2xl border border-white/5 transition-all active:scale-95"
                             >
                               Chi tiết
                             </button>
                          </div>
                       </div>
                    </div>

                    {/* Card Footer: Time Badge */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/5 gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-slate-600" />
                        <span className="text-[11px] font-bold text-slate-500">
                          Hẹn lúc: <span className="text-white">{format(new Date(request.orderDate), "HH:mm - dd/MM/yyyy")}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-amber-500/8 border border-amber-500/20 rounded-xl px-3 py-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Dự kiến hoàn thành</p>
                        <p className="text-sm font-black text-amber-400 leading-none">{format(new Date(new Date(request.orderDate).getTime() + 60 * 60 * 1000), "HH:mm")}</p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* === SIDEBAR: Stats & Insights (Fixed in place) === */}
        <div className="w-full lg:w-[380px] space-y-4 h-full shrink-0 pb-4">
          

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

    {/* Lightbox */}
    <AnimatePresence>
      {lightboxUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all z-10"
            onClick={() => setLightboxUrl(null)}
          >
            <X size={18} />
          </button>
          <motion.img
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            src={lightboxUrl}
            className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      )}
    </AnimatePresence>
    {/* ===== REJECT MODAL ===== */}
    <AnimatePresence>
      {showRejectModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm"
            onClick={() => setShowRejectModal(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 16 }}
            className="bg-[#0f172a] border border-white/10 rounded-[28px] p-7 w-full max-w-md relative z-10 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                  <AlertCircle size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white tracking-tight">Từ chối yêu cầu</h3>
                </div>
              </div>
              <button
                onClick={() => setShowRejectModal(false)}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 transition-colors"
              >
                <X size={15} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                  Lý do từ chối <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Nhập lý do (ví dụ: quá xa, không đủ thiết bị, bận việc...)"
                  className="w-full bg-black/30 border border-white/10 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/30 rounded-2xl p-4 text-sm text-slate-300 placeholder:text-slate-600 resize-none h-28 outline-none transition-all"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={confirmReject}
                  disabled={rejectLoading || !rejectReason.trim()}
                  className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {rejectLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Xác nhận từ chối'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}
