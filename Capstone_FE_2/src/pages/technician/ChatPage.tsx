import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, User, Search, 
  MoreVertical, Paperclip, Smile,
  Check, CheckCheck, XCircle, ChevronLeft
} from 'lucide-react';
import chatService from '@/services/chatService';
import useAuthStore from '@/store/authStore';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

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

export default function ChatPage() {
  const { user } = useAuthStore();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mock contacts (will be replaced with real backend API call later)
  const [contacts] = useState<Contact[]>([
    { id: 'customer-1', name: 'Nguyễn Văn A', lastMessage: 'Anh đang đến chưa ạ?', time: '10:30', unreadCount: 2, isOnline: true },
    { id: 'customer-2', name: 'Trần Thị B', lastMessage: 'Cảm ơn anh nhiều!', time: 'Hôm qua', unreadCount: 0, isOnline: false },
  ]);

  useEffect(() => {
    if (selectedContact) {
      // Setup real-time listener for current contact
      chatService.onMessageReceived((senderId, content) => {
        if (senderId === selectedContact.id) {
          const newMessage: Message = {
            id: Date.now().toString(),
            senderId,
            content,
            timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            isRead: false
          };
          setMessages(prev => [...prev, newMessage]);
        }
      });
    }
  }, [selectedContact?.id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || !selectedContact || !user?.id) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: user.id,
      content: inputValue,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      isRead: false
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');

    try {
      await chatService.sendMessage(selectedContact.id, inputValue);
    } catch (err) {
      toast.error('Gửi tin nhắn thất bại');
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row bg-[#0f172a]/40 backdrop-blur-xl rounded-[40px] border border-white/5 overflow-hidden shadow-2xl animate-in fade-in duration-500">
      {/* Sidebar - Contact List */}
      <div className={cn(
        "w-full lg:w-[380px] border-r border-white/5 flex flex-col transition-all",
        selectedContact ? "hidden lg:flex" : "flex"
      )}>
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
              className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-bold"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar">
          {contacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => setSelectedContact(contact)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-3xl transition-all group relative overflow-hidden",
                selectedContact?.id === contact.id 
                  ? "bg-blue-600 shadow-xl shadow-blue-600/20" 
                  : "hover:bg-white/5"
              )}
            >
              <div className="relative z-10">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center border transition-all",
                  selectedContact?.id === contact.id ? "bg-white/10 border-white/20" : "bg-slate-800/50 border-white/5"
                )}>
                  <User className={cn("w-7 h-7", selectedContact?.id === contact.id ? "text-white" : "text-slate-500")} />
                </div>
                {contact.isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-[#0f172a] rounded-full shadow-lg" />
                )}
              </div>
              
              <div className="flex-1 text-left min-w-0 relative z-10">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className={cn("font-black text-sm uppercase tracking-tight truncate", selectedContact?.id === contact.id ? "text-white" : "text-slate-200")}>
                    {contact.name}
                  </h3>
                  <span className={cn("text-[10px] font-black uppercase tracking-widest", selectedContact?.id === contact.id ? "text-blue-100" : "text-slate-600")}>
                    {contact.time}
                  </span>
                </div>
                <p className={cn("text-xs font-medium truncate", selectedContact?.id === contact.id ? "text-blue-100/70" : "text-slate-500")}>
                  {contact.lastMessage}
                </p>
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

      {/* Main Chat Window */}
      <AnimatePresence mode="wait">
        {selectedContact ? (
          <motion.div 
            key="chat-active"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 flex flex-col bg-[#020617]/40"
          >
            {/* Top Bar */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between backdrop-blur-xl bg-[#0f172a]/20">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedContact(null)}
                  className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                  <User size={24} />
                </div>
                <div>
                  <h2 className="font-black text-white text-base leading-tight uppercase tracking-tight">{selectedContact.name}</h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className={cn("w-1.5 h-1.5 rounded-full", selectedContact.isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-600")} />
                    <p className={cn("text-[10px] font-black uppercase tracking-widest", selectedContact.isOnline ? "text-emerald-500" : "text-slate-600")}>
                      {selectedContact.isOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="p-3 bg-white/5 rounded-xl text-slate-500 hover:text-slate-200 transition-colors border border-white/5 group">
                   <MoreVertical size={20} className="group-hover:rotate-90 transition-transform" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full opacity-10">
                  <div className="bg-white/5 p-12 rounded-[60px] border border-white/10 mb-6">
                     <Smile size={84} className="text-white" />
                  </div>
                  <p className="font-black uppercase tracking-[0.3em] text-white text-xs">Phát tín hiệu kết nối...</p>
                </div>
              )}
              {messages.map((msg) => {
                const isMine = msg.senderId === user?.id;
                return (
                  <div 
                    key={msg.id}
                    className={cn(
                      "flex w-full group/msg",
                      isMine ? "justify-end" : "justify-start"
                    )}
                  >
                    <div className={cn(
                      "max-w-[75%] space-y-2",
                      isMine ? "items-end" : "items-start"
                    )}>
                      <div className={cn(
                        "px-5 py-4 rounded-[32px] text-sm font-bold leading-relaxed shadow-2xl transition-transform hover:scale-[1.02]",
                        isMine 
                          ? "bg-blue-600 text-white rounded-tr-none shadow-blue-600/10" 
                          : "bg-slate-800/80 text-slate-100 border border-white/5 rounded-tl-none"
                      )}>
                        {msg.content}
                      </div>
                      <div className={cn(
                        "flex items-center gap-2 px-2 opacity-0 group-hover/msg:opacity-100 transition-opacity",
                        isMine ? "flex-row-reverse" : "flex-row"
                      )}>
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{msg.timestamp}</span>
                        {isMine && <CheckCheck className="w-3.5 h-3.5 text-blue-500" />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>

            {/* Input Area */}
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
  );
}
