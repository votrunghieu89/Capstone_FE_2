import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { 
  User, Mail, Phone, MapPin, Edit, ShieldCheck, 
  Settings, LogOut, Clock, X, Save, Loader2, Star, Camera,
  Briefcase, Award, TrendingUp, Map
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import technicianService from '@/services/technicianService';
import publicService, { CityDTO, ServiceDTO } from '@/services/publicService';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/authStore';
import type { TechnicianProfileViewDTO } from '@/types/technician';

export default function TechProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<TechnicianProfileViewDTO | null>(null);
  const { user, isOnline, logout, setUser } = useAuthStore();

  const [cities, setCities] = useState<CityDTO[]>([]);
  const [services, setServices] = useState<ServiceDTO[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    address: '',
    description: '',
    experiences: '',
    cityId: '',
    serviceId: '',
    latitude: 16.047079,
    longitude: 108.206230,
    avatarFile: null as File | null
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initData = async () => {
      try {
        const [citiesData, servicesData] = await Promise.all([
          publicService.getCities(),
          publicService.getServices()
        ]);
        setCities(citiesData);
        setServices(servicesData);

        if (user?.id) {
          fetchProfile();
        } else if (citiesData.length > 0 && servicesData.length > 0) {
          setFormData(prev => ({
              ...prev,
              cityId: citiesData[0].cityId,
              serviceId: servicesData[0].id
          }));
        }
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu khởi tạo:', err);
      }
    };

    initData();
  }, [user?.id]);

  const fetchProfile = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const data = await technicianService.getProfile(user.id);
      setProfile(data);
      setFormData({
        fullName: data.fullName || '',
        phoneNumber: data.phoneNumber || '',
        address: data.address || '',
        description: data.description || '',
        experiences: data.experiences || '',
        cityId: data.cityId || '',
        serviceId: data.serviceId || '',
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
        avatarFile: null
      });
      setAvatarPreview(data.avatarURL || null);
    } catch (err: any) {
      toast.error('Điền đầy đủ thông tin nha');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, avatarFile: file });
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    try {
      setSaving(true);
      await technicianService.updateProfile({
        ...formData,
        id: user.id
      } as any);
      toast.success('Cập nhật hồ sơ thành công');
      setIsEditing(false);
      await fetchProfile();
      
      if (user) {
        setUser({
          ...user,
          fullName: formData.fullName,
          phone: formData.phoneNumber,
          avatarUrl: avatarPreview || user.avatarUrl
        });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi cập nhật hồ sơ');
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
    <div className="h-[60vh] flex flex-col items-center justify-center gap-6 text-center p-6">
        <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-2">
            <User className="w-10 h-10 text-slate-600" />
        </div>
        <div className="space-y-2">
            <p className="text-white font-black uppercase tracking-widest text-sm">Bạn chưa có hồ sơ kỹ thuật viên</p>
            <p className="text-slate-500 text-xs max-w-xs mx-auto">Hãy tạo hồ sơ ngay để bắt đầu nhận các yêu cầu sửa chữa từ khách hàng.</p>
        </div>
        <button 
          onClick={() => setIsEditing(true)} 
          className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20"
        >
            Tạo hồ sơ ngay
        </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] p-4 md:p-8 space-y-6 pb-32 max-w-7xl mx-auto font-sans selection:bg-indigo-500/30">
      {/* Premium Identity Header */}
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-[40px] blur-2xl opacity-30"></div>
        <div className="relative bg-[#0f172a]/40 backdrop-blur-3xl rounded-[32px] border border-white/[0.08] p-6 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Signature Avatar */}
            <div className="relative">
              <div className={cn(
                "w-40 h-40 rounded-[36px] p-1 transition-all duration-1000 shadow-2xl",
                isOnline 
                  ? "bg-gradient-to-tr from-emerald-500 via-teal-400 to-blue-500 shadow-emerald-500/20" 
                  : "bg-gradient-to-tr from-slate-700 via-slate-600 to-slate-800 shadow-slate-900/40"
              )}>
                <div className="w-full h-full rounded-[32px] bg-[#020617] flex items-center justify-center overflow-hidden border-4 border-[#020617]">
                   {profile.avatarURL ? (
                     <img src={profile.avatarURL} alt={profile.fullName} className="w-full h-full object-cover" />
                   ) : (
                     <User className="w-20 h-20 text-slate-800" />
                   )}
                </div>
              </div>
              <motion.div 
                animate={isOnline ? { scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
                className={cn(
                  "absolute -bottom-2 -right-2 p-3 rounded-2xl border-4 border-[#020617] shadow-xl",
                  isOnline ? "bg-emerald-500" : "bg-slate-700"
                )}
              >
                 <ShieldCheck size={20} className="text-white" />
              </motion.div>
            </div>

            {/* Identity Info */}
            <div className="flex-1 text-center lg:text-left space-y-6">
              <div className="space-y-4">
                <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em]">
                  Chuyên gia đã xác thực
                </div>
                <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter leading-none">
                  {profile.fullName}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-6 justify-center lg:justify-start">
                <div className="flex items-center gap-3 group/info">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 group-hover/info:text-blue-400 transition-colors">
                    <Mail size={16} />
                  </div>
                  <span className="text-sm font-bold text-slate-400">{user?.email}</span>
                </div>
                <div className="w-px h-4 bg-white/10 hidden md:block"></div>
                <div className="flex items-center gap-3 group/info">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 group-hover/info:text-emerald-400 transition-colors">
                    <Phone size={16} />
                  </div>
                  <span className="text-sm font-bold text-slate-400">{profile.phoneNumber || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Strategic Actions */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-4 min-w-[220px]">
              <button 
                onClick={() => setIsEditing(true)}
                className="group relative h-14 px-8 bg-white text-[#020617] rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] overflow-hidden transition-all hover:-translate-y-1 active:scale-95 shadow-xl"
              >
                <div className="absolute inset-0 bg-indigo-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <span className="relative z-10 flex items-center justify-center gap-3 group-hover:text-white transition-colors">
                  <Edit size={18} />
                  Chỉnh sửa hồ sơ
                </span>
              </button>
              <button 
                onClick={() => logout()} 
                className="h-14 px-8 flex items-center justify-center gap-3 bg-white/5 hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 rounded-2xl border border-white/5 hover:border-rose-500/20 transition-all font-black text-[11px] uppercase tracking-[0.15em] active:scale-95"
              >
                <LogOut size={18} />
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Stats Overlay */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Đánh giá hiệu suất', value: profile.averageRating?.toFixed(1) || '0.0', sub: 'Sao', icon: Star, color: 'text-amber-400', bg: 'from-amber-400/20 to-transparent' },
          { label: 'Việc hoàn thành', value: profile.totalOrders || '0', sub: 'Công việc', icon: TrendingUp, color: 'text-blue-400', bg: 'from-blue-400/20 to-transparent' },
          { label: 'Kinh nghiệm', value: profile.experiences.match(/\d+/) ? profile.experiences.match(/\d+/)?.[0] : '0', sub: 'Năm', icon: Award, color: 'text-indigo-400', bg: 'from-indigo-400/20 to-transparent' }
        ].map((stat, i) => (
          <div key={i} className="group relative overflow-hidden bg-[#0f172a]/40 backdrop-blur-2xl rounded-[32px] border border-white/5 p-8 transition-all hover:border-white/10">
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500", stat.bg)}></div>
            <div className="relative flex items-center gap-8">
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center bg-white/5 shadow-inner", stat.color)}>
                <stat.icon size={28} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white">{stat.value}</span>
                  <span className="text-[10px] text-slate-600 font-bold uppercase">{stat.sub}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Professional Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Card: Core Identity */}
        <div className="lg:col-span-12 xl:col-span-8">
          <div className="bg-[#0f172a]/40 backdrop-blur-3xl rounded-[40px] border border-white/5 p-10 md:p-14 shadow-2xl relative overflow-hidden h-full">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none rotate-12">
              <Briefcase size={300} />
            </div>
            
            <div className="relative z-10 space-y-16">
              <section>
                <div className="flex items-center gap-6 mb-10">
                  <div className="w-12 h-0.5 bg-indigo-600 rounded-full"></div>
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em]">Giới thiệu bản thân</h3>
                </div>
                <div className="max-w-3xl">
                  <p className="text-xl md:text-2xl text-slate-300 font-medium leading-relaxed italic opacity-90">
                    &ldquo;{profile.description || 'Chuyên gia tận tâm cung cấp các giải pháp kỹ thuật chất lượng cao cho ngôi nhà của bạn.'}&rdquo;
                  </p>
                </div>
              </section>

              <section className="pt-12 border-t border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Trạng thái hoạt động</h3>
                  <div className={cn(
                    "inline-flex items-center gap-6 px-8 py-4 rounded-3xl border transition-all duration-700",
                    isOnline 
                      ? "bg-emerald-500/5 border-emerald-500/10" 
                      : "bg-rose-500/5 border-rose-500/10"
                  )}>
                    <div className="relative">
                      <div className={cn("w-3 h-3 rounded-full", isOnline ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" : "bg-rose-500")}></div>
                      {isOnline && <div className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-500 animate-ping opacity-40"></div>}
                    </div>
                    <div>
                      <span className={cn(
                        "text-xs font-black uppercase tracking-[0.2em] block",
                        isOnline ? "text-emerald-500" : "text-rose-500"
                      )}>
                        {isOnline ? 'Đang trực tuyến' : 'Đang ngoại tuyến'}
                      </span>
                      <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-0.5">
                        {isOnline ? 'Sẵn sàng nhận việc ngay' : 'Đang nghỉ hoặc trong phiên làm việc'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 min-w-[280px]">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Lĩnh vực chuyên môn</h3>
                  <div className="p-6 bg-white/[0.02] rounded-3xl border border-white/5">
                    <div className="flex items-center justify-between gap-8">
                        <p className="text-lg font-black text-white uppercase tracking-tighter">{profile.serviceName || 'Nghiệp vụ'}</p>
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                          <Briefcase size={24} />
                        </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* Right Card: Location Context */}
        <div className="lg:col-span-12 xl:col-span-4">
          <div className="bg-[#0f172a]/40 backdrop-blur-3xl rounded-[40px] border border-white/5 p-10 md:p-12 shadow-2xl space-y-12 h-full">
            <section className="space-y-10">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center justify-between">
                Vị trí dịch vụ
                <MapPin size={14} className="opacity-20" />
              </h3>
              
              <div className="space-y-6">
                {[
                  { label: 'Thành phố làm việc', value: profile.city || 'Đà Nẵng, VN', icon: Map, color: 'text-emerald-400' },
                  { label: 'Địa chỉ cụ thể', value: profile.address || 'Quận huyện trung tâm', icon: MapPin, color: 'text-blue-400' }
                ].map((item, idx) => (
                  <div key={idx} className="group flex items-center gap-6 p-6 bg-white/[0.03] rounded-3xl border border-white/5 hover:border-white/10 transition-all">
                    <div className={cn("w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110", item.color)}>
                      <item.icon size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">{item.label}</p>
                      <p className="text-base font-black text-slate-200">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </div>
      </div>

      {/* Signature Modal - Enhanced Pro Design */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !saving && setIsEditing(false)}
              className="absolute inset-0 bg-[#020617]/90 backdrop-blur-2xl"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative w-full max-w-3xl bg-[#0f172a] border border-white/5 rounded-[48px] shadow-[0_40px_120px_rgba(0,0,0,0.8)] overflow-hidden"
            >
              <form onSubmit={handleSave} className="p-10 md:p-14 space-y-12 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between">
                   <div className="space-y-2">
                     <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Cài đặt hồ sơ</h2>
                     <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">Tinh chỉnh thông tin chuyên nghiệp của bạn</p>
                   </div>
                   <button 
                     type="button"
                     onClick={() => setIsEditing(false)}
                     className="w-14 h-14 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all flex items-center justify-center hover:rotate-90"
                   >
                     <X size={28} />
                   </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                  {/* Photo Edit Control */}
                  <div className="md:col-span-4 flex flex-col items-center gap-8">
                    <div className="relative group/avatar">
                      <div className="w-40 h-40 rounded-[44px] bg-gradient-to-tr from-indigo-600 via-blue-500 to-indigo-400 p-1 shadow-2xl">
                        <div className="w-full h-full rounded-[40px] bg-[#0f172a] flex items-center justify-center overflow-hidden border-4 border-[#0f172a]">
                          {avatarPreview ? (
                            <img src={avatarPreview} alt="Xem trước" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-16 h-16 text-slate-800" />
                          )}
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 flex flex-col items-center justify-center bg-indigo-600/60 opacity-0 group-hover/avatar:opacity-100 transition-all rounded-[44px] backdrop-blur-sm"
                      >
                         <Camera size={32} className="text-white mb-2" />
                         <span className="text-[9px] font-black text-white uppercase tracking-widest">Thay đổi</span>
                      </button>
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                    </div>
                  </div>

                  {/* Comprehensive Form Settings */}
                  <div className="md:col-span-8 space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Thành phố làm việc</label>
                          <div className="relative">
                            <Map className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <select 
                              value={formData.cityId}
                              onChange={e => setFormData({ ...formData, cityId: e.target.value })}
                              className="w-full pl-12 pr-10 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white text-sm focus:border-indigo-500/50 outline-none transition-all appearance-none font-bold shadow-inner"
                            >
                              <option value="" className="bg-[#0f172a]">Chọn thành phố</option>
                              {cities.map(city => (
                                <option key={city.cityId} value={city.cityId} className="bg-[#0f172a]">{city.cityName}</option>
                              ))}
                            </select>
                          </div>
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Lĩnh vực chuyên môn</label>
                          <div className="relative">
                            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <select 
                              value={formData.serviceId}
                              onChange={e => setFormData({ ...formData, serviceId: e.target.value })}
                              className="w-full pl-12 pr-10 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white text-sm focus:border-indigo-500/50 outline-none transition-all appearance-none font-bold shadow-inner"
                            >
                              <option value="" className="bg-[#0f172a]">Chọn lĩnh vực</option>
                              {services.map(service => (
                                <option key={service.id} value={service.id} className="bg-[#0f172a]">{service.serviceName}</option>
                              ))}
                            </select>
                          </div>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Họ và tên</label>
                         <div className="relative">
                           <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                           <input 
                             required
                             value={formData.fullName}
                             onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                             className="w-full pl-12 pr-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white text-sm focus:border-indigo-500/50 outline-none font-bold transition-all"
                           />
                         </div>
                       </div>
                       <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Số điện thoại</label>
                         <div className="relative">
                           <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                           <input 
                             value={formData.phoneNumber}
                             onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                             className="w-full pl-12 pr-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white text-sm focus:border-indigo-500/50 outline-none font-bold transition-all"
                           />
                         </div>
                       </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Địa chỉ cụ thể</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input 
                          value={formData.address}
                          onChange={e => setFormData({ ...formData, address: e.target.value })}
                          className="w-full pl-12 pr-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white text-sm focus:border-indigo-500/50 outline-none font-bold transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Giới thiệu bản thân</label>
                      <div className="relative">
                        <textarea 
                          rows={3}
                          value={formData.description}
                          onChange={e => setFormData({ ...formData, description: e.target.value })}
                          className="w-full px-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white text-sm focus:border-indigo-500/50 outline-none font-medium resize-none leading-relaxed transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-6 pt-6">
                   <button 
                     type="button"
                     onClick={() => setIsEditing(false)}
                     disabled={saving}
                     className="flex-1 py-6 bg-white/5 text-slate-400 rounded-3xl font-black text-xs uppercase tracking-[0.2em] border border-white/5 hover:bg-white/10 transition-all"
                   >
                     Hủy thay đổi
                   </button>
                   <button 
                     type="submit"
                     disabled={saving}
                     className="flex-[2] py-6 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3 relative overflow-hidden group"
                   >
                     <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                     {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (
                       <>
                         <Save size={20} className="relative z-10" />
                         <span className="relative z-10">Lưu hồ sơ chuyên nghiệp</span>
                       </>
                     )}
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
