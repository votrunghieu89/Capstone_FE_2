import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '@/store/authStore';
import { useChatSignalR } from '@/hooks/useChatSignalR';
import chatService from '@/services/chatService';

export default function ChatWidget() {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [rooms, setRooms] = useState<any[]>([]);
  const [activeRoom, setActiveRoom] = useState<any | null>(null);
  const [text, setText] = useState('');
  const { connection, messages, setMessages } = useChatSignalR();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch Rooms when opened
  useEffect(() => {
    if (isOpen && user?.id) {
      chatService.getAllRooms(user.id, 1, 20).then(res => {
        // Backend returns either an array or an object with paginated items
        const rawRooms = Array.isArray(res) ? res : ((res as any).items || (res as any).data || []);
        setRooms(rawRooms);
      }).catch(err => console.error('Lỗi tải phòng chat:', err));
    }
  }, [isOpen, user]);

  // Fetch Messages when a room is active
  useEffect(() => {
    if (activeRoom) {
      chatService.getAllMessages(activeRoom.id, 1, 50).then(res => {
        const rawMsgs = Array.isArray(res) ? res : ((res as any).items || (res as any).data || []);
        setMessages(rawMsgs.reverse()); // Assume older messages first
      }).catch(err => console.error('Lỗi tải tin nhắn:', err));
    }
  }, [activeRoom]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !activeRoom || !user) return;
    
    try {
      await chatService.insertMessage({
        roomId: activeRoom.id,
        senderId: user.id,
        content: text,
        type: 'text'
      });
      // The backend should broadcast via SignalR causing useChatSignalR to append to messages
      // Alternatively, optimistically append:
      // setMessages(prev => [...prev, { content: text, senderId: user.id, type: 'text' }]);
      setText('');
    } catch (err) {
      console.error('Gửi tin nhắn thất bại', err);
    }
  };

  if (!user) return null; // Don't show chat if not logged in

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-80 h-[450px] bg-bg-card backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-4 bg-primary/20 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-bold text-white flex items-center gap-2">
                <MessageCircle size={18} />
                {activeRoom ? 'Trò chuyện' : 'Hộp thư'}
              </h3>
              <div className="flex gap-2">
                {activeRoom && (
                  <button onClick={() => setActiveRoom(null)} className="text-xs text-primary-light hover:underline">Trở lại</button>
                )}
                <button onClick={() => setIsOpen(false)} className="text-text-secondary hover:text-white">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {!activeRoom ? (
                // Room List
                rooms.length > 0 ? (
                  rooms.map(room => (
                    <div 
                      key={room.id} 
                      onClick={() => setActiveRoom(room)}
                      className="p-3 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer border border-white/5 transition flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary-light">
                        <User size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">Phòng Chat #{room.id.substring(0,6)}</p>
                        <p className="text-xs text-text-secondary truncate">{room.lastMessage || 'Chưa có tin nhắn'}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-center text-text-secondary my-auto">Chưa có cuộc hội thoại nào.</p>
                )
              ) : (
                // Messages List
                messages.map((msg, idx) => {
                  const isMine = msg.senderId === user.id;
                  return (
                    <div key={idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${isMine ? 'bg-primary text-white rounded-tr-sm' : 'bg-white/10 text-white rounded-tl-sm'}`}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Footer Input */}
            {activeRoom && (
              <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 flex gap-2">
                <input 
                  type="text" 
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Nhập tin nhắn..." 
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/50"
                />
                <button type="submit" disabled={!text.trim()} className="bg-primary text-white p-2.5 rounded-xl disabled:opacity-50">
                  <Send size={16} />
                </button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-br from-primary to-primary-dark rounded-full shadow-lg shadow-primary/30 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}
