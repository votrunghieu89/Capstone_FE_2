import { useState, useEffect } from 'react';
import {
  ArrowLeft, ImageIcon, FileText, AlertCircle,
  User, Phone, CheckCircle2, MapPin, X,
  BrainCircuit, Clock, Navigation, MessageSquare, Wrench, Play, ZoomIn, Zap, CheckCircle, Loader2
} from 'lucide-react';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { openGoogleMapsRoute, getMapEmbedSrcByAddress } from '@/utils/mapUtils';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';

import technicianOrderService from '@/services/technicianOrderService';
import technicianService from '@/services/technicianService';
import useAuthStore from '@/store/authStore';
import { ViewOrderDTO } from '@/types/order';
import { TechnicianProfileViewDTO } from '@/types/technician';
import { format } from 'date-fns';

export function InProgress() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [job, setJob] = useState<ViewOrderDTO | null>(null);
  const [jobDetail, setJobDetail] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [completeSent, setCompleteSent] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxType, setLightboxType] = useState<'image' | 'video'>('image');
  
  const { location: gpsLocation } = useCurrentLocation();
  const [techLocation, setTechLocation] = useState<{ address: string; cityName: string } | null>(null);

  const isYoutubeVideo = (url?: string | null) => {
    return url && (url.includes('youtube.com') || url.includes('youtu.be'));
  };

  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return '';
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : url;
  };

  useEffect(() => {
    if (user?.id) {
      loadInProgress();
      loadLocation();
    }
  }, [user?.id]);

  const loadLocation = async () => {
    if (!user?.id) return;
    try {
      const loc = await technicianOrderService.getTechnicianLocation(user.id);
      setTechLocation(loc);
    } catch { /* silent */ }
  };

  const loadInProgress = async () => {
    try {
      setLoading(true);
      const data = await technicianOrderService.getInProgressOrder(user!.id);
      if (!data) { setJob(null); return; }

      try {
        const detailRes = await technicianOrderService.getOrderDetail(data.orderId);
        const detailData = detailRes?.value || detailRes?.data || detailRes;
        setJobDetail(detailData);
      } catch { /* silent */ }

      setJob(data);
    } catch { setJob(null); }
    finally { setLoading(false); }
  };

  const handleCompleteOrder = async () => {
    if (!job) return;
    setActionLoading(true);
    try {
      await technicianOrderService.completeOrder(job.orderId);
      setCompleteSent(true);
      toast.success('Yêu cầu hoàn tất! Đang chờ khách hàng xác nhận.');
    } catch (err: any) {
      toast.error('Lỗi khi gửi yêu cầu hoàn thành.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex bg-[#020617] h-[calc(100vh-80px)] items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
      </div>
    );
  }

  // ==========================================
  // VIEW RENDER LOGIC
  // ==========================================

  // Map variables
  const mediaList = jobDetail?.imageUrls || jobDetail?.ImageUrls || [];
  const videoUrl = jobDetail?.videoUrl || jobDetail?.VideoUrl || '';
  const hasMedia = videoUrl || mediaList.length > 0;
  
  const addr = job?.address || '';
  const city = (job as any)?.cityName || jobDetail?.cityName || jobDetail?.city || '';
  const fullAddress = addr + (city && !addr.includes(city) ? `, ${city}` : '');
  const expectedTime = job?.orderDate ? format(new Date(new Date(job.orderDate).getTime() + 60 * 60 * 1000), 'HH:mm') : '--:--';
  const customerPhone = job?.phoneNumber || (job as any)?.customerPhone || jobDetail?.customerPhone;
  const aiDiagnosis = jobDetail?.aiDiagnostic || null;

  return (
    <div className="h-[calc(100vh-80px)] bg-[#020617] text-slate-200 overflow-hidden flex flex-col relative">
      <AnimatePresence mode="wait">
        {job ? (
          <motion.div
            key="active-job"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="h-full grid grid-cols-12 gap-4 p-4"
          >
            {/* ════════════════════════════════════════════════════
                CỘT TRÁI — col-span-8
                Card lớn bo viền, chứa toàn bộ thông tin đơn
            ════════════════════════════════════════════════════ */}
            <div className="col-span-8 h-full bg-[#080f1e] border border-white/[0.07] rounded-2xl flex flex-col overflow-hidden">
              {/* ── Header ── */}
              <div className="shrink-0 flex items-start gap-4 p-6 border-b border-white/[0.06]">
                <div className="flex-1">
                  <h1 className="text-xl font-black text-amber-400 tracking-tight uppercase mb-1">ĐƠN THỰC HIỆN</h1>
                  <div className="flex items-center gap-2 text-slate-300">
                    <User size={14} className="text-slate-400" />
                    <span className="text-sm font-semibold">{job.customerName || 'Khách Hàng'}</span>
                  </div>
                </div>
                {/* Trạng thái đơn góc phải */}
                <div className="flex items-center gap-3 px-4 py-2 rounded-full border border-amber-500/20 bg-[#0f172a] shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">DỰ KIẾN HOÀN THÀNH</span>
                  </div>
                  <span className="text-base font-black text-amber-400">{expectedTime}</span>
                </div>
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
                        {mediaList.length + (videoUrl ? 1 : 0)} files
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
                      {videoUrl && (
                        <div className="flex flex-col gap-3 mt-6">
                          <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Play size={14} /> VIDEO
                          </p>
                          <div
                            className="relative rounded-2xl overflow-hidden bg-black border-2 border-white/10 hover:border-blue-500/50 group cursor-pointer max-w-sm shadow-lg transition-all"
                            style={{ aspectRatio: '16/9' }}
                            onClick={() => { setLightboxUrl(videoUrl); setLightboxType('video'); }}
                          >
                            {isYoutubeVideo(videoUrl) ? (
                              <div className="w-full h-full relative pointer-events-none">
                                <img 
                                  src={`https://img.youtube.com/vi/${videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/)?.[1]}/hqdefault.jpg`}
                                  className="w-full h-full object-cover opacity-80"
                                  alt="Youtube Thumbnail"
                                />
                              </div>
                            ) : (
                              <video
                                src={videoUrl}
                                className="w-full h-full object-contain"
                                muted
                                playsInline
                                preload="metadata"
                                onMouseEnter={(e) => (e.target as HTMLVideoElement).play().catch(() => {})}
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
                    {job.title && (
                      <h3 className="text-lg font-black text-white mb-2 uppercase tracking-tight">{job.title}</h3>
                    )}
                    <p className="text-sm text-slate-400 font-medium leading-relaxed">
                      {job.description || (
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
              {/* ── Map ── */}
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
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-black/25 backdrop-blur-[1px]">
                  <div className="px-3 py-1.5 bg-black/80 backdrop-blur-md rounded-lg border border-white/10 flex items-center gap-1.5">
                    <Navigation size={11} className="text-indigo-400" />
                    <span className="text-[9px] font-black text-white uppercase tracking-widest">Chỉ đường đến khách</span>
                  </div>
                </div>
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
                  <div className="bg-[#0f1629] border border-white/10 rounded-2xl p-4 flex flex-col justify-center shadow-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Wrench size={14} className="text-indigo-400" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">DỊCH VỤ</p>
                    </div>
                    <p className="text-sm font-bold text-white line-clamp-2">{job.serviceName || 'Chưa xác định'}</p>
                  </div>

                  <div className="bg-[#0f1629] border border-white/10 rounded-2xl p-4 flex flex-col justify-center shadow-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Phone size={14} className="text-[#00c07f]" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">LIÊN HỆ</p>
                    </div>
                    {customerPhone ? (
                      <a href={`tel:${customerPhone}`} className="text-base font-black text-[#00c07f] hover:text-[#00a36c] transition-colors">
                        {customerPhone}
                      </a>
                    ) : (
                      <p className="text-xs font-semibold text-slate-600 italic">Không có SĐT</p>
                    )}
                  </div>
                </div>

                <div className="flex-1" />

                {/* ── Action Buttons ── */}
                <div className="mt-4 space-y-3">
                  <button
                    onClick={handleCompleteOrder}
                    disabled={actionLoading || completeSent}
                    className={`w-full h-14 rounded-xl text-sm font-black uppercase tracking-[0.05em] shadow-lg transition-all flex items-center justify-center gap-2 ${
                      actionLoading || completeSent
                        ? 'bg-[#00c07f] opacity-50 text-white cursor-not-allowed'
                        : 'bg-[#00c07f] hover:bg-[#00a36c] active:scale-[0.98] text-white shadow-emerald-500/20'
                    }`}
                  >
                    {actionLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Đang chờ...
                      </>
                    ) : completeSent ? (
                      <>
                        <CheckCircle2 size={18} /> ĐANG CHỜ XÁC NHẬN
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={18} /> XÁC NHẬN HOÀN THÀNH
                      </>
                    )}
                  </button>
                  <div className="w-full h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                    <span className="text-sm font-bold uppercase tracking-widest text-amber-400">ĐANG THỰC HIỆN</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="empty-job"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col min-h-0"
          >
            <div className="flex flex-col items-center justify-center py-32 flex-1">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Hệ thống sẵn sàng</h2>
              <Link
                to="/technician/don-hang/da-tiep-nhan"
                className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl transition-all"
              >
                Đến trang đơn tiếp nhận
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== LIGHTBOX ===== */}
      <AnimatePresence>
        {lightboxUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
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
                    className="w-full max-h-[85vh] rounded-2xl shadow-2xl bg-black mx-auto"
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
    </div>
  );
}