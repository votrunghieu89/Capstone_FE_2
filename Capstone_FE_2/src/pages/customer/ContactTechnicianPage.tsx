import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, Video, Send, MoreVertical, Image as ImageIcon, Paperclip, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/authStore';
import chatService, { ChatRoom, ChatMessage } from '@/services/chatService';
import { useChatSignalR } from '@/hooks/useChatSignalR';

export default function ContactTechnicianPage() {
    const { user } = useAuthStore();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const focusTechId = queryParams.get('techId') || '';
    const [rooms, setRooms] = useState<any[]>([]);

    const dedupeRooms = (list: any[]) => {
        const map = new Map<string, any>();
        for (const room of list || []) {
            const otherId = otherPartyIdOf(room);
            if (!otherId) continue;

            const current = map.get(otherId);
            if (!current) {
                map.set(otherId, room);
                continue;
            }

            const currentTime = new Date(lastUpdateOf(current) || 0).getTime();
            const candidateTime = new Date(lastUpdateOf(room) || 0).getTime();
            if (candidateTime >= currentTime) {
                map.set(otherId, room);
            }
        }
        return Array.from(map.values());
    };
    const [activeRoom, setActiveRoom] = useState<any>(null);
    const [inputMsg, setInputMsg] = useState('');
    const [isLoadingRooms, setIsLoadingRooms] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [mediaPreviews, setMediaPreviews] = useState<{ url: string; type: 'image' | 'video'; name: string }[]>([]);

    const { messages, setMessages, connection } = useChatSignalR();

    const imageInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const roomIdOf = (room: any) => room?.id || room?.Id || room?.roomId || room?.RoomId;
    const otherPartyIdOf = (room: any) => String(room?.otherPartyId || room?.OtherPartyId || room?.technicianId || room?.TechnicianId || room?.otherId || room?.OtherId || room?.userB || '').trim();
    const otherPartyNameOf = (room: any) => room?.otherPartyName || room?.OtherPartyName || room?.userName || room?.UserName || room?.technicianName || room?.TechnicianName || 'Kỹ thuật viên';
    const lastUpdateOf = (room: any) => room?.lastUpdate || room?.LastUpdate || room?.lastMessageTime || room?.LastMessageTime;
    const normalizeMessages = (raw: any[]) => (raw || []).map((m: any) => ({
        id: m?.id || m?.Id || m?.messengerId || m?.MessengerId,
        senderId: m?.senderId || m?.SenderId,
        content: m?.content || m?.Content || '',
        createdAt: m?.createdAt || m?.CreatedAt || m?.sentTime || m?.SentTime || new Date().toISOString(),
        avatarUrl: m?.avatarUrl || m?.AvatarUrl,
        imageUrls: m?.imageUrls || m?.ImageUrls || [],
        videoUrl: m?.videoUrl || m?.VideoUrl,
    }));

    // 1. Fetch Rooms
    useEffect(() => {
        if (!user?.id) return;
        const fetchRooms = async () => {
            setIsLoadingRooms(true);
            try {
                const res = await chatService.getAllRooms(user.id);
                const list = dedupeRooms(res?.items || res || []);
                setRooms(list);

                if (focusTechId) {
                    const existed = list.find((r: any) => otherPartyIdOf(r) === focusTechId);
                    if (existed) {
                        setActiveRoom(existed);
                    } else {
                        const createRes = await chatService.getOrCreateRoom(user.id, focusTechId);
                        const newRoomId = createRes?.roomId || createRes?.RoomId || createRes?.id || createRes?.Id;
                        if (newRoomId) {
                            const refreshed = await chatService.getAllRooms(user.id);
                            const refreshedList = dedupeRooms(refreshed?.items || refreshed || []);
                            setRooms(refreshedList);
                            const createdRoom = refreshedList.find((r: any) => String(roomIdOf(r)) === String(newRoomId)) || refreshedList.find((r: any) => otherPartyIdOf(r) === focusTechId) || refreshedList[0];
                            setActiveRoom(createdRoom || null);
                        }
                    }
                } else if (list?.[0]) {
                    setActiveRoom(list[0]);
                }
            } catch (err: any) {
                console.error('Chat rooms fetch error:', err);
                toast.error(err?.response?.data?.message || 'Không tải được danh sách chat');
                setRooms([]);
            } finally {
                setIsLoadingRooms(false);
            }
        };
        fetchRooms();
    }, [user?.id, focusTechId]);

    // 2. Fetch Messages for Active Room
    useEffect(() => {
        const roomId = roomIdOf(activeRoom);
        if (!roomId) return;
        const fetchMessages = async () => {
            setIsLoadingMessages(true);
            try {
                const res = await chatService.getAllMessages(roomId);
                const list = res?.items || res?.data || res || [];
                setMessages(normalizeMessages(list));
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoadingMessages(false);
            }
        };
        fetchMessages();
    }, [activeRoom, setMessages]);

    // 3. Scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const roomId = roomIdOf(activeRoom);
        if (!user?.id || !roomId) return;

        const content = inputMsg.trim();
        if (!content && mediaPreviews.length === 0) return;

        try {
            // Text Message
            if (content) {
                const receiverId = otherPartyIdOf(activeRoom);
                if (!receiverId) {
                    toast.error('Không tìm thấy người nhận trong phòng chat');
                    return;
                }

                await chatService.insertMessage({
                    senderId: user.id,
                    receiverId,
                    content
                } as any);

                // Optimistic update for immediate UI feedback
                setMessages((prev: any[]) => ([
                    ...prev,
                    {
                        id: `local-${Date.now()}`,
                        senderId: user.id,
                        content,
                        createdAt: new Date().toISOString(),
                    }
                ]));
                setInputMsg('');
            }
            
            // Media support (Mock for now, normally uploads first)
            if (mediaPreviews.length > 0) {
                toast.success("Tính năng gửi ảnh đang được cập nhật!");
                setMediaPreviews([]);
            }
        } catch (err) {
            toast.error("Gửi tin nhắn thất bại");
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        files.forEach(file => {
            const url = URL.createObjectURL(file);
            setMediaPreviews(prev => [...prev, { url, type: 'image', name: file.name }]);
        });
        if (imageInputRef.current) imageInputRef.current.value = '';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="h-[calc(100vh-140px)] min-h-[600px] flex flex-col"
        >
            <div className="mb-4">
                <h1 className="text-3xl font-bold tracking-tight text-white">Liên hệ Kỹ thuật viên</h1>
            </div>

            <div className="flex-1 flex bg-[#0a1122] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                {/* Left Sidebar - Chat List */}
                <div className="w-80 border-r border-white/5 flex flex-col hidden md:flex min-w-[320px]">
                    <div className="p-4 border-b border-white/5">
                        <Input
                            placeholder="Tìm kiếm thợ..."
                            className="bg-[#050b18] border-white/10 text-white placeholder:text-zinc-500 rounded-xl"
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto w-full">
                        {isLoadingRooms ? (
                            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
                        ) : rooms.length === 0 ? (
                            <div className="p-8 text-center text-zinc-500 text-sm">Chưa có cuộc hội thoại nào</div>
                        ) : (
                            rooms.map((room) => {
                                const roomId = String(roomIdOf(room));
                                const activeRoomId = String(roomIdOf(activeRoom));
                                return (
                                <div
                                    key={roomId}
                                    onClick={() => setActiveRoom(room)}
                                    className={`flex items-center gap-3 p-4 cursor-pointer transition-colors border-l-2 ${activeRoomId === roomId ? 'bg-[#050b18] border-primary' : 'border-transparent hover:bg-white/5'}`}
                                >
                                    <div className="relative flex-shrink-0">
                                        <Avatar className="w-12 h-12 border border-white/10">
                                            <AvatarFallback className="bg-primary/20 text-primary-light">
                                                {(otherPartyNameOf(room) || 'T')[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h4 className="font-semibold text-white truncate text-sm">{otherPartyNameOf(room) || 'Phòng trò chuyện'}</h4>
                                            <span className="text-[10px] text-zinc-500 flex-shrink-0">
                                                {lastUpdateOf(room) ? new Date(lastUpdateOf(room)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </span>
                                        </div>
                                        <p className="text-xs text-zinc-400 truncate">{room.lastMessage || room.LastMessage || 'Chưa có tin nhắn'}</p>
                                    </div>
                                </div>
                            );
                            })
                        )}
                    </div>
                </div>

                {/* Right Content - Chat Area */}
                <div className="flex-1 flex flex-col bg-[#02050b]">
                    {activeRoom ? (
                        <>
                            {/* Chat Header */}
                            <div className="h-16 border-b border-white/5 px-6 flex items-center justify-between bg-[#0a1122]">
                                <div className="flex items-center gap-3">
                                    <Avatar className="w-10 h-10 border border-white/10">
                                        <AvatarFallback className="bg-primary/20 text-primary-light">
                                            {(otherPartyNameOf(activeRoom) || 'T')[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-semibold text-white text-sm">{otherPartyNameOf(activeRoom) || 'Kỹ thuật viên'}</h3>
                                        <p className="text-xs text-green-400 font-medium animate-pulse">Trực tuyến</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white rounded-full"><Phone className="w-5 h-5" /></Button>
                                    <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white rounded-full"><Video className="w-5 h-5" /></Button>
                                    <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white rounded-full"><MoreVertical className="w-5 h-5" /></Button>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
                                {isLoadingMessages && (
                                    <div className="flex justify-center"><Loader2 className="animate-spin text-primary w-5 h-5" /></div>
                                )}
                                <AnimatePresence initial={false}>
                                    {messages.map((msg) => {
                                        const senderId = msg.senderId || msg.SenderId;
                                        const isMe = String(senderId) === String(user?.id);
                                        return (
                                            <motion.div
                                                key={msg.id || Math.random()}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                            >
                                                {!isMe && (
                                                    <Avatar className="w-8 h-8 mr-2 mt-auto">
                                                        <AvatarFallback className="text-[10px]">T</AvatarFallback>
                                                    </Avatar>
                                                )}
                                                <div className={`max-w-[70%] rounded-2xl overflow-hidden shadow-lg ${isMe ? 'bg-primary text-white rounded-br-sm' : 'bg-white/10 text-zinc-200 border border-white/5 rounded-bl-sm'}`}>
                                                    <div className="px-5 py-3">
                                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content || msg.text}</p>
                                                        <p className={`text-[10px] mt-1.5 text-right opacity-60`}>
                                                            {new Date(msg.createdAt || msg.time || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>

                            {/* Media Previews above input */}
                            {mediaPreviews.length > 0 && (
                                <div className="px-4 py-2 border-t border-white/5 bg-[#0a1122] flex gap-2 flex-wrap">
                                    {mediaPreviews.map((media, idx) => (
                                        <div key={idx} className="relative group">
                                            <img src={media.url} className="w-16 h-16 rounded-xl object-cover border border-white/10" alt="preview" />
                                            <button type="button" onClick={() => setMediaPreviews(p => p.filter((_, i) => i !== idx))}
                                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                                <X size={10} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Input Area */}
                            <div className="p-4 bg-[#0a1122] border-t border-white/5">
                                <input ref={imageInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
                                <form onSubmit={sendMessage} className="flex items-center gap-2">
                                    <Button type="button" variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-white/10 hidden sm:flex"
                                        onClick={() => imageInputRef.current?.click()} title="Gửi ảnh">
                                        <ImageIcon className="w-5 h-5" />
                                    </Button>
                                    <div className="flex-1 relative">
                                        <Input
                                            value={inputMsg} onChange={(e) => setInputMsg(e.target.value)}
                                            placeholder="Nhập tin nhắn..."
                                            className="w-full bg-[#050b18] border-white/10 text-white rounded-full h-12 focus-visible:ring-primary"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        className="bg-primary hover:bg-primary-dark text-white rounded-full w-12 h-12 p-0 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20 transition-transform active:scale-95"
                                        disabled={!inputMsg.trim() && mediaPreviews.length === 0}
                                    >
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
