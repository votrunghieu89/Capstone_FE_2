import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ImageIcon, FileText, Play, AlertCircle,
  User, Phone, CheckCircle2, MapPin
} from 'lucide-react';
import toast from 'react-hot-toast';
import orderService from '@/services/orderService';
import technicianOrderService from '@/services/technicianOrderService';
import useAuthStore from '@/store/authStore';
import { ViewOrderDetailDTO } from '@/types/order';
import { cn } from '@/lib/utils';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [order, setOrder] = useState<ViewOrderDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && user?.id) {
      loadOrderDetail();
    }
  }, [id, user?.id]);

  const loadOrderDetail = async () => {
    if (!user?.id || !id) return;
    try {
      setLoading(true);
      // Gọi cả 2 API cùng lúc để gộp dữ liệu
      const [resDetail, pendingList] = await Promise.all([
        orderService.getOrderDetail(id),
        technicianOrderService.getConfirmingOrders(user.id)
      ]);

      const detailData = resDetail?.value || resDetail?.data || resDetail;
      const listItem = pendingList.find((o: any) => o.orderId === id);

      // Gộp: Lấy Media từ detailData, lấy Name/Phone từ listItem
      setOrder({
        ...detailData,
        customerName: listItem?.customerName || detailData.customerName,
        customerPhone: listItem?.customerPhone || detailData.customerPhone
      });
    } catch (err) {
      console.error('Error loading order detail:', err);
      toast.error('Không thể tải thông tin đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-[#020617] items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex h-screen bg-[#020617] flex-col items-center justify-center gap-4">
        <AlertCircle size={40} className="text-slate-600" />
        <p className="text-slate-500">Dữ liệu đơn hàng không tìm thấy</p>
        <button onClick={() => navigate(-1)} className="text-blue-500 hover:underline">Quay lại</button>
      </div>
    );
  }

  const hasMedia = order.videoUrl || (order.ImageUrls && order.ImageUrls.length > 0);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Header Đơn giản */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-3xl font-bold">Chi tiết sự cố kỹ thuật</h1>
          </div>

          {/* Nút NHẬN ĐƠN nhỏ gọn ở Header */}
          {order.status === "Pending Confirmation" && (
             <button 
               onClick={async () => {
                 if (!user?.id) return;
                 try {
                   const res = await technicianOrderService.confirmOrder({ 
                     orderId: order.orderId, 
                     technicianId: user.id 
                   });
                   toast.success(res.message || 'Đã nhận đơn hàng!');
                   navigate('/technician/don-hang/da-tiep-nhan');
                 } catch (err) {
                   toast.error('Lỗi nhận đơn');
                 }
               }}
               className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-900/40 transition-all active:scale-95 flex items-center gap-2"
             >
               <CheckCircle2 size={16} />
               Nhận đơn ngay
             </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-8">
          
          {/* PHẦN 1: HÌNH ẢNH / VIDEO SỰ CỐ */}
          <section className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-blue-400 mb-4">
              <ImageIcon size={20} />
              <h2 className="font-bold uppercase tracking-widest text-sm">Hình ảnh / Video minh họa</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hasMedia ? (
                <>
                  {/* Hiển thị Video nếu có */}
                  {order.videoUrl && (
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-white/10 group">
                      <video src={order.videoUrl} controls className="w-full h-full" />
                      <div className="absolute top-3 left-3 px-2 py-1 bg-blue-600 rounded text-[10px] font-bold uppercase">Video sự cố</div>
                    </div>
                  )}

                  {/* Hiển thị danh sách ảnh nếu có */}
                  {(order.ImageUrls || (order as any).imageUrls) && (order.ImageUrls || (order as any).imageUrls).map((url: string, idx: number) => (
                    <div key={idx} className="relative aspect-video rounded-xl overflow-hidden bg-black border border-white/10 group">
                      <img src={url} className="w-full h-full object-contain" alt={`Sự cố ${idx + 1}`} />
                      <div className="absolute top-3 left-3 px-2 py-1 bg-slate-700 rounded text-[10px] font-bold uppercase">Ảnh {idx + 1}</div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="col-span-full py-20 bg-white/5 rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center text-slate-500 gap-2">
                  <ImageIcon size={48} className="opacity-20" />
                  <p className="text-sm">Khách hàng không tải lên hình ảnh hoặc video nào</p>
                </div>
              )}
            </div>
          </section>

          {/* PHẦN 2: MÔ TẢ CHI TIẾT VĂN BẢN */}
          <section className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 mb-4">
              <FileText size={20} />
              <h2 className="font-bold uppercase tracking-widest text-sm">Mô tả chi tiết bằng văn bản</h2>
            </div>
            
            <div className="bg-black/30 p-6 rounded-xl border border-white/5">
              <p className="text-lg text-slate-300 leading-relaxed whitespace-pre-wrap">
                {order.description || "Không có mô tả chi tiết kèm theo đơn hàng này."}
              </p>
            </div>
          </section>

          {/* PHẦN 3: THÔNG TIN CHI TIẾT */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                   <User size={24} />
                </div>
                <div>
                   <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Khách hàng</p>
                   <p className="font-black text-white">{order.customerName || "Đang cập nhật..."}</p>
                </div>
             </div>
             
             <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                   <Phone size={24} />
                </div>
                <div>
                   <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Số điện thoại</p>
                   <p className="font-black text-white">{order.customerPhone || "Liên hệ sau"}</p>
                </div>
             </div>

             <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                   <MapPin size={24} />
                </div>
                <div className="min-w-0">
                   <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Địa chỉ</p>
                   <p className="font-bold text-slate-300 text-sm truncate">{order.address}</p>
                </div>
             </div>
          </section>

          {/* PHẦN 4: VỊ TRÍ TRÊN BẢN ĐỒ */}
          <section className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden">
             <div className="p-6 border-b border-white/5 bg-white/5 flex items-center gap-2">
                <MapPin size={16} className="text-indigo-400" />
                <h2 className="font-bold uppercase tracking-widest text-[10px] text-indigo-400">Khu vực thực hiện (Thành phố Đà Nẵng)</h2>
             </div>
             <div className="aspect-[21/7] w-full bg-slate-800 relative grayscale-[0.8]">
                <iframe 
                  width="100%" 
                  height="100%" 
                  frameBorder="0" 
                  style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%)' }} 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d122691.61914371526!2d108.132717088925!3d16.047165882643883!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x314219c7922b6539%3A0x1390977800000000!2zxJDDoCBO4bq5bmcsIFZp4buHdCBOYW0!5e0!3m2!1svi!2s!4v1713170000000!5m2!1svi!2s" 
                  allowFullScreen
                ></iframe>
             </div>
          </section>
        </div>
      </div>
    </div>
  );
}
