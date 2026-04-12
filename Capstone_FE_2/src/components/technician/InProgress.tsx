import { useState, useEffect } from 'react';
import { 
  MapPin, Clock, Phone, MessageSquare, CheckCircle, 
  AlertCircle, Briefcase, User, 
  Navigation, ChevronRight, Play, Loader2
} from 'lucide-react';
import useAuthStore from '@/store/authStore';
import technicianOrderService from '@/services/technicianOrderService';
import { ViewOrderDTO } from '@/types/order';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';

// Kiểu dữ liệu cho đơn đang chờ khách đánh giá
interface PendingReviewOrder {
  orderId: string;
  title: string;
  customerName: string;
  sentAt: string; // Thời gian gửi yêu cầu xác nhận
}

export function InProgress() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [job, setJob] = useState<ViewOrderDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [actionLoading, setActionLoading] = useState(false);
  const [pendingReviews, setPendingReviews] = useState<PendingReviewOrder[]>([]);

  useEffect(() => {
    if (user?.id) {
      loadInProgress();
      loadPendingReviews();
    }
  }, [user?.id]);

  useEffect(() => {
    if (job?.orderId) {
      const savedStep = localStorage.getItem(`order_step_${job.orderId}`);
      if (savedStep) {
        setCurrentStep(parseInt(savedStep));
      } else {
        setCurrentStep(1);
      }
    }
  }, [job?.orderId]);

  const updateStep = (step: number) => {
    if (job?.orderId) {
      setCurrentStep(step);
      localStorage.setItem(`order_step_${job.orderId}`, step.toString());
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

      // Kiểm tra xem đơn này có đang nằm trong danh sách chờ đánh giá không
      const stored = localStorage.getItem('pendingReviewOrders');
      const pendingList: PendingReviewOrder[] = stored ? JSON.parse(stored) : [];
      const isPending = pendingList.some(p => p.orderId === data.orderId);

      if (isPending) {
        setJob(null);
      } else {
        setJob(data);
      }
    } catch (err: any) {
      console.error('Error loading in-progress job:', err);
      setJob(null);
    } finally {
      setLoading(false);
    }
  };

  // Load danh sách đơn đang chờ khách đánh giá từ localStorage
  const loadPendingReviews = () => {
    const stored = localStorage.getItem('pendingReviewOrders');
    if (stored) {
      setPendingReviews(JSON.parse(stored));
    }
  };

  // Lưu đơn vào danh sách chờ đánh giá
  const addToPendingReview = (order: ViewOrderDTO) => {
    const newEntry: PendingReviewOrder = {
      orderId: order.orderId,
      title: order.title,
      customerName: order.customerName,
      sentAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };
    const updated = [newEntry, ...pendingReviews];
    setPendingReviews(updated);
    localStorage.setItem('pendingReviewOrders', JSON.stringify(updated));
  };

  // Xóa đơn khỏi danh sách chờ (khi khách xác nhận xong)
  const removePendingReview = (orderId: string) => {
    const updated = pendingReviews.filter(p => p.orderId !== orderId);
    setPendingReviews(updated);
    localStorage.setItem('pendingReviewOrders', JSON.stringify(updated));
  };

  const handleNextStep = async () => {
    if (currentStep < 3) {
      const next = currentStep + 1;
      updateStep(next);
      const labels = ['', 'Di chuyển', 'Sửa chữa'];
      toast.success(`Đã chuyển sang giai đoạn: ${labels[next]}`, { icon: '🚀' });
    } else if (currentStep === 3) {
      if (!job) return;
      
      setActionLoading(true);
      // Sử dụng toast.promise để người dùng thấy quá trình đang xử lý
      const completePromise = technicianOrderService.completeOrder(job.orderId)
        .then(() => {
          // Lưu vào danh sách chờ đánh giá CHỈ khi API thành công
          addToPendingReview(job);
          localStorage.removeItem(`order_step_${job.orderId}`);
          setJob(null);
          setCurrentStep(1);
        });

      toast.promise(completePromise, {
        loading: 'Đang gửi yêu cầu xác nhận...',
        success: 'Đã gửi yêu cầu! Bạn có thể nhận đơn mới.',
        error: 'Lỗi khi gửi yêu cầu. Vui lòng thử lại.'
      });

      try {
        await completePromise;
      } catch (err) {
        console.error('Complete order error:', err);
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Debug: Khách xác nhận hoàn thành
  const handleDebugConfirm = (orderId: string) => {
    removePendingReview(orderId);
    toast.success('Khách hàng đã xác nhận! Đơn chuyển vào lịch sử.');
  };

  const handleRefresh = () => {
    loadInProgress();
    loadPendingReviews();
    toast.success('Đã cập nhật dữ liệu mới nhất');
  };

  if (loading && !job) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-3" />
        <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">Đang đồng bộ dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1500px] mx-auto px-6 py-4 h-full flex flex-col animate-in fade-in duration-500 overflow-y-auto custom-scrollbar">

      {/* PHẦN 1: CÔNG VIỆC ĐANG THỰC HIỆN */}
      <AnimatePresence mode="wait">
        {job ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col gap-5 shrink-0"
          >
            {/* COMPACT STEPPER */}
            <div className="bg-[#0f172a]/40 backdrop-blur-2xl rounded-[32px] border border-white/5 p-5 shadow-xl relative overflow-hidden shrink-0">
               <div className="relative z-10 flex items-center justify-between max-w-4xl mx-auto">
                 {[
                   { id: 1, label: 'Đã nhận', icon: Briefcase },
                   { id: 2, label: 'Di chuyển', icon: Navigation },
                   { id: 3, label: 'Sửa chữa', icon: AlertCircle },
                   { id: 4, label: 'Hoàn thành', icon: CheckCircle }
                 ].map((s, idx) => (
                   <div key={s.id} className="flex-1 flex items-center group">
                      <div className="flex flex-col items-center gap-2 relative z-10 mx-auto">
                         <div className={cn(
                           "w-11 h-11 rounded-full flex items-center justify-center transition-all duration-500 border-2",
                           currentStep >= s.id 
                            ? "bg-indigo-500 border-indigo-400 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]" 
                            : "bg-slate-900 border-slate-800 text-slate-600"
                         )}>
                            {currentStep > s.id ? <CheckCircle size={20} /> : <s.icon size={20} />}
                         </div>
                         <div className="text-center">
                            <p className={cn(
                              "text-[9px] font-black uppercase tracking-widest transition-colors",
                              currentStep >= s.id ? "text-white" : "text-slate-600"
                            )}>{s.label}</p>
                         </div>
                      </div>
                      {idx < 3 && (
                        <div className="hidden md:block flex-1 h-[2px] mx-2 -mt-6 bg-slate-800 relative min-w-[30px]">
                           <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: currentStep > s.id ? '100%' : '0%' }}
                              className="absolute inset-0 bg-indigo-500"
                           />
                        </div>
                      )}
                   </div>
                 ))}
               </div>
            </div>

            {/* MAIN CONTENT GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-start">
              
              {/* LEFT COL: INFO */}
              <div className="flex flex-col gap-4">
                <div className="bg-[#0f172a]/60 backdrop-blur-3xl rounded-[32px] border border-white/5 p-8 shadow-xl relative group flex flex-col gap-6">
                  
                  {/* Compact Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-white/5 pb-6">
                    <div>
                       <h2 className="text-3xl font-black text-white tracking-tight leading-none mb-2">{job.customerName}</h2>
                       <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                          <User size={12}/> ID: #{job.orderId.slice(-6)}
                       </div>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-2xl flex items-center gap-3">
                       <Clock className="text-amber-500" size={16} />
                       <p className="text-[11px] font-black text-white uppercase tracking-tighter">HẠN: 17:00</p>
                    </div>
                  </div>

                  {/* Compact Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/[0.03] p-5 rounded-[24px] border border-white/5 flex items-start gap-4">
                       <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/10 shrink-0">
                          <MapPin size={18} />
                       </div>
                       <div className="min-w-0">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">ĐỊA CHỈ</p>
                          <p className="text-sm font-bold text-white leading-tight line-clamp-2">{job.address}</p>
                       </div>
                    </div>
                    <div className="bg-white/[0.03] p-5 rounded-[24px] border border-white/5 flex items-start gap-4">
                       <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/10 shrink-0">
                          <AlertCircle size={18} />
                       </div>
                       <div className="min-w-0">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">THIẾT BỊ</p>
                          <p className="text-sm font-bold text-white leading-tight">Điều hòa</p>
                       </div>
                    </div>
                  </div>

                  {/* Compact Notes */}
                  <div className="bg-white/[0.02] p-6 rounded-[24px] border border-white/5">
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Briefcase size={12}/> GHI CHÚ</p>
                     <p className="text-sm text-slate-300 font-medium leading-relaxed italic line-clamp-2">
                       "{job.description || 'Khách báo cần kiểm tra gấp do có trẻ nhỏ.'}"
                     </p>
                  </div>

                  {/* Compact Video */}
                  <div className="h-44 rounded-[28px] bg-slate-950 border border-white/5 overflow-hidden relative group cursor-pointer shadow-lg shrink-0">
                     <img 
                      src="https://images.unsplash.com/photo-1581094288338-2314dddb7903?q=80&w=2070&auto=format&fit=crop" 
                      className="w-full h-full object-cover opacity-30 transition duration-500 group-hover:scale-105" 
                      alt="Thumbnail"
                     />
                     <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 bg-indigo-500/30 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-white shadow-xl group-hover:bg-indigo-500 transition-all">
                           <Play size={24} fill="currentColor" className="ml-0.5" />
                        </div>
                     </div>
                     <div className="absolute top-4 left-4 px-3 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        <span className="text-[8px] font-black text-white uppercase tracking-widest">VIDEO HIỆN TRƯỜNG</span>
                     </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COL: SIDEBAR */}
              <div className="flex flex-col gap-5">
                {/* Map */}
                <div className="bg-[#0f172a]/60 backdrop-blur-3xl rounded-[32px] border border-white/5 p-6 shadow-xl space-y-5">
                   <div className="flex items-center justify-between">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">LỘ TRÌNH</p>
                      <div className="flex items-center gap-2">
                         <span className="text-xs font-black text-white">4.2 km</span>
                         <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[8px] font-black border border-emerald-500/10">~12'</span>
                      </div>
                   </div>
                   <div className="h-48 rounded-[24px] bg-slate-900 border border-white/5 overflow-hidden relative shadow-inner">
                      <img 
                        src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=2068&auto=format&fit=crop" 
                        alt="Map" 
                        className="w-full h-full object-cover opacity-30 grayscale"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                         <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center border-2 border-white/20 shadow-xl">
                            <Navigation size={16} className="text-white" />
                         </div>
                      </div>
                   </div>
                </div>

                {/* Quick Contact */}
                <div className="bg-[#0f172a]/80 backdrop-blur-3xl rounded-[32px] border border-white/5 p-6 shadow-xl space-y-4">
                   <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">LIÊN HỆ</p>
                   <div className="grid grid-cols-2 gap-3">
                      <a href={`tel:${job.customerPhone}`} className="flex flex-col items-center gap-2 p-4 bg-white/[0.03] rounded-[20px] border border-white/5 hover:bg-white/[0.08] transition-all group">
                        <Phone size={16} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                        <span className="text-[8px] font-black text-white uppercase">GỌI ĐIỆN</span>
                      </a>
                      <a href={`https://zalo.me/${job.customerPhone}`} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 p-4 bg-white/[0.03] rounded-[20px] border border-white/5 hover:bg-white/[0.08] transition-all group">
                        <MessageSquare size={16} className="text-sky-400 group-hover:scale-110 transition-transform" />
                        <span className="text-[8px] font-black text-white uppercase">ZALO</span>
                      </a>
                   </div>
                </div>

                {/* Action Button */}
                <button 
                  onClick={handleNextStep}
                  disabled={actionLoading}
                  className={cn(
                    "w-full p-6 rounded-[32px] flex items-center justify-between transition-all duration-300 border-2",
                    actionLoading 
                      ? "bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed"
                      : "bg-indigo-500/10 border-indigo-500 text-indigo-400 hover:bg-indigo-500 hover:text-white shadow-lg active:scale-95"
                  )}
                >
                  <div className="text-left">
                    <p className="text-[8px] font-black uppercase opacity-60 mb-0.5 tracking-widest">
                      {actionLoading ? 'ĐANG XỬ LÝ' : 'TIẾP THEO'}
                    </p>
                    <p className="text-sm font-black uppercase tracking-tighter">
                       {actionLoading ? "Vui lòng đợi..." : (
                         <>
                           {currentStep === 1 && "BẮT ĐẦU DI CHUYỂN"}
                           {currentStep === 2 && "BẮT ĐẦU SỬA CHỮA"}
                           {currentStep === 3 && "GỬI XÁC NHẬN HOÀN THÀNH"}
                         </>
                       )}
                    </p>
                  </div>
                  {actionLoading ? <Loader2 size={20} className="animate-spin" /> : <ChevronRight size={20} />}
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Khi không có đơn đang thực hiện -> Hiển thị nút vào Đã tiếp nhận */
          <div className="flex flex-col items-center justify-center py-20 bg-[#0f172a]/20 border border-dashed border-slate-800 rounded-[40px] text-slate-500 shrink-0">
            <Briefcase className="w-12 h-12 opacity-10 mb-4" />
            <p className="text-lg font-black text-slate-400 tracking-tight">Hiện không có công việc đang thực hiện</p>
            <p className="text-sm text-slate-600 mt-1 mb-6">Vào mục "Đã tiếp nhận" để bắt đầu đơn tiếp theo</p>
            <Link 
              to="/technician/don-hang/da-tiep-nhan" 
              className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
            >
               Vào đơn đã tiếp nhận
               <ChevronRight size={16} />
            </Link>
          </div>
        )}
      </AnimatePresence>

      {/* PHẦN 2: ĐƠN ĐANG CHỜ KHÁCH ĐÁNH GIÁ */}
      {pendingReviews.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-10 shrink-0"
        >
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-[11px] font-black text-amber-400 uppercase tracking-[0.3em] flex items-center gap-2">
                <Clock size={14} /> ĐƠN CHỜ KHÁCH ĐÁNH GIÁ ({pendingReviews.length})
             </h3>
             <button 
               onClick={handleRefresh}
               className="px-4 py-2 bg-white/5 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all border border-white/5"
             >
               Làm mới (Sync)
             </button>
          </div>
          <div className="space-y-4">
            {pendingReviews.map((pr) => (
              <div
                key={pr.orderId}
                className="bg-[#0f172a]/40 backdrop-blur-xl border border-amber-500/10 rounded-[28px] p-6 flex flex-col sm:flex-row items-center justify-between gap-4 group hover:border-amber-500/20 transition-all"
              >
                <div className="flex items-center gap-5 flex-1 min-w-0">
                  <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 border border-amber-500/10 shrink-0">
                     <Clock size={20} className="animate-pulse" />
                  </div>
                  <div className="min-w-0 flex-1">
                     <h4 className="text-sm font-black text-white uppercase tracking-tight truncate">{pr.title}</h4>
                     <div className="flex items-center gap-3 mt-1">
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{pr.customerName}</p>
                        <div className="w-1 h-1 rounded-full bg-slate-700" />
                        <p className="text-[9px] text-amber-400/60 font-bold">Gửi lúc {pr.sentAt}</p>
                     </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                   <div className="flex flex-col items-end gap-1 px-4 py-2 bg-amber-500/5 rounded-2xl border border-amber-500/10">
                      <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest leading-none">TRẠNG THÁI</p>
                      <p className="text-[10px] font-bold text-white uppercase tracking-tighter flex items-center gap-1.5">
                        <Loader2 size={10} className="animate-spin text-amber-500" /> Đang đợi khách
                      </p>
                   </div>
                   <button 
                     onClick={() => handleDebugConfirm(pr.orderId)}
                     className="h-11 px-6 bg-emerald-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-900/20 hover:scale-105 active:scale-95 transition-all"
                   >
                     Duyệt nhanh (Debug)
                   </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
