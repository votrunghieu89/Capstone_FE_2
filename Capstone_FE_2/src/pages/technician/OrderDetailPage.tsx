import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ImageIcon, FileText, AlertCircle,
  User, Phone, CheckCircle2, MapPin, X,
  BrainCircuit, Clock, Navigation, MessageSquare, Wrench, Play, ZoomIn, Zap
} from 'lucide-react';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { openGoogleMapsRoute } from '@/utils/mapUtils';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

import technicianOrderService from '@/services/technicianOrderService';
import aiService from '@/services/aiService';
import useAuthStore from '@/store/authStore';
import { ViewOrderDetailDTO } from '@/types/order';
import { format } from 'date-fns';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [order, setOrder] = useState<ViewOrderDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiDiagnosis, setAiDiagnosis] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxType, setLightboxType] = useState<'image' | 'video'>('image');

  const { location: gpsLocation } = useCurrentLocation();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const isYoutubeVideo = (url?: string | null) => {
    return url && (url.includes('youtube.com') || url.includes('youtu.be'));
  };

  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return '';
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : url;
  };

  useEffect(() => {
    if (id && user?.id) loadOrderDetail();
  }, [id, user?.id]);

  const loadOrderDetail = async () => {
    if (!user?.id || !id) return;
    try {
      setLoading(true);
      const [resDetail, pendingList, confirmedList] = await Promise.all([
        technicianOrderService.getOrderDetail(id),
        technicianOrderService.getConfirmingOrders(user.id),
        technicianOrderService.getConfirmedOrders(user.id),
      ]);

      const detailData = resDetail?.value || resDetail?.data || resDetail;
      if (!detailData) throw new Error('No data');

      const pendingItem   = pendingList.find((o: any) => o.orderId === id);
      const confirmedItem = confirmedList.find((o: any) => o.orderId === id);
      const listItem = confirmedItem || pendingItem;

      // ⚠️ SĐT chỉ lấy từ confirmedList — pending không được hiển thị
      const phoneFromConfirmed =
        confirmedItem?.phoneNumber ||
        confirmedItem?.customerPhone ||
        (confirmedItem as any)?.phoneNumgber;

      setOrder({
        ...detailData,
        customerName: listItem?.customerName || detailData.customerName,
        customerPhone: phoneFromConfirmed || detailData.phoneNumgber || detailData.phoneNumber || detailData.customerPhone,
        serviceName: listItem?.serviceName || detailData.serviceName,
        cityName: detailData.cityName || detailData.city || '',
        // Đảm bảo ảnh/video mapping đúng casing (BE trả camelCase)
        ImageUrls: detailData.imageUrls || detailData.ImageUrls || [],
        videoUrl: detailData.videoUrl || detailData.VideoUrl || '',
      });

      if (detailData.aiDiagnostic) setAiDiagnosis(detailData.aiDiagnostic);

    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('Không thể tải thông tin đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!user?.id || !order?.orderId) return;
    setActionLoading(true);
    try {
      await technicianOrderService.confirmOrder({ orderId: order.orderId, technicianId: user.id });
      toast.success('Đã tiếp nhận yêu cầu thành công!');
      navigate('/technician/don-hang/da-tiep-nhan');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Lỗi nhận đơn');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartWork = async () => {
    if (!user?.id || !order?.orderId) return;
    setActionLoading(true);
    try {
      await technicianOrderService.startOrder({ orderId: order.orderId, technicianId: user.id });
      toast.success('Đã bắt đầu thực hiện công việc!');
      navigate('/technician/don-hang/dang-thuc-hien');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Lỗi bắt đầu công việc');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectOrder = async () => {
    if (!user?.id || !order?.orderId) return;
    if (!rejectReason.trim()) { toast.error('Vui lòng nhập lý do từ chối!'); return; }
    setActionLoading(true);
    try {
      await technicianOrderService.rejectOrder({ orderId: order.orderId, technicianId: user.id, reason: rejectReason });
      toast.success('Đã từ chối đơn hàng!');
      setShowRejectModal(false);
      navigate('/technician/don-hang/dang-cho');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Lỗi từ chối đơn');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-80px)] bg-[#020617] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 animate-pulse">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex h-[calc(100vh-80px)] bg-[#020617] flex-col items-center justify-center gap-5">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-rose-500">
          <AlertCircle size={40} />
        </div>
        <h2 className="text-xl font-black text-white uppercase tracking-widest">Không tìm thấy yêu cầu</h2>
        <button onClick={() => navigate(-1)} className="px-6 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 font-bold transition-all text-sm">
          Quay lại
        </button>
      </div>
    );
  }

  const handleAIDiagnosis = async () => {
    if (!order?.description) return;
    setIsAnalyzing(true);
    try {
      // Structure a prompt for technical diagnosis
      const prompt = `Bạn là một chuyên gia sửa chữa. Hãy phân tích sự cố sau và đưa ra chẩn đoán sơ bộ cho kỹ thuật viên: "${order.title} - ${order.description}"`;
      const result = await aiService.chat(prompt);
      setAiDiagnosis(result);
      toast.success('AI đã hoàn tất phân tích sự cố!');
    } catch {
      toast.error('AI Assistant hiện không khả dụng. Vui lòng thử lại sau.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const isPending = order.status === 'Pending Confirmation' || order.status === 'Pending';
  const isCanceled = order.status === 'Cancelled' || order.status === 'Canceled';
  const mediaList = order.ImageUrls || (order as any).imageUrls || [];
  const hasMedia = order.videoUrl || mediaList.length > 0;
  
  const addr = order.address || '';
  const city = order.cityName || '';
  const fullAddress = addr + (city && !addr.includes(city) ? `, ${city}` : '');
  const orderIdShort = `#${String(order.orderId || '').slice(0, 8).toUpperCase()}`;

  return (
    <div className="h-[calc(100vh-80px)] bg-[#020617] text-slate-200 overflow-hidden">

      {/* ================================================================
          OUTER GRID: 8 cột trái | 4 cột phải
          Mỗi cột là 1 card bo viền, cùng chiều cao, không scroll
      ================================================================ */}
      <div className="h-full grid grid-cols-12 gap-4 p-4">

        {/* ════════════════════════════════════════════════════
            CỘT TRÁI — col-span-8
            Card lớn bo viền, chứa toàn bộ thông tin đơn
        ════════════════════════════════════════════════════ */}
        <div className="col-span-8 h-full bg-[#080f1e] border border-white/[0.07] rounded-2xl flex flex-col overflow-hidden">

          {/* ── Header: ID + Status ── */}
          <div className="shrink-0 h-20 flex items-center justify-between px-6 border-b border-white/[0.06]">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/[0.06] flex items-center justify-center text-slate-400 hover:text-white transition-all group"
              >
                <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
              </button>
              <div>
                <h1 className="text-xl font-black text-white tracking-tight leading-none">{orderIdShort}</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 mt-1">CHI TIẾT YÊU CẦU KỸ THUẬT</p>
              </div>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-black uppercase tracking-widest ${
              isCanceled ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              : isPending ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isCanceled ? 'bg-rose-500' : isPending ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
              }`} />
              {isCanceled ? 'Đã hủy' : isPending ? 'Đang chờ' : 'Đã tiếp nhận'}
            </div>
          </div>

          {/* ── Customer + Address row ── */}
          <div className="shrink-0 grid grid-cols-2 gap-3 px-5 py-2.5 border-b border-white/[0.06]">
            <div className="h-14 bg-white/[0.03] border border-white/[0.05] rounded-xl px-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/[0.07] flex items-center justify-center shrink-0">
                <User size={14} className="text-slate-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">KHÁCH HÀNG</p>
                <p className="text-sm font-semibold text-white truncate">{order.customerName || 'Ẩn danh'}</p>
              </div>
            </div>
            <div
              className="h-14 bg-white/[0.03] border border-white/[0.05] hover:border-blue-500/20 rounded-xl px-3 flex items-center gap-2.5 cursor-pointer group transition-colors"
              onClick={() => openGoogleMapsRoute(gpsLocation, fullAddress)}
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/15 flex items-center justify-center shrink-0">
                <MapPin size={14} className="text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">ĐỊA CHỈ</p>
                <p className="text-sm font-semibold text-white line-clamp-1">{fullAddress || 'Không có địa chỉ'}</p>
              </div>
              <Navigation size={12} className="text-slate-600 group-hover:text-blue-400 shrink-0 transition-colors" />
            </div>
          </div>


          {/* ── Media section: Ảnh (trái) | Video (phải) ── */}
          <div className="shrink-0 flex flex-col px-5 pt-4 pb-3">
            <div className="flex items-center gap-2.5 mb-3">
              <BrainCircuit size={18} className="text-indigo-400/60" />
              <span className="text-base font-black uppercase tracking-widest text-slate-400">MÔ TẢ SỰ CỐ</span>
              {hasMedia && (
                <span className="ml-auto text-[8px] font-bold text-slate-600 bg-white/5 px-2 py-0.5 rounded-full">
                  {mediaList.length + (order.videoUrl ? 1 : 0)} files
                </span>
              )}
            </div>

            {hasMedia ? (
              <div className={`grid gap-3 ${order.videoUrl && mediaList.length > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {/* Cột ẢNH */}
                {mediaList.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                      <ImageIcon size={10} /> Hình ảnh ({mediaList.length})
                    </p>
                    <div className={`grid gap-2 ${mediaList.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                      {mediaList.map((url: string, idx: number) => (
                        <div
                          key={idx}
                          className="relative aspect-square rounded-xl overflow-hidden bg-slate-900 border border-white/10 group cursor-pointer"
                          onClick={() => { setLightboxUrl(url); setLightboxType('image'); }}
                        >
                          <img src={url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" alt={`img-${idx}`} />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-2">
                            <ZoomIn size={13} className="text-white" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cột VIDEO */}
                {order.videoUrl && (
                  <div className="flex flex-col gap-2">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                      <Play size={10} /> Video
                    </p>
                    <div
                      className="relative rounded-xl overflow-hidden bg-black border border-white/10 group cursor-pointer"
                      style={{ aspectRatio: '16/9' }}
                      onClick={() => { setLightboxUrl(order.videoUrl!); setLightboxType('video'); }}
                    >
                      {isYoutubeVideo(order.videoUrl) ? (
                        <div className="w-full h-full relative pointer-events-none">
                          <img 
                            src={`https://img.youtube.com/vi/${order.videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/)?.[1]}/hqdefault.jpg`}
                            className="w-full h-full object-cover opacity-70"
                            alt="Youtube Thumbnail"
                          />
                        </div>
                      ) : (
                        <video
                          src={order.videoUrl}
                          className="w-full h-full object-contain"
                          muted
                          playsInline
                          preload="metadata"
                          onMouseEnter={(e) => (e.target as HTMLVideoElement).play().catch(() => {})}
                          onMouseLeave={(e) => { const v = e.target as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
                        />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity">
                        <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center">
                          <Play size={20} className="text-white ml-0.5 fill-white" />
                        </div>
                      </div>
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-amber-500/20 rounded text-[8px] font-black uppercase text-amber-400 border border-amber-500/20">VIDEO</span>
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 rounded text-[8px] font-bold text-slate-300 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                        Bấm để xem
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-48 bg-[#0a1120] border-2 border-dashed border-white/[0.08] rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-600">
                <ImageIcon size={36} className="opacity-30" />
                <p className="text-xs font-bold uppercase tracking-[0.25em]">CHƯA CÓ HÌNH ẢNH / VIDEO</p>
              </div>
            )}
          </div>

          {/* ── Description — compact ── */}
          <div className="shrink-0 border-t border-white/[0.06] px-5 py-3">
            <div className="flex items-center gap-2.5 mb-2">
              <MessageSquare size={20} className="text-slate-500" />
              <span className="text-lg font-black uppercase tracking-widest text-slate-500">MÔ TẢ CHI TIẾT TỪ KHÁCH</span>
            </div>
            <div className="bg-[#0a1120] border border-white/[0.06] rounded-xl overflow-hidden flex">
              <div className="w-1 bg-slate-600 shrink-0" />
              <div className="flex-1 px-4 py-3">
                {order.title && (
                  <h3 className="text-base font-bold text-white mb-1 uppercase tracking-tight">{order.title}</h3>
                )}
                <p className="text-sm text-slate-400 font-medium leading-relaxed line-clamp-2">
                  {order.description || (
                    <span className="italic text-slate-500">Hệ thống đang tiến hành kiểm tra yêu cầu từ khách hàng...</span>
                  )}
                </p>
              </div>
            </div>
            {aiDiagnosis && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4 flex gap-3"
              >
                <BrainCircuit size={18} className="text-indigo-400 shrink-0" />
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">Chẩn đoán từ AI</p>
                  <p className="text-sm text-slate-300 font-medium leading-relaxed">{aiDiagnosis}</p>
                </div>
              </motion.div>
            )}
          </div>

        </div>

        {/* ════════════════════════════════════════════════════
            CỘT PHẢI — col-span-4
            Card lớn bo viền, chứa map + widgets + buttons
        ════════════════════════════════════════════════════ */}
        <div className="col-span-4 h-full bg-[#080f1e] border border-white/[0.07] rounded-2xl flex flex-col overflow-hidden">

          {/* ── Map header ── */}
          <div className="shrink-0 flex items-center gap-2 px-4 h-10 border-b border-white/[0.06]">
            <Clock size={11} className="text-slate-600" />
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-600">YÊU CẦU LÚC</span>
            <span className="ml-auto text-[9px] font-bold text-slate-400 tabular-nums">
              {order.orderDate ? format(new Date(order.orderDate), 'HH:mm · dd/MM') : '—'}
            </span>
          </div>

          {/* ── Map: GPS thợ hiện tại, click → chỉ đường đến khách ── */}
          <div
            className="h-72 shrink-0 relative cursor-pointer group"
            onClick={() => openGoogleMapsRoute(gpsLocation, fullAddress)}
            title="Nhấn để mở chỉ đường đến khách hàng"
          >
            <iframe
              key={gpsLocation ? `gps-${gpsLocation.lat}-${gpsLocation.lng}` : 'default'}
              width="100%"
              height="100%"
              frameBorder="0"
              style={{
                border: 0,
                filter: 'invert(90%) hue-rotate(180deg) brightness(78%) contrast(112%)',
                pointerEvents: 'none',
              }}
              src={
                gpsLocation
                  ? `https://maps.google.com/maps?q=${gpsLocation.lat},${gpsLocation.lng}&z=16&output=embed`
                  : "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d122691.61914371526!2d108.132717088925!3d16.047165882643883!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x314219c7922b6539%3A0x1390977800000000!2zxJDDoCBO4bq5bmcsIFZp4buHdCBOYW0!5e0!3m2!1svi!2s!4v1713170000000!5m2!1svi!2s"
              }
              allowFullScreen
            />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-black/25 backdrop-blur-[1px]">
              <div className="px-3 py-1.5 bg-black/80 backdrop-blur-md rounded-lg border border-white/10 flex items-center gap-1.5">
                <Navigation size={11} className="text-indigo-400" />
                <span className="text-[9px] font-black text-white uppercase tracking-widest">Mở chỉ đường</span>
              </div>
            </div>
          </div>

          {/* ── Address strip ── */}
          <div className="shrink-0 flex items-center gap-2.5 px-4 py-3 border-t border-white/[0.06]">
            <div className="w-0.5 h-7 rounded-full bg-indigo-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-600 mb-0.5">ĐỊA CHỈ</p>
              <p className="text-base font-bold text-slate-200 line-clamp-1">{fullAddress || 'Đang cập nhật'}</p>
            </div>
          </div>

          {/* ── Service + Contact ── */}
          <div className="shrink-0 grid grid-cols-2 gap-2.5 px-4 pb-3">
            {/* Service */}
            <div className="h-16 bg-white/[0.03] border border-white/[0.05] rounded-xl px-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center shrink-0">
                <Wrench size={15} className="text-indigo-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-0.5">DỊCH VỤ</p>
                <p className="text-sm font-semibold text-white truncate">{order.serviceName || 'Chưa xác định'}</p>
              </div>
            </div>

            {/* Contact */}
            <div className={`h-16 bg-white/[0.03] border rounded-xl px-3 flex items-center justify-between gap-2 group transition-colors ${
              !isPending && order.customerPhone
                ? 'border-emerald-500/20 hover:border-emerald-500/40'
                : 'border-white/[0.05]'
            }`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                  !isPending && order.customerPhone
                    ? 'bg-emerald-500/10 border-emerald-500/15'
                    : 'bg-white/5 border-white/[0.07]'
                }`}>
                  <Phone size={15} className={!isPending && order.customerPhone ? 'text-emerald-400' : 'text-slate-500'} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-0.5">LIÊN HỆ</p>
                  {isPending ? (
                    <p className="text-[10px] font-semibold text-slate-600 italic leading-tight">
                      Hiển thị sau khi<br/>chấp nhận đơn
                    </p>
                  ) : order.customerPhone ? (
                    <a
                      href={`tel:${order.customerPhone}`}
                      className="text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors truncate block"
                    >
                      {order.customerPhone}
                    </a>
                  ) : (
                    <p className="text-[10px] font-semibold text-slate-600 italic">Không có SĐT</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Chat Action — h-20 ── */}
          <div className="shrink-0 px-4 pb-3 mt-3">
            <button
              onClick={() => !isPending && navigate('/technician/chat')}
              disabled={isPending}
              className={`h-20 w-full text-left rounded-xl px-4 relative overflow-hidden group transition-all duration-300 ${
                isPending 
                  ? 'bg-slate-900/50 border border-slate-800/50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-sky-900/30 to-blue-900/20 hover:from-sky-800/40 hover:to-blue-800/30 border border-sky-500/20 hover:border-sky-500/35'
              }`}
            >
              <div className="absolute -top-3 -right-3 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                <MessageSquare size={70} className={isPending ? "text-slate-500" : "text-sky-400"} />
              </div>
              <div className="flex items-center gap-3 h-full relative z-10">
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                  isPending 
                    ? 'bg-slate-800/50 border-slate-700/50 text-slate-500'
                    : 'bg-sky-500/15 border-sky-500/25 text-sky-400 group-hover:shadow-[0_0_12px_rgba(14,165,233,0.3)]'
                }`}>
                  <MessageSquare size={16} />
                </div>
                <div>
                  <h3 className={`text-base font-bold ${isPending ? 'text-slate-400' : 'text-sky-300'}`}>NHẮN TIN VỚI KHÁCH HÀNG</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isPending ? 'Chỉ hỗ trợ chat khi bạn đã tiếp nhận đơn' : 'Trao đổi trực tiếp về sự cố'}
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* ── Spacer — pushes actions to bottom ── */}
          <div className="flex-1 min-h-0" />

          {/* ── Action Buttons ── */}
          <div className="shrink-0 px-4 pb-4 space-y-2">
            {isCanceled ? (
              <div className="py-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center">
                <AlertCircle size={20} className="mx-auto text-rose-500 mb-1" />
                <p className="text-rose-400 font-black uppercase tracking-widest text-[9px]">Yêu cầu đã bị hủy</p>
              </div>
            ) : isPending ? (
              <>
                {/* Accept — h-14 (56px) */}
                <button
                  onClick={handleConfirmOrder}
                  disabled={actionLoading}
                  className="w-full h-14 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 rounded-lg text-base font-bold uppercase tracking-[0.1em] shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 group/btn disabled:opacity-50"
                >
                  {actionLoading ? (
                    <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 size={18} className="group-hover/btn:scale-110 transition-transform" />
                      NHẬN NHIỆM VỤ NGAY
                    </>
                  )}
                </button>

                {/* Reject — h-12 (48px) outline */}
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                  className="w-full h-12 bg-transparent hover:bg-rose-500/8 text-slate-400 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 rounded-lg text-sm font-semibold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                >
                  TỪ CHỐI YÊU CẦU
                </button>
              </>
            ) : order.status === 'Confirmed' ? (
              <>
                {/* Start Work — h-14 (56px) */}
                <button
                  onClick={handleStartWork}
                  disabled={actionLoading}
                  className="w-full h-14 bg-[#00c07f] hover:bg-[#00a36c] active:scale-[0.98] text-white rounded-lg text-base font-bold uppercase tracking-[0.1em] shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 group/btn disabled:opacity-50"
                >
                  {actionLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Zap size={18} className="group-hover/btn:scale-110 transition-transform fill-white" />
                      BẮT ĐẦU NGAY
                    </>
                  )}
                </button>

                <div className="py-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                  <CheckCircle2 size={20} className="mx-auto text-emerald-400 mb-1 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <p className="text-emerald-400 font-black uppercase tracking-widest text-[9px]">Đã tiếp nhận yêu cầu</p>
                </div>
              </>
            ) : (
              <div className={`py-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center`}>
                <CheckCircle2 size={20} className="mx-auto text-emerald-400 mb-1 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <p className="text-emerald-400 font-black uppercase tracking-widest text-[9px]">
                  {order.status === 'In Progress' ? 'Đang thực hiện' : 'Đã tiếp nhận yêu cầu'}
                </p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ===== LIGHTBOX (ảnh + video) ===== */}
      <AnimatePresence>
        {lightboxUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setLightboxUrl(null)}
          >
            <button
              className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all z-10"
              onClick={() => setLightboxUrl(null)}
            >
              <X size={18} />
            </button>
            {lightboxType === 'video' ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-4xl"
                onClick={(e) => e.stopPropagation()}
              >
                {isYoutubeVideo(lightboxUrl) ? (
                  <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black">
                    <iframe 
                      src={getYoutubeEmbedUrl(lightboxUrl!)} 
                      title="YouTube video player" 
                      frameBorder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                      className="w-full h-full"
                    ></iframe>
                  </div>
                ) : (
                  <video
                    src={lightboxUrl!}
                    className="w-full max-h-[85vh] rounded-2xl shadow-2xl bg-black"
                    controls
                    autoPlay
                    playsInline
                    style={{ objectFit: 'contain' }}
                  />
                )}
              </motion.div>
            ) : (
              <motion.img
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                src={lightboxUrl}
                className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== REJECT MODAL ===== */}
      <AnimatePresence>
        {showRejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
                    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-0.5">{orderIdShort}</p>
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
                    onClick={handleRejectOrder}
                    disabled={actionLoading || !rejectReason.trim()}
                    className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Xác nhận từ chối'}
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
