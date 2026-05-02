import { useState, useEffect } from 'react';
import {
  MapPin, Clock, Phone, MessageSquare, CheckCircle,
  Briefcase, User, Navigation, Loader2,
  Activity, Sparkles, Image as ImageIcon,
  CheckCircle2, Play, ZoomIn, X
} from 'lucide-react';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { openGoogleMapsRoute, getMapEmbedSrc, getMapEmbedSrcByAddress } from '@/utils/mapUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '@/store/authStore';
import technicianOrderService from '@/services/technicianOrderService';
import { ViewOrderDTO } from '@/types/order';
import { TechnicianProfileViewDTO } from '@/types/technician';
import technicianService from '@/services/technicianService';
import toast from 'react-hot-toast';

interface PendingReviewOrder {
  orderId: string;
  title: string;
  customerName: string;
  sentAt: string;
}

export function InProgress() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [job, setJob] = useState<ViewOrderDTO | null>(null);
  const [jobDetail, setJobDetail] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [pendingReviews, setPendingReviews] = useState<PendingReviewOrder[]>([]);
  const [acceptedCount, setAcceptedCount] = useState(0);
  const [profile, setProfile] = useState<TechnicianProfileViewDTO | null>(null);
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
      loadPendingReviews();
      loadStats();
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

  const loadStats = async () => {
    if (!user?.id) return;
    try {
      const [accepted, profileData] = await Promise.all([
        technicianOrderService.getConfirmedOrders(user.id),
        technicianService.getProfile(user.id),
      ]);
      setAcceptedCount(Array.isArray(accepted) ? accepted.length : 0);
      setProfile(profileData);
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

      const stored = localStorage.getItem('pendingReviewOrders');
      const pendingList: PendingReviewOrder[] = stored ? JSON.parse(stored) : [];
      const isPending = pendingList.some(p => p.orderId === data.orderId);
      setJob(isPending ? null : data);
    } catch { setJob(null); }
    finally { setLoading(false); }
  };

  const loadPendingReviews = () => {
    const stored = localStorage.getItem('pendingReviewOrders');
    if (stored) {
      try { setPendingReviews(JSON.parse(stored)); } catch { setPendingReviews([]); }
    }
  };

  const handleCompleteOrder = async () => {
    if (!job) return;
    setActionLoading(true);
    const completePromise = technicianOrderService.completeOrder(job.orderId).then(() => {
      const newEntry: PendingReviewOrder = {
        orderId: job.orderId,
        title: job.title,
        customerName: job.customerName,
        sentAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      const updated = [newEntry, ...pendingReviews];
      setPendingReviews(updated);
      localStorage.setItem('pendingReviewOrders', JSON.stringify(updated));
      setJob(null);
      loadStats();
    });

    toast.promise(completePromise, {
      loading: 'Đang gửi xác minh...',
      success: 'Yêu cầu hoàn tất!',
      error: 'Lỗi khi gửi yêu cầu.',
    });

    try { await completePromise; } catch { /* silent */ } finally { setActionLoading(false); }
  };

  const handleDebugConfirm = (orderId: string) => {
    const updated = pendingReviews.filter(p => p.orderId !== orderId);
    setPendingReviews(updated);
    localStorage.setItem('pendingReviewOrders', JSON.stringify(updated));
    toast.success('Ghi nhận thành công!');
    loadStats();
  };

  if (loading) {
    return (
      <div className="flex bg-[#020617] h-[calc(100vh-80px)] items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] bg-[#020617] text-slate-200 overflow-hidden flex flex-col">
      <div className="max-w-[1600px] w-full mx-auto px-4 md:px-8 py-8 flex flex-col lg:flex-row gap-8 flex-1 min-h-0">

        {/* === LEFT CONTENT === */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          <AnimatePresence mode="wait">
            {job ? (
              <motion.div
                key="active-job"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col gap-4 h-full min-h-0"
              >
                {/* ── CARD ── */}
                <div className="bg-[#0d1526]/90 backdrop-blur-[40px] rounded-3xl border border-white/8 shadow-2xl flex flex-col flex-1 min-h-0 overflow-hidden">

                  {/* ── HEADER ── */}
                  <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 shrink-0">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-[52px] h-[52px] rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 ring-2 ring-white/10 shrink-0">
                        <User size={26} className="text-white" />
                      </div>
                      <div>
                        <h1 className="text-lg font-black text-white tracking-tight leading-none mb-1">
                          {job.customerName || 'Khách hàng'}
                        </h1>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          ID: <span className="text-indigo-400">#{job.orderId.slice(-6).toUpperCase()}</span>
                        </span>
                      </div>
                    </div>

                    {/* Dự kiến hoàn thành */}
                    <div className="flex items-center gap-2 bg-amber-500/8 border border-amber-500/20 rounded-2xl px-4 py-2.5">
                      <Clock size={13} className="text-amber-400 shrink-0" />
                      <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-0.5">Dự kiến hoàn thành</p>
                        <p className="text-sm font-black text-amber-400 leading-none">45-60 phút</p>
                      </div>
                    </div>
                  </div>

                  {/* ── BODY ── */}
                  <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-5 custom-scrollbar">

                    {/* Row 1: Hình ảnh (trái) + Vị trí & Dịch vụ (phải) */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

                      {/* Mô tả sự cố (ảnh) – 3 cột */}
                      <div className="lg:col-span-3 bg-[#060e1e] rounded-2xl border border-white/5 p-4 flex flex-col gap-3">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                          <Sparkles size={12} className="text-indigo-400" />
                          Mô tả sự cố
                        </h3>
                        {(() => {
                          const images = jobDetail?.imageUrls || jobDetail?.ImageUrls || [];
                          const video = jobDetail?.videoUrl || jobDetail?.VideoUrl;
                          const hasContent = images.length > 0 || video;
                          
                          return hasContent ? (
                            <div className={`grid gap-3 ${video && images.length > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                              {/* Cột ẢNH */}
                              {images.length > 0 && (
                                <div className="flex flex-col gap-2">
                                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                                    <ImageIcon size={10} /> Hình ảnh ({images.length})
                                  </p>
                                  <div className={`grid gap-2 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                    {images.map((url: string, idx: number) => (
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
                              {video && (
                                <div className="flex flex-col gap-2">
                                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                                    <Play size={10} /> Video
                                  </p>
                                  <div
                                    className="relative rounded-xl overflow-hidden bg-black border border-white/10 group cursor-pointer"
                                    style={{ aspectRatio: '16/9' }}
                                    onClick={() => { setLightboxUrl(video); setLightboxType('video'); }}
                                  >
                                    {isYoutubeVideo(video) ? (
                                      <div className="w-full h-full relative pointer-events-none">
                                        <img 
                                          src={`https://img.youtube.com/vi/${video.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/)?.[1]}/hqdefault.jpg`}
                                          className="w-full h-full object-cover opacity-70"
                                          alt="Youtube Thumbnail"
                                        />
                                      </div>
                                    ) : (
                                      <video
                                        src={video}
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
                            <div className="flex-1 min-h-[160px] border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-slate-600 gap-2">
                              <ImageIcon size={32} strokeWidth={1} />
                              <p className="text-[9px] font-black uppercase tracking-[0.3em]">Chưa có hình ảnh / video</p>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Vị trí + Dịch vụ – 2 cột */}
                      <div className="lg:col-span-2 flex flex-col gap-4">
                        {/* Vị trí triển khai */}
                        <button
                          onClick={() => openGoogleMapsRoute(
                            techLocation ? `${techLocation.address}, ${techLocation.cityName}` : gpsLocation,
                            job.address
                          )}
                          className="flex-1 bg-indigo-500/8 hover:bg-indigo-500/15 border border-indigo-500/20 hover:border-indigo-400/40 rounded-2xl p-4 text-left transition-all duration-300 flex flex-col gap-2 group relative overflow-hidden"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-400 shrink-0 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                              <MapPin size={15} />
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Vị trí triển khai</p>
                              <p className="text-[9px] text-indigo-400 flex items-center gap-1 font-bold">
                                <Navigation size={8} /> Chỉ tay hướng
                              </p>
                            </div>
                          </div>
                          <p className="text-xs font-semibold text-slate-300 line-clamp-2 leading-relaxed group-hover:text-white transition-colors">
                            {job.address || '123 Đường ABC, Quận 1, TP.HCM'}
                          </p>
                        </button>

                        {/* Loại dịch vụ */}
                        <div className="flex-1 bg-emerald-500/8 border border-emerald-500/20 rounded-2xl p-4 flex flex-col gap-2 group hover:bg-emerald-500/14 transition-all duration-300 relative overflow-hidden">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                              <Briefcase size={15} />
                            </div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Loại dịch vụ</p>
                          </div>
                          <p className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors mt-auto">
                            {job.serviceName || 'Xử lý kỹ thuật'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Mô tả chi tiết từ khách */}
                    <div className="bg-[#060e1e] border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                        <MessageSquare size={12} className="text-slate-500" />
                        Mô tả chi tiết từ khách
                      </h3>
                      <div className="bg-black/20 rounded-xl p-4 border border-white/[0.03] relative">
                        <div className="absolute top-3 left-3 text-white/5 font-serif text-5xl leading-none italic select-none">"</div>
                        <p className="text-[13px] text-slate-300 font-medium italic leading-relaxed relative z-10 indent-4">
                          {job.description || 'Hệ thống đang tiến hành kiểm tra yêu cầu từ khách hàng...'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ── ACTION BAR ── */}
                  <div className="shrink-0 px-6 py-4 border-t border-white/5 flex items-center justify-between gap-4 bg-[#070e1d]/60">
                    {/* Confirm Complete */}
                    <button
                      onClick={handleCompleteOrder}
                      disabled={actionLoading}
                      className="h-12 px-7 bg-[#00c896] hover:bg-[#00b383] active:scale-95 text-white rounded-xl text-xs font-black uppercase tracking-[0.12em] shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {actionLoading
                        ? <Loader2 className="animate-spin" size={16} />
                        : <><CheckCircle2 size={16} /> XÁC NHẬN HOÀN TẤT</>}
                    </button>

                    {/* Phone + Chat */}
                    <div className="flex items-center gap-3">
                      <a
                        href={`tel:${job.phoneNumber || job.customerPhone || (jobDetail as any)?.customerPhone}`}
                        className="h-12 px-5 bg-emerald-500/8 border border-emerald-500/20 rounded-xl flex items-center gap-2.5 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all duration-300 group"
                      >
                        <Phone size={16} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[12px] font-bold tracking-wider">
                          {job.phoneNumber || job.customerPhone || (jobDetail as any)?.customerPhone || '0999999999'}
                        </span>
                      </a>
                      <button
                        onClick={() => navigate('/technician/chat')}
                        className="w-12 h-12 bg-sky-500/8 border border-sky-500/20 rounded-xl flex items-center justify-center text-sky-400 hover:bg-sky-500 hover:text-white transition-all duration-300 group"
                      >
                        <MessageSquare size={18} className="group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Pending Reviews */}
                {pendingReviews.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] px-1">
                      CHỜ XÁC NHẬN ({pendingReviews.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pendingReviews.map((pr) => (
                        <div
                          key={pr.orderId}
                          className="bg-[#0d1526]/80 border border-white/5 rounded-2xl p-4 flex items-center justify-between hover:border-white/10 transition-all"
                        >
                          <div className="min-w-0">
                            <h4 className="text-sm font-black text-white uppercase truncate mb-1">{pr.title}</h4>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{pr.customerName}</p>
                          </div>
                          <button
                            onClick={() => handleDebugConfirm(pr.orderId)}
                            className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center hover:bg-emerald-600 hover:text-white text-slate-400 transition-all"
                          >
                            <CheckCircle size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center py-48">
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Hệ thống sẵn sàng</h2>
                <Link
                  to="/technician/don-hang/da-tiep-nhan"
                  className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[20px] text-[10px] font-black uppercase tracking-widest shadow-2xl transition-all"
                >
                  Đến trang đơn tiếp nhận
                </Link>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* === RIGHT SIDEBAR === */}
        <div className="w-full lg:w-[360px] space-y-4 h-full shrink-0 pb-4">

          {/* Stats Widget */}
          <div className="bg-[#0d1526]/80 backdrop-blur-3xl rounded-2xl p-6 flex items-center justify-between relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 p-6 opacity-[0.04] pointer-events-none text-white">
              <Activity size={90} />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Nhiệm vụ đã nhận</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-white tabular-nums">{acceptedCount}</span>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tight">Hiện có</span>
              </div>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400 shadow-xl">
              <CheckCircle2 size={30} />
            </div>
          </div>

          {/* Map Insight Widget */}
          <div className="bg-[#0d1526]/80 backdrop-blur-3xl rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="text-[10px] font-black text-teal-400 uppercase tracking-[0.4em]">Vị trí dịch vụ</h3>
            <div className="space-y-3">
              {[
                { label: 'Thành phố', value: profile?.city || 'Đà Nẵng' },
                { label: 'Địa chỉ cụ thể', value: profile?.address || 'Chưa cập nhật' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="mt-0.5 w-7 h-7 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400 shrink-0">
                    <MapPin size={13} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{item.label}</p>
                    <p className="text-sm font-bold text-slate-200 uppercase">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-900 border border-white/5 shadow-xl">
              <iframe
                key={techLocation ? `${techLocation.address}-${techLocation.cityName}` : (gpsLocation ? `${gpsLocation.lat},${gpsLocation.lng}` : 'default')}
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%)' }}
                src={techLocation
                  ? getMapEmbedSrcByAddress(`${techLocation.address}, ${techLocation.cityName}`, 15)
                  : getMapEmbedSrc(gpsLocation, profile?.latitude, profile?.longitude, 15)}
                allowFullScreen
              />
              <div className="absolute bottom-3 left-3 right-3 p-3 bg-black/80 backdrop-blur-md rounded-xl border border-white/10 text-center">
                <p className="text-[10px] font-black text-white uppercase leading-none mb-0.5 tracking-tight">
                  {profile?.city ? `${profile.city} CITY` : 'ĐÀ NẴNG CITY'}
                </p>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.15em]">ACTIVE COVERAGE</p>
              </div>
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