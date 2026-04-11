import { useState, useEffect } from 'react';
import { MapPin, Clock, Phone, MessageSquare, CheckCircle, AlertCircle, Briefcase, Star, Map, User, Eye, Play } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import technicianOrderService from '@/services/technicianOrderService';
import { ViewOrderDTO } from '@/types/order';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export function InProgress() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [job, setJob] = useState<ViewOrderDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedToday, setCompletedToday] = useState<ViewOrderDTO[]>([]);

  useEffect(() => {
    if (user?.id) {
      loadInProgress();
      loadHistory();
    }
  }, [user?.id]);

  const loadInProgress = async () => {
    try {
      setLoading(true);
      const data = await technicianOrderService.getInProgressOrder(user!.id);
      setJob(data);
    } catch (err) {
      console.error('Error loading in-progress job:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await technicianOrderService.getHistoryOrders(user!.id);
      
      // MOCK: Lấy thêm dữ liệu lưu tạm ở localStorage
      const mockStr = localStorage.getItem('mockCompletedOrders');
      const mockOrders = mockStr ? JSON.parse(mockStr) : [];
      
      // Gộp lại (tránh trùng)
      const allOrders = [...mockOrders, ...data].filter((v, i, a) => a.findIndex(t => (t.orderId === v.orderId)) === i);

      // Filter for today only
      const today = new Date().toDateString();
      const filtered = allOrders.filter(o => new Date(o.orderDate).toDateString() === today);
      setCompletedToday(filtered);
    } catch (err) {
      console.error('Error loading history:', err);
    }
  };

  const handleComplete = async () => {
    if (!job) return;
    try {
      // Giả lập API completeOrder vì BE chưa hỗ trợ
      try {
        await technicianOrderService.completeOrder(job.orderId);
      } catch(e) {
        console.warn('Ignored purely for demo purposes:', e);
      }
      
      toast.success('Chúc mừng! Bạn đã hoàn thành công việc 🎉');
      
      // MOCK: Lưu vào localStorage để các trang khác (Lịch sử) nhận diện
      const mockStr = localStorage.getItem('mockCompletedOrders');
      const mockOrders = mockStr ? JSON.parse(mockStr) : [];
      const completedJob = Array.isArray(job) ? job[0] : job;
      
      // Thêm flag status để HistoryPage dùng
      const newMockJob = { ...completedJob, status: 'Completed' };
      localStorage.setItem('mockCompletedOrders', JSON.stringify([newMockJob, ...mockOrders]));

      setJob(null);
      loadHistory();
    } catch (err) {
      toast.error('Lỗi khi hoàn thành công việc');
    }
  };

  if (loading && !job) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold uppercase tracking-widest animate-pulse">Đang đồng bộ dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Công Việc Hiện Tại</h1>
        <p className="text-slate-500 mt-1 font-medium">Báo cáo tiến độ và hoàn tất công việc của bạn</p>
      </div>

      <AnimatePresence mode="wait">
        {job ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-6 max-w-4xl"
          >
            {/* Active Job Card */}
            <div className="bg-[#1e293b]/60 border border-emerald-500/30 rounded-3xl overflow-hidden shadow-2xl shadow-emerald-900/10 hover:border-emerald-500/50 transition-all">
              <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-8 items-start">
                {/* 1. Content Section (Bên trái) */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-emerald-500/20 animate-pulse">
                      Đang thực hiện
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-white mb-4 tracking-tight leading-tight">{job.title}</h2>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-slate-400 flex items-center gap-2">
                       <span className="font-bold text-slate-500 min-w-[80px]">Khách hàng:</span> 
                       <span className="text-slate-200 font-bold">{job.customerName}</span>
                    </p>
                    <p className="text-sm text-slate-400 flex items-center gap-2">
                       <span className="font-bold text-slate-500 min-w-[80px]">SĐT:</span> 
                       <a href={`tel:${job.customerPhone}`} className="text-blue-400 font-black tracking-widest hover:underline flex items-center gap-1">
                         {job.customerPhone || 'Chưa có'} 
                         {job.customerPhone && <Phone className="w-3.5 h-3.5 ml-1" />}
                       </a>
                    </p>
                    <p className="text-sm text-slate-400 flex items-start gap-2">
                       <span className="font-bold text-slate-500 min-w-[80px] mt-0.5">Địa chỉ:</span> 
                       <span className="text-slate-300 leading-tight font-medium">
                         {job.address || 'Quận Liên Chiểu, Đà Nẵng'}
                       </span>
                    </p>
                  </div>
                </div>

                {/* 2. Image Section (Bên phải - To rõ) */}
                <div className="w-full sm:w-64 h-64 bg-slate-800 rounded-2xl flex items-center justify-center text-emerald-500 shrink-0 border border-emerald-500/10 overflow-hidden relative group shadow-2xl">
                  <img 
                    src="https://images.unsplash.com/photo-1621905235858-a88a8563f82e?q=80&w=2070&auto=format&fit=crop" 
                    alt="Sự cố" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 text-white">
                       <Eye size={32} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress & Description */}
              <div className="px-6 sm:px-8 pb-6 space-y-6">


                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800/50">
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> Ghi chú từ khách hàng
                  </p>
                  <p className="text-sm text-slate-300 leading-relaxed italic">
                    "Máy lạnh gặp sự cố không làm lạnh, có tiếng kêu lạ khi khởi động. Khách hàng mong muốn xử lý sớm nhất có thể."
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 sm:p-8 bg-slate-950/20 border-t border-slate-800/40 flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={handleComplete}
                  className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  <CheckCircle className="w-5 h-5" />
                  Hoàn thành công việc
                </button>
                <div className="flex-1 flex gap-3">
                  <button 
                    onClick={() => navigate('/technician/chat')}
                    className="flex-1 py-4 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" /> Liên hệ
                  </button>

                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 bg-slate-900/20 border border-dashed border-slate-800 rounded-[40px] text-slate-500"
          >
            <div className="w-20 h-20 bg-slate-900/50 rounded-full flex items-center justify-center mb-6">
              <Briefcase className="w-10 h-10 opacity-20" />
            </div>
            <p className="text-xl font-bold text-slate-400">Bạn đang không trong công việc nào</p>
            <p className="text-sm mt-2">Hãy vào mục <span className="text-blue-400 font-bold">"Yêu cầu mới"</span> để bắt đầu tăng thu nhập!</p>
            <Link to="/technician/don-hang/dang-cho" className="mt-8 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-blue-600/20">
               Tìm công việc ngay
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recap Section */}
      <section className="max-w-4xl">
        <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tight flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-500" /> Đã hoàn thành hôm nay
        </h3>
        <div className="flex flex-col gap-4">
          {completedToday.length === 0 ? (
            <div className="py-12 bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl text-center text-slate-600 italic text-sm">
              Chưa có công việc nào hoàn thành hôm nay.
            </div>
          ) : (
            completedToday.map((job) => (
              <div key={job.orderId} className="bg-slate-900/30 border border-slate-800/50 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 group hover:border-emerald-500/20 transition-all">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h5 className="font-bold text-slate-100 text-sm truncate">{job.title}</h5>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none mt-1">{job.customerName}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between w-full sm:w-auto sm:text-right gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800/50">
                  <div className="sm:text-right">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Thu nhập</p>
                    <p className="font-black text-emerald-500 text-sm">+{job.price ? new Intl.NumberFormat('vi-VN').format(job.price) : '0'}đ</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter">Thời gian</p>
                    <p className="text-xs text-slate-400 font-bold">Vừa xong</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

// Fixed import for Link
import { Link } from 'react-router-dom';
