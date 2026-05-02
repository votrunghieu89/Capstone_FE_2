import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Phone, Video, Send, MoreVertical, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/authStore';
import chatService from '@/services/chatService';
import { useChatSignalR } from '@/hooks/useChatSignalR';

const roomIdOf = (room: any) => room?.id || room?.Id || room?.roomId || room?.RoomId || room?.roomID;
const otherPartyIdOf = (room: any, currentUserId?: string) => {
  const candidates = [
    room?.otherId, room?.OtherId,
    room?.otherPartyId, room?.OtherPartyId,
    room?.technicianId, room?.TechnicianId,
    room?.customerId, room?.CustomerId,
    room?.userA, room?.UserA,
    room?.userB, room?.UserB,
  ].map((v) => String(v || '').trim()).filter(Boolean);
  if (!currentUserId) return candidates[0] || '';
  const me = String(currentUserId).trim();
  return candidates.find((id) => id !== me) || candidates[0] || '';
};
const otherPartyNameOf = (room: any) => room?.userName || room?.UserName || room?.otherPartyName || room?.OtherPartyName || room?.technicianName || room?.TechnicianName || 'Kỹ thuật viên';
const lastUpdateOf = (room: any) => room?.lastMessageTime || room?.LastMessageTime || room?.lastUpdate || room?.LastUpdate || room?.createdAt || room?.CreatedAt;
const roomLastMessageOf = (room: any) => room?.lastMessage || room?.LastMessage || 'Chưa có tin nhắn';
const messageReadOf = (msg: any) => Boolean(msg?.isRead ?? msg?.IsRead ?? msg?.read ?? msg?.Read);

export default function ContactTechnicianPage() {
  const { user, isAuthenticated, token } = useAuthStore();
  const location = useLocation();
  const qs = new URLSearchParams(location.search);
  const focusRoomId = qs.get('roomId') || '';

  const [rooms, setRooms] = useState<any[]>([]);
  const [activeRoom, setActiveRoom] = useState<any>(null);
  const [inputMsg, setInputMsg] = useState('');
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [mediaPreviews, setMediaPreviews] = useState<{ url: string; name: string }[]>([]);
  const [unreadByRoom, setUnreadByRoom] = useState<Record<string, number>>({});

  const imageInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, notifications, setMessages, joinRoom } = useChatSignalR();

  const normalizeMessages = (raw: any[]) => (raw || []).map((m: any) => ({
    id: m?.id || m?.Id || m?.messengerId || m?.MessengerId,
    senderId: m?.senderId || m?.SenderId,
    content: m?.content || m?.Content || '',
    createdAt: m?.createdAt || m?.CreatedAt || m?.sentTime || m?.SentTime || new Date().toISOString(),
    isRead: messageReadOf(m),
  }));

  const refreshRooms = async () => {
    if (!user?.id) return [] as any[];
    const refreshed = await chatService.getAllRooms(user.id);
    const list = Array.isArray(refreshed) ? refreshed : (refreshed?.items || refreshed?.data || []);
    setRooms(list);
    return list;
  };

  useEffect(() => {
    if (!user?.id || !isAuthenticated || !token) return;
    const fetchRooms = async () => {
      setIsLoadingRooms(true);
      try {
        const list = await refreshRooms();
        if (focusRoomId) {
          const existedRoom = list.find((r: any) => String(roomIdOf(r)) === String(focusRoomId));
          if (existedRoom) setActiveRoom(existedRoom);
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Không tải được danh sách chat');
      } finally {
        setIsLoadingRooms(false);
      }
    };
    void fetchRooms();
  }, [user?.id, isAuthenticated, token, focusRoomId]);

  useEffect(() => {
    const roomId = String(roomIdOf(activeRoom) || '');
    if (!roomId) return;
    const fetchMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const res = await chatService.getAllMessages(roomId);
        const list = Array.isArray(res) ? res : (res?.items || res?.data || []);
        setMessages(normalizeMessages(list));
        await joinRoom(roomId);
      } catch {
        setMessages([]);
      } finally {
        setIsLoadingMessages(false);
      }
    };
    void fetchMessages();
  }, [activeRoom, joinRoom, setMessages]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, activeRoom]);

  useEffect(() => {
    if (!user?.id || !notifications?.length) return;
    void refreshRooms();
  }, [notifications.length, user?.id]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !activeRoom) return;
    const content = inputMsg.trim();
    if (!content && mediaPreviews.length === 0) return;

    try {
      const receiverId = otherPartyIdOf(activeRoom, user?.id);
      if (!receiverId) {
        toast.error('Không tìm thấy người nhận tin nhắn.');
        return;
      }

      let effectiveRoomId = String(roomIdOf(activeRoom) || '');
      if (!effectiveRoomId) {
        const roomRes = await chatService.getOrCreateRoom(user.id, receiverId);
        effectiveRoomId = String(roomRes?.roomId || roomRes?.RoomId || roomRes?.id || roomRes?.Id || roomRes || '');
        if (!effectiveRoomId) {
          toast.error('Không tạo được phòng chat');
          return;
        }
        await joinRoom(effectiveRoomId);
      }

      if (content) {
        setMessages((prev: any[]) => ([
          ...prev,
          {
            id: `local-${Date.now()}`,
            senderId: user.id,
            content,
            createdAt: new Date().toISOString(),
            isRead: true,
          }
        ]));
        setInputMsg('');
        await chatService.insertMessage({ senderId: user.id, receiverId, content } as any);
      }

      if (mediaPreviews.length > 0) {
        toast('Gửi ảnh/video sẽ được đồng bộ khi backend hỗ trợ upload từ UI này.');
        setMediaPreviews([]);
      }

      await refreshRooms();
      setUnreadByRoom(prev => ({ ...prev, [effectiveRoomId]: 0 }));
    } catch {
      toast.error('Gửi tin nhắn thất bại');
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach((file) => setMediaPreviews(prev => [...prev, { url: URL.createObjectURL(file), name: file.name }]));
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const currentRoomId = String(roomIdOf(activeRoom) || '');

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-[calc(100vh-130px)] min-h-[620px] flex flex-col">
      <div className="mb-4 rounded-2xl border border-white/10 bg-gradient-to-br from-[#111a2d] to-[#0a1122] px-5 py-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Liên hệ Kỹ thuật viên</h1>
        <p className="mt-1 text-xs md:text-sm text-zinc-400">Trao đổi trực tiếp với thợ để cập nhật tiến độ sửa chữa.</p>
      </div>

      <div className="flex-1 flex bg-[#0b1220] border border-white/10 rounded-[22px] overflow-hidden shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
        <div className="w-80 border-r border-white/10 bg-[#0f1728] flex flex-col hidden md:flex min-w-[320px]">
          <div className="p-4 border-b border-white/10">
            <Input placeholder="Tìm kiếm thợ..." className="bg-[#0b1323] border-white/15 text-white placeholder:text-zinc-500 rounded-xl h-11" />
          </div>
          <div className="flex-1 overflow-y-auto w-full">
            {isLoadingRooms ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
            ) : rooms.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-sm">Chưa có cuộc hội thoại nào</div>
            ) : (
              rooms.map((room) => {
                const rid = String(roomIdOf(room) || '');
                const unread = unreadByRoom[rid] || 0;
                const active = currentRoomId === rid;
                return (
                  <div
                    key={rid}
                    onClick={() => { setActiveRoom(room); setUnreadByRoom(prev => ({ ...prev, [rid]: 0 })); }}
                    className={`flex items-center gap-3 p-4 cursor-pointer transition-all duration-200 border-l-2 ${active ? 'bg-[#111d34] border-[#4f8cff]' : 'border-transparent hover:bg-[#141f35]'}`}
                  >
                    <Avatar className="w-12 h-12 border border-white/10">
                      <AvatarFallback className="bg-primary/20 text-primary-light">{(otherPartyNameOf(room) || 'T')[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <h4 className={`truncate text-sm ${unread > 0 ? 'font-bold text-white' : 'font-semibold text-white'}`}>{otherPartyNameOf(room)}</h4>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {unread > 0 && <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_0_2px_rgba(239,68,68,0.15)]" />}
                          <span className="text-[10px] text-zinc-500">{lastUpdateOf(room) ? new Date(lastUpdateOf(room)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                        </div>
                      </div>
                      <p className={`text-xs truncate ${unread > 0 ? 'text-zinc-200 font-semibold' : 'text-zinc-400'}`}>{roomLastMessageOf(room)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-gradient-to-b from-[#091427] to-[#0b1220]">
          {activeRoom ? (
            <>
              <div className="h-16 border-b border-white/10 px-6 flex items-center justify-between bg-[#0f1b33]">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="w-10 h-10 border border-white/10 overflow-hidden">
                    <AvatarFallback className="bg-primary/20 text-primary-light">{(otherPartyNameOf(activeRoom) || 'T')[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white text-sm truncate">{otherPartyNameOf(activeRoom)}</h3>
                    <p className="text-xs text-green-400 font-medium animate-pulse">Trực tuyến</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white rounded-full"><Phone className="w-5 h-5" /></Button>
                  <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white rounded-full"><Video className="w-5 h-5" /></Button>
                  <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white rounded-full"><MoreVertical className="w-5 h-5" /></Button>
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-[radial-gradient(circle_at_top,#142443_0%,#0b1220_55%,#0a1020_100%)]">
                {isLoadingMessages && <div className="flex justify-center"><Loader2 className="animate-spin text-primary w-5 h-5" /></div>}
                <AnimatePresence initial={false}>
                  {messages.map((msg: any, idx: number) => {
                    const senderId = msg.senderId || msg.SenderId;
                    const isMe = String(senderId) === String(user?.id);
                    const stableBase = String(msg.id || msg.Id || `${senderId || 'unknown'}-${msg.createdAt || msg.CreatedAt || msg.time || 'na'}`);
                    const stableKey = `${stableBase}-${idx}`;
                    return (
                      <motion.div key={stableKey} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {!isMe && <Avatar className="w-8 h-8 mr-2 mt-auto"><AvatarFallback className="text-[10px]">T</AvatarFallback></Avatar>}
                        <div className={`max-w-[74%] rounded-2xl overflow-hidden shadow-lg ${isMe ? 'bg-gradient-to-br from-[#2f7dff] to-[#1d61e7] text-white rounded-br-sm border border-blue-400/30' : 'bg-[#14253f] text-zinc-100 border border-white/10 rounded-bl-sm'}`}>
                          <div className="px-5 py-3.5">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content || msg.text}</p>
                            <p className="text-[10px] mt-1.5 text-right opacity-60">{new Date(msg.createdAt || msg.time || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {mediaPreviews.length > 0 && (
                <div className="px-4 py-2 border-t border-white/5 bg-[#0a1122] flex gap-2 flex-wrap">
                  {mediaPreviews.map((media, idx) => (
                    <div key={idx} className="relative group">
                      <img src={media.url} className="w-16 h-16 rounded-xl object-cover border border-white/10" alt={media.name} />
                      <button type="button" onClick={() => setMediaPreviews(p => p.filter((_, i) => i !== idx))} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-4 bg-[#0a1122] border-t border-white/5">
                <input ref={imageInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
                <form onSubmit={sendMessage} className="flex items-center gap-2">
                  <Button type="button" variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-white/10 hidden sm:flex" onClick={() => imageInputRef.current?.click()} title="Gửi ảnh">
                    <ImageIcon className="w-5 h-5" />
                  </Button>
                  <div className="flex-1 relative">
                    <Input value={inputMsg} onChange={(e) => setInputMsg(e.target.value)} placeholder="Nhập tin nhắn..." className="w-full bg-[#050b18] border-white/10 text-white rounded-full h-12 focus-visible:ring-primary" />
                  </div>
                  <Button type="submit" className="bg-primary hover:bg-primary-dark text-white rounded-full w-12 h-12 p-0 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20 transition-transform active:scale-95" disabled={!inputMsg.trim() && mediaPreviews.length === 0}>
                    <Send className="w-5 h-5" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
              <h3 className="text-lg font-medium">Chọn một cuộc trò chuyện để bắt đầu</h3>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
