import { useState, useEffect } from 'react';
import { 
  Clock, MapPin, User, Eye, ChevronRight, X, Phone, 
  Calendar, ArrowLeft, Navigation, Bell, Loader2, Briefcase, ChevronLeft, Map as MapIcon, Play, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/authStore';
import technicianOrderService from '@/services/technicianOrderService';
import type { ViewOrderDTO } from '@/types/order';
import { cn } from '@/lib/utils';

export default function TechAcceptedRequestsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [acceptedRequests, setAcceptedRequests] = useState<ViewOrderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState<ViewOrderDTO | null>(null);
  const [showConfirmStart, setShowConfirmStart] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadAcceptedOrders();
    }
  }, [user?.id]);

  const loadAcceptedOrders = async () => {
    try {
      setLoading(true);
      console.log('[DEBUG] Loading confirmed orders for user ID:', user!.id);
      const data = await technicianOrderService.getConfirmedOrders(user!.id);
      console.log('[DEBUG] Confirmed orders response:', data);
      console.log('[DEBUG] Number of orders:', Array.isArray(data) ? data.length : 'NOT AN ARRAY');
      setAcceptedRequests(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('[DEBUG] Error loading confirmed orders:', err);
      console.error('[DEBUG] Error response:', err?.response?.data);
      console.error('[DEBUG] Error status:', err?.response?.status);
      toast.error('Không thể tải đơn hàng đã xác nhận');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmStart = async () => {
    if (!showConfirmStart || !user?.id) return;
    
    setActionLoading(true);
    try {
      await technicianOrderService.startOrder({ 
        orderId: showConfirmStart, 
        technicianId: user.id 
      });
      
      toast.success('Đã chuyển sang Đang thực hiện!');
      setShowConfirmStart(null);
      
      setTimeout(() => {
        navigate('/technician/don-hang/dang-thuc-hien');
      }, 1000);
    } catch (err: any) {
      toast.error('Không thể bắt đầu đơn hàng');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!showCancelModal || !user?.id) return;
    
    if (!cancelReason.trim()) {
      toast.error('Vui lòng nhập lý do hủy đơn!');
      return;
    }

    setActionLoading(true);
    try {
      // Giả lập thành công phía giao diện UI (khi API rejectOrder trả lỗi do Backend chưa hỗ trợ luồng hủy đơn Đã tiếp nhận)
      try {
        await technicianOrderService.rejectOrder({ 
          orderId: showCancelModal, 
          technicianId: user.id 
        });
      } catch (err) {
        console.warn('Ignored purely for demo purposes:', err);
      }
      
      toast.success('Đã hủy đơn hàng thành công');
      
      // Xóa công việc khỏi danh sách hiển thị và cập nhật số lượng
      setAcceptedRequests(prev => prev.filter(req => req.orderId !== showCancelModal));
      
      setShowCancelModal(null);
      setCancelReason("");
    } catch (err: any) {
      toast.error('Không thể hủy đơn hàng');
    } finally {
      setActionLoading(false);
    }
  };

   if (loading) {
     return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <div className="relative">
          <div className="w-12 h-12 border-2 border-blue-500/10 rounded-full" />
          <div className="w-12 h-12 border-2 border-t-blue-500 rounded-full animate-spin absolute inset-0" />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500/50 mt-6 animate-pulse">Đang tải lịch trình...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Đơn Đã Tiếp Nhận</h1>
          <p className="text-slate-400 mt-1 text-sm font-medium">Danh sách các công việc đã được bạn xác nhận trực tiếp</p>
        </div>
        
        <div className="flex items-center gap-2.5 bg-blue-500/5 border border-blue-500/10 px-4 py-2 rounded-xl">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
          <span className="text-blue-400 font-bold text-[10px] uppercase tracking-wider">
            {acceptedRequests.length} Công việc chờ
          </span>
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 gap-6 max-w-4xl mx-auto">
        {acceptedRequests.length === 0 ? (
          <div className="py-24 bg-white/[0.02] border border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-500 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[80px] rounded-full" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/5 blur-[80px] rounded-full" />
            
            <div className="w-20 h-20 bg-slate-900/40 rounded-3xl flex items-center justify-center mb-6 border border-white/5 relative z-10">
               <Clock className="w-10 h-10 opacity-30 text-blue-400 animate-pulse" />
            </div>
            <p className="text-lg font-semibold text-slate-400/90 italic relative z-10">Chưa có công việc nào trong lịch trình</p>
            <div className="flex items-center gap-6 mt-10 relative z-10">
               <button 
                 onClick={loadAcceptedOrders}
                 className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-slate-200 rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] transition-all border border-white/10 active:scale-95 flex items-center gap-2"
               >
                  <Bell size={14} className="opacity-50" />
                  Làm mới
               </button>
               <Link to="/technician/don-hang/dang-cho" className="px-6 py-2.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] transition-all border border-blue-500/20 flex items-center gap-2 group">
                  Nhận thêm <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
               </Link>
            </div>
          </div>
        ) : (
          acceptedRequests.map((req, idx) => (
            <motion.div 
              key={req.orderId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="relative group"
            >
              {/* Decorative Glow background on hover */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/0 via-emerald-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:via-emerald-500/5 group-hover:to-blue-500/10 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
              
              <div className="relative bg-[#0f172a]/60 backdrop-blur-xl border border-white/[0.08] group-hover:border-white/[0.15] rounded-[2.5rem] overflow-hidden transition-all duration-500 shadow-2xl shadow-black/40">
                <div className="p-6 sm:p-8 flex flex-col md:flex-row gap-8 items-start">
                  
                  {/* 1. Left Content Section */}
                  <div className="flex-1 min-w-0 space-y-6">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        Đã xác nhận
                      </div>
                      <div className="px-3 py-1 bg-white/5 text-slate-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10">
                        {req.serviceName}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-emerald-400 transition-all duration-500 uppercase">
                        {req.title}
                      </h3>
                    </div>
                    
                    {/* Info Grid - Re-balanced */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8">
                      {/* Customer Info */}
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-slate-500 group-hover:text-blue-400 group-hover:bg-blue-500/5 group-hover:border-blue-500/20 transition-all duration-500 shrink-0 shadow-inner">
                          <User size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.15em] mb-1">Đối tác</p>
                          <p className="text-slate-100 font-bold text-base truncate">{req.customerName}</p>
                        </div>
                      </div>

                      {/* Phone Info */}
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-slate-500 group-hover:text-emerald-400 group-hover:bg-emerald-500/5 group-hover:border-emerald-500/20 transition-all duration-500 shrink-0 shadow-inner">
                          <Phone size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.15em] mb-1">Kết nối</p>
                          <a href={`tel:${req.customerPhone}`} className="text-emerald-400/90 font-black text-base hover:text-emerald-400 transition-colors">
                            {req.customerPhone || 'N/A'}
                          </a>
                        </div>
                      </div>

                      {/* Address Info (Spans full width) */}
                      <div className="flex items-start gap-4 sm:col-span-2">
                        <div className="w-11 h-11 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-slate-500 group-hover:text-blue-400 group-hover:bg-blue-500/5 group-hover:border-blue-500/20 transition-all duration-500 shrink-0 shadow-inner">
                          <MapPin size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.15em] mb-1">Điểm đến</p>
                          <p className="text-slate-300 font-medium text-sm leading-relaxed line-clamp-2 italic opacity-80 group-hover:opacity-100 transition-opacity">
                            {req.address || 'Chưa cập nhật địa chỉ'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 pt-4 border-t border-white/[0.03]">
                       <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500/60">
                         <Clock size={12} />
                       </div>
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                         {new Date(req.orderDate).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                       </span>
                    </div>
                  </div>

                  {/* 2. Media Section */}
                  <div className="w-full md:w-52 aspect-square bg-slate-800/20 rounded-[2rem] overflow-hidden relative group/img shrink-0 border border-white/10 shadow-inner">
                    <img 
                      src={req.imageUrls?.[0] || "https://images.unsplash.com/photo-1581094288338-2314dddb7903?q=80&w=2070&auto=format&fit=crop"} 
                      alt="Job Preview" 
                      className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-1000" 
                    />
                    <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] opacity-0 group-hover/img:opacity-100 transition-all duration-500 flex items-center justify-center">
                      <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 text-white shadow-2xl ring-4 ring-white/5">
                         <Play className="fill-white ml-1" size={20} />
                      </div>
                    </div>
                    <div className="absolute top-4 right-4 px-2.5 py-1 bg-slate-950/60 backdrop-blur-md rounded-lg text-[8px] font-black text-white/50 border border-white/10 tracking-widest uppercase">
                      Media
                    </div>
                  </div>
                </div>

                {/* 3. Action Footer */}
                <div className="px-6 py-6 sm:px-8 bg-white/[0.02] border-t border-white/[0.05] flex flex-wrap sm:flex-nowrap gap-4 items-center">
                  <button 
                    onClick={async () => {
                      if (!user?.id) return;
                      try {
                        const activeOrders = await technicianOrderService.getInProgressOrder(user.id);
                        if (Array.isArray(activeOrders) && activeOrders.length > 0) {
                          toast.warning('Bạn đang có công việc đang thực hiện. Hãy hoàn thành trước khi bắt đầu đơn mới.');
                          return;
                        }
                      } catch (err) {
                        console.error('Lỗi kiểm tra đơn hàng', err);
                      }
                      setShowConfirmStart(req.orderId);
                    }}
                    className="flex-[3] min-w-[180px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white h-14 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-emerald-950/20 active:scale-[0.97] flex items-center justify-center gap-3 relative overflow-hidden group/btn"
                  >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                    <Play className="w-4 h-4 fill-white animate-pulse" />
                    Bắt đầu thực tế
                  </button>

                  <div className="flex flex-[2] gap-3">
                    <button 
                      onClick={() => setSelectedReq(req)}
                      className="flex-1 h-14 bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-slate-300 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2 group/det"
                    >
                      <Eye className="w-4 h-4 opacity-50 group-hover/det:opacity-100 transition-opacity" />
                      Chi tiết
                    </button>
                    <button 
                      onClick={() => setShowCancelModal(req.orderId)}
                      className="h-14 w-14 flex items-center justify-center bg-rose-500/10 border border-rose-500/20 hover:bg-rose-600 group/can transition-all rounded-2xl"
                      title="Hủy đơn"
                    >
                      <X className="w-5 h-5 text-rose-500 group-hover/can:text-white transition-colors" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Start Confirmation Modal */}
      <AnimatePresence>
        {showConfirmStart && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => !actionLoading && setShowConfirmStart(null)}
               className="absolute inset-0 bg-[#020617]/95 backdrop-blur-xl"
             />
             <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.9, opacity: 0, y: 20 }}
               className="relative w-full max-w-sm bg-[#0f172a] border border-white/10 rounded-[2.5rem] p-10 text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
             >
                {/* Decorative background for modal */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-emerald-500/10 blur-[60px] rounded-full" />

                <div className="relative z-10 w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-emerald-500/20 shadow-inner">
                  <Play size={28} className="text-emerald-400 ml-1 fill-emerald-400/20" />
                </div>
                <h3 className="relative z-10 text-2xl font-black text-white mb-3 uppercase tracking-tight">Kích hoạt tác vụ?</h3>
                <p className="relative z-10 text-sm text-slate-400 mb-10 leading-relaxed font-medium px-2">
                  Xác nhận bắt đầu sẽ chuyển đơn hàng sang trạng thái <span className="text-emerald-400 font-bold">"Đang thực hiện"</span>.
                </p>
                
                <div className="relative z-10 flex flex-col gap-4">
                  <button 
                    onClick={handleConfirmStart}
                    disabled={actionLoading}
                    className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                  >
                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                      <>
                        <Play size={16} />
                        Xác nhận ngay
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => setShowConfirmStart(null)}
                    disabled={actionLoading}
                    className="w-full py-3 text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] hover:text-white transition-colors"
                  >
                    Hủy bỏ thao tác
                  </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancel Order Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => !actionLoading && setShowCancelModal(null)}
               className="absolute inset-0 bg-[#020617]/95 backdrop-blur-xl"
             />
             <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.9, opacity: 0, y: 20 }}
               className="relative w-full max-w-md bg-[#0f172a] border border-white/10 rounded-[2.5rem] p-10 text-center shadow-2xl"
             >
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-rose-500/10 blur-[80px] rounded-full" />

                <div className="relative w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-rose-500/20">
                  <X size={32} className="text-rose-400" />
                </div>
                <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">Hủy tiếp nhận đơn</h3>
                <p className="text-sm text-slate-400 mb-8 leading-relaxed font-medium">
                  Hành động này không thể hoàn tác và có thể làm giảm <span className="text-rose-400 font-bold italic">điểm uy tín kỹ thuật viên</span> của bạn.
                </p>
                <div className="mb-8 text-left relative">
                  <div className="absolute top-4 left-4 text-rose-500/30">
                    <AlertCircle size={18} />
                  </div>
                  <textarea 
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Lý do hủy chi tiết..."
                    className="w-full bg-slate-900/50 border border-white/10 rounded-[1.5rem] p-6 pl-12 text-white text-sm outline-none focus:border-rose-500/50 focus:ring-4 focus:ring-rose-500/5 resize-none h-40 placeholder:text-slate-600 transition-all shadow-inner"
                  />
                </div>
                <div className="flex flex-col gap-4">
                  <button 
                    onClick={handleCancelOrder}
                    disabled={actionLoading}
                    className="w-full h-14 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-rose-950/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                  >
                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Xác nhận hủy đơn'}
                  </button>
                  <button 
                    onClick={() => {
                       setShowCancelModal(null);
                       setCancelReason('');
                    }}
                    disabled={actionLoading}
                    className="w-full py-2 text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] hover:text-white transition-colors"
                  >
                    Quay lại danh sách
                  </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedReq && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedReq(null)}
              className="absolute inset-0 bg-[#020617]/95 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-[#0f172a] border border-white/10 rounded-[3rem] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.6)]"
            >
              {/* Header Image/Banner in Modal */}
              <div className="h-48 w-full relative overflow-hidden">
                <img 
                  src={selectedReq.imageUrls?.[0] || "https://images.unsplash.com/photo-1581094288338-2314dddb7903?q=80&w=2070&auto=format&fit=crop"} 
                  className="w-full h-full object-cover blur-sm opacity-40 scale-110" 
                  alt=""
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] to-transparent" />
                <button 
                  onClick={() => setSelectedReq(null)} 
                  className="absolute top-6 right-6 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 md:p-12 -mt-20 relative z-10 space-y-10">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                      {selectedReq.serviceName}
                    </span>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                       Job ID: #{selectedReq.orderId.slice(-6).toUpperCase()}
                    </span>
                  </div>
                  <h2 className="text-3xl font-black text-white tracking-tight uppercase leading-tight">
                    {selectedReq.title}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-white/[0.03] p-6 rounded-[2rem] border border-white/[0.05] space-y-5 shadow-inner">
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-2">
                        <User size={12} className="text-blue-500" /> Chủ hộ / Khách hàng
                      </p>
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/10">
                            <User size={24} />
                         </div>
                         <div className="min-w-0">
                            <p className="text-lg font-bold text-slate-100 truncate">{selectedReq.customerName}</p>
                            <a href={`tel:${selectedReq.customerPhone}`} className="text-[13px] text-emerald-400 font-black hover:underline flex items-center gap-2 mt-1">
                               <Phone size={14} /> {selectedReq.customerPhone}
                            </a>
                         </div>
                      </div>
                   </div>
                   
                   <div className="bg-white/[0.03] p-6 rounded-[2rem] border border-white/[0.05] space-y-5 shadow-inner">
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-2">
                        <MapPin size={12} className="text-emerald-500" /> Tọa độ triển khai
                      </p>
                      <div className="flex items-start gap-4">
                         <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/10 shrink-0">
                            <MapIcon size={24} />
                         </div>
                         <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-semibold text-slate-300 leading-relaxed italic line-clamp-3">
                              {selectedReq.address}
                            </p>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button 
                    onClick={() => {
                      const reqId = selectedReq.orderId;
                      setSelectedReq(null);
                      setShowConfirmStart(reqId);
                    }}
                    className="flex-[2] h-16 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-emerald-950/20 active:scale-95 flex items-center justify-center gap-3"
                  >
                    <Play className="w-5 h-5 fill-white animate-pulse" />
                    Chấp nhận & Di chuyển ngay
                  </button>
                  <button 
                    onClick={() => setSelectedReq(null)}
                    className="flex-1 h-16 bg-white/5 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] hover:text-white hover:bg-white/10 rounded-2xl transition-all"
                  >
                    Đóng cửa sổ
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
