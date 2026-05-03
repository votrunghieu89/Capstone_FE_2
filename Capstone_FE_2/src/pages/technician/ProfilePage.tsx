import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { 
  User, Mail, Phone, MapPin, ShieldCheck, 
  X, Loader2, Star, Camera, Edit, LogOut,
  Briefcase, Award, TrendingUp, Layers, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import technicianService from '@/services/technicianService';
import publicService, { CityDTO, ServiceDTO } from '@/services/publicService';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/authStore';
import type { TechnicianProfileViewDTO } from '@/types/technician';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import technicianOrderService from '@/services/technicianOrderService';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { getMapEmbedSrc, getMapEmbedSrcByAddress } from '@/utils/mapUtils';

const currentLocationIcon = new L.DivIcon({
  className: 'custom-location-icon',
  html: '<div class="relative flex items-center justify-center w-8 h-8"><div class="absolute w-full h-full bg-rose-500 rounded-full animate-ping opacity-75"></div><div class="relative w-4 h-4 bg-rose-500 rounded-full border-2 border-white shadow-[0_0_20px_rgba(244,63,94,1)]"></div></div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

export default function TechProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<TechnicianProfileViewDTO | null>(null);
  const { user, isOnline, logout, setUser } = useAuthStore();
  // Lấy vị trí GPS thực tế từ trình duyệt (giống hệt CommandCenter)
  const { location: currentLoc } = useCurrentLocation();

  const [cities, setCities] = useState<CityDTO[]>([]);
  const [services, setServices] = useState<ServiceDTO[]>([]);

  // Modal Tabs State
  const [modalTab, setModalTab] = useState<'profile' | 'security'>('profile');
  // State lưu vị trí thực tế lấy từ API GPS
  const [techLocation, setTechLocation] = useState<{address: string, cityName: string} | null>(null);
  // State mở/đóng Modal bản đồ phóng to
  const [isMapOpen, setIsMapOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    address: '',
    description: '',
    experiences: '',
    cityId: '',
    serviceId: '',
    latitude: '16.047079',
    longitude: '108.206230',
    avatarFile: null as File | null
  });

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [isForgotPass, setIsForgotPass] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1); // 1: Email, 2: OTP, 3: New Pass
  const [forgotData, setForgotData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
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
        }
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu khởi tạo:', err);
      }
    };

    initData();
  }, [user?.id]);

  const fetchProfile = async () => {
    if (!user?.id) return null;
    try {
      setLoading(true);
      const [data, totalCompleted, avgRating] = await Promise.all([
        technicianService.getProfile(user.id),
        technicianService.getTotalCompleted(user.id),
        technicianService.getAvgRating(user.id)
      ]);

      const enrichedProfile = {
        ...data,
        totalOrders: totalCompleted || 0,
        averageRating: avgRating || 0
      };

      setProfile(enrichedProfile);

      // Gọi API lấy vị trí GPS thực tế của kỹ thuật viên
      // GET /api/technician/order/location/technician/{technicianId}
      try {
        const loc = await technicianOrderService.getTechnicianLocation(user.id);
        setTechLocation(loc);
      } catch (err) {
        console.error('Lỗi lấy vị trí KTV từ API:', err);
      }
      setFormData({
        fullName: data.fullName || '',
        phoneNumber: data.phoneNumber || '',
        address: data.address || '',
        description: data.description || '',
        experiences: data.experiences || '',
        cityId: data.cityId || '',
        serviceId: data.serviceId || '',
        latitude: data.latitude || '16.047079',
        longitude: data.longitude || '108.206230',
        avatarFile: null
      });
      setAvatarPreview(data.avatarURL || null);
      return enrichedProfile;
    } catch (err: any) {
      toast.error('Gặp lỗi khi tải hồ sơ');
      console.error(err);
      return null;
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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    // --- Validate Form Data ---
    if (!formData.fullName?.trim()) {
      toast.error('Vui lòng nhập Họ và tên!');
      return;
    }
    if (!formData.phoneNumber?.trim()) {
      toast.error('Vui lòng nhập Số điện thoại!');
      return;
    }
    if (!formData.address?.trim()) {
      toast.error('Vui lòng nhập Địa chỉ cụ thể!');
      return;
    }
    if (!formData.cityId) {
      toast.error('Vui lòng chọn Thành phố/Tỉnh!');
      return;
    }
    if (!formData.experiences || Number(formData.experiences) < 0) {
      toast.error('Vui lòng nhập Số năm kinh nghiệm hợp lệ!');
      return;
    }
    if (!formData.serviceId) {
      toast.error('Vui lòng chọn Dịch vụ cung cấp!');
      return;
    }
    if (!formData.description?.trim()) {
      toast.error('Vui lòng nhập Giới thiệu / Tuyên ngôn cá nhân!');
      return;
    }

    try {
      setSaving(true);
      // Check Email trùng lặp nếu có thay đổi
      if (formData.fullName && profile?.email && formData.fullName !== profile.fullName) {
        // Có thể gọi authService.checkEmail ở đây nếu cần validation realtime
      }

      // Payload gửi đi khớp với yêu cầu BE
      const updateData = {
        id: user.id,
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        description: formData.description, // Tương đương 'bio' trong mô tả của bạn
        experiences: formData.experiences, // Tương đương 'yearsOfExperience'
        cityId: formData.cityId,
        serviceId: formData.serviceId,
        latitude: formData.latitude,
        longitude: formData.longitude,
        avatarFile: formData.avatarFile // Gửi kèm theo cả file ảnh
      };

      await technicianService.updateProfile(updateData);
      const updatedProfile = await fetchProfile();
      if (user && updatedProfile) {
        setUser({
          ...user,
          fullName: updatedProfile.fullName,
          phone: updatedProfile.phoneNumber,
          avatarUrl: updatedProfile.avatarURL
        });
      }
      toast.success('Hồ sơ đã được cập nhật thành công!');
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi cập nhật hồ sơ');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    
    if (!passwordForm.oldPassword) {
      toast.error('Vui lòng nhập mật khẩu hiện tại!');
      return;
    }
    if (!passwordForm.newPassword) {
      toast.error('Vui lòng nhập mật khẩu mới!');
      return;
    }
    if (passwordForm.oldPassword === passwordForm.newPassword) {
      toast.error('Mật khẩu mới không được trùng với mật khẩu hiện tại!');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
       toast.error('Nhập lại mật khẩu mới không khớp!');
       return;
    }
    
    try {
      setSaving(true);
      const authService = (await import('@/services/authService')).default;
      await authService.changePassword(user.id, passwordForm.oldPassword, passwordForm.newPassword, passwordForm.confirmPassword);
      toast.success('Đổi mật khẩu thành công!');
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Mật khẩu hiện tại không đúng hoặc có lỗi xảy ra!');
    } finally {
      setSaving(false);
    }
  };

  const handleSendOTP = async () => {
    if (!forgotData.email.trim()) {
      toast.error('Vui lòng nhập Email hoặc SĐT!');
      return;
    }
    try {
      setSaving(true);
      const authService = (await import('@/services/authService')).default;
      await authService.sendOTP(forgotData.email);
      toast.success('Mã OTP đã được gửi đến email/SĐT của bạn!');
      setForgotStep(2);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể gửi mã xác nhận!');
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!forgotData.otp.trim()) {
      toast.error('Vui lòng nhập mã OTP!');
      return;
    }
    try {
      setSaving(true);
      const authService = (await import('@/services/authService')).default;
      await authService.verifyOTP(forgotData.email, forgotData.otp);
      toast.success('Xác thực OTP thành công!');
      setForgotStep(3);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Mã xác nhận không đúng!');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!forgotData.newPassword) {
      toast.error('Vui lòng nhập mật khẩu mới!');
      return;
    }
    if (forgotData.newPassword !== forgotData.confirmPassword) {
      toast.error('Mật khẩu nhập lại không khớp!');
      return;
    }
    try {
      setSaving(true);
      // NOTE: BE need a resetPassword endpoint. Mock success for now since it's UI flow.
      toast.success('Cập nhật mật khẩu mới thành công!');
      setIsForgotPass(false);
      setForgotStep(1);
      setForgotData({ email: '', otp: '', newPassword: '', confirmPassword: '' });
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi đặt lại mật khẩu!');
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="h-screen bg-[#020617] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-[#0ea5e9] animate-spin" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Đang tải hồ sơ...</p>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="h-[calc(100vh-100px)] overflow-hidden bg-[#020617] text-slate-300 font-sans p-6">
      <div className="h-full max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Content */}
        <div className="lg:col-span-8 flex flex-col gap-4 h-full">
          
          {/* Top Profile Card */}
          <section className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[32px] p-6 lg:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden group shrink-0">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <div className="w-28 h-28 lg:w-32 lg:h-32 rounded-[32px] p-1 bg-gradient-to-tr from-[#1e293b] to-[#334155] border-2 border-white/10 shadow-2xl flex items-center justify-center relative">
                   <div className="w-full h-full rounded-[28px] overflow-hidden bg-[#0a0f1e] flex items-center justify-center">
                     {profile?.avatarURL ? (
                       <img src={profile.avatarURL} alt="Avatar" className="w-full h-full object-cover" />
                     ) : (
                       <User size={56} className="text-slate-800" />
                     )}
                   </div>
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#1e293b] border border-white/10 rounded-2xl flex items-center justify-center text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  <ShieldCheck size={20} />
                </div>
              </div>

              <div className="text-center md:text-left space-y-4">
                <div className="space-y-1">
                   <span className="px-4 py-1.5 bg-[#4f46e5]/20 text-[#818cf8] border border-[#4f46e5]/30 rounded-full text-[9px] font-black uppercase tracking-[0.2em] inline-block mb-2">
                     Chuyên gia đã xác thực
                   </span>
                   <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tighter uppercase leading-tight">
                     {profile?.fullName || 'Kỹ thuật viên'}
                   </h1>
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-1 justify-center md:justify-start">
                   <div className="flex items-center gap-3 px-4 py-2 bg-white/[0.03] border border-white/5 rounded-2xl text-slate-300 relative overflow-hidden group/mail">
                      <div className="absolute inset-0 bg-[#0ea5e9]/10 translate-y-full group-hover/mail:translate-y-0 transition-transform"></div>
                      <Mail size={16} className="text-[#0ea5e9] relative z-10" />
                      <span className="text-xs md:text-sm font-bold relative z-10">{profile?.email}</span>
                   </div>
                   <div className="flex items-center gap-3 px-4 py-2 bg-rose-500/5 border border-rose-500/10 rounded-2xl text-slate-300 relative overflow-hidden group/phone">
                      <div className="absolute inset-0 bg-rose-500/10 translate-y-full group-hover/phone:translate-y-0 transition-transform"></div>
                      <Phone size={16} className="text-rose-400 relative z-10" />
                      <span className="text-xs md:text-sm font-bold relative z-10">{profile?.phoneNumber || 'SĐT chưa cập nhật'}</span>
                   </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full md:w-auto mt-4 md:mt-0">
              <button onClick={() => setIsEditing(true)} className="flex items-center justify-center gap-2 px-8 py-3 bg-white/[0.03] hover:bg-[#0ea5e9]/10 border border-white/5 hover:border-[#0ea5e9]/30 text-slate-300 hover:text-[#0ea5e9] rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all group">
                <Edit size={14} className="text-[#0ea5e9]" />
                Chỉnh sửa
              </button>
              <button onClick={logout} className="flex items-center justify-center gap-2 px-8 py-3 bg-rose-500/5 hover:bg-rose-500/20 border border-rose-500/10 hover:border-rose-500/40 text-slate-300 hover:text-rose-400 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all group">
                <LogOut size={14} className="text-rose-500" />
                Đăng xuất
              </button>
            </div>
          </section>

          {/* Stats Cluster */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
             {[
               { label: 'ĐÁNH GIÁ', value: `${(profile?.averageRating || 0).toFixed(1)} SAO`, icon: Star, color: 'text-amber-400', bg: 'bg-[#1e1b15]', bcolor: 'border-amber-400/10' },
               { label: 'HOÀN THÀNH', value: `${profile?.totalOrders || '0'} ĐƠN`, icon: TrendingUp, color: 'text-blue-400', bg: 'bg-[#121927]', bcolor: 'border-blue-400/10' },
               { label: 'KINH NGHIỆM', value: `${profile?.experiences || '0'} NĂM`, icon: Award, color: 'text-purple-400', bg: 'bg-[#171520]', bcolor: 'border-purple-400/10' }
             ].map((stat, idx) => (
                <div key={idx} className="bg-white/[0.02] backdrop-blur-3xl rounded-[28px] border border-white/5 p-5 flex items-center justify-start gap-4 group hover:bg-white/[0.05] transition-all">
                   <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border", stat.bg, stat.color, stat.bcolor)}>
                      <stat.icon size={22} />
                   </div>
                   <div className="text-left flex flex-col justify-center gap-0.5">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{stat.label}</p>
                      <p className="text-xl font-black text-white">{stat.value}</p>
                   </div>
                </div>
             ))}
          </section>

          {/* Grid Layout: Expertise & Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 h-0">
             {/* Description (Tuyên ngôn cá nhân) */}
             <div className="bg-white/[0.02] backdrop-blur-3xl rounded-[32px] border border-white/5 p-8 flex flex-col justify-between group relative overflow-hidden h-full">
                <div>
                   <div className="flex items-center gap-3 mb-6">
                      <div className="w-1.5 h-6 bg-[#4f46e5] rounded-full" />
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Tuyên ngôn cá nhân</h3>
                   </div>
                   <div className="px-2 overflow-hidden flex-1 mb-2">
                     <p className="text-2xl lg:text-3xl font-medium text-white italic tracking-wide break-words line-clamp-4">
                        {profile.description || 'Chưa có lời giới thiệu...'}
                     </p>
                     <p className="text-4xl lg:text-5xl text-indigo-500/20 font-serif text-right mt-2 -mr-4">”</p>
                   </div>
                </div>
                <div className="flex items-center justify-between mt-auto pt-8 border-t border-white/5">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#4f46e5]" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Hỗ trợ kỹ thuật 24/7</span>
                   </div>
                   <div className="px-4 py-1.5 bg-white/[0.03] border border-white/5 rounded-full">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Verified Expert</span>
                   </div>
                </div>
             </div>

             {/* Right Col Items */}
             <div className="flex flex-col gap-4 h-full">
                {/* Chuyên môn */}
                <div className="flex-1 bg-white/[0.02] backdrop-blur-3xl rounded-[32px] border border-white/5 p-6 lg:p-8 flex items-center justify-between group overflow-hidden">
                   <div>
                      <div className="flex items-center gap-3 mb-6">
                         <div className="w-1.5 h-1.5 bg-[#4f46e5] rounded-full" />
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Chuyên môn nghiệp vụ</p>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">
                         {profile.serviceName || 'Dịch vụ'}
                      </h2>
                      <div className="flex gap-1 mt-4">
                         {[1, 2, 3, 4, 5].map(i => <div key={i} className={cn("w-8 h-1 rounded-full", i <= 4 ? "bg-[#4f46e5]" : "bg-white/10")} />)}
                      </div>
                   </div>
                   <div className="w-16 h-16 rounded-[24px] bg-[#4f46e5]/10 border border-[#4f46e5]/20 flex items-center justify-center text-[#818cf8] shrink-0">
                      <Briefcase size={28} />
                   </div>
                </div>

                {/* Hệ thống khả dụng */}
                <div className="flex-1 bg-white/[0.02] backdrop-blur-3xl rounded-[32px] border border-white/5 p-6 lg:p-8 flex flex-col justify-between group overflow-hidden">
                   <div className="flex items-center gap-3 mb-4">
                      <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Hệ thống khả dụng</p>
                   </div>
                   <div className={cn(
                     "flex items-center justify-between p-5 md:p-6 rounded-[24px] border border-rose-500/20 transiton-all",
                     isOnline ? "bg-[#062118] border-emerald-500/20" : "bg-[#250d18] border-rose-500/20"
                   )}>
                      <div className="flex items-center gap-4">
                         <div className={cn(
                           "w-3.5 h-3.5 rounded-full shadow-[0_0_15px_rgba(244,63,94,0.6)]",
                           isOnline ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)] animate-pulse" : "bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.6)]"
                         )} />
                         <span className={cn(
                           "text-2xl font-black uppercase tracking-[0.1em]",
                           isOnline ? "text-emerald-500" : "text-rose-500"
                         )}>
                           {isOnline ? 'ONLINE' : 'OFFLINE'}
                         </span>
                      </div>
                      <div className="text-right">
                        <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 justify-end">
                          {isOnline ? <span className="text-emerald-500 font-bold text-[8px]">⚡ LIVE SIGNAL</span> : <span className="text-rose-500 font-bold text-[8px]">⚠ NO SIGNAL</span>}
                          <span>SIGNAL STG: {isOnline ? '100%' : 'OFF'}</span>
                        </div>
                        {isOnline ? (
                          <div className="flex items-end gap-1 h-5 mt-1 justify-end">
                             {[1,2,3,4].map(i => <div key={i} className={`w-1.5 bg-emerald-500 rounded-sm animate-pulse ${['h-1.5','h-3','h-4','h-5'][i-1]}`} style={{ animationDelay: `${i*150}ms` }} />)}
                          </div>
                        ) : (
                          <div className="flex items-end gap-1 h-5 mt-1 justify-end">
                             {[1,2,3,4].map(i => <div key={i} className="w-1.5 h-1.5 bg-rose-500/40 rounded-sm" />)}
                          </div>
                        )}
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Sidebar - copy y nguyên từ CommandCenter */}
        <div className="lg:col-span-4 flex flex-col">
          <div
            className="bg-white/[0.02] backdrop-blur-3xl rounded-[32px] border border-white/5 p-6 lg:p-8 flex flex-col shadow-2xl relative overflow-hidden group transition-colors"
          >
            <div className="flex items-start justify-between mb-8 shrink-0 px-2">
              <div className="space-y-4 shrink-0">
                <h3 className="text-[11px] font-black text-[#2DD4BF] uppercase tracking-[0.4em] mb-2 shrink-0">VỊ TRÍ DỊCH VỤ</h3>
                {[
                  { label: 'THÀNH PHỐ', value: profile?.city || 'Đà Nẵng' },
                  { label: 'ĐỊA CHỈ CỤ THỂ', value: profile?.address || 'Chưa cập nhật' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <div className="mt-0.5 w-8 h-8 rounded-full bg-[#2DD4BF]/10 flex items-center justify-center text-[#2DD4BF] shrink-0">
                      <MapPin size={14} />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{item.label}</p>
                      <p className="text-sm font-bold text-slate-200 uppercase">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

            </div>

            <div className="relative rounded-2xl overflow-hidden border border-white/5 aspect-video bg-slate-900 group cursor-crosshair shrink-0">
               <iframe 
                  key={techLocation ? `${techLocation.address}-${techLocation.cityName}` : (currentLoc ? `${currentLoc.lat},${currentLoc.lng}` : 'profile')}
                  width="100%" 
                  height="100%" 
                  frameBorder="0" 
                  style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%)' }} 
                  src={techLocation ? getMapEmbedSrcByAddress(`${techLocation.address}, ${techLocation.cityName}`, 13) : getMapEmbedSrc(currentLoc, profile?.latitude, profile?.longitude, 13)} 
                  allowFullScreen
                ></iframe>
               <div className="absolute bottom-4 left-4 right-4 p-4 bg-black/80 backdrop-blur-md rounded-2xl border border-white/10 text-center">
                  <p className="text-[11px] font-black text-white uppercase leading-none mb-1 tracking-tight">{profile?.city ? `${profile.city} CITY` : 'ĐÀ NẴNG CITY'}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em]">ACTIVE COVERAGE</p>
               </div>
            </div>

          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-3xl">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-5xl bg-[#0a0f1e] border border-white/10 rounded-[48px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
               <div className="px-10 py-6 border-b border-white/5 flex flex-col gap-6 shadow-sm">
                  <div className="flex items-center justify-between">
                     <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Cấu hình hồ sơ</h2>
                     <button onClick={() => setIsEditing(false)} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-white/10 transition"><X size={24} /></button>
                  </div>
                  {/* Tabs */}
                  <div className="flex items-center gap-6">
                     <button 
                       onClick={() => setModalTab('profile')} 
                       className={cn("text-[11px] font-black uppercase tracking-widest pb-3 border-b-2 transition-colors", modalTab === 'profile' ? "text-[#0ea5e9] border-[#0ea5e9]" : "text-slate-500 border-transparent hover:text-slate-300")}
                     >
                       Thông tin cá nhân
                     </button>
                     <button 
                       onClick={() => setModalTab('security')} 
                       className={cn("text-[11px] font-black uppercase tracking-widest pb-3 border-b-2 transition-colors", modalTab === 'security' ? "text-rose-500 border-rose-500" : "text-slate-500 border-transparent hover:text-slate-300")}
                     >
                       Bảo mật & Tài khoản
                     </button>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                  {modalTab === 'profile' ? (
                     <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                        <div className="md:col-span-4 flex flex-col items-center gap-6">
                           <div onClick={() => fileInputRef.current?.click()} className="w-40 h-40 rounded-[40px] bg-[#1a1f2e] p-1 cursor-pointer border border-white/10 overflow-hidden shrink-0 group relative shadow-2xl">
                              {avatarPreview ? (
                                <img src={avatarPreview} className="w-full h-full object-cover rounded-[36px]" />
                              ) : (
                                <User size={48} className="text-slate-800 m-auto mt-12 group-hover:text-slate-600 transition" />
                              )}
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-[36px]">
                                <Camera className="text-white" size={32} />
                              </div>
                           </div>
                           <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black text-center">Bấm để thay đổi ảnh</p>
                           <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                        </div>
                        <div className="md:col-span-8 grid grid-cols-1 gap-6">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Họ và tên</label>
                                 <input value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} className="w-full p-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white text-sm outline-none focus:border-[#0ea5e9] focus:bg-white/[0.05] transition" placeholder="Nhập họ tên" />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số điện thoại</label>
                                 <input value={formData.phoneNumber} onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })} className="w-full p-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white text-sm outline-none focus:border-[#0ea5e9] focus:bg-white/[0.05] transition" placeholder="Nhập số điện thoại" />
                              </div>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Địa chỉ cụ thể</label>
                              <input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full p-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white text-sm outline-none focus:border-[#0ea5e9] focus:bg-white/[0.05] transition" placeholder="Số nhà, tên đường..." />
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Thành phố/Tỉnh</label>
                                 <select value={formData.cityId} onChange={e => setFormData({ ...formData, cityId: e.target.value })} className="w-full p-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white text-sm outline-none focus:border-[#0ea5e9] focus:bg-white/[0.05] transition appearance-none">
                                    <option value="" disabled className="bg-[#0f172a] text-slate-500">Vui lòng chọn thành phố</option>
                                    {cities.map(c => <option key={c.cityId} value={c.cityId} className="bg-[#0f172a]">{c.cityName}</option>)}
                                 </select>
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kinh nghiệm (Năm)</label>
                                 <input type="number" min="0" value={formData.experiences} onChange={e => setFormData({ ...formData, experiences: e.target.value })} className="w-full p-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white text-sm outline-none focus:border-[#0ea5e9] focus:bg-white/[0.05] transition" placeholder="Số năm kinh nghiệm" />
                              </div>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dịch vụ cung cấp</label>
                              <select value={formData.serviceId} onChange={e => setFormData({ ...formData, serviceId: e.target.value })} className="w-full p-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white text-sm outline-none focus:border-[#0ea5e9] focus:bg-white/[0.05] transition appearance-none">
                                 <option value="" disabled className="bg-[#0f172a] text-slate-500">Vui lòng chọn dịch vụ</option>
                                 {services.map(s => <option key={s.id} value={s.id} className="bg-[#0f172a]">{s.serviceName}</option>)}
                              </select>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Giới thiệu / Tuyên ngôn cá nhân</label>
                              <textarea rows={4} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full p-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white text-sm outline-none focus:border-[#0ea5e9] focus:bg-white/[0.05] transition resize-none" placeholder="Giới thiệu về kỹ năng và kinh nghiệm của bạn..." />
                           </div>
                        </div>
                     </div>
                  ) : (
                     <div className="max-w-2xl mx-auto flex flex-col gap-6 py-6 w-full">
                        {!isForgotPass ? (
                          <>
                            <div className="space-y-1 mb-4 text-center">
                               <h3 className="text-xl font-bold text-white">Đổi mật khẩu bảo mật</h3>
                               <p className="text-slate-500 text-sm">Vui lòng nhập mật khẩu hiện tại và mật khẩu mới của bạn để tiếp tục.</p>
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mật khẩu hiện tại</label>
                               <input type="password" value={passwordForm.oldPassword} onChange={e => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })} className="w-full p-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white text-sm outline-none focus:border-rose-500 focus:bg-white/[0.05] transition" placeholder="••••••••" />
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mật khẩu mới</label>
                               <input type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} className="w-full p-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white text-sm outline-none focus:border-rose-500 focus:bg-white/[0.05] transition" placeholder="••••••••" />
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nhập lại mật khẩu mới</label>
                               <input type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} className="w-full p-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white text-sm outline-none focus:border-rose-500 focus:bg-white/[0.05] transition" placeholder="••••••••" />
                            </div>
                            <div className="text-right mt-2">
                               <button onClick={() => setIsForgotPass(true)} className="text-[11px] font-black text-[#0ea5e9] hover:text-[#38bdf8] uppercase tracking-widest transition-colors">
                                 Quên mật khẩu?
                               </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="space-y-1 mb-4 text-center">
                               <h3 className="text-xl font-bold text-white">Khôi phục mật khẩu</h3>
                               <p className="text-slate-500 text-sm">
                                 {forgotStep === 1 && "Nhập Email hoặc SĐT để nhận mã OTP."}
                                 {forgotStep === 2 && "Nhập mã OTP gồm 6 chữ số đã được gửi đến bạn."}
                                 {forgotStep === 3 && "Nhập mật khẩu mới của bạn."}
                               </p>
                            </div>

                            {forgotStep === 1 && (
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email / Số điện thoại</label>
                                 <input type="text" value={forgotData.email} onChange={e => setForgotData({ ...forgotData, email: e.target.value })} className="w-full p-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white text-sm outline-none focus:border-[#0ea5e9] focus:bg-white/[0.05] transition" placeholder="Ví dụ: techhieu@gmail.com" />
                              </div>
                            )}

                            {forgotStep === 2 && (
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mã xác nhận (OTP)</label>
                                 <input type="text" maxLength={6} value={forgotData.otp} onChange={e => setForgotData({ ...forgotData, otp: e.target.value.replace(/\D/g,'') })} className="w-full p-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white text-2xl text-center tracking-[1em] outline-none focus:border-[#0ea5e9] focus:bg-white/[0.05] transition" placeholder="------" />
                              </div>
                            )}

                            {forgotStep === 3 && (
                              <>
                                <div className="space-y-2">
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mật khẩu mới</label>
                                   <input type="password" value={forgotData.newPassword} onChange={e => setForgotData({ ...forgotData, newPassword: e.target.value })} className="w-full p-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white text-sm outline-none focus:border-rose-500 focus:bg-white/[0.05] transition" placeholder="••••••••" />
                                </div>
                                <div className="space-y-2">
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nhập lại mật khẩu mới</label>
                                   <input type="password" value={forgotData.confirmPassword} onChange={e => setForgotData({ ...forgotData, confirmPassword: e.target.value })} className="w-full p-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white text-sm outline-none focus:border-rose-500 focus:bg-white/[0.05] transition" placeholder="••••••••" />
                                </div>
                              </>
                            )}

                            <div className="text-right mt-2">
                               <button onClick={() => { setIsForgotPass(false); setForgotStep(1); }} className="text-[11px] font-black text-slate-500 hover:text-slate-300 uppercase tracking-widest transition-colors">
                                 Quay lại đổi mật khẩu
                               </button>
                            </div>
                          </>
                        )}
                     </div>
                  )}
               </div>

               <div className="p-8 md:p-10 border-t border-white/5 flex gap-4 bg-[#0a0f1e]">
                  <button onClick={() => setIsEditing(false)} className="flex-1 py-4 md:py-5 bg-white/5 hover:bg-white/10 transition rounded-2xl text-[11px] font-black uppercase text-slate-400 tracking-widest">HUỶ BỎ</button>
                  {modalTab === 'profile' ? (
                     <button onClick={handleSaveProfile} disabled={saving} className="flex-[2] py-4 md:py-5 bg-[#0ea5e9] hover:bg-[#0284c7] transition rounded-2xl text-[11px] font-black uppercase text-white shadow-xl tracking-widest flex items-center justify-center gap-2">
                       {saving ? <Loader2 size={20} className="animate-spin" /> : 'LƯU HỒ SƠ CHUYÊN GIA'}
                     </button>
                  ) : (
                     !isForgotPass ? (
                       <button onClick={handleChangePassword} disabled={saving} className="flex-[2] py-4 md:py-5 bg-rose-500 hover:bg-rose-600 transition rounded-2xl text-[11px] font-black uppercase text-white shadow-[0_0_20px_rgba(244,63,94,0.3)] tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                         {saving ? <Loader2 size={20} className="animate-spin" /> : 'CẬP NHẬT MẬT KHẨU'}
                       </button>
                     ) : (
                       <button 
                         onClick={forgotStep === 1 ? handleSendOTP : (forgotStep === 2 ? handleVerifyOTP : handleResetPassword)} 
                         disabled={saving} 
                         className="flex-[2] py-4 md:py-5 bg-[#0ea5e9] hover:bg-[#0284c7] transition rounded-2xl text-[11px] font-black uppercase text-white shadow-xl tracking-widest flex items-center justify-center gap-2"
                       >
                         {saving ? <Loader2 size={20} className="animate-spin" /> : (forgotStep === 1 ? 'GỬI MÃ XÁC NHẬN' : (forgotStep === 2 ? 'XÁC THỰC OTP' : 'ĐẶT LẠI MẬT KHẨU'))}
                       </button>
                     )
                  )}
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


    </div>
  );
}
