import { useState, useEffect } from 'react';
import { 
  MapPin, Clock, DollarSign, Star, Filter, 
  CheckCircle, X, Search, Briefcase, AlertCircle, 
  Eye, Play, Phone, FileText, User, Hash, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '@/store/authStore';
import technicianOrderService from '@/services/technicianOrderService';
import technicianService from '@/services/technicianService';
import { ViewOrderDTO } from '@/types/order';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

export function NewRequests() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<ViewOrderDTO[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadRequests();
    }
  }, [user?.id]);

  const loadRequests = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const [pendingOrders, dashboardSummary] = await Promise.all([
        technicianOrderService.getConfirmingOrders(user.id),
        technicianService.getDashboardSummary(user.id).catch(() => null)
      ]);

      // Sắp xếp đơn hàng: Cũ nhất lên trên cùng (từ trước đến sau)
      const sortedData = [...pendingOrders].sort((a, b) => 
        new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime()
      );
      
      setRequests(sortedData);
      setSummary(dashboardSummary);
    } catch (err) {
      console.error('Error loading requests:', err);
      toast.error('Không thể tải danh sách yêu cầu mới');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (orderId: string) => {
    if (!user?.id) return;
    try {
      await technicianOrderService.confirmOrder({ orderId, technicianId: user.id });
      toast.success('Đã chấp nhận đơn hàng!');
      setTimeout(() => {
        navigate('/technician/don-hang/da-tiep-nhan');
      }, 500);
    } catch (err: any) {
      toast.error('Lỗi khi chấp nhận đơn hàng');
    }
  };

  const handleReject = async (orderId: string) => {
    if (!user?.id) return;
    try {
      await technicianOrderService.rejectOrder({ orderId, technicianId: user.id });
      toast.success('Đã từ chối đơn hàng');
      loadRequests();
    } catch (err) {
      toast.error('Lỗi khi từ chối đơn hàng');
    }
  };

  if (loading) {
    return (
      <div className="flex bg-[#020617] items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 bg-indigo-500/10 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-20 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Top Header Section */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-1 bg-indigo-600 rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Hệ thống tiếp nhận</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">Yêu cầu mới</h1>
          <p className="text-slate-400 text-sm font-medium">Hôm nay có <span className="text-indigo-400 font-bold">{requests.length}</span> yêu cầu đang chờ bạn xử lý</p>
        </motion.div>

        {/* Stats Grid - Premium Boxed Style */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          {/* Stat 1: Yêu cầu mới */}
          <motion.div variants={itemVariants} className="bg-[#0f172a]/80 backdrop-blur-xl border border-white/5 rounded-[24px] p-6 shadow-xl relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                   Yêu cầu mới
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white tracking-tighter">{requests.length}</span>
                  <span className="text-[11px] text-indigo-400/70 font-bold">Chờ xử lý</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400 shadow-inner">
                 <FileText size={24} />
              </div>
            </div>
            <div className="mt-4">
               <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 w-[60%] rounded-full shadow-[0_0_10px_rgba(99,102,241,0.4)]" />
               </div>
               <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider italic">Sẵn sàng tiếp nhận</p>
            </div>
          </motion.div>

          {/* Stat 2: Đã hoàn thành */}
          <motion.div variants={itemVariants} className="bg-[#0f172a]/80 backdrop-blur-xl border border-white/5 rounded-[24px] p-6 shadow-xl relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                   Đã hoàn thành
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white tracking-tighter">{summary?.completedOrders || 0}</span>
                  <span className="text-[11px] text-emerald-500/70 font-bold uppercase">Success rate</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400 shadow-inner">
                 <CheckCircle size={24} />
              </div>
            </div>
            <div className="mt-4">
               <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[80%] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
               </div>
               <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider italic">Hiệu suất công việc</p>
            </div>
          </motion.div>

          {/* Stat 3: Đang xử lý */}
          <motion.div variants={itemVariants} className="bg-[#0f172a]/80 backdrop-blur-xl border border-white/5 rounded-[24px] p-6 shadow-xl relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                   Đang xử lý
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white tracking-tighter">{summary?.pendingOrders || 0}</span>
                  <span className="text-[11px] text-amber-500/70 font-bold uppercase">On schedule</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-400 shadow-inner">
                 <Briefcase size={24} />
              </div>
            </div>
            <div className="mt-4">
               <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 w-[45%] rounded-full shadow-[0_0_10px_rgba(245,158,11,0.4)]" />
               </div>
               <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider italic">Quản lý định kỳ</p>
            </div>
          </motion.div>

          {/* Stat 4: Đánh giá */}
          <motion.div variants={itemVariants} className="bg-[#0f172a]/80 backdrop-blur-xl border border-white/5 rounded-[24px] p-6 shadow-xl relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                   Đánh giá TB
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white tracking-tighter">{summary?.averageRating?.toFixed(1) || '5.0'}</span>
                  <span className="text-[11px] text-indigo-400/70 font-bold uppercase">Rating score</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400 shadow-inner">
                 <Star size={24} />
              </div>
            </div>
            <div className="mt-4">
               <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 w-[95%] rounded-full shadow-[0_0_10px_rgba(99,102,241,0.4)]" />
               </div>
               <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider italic">Uy tín kỹ thuật viên</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Queue Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-[22px] font-black text-white tracking-tight leading-none mb-1.5">Danh sách yêu cầu</h2>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Quản lý các yêu cầu dịch vụ mới theo thời gian thực.</p>
          </div>
          <button 
            onClick={loadRequests}
            className="group flex items-center gap-2 px-6 py-2.5 bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 hover:border-indigo-500 rounded-xl transition-all duration-300 shadow-lg active:scale-95"
          >
            <div className="relative">
              <Clock size={16} className="text-indigo-400 group-hover:text-white transition-colors" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full border-2 border-[#020617] animate-pulse" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest text-indigo-400 group-hover:text-white transition-colors">Cập nhật đơn mới</span>
          </button>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          <AnimatePresence mode='popLayout'>
            {requests.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#0f172a]/50 border border-dashed border-white/10 rounded-[32px] p-20 flex flex-col items-center justify-center text-center backdrop-blur-sm"
              >
                <div className="w-20 h-20 bg-indigo-500/10 rounded-[24px] flex items-center justify-center border border-indigo-500/20 text-indigo-400 mb-6 shadow-inner">
                  <AlertCircle size={40} />
                </div>
                <h3 className="text-xl font-black text-white mb-2">Chưa có yêu cầu nào</h3>
                <p className="text-slate-500 max-w-sm font-medium text-sm">Hãy nghỉ ngơi một lát hoặc kiểm tra lại đường truyền của bạn. Chúng tôi sẽ thông báo khi có việc mới.</p>
              </motion.div>
            ) : (
              requests.map((request, idx) => (
                <motion.div
                  key={request.orderId}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="group relative bg-[#0f172a]/80 backdrop-blur-xl border border-white/5 rounded-[24px] p-5 sm:p-6 transition-all hover:bg-[#111c33] hover:border-indigo-500/30 hover:shadow-2xl shadow-xl flex flex-col md:flex-row gap-6 items-stretch overflow-hidden"
                >
                  {/* Left Accent Bar */}
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-600 shadow-[2px_0_10px_rgba(79,70,229,0.4)] opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Thumbnail */}
                  <div className="w-full md:w-[180px] h-[140px] rounded-[18px] overflow-hidden relative shrink-0 border border-white/5 shadow-inner">
                    <img 
                      src="https://images.unsplash.com/photo-1581094288338-2314dddb7903?q=80&w=400&auto=format&fit=crop" 
                      alt={request.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg text-[8px] font-black text-white/70 border border-white/5 uppercase tracking-widest">
                       Issue Detail
                    </div>
                  </div>

                  {/* Info Middle */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                         <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,1)]" />
                         <h3 className="text-lg font-black text-white tracking-tight uppercase group-hover:text-indigo-400 transition-colors truncate">{request.title}</h3>
                      </div>
                      <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                        <Hash size={12} className="text-slate-500" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ID: #SR-{request.orderId.slice(-4).toUpperCase()}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 shrink-0 border border-white/5">
                          <User size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] leading-tight">Khách hàng</p>
                          <p className="text-[13px] font-black text-slate-200 truncate">{request.customerName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 shrink-0 border border-white/5">
                          <Phone size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] leading-tight">Liên hệ</p>
                          <p className="text-[13px] font-bold text-slate-500 italic">09xxx... (Hiện khi nhận)</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 sm:col-span-2">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 shrink-0 border border-white/5">
                          <MapPin size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] leading-tight">Địa chỉ</p>
                          <p className="text-[13px] font-bold text-slate-300 truncate">{request.address || 'Quận 1, Hồ Chí Minh'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto flex items-center gap-4">
                       <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/5 rounded-lg border border-indigo-500/10 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                         <Clock size={14} className="text-indigo-500" />
                         <span>Đã gửi: {Math.floor(Math.random() * 30) + 5} phút trước</span>
                       </div>
                    </div>
                  </div>

                  {/* Actions Right */}
                  <div className="flex flex-row md:flex-col justify-end gap-3 mt-4 md:mt-0 min-w-[140px]">
                    <button 
                      onClick={() => handleReject(request.orderId)}
                      className="flex-1 md:flex-none py-3 px-6 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-400 bg-white/5 border border-white/5 hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30 transition-all active:scale-95"
                    >
                      Từ chối
                    </button>
                    <button 
                      onClick={() => handleAccept(request.orderId)}
                      className="flex-1 md:flex-none py-3 px-6 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white bg-indigo-600 shadow-[0_4px_15px_rgba(79,70,229,0.3)] hover:bg-indigo-500 hover:shadow-[0_4px_20px_rgba(79,70,229,0.5)] transform hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      Nhận việc
                      <ChevronRight size={14} />
                    </button>
                  </div>

                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
