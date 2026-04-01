import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Star, MapPin, CheckCircle, Filter, Camera, Mic, MicOff, Video, X, Loader2, Navigation } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import toast from 'react-hot-toast';
import useAuthStore from '@/store/authStore';
import technicianService from '@/services/technicianService';
import commonService, { ServiceDTO, CityDTO } from '@/services/commonService';
import autoFindService from '@/services/autoFindService';

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TechnicianListPage() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('Tất cả');
    const [technicians, setTechnicians] = useState<any[]>([]);
    const [services, setServices] = useState<ServiceDTO[]>([]);
    const [cities, setCities] = useState<CityDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAutoFinding, setIsAutoFinding] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [techRes, servRes, cityRes] = await Promise.all([
                    technicianService.getAllTechnicians(),
                    commonService.getServices(),
                    commonService.getCities()
                ]);
                
                setTechnicians(Array.isArray(techRes) ? techRes : (techRes.items || techRes.data || []));
                setServices(Array.isArray(servRes) ? servRes : (servRes.items || servRes.data || []));
                setCities(Array.isArray(cityRes) ? cityRes : (cityRes.items || cityRes.data || []));
            } catch (error) {
                console.error("Failed to fetch data:", error);
                toast.error("Không thể tải dữ liệu. Vui lòng thử lại.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const filtered = technicians.filter(t => {
        const name = (t.technicianName || t.TechnicianName || '').toLowerCase();
        const spec = (t.serviceName || t.ServiceName || '').toLowerCase();
        const searchLower = search.toLowerCase();
        
        const matchSearch = name.includes(searchLower) || spec.includes(searchLower);
        
        // If not 'All', check if tags or description contain category
        const matchCategory = activeCategory === 'Tất cả' || 
            (t.serviceName || t.ServiceName || '').includes(activeCategory);
            
        return matchSearch && matchCategory;
    });

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-2xl font-bold text-white">Danh sách Kỹ thuật viên</h1>
                <p className="text-zinc-400 mt-1 text-sm">Tìm và chọn thợ sửa chữa phù hợp với nhu cầu của bạn</p>
            </motion.div>

            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Tìm theo tên, dịch vụ..."
                        className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-primary" />
                </div>
                <Button variant="outline" className="border-white/10 bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 gap-2">
                    <Filter className="w-4 h-4" /> Lọc
                </Button>
            </div>

            <div className="flex gap-2 flex-wrap">
                <button
                    onClick={() => setActiveCategory('Tất cả')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                        activeCategory === 'Tất cả'
                            ? 'bg-primary text-white shadow-lg shadow-primary/30'
                            : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                    }`}
                >
                    Tất cả
                </button>
                {services.map(ser => (
                    <button key={ser.id} onClick={() => setActiveCategory(ser.serviceName)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                            activeCategory === ser.serviceName
                                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                        }`}>
                        {ser.serviceName}
                    </button>
                ))}
            </div>

            {/* ── Auto Find Banner ── */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-r from-blue-600/20 to-primary/20 border border-primary/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/40 animate-pulse">
                        <Navigation className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Tìm thợ nhanh tự động</h3>
                        <p className="text-sm text-zinc-400">Hệ thống sẽ tự động tìm kỹ thuật viên gần bạn nhất đang rảnh!</p>
                    </div>
                </div>
                <Dialog open={isAutoFinding} onOpenChange={setIsAutoFinding}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary-dark text-white font-bold px-8 h-12 rounded-xl border-t border-white/20 shadow-xl shadow-primary/20">
                            Tìm ngay bây giờ
                        </Button>
                    </DialogTrigger>
                    <AutoFindDialog 
                        services={services} 
                        cities={cities} 
                        onClose={() => setIsAutoFinding(false)} 
                    />
                </Dialog>
            </motion.div>

            <p className="text-xs text-zinc-500">{filtered.length} kỹ thuật viên</p>

            {isLoading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map((tech, index) => (
                        <motion.div key={tech.technicianId || tech.TechnicianId || index}
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.06 }} whileHover={{ y: -4 }}
                            className="group bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-primary/20 rounded-2xl p-5 transition-all duration-300">

                            <div className="flex items-start gap-4">
                                <div className="relative flex-shrink-0">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 to-blue-500/20 flex items-center justify-center text-xl font-bold text-white overflow-hidden">
                                        {tech.avatarUrl ? (
                                            <img src={tech.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            (tech.fullName && tech.fullName[0]) || (tech.name && tech.name[0]) || 'T'
                                        )}
                                    </div>
                                    <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${tech.isOnline ? 'bg-green-500' : 'bg-zinc-500'} rounded-full border-2 border-[#02050b]`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <h3 className="font-semibold text-white truncate">{tech.technicianName || tech.TechnicianName}</h3>
                                        <CheckCircle className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                                    </div>
                                    <p className="text-xs text-zinc-400 mt-0.5 truncate">{tech.serviceName || tech.ServiceName || 'Dịch vụ chuyên nghiệp'}</p>
                                    <div className="flex items-center gap-1 mt-1.5">
                                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                        <span className="text-sm font-bold text-white">{tech.averageRating || tech.AverageRating || 5.0}</span>
                                        <span className="text-xs text-zinc-500">({tech.ratingCount || tech.RatingCount || 0} đánh giá)</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 space-y-2">
                                <p className="text-xs text-zinc-400 line-clamp-2">Kinh nghiệm: {tech.orderCount || tech.OrderCount || 0} đơn hàng thành công</p>
                                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                                    <MapPin className="w-3 h-3 flex-shrink-0" />
                                    <span>{tech.address || tech.Address || 'Đà Nẵng'}</span>
                                </div>
                            </div>

                            <div className="flex gap-1.5 mt-3 flex-wrap">
                                {(tech.tags || ['Dịch vụ sửa chữa']).map((tag: string) => (
                                    <span key={tag} className="px-2 py-0.5 bg-primary/10 text-primary-light rounded-full text-[10px] font-medium">{tag}</span>
                                ))}
                            </div>

                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="w-full mt-4 h-9 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg shadow-md shadow-primary/20">
                                        <CheckCircle className="w-4 h-4 mr-1.5" /> Đặt thợ
                                    </Button>
                                </DialogTrigger>
                                <BookTechnicianDialog tech={tech} />
                            </Dialog>
                        </motion.div>
                    ))}
                </div>
            )}

            {!isLoading && filtered.length === 0 && (
                <div className="text-center py-16 text-zinc-500">
                    <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p>Không tìm thấy kỹ thuật viên phù hợp</p>
                </div>
            )}
        </div>
    );
}

// ─── Booking Dialog ────────────────────────────────────────────────────────────
function BookTechnicianDialog({ tech }: { tech: any }) {
    const { user } = useAuthStore();
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('Đà Nẵng');
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [videoFiles, setVideoFiles] = useState<File[]>([]);
    const [videoPreviews, setVideoPreviews] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRecording, setIsRecording] = useState(false);

    const imageRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLInputElement>(null);

    const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setImageFiles(prev => [...prev, ...files]);
        setImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
        if (imageRef.current) imageRef.current.value = '';
    };

    const handleVideos = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setVideoFiles(prev => [...prev, ...files]);
        setVideoPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
        if (videoRef.current) videoRef.current.value = '';
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) return toast.error('Trình duyệt không hỗ trợ định vị');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
                toast.success('📍 Đã lấy vị trí hiện tại!');
            },
            () => toast.error('Không lấy được vị trí. Vui lòng nhập thủ công.')
        );
    };

    const handleSubmit = async () => {
        if (!user?.id) return toast.error('Vui lòng đăng nhập trước!');
        if (!desc.trim()) return toast.error('Vui lòng mô tả sự cố');
        setIsSubmitting(true);
        try {
            console.log("Placing order with data:", {
                customerId: user.id,
                technicianId: tech.technicianId || tech.TechnicianId,
                serviceId: tech.serviceId || tech.ServiceId,
                cityId: tech.cityId || tech.CityId || '1827e2bc-0e89-4ee9-f7ae-2c35cc877894',
            });

            await technicianService.placeOrder({
                customerId: user.id,
                technicianId: tech.technicianId || tech.TechnicianId,
                serviceId: tech.serviceId || tech.ServiceId,
                title: title || 'Yêu cầu sửa chữa',
                description: desc,
                address: address || tech.address || tech.Address || 'Chưa rõ địa chỉ',
                cityId: tech.cityId || tech.CityId || '1827e2bc-0e89-4ee9-f7ae-2c35cc877894',
                latitude: tech.latitude || tech.Latitude || 0,
                longitude: tech.longitude || tech.Longitude || 0,
                imageFiles: imageFiles,
                videoFile: videoFiles.length > 0 ? videoFiles[0] : undefined,
            });
            toast.success('🎉 Đặt thợ thành công! Đang chờ xác nhận...');
            navigate('/customer/orders?status=pending');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Đặt thợ thất bại, thử lại sau');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    // OSM iframe src (static view of Đà Nẵng — no JS library required)
    const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=108.1,15.95,108.35,16.15&layer=mapnik`;

    return (
        <DialogContent className="sm:max-w-[540px] bg-[#0a1122] border-white/10 text-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle className="text-xl">Đặt Thợ: {tech.name}</DialogTitle>
                <p className="text-sm text-zinc-400">{tech.specialty} · {tech.price}</p>
            </DialogHeader>

            <div className="space-y-4 mt-2">
                {/* Tiêu đề */}
                <div className="space-y-1.5">
                    <Label>Tiêu đề</Label>
                    <Input value={title} onChange={e => setTitle(e.target.value)}
                        placeholder="Vd: Điều hòa không mát"
                        className="bg-white/5 border-white/10 text-white" />
                </div>

                {/* Mô tả */}
                <div className="space-y-1.5">
                    <Label>Mô tả chi tiết <span className="text-red-400">*</span></Label>
                    <Textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2}
                        placeholder="Mô tả rõ sự cố để thợ chuẩn bị phù hợp..."
                        className="bg-white/5 border-white/10 text-white resize-none" />
                </div>

                {/* Upload ảnh / video */}
                <div className="space-y-1.5">
                    <Label>Hình ảnh & Video</Label>
                    <input ref={imageRef} type="file" accept="image/*" multiple onChange={handleImages} className="hidden" />
                    <input ref={videoRef} type="file" accept="video/*" multiple onChange={handleVideos} className="hidden" />
                    <div className="flex gap-2">
                        <Button type="button" variant="outline"
                            className="flex-1 bg-white/5 border-white/10 hover:bg-primary/10 hover:border-primary/30"
                            onClick={() => imageRef.current?.click()}>
                            <Camera className="w-4 h-4 mr-2" /> Chọn ảnh
                        </Button>
                        <Button type="button" variant="outline"
                            className="flex-1 bg-white/5 border-white/10 hover:bg-primary/10 hover:border-primary/30"
                            onClick={() => videoRef.current?.click()}>
                            <Video className="w-4 h-4 mr-2" /> Chọn video
                        </Button>
                    </div>
                    {(imagePreviews.length > 0 || videoPreviews.length > 0) && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {imagePreviews.map((src, i) => (
                                <div key={i} className="relative group w-14 h-14">
                                    <img src={src} className="w-full h-full rounded-lg object-cover border border-white/10" />
                                    <button type="button"
                                        onClick={() => { setImagePreviews(p => p.filter((_, j) => j !== i)); setImageFiles(p => p.filter((_, j) => j !== i)); }}
                                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                        <X size={8} />
                                    </button>
                                </div>
                            ))}
                            {videoPreviews.map((src, i) => (
                                <div key={i} className="relative group w-14 h-14">
                                    <video src={src} className="w-full h-full rounded-lg object-cover border border-white/10" />
                                    <button type="button"
                                        onClick={() => { setVideoPreviews(p => p.filter((_, j) => j !== i)); setVideoFiles(p => p.filter((_, j) => j !== i)); }}
                                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                        <X size={8} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Ghi âm */}
                <div className="space-y-1.5">
                    <Label>Ghi âm sự cố</Label>
                    <Button type="button" variant="outline"
                        className={`w-full border-white/10 ${isRecording ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-white/5 text-zinc-300'}`}
                        onClick={() => setIsRecording(!isRecording)}>
                        {isRecording ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                        {isRecording ? 'Dừng ghi âm ⏹' : 'Bắt đầu ghi âm 🎙'}
                    </Button>
                </div>

                {/* Map: iframe embed (no npm, no z-index crash) */}
                <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-primary-light" />
                        Bản đồ khu vực
                    </Label>
                    <div className="rounded-xl overflow-hidden border border-white/10" style={{ height: 200 }}>
                        <iframe
                            title="map"
                            src={mapSrc}
                            width="100%"
                            height="200"
                            style={{ border: 0, display: 'block' }}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        />
                    </div>
                    {/* Address input + auto-detect button */}
                    <div className="flex gap-2">
                        <Input value={address} onChange={e => setAddress(e.target.value)}
                            placeholder="Nhập địa chỉ của bạn..."
                            className="flex-1 bg-white/5 border-white/10 text-white text-sm" />
                        <Button type="button" variant="outline" size="sm"
                            className="flex-shrink-0 bg-white/5 border-white/10 hover:bg-primary/10 hover:border-primary/30 px-3"
                            onClick={handleGetLocation}
                            title="Lấy vị trí hiện tại">
                            <Navigation size={15} />
                        </Button>
                    </div>
                    <p className="text-[10px] text-zinc-500">Hoặc bấm 📡 để tự động lấy vị trí GPS hiện tại</p>
                </div>

                {/* City + Date */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <Label>Thành phố</Label>
                        <Input value={city} onChange={e => setCity(e.target.value)} className="bg-white/5 border-white/10 text-white" />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Ngày hẹn</Label>
                        <Input type="date"
                            className="bg-white/5 border-white/10 text-white [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert" />
                    </div>
                </div>

                <div className="flex justify-between items-center text-sm py-2 px-1 text-zinc-400 border-y border-white/5">
                    <span>Trạng thái: <span className="text-amber-400">Đang chờ</span></span>
                    <span>{new Date().toLocaleDateString('vi-VN')}</span>
                </div>

                <Button
                    className="w-full bg-primary hover:bg-primary-dark text-white font-bold h-11 flex items-center justify-center gap-2"
                    onClick={handleSubmit}
                    disabled={isSubmitting}>
                    {isSubmitting
                        ? <><Loader2 size={16} className="animate-spin" /> Đang gửi...</>
                        : <><CheckCircle size={16} /> Hoàn thành — Đặt lịch sửa chữa</>
                    }
                </Button>
            </div>
        </DialogContent>
    );
}

// ─── Auto Find Dialog ──────────────────────────────────────────────────────────
function AutoFindDialog({ services, cities, onClose }: { services: ServiceDTO[], cities: CityDTO[], onClose: () => void }) {
    const { user } = useAuthStore();
    const navigate = useNavigate();

    const [selectedService, setSelectedService] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [desc, setDesc] = useState('');
    const [address, setAddress] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [foundTech, setFoundTech] = useState<any>(null);
    const [searchStatus, setSearchStatus] = useState<'idle' | 'searching' | 'found' | 'not_found'>('idle');

    const handleStartSearch = async () => {
        if (!user?.id) return toast.error('Vui lòng đăng nhập!');
        if (!selectedService || !selectedCity || !desc) return toast.error('Vui lòng điền đủ thông tin!');

        setIsSearching(true);
        setSearchStatus('searching');
        try {
            // 1. Start Auto-Find Session
            await autoFindService.findTechnicians(user.id, {
                customerId: user.id,
                serviceId: selectedService,
                cityId: selectedCity,
                latitude: 16.047079, // Mock lat for now
                longitude: 108.206230, // Mock lng for now
                description: desc
            });

            // 2. Polling for Acceptance (Mocking a bit of wait)
            let attempts = 0;
            const poll = setInterval(async () => {
                attempts++;
                const res = await autoFindService.checkAcceptance(user.id);
                if (res && (res.id || res.technicianId)) {
                    clearInterval(poll);
                    setFoundTech(res);
                    setSearchStatus('found');
                    setIsSearching(false);
                }
                if (attempts > 10) { // Timeout 20s
                    clearInterval(poll);
                    setSearchStatus('not_found');
                    setIsSearching(false);
                }
            }, 2000);

        } catch (err) {
            console.error(err);
            toast.error('Lỗi hệ thống khi tìm thợ');
            setIsSearching(false);
            setSearchStatus('not_found');
        }
    };

    const handleConfirmBooking = async () => {
        if (!foundTech || !user) return;
        try {
            await autoFindService.placeAutoOrder({
                customerId: user.id,
                technicianId: foundTech.id || foundTech.technicianId,
                serviceId: selectedService,
                cityId: selectedCity,
                title: 'Đặt thợ tự động',
                description: desc,
                address: address || 'Theo tọa độ GPS',
                latitude: 16.047079,
                longitude: 108.206230
            });
            toast.success('Đặt thợ thành công!');
            onClose();
            navigate('/customer/orders');
        } catch (err) {
            toast.error('Không thể đặt thợ, vui lòng thử lại');
        }
    };

    return (
        <DialogContent className="sm:max-w-[480px] bg-[#0a1122] border-white/10 text-white">
            <DialogHeader>
                <DialogTitle>Tìm kỹ thuật viên tự động</DialogTitle>
            </DialogHeader>

            {searchStatus === 'idle' && (
                <div className="space-y-4 mt-2">
                    <div className="space-y-1.5">
                        <Label>Loại dịch vụ</Label>
                        <select 
                            value={selectedService} 
                            onChange={e => setSelectedService(e.target.value)}
                            className="w-full h-10 bg-white/5 border border-white/10 rounded-md px-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                        >
                            <option value="" className="bg-[#0a1122]">Chọn dịch vụ...</option>
                            {services.map(s => <option key={s.id} value={s.id} className="bg-[#0a1122]">{s.serviceName}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Thành phố</Label>
                        <select 
                            value={selectedCity} 
                            onChange={e => setSelectedCity(e.target.value)}
                            className="w-full h-10 bg-white/5 border border-white/10 rounded-md px-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                        >
                            <option value="" className="bg-[#0a1122]">Chọn thành phố...</option>
                            {cities.map(c => <option key={c.id} value={c.id} className="bg-[#0a1122]">{c.cityName}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Mô tả sự cố</Label>
                        <Textarea 
                            placeholder="Mô tả ngắn gọn vấn đề của bạn..." 
                            value={desc} 
                            onChange={e => setDesc(e.target.value)}
                            className="bg-white/5 border-white/10"
                        />
                    </div>

                    <Button onClick={handleStartSearch} className="w-full bg-primary hover:bg-primary-dark font-bold py-6">
                        Bắt đầu tìm kiếm thợ
                    </Button>
                </div>
            )}

            {searchStatus === 'searching' && (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
                    <div className="relative">
                        <div className="w-24 h-24 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Navigation className="w-8 h-8 text-primary animate-pulse" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">Đang tìm thợ gần bạn...</h3>
                        <p className="text-zinc-400 text-sm mt-2">Hệ thống đang kết nối với các kỹ thuật viên rảnh nhất trong khu vực của bạn.</p>
                    </div>
                    <Button variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-400/10" onClick={() => setSearchStatus('idle')}>
                        Hủy tìm kiếm
                    </Button>
                </div>
            )}

            {searchStatus === 'found' && foundTech && (
                <div className="py-6 space-y-6">
                    <div className="text-center">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold">Đã tìm thấy thợ!</h3>
                        <p className="text-zinc-400">Kỹ thuật viên <b>{foundTech.fullName || foundTech.name}</b> đã sẵn sàng.</p>
                    </div>
                    
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold">
                            {(foundTech.fullName || foundTech.name || 'T')[0]}
                        </div>
                        <div>
                            <p className="font-bold text-lg">{foundTech.fullName || foundTech.name}</p>
                            <p className="text-sm text-zinc-400 flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> 
                                {foundTech.rating || 5.0} · {foundTech.specialty || 'Kỹ thuật viên'}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1 border-white/10" onClick={() => setSearchStatus('idle')}>Tìm thợ khác</Button>
                        <Button className="flex-1 bg-green-600 hover:bg-green-700 font-bold" onClick={handleConfirmBooking}>Xác nhận đặt lịch</Button>
                    </div>
                </div>
            )}

            {searchStatus === 'not_found' && (
                <div className="py-12 text-center space-y-6">
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                        <X className="w-10 h-10 text-red-500" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">Không tìm thấy thợ rảnh</h3>
                        <p className="text-zinc-400 text-sm mt-2">Hiện tại không có kỹ thuật viên nào rảnh trong khu vực này. Bạn có muốn thử lại không?</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1 border-white/10" onClick={onClose}>Đóng</Button>
                        <Button className="flex-1 bg-primary" onClick={handleStartSearch}>Thử lại ngay</Button>
                    </div>
                </div>
            )}
        </DialogContent>
    );
}
