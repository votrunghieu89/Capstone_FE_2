import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ImageIcon, FileText, AlertCircle,
  User, Phone, CheckCircle2, MapPin, X,
  BrainCircuit, Clock, Navigation, MessageSquare, Wrench, Play, ZoomIn, Zap
} from 'lucide-react';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { openGoogleMapsRoute, getMapEmbedSrcByAddress } from '@/utils/mapUtils';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

import technicianOrderService from '@/services/technicianOrderService';
import aiService from '@/services/aiService';
import useAuthStore from '@/store/authStore';
import { ViewOrderDetailDTO } from '@/types/order';
import { buildEtaWindowText, getEtaFallbackLabel } from '@/lib/orderEta';

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
  const [completeLoading, setCompleteLoading] = useState(false);
  const [completeSent, setCompleteSent] = useState(false);

  const { location: gpsLocation } = useCurrentLocation();
  const [techLocation, setTechLocation] = useState<{ address: string; cityName: string } | null>(null);
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
    if (id && user?.id) {
      loadOrderDetail();
      loadTechLocation();
    }
  }, [id, user?.id]);

  const loadTechLocation = async () => {
    if (!user?.id) return;
    try {
      const loc = await technicianOrderService.getTechnicianLocation(user.id);
      setTechLocation(loc);
    } catch (err) {
      console.warn('Could not fetch technician location', err);
    }
  };

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

      const pendingItem = pendingList.find((o: any) => o.orderId === id);
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
        orderDate: listItem?.orderDate || detailData.orderDate || detailData.OrderDate || new Date().toISOString(),
        estimatedTime:
          listItem?.estimatedTime ??
          (listItem as any)?.EstimatedTime ??
          detailData.estimatedTime ??
          detailData.EstimatedTime,
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

  const handleCompleteOrder = async () => {
    if (!user?.id || !order?.orderId) return;
    setCompleteLoading(true);
    try {
      await technicianOrderService.completeOrder(order.orderId);
      setCompleteSent(true);
      toast.success('Yêu cầu hoàn tất đã được gửi!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Lỗi xác nhận hoàn thành');
    } finally {
      setCompleteLoading(false);
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
  const createdRaw =
    order.orderDate ||
    (order as any)?.OrderDate ||
    (order as any)?.createdAt ||
    (order as any)?.CreatedAt;
  const etaRaw =
    order.estimatedTime ??
    (order as any)?.EstimatedTime ??
    (order as any)?.eta ??
    (order as any)?.ETA;
  const expectedTime = buildEtaWindowText(etaRaw, createdRaw) || getEtaFallbackLabel(etaRaw);

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

          {/* ── Header ── */}
          <div className="shrink-0 flex items-start gap-4 p-6 border-b border-white/[0.06]">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/[0.06] flex items-center justify-center text-slate-400 hover:text-white transition-all group shrink-0"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-black text-white tracking-tight uppercase mb-1">CHI TIẾT YÊU CẦU KỸ THUẬT</h1>
              <div className="flex items-center gap-2 text-slate-300">
                <User size={14} className="text-slate-400" />
                <span className="text-sm font-semibold">{order.customerName || 'Khách Hàng Test'}</span>
              </div>
            </div>
            {/* Dự kiến hoàn thành — đồng bộ NewRequests */}
            {isCanceled ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-black uppercase tracking-widest shrink-0 bg-rose-500/10 border-rose-500/20 text-rose-400">
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                Đã hủy
              </div>
            ) : (
              <div className="flex items-center gap-2 min-w-0 flex-wrap shrink-0 sm:justify-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 shrink-0">Dự kiến hoàn thành</span>
                <span className="text-[11px] font-bold text-emerald-300/95 tabular-nums">{expectedTime}</span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
            {/* ── Media section: Ảnh / Video ── */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-4 border-b border-white/[0.06] pb-2">
                <div className="flex items-center gap-2">
                  <Wrench size={18} className="text-slate-500" />
                  <span className="text-sm font-black uppercase tracking-widest text-slate-400">MÔ TẢ SỰ CỐ</span>
                </div>
                {hasMedia && (
                  <span className="text-xs font-bold text-slate-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                    {mediaList.length + (order.videoUrl ? 1 : 0)} files
                  </span>
                )}
              </div>

              {hasMedia ? (
                <div className="space-y-4">
                  {/* Cột ẢNH */}
                  {mediaList.length > 0 && (
                    <div className="flex flex-col gap-3">
                      <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <ImageIcon size={14} /> HÌNH ẢNH
                      </p>
                      <div className={`grid gap-4 ${mediaList.length === 1 ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 lg:grid-cols-4'}`}>
                        {mediaList.map((url: string, idx: number) => (
                          <div
                            key={idx}
                            className="relative aspect-square rounded-2xl overflow-hidden bg-slate-900 border-2 border-white/10 hover:border-blue-500/50 group cursor-pointer transition-all shadow-lg"
                            onClick={() => { setLightboxUrl(url); setLightboxType('image'); }}
                          >
                            <img src={url} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" alt={`img-${idx}`} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                              <ZoomIn size={18} className="text-white drop-shadow-md" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cột VIDEO */}
                  {order.videoUrl && (
                    <div className="flex flex-col gap-3 mt-6">
                      <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Play size={14} /> VIDEO
                      </p>
                      <div
                        className="relative rounded-2xl overflow-hidden bg-black border-2 border-white/10 hover:border-blue-500/50 group cursor-pointer max-w-sm shadow-lg transition-all"
                        style={{ aspectRatio: '16/9' }}
                        onClick={() => { setLightboxUrl(order.videoUrl!); setLightboxType('video'); }}
                      >
                        {isYoutubeVideo(order.videoUrl) ? (
                          <div className="w-full h-full relative pointer-events-none">
                            <img
                              src={`https://img.youtube.com/vi/${order.videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/)?.[1]}/hqdefault.jpg`}
                              className="w-full h-full object-cover opacity-80"
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
                            onMouseEnter={(e) => (e.target as HTMLVideoElement).play().catch(() => { })}
                            onMouseLeave={(e) => { const v = e.target as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
                          />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity">
                          <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center">
                            <Play size={24} className="text-white ml-1 fill-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-48 bg-[#0a1120] border border-dashed border-white/[0.08] rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-600">
                  <ImageIcon size={36} className="opacity-30" />
                  <p className="text-xs font-bold uppercase tracking-[0.25em]">CHƯA CÓ HÌNH ẢNH / VIDEO</p>
                </div>
              )}
            </div>

            {/* ── Description ── */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare size={16} className="text-slate-500" />
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">MÔ TẢ CHI TIẾT TỪ KHÁCH</span>
              </div>
              <div className="bg-[#0a1120] border border-white/[0.08] rounded-2xl p-5 shadow-inner">
                {order.title && (
                  <h3 className="text-lg font-black text-white mb-2 uppercase tracking-tight">{order.title}</h3>
                )}
                <p className="text-sm text-slate-400 font-medium leading-relaxed">
                  {order.description || (
                    <span className="italic text-slate-500">Hệ thống đang tiến hành kiểm tra yêu cầu từ khách hàng...</span>
                  )}
                </p>
              </div>

              {aiDiagnosis && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-5 flex gap-4"
                >
                  <BrainCircuit size={20} className="text-indigo-400 shrink-0" />
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-black text-indigo-400 uppercase tracking-widest leading-none">Chẩn đoán từ AI</p>
                    <p className="text-sm text-slate-300 font-medium leading-relaxed">{aiDiagnosis}</p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

        </div>

        {/* ════════════════════════════════════════════════════
            CỘT PHẢI — col-span-4
            Card lớn bo viền, chứa map + widgets + buttons
        ════════════════════════════════════════════════════ */}
        <div className="col-span-4 h-full bg-[#080f1e] border border-white/[0.07] rounded-2xl flex flex-col overflow-hidden relative">

          {/* ── Map: Địa chỉ khách hàng (giống ngoài phần đơn), click → chỉ đường từ thợ đến khách ── */}
          <div
            className="h-[35%] w-full relative cursor-pointer group shrink-0"
            onClick={() => openGoogleMapsRoute(
              techLocation ? `${techLocation.address}, ${techLocation.cityName}` : gpsLocation,
              fullAddress
            )}
            title="Nhấn để mở chỉ đường đến khách hàng"
          >
            <iframe
              key={fullAddress || 'default-map'}
              width="100%"
              height="100%"
              frameBorder="0"
              style={{
                border: 0,
                filter: 'invert(90%) hue-rotate(180deg) brightness(78%) contrast(112%)',
                pointerEvents: 'none',
              }}
              src={getMapEmbedSrcByAddress(fullAddress, 15)}
              allowFullScreen
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-black/25 backdrop-blur-[1px]">
              <div className="px-3 py-1.5 bg-black/80 backdrop-blur-md rounded-lg border border-white/10 flex items-center gap-1.5">
                <Navigation size={11} className="text-indigo-400" />
                <span className="text-[9px] font-black text-white uppercase tracking-widest">Chỉ đường đến khách</span>
              </div>
            </div>
            {/* Fade effect overlay at bottom of map */}
            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#080f1e] to-transparent" />
          </div>

          <div className="flex-1 flex flex-col p-5 gap-4 overflow-y-auto custom-scrollbar relative z-10 -mt-6">
            {/* ── Address Box ── */}
            <div
              className="bg-[#0f1629] border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4 cursor-pointer hover:border-blue-500/30 transition-colors shadow-xl"
              onClick={() => openGoogleMapsRoute(
                techLocation ? `${techLocation.address}, ${techLocation.cityName}` : gpsLocation,
                fullAddress
              )}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin size={16} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">ĐỊA CHỈ</p>
                  <p className="text-sm font-bold text-slate-200 leading-snug">{fullAddress || 'Đang cập nhật'}</p>
                </div>
              </div>
              <div className="w-8 h-8 flex items-center justify-center text-slate-500 shrink-0">
                <Navigation size={18} />
              </div>
            </div>

            {/* ── Service & Contact Row ── */}
            <div className="grid grid-cols-2 gap-4">
              {/* Service */}
              <div className="bg-[#0f1629] border border-white/10 rounded-2xl p-4 flex flex-col justify-center shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Wrench size={14} className="text-indigo-400" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">DỊCH VỤ</p>
                </div>
                <p className="text-sm font-bold text-white line-clamp-2">{order.serviceName || 'Chưa xác định'}</p>
              </div>

              {/* Contact */}
              <div className="bg-[#0f1629] border border-white/10 rounded-2xl p-4 flex flex-col justify-center shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Phone size={14} className="text-[#00c07f]" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">LIÊN HỆ</p>
                </div>
                {isPending ? (
                  <p className="text-[10px] font-semibold text-slate-600 italic leading-tight">Hiển thị sau khi nhận đơn</p>
                ) : order.customerPhone ? (
                  <a href={`tel:${order.customerPhone}`} className="text-base font-black text-[#00c07f] hover:text-[#00a36c] transition-colors">
                    {order.customerPhone}
                  </a>
                ) : (
                  <p className="text-xs font-semibold text-slate-600 italic">Không có SĐT</p>
                )}
              </div>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* ── Action Buttons ── */}
            <div className="mt-4 space-y-3">
              {isCanceled ? (
                <div className="py-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center">
                  <AlertCircle size={20} className="mx-auto text-rose-500 mb-1" />
                  <p className="text-rose-400 font-black uppercase tracking-widest text-[9px]">Yêu cầu đã bị hủy</p>
                </div>
              ) : isPending ? (
                <>
                  <button
                    onClick={handleConfirmOrder}
                    disabled={actionLoading}
                    className="w-full h-14 bg-[#00c07f] hover:bg-[#00a36c] active:scale-[0.98] text-white rounded-xl text-sm font-black uppercase tracking-[0.05em] shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {actionLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                      <>
                        <Zap size={18} className="fill-white" /> BẮT ĐẦU NGAY
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={actionLoading}
                    className="w-full h-12 bg-[#ff5a1f]/10 hover:bg-[#ff5a1f]/20 text-[#ff5a1f] border border-[#ff5a1f]/30 rounded-xl text-sm font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                  >
                    TỪ CHỐI
                  </button>
                </>
              ) : order.status === 'Confirmed' ? (
                <>
                  <button
                    onClick={handleStartWork}
                    disabled={actionLoading}
                    className="w-full h-14 bg-[#00c07f] hover:bg-[#00a36c] active:scale-[0.98] text-white rounded-xl text-sm font-black uppercase tracking-[0.05em] shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {actionLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                      <>
                        <Zap size={18} className="fill-white" /> BẮT ĐẦU NGAY
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)} // Or handle cancel logic if supported
                    disabled={actionLoading}
                    className="w-full h-12 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 rounded-xl text-sm font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                  >
                    HỦY ĐƠN HÀNG
                  </button>
                </>
              ) : order.status === 'In Progress' ? (
                <>
                  <button
                    onClick={handleCompleteOrder}
                    disabled={completeLoading || completeSent}
                    className={`w-full h-14 rounded-xl text-sm font-black uppercase tracking-[0.05em] shadow-lg transition-all flex items-center justify-center gap-2 ${completeSent
                        ? 'bg-slate-700/50 text-slate-400 cursor-not-allowed'
                        : 'bg-[#00c07f] hover:bg-[#00a36c] active:scale-[0.98] text-white shadow-emerald-500/20'
                      }`}
                  >
                    {completeSent ? (
                      <>
                        <div className="w-5 h-5 border-2 border-slate-500/30 border-t-slate-400 rounded-full animate-spin" />
                        Đang chờ...
                      </>
                    ) : completeLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 size={18} /> XÁC NHẬN HOÀN THÀNH
                      </>
                    )}
                  </button>
                  <div className="w-full h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                    <span className="text-sm font-bold uppercase tracking-widest text-indigo-400">ĐANG THỰC HIỆN</span>
                  </div>
                </>
              ) : (
                <div className={`py-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center`}>
                  <CheckCircle2 size={20} className="mx-auto text-emerald-400 mb-1 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <p className="text-emerald-400 font-black uppercase tracking-widest text-[9px]">
                    Đã tiếp nhận yêu cầu
                  </p>
                </div>
              )}
            </div>
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
