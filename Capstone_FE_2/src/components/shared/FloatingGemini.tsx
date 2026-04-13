import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, X, Trash2, Maximize2, Minimize2, GripVertical } from 'lucide-react';
import aiService from '@/services/aiService';

const FloatingGemini: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await aiService.chat(userMsg);
      setMessages(prev => [...prev, { role: 'ai', text: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Xin lỗi, tôi đang gặp chút sự cố kết nối.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className={`mb-4 w-80 md:w-96 bg-[#0f172a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col ${
              isMinimized ? 'h-16' : 'h-[500px]'
            }`}
          >
            {/* Header */}
            <div className="p-4 bg-blue-600 flex items-center justify-between cursor-default">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <Bot size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Trợ lý Kỹ thuật FastFix</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[10px] text-blue-100 italic">Sẵn sàng hỗ trợ</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-white/70 transition-colors"
                >
                  {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-white/70 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-950/50"
                >
                  {messages.length === 0 && (
                    <div className="text-center py-10 px-6">
                      <div className="w-16 h-16 rounded-3xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                        <Bot size={32} className="text-blue-500" />
                      </div>
                      <p className="text-sm text-slate-400">
                        Chào bạn! Tôi là Gemini AI. Bạn cần hỗ trợ gì về kỹ thuật hoặc xử lý đơn hàng không?
                      </p>
                    </div>
                  )}

                  {messages.map((msg, i) => (
                    <motion.div
                      initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={i}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                        msg.role === 'user' 
                          ? 'bg-blue-600 text-white rounded-tr-none' 
                          : 'bg-white/5 text-slate-200 border border-white/5 rounded-tl-none'
                      }`}>
                        {msg.text}
                      </div>
                    </motion.div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white/5 p-3 rounded-2xl rounded-tl-none border border-white/5 flex gap-1 items-center">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="p-4 border-t border-white/5 bg-[#0f172a]">
                  <div className="relative">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Nhập câu hỏi kỹ thuật..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-4 pr-12 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className="absolute right-2 top-1.5 p-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white rounded-xl transition-all"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bubble Trigger */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        drag
        dragConstraints={{ left: -window.innerWidth + 100, right: 0, top: -window.innerHeight + 100, bottom: 0 }}
        onClick={() => !isOpen && setIsOpen(true)}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all ${
          isOpen ? 'bg-slate-800 text-slate-400 rotate-90 scale-0 opacity-0' : 'bg-blue-600 text-white'
        }`}
      >
        <Bot size={28} />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#020617] flex items-center justify-center">
            <span className="text-[8px] font-bold">AI</span>
        </div>
      </motion.button>
    </div>
  );
};

export default FloatingGemini;
