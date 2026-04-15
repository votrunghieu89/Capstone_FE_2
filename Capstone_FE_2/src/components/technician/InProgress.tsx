import { useState, useEffect } from 'react';
import { 
  MapPin, Clock, Phone, MessageSquare, CheckCircle, 
  AlertCircle, Briefcase, User, 
  Navigation, ChevronRight, Play, Loader2,
  Activity, Target, Cloud, CheckCircle2, Zap, Shield, 
  Sparkles, Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '@/store/authStore';
import technicianOrderService from '@/services/technicianOrderService';
import orderService from '@/services/orderService';
import { statisticService } from '@/services/statisticService';
import { ViewOrderDTO, OrderDetailDTO } from '@/types/order';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface PendingReviewOrder {
  orderId: string;
  title: string;
  customerName: string;
  sentAt: string;
}

export function InProgress() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [job, setJob] = useState<ViewOrderDTO | null>(null);
  const [jobDetail, setJobDetail] = useState<OrderDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [pendingReviews, setPendingReviews] = useState<PendingReviewOrder[]>([]);
  const [stats, setStats] = useState({ total: 0, completed: 0 });
  const [acceptedCount, setAcceptedCount] = useState(0);

  useEffect(() => {
    if (user?.id) {
      loadInProgress();
      loadPendingReviews();
      loadStats();
    }
  }, [user?.id]);

  const loadStats = async () => {
    if (!user?.id) return;
    try {
      const [total, completed, accepted] = await Promise.all([
        statisticService.getTotalOrders(user.id),
        statisticService.getTotalCompletedCount(user.id),
        technicianOrderService.getConfirmedOrders(user.id)
      ]);
      setStats({ total, completed });
      setAcceptedCount(Array.isArray(accepted) ? accepted.length : 0);
    } catch (err) {
      console.warn('Could not load stats', err);
    }
  };

  const loadInProgress = async () => {
    try {
      setLoading(true);
      const data = await technicianOrderService.getInProgressOrder(user!.id);
      
      if (!data) {
        setJob(null);
        setLoading(false);
        return;
      }

      try {
        const detail = await orderService.getOrderDetail(data.orderId);
        setJobDetail(detail);
      } catch (err) {
        console.warn('Media fetch failed', err);
      }

      const stored = localStorage.getItem('pendingReviewOrders');
      const pendingList: PendingReviewOrder[] = stored ? JSON.parse(stored) : [];
      const isPending = pendingList.some(p => p.orderId === data.orderId);

      if (isPending) {
        setJob(null);
      } else {
        setJob(data);
      }
    } catch (err: any) {
      console.error('Core error:', err);
      setJob(null);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingReviews = () => {
    const stored = localStorage.getItem('pendingReviewOrders');
    if (stored) {
      try { setPendingReviews(JSON.parse(stored)); } catch (e) { setPendingReviews([]); }
    }
  };

  const handleCompleteOrder = async () => {
    if (!job) return;
    setActionLoading(true);
    const completePromise = technicianOrderService.completeOrder(job.orderId)
      .then(() => {
        const newEntry: PendingReviewOrder = {
          orderId: job.orderId,
          title: job.title,
          customerName: job.customerName,
          sentAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        };
        const updated = [newEntry, ...pendingReviews];
        setPendingReviews(updated);
        localStorage.setItem('pendingReviewOrders', JSON.stringify(updated));
        setJob(null);
        loadStats();
      });

    toast.promise(completePromise, {
      loading: 'Đang gửi xác minh...',
      success: 'Yêu cầu hoàn tất!',
      error: 'Lỗi khi gửi yêu cầu.'
    });

    try {
      await completePromise;
    } catch (err) {
      console.error('Complete error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDebugConfirm = (orderId: string) => {
    const updated = pendingReviews.filter(p => p.orderId !== orderId);
    setPendingReviews(updated);
    localStorage.setItem('pendingReviewOrders', JSON.stringify(updated));
    toast.success('Ghi nhận thành công!');
    loadStats();
  };

  if (loading && !job) {
    return (
      <div className="flex bg-[#020617] h-[calc(100vh-80px)] items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] bg-[#020617] text-slate-200 overflow-hidden flex flex-col">
      <div className="max-w-[1600px] w-full mx-auto px-4 md:px-8 py-8 flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
        
        {/* === LEFT CONTENT: PREMIUM DESIGN === */}
        <div className="flex-1 min-w-0 overflow-y-auto pr-2 md:pr-4 custom-scrollbar space-y-8 animate-in fade-in duration-1000">
          <AnimatePresence mode="wait">
            {job ? (
              <motion.div 
                key="active-job"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-8 pb-32"
              >
                {/* Main Pro Frame */}
                <div className="bg-[#0f172a]/60 backdrop-blur-3xl rounded-[44px] border border-white/10 p-8 md:p-10 shadow-2xl flex flex-col gap-10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none" />
                  
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/[0.03] border border-white/5 rounded-3xl p-6 gap-6 relative z-10">
                    <div className="flex items-center gap-6">
                       <div className="w-20 h-20 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-2xl relative group">
                          <User size={40} className="group-hover:scale-110 transition-transform" />
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-[#0f172a] rounded-full" />
                       </div>
                       <div>
                          <h1 className="text-3xl font-black text-white tracking-tighter mb-1 lowercase leading-none">{job.customerName || 'Khách hàng'}</h1>
                          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                             <Shield size={12} className="text-indigo-400" /> ID: #{job.orderId ? job.orderId.slice(-6).toUpperCase() : 'N/A'}
                          </div>
                       </div>
                    </div>
                    <div className="flex flex-col items-start sm:items-end w-full sm:w-auto border-t sm:border-t-0 border-white/5 pt-4 sm:pt-0">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Thời gian giới hạn</p>
                       <p className="text-3xl font-black text-amber-500 tabular-nums lowercase">17:00 <span className="text-xs uppercase opacity-30">pm</span></p>
                    </div>
                  </div>

                  {/* Core Metrics Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                     <div className="bg-white/[0.02] p-6 rounded-[32px] border border-white/5 group hover:bg-white/[0.05] transition-all duration-500">
                        <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
                           <MapPin size={24} />
                        </div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">VỊ TRÍ TRIỂN KHAI</p>
                        <p className="text-xs font-bold text-white leading-relaxed line-clamp-2">{job.address || 'Đang cập nhật vị trí...'}</p>
                     </div>
                     <div className="bg-white/[0.02] p-6 rounded-[32px] border border-white/5 group hover:bg-white/[0.05] transition-all duration-500">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                           <AlertCircle size={24} />
                        </div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">LOẠI DỊCH VỤ</p>
                        <p className="text-xs font-bold text-white truncate">{job.serviceName || 'Xử lý kỹ thuật'}</p>
                     </div>
                     <div className="bg-white/[0.02] p-6 rounded-[32px] border border-white/5 group hover:bg-white/[0.05] transition-all duration-500 sm:col-span-2 lg:col-span-1">
                        <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                           <Clock size={24} />
                        </div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">DỰ KIẾN HOÀN THÀNH</p>
                        <p className="text-xs font-bold text-white lowercase">45-60 phút thi công</p>
                     </div>
                  </div>

                  {/* Media Gallery */}
                  <div className="space-y-6 relative z-10">
                    <div className="flex items-center justify-between px-2">
                       <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em] flex items-center gap-2">
                          <Sparkles size={14} className="text-indigo-400" /> BẰNG CHỨNG HIỆN TRƯỜNG & HÌNH ẢNH
                       </h3>
                    </div>
                    
                    <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
                       {jobDetail?.imageUrls && jobDetail.imageUrls.length > 0 ? (
                         jobDetail.imageUrls.map((url, idx) => (
                           <div key={idx} className="min-w-[220px] h-[150px] rounded-3xl overflow-hidden border border-white/5 relative group cursor-pointer snap-start shadow-2xl">
                              <img src={url} alt="Evidence" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                              <div className="absolute inset-0 bg-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                 <ImageIcon size={24} className="text-white" />
                              </div>
                           </div>
                         ))
                       ) : (
                         <div className="w-full h-[150px] bg-white/[0.01] border border-dashed border-white/10 rounded-[32px] flex flex-col items-center justify-center text-slate-600 gap-3 group">
                            <ImageIcon size={40} className="opacity-20 group-hover:scale-110 transition-transform" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Hệ thống chưa nhận hình ảnh</p>
                         </div>
                       )}
                    </div>
                  </div>

                  {/* Problem Description */}
                  <div className="bg-[#020617] border border-white/5 rounded-[32px] p-8 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-indigo-500 group-hover:scale-105 transition-transform duration-700">
                        <Briefcase size={100} />
                     </div>
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Mô tả chi tiết từ khách</p>
                     <p className="text-base text-slate-300 font-medium italic relative z-10 leading-relaxed max-w-4xl">
                        "{job.description || 'Hệ thống đang tiến hành kiểm tra và phân tích yêu cầu từ phía khách hàng...'}"
                     </p>
                  </div>

                  {/* PRO Action Toolbar */}
                  <div className="pt-6 border-t border-white/5 flex flex-col gap-6 relative z-10">
                    <div className="flex flex-col sm:flex-row gap-4">
                       <button 
                         onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(job.address)}`, '_blank')}
                         className="flex-1 py-5 px-8 bg-[#0f172a] border border-white/10 rounded-[28px] flex items-center justify-between group hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all shadow-2xl"
                       >
                         <div className="flex items-center gap-4">
                            <Navigation size={20} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-white transition-colors">Xem lộ trình Google Maps</span>
                         </div>
                         <ChevronRight size={18} className="text-slate-700 group-hover:translate-x-1 group-hover:text-indigo-400 transition-all" />
                       </button>
                       <div className="flex gap-4 w-full sm:w-auto">
                          <a href={`tel:${job.customerPhone}`} className="flex-1 sm:w-16 sm:h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-[24px] flex items-center justify-center text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all shadow-xl group/link">
                            <Phone size={24} className="group-hover/link:rotate-12 transition-transform" />
                          </a>
                          <a href={`https://zalo.me/${job.customerPhone}`} target="_blank" rel="noreferrer" className="flex-1 sm:w-16 sm:h-16 bg-sky-500/10 border border-sky-500/20 rounded-[24px] flex items-center justify-center text-sky-400 hover:bg-sky-500 hover:text-white transition-all shadow-xl group/link">
                            <MessageSquare size={24} className="group-hover/link:scale-110 transition-transform" />
                          </a>
                       </div>
                    </div>

                    <button 
                      onClick={handleCompleteOrder}
                      disabled={actionLoading}
                      className={cn(
                        "w-full p-10 rounded-[44px] flex items-center justify-between transition-all duration-700 border-2 shadow-2xl overflow-hidden relative group/final active:scale-[0.99]",
                        actionLoading 
                          ? "bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed"
                          : "bg-emerald-500/10 border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-white"
                      )}
                    >
                      <div className="flex items-center gap-8 relative z-10">
                        <div className="w-16 h-16 rounded-[22px] bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 group-hover/final:bg-white group-hover/final:text-emerald-600 transition-all duration-500 shadow-lg">
                           <Zap size={28} />
                        </div>
                        <div className="text-left">
                          <p className="text-[10px] font-black uppercase opacity-60 mb-0.5 tracking-[0.3em]">CÔNG VIỆC ĐÃ XONG</p>
                          <p className="text-3xl font-black uppercase tracking-tighter">Xác nhận hoàn tất</p>
                        </div>
                      </div>
                      <CheckCircle size={40} className="relative z-10 group-hover/final:scale-110 transition-transform group-hover/final:rotate-12" />
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-500 opacity-0 group-hover/final:opacity-100 transition-opacity duration-700" />
                    </button>
                  </div>
                </div>

                {/* Pending Confirmation List */}
                {pendingReviews.length > 0 && (
                  <div className="space-y-6 pt-10">
                    <h3 className="text-[11px] font-black text-amber-500 uppercase tracking-[0.4em] px-2 flex items-center gap-3">
                       <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                       DANH SÁCH CHỜ KHÁCH HÀNG PHẢN HỒI ({pendingReviews.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {pendingReviews.map((pr) => (
                        <div key={pr.orderId} className="bg-[#0f172a]/40 backdrop-blur-md border border-white/5 rounded-[36px] p-6 flex items-center justify-between group hover:border-white/10 transition-all shadow-xl">
                          <div className="flex items-center gap-5 min-w-0">
                             <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 border border-white/5 shrink-0 group-hover:scale-110 transition-transform">
                                <Clock size={24} className="animate-pulse" />
                             </div>
                             <div className="min-w-0">
                                <h4 className="text-sm font-black text-white uppercase truncate mb-1 tracking-tight">{pr.title}</h4>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{pr.customerName} • {pr.sentAt}</p>
                             </div>
                          </div>
                          <button onClick={() => handleDebugConfirm(pr.orderId)} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-emerald-600 transition-all shrink-0 shadow-lg group-hover:rotate-12 transition-transform">
                             <CheckCircle size={20} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center py-48 animate-in zoom-in duration-700">
                 <div className="w-24 h-24 rounded-[32px] bg-slate-900 border border-white/5 flex items-center justify-center text-slate-800 mb-8 shadow-inner">
                    <Briefcase size={48} />
                 </div>
                 <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-3">Hệ thống đang sẵn sàng</h2>
                 <p className="text-slate-500 mb-12 text-center max-w-sm font-medium">Bạn chưa có công việc đang thực hiện. Hãy tiếp nhận đơn hàng tại danh sách đơn đã tiếp nhận.</p>
                 <Link to="/technician/don-hang/da-tiep-nhan" className="group px-12 py-5 bg-indigo-600 text-white rounded-[24px] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-500 transition-all flex items-center gap-4">
                    Đến trang đơn đã tiếp nhận <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                 </Link>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* === RIGHT SIDEBAR: PERSISTENT SYNCED DESIGN === */}
        <div className="w-full lg:w-[380px] space-y-8 h-full shrink-0 flex flex-col min-h-0 overflow-y-auto lg:overflow-visible pr-2 md:pr-0">
          
          {/* Stats Widget */}
          <div className="bg-[#0f172a]/60 backdrop-blur-3xl border border-white/10 rounded-[40px] p-8 space-y-8 relative overflow-hidden shadow-2xl shrink-0">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none text-white">
                <Activity size={120} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Nhiệm vụ đã nhận</p>
                <div className="flex items-baseline gap-2">
                   <span className="text-5xl font-black text-white tabular-nums">{acceptedCount}</span>
                   <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-tighter">Hiện có</span>
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
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest italic">UPDATING...</p>
                  </div>
               </div>
               <ChevronRight size={18} className="text-slate-600 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Map Insight Widget */}
          <div className="bg-[#0f172a]/60 backdrop-blur-3xl border border-white/10 rounded-[40px] p-8 space-y-8 shadow-2xl shrink-0">
            <div className="flex items-center justify-between">
               <div className="space-y-1">
                 <h3 className="text-xs font-black text-white uppercase tracking-widest leading-none mb-1">Khu vực triển khai</h3>
                 <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-[0.2em] font-black">Hoạt động trực tuyến</p>
               </div>
               <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[9px] font-black text-emerald-500 uppercase tracking-tighter shadow-sm">TRỰC TUYẾN</div>
            </div>
            <div className="relative rounded-3xl overflow-hidden aspect-video bg-slate-900 border border-white/5 group shadow-xl">
               <iframe width="100%" height="100%" frameBorder="0" style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%)' }} src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d122691.61914371526!2d108.132717088925!3d16.047165882643883!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x314219c7922b6539%3A0x1390977800000000!2zxJDDoCBO4bq5bmcsIFZp4buHdCBOYW0!5e0!3m2!1svi!2s!4v1713170000000!5m2!1svi!2s" allowFullScreen></iframe>
               <div className="absolute bottom-4 left-4 right-4 p-4 bg-black/80 backdrop-blur-md rounded-2xl border border-white/10 text-center">
                  <p className="text-[11px] font-black text-white uppercase leading-none mb-1 tracking-tight">ĐÀ NẴNG CITY</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em]">ACTIVE COVERAGE</p>
               </div>
            </div>
            <div className="space-y-5 px-1">
               <div className="flex items-center gap-5 group">
                  <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 border border-white/5 shadow-inner group-hover:text-indigo-400 transition-colors">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">VÙNG ĐĂNG KÝ</p>
                    <p className="text-[13px] font-bold text-slate-200 uppercase">Việt Nam</p>
                  </div>
               </div>
               <div className="flex items-center gap-5 group">
                  <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 border border-white/5 shadow-inner group-hover:text-emerald-400 transition-colors">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">HIỆN DIỆN</p>
                    <p className="text-[13px] font-bold text-slate-200">Thành phố Đà Nẵng</p>
                  </div>
               </div>
            </div>
            {/* Goal Progress Widget */}
            <div className="pt-8 border-t border-white/10 space-y-5 px-1">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target size={16} className="text-indigo-400" />
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">CHỈ TIÊU</span>
                  </div>
                  <span className="text-sm font-black text-white tabular-nums">{stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%</span>
               </div>
               <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden shadow-inner flex">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%` }} transition={{ duration: 1.5, ease: "easeOut" }} className="h-full bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
               </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
