import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Sparkles, Image as ImageIcon, 
  Send, AlertTriangle, ShieldCheck, 
  DollarSign, Wrench, ArrowRight,
  Info
} from 'lucide-react';
import aiService, { AIDiagnosisResponse } from '@/services/aiService';
import toast from 'react-hot-toast';

interface AIDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export function AIDiagnosticModal({ isOpen, onClose, initialQuery = '' }: AIDiagnosticModalProps) {
  const [description, setDescription] = useState(initialQuery);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIDiagnosisResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleDiagnose = async () => {
    if (!description.trim()) {
      toast.error('Vui lòng mô tả sự cố của bạn');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const data = await aiService.diagnose(description, selectedImage || undefined);
      setResult(data);
      toast.success('AI đã chẩn đoán xong sự cố!');
    } catch (err) {
      console.error('Diagnosis error:', err);
      toast.error('Không thể thực hiện chẩn đoán lúc này');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#020617]/80 backdrop-blur-md"
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-2xl bg-[#0f172a] rounded-[32px] border border-white/10 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-blue-600/10 to-purple-600/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">AI Chẩn Đoán <span className="text-blue-500">FastFix</span></h2>
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Powered by Gemini 1.5</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors bg-white/5 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {!result ? (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Mô tả sự cố của bạn</label>
                <textarea 
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ví dụ: Vòi nước bồn rửa mặt bị rò rỉ liên tục, hoặc Cầu dao điện hay bị nhảy..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium min-h-[120px]"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Hình ảnh thực tế (Tùy chọn)</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-40 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group overflow-hidden relative"
                >
                  {previewUrl ? (
                    <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                  ) : (
                    <>
                      <ImageIcon className="text-slate-600 mb-2 group-hover:text-blue-500 transition-colors" size={32} />
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider group-hover:text-slate-200 transition-colors">Tải ảnh lên</p>
                    </>
                  )}
                  <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </div>
              </div>

              <button 
                onClick={handleDiagnose}
                disabled={loading || !description.trim()}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-600/30 hover:bg-blue-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    AI Đang phân tích...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Bắt đầu chẩn đoán
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-8 animate-fade-in">
              {/* Diagnosis Header */}
              <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-3xl space-y-3">
                <div className="flex items-center gap-2 text-blue-400">
                  <Wrench size={18} />
                  <span className="text-xs font-black uppercase tracking-widest">Kết quả chẩn đoán</span>
                </div>
                <h3 className="text-xl font-bold text-white leading-relaxed">{result.diagnosis}</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Mức độ</p>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={cn("w-5 h-5", result.severity === 'critical' || result.severity === 'high' ? 'text-rose-500' : 'text-amber-500')} />
                    <span className="font-bold text-slate-200 capitalize">{result.severity}</span>
                  </div>
                </div>
                <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Chi phí ước tính</p>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <DollarSign size={18} />
                    <span className="font-bold">{result.estimated_cost_min.toLocaleString()} - {result.estimated_cost_max.toLocaleString()} đ</span>
                  </div>
                </div>
              </div>

              {result.safety_warning && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-4">
                  <AlertTriangle className="text-rose-500 shrink-0" size={24} />
                  <div>
                    <p className="text-xs font-black text-rose-500 uppercase tracking-widest mb-1">Cảnh báo an toàn</p>
                    <p className="text-sm text-rose-100/90 font-medium">{result.safety_warning}</p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Các bước gợi ý thực hiện</h4>
                <div className="grid grid-cols-1 gap-2">
                  {result.suggested_actions.map((action, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-white/3 rounded-xl border border-white/5">
                      <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center text-xs font-bold">{idx + 1}</div>
                      <span className="text-sm text-slate-300 font-medium">{action}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => setResult(null)}
                  className="flex-1 py-4 bg-white/5 text-slate-400 rounded-2xl font-bold text-sm uppercase tracking-widest border border-white/10 hover:bg-white/10"
                >
                  Chẩn đoán lại
                </button>
                <button 
                  className="flex-2 py-4 bg-ff-cta-orange text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-ff-cta-orange/20 hover:bg-ff-cta-orange/90 flex items-center justify-center gap-2 px-8"
                  onClick={() => window.location.href = `/customer/technicians?service=${result.recommended_category}`}
                >
                  Tìm thợ {result.recommended_category} ngay
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
