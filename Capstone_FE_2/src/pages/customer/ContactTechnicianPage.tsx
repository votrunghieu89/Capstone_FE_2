import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, Video, Send, MoreVertical, Image as ImageIcon, Paperclip, Smile } from 'lucide-react';

// Mock Data
const technicians = [
    { id: 1, name: 'Nguyễn Văn A', role: 'Thợ Điện', avatar: 'https://i.pravatar.cc/150?u=1', online: true, lastMsg: 'Chào bạn, tôi đang tới...', time: '10:45' },
    { id: 2, name: 'Trần Thị B', role: 'Thợ Nước', avatar: 'https://i.pravatar.cc/150?u=2', online: false, lastMsg: 'Đã hoàn thành sửa chữa.', time: 'Hôm qua' },
    { id: 3, name: 'Lê Hoàng C', role: 'Sửa Điều Hòa', avatar: 'https://i.pravatar.cc/150?u=3', online: true, lastMsg: 'Chi phí linh kiện là...', time: 'T2' },
];

const initialMessages = [
    { id: 1, sender: 'tech', text: 'Chào anh/chị, tôi là thợ sửa chữa được phân công.', time: '10:30' },
    { id: 2, sender: 'customer', text: 'Chào anh, điều hòa nhà tôi không mát.', time: '10:32' },
    { id: 3, sender: 'tech', text: 'Dạ, anh vui lòng chụp ảnh hoặc quay video tiếng kêu gửi tôi xem qua ạ.', time: '10:35' },
    { id: 4, sender: 'tech', text: 'Tôi sẽ có mặt tại nhà anh trong 30 phút nữa.', time: '10:45' },
];

export default function ContactTechnicianPage() {
    const [activeTech, setActiveTech] = useState(technicians[0]);
    const [messages, setMessages] = useState(initialMessages);
    const [inputMsg, setInputMsg] = useState('');

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputMsg.trim()) return;

        const newMsg = {
            id: Date.now(),
            sender: 'customer',
            text: inputMsg,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages([...messages, newMsg]);
        setInputMsg('');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-[calc(100vh-140px)] min-h-[600px] flex flex-col"
        >
            <div className="mb-4">
                <h1 className="text-3xl font-bold tracking-tight text-white">Liên hệ Kỹ thuật viên</h1>
            </div>

            <div className="flex-1 flex bg-[#0a1122] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                {/* Left Sidebar - Chat List */}
                <div className="w-80 border-r border-white/5 flex flex-col hidden md:flex">
                    <div className="p-4 border-b border-white/5">
                        <Input
                            placeholder="Tìm kiếm thợ..."
                            className="bg-[#050b18] border-white/10 text-white placeholder:text-zinc-500 rounded-xl"
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto w-full">
                        {technicians.map((tech) => (
                            <div
                                key={tech.id}
                                onClick={() => setActiveTech(tech)}
                                className={`flex items-center gap-3 p-4 cursor-pointer transition-colors border-l-2 ${activeTech.id === tech.id ? 'bg-[#050b18] border-primary' : 'border-transparent hover:bg-white/5'}`}
                            >
                                <div className="relative flex-shrink-0">
                                    <Avatar className="w-12 h-12 border border-white/10">
                                        <AvatarImage src={tech.avatar} />
                                        <AvatarFallback>{tech.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    {tech.online && (
                                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0a1122] rounded-full"></span>
                                    )}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h4 className="font-semibold text-white truncate text-sm">{tech.name}</h4>
                                        <span className="text-[10px] text-zinc-500 flex-shrink-0">{tech.time}</span>
                                    </div>
                                    <p className="text-xs text-zinc-400 truncate">{tech.lastMsg}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Content - Chat Area */}
                <div className="flex-1 flex flex-col bg-[#02050b]">
                    {/* Chat Header */}
                    <div className="h-16 border-b border-white/5 px-6 flex items-center justify-between bg-[#0a1122]">
                        <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10 border border-white/10">
                                <AvatarImage src={activeTech.avatar} />
                                <AvatarFallback>{activeTech.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="font-semibold text-white text-sm">{activeTech.name}</h3>
                                <p className="text-xs text-zinc-400 font-medium">
                                    {activeTech.online ? <span className="text-green-400">Đang trực tuyến</span> : 'Ngoại tuyến'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white rounded-full">
                                <Phone className="w-5 h-5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white rounded-full">
                                <Video className="w-5 h-5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white rounded-full">
                                <MoreVertical className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        <div className="text-center text-xs justify-center items-center flex mb-6">
                            <span className="bg-white/5 text-zinc-500 px-3 py-1 rounded-full border border-white/5">
                                Hôm nay
                            </span>
                        </div>
                        <AnimatePresence>
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {msg.sender === 'tech' && (
                                        <Avatar className="w-8 h-8 mr-2 mt-auto">
                                            <AvatarImage src={activeTech.avatar} />
                                        </Avatar>
                                    )}
                                    <div className={`max-w-[70%] rounded-2xl px-5 py-3 shadow-lg ${msg.sender === 'customer' ? 'bg-primary text-white rounded-br-sm' : 'bg-white/10 text-zinc-200 border border-white/5 rounded-bl-sm'}`}>
                                        <p className="text-sm leading-relaxed">{msg.text}</p>
                                        <p className={`text-[10px] mt-1.5 text-right ${msg.sender === 'customer' ? 'text-primary-light/80' : 'text-zinc-500'}`}>
                                            {msg.time}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-[#0a1122] border-t border-white/5">
                        <form onSubmit={sendMessage} className="flex items-center gap-2">
                            <Button type="button" variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                                <Paperclip className="w-5 h-5" />
                            </Button>
                            <Button type="button" variant="ghost" size="icon" className="text-zinc-400 hover:text-white hidden sm:flex">
                                <ImageIcon className="w-5 h-5" />
                            </Button>
                            <div className="flex-1 relative">
                                <Input
                                    value={inputMsg}
                                    onChange={(e) => setInputMsg(e.target.value)}
                                    placeholder="Nhập tin nhắn..."
                                    className="w-full bg-[#050b18] border-white/10 text-white rounded-full pr-10 focus-visible:ring-primary h-12"
                                />
                                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1 bottom-1 h-auto text-zinc-400 hover:text-primary">
                                    <Smile className="w-5 h-5" />
                                </Button>
                            </div>
                            <Button
                                type="submit"
                                className="bg-primary hover:bg-primary-dark text-white rounded-full w-12 h-12 p-0 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20 transition-transform active:scale-95"
                                disabled={!inputMsg.trim()}
                            >
                                <Send className="w-5 h-5" />
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
