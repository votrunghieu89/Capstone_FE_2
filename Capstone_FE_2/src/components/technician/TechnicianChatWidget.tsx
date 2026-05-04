import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, X, Send, User, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '@/store/authStore';
import { useChatSignalR } from '@/hooks/useChatSignalR';
import chatService from '@/services/chatService';
import { getChatRoomId, messageImageUrls, otherPartyIdFromRoom, sortChatMessagesOldestFirst } from '@/lib/chatRoomUtils';

export default function TechnicianChatWidget() {
  const location = useLocation();
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [rooms, setRooms] = useState<any[]>([]);
  const [activeRoom, setActiveRoom] = useState<any | null>(null);
  const [text, setText] = useState('');
  const [unreadByRoom, setUnreadByRoom] = useState<Record<string, number>>({});
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<{ url: string; name: string }[]>([]);
  const { messages, setMessages, joinRoom, notifications } = useChatSignalR();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const prevNotificationLenRef = useRef(0);

  const hideOnFullChatPage = location.pathname === '/technician/chat';

  const totalUnreadMessages = Object.values(unreadByRoom).reduce((sum, n) => sum + (n > 0 ? n : 0), 0);

  const markRoomAsRead = async (roomId: string) => {
    if (!roomId || !user?.id) return;
    setUnreadByRoom((prev) => {
      const next = { ...prev };
      delete next[roomId];
      return next;
    });
    try {
      await chatService.markAsRead(roomId, user.id);
    } catch (err) {
      console.error('Lỗi đánh dấu đã đọc:', err);
    }
  };

  const refreshUnreadFromApi = useCallback(() => {
    if (!user?.id) return;
    chatService
      .getAllRooms(user.id, 1, 20)
      .then((res) => {
        const rawRooms = Array.isArray(res) ? res : res.items || res.data || [];
        setUnreadByRoom((prev) => {
          const next = { ...prev };
          rawRooms.forEach((room: any) => {
            const id = getChatRoomId(room);
            if (!id) return;
            const fromApi = Number(room.unreadCount ?? room.UnreadCount ?? 0);
            if (fromApi > 0) next[id] = fromApi;
            else if (room.hasUnread || room.HasUnread) next[id] = Math.max(next[id] || 0, 1);
          });
          return next;
        });
      })
      .catch(() => undefined);
  }, [user?.id]);

  useEffect(() => {
    refreshUnreadFromApi();
  }, [refreshUnreadFromApi]);

  // Khi có realtime event tới, ưu tiên sync lại unreadCount từ API để badge luôn đúng.
  useEffect(() => {
    if (!user?.id) return;
    if (!notifications.length) return;
    refreshUnreadFromApi();
  }, [notifications.length, refreshUnreadFromApi, user?.id]);

  useEffect(() => {
    if (isOpen && user?.id) {
      chatService
        .getAllRooms(user.id, 1, 20)
        .then((res) => {
          const rawRooms = Array.isArray(res) ? res : res.items || res.data || [];
          setRooms(
            rawRooms.map((room: any) => {
              const rid = getChatRoomId(room);
              const u = unreadByRoom[rid] || 0;
              return {
                ...room,
                hasUnread: u > 0 || !!room.hasUnread || !!room.HasUnread,
              };
            })
          );
        })
        .catch((err) => console.error('Lỗi tải phòng chat:', err));
    }
  }, [isOpen, user, unreadByRoom]);

  useEffect(() => {
    if (activeRoom) {
      const roomId = getChatRoomId(activeRoom);
      if (!roomId) return;
      setMessages([]);
      markRoomAsRead(roomId);
      chatService
        .getAllMessages(roomId, 1, 50)
        .then(async (res) => {
          const rawMsgs = Array.isArray(res) ? res : res.items || res.data || [];
          setMessages(sortChatMessagesOldestFirst(rawMsgs));
          await joinRoom(String(roomId));
        })
        .catch((err) => console.error('Lỗi tải tin nhắn:', err));
    }
  }, [activeRoom, joinRoom]);

  useEffect(() => {
    if (prevNotificationLenRef.current > notifications.length) prevNotificationLenRef.current = 0;
    if (!notifications.length) return;

    const newItems = notifications.slice(prevNotificationLenRef.current);
    prevNotificationLenRef.current = notifications.length;

    newItems.forEach((latest) => {
      const roomId = String(
        latest?.RoomId || latest?.RoomID || latest?.roomId || latest?.roomID || latest?.roomid || latest?.room || ''
      );
      const senderId = String(
        latest?.SenderId || latest?.SenderID || latest?.senderId || latest?.senderID || latest?.senderid || ''
      );
      if (!roomId) return;
      if (senderId === String(user?.id || '')) return;

      const viewingRoomId = activeRoom ? getChatRoomId(activeRoom) : '';
      const isViewingThisRoom = Boolean(isOpen && viewingRoomId && viewingRoomId === roomId);

      if (!isViewingThisRoom) {
        setUnreadByRoom((prev) => ({
          ...prev,
          [roomId]: (prev[roomId] || 0) + 1,
        }));

        setRooms((prev) =>
          prev.map((room) => {
            const currentRoomId = getChatRoomId(room);
            if (currentRoomId !== roomId) return room;
            return {
              ...room,
              hasUnread: true,
              lastMessage: latest?.Content || latest?.content || room.lastMessage || room.LastMessage,
              lastMessageTime: latest?.CreatedAt || latest?.createdAt || room.lastMessageTime || room.LastMessageTime,
            };
          })
        );
      }
    });
  }, [notifications, activeRoom, user?.id, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const clearMedia = () => {
    setMediaPreviews((prev) => {
      prev.forEach((m) => URL.revokeObjectURL(m.url));
      return [];
    });
    setMediaFiles([]);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setMediaFiles((prev) => [...prev, ...files]);
    files.forEach((file) => setMediaPreviews((prev) => [...prev, { url: URL.createObjectURL(file), name: file.name }]));
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoom || !user) return;
    const content = text.trim();
    if (!content && mediaFiles.length === 0) return;

    try {
      const receiverId = otherPartyIdFromRoom(activeRoom, user.id);
      if (!receiverId) {
        console.error('Không xác định được người nhận trong phòng chat');
        return;
      }

      if (mediaFiles.length > 0) {
        await chatService.insertMessage({
          senderId: user.id,
          receiverId,
          content: content || '',
          imageUrls: mediaFiles,
        });
      } else if (content) {
        await chatService.insertMessage({
          senderId: user.id,
          receiverId,
          content,
        });
      }
      setText('');
      clearMedia();
    } catch (err) {
      console.error('Gửi tin nhắn thất bại', err);
    }
  };

  if (!user || hideOnFullChatPage) return null;

  return (
    <div className="fixed bottom-6 right-24 z-[10050] flex flex-col items-end pointer-events-auto">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-80 h-[450px] bg-bg-card backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-4 bg-primary/20 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-bold text-white flex items-center gap-2">
                <MessageCircle size={18} />
                {activeRoom ? 'Trò chuyện' : 'Hộp thư'}
              </h3>
              <div className="flex gap-2">
                {activeRoom && (
                  <button type="button" onClick={() => setActiveRoom(null)} className="text-xs text-primary-light hover:underline">
                    Trở lại
                  </button>
                )}
                <button type="button" onClick={() => setIsOpen(false)} className="text-text-secondary hover:text-white">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {!activeRoom ? (
                rooms.length > 0 ? (
                  rooms.map((room) => {
                    const roomId = getChatRoomId(room);
                    const userName = room.userName || room.UserName || `Phòng Chat #${String(roomId || '').substring(0, 6)}`;
                    const lastMessage = room.lastMessage || room.LastMessage || 'Chưa có tin nhắn';
                    const unreadN = unreadByRoom[roomId] || 0;
                    const hasUnread = unreadN > 0 || !!room.hasUnread;

                    return (
                      <div
                        key={roomId}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(ev) => {
                          if (ev.key === 'Enter' || ev.key === ' ') {
                            ev.preventDefault();
                            setActiveRoom(room);
                            void markRoomAsRead(roomId);
                          }
                        }}
                        onClick={() => {
                          setActiveRoom(room);
                          void markRoomAsRead(roomId);
                        }}
                        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer border border-white/5 transition flex items-center gap-3 relative"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary-light relative">
                          <User size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate flex items-center gap-2">{userName}</p>
                          <p className="text-xs text-text-secondary truncate">{lastMessage}</p>
                        </div>
                        {hasUnread && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-[#1877f2] text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-bg-card shadow-md">
                            {unreadN > 9 ? '9+' : unreadN > 0 ? unreadN : '•'}
                          </span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-center text-text-secondary my-auto">Chưa có cuộc hội thoại nào.</p>
                )
              ) : (
                messages.map((msg, idx) => {
                  const isMine = String(msg.senderId || msg.SenderId || '') === String(user.id);
                  const imgs = messageImageUrls(msg);
                  const bodyText = (msg.content || msg.Content || '').trim();
                  return (
                    <div key={idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[75%] space-y-2 p-3 rounded-2xl text-sm ${isMine ? 'bg-primary text-white rounded-tr-sm' : 'bg-white/10 text-white rounded-tl-sm'
                          }`}
                      >
                        {imgs.length > 0 && (
                          <div className="flex flex-col gap-1.5">
                            {imgs.map((url) => (
                              <a key={url} href={url} target="_blank" rel="noreferrer" className="block rounded-lg overflow-hidden border border-white/10">
                                <img src={url} alt="" className="max-w-full max-h-48 object-cover w-full" />
                              </a>
                            ))}
                          </div>
                        )}
                        {bodyText ? <p className="whitespace-pre-wrap break-words">{bodyText}</p> : null}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {activeRoom && (
              <div className="border-t border-white/10">
                {mediaPreviews.length > 0 && (
                  <div className="px-3 pt-2 flex flex-wrap gap-2">
                    {mediaPreviews.map((p, i) => (
                      <div key={p.url} className="relative w-14 h-14 rounded-lg overflow-hidden border border-white/10">
                        <img src={p.url} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center text-xs"
                          onClick={() => {
                            URL.revokeObjectURL(p.url);
                            setMediaPreviews((prev) => prev.filter((_, j) => j !== i));
                            setMediaFiles((prev) => prev.filter((_, j) => j !== i));
                          }}
                          aria-label="Xóa ảnh"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="p-3 flex gap-2 items-center">
                  <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImagePick} />
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="shrink-0 p-2.5 rounded-xl bg-white/5 border border-white/10 text-text-secondary hover:text-white hover:bg-white/10"
                    aria-label="Đính kèm ảnh"
                  >
                    <ImageIcon size={18} />
                  </button>
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/50"
                  />
                  <button
                    type="submit"
                    disabled={!text.trim() && mediaFiles.length === 0}
                    className="bg-primary text-white p-2.5 rounded-xl disabled:opacity-50 shrink-0"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-14 h-14 bg-gradient-to-br from-primary to-primary-dark rounded-full shadow-lg shadow-primary/30 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all"
        aria-label={isOpen ? 'Đóng chat' : 'Mở chat'}
      >
        {totalUnreadMessages > 0 && (
          <span
            className="absolute -top-1 -right-1 min-h-[1.35rem] min-w-[1.35rem] px-1 rounded-full bg-[#e41e3f] text-white text-[11px] font-bold leading-none flex items-center justify-center ring-[3px] ring-[#020617] shadow-[0_2px_8px_rgba(0,0,0,0.35)] z-10"
            aria-live="polite"
          >
            {totalUnreadMessages > 99 ? '99+' : totalUnreadMessages}
          </span>
        )}
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}
