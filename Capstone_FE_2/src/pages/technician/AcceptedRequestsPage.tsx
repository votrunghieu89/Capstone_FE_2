import { useState, useEffect } from 'react';
import { 
  Clock, MapPin, User, ChevronRight, X, Phone, 
  Bell, Loader2, Briefcase, Map as MapIcon, Play, AlertCircle, CheckCircle
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
  const [simulationError, setSimulationError] = useState<string | null>(null);

  const formatVND = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  useEffect(() => {
    if (user?.id) {
      loadAcceptedOrders();
    }
  }, [user?.id]);

  const loadAcceptedOrders = async () => {
    try {
      setLoading(true);
      const data = await technicianOrderService.getConfirmedOrders(user!.id);
      setAcceptedRequests(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error loading orders:', err);
      toast.error('Không thể tải đơn hàng');
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
      
      toast.success('Đã bắt đầu công việc!');
      setShowConfirmStart(null);
      setSimulationError(null);
      
      setTimeout(() => {
        navigate('/technician/don-hang/dang-thuc-hien');
      }, 800);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Không thể bắt đầu đơn hàng';
      setSimulationError(errorMsg);
      console.error('Start order error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDemoStart = () => {
    toast.success('Chế độ Demo: Đang chuyển hướng...');
    setShowConfirmStart(null);
    setSimulationError(null);
    setTimeout(() => {
      navigate('/technician/don-hang/dang-thuc-hien');
    }, 500);
  };

  const handleCancelOrder = async () => {
    if (!showCancelModal || !user?.id) return;
    if (!cancelReason.trim()) {
      toast.error('Vui lòng nhập lý do!');
      return;
    }

    setActionLoading(true);
    try {
      await technicianOrderService.rejectOrder({ 
        orderId: showCancelModal, 
        technicianId: user.id 
      });
      toast.success('Đã hủy đơn hàng');
      setAcceptedRequests(prev => prev.filter(req => req.orderId !== showCancelModal));
      setShowCancelModal(null);
    } catch (err: any) {
      toast.error('Lỗi khi hủy đơn');
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
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500/50 mt-6">Đang tải lịch trình...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-6 sm:px-10 py-10 animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* Top Header & Breadcrumbs */}
      <div className="mb-12">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">
          <span>CÔNG VIỆC</span>
          <ChevronRight size={10} className="text-slate-700" />
          <span className="text-indigo-400">ĐÃ TIẾP NHẬN</span>
        </div>
        <h1 className="text-5xl font-black text-white tracking-tighter leading-tight">Lịch trình công việc</h1>
        <p className="text-slate-500 font-bold uppercase text-[12px] tracking-[0.2em] mt-2 italic">Quản lý hiệu quả các đơn hàng đã xác nhận</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12 items-start">
        {/* Left Column: Accepted Orders List */}
        <div className="space-y-8">
          {acceptedRequests.length === 0 ? (
            <div className="rounded-[40px] border border-dashed border-slate-700/60 bg-[#0f172a]/40 backdrop-blur-3xl p-16 text-center shadow-2xl relative w-full mx-auto overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
               <div className="relative z-10">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white/5 border border-white/10 shadow-inner mb-6 text-indigo-400">
                  <Clock size={40} className="opacity-50" />
                </div>
                <h2 className="text-2xl font-black text-white mb-3 tracking-tighter uppercase">Chưa có công việc nào</h2>
                <p className="text-slate-500 mb-8 max-w-sm mx-auto text-sm font-medium">Mọi yêu cầu bạn đã tiếp nhận sẽ hiển thị chi tiết tại đây để sẵn sàng triển khai.</p>
                <Link 
                  to="/technician/don-hang/dang-cho"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-900/40 hover:scale-105 active:scale-95 transition-all"
                >
                  Tìm việc mới ngay
                  <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          ) : (
            acceptedRequests.map((req, idx) => (
              <motion.div 
                key={req.orderId}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.07, duration: 0.35 }}
                className="relative overflow-hidden rounded-[40px] border border-white/5 bg-[#0f172a]/60 backdrop-blur-3xl shadow-2xl transition-all hover:border-white/10 group"
              >
                {/* Left Accent Bar */}
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-indigo-500 to-blue-600 opacity-80 group-hover:opacity-100 transition-opacity" />

                <div className="p-8 lg:p-10 space-y-10">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="space-y-4 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-indigo-400 border border-indigo-500/20 shadow-inner">
                          {req.serviceName}
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-300 border border-white/10">
                          ID: #{req.orderId.slice(-6).toUpperCase()}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-4xl font-black text-white tracking-tighter mb-4">{req.title}</h3>
                        <p className="text-sm leading-relaxed text-slate-400 max-w-2xl font-medium line-clamp-2">
                          {req.description || 'Khách hàng yêu cầu hỗ trợ kỹ thuật tận nơi. Vui lòng liên hệ trước khi di chuyển.'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">KHOẢNG CÁCH</p>
                      <p className="text-3xl font-black text-white tracking-tighter leading-none mb-1">2.1</p>
                      <p className="text-lg font-black text-white tracking-tighter opacity-80 uppercase leading-none">km</p>
                    </div>
                  </div>

                  {/* Information Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 border-t border-white/5">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-slate-500">
                        <User size={16} />
                        <p className="text-[10px] font-black uppercase tracking-widest">KHÁCH HÀNG</p>
                      </div>
                      <p className="text-xl font-bold text-white tracking-tight leading-tight">{req.customerName}</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-slate-500">
                        <Clock size={16} />
                        <p className="text-[10px] font-black uppercase tracking-widest">TRẠNG THÁI</p>
                      </div>
                      <p className="text-xl font-bold text-emerald-500 tracking-tight leading-tight">Đã xác nhận</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-slate-500">
                        <MapPin size={16} />
                        <p className="text-[10px] font-black uppercase tracking-widest">KHU VỰC</p>
                      </div>
                      <p className="text-xl font-bold text-white tracking-tight leading-tight truncate">Quận 1, TP.HCM</p>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-10">
                    <div className="flex items-center gap-8">
                       <div className="flex items-center gap-3 text-slate-500">
                          <Clock size={16} className="opacity-40" />
                          <div className="text-left">
                             <p className="text-[9px] font-black uppercase tracking-widest leading-none mb-1">XÁC NHẬN LÚC</p>
                             <p className="text-[13px] font-black text-slate-300 leading-none">{new Date(req.orderDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                       </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <button 
                        onClick={() => setSelectedReq(req)}
                        className="w-14 h-14 flex items-center justify-center rounded-full bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all uppercase text-[9px] font-black shrink-0"
                      >
                        CHI TIẾT
                      </button>
                      <button 
                        onClick={() => setShowConfirmStart(req.orderId)}
                        className="flex-1 sm:min-w-[220px] h-14 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-full font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-900/30 transition-all flex items-center justify-center gap-3 transform hover:scale-[1.02] active:scale-[0.98]"
                      >
                        Bắt đầu ngay
                        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                          <Play size={10} className="fill-white" />
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Right Column: Sidebar Widgets */}
        <div className="space-y-8 sticky top-10">
          {/* Widget 1: Status Stat */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0f172a]/60 backdrop-blur-3xl rounded-[32px] border border-white/5 p-6 shadow-2xl">
               <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">ĐÃ TIẾP NHẬN</p>
               <p className="text-3xl font-black text-white tracking-tighter">{acceptedRequests.length}</p>
            </div>
            <div className="bg-[#0f172a]/60 backdrop-blur-3xl rounded-[32px] border border-white/5 p-6 shadow-2xl translate-z-0">
               <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">HIỆU NĂNG</p>
               <p className="text-lg font-black text-amber-500 uppercase tracking-tighter">Ổn định</p>
            </div>
          </div>

          {/* Widget 2: Map Simulation */}
          <div className="bg-[#0f172a]/60 backdrop-blur-3xl rounded-[32px] border border-white/5 p-6 shadow-2xl space-y-4 overflow-hidden relative group">
             <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
             <p className="text-[11px] font-black uppercase tracking-widest text-slate-300 relative z-10">KHU VỰC TRIỂN KHAI</p>
             <div className="h-64 rounded-[28px] bg-slate-950 overflow-hidden relative border border-white/5 z-10">
                <img 
                  src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=2068&auto=format&fit=crop" 
                  alt="Map Placeholder" 
                  className="w-full h-full object-cover opacity-30 grayscale"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="relative">
                      <div className="w-12 h-12 bg-indigo-500/20 rounded-full animate-ping" />
                      <div className="absolute inset-0 w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center border-2 border-white/10 shadow-2xl">
                         <MapPin size={22} className="text-white fill-indigo-500/20" />
                      </div>
                   </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4 bg-black/40 backdrop-blur-md p-3 rounded-2xl border border-white/5 text-center">
                   <p className="text-[10px] text-white font-black uppercase tracking-widest">Quận 1, TP. Hồ Chí Minh</p>
                </div>
             </div>
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center italic relative z-10">Tọa độ làm việc tập trung nhất</p>
          </div>

          {/* Widget 3: Operational Metrics */}
          <div className="bg-[#0f172a]/60 backdrop-blur-3xl rounded-[32px] border border-white/5 p-8 shadow-2xl space-y-8">
             <p className="text-[11px] font-black uppercase tracking-widest text-slate-300">THÔNG TIN VẬN HÀNH</p>
             <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                  <div>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Mật độ khu vực</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Vùng an toàn</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <div>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Thời gian đón đơn</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">~ 12 phút / đơn</p>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>

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
              className="relative w-full max-w-2xl bg-[#0f172a] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl"
            >
              <div className="p-10 space-y-10">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-3xl font-black text-white tracking-tight uppercase leading-none mb-3">{selectedReq.title}</h2>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Chi tiết lịch trình cụ thể</p>
                  </div>
                  <button onClick={() => setSelectedReq(null)} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5">
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-4">Khách hàng</p>
                      <p className="text-xl font-bold text-white mb-2">{selectedReq.customerName}</p>
                      <a href={`tel:${selectedReq.customerPhone}`} className="text-emerald-400 font-black hover:underline">{selectedReq.customerPhone}</a>
                   </div>
                   <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5">
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-4">Địa chỉ</p>
                      <p className="text-sm font-semibold text-slate-300 leading-relaxed italic line-clamp-3">{selectedReq.address}</p>
                   </div>
                </div>

                <div className="flex gap-4">
                   <button 
                    onClick={() => {
                       const id = selectedReq.orderId;
                       setSelectedReq(null);
                       setShowConfirmStart(id);
                    }}
                    className="flex-1 h-16 bg-white text-black font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
                   >
                     Khởi động tác vụ
                   </button>
                   <button 
                    onClick={() => {
                        const id = selectedReq.orderId;
                        setSelectedReq(null);
                        setShowCancelModal(id);
                    }}
                    className="px-8 h-16 bg-rose-600/10 text-rose-500 font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-rose-600/20 transition-all"
                   >
                     Hủy đơn
                   </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Start Task Modal */}
      <AnimatePresence>
        {showConfirmStart && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !actionLoading && setShowConfirmStart(null)} className="absolute inset-0 bg-[#020617]/98 backdrop-blur-2xl" />
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-sm bg-[#0f172a] border border-white/10 rounded-[2.5rem] p-10 text-center shadow-2xl">
                <div className={cn(
                  "w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 border-2 shadow-inner",
                  simulationError ? "bg-amber-500/10 border-amber-500/20" : "bg-emerald-500/10 border-emerald-500/20"
                )}>
                  {simulationError ? (
                    <AlertCircle size={32} className="text-amber-400" />
                  ) : (
                    <Play size={32} className="text-emerald-400 fill-emerald-400/20 ml-1" />
                  )}
                </div>
                <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">
                  {simulationError ? "Backend chặn đơn mới" : "Kích hoạt tác vụ?"}
                </h3>
                <p className="text-sm text-slate-400 mb-10 leading-relaxed font-medium">
                  {simulationError 
                   ? `Lỗi: ${simulationError}. Bạn có muốn tiếp tục ở chế độ Demo để kiểm thử giao diện?` 
                   : "Bắt đầu di chuyển và thực hiện công việc này."}
                </p>
                
                <div className="flex flex-col gap-3">
                   <button 
                     onClick={handleConfirmStart} 
                     disabled={actionLoading} 
                     className={cn(
                       "w-full h-16 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl transition-all",
                       simulationError 
                         ? "bg-slate-800 text-slate-400 border border-white/5" 
                         : "bg-emerald-600 text-white shadow-emerald-900/40 hover:scale-105"
                     )}
                   >
                     {actionLoading ? <Loader2 className="animate-spin inline" /> : (simulationError ? 'Thử lại kết nối API' : 'Xác nhận ngay')}
                   </button>

                   {(simulationError || actionLoading) && (
                     <button 
                       onClick={handleDemoStart}
                       className="w-full h-16 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-900/40 hover:scale-105 transition-all"
                     >
                       Bắt đầu (Chế độ Demo)
                     </button>
                   )}
                   
                   {simulationError && (
                     <button 
                       onClick={() => { setShowConfirmStart(null); setSimulationError(null); }}
                       className="w-full py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
                     >
                       Hủy bỏ
                     </button>
                   )}
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancel Task Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !actionLoading && setShowCancelModal(null)} className="absolute inset-0 bg-[#020617]/98 backdrop-blur-2xl" />
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-md bg-[#0f172a] border border-white/10 rounded-[2.5rem] p-10 text-center shadow-2xl">
                <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-rose-500/20">
                  <X size={32} className="text-rose-400" />
                </div>
                <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">Xác nhận hủy đơn</h3>
                <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Nhập lý do chi tiết..." className="w-full bg-slate-950 border border-white/5 rounded-2xl p-6 text-white text-sm outline-none focus:border-rose-500/30 mb-8 h-32" />
                <button onClick={handleCancelOrder} disabled={actionLoading} className="w-full h-16 bg-rose-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-rose-950/40 transition-all">
                  {actionLoading ? <Loader2 className="animate-spin inline" /> : 'Đồng ý hủy đơn'}
                </button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
