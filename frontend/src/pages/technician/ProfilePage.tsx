import { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, MapPin, Briefcase, Edit, Star, 
  ShieldCheck, Award, Settings, LogOut, ChevronRight,
  Target, Zap, Clock, X, Save, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import technicianService, { type TechnicianProfile } from '@/services/technicianService';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/authStore';

export default function TechProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<TechnicianProfile | null>(null);
  const { fetchMe, logout } = useAuthStore();

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    bio: '',
    specialties: [] as string[]
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await technicianService.getProfile();
      setProfile(data);
      setFormData({
        fullName: data.fullName || '',
        email: data.email || '',
        phone: data.phone || '',
        bio: data.bio || '',
        specialties: data.specialties || []
      });
    } catch (err) {
      toast.error('Không thể tải thông tin hồ sơ');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await technicianService.updateProfile(formData);
      toast.success('Cập nhật hồ sơ thành công');
      setIsEditing(false);
      await fetchProfile();
      await fetchMe(); // Sync global user state for header
    } catch (err) {
      toast.error('Lỗi khi cập nhật hồ sơ');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Đang tải hồ sơ...</p>
      </div>
    );
  }

  if (!profile) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-center p-6">
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Không tìm thấy thông tin hồ sơ</p>
        <button onClick={fetchProfile} className="text-blue-500 text-xs font-black uppercase">Thử lại</button>
    </div>
  );

  return (
    <div className="p-2 md:p-6 space-y-8 pb-20 overflow-x-hidden">
      {/* Header Profile Section */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-[32px] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
        <div className="relative bg-[#0f172a]/80 backdrop-blur-xl rounded-[32px] border border-white/5 p-8 shadow-2xl">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 p-1">
                <div className="w-full h-full rounded-[22px] bg-[#0f172a] flex items-center justify-center overflow-hidden">
                   {profile.avatarUrl ? (
                     <img src={profile.avatarUrl} alt={profile.fullName} className="w-full h-full object-cover" />
                   ) : (
                     <User className="w-16 h-16 text-slate-500" />
                   )}
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-xl shadow-lg border-2 border-[#0f172a]">
                <ShieldCheck size={18} />
              </div>
            </div>

            <div className="flex-1 text-center md:text-left space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-black text-white tracking-tight uppercase">{profile.fullName}</h1>
                  <p className="text-blue-400 font-bold text-xs uppercase tracking-[0.2em] mt-1">{profile.level}</p>
                </div>
                <div className="flex gap-2 justify-center">
                  <button className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all text-slate-400">
                    <Settings size={20} />
                  </button>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20"
                  >
                    <Edit size={16} />
                    Chỉnh sửa
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-6 pt-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <Mail size={16} className="text-blue-500" />
                  <span className="text-sm font-medium">{profile.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Phone size={16} className="text-emerald-500" />
                  <span className="text-sm font-medium">{profile.phone || 'Chưa cập nhật'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock size={16} className="text-purple-500" />
                  <span className="text-sm font-medium italic">Tham gia {profile.since}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview Removed */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[#0f172a]/50 backdrop-blur-md rounded-3xl border border-white/5 p-8 shadow-xl">
             <div className="mb-8">
                <h3 className="text-lg font-black text-white uppercase tracking-tight mb-4">Giới thiệu</h3>
                <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">
                  {profile.bio || 'Chưa có thông tin giới thiệu. Hãy cập nhật hồ sơ để khách hàng hiểu rõ hơn về bạn.'}
                </p>
             </div>

            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-8">Kỹ năng & Chuyên môn</h3>
            
            <div className="space-y-8">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Lĩnh vực chuyên sâu</p>
                <div className="flex flex-wrap gap-2">
                  {profile.specialties.length > 0 ? profile.specialties.map(s => (
                    <span key={s} className="px-5 py-2.5 bg-blue-500/10 text-blue-400 text-xs font-black rounded-xl border border-blue-500/20 uppercase tracking-tight">
                      {s}
                    </span>
                  )) : (
                    <p className="text-xs text-slate-600 italic">Chưa cập nhật chuyên môn</p>
                  )}
                </div>
              </div>

              {/* Experience Subsection Removed */}
            </div>
          </div>
        </div>

        {/* Right Column: Work Areas & Account */}
        <div className="space-y-8">
          {/* Service Info Removed */}

          <div className="bg-[#0f172a]/50 backdrop-blur-md rounded-3xl border border-white/5 p-4 shadow-xl">
             <button 
               onClick={() => logout()}
               className="w-full flex items-center justify-center gap-3 py-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
             >
                <LogOut size={16} />
                Đăng xuất tài khoản
             </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !saving && setIsEditing(false)}
              className="absolute inset-0 bg-[#02050b]/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-[#0f172a] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl"
            >
              <form onSubmit={handleSave} className="p-8 md:p-10 space-y-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                   <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Chỉnh sửa hồ sơ</h2>
                   <button 
                     type="button"
                     onClick={() => setIsEditing(false)}
                     className="p-2 text-slate-500 hover:text-white transition-colors"
                   >
                     <X size={24} />
                   </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Họ và tên</label>
                      <input 
                        required
                        value={formData.fullName}
                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white text-sm focus:border-blue-500 outline-none transition-all"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email (Gmail)</label>
                      <input 
                        required
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white text-sm focus:border-blue-500 outline-none transition-all"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Số điện thoại</label>
                      <input 
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white text-sm focus:border-blue-500 outline-none transition-all"
                      />
                   </div>
                   <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Giới thiệu bản thân</label>
                      <textarea 
                        rows={3}
                        value={formData.bio}
                        onChange={e => setFormData({ ...formData, bio: e.target.value })}
                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white text-sm focus:border-blue-500 outline-none transition-all resize-none"
                      />
                   </div>
                </div>

                <div className="flex gap-4 pt-4">
                   <button 
                     type="button"
                     onClick={() => setIsEditing(false)}
                     disabled={saving}
                     className="flex-1 py-4 bg-white/5 text-slate-400 rounded-[20px] font-black text-xs uppercase tracking-widest border border-white/5 hover:bg-white/10 transition-all"
                   >
                     Hủy bỏ
                   </button>
                   <button 
                     type="submit"
                     disabled={saving}
                     className="flex-[2] py-4 bg-blue-600 text-white rounded-[20px] font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all shadow-2xl shadow-blue-600/40 flex items-center justify-center gap-2"
                   >
                     {saving ? (
                       <Loader2 className="w-4 h-4 animate-spin" />
                     ) : (
                       <Save size={16} />
                     )}
                     Lưu thay đổi
                   </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
