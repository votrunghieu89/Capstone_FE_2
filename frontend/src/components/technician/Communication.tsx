import { useState } from 'react';
import { Send, Phone, AlertCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Communication() {
  const [selectedChat, setSelectedChat] = useState(1);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const conversations = [
    {
      id: 1,
      name: 'Công Ty John',
      avatar: '🏢',
      lastMessage: 'Công việc tuyệt vời! Cảm ơn đã sửa chữa điều hòa.',
      lastTime: '2 phút trước',
      unread: 2,
      online: true,
    },
    {
      id: 2,
      name: 'Sarah Martinez',
      avatar: '👩‍💼',
      lastMessage: 'Bạn có thể ghé qua lắp đặt không?',
      lastTime: '1 giờ trước',
      unread: 1,
      online: true,
    },
    {
      id: 3,
      name: 'Công Ty Tech Solutions',
      avatar: '💼',
      lastMessage: 'Bạn có thể kiểm tra tuần tới không?',
      lastTime: '5 giờ trước',
      unread: 0,
      online: false,
    },
    {
      id: 4,
      name: 'Michael Chen',
      avatar: '👨‍💼',
      lastMessage: 'Cảm ơn dịch vụ nhanh chóng!',
      lastTime: '1 ngày trước',
      unread: 0,
      online: false,
    },
  ];

  const messages = [
    {
      id: 1,
      sender: 'customer',
      text: 'Xin chào Alex! Máy lạnh của tôi đang phát ra tiếng lạ và nóng quá. Bạn có thể ghé qua hôm nay không?',
      time: '10:15',
    },
    {
      id: 2,
      sender: 'me',
      text: 'Tôi có thể đến trong khoảng 30 phút. Để tôi kiểm tra lịch của tôi.',
      time: '10:18',
    },
    {
      id: 3,
      sender: 'me',
      text: 'Hoàn hảo! Tôi sẽ đến lúc 10:50. Địa chỉ là gì?',
      time: '10:20',
    },
    {
      id: 4,
      sender: 'customer',
      text: '456 Đường Sồi, Phòng 200. Tôi rất mong chờ gặp bạn!',
      time: '10:22',
    },
    {
      id: 5,
      sender: 'me',
      text: 'Tôi vừa đến và bắt đầu kiểm tra.',
      time: '10:48 AM',
    },
    {
      id: 6,
      sender: 'customer',
      text: "Great! I'm here to let you in. I'm upstairs in the office.",
      time: '10:50 AM',
    },
    {
      id: 7,
      sender: 'me',
      text: 'Found the issue - the compressor needs replacement. Should take about 1 hour.',
      time: '11:10 AM',
    },
    {
      id: 8,
      sender: 'customer',
      text: 'Great work! Thanks for fixing the AC.',
      time: '12:25 PM',
    },
  ];

  const activeChat = conversations.find((c) => c.id === selectedChat);

  return (
    <div className="p-6 space-y-6 h-[calc(100vh-64px)] flex flex-col">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Communication</h1>
        <p className="text-muted-foreground mt-1">Message with customers about jobs</p>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0">
        {/* Conversations List */}
        <div className="md:col-span-1 flex flex-col bg-card rounded-xl border border-border/60 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border/60 bg-secondary/30">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border/40">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedChat(conv.id)}
                className={`w-full text-left p-4 hover:bg-secondary/50 transition-colors flex flex-col ${
                  selectedChat === conv.id ? 'bg-secondary border-l-2 border-l-foreground' : 'border-l-2 border-l-transparent'
                }`}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="text-2xl w-10 h-10 rounded-full bg-background flex items-center justify-center shadow-sm border border-border/50">
                    {conv.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <p className="font-bold text-foreground truncate">{conv.name}</p>
                      {conv.online && <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />}
                    </div>
                    {conv.unread > 0 && (
                      <span className="text-[10px] font-bold text-background bg-foreground px-1.5 py-0.5 rounded-full inline-block mb-1">
                        {conv.unread} new
                      </span>
                    )}
                    <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                    <p className="text-[10px] font-medium text-muted-foreground mt-1">{conv.lastTime}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="md:col-span-2 flex flex-col bg-card rounded-xl border border-border/60 shadow-sm overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 border-b border-border/60 bg-secondary/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl w-12 h-12 rounded-full bg-background flex items-center justify-center shadow-sm border border-border/50">
                {activeChat?.avatar}
              </span>
              <div>
                <h3 className="font-bold text-foreground text-lg leading-tight">{activeChat?.name}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className={`w-2 h-2 rounded-full ${activeChat?.online ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                  <p className="text-xs font-medium text-muted-foreground">
                    {activeChat?.online ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="icon" variant="outline" className="rounded-full shadow-sm hover:bg-secondary">
                <Phone className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="outline" className="rounded-full shadow-sm hover:bg-secondary">
                <AlertCircle className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl shadow-sm ${
                    msg.sender === 'me'
                      ? 'bg-foreground text-background rounded-br-sm'
                      : 'bg-secondary text-secondary-foreground rounded-bl-sm border border-border/50'
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                  <p
                    className={`text-[10px] font-medium mt-1.5 text-right ${
                      msg.sender === 'me'
                        ? 'text-background/70'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-border/60 bg-background">
            <div className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="flex-1 px-4 py-3 rounded-full border border-border bg-secondary/50 text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <Button size="icon" className="rounded-full w-12 h-12 bg-foreground text-background hover:bg-foreground/90 shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
