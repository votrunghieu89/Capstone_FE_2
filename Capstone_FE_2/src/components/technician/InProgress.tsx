import { useState, useEffect, useMemo } from 'react';
import {
  MapPin, Clock, User, Phone,
  CheckCircle2, Navigation, MessageSquare, Wrench,
  Play, ZoomIn, Loader2, RefreshCcw, ChevronRight, BrainCircuit, ImageIcon, X, MessageCircle, Send
} from 'lucide-react';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { openGoogleMapsRoute, getMapEmbedSrc, getMapEmbedSrcByAddress } from '@/utils/mapUtils';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';

import technicianOrderService from '@/services/technicianOrderService';
import technicianService from '@/services/technicianService';
import useAuthStore from '@/store/authStore';
import { ViewOrderDTO } from '@/types/order';
import { TechnicianProfileViewDTO } from '@/types/technician';
import { formatDistanceToNow, format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { buildEtaWindowText, getEtaFallbackLabel } from '@/lib/orderEta';
import chatService from '@/services/chatService';
import { useChatSignalR } from '@/hooks/useChatSignalR';

export function InProgress() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [job, setJob] = useState<ViewOrderDTO | null>(null);
  const [jobDetail, setJobDetail] = useState<any | null>(null);
  const [profile, setProfile] = useState<TechnicianProfileViewDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [completeSent, setCompleteSent] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxType, setLightboxType] = useState<'image' | 'video'>('image');
  const [showChatBox, setShowChatBox] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatRoomId, setChatRoomId] = useState('');
  const { messages: realtimeMessages, setMessages: setRealtimeMessages, joinRoom, notifications: chatNotifications } = useChatSignalR();
  const [unreadByOtherId, setUnreadByOtherId] = useState<Record<string, number>>({});

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

  const inProgressEtaLabel = useMemo(() => {
    if (!job) return '';
    const createdRaw =
      job.orderDate ||
      (job as any)?.OrderDate ||
      jobDetail?.orderDate ||
      (jobDetail as any)?.OrderDate ||
      (jobDetail as any)?.createdAt ||
      (jobDetail as any)?.CreatedAt;
    const etaRaw =
      job.estimatedTime ??
      (job as any)?.EstimatedTime ??
      (jobDetail as any)?.estimatedTime ??
      (jobDetail as any)?.EstimatedTime;
    return buildEtaWindowText(etaRaw, createdRaw) || getEtaFallbackLabel(etaRaw);
  }, [job, jobDetail]);

  const unreadBySenderId = useMemo(() => {
    const map: Record<string, number> = {};
    (chatNotifications || []).forEach((n: any) => {
      const senderId = String(n?.SenderId || n?.SenderID || n?.senderId || n?.senderID || n?.senderid || '').trim();
      if (!senderId) return;
      map[senderId] = (map[senderId] || 0) + 1;
    });
    return map;
  }, [chatNotifications]);

  useEffect(() => {
    if (user?.id) {
      loadInProgress();
      loadLocation();
      loadProfile();
    }
  }, [user?.id]);

  const refreshUnreadFromRooms = async () => {
    if (!user?.id) return;
    try {
      const res = await chatService.getAllRooms(user.id, 1, 100);
      const rooms = Array.isArray(res) ? res : (res?.items || res?.data || []);
      const map: Record<string, number> = {};
      rooms.forEach((room: any) => {
        const otherId = String(room?.otherId || room?.OtherId || room?.otherPartyId || room?.OtherPartyId || '').trim();
        if (!otherId) return;
        const unreadCount = Number(room?.unreadCount ?? room?.UnreadCount ?? 0);
        const hasUnread = Boolean(room?.hasUnread ?? room?.HasUnread);
        const value = Number.isFinite(unreadCount) && unreadCount > 0 ? unreadCount : (hasUnread ? 1 : 0);
        if (value > 0) map[otherId] = Math.max(map[otherId] || 0, value);
      });
      setUnreadByOtherId(map);
    } catch {
      // keep current unread map
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    void refreshUnreadFromRooms();
    const timer = window.setInterval(() => {
      void refreshUnreadFromRooms();
    }, 8000);
    return () => window.clearInterval(timer);
  }, [user?.id]);

  useEffect(() => {
    if (!chatNotifications.length) return;
    void refreshUnreadFromRooms();
  }, [chatNotifications.length]);

  const loadProfile = async () => {
    if (!user?.id) return;
    try {
      const data = await technicianService.getProfile(user.id);
      setProfile(data || null);
    } catch {
      // silent
    }
  };

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

  const normalizeChatMessages = (raw: any[]) =>
    (raw || []).map((m: any) => ({
      id: String(m?.id || m?.Id || m?.messengerId || m?.MessengerId || `${m?.senderId || m?.SenderId}-${m?.createdAt || m?.CreatedAt || Date.now()}`),
      senderId: String(m?.senderId || m?.SenderId || ''),
      content: String(m?.content || m?.Content || ''),
      createdAt: String(m?.createdAt || m?.CreatedAt || new Date().toISOString()),
    }));

  const normalizeText = (value: string) =>
    String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  const resolveCustomerIdFromExistingRooms = async () => {
    if (!user?.id || !job) return '';
    try {
      const roomRes = await chatService.getAllRooms(user.id, 1, 100);
      const rooms = Array.isArray(roomRes) ? roomRes : (roomRes?.items || roomRes?.data || []);

      const targetName = normalizeText(String((job as any)?.customerName || (job as any)?.CustomerName || ''));
      const targetPhone = String((job as any)?.phoneNumber || (job as any)?.PhoneNumber || (job as any)?.customerPhone || '').trim();

      const matched = rooms.find((r: any) => {
        const roomName = normalizeText(String(r?.otherPartyName || r?.OtherPartyName || r?.userName || r?.UserName || r?.customerName || r?.CustomerName || ''));
        const roomPhone = String(r?.phoneNumber || r?.PhoneNumber || r?.otherPartyPhone || r?.OtherPartyPhone || '').trim();
        const sameName = Boolean(targetName) && Boolean(roomName) && (roomName === targetName || roomName.includes(targetName) || targetName.includes(roomName));
        const samePhone = Boolean(targetPhone) && Boolean(roomPhone) && targetPhone === roomPhone;
        return sameName || samePhone;
      });

      if (!matched) return '';
      return String(
        matched?.otherPartyId ||
        matched?.OtherPartyId ||
        matched?.otherId ||
        matched?.OtherId ||
        matched?.customerId ||
        matched?.CustomerId ||
        ''
      ).trim();
    } catch {
      return '';
    }
  };

  const resolveCustomerIdForChat = async () => {
    if (!job) return '';
    const fromJob = String(
      job.customerId ||
      (job as any)?.CustomerId ||
      (job as any)?.customerID ||
      (job as any)?.CustomerID ||
      ''
    ).trim();
    if (fromJob) return fromJob;

    const fromDetail = String(
      jobDetail?.customerId ||
      (jobDetail as any)?.CustomerId ||
      (jobDetail as any)?.customerID ||
      (jobDetail as any)?.CustomerID ||
      ''
    ).trim();
    if (fromDetail) return fromDetail;

    return await resolveCustomerIdFromExistingRooms();
  };

  const openChatBox = async () => {
    if (!user?.id || !job) return;
    setShowChatBox(true);
    setChatLoading(true);
    setChatInput('');
    try {
      const customerId = await resolveCustomerIdForChat();
      if (!customerId) {
        toast.error('Không tìm thấy khách hàng để mở chat. Hãy dùng trang Liên hệ hoặc chờ khách nhắn trước.');
        setChatRoomId('');
        setRealtimeMessages([]);
        return;
      }

      const roomRes = await chatService.getOrCreateRoom(user.id, customerId);
      const roomId = String(roomRes?.roomId || roomRes?.RoomId || roomRes?.id || roomRes?.Id || roomRes || '').trim();
      if (!roomId) {
        toast.error('Không thể mở phòng chat.');
        setChatRoomId('');
        setRealtimeMessages([]);
        return;
      }

      setChatRoomId(roomId);
      await joinRoom(roomId);
      const msgRes = await chatService.getAllMessages(roomId, 1, 50);
      const list = Array.isArray(msgRes) ? msgRes : (msgRes?.items || msgRes?.data || []);
      setRealtimeMessages(normalizeChatMessages(list) as any);
      await chatService.markAsRead(roomId, user.id).catch(() => undefined);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không mở được hộp chat');
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendChatMessage = async () => {
    if (!user?.id || !job || !chatInput.trim()) return;
    const customerId = await resolveCustomerIdForChat();
    if (!customerId) {
      toast.error('Không tìm thấy khách hàng để gửi tin nhắn.');
      return;
    }
    try {
      await chatService.insertMessage({
        senderId: user.id,
        receiverId: customerId,
        content: chatInput.trim(),
      });
      setChatInput('');
    } catch {
      toast.error('Gửi tin nhắn thất bại');
    }
  };

  if (loading) {
    return (
      <div className="flex bg-[#020617] h-[calc(100vh-80px)] items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const mediaList = jobDetail?.imageUrls || jobDetail?.ImageUrls || [];
  const videoUrl = jobDetail?.videoUrl || jobDetail?.VideoUrl || '';
  const hasMedia = videoUrl || mediaList.length > 0;

  const addr = job?.address || '';
  const city = (job as any)?.cityName || jobDetail?.cityName || jobDetail?.city || '';
  const fullAddress = addr + (city && !addr.includes(city) ? `, ${city}` : '');
  const expectedTime = job?.orderDate ? format(new Date(new Date(job.orderDate).getTime() + 60 * 60 * 1000), 'HH:mm') : '--:--';
  const customerPhone = job?.phoneNumber || (job as any)?.customerPhone || jobDetail?.customerPhone;
  const aiDiagnosis = jobDetail?.aiDiagnostic || null;
  const serviceName = job?.serviceName || jobDetail?.serviceName || 'DỊCH VỤ';
  const customerIdForBadge = String(
    job?.customerId ||
    (job as any)?.CustomerId ||
    jobDetail?.customerId ||
    (jobDetail as any)?.CustomerId ||
    ''
  ).trim();
  const unreadCount = customerIdForBadge ? Math.max(unreadBySenderId[customerIdForBadge] || 0, unreadByOtherId[customerIdForBadge] || 0) : 0;

  const refreshAll = () => {
    void loadInProgress();
    void loadLocation();
    void loadProfile();
  };

  return (
    <div className="h-[calc(100vh-80px)] bg-[#020617] text-slate-200 overflow-hidden flex flex-col relative">
      <div className="max-w-[1600px] w-full mx-auto px-4 md:px-8 py-8 flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
        <div className="flex-1 flex flex-col min-h-0 space-y-8">
          <div className="flex items-center justify-between shrink-0">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-1 bg-blue-600 rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Hệ thống xử lý</span>
              </div>
              <div className="flex items-center gap-4">
                <h1 className="text-4xl font-black text-white tracking-tighter">Đơn đang thực hiện</h1>
              </div>
            </div>

            <button
              onClick={refreshAll}
              className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl flex items-center gap-2 transition-all group"
            >
              <RefreshCcw size={16} className="text-emerald-400 group-hover:rotate-180 transition-transform duration-500" />
              <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">Làm mới</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-5">
            <AnimatePresence mode="wait">
              {job ? (
                <motion.div
                  key="active-job"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="group bg-[#0f172a]/60 backdrop-blur-xl border border-white/5 hover:border-blue-500/30 rounded-[28px] p-6 transition-all duration-300 relative overflow-hidden flex flex-col gap-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider rounded-lg">
                        {serviceName}
                      </span>
                      <button
                        onClick={() => void openChatBox()}
                        className="relative px-3 py-1 bg-blue-600/20 text-blue-300 text-[10px] font-black uppercase tracking-wider rounded-lg border border-blue-500/30 hover:bg-blue-600/30 transition"
                      >
                        {unreadCount > 0 && (
                          <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-[#ff2d55] text-white text-[9px] font-black flex items-center justify-center ring-2 ring-[#0f172a]">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <MessageCircle size={12} /> Chat khách
                        </span>
                      </button>
                      <span className="text-[11px] font-bold text-slate-600">
                        #TK-{(job.orderId || '').slice(-5).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-amber-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)] animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Đang thực hiện</span>
                    </div>
                  </div>

                  <div className="flex flex-col 2xl:flex-row gap-8">
                    <div className="flex-1 space-y-6 min-w-0">
                      <h2 className="text-2xl font-black text-white group-hover:text-blue-400 transition-colors">
                        {job.title || 'Yêu cầu sửa chữa thiết bị'}
                      </h2>

                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 shrink-0">
                            <User size={20} className="text-slate-400" />
                          </div>
                          <div className="min-w-0 w-full">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Khách hàng</p>
                            <p className="text-sm font-bold text-white break-words leading-tight">
                              {job.customerName || 'Khách hàng'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4 min-w-0">
                          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
                            <MapPin size={20} className="text-blue-400" />
                          </div>
                          <div className="min-w-0 w-full">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Địa chỉ</p>
                            <p className="text-sm font-medium text-slate-300 line-clamp-2 break-words leading-tight">
                              {fullAddress || 'Đang cập nhật'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="w-full 2xl:w-72 space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 shrink-0">
                          <Phone size={20} className="text-slate-400" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Liên hệ</p>
                          {customerPhone ? (
                            <a href={`tel:${customerPhone}`} className="text-sm font-black text-emerald-400 hover:text-emerald-300 transition-colors">
                              {customerPhone}
                            </a>
                          ) : (
                            <p className="text-xs font-bold text-slate-400 italic">Không có SĐT</p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => openGoogleMapsRoute(
                          techLocation ? `${techLocation.address}, ${techLocation.cityName}` : gpsLocation,
                          fullAddress
                        )}
                        className="flex items-center gap-4 group/nav w-full text-left"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 group-hover/nav:bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center text-indigo-400 transition-all shrink-0">
                          <Navigation size={20} className="group-hover/nav:scale-110 transition-transform" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Lộ trình</p>
                          <p className="text-sm font-black text-indigo-400 group-hover/nav:underline">CHỈ ĐƯỜNG</p>
                        </div>
                      </button>
                    </div>

                    <div className="flex w-full 2xl:w-auto flex-col items-stretch justify-end gap-3 shrink-0">
                      <button
                        onClick={handleCompleteOrder}
                        disabled={actionLoading || completeSent}
                        className={`w-full px-8 py-4 font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95 ${actionLoading || completeSent
                          ? 'bg-emerald-500/60 text-white cursor-not-allowed'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                          }`}
                      >
                        {actionLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Đang gửi...
                          </>
                        ) : completeSent ? (
                          <>
                            <CheckCircle2 size={16} /> Đang chờ xác nhận
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={16} /> Xác nhận hoàn thành
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => navigate(`/technician/don-hang/chi-tiet/${job.orderId}`)}
                        className="w-full px-8 py-4 bg-white/5 hover:bg-white/10 text-slate-300 font-black text-xs uppercase tracking-widest rounded-2xl border border-white/5 transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        Chi tiết <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between mb-4 border-b border-white/[0.06] pb-2">
                        <div className="flex items-center gap-2">
                          <Wrench size={18} className="text-slate-500" />
                          <span className="text-sm font-black uppercase tracking-widest text-slate-400">Mô tả sự cố</span>
                        </div>
                        {hasMedia && (
                          <span className="text-xs font-bold text-slate-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                            {mediaList.length + (videoUrl ? 1 : 0)} files
                          </span>
                        )}
                      </div>

                      {hasMedia ? (
                        <div className="space-y-4">
                          {mediaList.length > 0 && (
                            <div className="flex flex-col gap-3">
                              <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <ImageIcon size={14} /> Hình ảnh
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

                          {videoUrl && (
                            <div className="flex flex-col gap-3 mt-6">
                              <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Play size={14} /> Video
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
                          <p className="text-xs font-bold uppercase tracking-[0.25em]">Chưa có hình ảnh / video</p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-3">
                        <MessageSquare size={16} className="text-slate-500" />
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Mô tả chi tiết từ khách</span>
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

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2 min-w-0">
                      <Clock size={14} className="text-slate-600 shrink-0" />
                      <span className="text-[11px] font-bold text-slate-500">
                        Hẹn lúc: <span className="text-white">{job.orderDate ? format(new Date(job.orderDate), 'HH:mm') : '--:--'}</span>
                        {job.orderDate ? ` - Hôm nay (${formatDistanceToNow(new Date(job.orderDate), { addSuffix: true, locale: vi })})` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 sm:justify-end min-w-0 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 shrink-0">
                        Dự kiến hoàn thành
                      </span>
                      <span className="text-[11px] font-bold text-emerald-300/95 tabular-nums">
                        {inProgressEtaLabel || expectedTime}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty-job"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-[#0f172a]/40 border border-dashed border-white/10 rounded-[32px] p-24 text-center"
                >
                  <CheckCircle2 size={48} className="mx-auto text-slate-600 mb-4" />
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Hệ thống sẵn sàng</h2>
                  <Link
                    to="/technician/don-hang/da-tiep-nhan"
                    className="inline-flex items-center gap-2 px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl transition-all"
                  >
                    Đến trang đơn tiếp nhận <ChevronRight size={14} />
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="w-full lg:w-[380px] space-y-4 h-full shrink-0 pb-4">
          <div className="bg-[#0f172a]/60 backdrop-blur-3xl border border-white/5 rounded-[32px] p-6 space-y-5">
            <div className="space-y-4 px-1 mb-4">
              <h3 className="text-[11px] font-black text-[#2DD4BF] uppercase tracking-[0.4em]">VỊ TRÍ DỊCH VỤ</h3>
              {[
                { label: 'THÀNH PHỐ', value: profile?.city || 'Đà Nẵng' },
                { label: 'ĐỊA CHỈ CỤ THỂ', value: profile?.address || 'Chưa cập nhật' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className="mt-0.5 w-8 h-8 rounded-full bg-[#2DD4BF]/10 flex items-center justify-center text-[#2DD4BF] shrink-0">
                    <MapPin size={14} />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{item.label}</p>
                    <p className="text-sm font-bold text-slate-200 uppercase">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div
              className="relative rounded-2xl overflow-hidden border border-white/5 aspect-video bg-slate-900 group cursor-crosshair shrink-0"
              onClick={() => openGoogleMapsRoute(
                techLocation ? `${techLocation.address}, ${techLocation.cityName}` : gpsLocation,
                fullAddress || `${profile?.address || ''}, ${profile?.city || ''}`
              )}
            >
              <iframe
                key={techLocation ? `${techLocation.address}-${techLocation.cityName}` : (gpsLocation ? `${gpsLocation.lat},${gpsLocation.lng}` : 'profile')}
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%)' }}
                src={
                  techLocation
                    ? getMapEmbedSrcByAddress(`${techLocation.address}, ${techLocation.cityName}`, 13)
                    : getMapEmbedSrc(gpsLocation, profile?.latitude, profile?.longitude, 13)
                }
                allowFullScreen
              ></iframe>
              <div className="absolute bottom-4 left-4 right-4 p-4 bg-black/80 backdrop-blur-md rounded-2xl border border-white/10 text-center">
                <p className="text-[11px] font-black text-white uppercase leading-none mb-1 tracking-tight">
                  {profile?.city ? `${profile.city} CITY` : 'ĐÀ NẴNG CITY'}
                </p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em]">ACTIVE COVERAGE</p>
              </div>
            </div>
          </div>

          {job && (
            <div className="bg-[#0f172a]/60 backdrop-blur-3xl border border-white/5 rounded-[32px] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Trạng thái đơn</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase">{completeSent ? 'Đã gửi xác nhận' : 'Đang xử lý'}</span>
                    {completeSent ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Loader2 size={14} className="text-amber-400 animate-spin" />}
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/technician/don-hang/chi-tiet/${job.orderId}`)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-300"
                >
                  Xem chi tiết
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== LIGHTBOX ===== */}
      <AnimatePresence>
        {showChatBox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[220] flex items-end justify-end p-4"
            onClick={() => setShowChatBox(false)}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md h-[70vh] rounded-2xl border border-white/10 bg-[#0b1220] shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="h-14 px-4 border-b border-white/10 flex items-center justify-between bg-[#0f172a]">
                <div>
                  <p className="text-sm font-bold text-white">Chat với khách hàng</p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {(job as any)?.customerName || (job as any)?.CustomerName || '—'}
                  </p>
                </div>
                <button onClick={() => setShowChatBox(false)} className="text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatLoading ? (
                  <div className="h-full flex items-center justify-center"><RefreshCcw className="w-5 h-5 animate-spin text-blue-400" /></div>
                ) : realtimeMessages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500">Chưa có tin nhắn nào</div>
                ) : (
                  realtimeMessages.map((msg: any) => {
                    const isMine = String(msg?.senderId || msg?.SenderId || '') === String(user?.id || '');
                    return (
                      <div key={String(msg?.id || msg?.Id || Math.random())} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm ${isMine ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-100'}`}>
                          <p>{msg?.content || msg?.Content}</p>
                          <p className="text-[10px] opacity-70 mt-1 text-right">
                            {new Date(msg?.createdAt || msg?.CreatedAt || Date.now()).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-3 border-t border-white/10 bg-[#0a1122] flex items-center gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void handleSendChatMessage();
                    }
                  }}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm outline-none focus:border-blue-500/40"
                />
                <button
                  onClick={() => void handleSendChatMessage()}
                  disabled={!chatInput.trim()}
                  className="h-10 w-10 rounded-xl bg-blue-600 disabled:opacity-50 flex items-center justify-center text-white"
                >
                  <Send size={16} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
