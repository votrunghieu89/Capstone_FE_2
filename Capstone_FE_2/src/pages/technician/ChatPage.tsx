import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, User, Search, 
  MoreVertical, Paperclip, Smile,
  CheckCheck, ChevronLeft, Loader2
} from 'lucide-react';
import chatService from '@/services/chatService';
import useAuthStore from '@/store/authStore';
import { useChatSignalR } from '@/hooks/useChatSignalR';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  roomId?: string;
  senderId: string;
  content: string;
  createdAt: string;
  isRead?: boolean;
}

interface ContactRoom {
  roomId: string;
  otherId: string;
  otherName: string;
  otherAvatar?: string;
  lastMessage?: string;
  updatedAt?: string;
  unreadCount?: number;
  isOnline?: boolean;
}

export default function ChatPage() {
  const { user } = useAuthStore();
  const [contacts, setContacts] = useState<ContactRoom[]>([]);
  const [selectedContact, setSelectedContact] = useState<ContactRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const skipNewIncomingSignalRTrigger = useRef(0);

  // Lắng nghe SignalR
  const { connection, messages: incomingSignalRMessages, setMessages: setSignalRSrc } = useChatSignalR();

  // 1. Tải danh sách phòng lúc đầu
  const fetchRooms = async () => {
    if (!user?.id) return;
    try {
      setIsLoadingRooms(true);
      const res = await chatService.getAllRooms(user.id, 1, 100);
      const rooms: ContactRoom[] = res.map((r: any) => ({
        roomId: r.roomId || r.id,
        otherId: r.receiverId || r.otherId || 'unknown',
        otherName: r.receiverName || r.otherName || 'Khách hàng',
        otherAvatar: r.receiverAvatar || r.otherAvatar,
        lastMessage: r.lastMessage || r.content || '',
        updatedAt: r.updatedAt || r.lastUpdate || r.createdAt,
        unreadCount: r.unreadCount || 0,
        isOnline: Math.random() > 0.5 // mock online for UI feel
      }));
      setContacts(rooms);
    } catch (e) {
      console.error('Failed to load chat rooms:', e);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [user?.id]);

  // 2. Chuyển phòng chat => Tải lịch sử phòng
  useEffect(() => {
    const fetchHistory = async () => {
      if (!selectedContact?.roomId || !user?.id) return;
      try {
        setIsLoadingMessages(true);
        const res = await chatService.getAllMessages(selectedContact.roomId, 1, 100);
        const hist: Message[] = res.map((m: any) => ({
          id: m.id || Math.random().toString(),
          roomId: m.roomId,
          senderId: m.senderId,
          content: m.content,
          createdAt: m.createdAt,
          isRead: m.isRead
        })).reverse(); // Đảo ngược nếu API trả về timeline từ mới tới cũ
        
        setMessages(hist);
        
        // Đánh dấu đã đọc
        await chatService.markAsRead(selectedContact.roomId, user.id);
        setContacts(prev => prev.map(c => 
           c.roomId === selectedContact.roomId ? { ...c, unreadCount: 0 } : c
        ));
      } catch (e) {
        toast.error('Lỗi tải tin nhắn cũ');
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchHistory();
  }, [selectedContact?.roomId, user?.id]);

  // Cuộn xuống
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 3. Lắng nghe tin nhắn mới từ SignalR
  useEffect(() => {
    if (incomingSignalRMessages.length === 0) return;
    if (incomingSignalRMessages.length <= skipNewIncomingSignalRTrigger.current) return;
    
    // Lấy object tin nhắn mới nhất
    const newlyRecv = incomingSignalRMessages[incomingSignalRMessages.length - 1];
    skipNewIncomingSignalRTrigger.current = incomingSignalRMessages.length;

    const roomIdCmp = newlyRecv.roomId || newlyRecv.RoomId;
    const isForCurrentRoom = selectedContact && (selectedContact.roomId === roomIdCmp);

    // Cập nhật lên màn hình nếu đang ở phòng đó
    if (isForCurrentRoom) {
      setMessages(prev => [...prev, {
        id: newlyRecv.id || Date.now().toString(),
        roomId: roomIdCmp,
        senderId: newlyRecv.senderId || newlyRecv.SenderId,
        content: newlyRecv.content || newlyRecv.Content,
        createdAt: newlyRecv.createdAt || newlyRecv.CreatedAt || new Date().toISOString()
      }]);
      // Gọi markAsRead ngầm
      if (user?.id) chatService.markAsRead(selectedContact.roomId, user.id).catch(()=>{});
    }

    // Luôn nâng phòng đó lên đầu của mảng contacts
    setContacts(prev => {
      const idx = prev.findIndex(c => c.roomId === roomIdCmp);
      if (idx !== -1) {
        const item = { ...prev[idx] };
        item.lastMessage = newlyRecv.content || newlyRecv.Content;
        item.updatedAt = newlyRecv.createdAt || newlyRecv.CreatedAt || new Date().toISOString();
        if (!isForCurrentRoom) item.unreadCount = (item.unreadCount || 0) + 1;
        
        const nextArr = [...prev];
        nextArr.splice(idx, 1);
        nextArr.unshift(item);
        return nextArr;
      } else {
        // Đã nhận tin nhắn từ phòng mới toanh => reload d/s
        fetchRooms();
        return prev;
      }
    });

  }, [incomingSignalRMessages, selectedContact]);

  // Gửi tin nhắn action
  const handleSend = async () => {
    if (!inputValue.trim() || !selectedContact || !user?.id) return;

    const messageText = inputValue.trim();
    setInputValue('');

    const tempId = Date.now().toString();
    const isoTime = new Date().toISOString();

    const tempMessage: Message = {
      id: tempId,
      roomId: selectedContact.roomId,
      senderId: user.id,
      content: messageText,
      createdAt: isoTime,
      isRead: false
    };
    
    // Hiển thị ngay lên màn hình (Lạc quan)
    setMessages(prev => [...prev, tempMessage]);
    setContacts(prev => {
        const idx = prev.findIndex(c => c.roomId === selectedContact.roomId);
        if (idx !== -1) {
            const arr = [...prev];
            const item = { ...arr[idx], lastMessage: messageText, updatedAt: isoTime };
            arr.splice(idx, 1);
            arr.unshift(item);
            return arr;
        }
        return prev;
    });

    try {
      await chatService.insertMessage({
        senderId: user.id,
        receiverId: selectedContact.otherId,
        content: messageText
      });
    } catch (err) {
      toast.error('Gửi tin nhắn thất bại');
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  const displayTime = (isoString?: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    const now = new Date();
    if (d.getDate() === now.getDate() && d.getMonth() === now.getMonth()) {
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  const filteredContacts = contacts.filter(c => c.otherName?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row bg-[#0f172a]/40 backdrop-blur-xl rounded-[40px] border border-white/5 overflow-hidden shadow-2xl animate-in fade-in duration-500 relative z-20">
      
      {/* Sidebar - Contact List */}
      <div className={cn(
        "w-full lg:w-[380px] border-r border-white/5 flex flex-col transition-all bg-[#0a0f1c]/50",
        selectedContact ? "hidden lg:flex" : "flex"
      )}>
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Liên Hệ</h1>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-500/20">
               <User size={16} />
            </div>
          </div>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500/50 w-4 h-4 group-focus-within:text-blue-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Tìm khách hàng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111827]/80 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 transition-all font-bold shadow-inner"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 custom-scrollbar">
          {isLoadingRooms ? (
             <div className="flex justify-center p-10"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
          ) : filteredContacts.length === 0 ? (
             <div className="text-center p-10 opacity-50 space-y-2"><p className="text-sm font-bold text-slate-400">Không có đoạn chat nào</p></div>
          ) : (
            filteredContacts.map((contact) => (
              <button
                key={contact.roomId}
                onClick={() => setSelectedContact(contact)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-3xl transition-all group relative overflow-hidden",
                  selectedContact?.roomId === contact.roomId 
                    ? "bg-blue-600 shadow-xl shadow-blue-600/20" 
                    : "hover:bg-white/5"
                )}
              >
                <div className="relative z-10 shrink-0">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center border transition-all object-cover overflow-hidden",
                    selectedContact?.roomId === contact.roomId ? "bg-white/10 border-white/20" : "bg-slate-800/50 border-white/5"
                  )}>
                    {contact.otherAvatar ? (
                       <img src={contact.otherAvatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                       <User className={cn("w-7 h-7", selectedContact?.roomId === contact.roomId ? "text-white" : "text-slate-500")} />
                    )}
                  </div>
                  {contact.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-[#0a0f1c] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  )}
                </div>
                
                <div className="flex-1 text-left min-w-0 relative z-10">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <h3 className={cn("font-black text-[13px] uppercase tracking-tight truncate", selectedContact?.roomId === contact.roomId ? "text-white" : "text-slate-200")}>
                      {contact.otherName}
                    </h3>
                    <span className={cn("text-[10px] font-black uppercase tracking-widest shrink-0", selectedContact?.roomId === contact.roomId ? "text-blue-100" : "text-slate-600")}>
                      {displayTime(contact.updatedAt)}
                    </span>
                  </div>
                  <p className={cn("text-xs font-medium truncate", selectedContact?.roomId === contact.roomId ? "text-blue-100/80" : "text-slate-500")}>
                    {contact.lastMessage || 'Bạn đã được kết nối...'}
                  </p>
                </div>

                {contact.unreadCount! > 0 && selectedContact?.roomId !== contact.roomId && (
                  <div className="shrink-0 w-6 h-6 rounded-xl bg-blue-500 flex items-center justify-center text-[10px] font-black text-white shadow-lg shadow-blue-500/30 relative z-10">
                    {contact.unreadCount}
                  </div>
                )}

                {selectedContact?.roomId === contact.roomId && (
                  <motion.div 
                    layoutId="active-chat-bg"
                    className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-500 -z-0"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Window */}
      <AnimatePresence mode="wait">
        {selectedContact ? (
          <motion.div 
            key="chat-active"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 flex flex-col bg-gradient-to-br from-[#0f172a]/20 to-[#020617]/40 relative z-10"
          >
            {/* Top Bar */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between backdrop-blur-3xl bg-[#0f172a]/40 shadow-sm z-30">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedContact(null)}
                  className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <div className="w-12 h-12 rounded-[18px] bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20 overflow-hidden shrink-0">
                  {selectedContact.otherAvatar ? (
                     <img src={selectedContact.otherAvatar} alt="avatar" className="w-full h-full object-cover" />
                  ) : <User size={22} />}
                </div>
                <div>
                  <h2 className="font-black text-white text-base leading-tight uppercase tracking-tight">{selectedContact.otherName}</h2>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className={cn("w-1.5 h-1.5 rounded-full shadow-lg", selectedContact.isOnline ? "bg-emerald-500 shadow-emerald-500/50 animate-pulse" : "bg-slate-600")} />
                    <p className={cn("text-[10px] font-black uppercase tracking-widest", selectedContact.isOnline ? "text-emerald-500" : "text-slate-600")}>
                      {selectedContact.isOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="p-3 bg-white/5 rounded-xl text-slate-500 hover:text-slate-200 transition-colors border border-white/5 group active:scale-95">
                   <MoreVertical size={20} className="group-hover:rotate-90 transition-transform" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar z-20">
              {isLoadingMessages ? (
                 <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-30 select-none">
                  <div className="bg-white/5 p-10 rounded-[40px] border border-white/10 mb-6 shadow-2xl">
                     <Smile size={64} className="text-slate-300" />
                  </div>
                  <p className="font-black uppercase tracking-[0.3em] text-white text-[11px]">Gửi lời chào tới khách hàng!</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMine = msg.senderId === user?.id;
                  const prevMine = index > 0 && messages[index - 1].senderId === user?.id;
                  const chain = prevMine === isMine;

                  return (
                    <div 
                      key={msg.id}
                      className={cn(
                        "flex w-full group/msg",
                        isMine ? "justify-end" : "justify-start",
                        chain ? "mt-2" : "mt-8"
                      )}
                    >
                      <div className={cn(
                        "max-w-[75%] lg:max-w-[65%] space-y-1.5",
                        isMine ? "items-end" : "items-start"
                      )}>
                        <div className={cn(
                          "px-6 py-4 text-[13.5px] font-semibold leading-relaxed shadow-xl transition-all duration-300 hover:scale-[1.01]",
                          isMine 
                            ? "bg-gradient-to-tr from-blue-600 to-blue-500 text-white shadow-blue-500/20" 
                            : "bg-[#181f33] text-slate-100 border border-[#2a344a]",
                          isMine ? "rounded-[24px] rounded-tr-sm" : "rounded-[24px] rounded-tl-sm"
                        )}>
                          {msg.content}
                        </div>
                        <div className={cn(
                          "flex items-center gap-2 px-2 opacity-0 group-hover/msg:opacity-100 transition-opacity",
                          isMine ? "flex-row-reverse" : "flex-row"
                        )}>
                          <span className="text-[9px] font-black text-slate-500/70 uppercase tracking-widest">{displayTime(msg.createdAt)}</span>
                          {isMine && <CheckCheck className={cn("w-3.5 h-3.5", msg.isRead ? "text-emerald-400" : "text-blue-400/50")} />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            <div className="p-5 lg:p-6 bg-[#0a0f1c]/80 border-t border-white/5 backdrop-blur-2xl z-30">
              <div className="flex items-end gap-3 max-w-5xl mx-auto">
                <button className="shrink-0 w-14 h-14 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-blue-400 transition-all border border-white/5 flex items-center justify-center shadow-sm active:scale-95 group">
                   <Paperclip size={22} className="group-hover:rotate-12 transition-transform" />
                </button>
                
                <div className="flex-1 relative group bg-[#111827]/80 rounded-[24px] border border-white/5 shadow-inner transition-all focus-within:border-blue-500/30 focus-within:ring-1 focus-within:ring-blue-500/30">
                  <textarea 
                    rows={1}
                    placeholder="Soạn tin nhắn cho khách hàng..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    className="w-full bg-transparent py-4 pl-14 pr-5 text-[14px] text-slate-100 placeholder:text-slate-600 focus:outline-none resize-none min-h-[56px] max-h-[140px] font-bold custom-scrollbar"
                  />
                  <button className="absolute left-4 top-4 p-1 text-slate-500 hover:text-amber-400 transition-colors">
                     <Smile size={22} />
                  </button>
                </div>

                <button 
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  className="shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center shadow-[0_4px_20px_rgba(37,99,235,0.4)] hover:shadow-[0_4px_30px_rgba(37,99,235,0.6)] disabled:opacity-50 disabled:grayscale transition-all active:scale-95 group/send"
                >
                  <Send size={22} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform drop-shadow" />
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="chat-empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 hidden lg:flex flex-col items-center justify-center bg-gradient-to-b from-[#020617]/40 to-transparent p-12 text-center border-l bg-noise border-white/5 z-0"
          >
            <div className="relative group perspective-1000">
              <div className="absolute -inset-10 bg-blue-600/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              <div className="relative w-36 h-36 rounded-[48px] bg-gradient-to-br from-[#1e293b]/50 to-[#0f172a] flex items-center justify-center mb-10 border border-white/10 shadow-2xl scale-110 group-hover:rotate-12 transition-transform duration-700">
                 <div className="absolute inset-0 rounded-[48px] border border-blue-500/20 shadow-[inset_0_0_20px_rgba(37,99,235,0.1)]"></div>
                 <Send className="w-16 h-16 text-blue-500 drop-shadow-[0_0_15px_rgba(37,99,235,0.5)]" />
              </div>
            </div>
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500 uppercase tracking-tighter mb-4">
              Trung Tâm Liên Lạc
            </h2>
            <p className="text-slate-500 text-[13px] max-w-md mx-auto font-bold leading-relaxed uppercase tracking-widest opacity-80">
              [ Chọn một đối tác bên trái để thiết lập kết nối mã hoá và bắt đầu quy trình hỗ trợ tác chiến ]
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
