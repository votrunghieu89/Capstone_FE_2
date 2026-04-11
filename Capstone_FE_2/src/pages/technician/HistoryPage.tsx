import { useState, useEffect } from 'react';
import { 
  Calendar, ChevronDown, Star, Download, CheckCircle2, 
  Briefcase, ThumbsUp, User as UserIcon, Loader2, Clock, Eye, Play, Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/authStore';
import technicianOrderService from '@/services/technicianOrderService';
import technicianService from '@/services/technicianService';
import type { ViewOrderDTO } from '@/types/order';
import type { TechnicianRatingViewDTO, RatingOverviewDTO } from '@/types/technician';

export default function TechHistoryPage() {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'reviews' ? 'reviews' : 'history';
  const [activeTab, setActiveTab] = useState<'history' | 'reviews'>(initialTab);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [historyItems, setHistoryItems] = useState<ViewOrderDTO[]>([]);
  const [ratings, setRatings] = useState<TechnicianRatingViewDTO[]>([]);
  const [ratingOverview, setRatingOverview] = useState<RatingOverviewDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      
      // Load history orders separately to ensure we get them even if ratings fail
      try {
        const history = await technicianOrderService.getHistoryOrders(user.id);
        
        // MOCK: Lấy thêm dữ liệu hoàn thành đơn từ localStorage
        const mockStr = localStorage.getItem('mockCompletedOrders');
        const mockOrders = mockStr ? JSON.parse(mockStr) : [];
        
        // Gộp dữ liệu theo orderId, ưu tiên mock nếu trùng (để lấy trạng thái Completed)
        const combined = [...mockOrders, ...history].filter((v, i, a) => a.findIndex(t => (t.orderId === v.orderId)) === i);
        
        setHistoryItems(combined);
      } catch (err) {
        console.error('Error loading history orders:', err);
        // We only toast error for main history if it's not a 404
        toast.error('Không thể tải danh sách công việc');
      }

      // Load ratings and overview
      try {
        const [reviews, overview] = await Promise.all([
          technicianService.getRatings(user.id),
          technicianService.getRatingOverview(user.id)
        ]);
        setRatings(reviews);
        setRatingOverview(overview);
      } catch (err: any) {
        // If 404, it just means no ratings yet, which is fine
        if (err.response?.status !== 404) {
          console.error('Error loading ratings:', err);
          toast.error('Không thể tải thông tin đánh giá');
        }
      }

    } catch (err: any) {
      console.error('General data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const summaryStats = [
    { 
      label: 'Đơn Hoàn Thành', 
      value: String(historyItems.length), 
      icon: CheckCircle2, 
      color: 'text-blue-400', 
      bg: 'bg-blue-500/10' 
    },
    { 
      label: 'Đánh Giá TB', 
      value: (ratingOverview?.averageRating || 0).toFixed(1), 
      icon: Star, 
      color: 'text-amber-400', 
      bg: 'bg-amber-500/10' 
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-2 md:p-6 space-y-8 pb-20 overflow-x-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight uppercase">Lịch Sử Hoạt Động</h1>
          <p className="text-muted-foreground text-sm mt-1 font-medium text-slate-500 uppercase tracking-widest">Xem lại các cột mốc công việc của bạn</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest border border-white/5 transition-all">
          <Download size={16} />
          Xuất Báo Cáo
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {summaryStats.map((stat, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-[#0f172a]/50 backdrop-blur-md rounded-3xl border border-white/5 p-8 shadow-xl relative overflow-hidden group min-h-[160px] flex flex-col justify-center"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <stat.icon size={84} />
            </div>
            <div className={cn("inline-flex p-4 rounded-2xl mb-4 w-fit", stat.bg)}>
              <stat.icon className={cn("w-6 h-6", stat.color)} />
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
            <p className="text-4xl font-black text-foreground mt-2 tracking-tight">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs Layout */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 w-fit">
            <button 
              onClick={() => setActiveTab('history')}
              className={cn(
                "px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                activeTab === 'history' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-500 hover:text-slate-300"
              )}
            >
              Công việc
            </button>
            <button 
              onClick={() => setActiveTab('reviews')}
              className={cn(
                "px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                activeTab === 'reviews' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-500 hover:text-slate-300"
              )}
            >
              Đánh giá
            </button>
          </div>
        </div>

        {activeTab === 'history' ? (
          <div className="flex flex-col gap-5 max-w-4xl">
            {historyItems.length === 0 ? (
              <div className="py-24 bg-slate-900/20 border border-dashed border-slate-800 rounded-[40px] flex flex-col items-center justify-center text-slate-500">
                <div className="w-16 h-16 bg-slate-900/50 rounded-full flex items-center justify-center mb-6">
                   <Clock className="w-8 h-8 opacity-20" />
                </div>
                <p className="text-xl font-bold text-slate-400 italic">Bạn chưa hoàn thành đơn hàng nào</p>
              </div>
            ) : (
              historyItems.map((item) => (
                <div key={item.orderId} className="bg-[#1e293b]/50 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all shadow-xl shadow-black/20">
                  <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-6">
                    {/* 1. Nội dung text (Bên trái) */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                          Hoàn thành
                        </span>
                        <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest italic">ID: #{item.orderId.substring(0, 5)}</span>
                      </div>
                      <h3 className="text-xl font-extrabold text-white mb-3 truncate tracking-tight">{item.title}</h3>
                      
                      {/* Thông tin khách hàng */}
                      <div className="space-y-1.5">
                        <p className="text-sm text-slate-400 flex items-center gap-2">
                           <span className="font-bold text-slate-500 min-w-[70px]">Khách:</span> 
                           <span className="text-slate-200 font-bold">{item.customerName}</span>
                        </p>
                        <p className="text-sm text-slate-400 flex items-center gap-2">
                           <span className="font-bold text-slate-500 min-w-[70px]">SĐT:</span> 
                           <a href={`tel:${item.customerPhone}`} className="text-blue-400 font-black tracking-widest hover:underline flex items-center gap-1">
                             {item.customerPhone || 'Chưa có'}
                             {item.customerPhone && <Phone size={12} className="ml-1" />}
                           </a>
                        </p>
                        <p className="text-sm text-slate-400 flex items-start gap-2">
                           <span className="font-bold text-slate-500 min-w-[70px] mt-0.5">Địa chỉ:</span> 
                           <span className="text-slate-300 leading-tight font-medium">
                             {item.address || 'Quận Sơn Trà, Đà Nẵng'}
                           </span>
                        </p>
                        <p className="text-[11px] font-black text-slate-500/80 uppercase tracking-[0.2em] pt-2 flex items-center gap-2">
                           <Calendar className="w-3 h-3 text-blue-500" />
                           {new Date(item.orderDate).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>

                    {/* 2. Hình ảnh sự cố (Bên phải) */}
                    <div className="w-full sm:w-24 h-48 sm:h-24 bg-slate-800 rounded-xl flex items-center justify-center text-emerald-500 shrink-0 border border-emerald-500/10 overflow-hidden">
                      <CheckCircle2 className="w-10 h-10 opacity-30" />
                    </div>
                  </div>

                  {/* Phần tóm tắt dịch vụ */}
                  <div className="px-4 sm:px-6 pb-4">
                    <div className="bg-slate-950/40 border border-slate-800/50 p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Dịch vụ đã thực hiện</p>
                        <p className="text-sm text-slate-400 font-bold">{item.serviceName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Trạng thái</p>
                        <p className="text-xs font-black text-emerald-500 uppercase flex items-center gap-1">
                          <CheckCircle2 size={12} /> Thành công
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {ratings.length === 0 && (
              <p className="text-center py-10 text-slate-500 font-medium">Chưa có đánh giá nào từ khách hàng</p>
            )}
            <AnimatePresence mode="popLayout">
              {ratings.map((review, idx) => (
                <motion.div 
                  key={review.ratingId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-[#0f172a]/50 backdrop-blur-md rounded-[32px] border border-white/5 p-8 shadow-xl group hover:border-blue-500/30 transition-all"
                >
                  <div className="flex flex-col md:flex-row justify-between gap-6 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <UserIcon className="w-7 h-7 text-slate-500" />
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-foreground tracking-tight uppercase">{review.customerName}</h4>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1.5">
                          <span>{new Date(review.createdAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-amber-400/10 px-5 py-2.5 rounded-2xl border border-amber-400/20 h-fit">
                      <Star size={20} className="fill-amber-400 text-amber-400" />
                      <span className="text-xl font-black text-amber-500">{review.score}</span>
                    </div>
                  </div>
                  
                  <blockquote className="text-base text-slate-300 leading-relaxed font-medium italic relative pl-4 border-l-2 border-blue-500/20">
                    <span className="text-5xl text-blue-500/10 absolute -top-6 -left-2 font-serif select-none">"</span>
                    {review.feedback || 'Không có bình luận'}
                  </blockquote>

                  <div className="mt-8 pt-6 border-t border-white/5 flex justify-end items-center">
                    <button className="flex items-center gap-2 text-[10px] font-black text-slate-500 hover:text-blue-400 uppercase tracking-widest transition-colors">
                      <ThumbsUp size={14} />
                      Phản hồi hữu ích
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
