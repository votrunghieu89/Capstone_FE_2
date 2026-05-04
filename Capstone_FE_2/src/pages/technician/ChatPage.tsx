import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, User, Search,
  MoreVertical, Paperclip, Smile,
  CheckCheck, ChevronLeft, Loader2
} from 'lucide-react';
import chatService from '@/services/chatService';
import useAuthStore from '@/store/authStore';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { useChatSignalR } from '@/hooks/useChatSignalR';

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

interface Contact {
  id: string;
  name: string;
  avatar?: string;
  lastMessage?: string;
  time?: string;
  unreadCount?: number;
  isOnline?: boolean;
}

const roomIdOf = (room: any) => room?.id || room?.Id || room?.roomId || room?.RoomId;
const otherPartyIdOf = (room: any, currentUserId?: string) => {
  const candidates = [
    room?.otherPartyId, room?.OtherPartyId,
    room?.otherId, room?.OtherId,
    room?.customerId, room?.CustomerId,
    room?.technicianId, room?.TechnicianId,
    room?.userA, room?.userB,
  ].map((v) => String(v || '').trim()).filter(Boolean);

  if (!currentUserId) return candidates[0] || '';
  const match = candidates.find((id) => id !== String(currentUserId).trim());
  return match || candidates[0] || '';
};
const otherPartyNameOf = (room: any) => room?.otherPartyName || room?.OtherPartyName || room?.userName || room?.UserName || room?.customerName || room?.CustomerName || room?.technicianName || room?.TechnicianName || 'Khách hàng';
const lastUpdateOf = (room: any) => room?.lastUpdate || room?.LastUpdate || room?.lastMessageTime || room?.LastMessageTime;
const normalizeRoomList = (list: any[], currentUserId?: string) => (list || []).map((r: any) => ({
  id: String(roomIdOf(r) || ''),
  name: otherPartyNameOf(r),
  avatar: r?.avatarUrl || r?.AvatarUrl,
  lastMessage: r?.lastMessage || r?.LastMessage || 'Chưa có tin nhắn',
  time: lastUpdateOf(r) ? new Date(lastUpdateOf(r)).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '',
  unreadCount: Number(r?.unreadCount || r?.UnreadCount || 0),
  isOnline: Boolean(r?.isOnline ?? r?.IsOnline ?? false),
  otherPartyId: otherPartyIdOf(r, currentUserId),
}));

export default function ChatPage() {
  const { user } = useAuthStore();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isRefreshingRoomsRef = useRef(false);
  const lastRefreshAtRef = useRef(0);
  const { connection, notifications, setMessages: setSignalMessages, joinRoom } = useChatSignalR();

  const normalizeMessages = (raw: any[]) => (raw || []).map((m: any) => ({
    id: m?.id || m?.Id || m?.messengerId || m?.MessengerId || `${m?.senderId || m?.SenderId}-${m?.createdAt || m?.CreatedAt || Date.now()}`,
    senderId: m?.senderId || m?.SenderId,
    content: m?.content || m?.Content || '',
    timestamp: new Date(m?.createdAt || m?.CreatedAt || m?.sentTime || m?.SentTime || Date.now()).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    isRead: Boolean(m?.isRead ?? m?.IsRead ?? false)
  }));

  const refreshRooms = async (preferRoomId?: string, preferOtherId?: string, autoSelect = true) => {
    if (!user?.id) return [] as any[];

    isRefreshingRoomsRef.current = true;
    lastRefreshAtRef.current = Date.now();
    try {
      console.group('🔍 [Technician] GET /api/chat/rooms/{accountId}');
      console.log('accountId  :', String(user.id));
      console.groupEnd();

      const res = await chatService.getAllRooms(user.id);
      const list = Array.isArray(res) ? res : (res?.items || res?.data || []);
      const mapped = normalizeRoomList(list, user.id);

      setContacts(mapped);

      const preferred = (preferRoomId && mapped.find((r) => r.id === String(preferRoomId)))
        || (preferOtherId && mapped.find((r: any) => String(r.otherPartyId || '').trim() === String(preferOtherId).trim()))
        || mapped[0]
        || null;

      if (preferred && autoSelect) setSelectedContact(preferred);
      return mapped;
    } catch (err: any) {
      if (err?.response?.status !== 404) {
        console.error('Failed to load rooms', err);
      }
      setContacts([]);
      return [] as any[];
    } finally {
      isRefreshingRoomsRef.current = false;
    }
  };

  useEffect(() => {
    if (!user?.id) {
      setIsLoadingRooms(false);
      return;
    }
    const run = async () => {
      setIsLoadingRooms(true);
      const list = await refreshRooms(undefined, undefined, false);
      // Chỉ chọn room đầu tiên khi chưa có room nào được chọn trước đó
      if (!selectedContact && list.length > 0) {
        setSelectedContact(list[0]);
      }
      setIsLoadingRooms(false);
    };
    run();
  }, [user?.id, selectedContact]);

  useEffect(() => {
    if (!user?.id || !connection) return;
    const handler = async (message: any) => {
      const roomId = String(message?.roomId || message?.RoomId || message?.roomID || '');
      if (!roomId) return;

      const currentRoomId = String(selectedContact?.id || '');
      const isActiveRoom = currentRoomId && currentRoomId === roomId;

      if (isActiveRoom) {
        const normalizedIncoming: Message = {
          id: String(message?.MessId || message?.messId || message?.id || message?.Id || `${roomId}-${Date.now()}`),
          senderId: String(message?.SenderId || message?.senderId || ''),
          content: String(message?.Content || message?.content || ''),
          timestamp: new Date(message?.CreatedAt || message?.createdAt || Date.now()).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          isRead: Boolean(message?.IsRead ?? message?.isRead ?? false),
        };

        setMessages((prev) => {
          if (prev.some((m) => String(m.id) === String(normalizedIncoming.id))) return prev;
          return [...prev, normalizedIncoming];
        });
        setSignalMessages((prev: any[]) => {
          if (prev.some((m: any) => String(m?.id || m?.Id || m?.MessId) === String(normalizedIncoming.id))) return prev;
          return [...prev, normalizedIncoming] as any;
        });
      } else {
        // Chỉ tăng unread khi chưa mở phòng đó, không tự mở phòng chat
        setContacts((prev) => prev.map((c: any) => String(c.id) === roomId
          ? {
            ...c,
            unreadCount: Number(c.unreadCount || 0) + 1,
            lastMessage: message?.content || message?.Content || c.lastMessage,
          }
          : c
        ));
      }

      // làm mới danh sách nhưng không auto select room mới
      await refreshRooms(undefined, undefined, false);
    };

    connection.on('ChatMessage', handler);
    connection.on('NewMessageNotification', handler);
    return () => {
      connection.off('ChatMessage', handler as any);
      connection.off('NewMessageNotification', handler as any);
    };
  }, [connection, user?.id, selectedContact?.id]);

  useEffect(() => {
    if (!user?.id || !notifications?.length) return;
    void refreshRooms(undefined, undefined, false);
  }, [notifications.length, user?.id]);

  useEffect(() => {
    const roomId = selectedContact?.id;
    if (!roomId) return;
    const run = async () => {
      setIsLoadingMessages(true);
      try {
        const res = await chatService.getAllMessages(roomId);
        const rawMsgs = Array.isArray(res) ? res : (res?.items || res?.data || []);
        const normalized = normalizeMessages(rawMsgs);
        setMessages(normalized);
        setSignalMessages(normalized as any);
        try {
          await joinRoom(roomId);
        } catch (joinErr) {
          console.error('JoinRoom failed', joinErr);
        }
      } catch (err: any) {
        const status = err?.response?.status;
        if (status !== 404) console.error('Lỗi tải tin nhắn:', err);
        setMessages([]);
      } finally {
        setIsLoadingMessages(false);
      }
    };
    run();
  }, [selectedContact?.id, connection]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || !selectedContact || !user?.id) return;

    const receiverId = (selectedContact as any).otherPartyId || selectedContact.id;
    if (!receiverId) {
      toast.error('Không xác định được người nhận');
      return;
    }

    const content = inputValue.trim();
    // Không append optimistic để tránh trùng tin với realtime event từ server
    setInputValue('');

    try {
      const room = await chatService.getOrCreateRoom(user.id, String(receiverId));
      const roomId = room?.roomId || room?.RoomId || room?.id || room?.Id || selectedContact.id;
      await chatService.insertMessage({
        senderId: user.id,
        receiverId: String(receiverId),
        content,
      } as any);
      const updatedRooms = await refreshRooms(roomId, String(receiverId));
      const pickedRoom = updatedRooms.find((r: any) => String(r.id) === String(roomId)) || updatedRooms.find((r: any) => String(r.otherPartyId || '') === String(receiverId)) || null;
      if (pickedRoom) {
        setSelectedContact(pickedRoom);
        await joinRoom(String(pickedRoom.id));
      } else {
        await joinRoom(String(roomId));
      }
    } catch (err) {
      toast.error('Gửi tin nhắn thất bại');
    }
  };

  const filteredContacts = contacts.filter((c) =>
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-[calc(100vh-130px)] min-h-[620px] w-full max-w-[1320px] mx-auto flex flex-col">
      <div className="mb-5 rounded-2xl border border-white/10 bg-gradient-to-br from-[#111a2d] to-[#0a1122] px-5 py-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Tin nhắn khách hàng</h1>
        <p className="mt-1 text-xs md:text-sm text-zinc-400">Trao đổi trực tiếp để hỗ trợ và cập nhật tiến độ sửa chữa.</p>
      </div>

      <div className="flex-1 flex bg-[#0b1220] border border-white/10 rounded-[22px] overflow-hidden shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
        <div className={cn(
          "w-full lg:w-[380px] border-r border-white/10 bg-[#0f1728] flex flex-col transition-all",
          selectedContact ? "hidden lg:flex" : "flex"
        )}>
          <div className="px-8 pt-4 pb-0">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              {contacts.reduce((sum, c) => sum + Number(c.unreadCount || 0), 0)} tin chưa đọc
            </div>
          </div>
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Tin Nhắn</h1>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                <User size={16} />
              </div>
            </div>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Tìm kiếm khách hàng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0b1323] border border-white/15 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-bold"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar">
            {isLoadingRooms ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
            ) : filteredContacts.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">Chưa có cuộc hội thoại nào</div>
            ) : filteredContacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => {
                  setSelectedContact(contact);
                  setContacts((prev) => prev.map((c) => c.id === contact.id ? { ...c, unreadCount: 0 } : c));
                }}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-3xl transition-all group relative overflow-hidden",
                  selectedContact?.id === contact.id ? "bg-[#1d4ed8] shadow-xl shadow-blue-900/35" : "hover:bg-[#141f35]"
                )}
              >
                <div className="relative z-10">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center border transition-all",
                    selectedContact?.id === contact.id ? "bg-white/10 border-white/20" : "bg-slate-800/50 border-white/5"
                  )}>
                    <User className={cn("w-7 h-7", selectedContact?.id === contact.id ? "text-white" : "text-slate-500")} />
                  </div>
                </div>

                <div className="flex-1 text-left min-w-0 relative z-10">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className={cn("font-black text-sm uppercase tracking-tight truncate", selectedContact?.id === contact.id ? "text-white" : "text-slate-200")}>{contact.name}</h3>
                    <span className={cn("text-[10px] font-black uppercase tracking-widest", selectedContact?.id === contact.id ? "text-blue-100" : "text-slate-600")}>{contact.time}</span>
                  </div>
                  <p className={cn("text-xs font-medium truncate", selectedContact?.id === contact.id ? "text-blue-100/70" : "text-slate-500")}>{contact.lastMessage}</p>
                </div>

                {contact.unreadCount! > 0 && selectedContact?.id !== contact.id && (
                  <div className="w-6 h-6 rounded-xl bg-blue-500 flex items-center justify-center text-[10px] font-black text-white shadow-lg shadow-blue-500/30 relative z-10">
                    {contact.unreadCount}
                  </div>
                )}

                {selectedContact?.id === contact.id && (
                  <motion.div
                    layoutId="active-chat-bg"
                    className="absolute inset-0 bg-blue-600 -z-0"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {selectedContact ? (
            <motion.div
              key="chat-active"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 flex flex-col bg-gradient-to-b from-[#091427] to-[#0b1220]"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between backdrop-blur-xl bg-[#0f172a]/20">
                <div className="flex items-center gap-4">
                  <button onClick={() => setSelectedContact(null)} className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors">
                    <ChevronLeft size={24} />
                  </button>
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                    <User size={24} />
                  </div>
                  <div>
                    <h2 className="font-black text-white text-base leading-tight uppercase tracking-tight">{selectedContact.name}</h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className={cn("w-1.5 h-1.5 rounded-full", selectedContact.isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-600")} />
                      <p className={cn("text-[10px] font-black uppercase tracking-widest", selectedContact.isOnline ? "text-emerald-500" : "text-slate-600")}>{selectedContact.isOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button className="p-3 bg-white/5 rounded-xl text-slate-500 hover:text-slate-200 transition-colors border border-white/5 group">
                    <MoreVertical size={20} className="group-hover:rotate-90 transition-transform" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-[radial-gradient(circle_at_top,#142443_0%,#0b1220_55%,#0a1020_100%)]">
                {isLoadingMessages && (
                  <div className="flex justify-center"><Loader2 className="animate-spin text-primary w-5 h-5" /></div>
                )}
                {messages.length === 0 && !isLoadingMessages && (
                  <div className="flex flex-col items-center justify-center h-full opacity-10">
                    <div className="bg-white/5 p-12 rounded-[60px] border border-white/10 mb-6">
                      <Smile size={84} className="text-white" />
                    </div>
                    <p className="font-black uppercase tracking-[0.3em] text-white text-xs">Phát tín hiệu kết nối...</p>
                  </div>
                )}
                {messages.map((msg) => {
                  const isMine = String(msg.senderId) === String(user?.id);
                  return (
                    <div key={msg.id} className={cn("flex w-full group/msg", isMine ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[75%] space-y-2", isMine ? "items-end" : "items-start")}>
                        <div className={cn(
                          "px-5 py-4 rounded-[32px] text-sm font-bold leading-relaxed shadow-2xl transition-transform hover:scale-[1.02]",
                          isMine ? "bg-gradient-to-br from-[#2f7dff] to-[#1d61e7] text-white rounded-tr-none border border-blue-400/30 shadow-blue-700/30" : "bg-[#14253f] text-zinc-100 border border-white/10 rounded-tl-none"
                        )}>
                          {msg.content}
                        </div>
                        <div className={cn("flex items-center gap-2 px-2 opacity-0 group-hover/msg:opacity-100 transition-opacity", isMine ? "flex-row-reverse" : "flex-row")}>
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{msg.timestamp}</span>
                          {isMine && <CheckCheck className="w-3.5 h-3.5 text-blue-500" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={scrollRef} />
              </div>

              <div className="p-6 bg-[#0f172a]/20 border-t border-white/5 backdrop-blur-md">
                <div className="flex items-center gap-3 max-w-5xl mx-auto">
                  <button className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-500 hover:text-blue-400 transition-all border border-white/5 active:scale-95">
                    <Paperclip size={20} />
                  </button>

                  <div className="flex-1 relative group">
                    <textarea
                      rows={1}
                      placeholder="Viết tin nhắn cho khách hàng..."
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-[28px] py-4 px-14 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all resize-none min-h-[56px] max-h-[150px] font-bold"
                    />
                    <button className="absolute left-4 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-amber-500 transition-colors">
                      <Smile size={24} />
                    </button>
                  </div>

                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim()}
                    className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] hover:bg-blue-500 disabled:opacity-50 disabled:grayscale transition-all active:scale-95 group/send"
                  >
                    <Send size={24} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="chat-empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 hidden lg:flex flex-col items-center justify-center bg-[#020617]/10 p-12 text-center"
            >
              <div className="relative group">
                <div className="absolute -inset-8 bg-blue-600/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <div className="relative w-32 h-32 rounded-[48px] bg-white/5 flex items-center justify-center mb-10 border border-white/5 shadow-2xl scale-110 group-hover:rotate-12 transition-transform duration-700">
                  <Send className="w-16 h-16 text-blue-500" />
                </div>
              </div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Trung Tâm Liên Lạc</h2>
              <p className="text-slate-500 text-sm max-w-sm mx-auto font-medium leading-relaxed uppercase tracking-widest opacity-60">
                Chọn một khách hàng để bắt đầu thảo luận công việc và hỗ trợ kỹ thuật
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}