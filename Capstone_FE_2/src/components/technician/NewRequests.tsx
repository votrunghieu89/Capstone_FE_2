import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MapPin, Clock, AlertCircle,
  Phone, User, ChevronRight,
  CheckCircle2, Cloud, Navigation,
  Activity, Target, ArrowRight, RefreshCcw, MessageCircle, X, Send
} from 'lucide-react';
import { openGoogleMapsLocation, getMapEmbedSrc, openGoogleMapsRoute, getMapEmbedSrcByAddress } from '@/utils/mapUtils';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '@/store/authStore';
import technicianOrderService from '@/services/technicianOrderService';
import { statisticService } from '@/services/statisticService';
import { ViewOrderDTO, OrderDetailDTO } from '@/types/order';
import { TechnicianProfileViewDTO } from '@/types/technician';
import technicianService from '@/services/technicianService';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { vi } from 'date-fns/locale';
import chatService from '@/services/chatService';
import { useChatSignalR } from '@/hooks/useChatSignalR';

export function NewRequests() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<ViewOrderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsMap, setDetailsMap] = useState<Record<string, OrderDetailDTO>>({});
  const [fetchingMedia, setFetchingMedia] = useState<Set<string>>(new Set());
  const [profile, setProfile] = useState<TechnicianProfileViewDTO | null>(null);
  const [showChatBox, setShowChatBox] = useState(false);
  const [chatTarget, setChatTarget] = useState<ViewOrderDTO | null>(null);
  const [chatRoomId, setChatRoomId] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const { messages: realtimeMessages, setMessages: setRealtimeMessages, joinRoom, notifications: chatNotifications } = useChatSignalR();

  const unreadBySenderId = useMemo(() => {
    const map: Record<string, number> = {};
    (chatNotifications || []).forEach((n: any) => {
      const senderId = String(n?.SenderId || n?.SenderID || n?.senderId || n?.senderID || n?.senderid || '').trim();
      if (!senderId) return;
      map[senderId] = (map[senderId] || 0) + 1;
    });
    return map;
  }, [chatNotifications]);
  const [unreadByOtherId, setUnreadByOtherId] = useState<Record<string, number>>({});

  const refreshUnreadFromRooms = useCallback(async () => {
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
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    void refreshUnreadFromRooms();
    const timer = window.setInterval(() => {
      void refreshUnreadFromRooms();
    }, 8000);
    return () => window.clearInterval(timer);
  }, [refreshUnreadFromRooms, user?.id]);

  useEffect(() => {
    if (!chatNotifications.length) return;
    void refreshUnreadFromRooms();
  }, [chatNotifications.length, refreshUnreadFromRooms]);

  // Real-time stats states
  const [stats, setStats] = useState({
    todayReceived: 0,
    completionRate: 0,
    acceptedCount: 0,
    total: 0,
    completed: 0
  });

  // Real-time GPS device location
  const { location: gpsLocation } = useCurrentLocation();
  const [techLocation, setTechLocation] = useState<{ address: string, cityName: string } | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadRequests();
      loadStats();
      loadLocation();
    }
  }, [user?.id]);

  const loadLocation = async () => {
    if (!user?.id) return;
    try {
      const loc = await technicianOrderService.getTechnicianLocation(user.id);
      setTechLocation(loc);
    } catch (err) {
      console.warn('Could not fetch technician live location', err);
    }
  };

  const loadRequests = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const pendingOrders = await technicianOrderService.getConfirmingOrders(user.id);
      const sortedData = [...pendingOrders].sort((a, b) =>
        new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime()
      );
      setRequests(sortedData);
      enrichWithMedia(sortedData);
    } catch (err) {
      console.error('Error loading requests:', err);
      toast.error('Không thể tải danh sách yêu cầu mới');
    } finally {
      setLoading(false);
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

  const resolveCustomerIdFromExistingRooms = async (request: ViewOrderDTO) => {
    if (!user?.id) return '';
    try {
      const roomRes = await chatService.getAllRooms(user.id, 1, 100);
      const rooms = Array.isArray(roomRes) ? roomRes : (roomRes?.items || roomRes?.data || []);

      const targetName = normalizeText(String((request as any)?.customerName || (request as any)?.CustomerName || ''));
      const targetPhone = String((request as any)?.phoneNumber || (request as any)?.PhoneNumber || (request as any)?.customerPhone || '').trim();

      const matched = rooms.find((r: any) => {
        const roomName = normalizeText(String(r?.otherPartyName || r?.OtherPartyName || r?.userName || r?.UserName || r?.customerName || r?.CustomerName || ''));
        const roomPhone = String(r?.phoneNumber || r?.PhoneNumber || r?.otherPartyPhone || r?.OtherPartyPhone || '').trim();
        const sameName = Boolean(targetName) && Boolean(roomName) && (roomName === targetName || roomName.includes(targetName) || targetName.includes(roomName));
        const samePhone = Boolean(targetPhone) && Boolean(roomPhone) && targetPhone === roomPhone;
        return sameName || samePhone;
      });

      if (!matched) return '';

      const otherPartyId = String(
        matched?.otherPartyId ||
        matched?.OtherPartyId ||
        matched?.otherId ||
        matched?.OtherId ||
        matched?.customerId ||
        matched?.CustomerId ||
        ''
      ).trim();

      return otherPartyId;
    } catch {
      return '';
    }
  };

  const resolveCustomerIdForChat = async (request: ViewOrderDTO) => {
    const fromRequest = String(
      request.customerId ||
      (request as any)?.CustomerId ||
      (request as any)?.customerID ||
      (request as any)?.CustomerID ||
      ''
    ).trim();
    if (fromRequest) return fromRequest;

    const cachedDetail = detailsMap[request.orderId] as any;
    const fromCachedDetail = String(
      cachedDetail?.customerId ||
      cachedDetail?.CustomerId ||
      cachedDetail?.customerID ||
      cachedDetail?.CustomerID ||
      ''
    ).trim();
    if (fromCachedDetail) return fromCachedDetail;

    try {
      const detail = (await technicianOrderService.getOrderDetail(request.orderId)) as any;
      if (detail) {
        setDetailsMap((prev) => ({ ...prev, [request.orderId]: { ...detail, orderId: request.orderId } as OrderDetailDTO }));
      }
      return String(
        detail?.customerId ||
        detail?.CustomerId ||
        detail?.customerID ||
        detail?.CustomerID ||
        ''
      ).trim();
    } catch {
      // fallback below
    }

    // Fallback: Order DTO không có CustomerId, thử dò từ phòng chat đã có.
    return await resolveCustomerIdFromExistingRooms(request);
  };

  const openChatBox = async (request: ViewOrderDTO) => {
    if (!user?.id) return;
    setShowChatBox(true);
    setChatTarget(request);
    setChatLoading(true);
    setChatInput('');
    try {
      const customerId = await resolveCustomerIdForChat(request);
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
      const normalized = normalizeChatMessages(list);
      setRealtimeMessages(normalized as any);
      await chatService.markAsRead(roomId, user.id).catch(() => undefined);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không mở được hộp chat');
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendChatMessage = async () => {
    if (!user?.id || !chatTarget || !chatInput.trim()) return;
    const customerId = await resolveCustomerIdForChat(chatTarget);
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

  const loadStats = async () => {
    if (!user?.id) return;
    try {
      // Fetch stats and the real accepted orders list
      const [receivedToday, completed, total, confirmedOrders, profileData] = await Promise.all([
        statisticService.getTodayReceivedCount(user.id),
        statisticService.getTotalCompletedCount(user.id),
        statisticService.getTotalOrders(user.id),
        technicianOrderService.getConfirmedOrders(user.id), // Lấy danh sách đã tiếp nhận
        technicianService.getProfile(user.id)
      ]);

      setProfile(profileData);

      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      setStats({
        todayReceived: receivedToday,
        completionRate: rate,
        acceptedCount: confirmedOrders.length,
        total,
        completed
      });
    } catch (err) {
      console.warn('Could not load sidebar stats', err);
    }
  };

  const enrichWithMedia = async (orders: ViewOrderDTO[]) => {
    for (const order of orders) {
      if (detailsMap[order.orderId] || fetchingMedia.has(order.orderId)) continue;
      setFetchingMedia(prev => new Set(prev).add(order.orderId));
      try {
        const raw = (await technicianOrderService.getOrderDetail(order.orderId)) as any;
        if (raw) {
          const detail = { ...raw, orderId: order.orderId } as OrderDetailDTO;
          setDetailsMap((prev) => ({ ...prev, [order.orderId]: detail }));
        }
      } catch (err) {
        console.warn(`Failed to fetch detail for order ${order.orderId}`, err);
      } finally {
        setFetchingMedia(prev => {
          const next = new Set(prev);
          next.delete(order.orderId);
          return next;
        });
      }
    }
  };

  const handleAccept = async (orderId: string) => {
    if (!user?.id) return;
    try {
      await technicianOrderService.confirmOrder({ orderId, technicianId: user.id });
      toast.success('Đã chấp nhận đơn hàng!');
      setTimeout(() => navigate('/technician/don-hang/da-tiep-nhan'), 500);
    } catch (err: any) {
      toast.error('Lỗi khi chấp nhận đơn hàng');
    }
  };

  const handleReject = async (orderId: string) => {
    if (!user?.id) return;
    const accepted = window.confirm('Bạn có chắc chắn muốn từ chối nhiệm vụ này không?');
    if (!accepted) return;
    try {
      await technicianOrderService.rejectOrder({ orderId, technicianId: user.id });
      toast.success('Đã từ chối đơn hàng');
      // Tải lại danh sách
      loadRequests();
    } catch (err: any) {
      toast.error('Không thể từ chối đơn hàng lúc này');
    }
  };

  if (loading) {
    return (
      <div className="flex bg-[#020617] items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] bg-[#020617] text-slate-200 overflow-hidden flex flex-col">
      <div className="max-w-[1600px] w-full mx-auto px-4 md:px-8 py-8 flex flex-col lg:flex-row gap-8 flex-1 min-h-0">

        {/* === MAIN CONTENT: Requests List (SCROLLABLE AREA) === */}
        <div className="flex-1 flex flex-col min-h-0 space-y-8">
          {/* Header Title & Badge */}
          <div className="flex items-center justify-between shrink-0">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-1 bg-blue-600 rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Hệ thống tiếp nhận</span>
              </div>
              <div className="flex items-center gap-4">
                <h1 className="text-4xl font-black text-white tracking-tighter">Yêu cầu mới</h1>

              </div>
            </div>

            <button
              onClick={() => { loadRequests(); loadStats(); }}
              className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl flex items-center gap-2 transition-all group"
            >
              <RefreshCcw size={16} className={cn("text-emerald-400 group-hover:rotate-180 transition-transform duration-500")} />
              <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">Cập nhật đơn mới</span>
            </button>
          </div>

          {/* List Area (Independent Scroll) */}
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-5">
            <AnimatePresence mode='popLayout'>
              {requests.length === 0 ? (
                <div className="bg-[#0f172a]/40 border border-dashed border-white/10 rounded-[32px] p-24 text-center">
                  <AlertCircle size={48} className="mx-auto text-slate-600 mb-4" />
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Hiện tại không có yêu cầu nào</p>
                </div>
              ) : (
                requests.map((request, idx) => (
                  <motion.div
                    key={request.orderId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="group bg-[#0f172a]/60 backdrop-blur-xl border border-white/5 hover:border-blue-500/30 rounded-[28px] p-6 transition-all duration-300 relative overflow-hidden flex flex-col gap-6"
                  >
                    {/* Card Header: Tag + ID + Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider rounded-lg">
                          {detailsMap[request.orderId]?.serviceName}
                        </span>
                        <button
                          onClick={() => void openChatBox(request)}
                          className="relative px-3 py-1 bg-blue-600/20 text-blue-300 text-[10px] font-black uppercase tracking-wider rounded-lg border border-blue-500/30 hover:bg-blue-600/30 transition"
                        >
                          {(() => {
                            const customerId = String(request.customerId || (request as any)?.CustomerId || '').trim();
                            const unreadCount = customerId ? Math.max(unreadBySenderId[customerId] || 0, unreadByOtherId[customerId] || 0) : 0;
                            if (!unreadCount) return null;
                            return (
                              <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-[#ff2d55] text-white text-[9px] font-black flex items-center justify-center ring-2 ring-[#0f172a]">
                                {unreadCount > 99 ? '99+' : unreadCount}
                              </span>
                            );
                          })()}
                          <span className="inline-flex items-center gap-1">
                            <MessageCircle size={12} /> Chat khách
                          </span>
                        </button>
                        <span className="text-[11px] font-bold text-slate-600">
                          #TK-{(request.orderId || '').slice(-5).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Đang chờ xác nhận</span>
                      </div>
                    </div>

                    {/* Card Body: Title & Core Info */}
                    <div className="flex flex-col 2xl:flex-row gap-8">
                      <div className="flex-1 space-y-6 min-w-0">
                        <h2 className="text-2xl font-black text-white group-hover:text-blue-400 transition-colors">
                          {request.title || 'Yêu cầu sửa chữa thiết bị'}
                        </h2>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                          {/* Customer Info */}
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 shrink-0">
                              <User size={20} className="text-slate-400" />
                            </div>
                            <div className="min-w-0 w-full">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Khách hàng</p>
                              <p className="text-sm font-bold text-white break-words leading-tight">{request.customerName}</p>
                            </div>
                          </div>

                          {/* Address Info */}
                          <div className="flex items-start gap-4 min-w-0">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
                              <MapPin size={20} className="text-blue-400" />
                            </div>
                            <div className="min-w-0 w-full">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Địa chỉ</p>
                              <p className="text-sm font-medium text-slate-300 line-clamp-2 break-words leading-tight">
                                {detailsMap[request.orderId]?.address || request.address}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Column 2: Specific Contact & Navigation */}
                      <div className="w-full 2xl:w-72 space-y-6">
                        {/* Contact Info */}
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 shrink-0">
                            <Phone size={20} className="text-slate-400" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Liên hệ</p>
                            <p className="text-xs font-bold text-slate-400 italic">Hiển thị khi nhận việc</p>
                          </div>
                        </div>

                        <button
                          onClick={() => openGoogleMapsRoute(
                            techLocation ? `${techLocation.address}, ${techLocation.cityName}` : gpsLocation,
                            detailsMap[request.orderId]?.address || request.address
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

                      {/* Call to Action Buttons */}
                      <div className="flex w-full 2xl:w-auto flex-col sm:flex-row 2xl:flex-col items-stretch justify-end gap-3 shrink-0">
                        <button
                          onClick={() => handleAccept(request.orderId)}
                          className="w-full px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
                        >
                          Chấp nhận ngay <ArrowRight size={16} />
                        </button>
                        <div className="flex w-full gap-3">
                          <button
                            onClick={() => handleReject(request.orderId)}
                            className="flex-1 px-4 py-3.5 bg-rose-500/5 hover:bg-rose-500 hover:text-white text-rose-500 font-black text-[10px] uppercase tracking-widest rounded-2xl border border-rose-500/10 transition-all active:scale-95"
                          >
                            Từ chối
                          </button>
                          <button
                            onClick={() => navigate(`/technician/don-hang/chi-tiet/${request.orderId}`)}
                            className="flex-1 px-4 py-3.5 bg-white/5 hover:bg-white/10 text-slate-300 font-black text-[10px] uppercase tracking-widest rounded-2xl border border-white/5 transition-all active:scale-95"
                          >
                            Chi tiết
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer: Time Badge */}
                    <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                      <Clock size={14} className="text-slate-600" />
                      <span className="text-[11px] font-bold text-slate-500">
                        Hẹn lúc: <span className="text-white">{format(new Date(request.orderDate), "HH:mm")}</span> - Hôm nay ({formatDistanceToNow(new Date(request.orderDate), { addSuffix: true, locale: vi })})
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* === SIDEBAR: Stats & Insights (Fixed in place) === */}
        <div className="w-full lg:w-[380px] space-y-4 h-full shrink-0 pb-4">

          {/* Dashboard Stats */}
          <div className="bg-[#0f172a]/60 backdrop-blur-3xl border border-white/5 rounded-[32px] p-6 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
              <Activity size={120} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Nhiệm vụ đã nhận</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-white leading-none">{stats.acceptedCount}</span>
                  <span className="text-[11px] font-bold text-emerald-400 uppercase">Hiện có</span>
                </div>
              </div>
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 size={32} />
              </div>
            </div>


          </div>

          {/* Deployment Map Insight */}
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

            <div className="relative rounded-2xl overflow-hidden border border-white/5 aspect-video bg-slate-900 group cursor-crosshair shrink-0">
              <iframe
                key={techLocation ? `${techLocation.address}-${techLocation.cityName}` : (gpsLocation ? `${gpsLocation.lat},${gpsLocation.lng}` : 'profile')}
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%)' }}
                src={techLocation ? getMapEmbedSrcByAddress(`${techLocation.address}, ${techLocation.cityName}`, 13) : getMapEmbedSrc(gpsLocation, profile?.latitude, profile?.longitude, 13)}
                allowFullScreen
              ></iframe>
              <div className="absolute bottom-4 left-4 right-4 p-4 bg-black/80 backdrop-blur-md rounded-2xl border border-white/10 text-center">
                <p className="text-[11px] font-black text-white uppercase leading-none mb-1 tracking-tight">{profile?.city ? `${profile.city} CITY` : 'ĐÀ NẴNG CITY'}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em]">ACTIVE COVERAGE</p>
              </div>
            </div>




          </div>

        </div>

      </div>

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
                    {(chatTarget as any)?.customerName || (chatTarget as any)?.CustomerName || '—'}
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
    </div>
  );
}
