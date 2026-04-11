import { useState, useEffect } from 'react';
import { 
  MapPin, Clock, DollarSign, Star, Filter, 
  CheckCircle, X, Search, Briefcase, AlertCircle, 
  Eye, Play, Phone 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '@/store/authStore';
import technicianOrderService from '@/services/technicianOrderService';
import { ViewOrderDTO } from '@/types/order';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

export function NewRequests() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<ViewOrderDTO[]>([]);
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
      const data = await technicianOrderService.getConfirmingOrders(user.id);
      setRequests(data);
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
      console.log('[DEBUG] Confirming order:', orderId, 'with technicianId:', user.id);
      const response = await technicianOrderService.confirmOrder({ orderId, technicianId: user.id });
      console.log('[DEBUG] Confirm response:', response);
      toast.success('Đã chấp nhận đơn hàng!');
      
      // Thêm một khoảng nghỉ ngắn để đảm bảo DB đã cập nhật xong trước khi chuyển trang
      setTimeout(() => {
        navigate('/technician/don-hang/da-tiep-nhan');
      }, 500);
    } catch (err: any) {
      console.error('[DEBUG] Confirm error:', err);
      console.error('[DEBUG] Confirm error response:', err?.response?.data);
      console.error('[DEBUG] Confirm error status:', err?.response?.status);
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
      <div className="flex bg-slate-950 min-h-screen items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 pb-24">
      {/* Header section - Simplified (Removed Filters) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Yêu cầu mới</h1>
          <p className="text-slate-500 font-bold text-sm mt-1 uppercase tracking-widest">Cơ hội tăng thu nhập của bạn</p>
        </div>
      </div>

      {/* Requests List */}
      <div className="flex flex-col gap-6 max-w-5xl">
        {requests.length === 0 ? (
          <div className="py-24 bg-slate-900/20 border border-dashed border-slate-800 rounded-[40px] flex flex-col items-center justify-center text-slate-500">
            <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-xl font-bold italic">Chưa có yêu cầu mới nào lúc này</p>
          </div>
        ) : (
          requests.map((request) => (
            <div key={request.orderId} className="bg-[#1e293b]/50 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all shadow-xl shadow-black/20">
              <div className="p-6 sm:p-8 flex flex-col md:flex-row gap-8 items-start">
                
                {/* 1. Nội dung text (Bên trái) */}
                <div className="flex-1 min-w-0">
                  {/* Tên đơn hàng */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <h3 className="text-2xl font-black text-white tracking-tight leading-none uppercase">{request.title}</h3>
                  </div>
                  
                  {/* Thông tin khách hàng */}
                  <div className="space-y-3">
                    <p className="text-sm text-slate-400 flex items-center gap-3">
                       <span className="font-bold text-slate-600 uppercase tracking-tighter min-w-[100px]">Khách hàng:</span> 
                       <span className="text-slate-200 font-bold">{request.customerName}</span>
                    </p>
                    <p className="text-sm text-slate-400 flex items-center gap-3">
                       <span className="font-bold text-slate-600 uppercase tracking-tighter min-w-[100px]">Số điện thoại:</span> 
                       <span className="text-slate-200">09xxxxxxx (Sẽ hiện khi nhận đơn)</span>
                    </p>
                    <p className="text-sm text-slate-400 flex items-start gap-3">
                       <span className="font-bold text-slate-600 uppercase tracking-tighter min-w-[100px] mt-0.5">Địa chỉ:</span> 
                       <span className="text-slate-300 font-bold italic leading-tight">
                         {request.address || 'Quận 1, Thành phố Hồ Chí Minh'}
                       </span>
                    </p>
                    <div className="pt-4 flex items-center gap-2">
                       <Clock className="w-4 h-4 text-blue-500" />
                       <span className="text-xs font-black text-blue-500/80 uppercase tracking-[0.2em]">
                         {new Date(request.orderDate).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                       </span>
                    </div>
                  </div>
                </div>

                {}
                <div className="w-full md:w-56 h-56 bg-slate-900 rounded-3xl overflow-hidden relative group shadow-2xl shrink-0 border border-white/5">
                   <img 
                    src="https://images.unsplash.com/photo-1581094288338-2314dddb7903?q=80&w=2070&auto=format&fit=crop" 
                    alt="Sự cố" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 text-white shadow-2xl">
                       <Play className="fill-white" size={24} />
                    </div>
                  </div>
                  <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[9px] font-bold text-white border border-white/10 shadow-lg">
                    ẢNH / VIDEO
                  </div>
                </div>
              </div>

              {/* Mô tả sự cố (Bottom section) */}
              <div className="px-6 sm:px-8 pb-4">
                <div className="bg-slate-950/40 border border-slate-800/50 p-5 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5" /> Mô tả sự cố từ khách hàng
                  </p>
                  <p className="text-sm text-slate-300 leading-relaxed italic">
                    "{request.description || 'Khách hàng chưa mô tả chi tiết sự cố.'}"
                  </p>
                </div>
              </div>

              {/* Nút hành động */}
              <div className="p-6 sm:p-8 bg-slate-950/20 border-t border-slate-800/40 flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => handleAccept(request.orderId)}
                  className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  <CheckCircle className="w-5 h-5" />
                  Chấp nhận công việc
                </button>
                <button 
                  onClick={() => handleReject(request.orderId)}
                  className="flex-1 py-4 border border-slate-800 hover:bg-slate-800 text-slate-500 hover:text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-[0.95]"
                >
                  <X className="w-4 h-4" />
                  Từ chối
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
