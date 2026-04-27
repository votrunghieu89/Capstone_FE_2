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
import technicianCatalogService from '@/services/technicianCatalogService';
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

    const normalizeText = (v: any) => String(v || '').trim().toLowerCase();

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [servRes, cityRes] = await Promise.all([
                    commonService.getServices(),
                    commonService.getCities()
                ]);

                const serviceList = Array.isArray(servRes) ? servRes : (servRes.items || servRes.data || []);
                const cityListRaw = Array.isArray(cityRes) ? cityRes : (cityRes.items || cityRes.data || []);
                const cityList = cityListRaw
                    .map((c: any) => ({
                        id: c.id || c.cityId || c.CityId,
                        cityName: c.cityName || c.CityName || c.name || c.city || c.City
                    }))
                    .filter((c: any) => !!c.id && !!c.cityName);

                setServices(serviceList);
                setCities(cityList);

                const selectedService = serviceList.find((s: ServiceDTO) =>
                    normalizeText(s.serviceName) === normalizeText(activeCategory)
                );
                const techRes = activeCategory === 'Tất cả'
                    ? await technicianCatalogService.getAllTechnicians()
                    : await technicianCatalogService.filterTechnicians({ serviceId: selectedService?.id });

                setTechnicians(Array.isArray(techRes) ? techRes : (techRes.items || techRes.data || []));
            } catch (error) {
                console.error("Failed to fetch data:", error);
                toast.error("Không thể tải dữ liệu. Vui lòng thử lại.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [activeCategory]);

    const filtered = technicians.filter(t => {
        const name = (t.technicianName || t.TechnicianName || '').toLowerCase();
        const spec = (t.serviceName || t.ServiceName || '').toLowerCase();
        const searchLower = search.toLowerCase();

        const matchSearch = name.includes(searchLower) || spec.includes(searchLower);

        // If not 'All', check if tags or description contain category
        const matchCategory = activeCategory === 'Tất cả' ||
            normalizeText(t.serviceName || t.ServiceName) === normalizeText(activeCategory);

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
                    <Input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={async (e) => {
                            if (e.key !== 'Enter') return;
                            try {
                                setIsLoading(true);
                                if (!search.trim()) {
                                    const techRes = activeCategory === 'Tất cả'
                                        ? await technicianCatalogService.getAllTechnicians()
                                        : await technicianCatalogService.filterTechnicians({
                                            serviceId: services.find((s: ServiceDTO) => s.serviceName === activeCategory)?.id
                                        });
                                    setTechnicians(Array.isArray(techRes) ? techRes : (techRes.items || techRes.data || []));
                                } else {
                                    const techRes = await technicianCatalogService.filterTechnicians({
                                        serviceId: activeCategory === 'Tất cả' ? undefined : services.find((s: ServiceDTO) => s.serviceName === activeCategory)?.id,
                                        technicianName: search.trim()
                                    });
                                    setTechnicians(Array.isArray(techRes) ? techRes : (techRes.items || techRes.data || []));
                                }
                            } finally {
                                setIsLoading(false);
                            }
                        }}
                        placeholder="Tìm theo tên, dịch vụ... (Enter để tìm)"
                        className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-primary"
                    />
                </div>
                <Button
                    variant="outline"
                    className="border-white/10 bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 gap-2"
                    onClick={async () => {
                        try {
                            setIsLoading(true);
                            const techRes = await technicianCatalogService.filterTechnicians({
                                serviceId: activeCategory === 'Tất cả' ? undefined : services.find((s: ServiceDTO) => s.serviceName === activeCategory)?.id,
                                technicianName: search.trim() || undefined
                            });
                            setTechnicians(Array.isArray(techRes) ? techRes : (techRes.items || techRes.data || []));
                        } finally {
                            setIsLoading(false);
                        }
                    }}
                >
                    <Filter className="w-4 h-4" /> Lọc
                </Button>
            </div>

            <div className="flex gap-2 flex-wrap">
                <button
                    onClick={() => setActiveCategory('Tất cả')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeCategory === 'Tất cả'
                        ? 'bg-primary text-white shadow-lg shadow-primary/30'
                        : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                        }`}
                >
                    Tất cả
                </button>
                {services.map(ser => (
                    <button key={ser.id} onClick={() => setActiveCategory(ser.serviceName)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeCategory === ser.serviceName
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
    const [cityId, setCityId] = useState('');
    const [latitude, setLatitude] = useState<string>("16.047079");
    const [longitude, setLongitude] = useState<string>("108.20623");
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [videoFiles, setVideoFiles] = useState<File[]>([]);
    const [videoPreviews, setVideoPreviews] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRecording, setIsRecording] = useState(false);

    // ✅ THÊM STATE ĐỂ CHỌN SERVICE
    const [services, setServices] = useState<ServiceDTO[]>([]);
    const [cities, setCities] = useState<CityDTO[]>([]);
    const [selectedServiceId, setSelectedServiceId] = useState('');

    const imageRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLInputElement>(null);

    // ✅ LOAD SERVICES/CITIES VÀ AUTO-SELECT
    useEffect(() => {
        const loadMeta = async () => {
            try {
                const [servRes, cityRes] = await Promise.all([
                    commonService.getServices(),
                    commonService.getCities()
                ]);

                const serviceList = Array.isArray(servRes) ? servRes : (servRes.items || servRes.data || []);
                const cityListRaw = Array.isArray(cityRes) ? cityRes : (cityRes.items || cityRes.data || []);
                const cityList = cityListRaw
                    .map((c: any) => ({
                        id: c.id || c.cityId || c.CityId,
                        cityName: c.cityName || c.CityName || c.name || c.city || c.City
                    }))
                    .filter((c: any) => !!c.id && !!c.cityName);

                setServices(serviceList);
                setCities(cityList);

                // Auto-select cityId hợp lệ từ technician hoặc theo tên, fallback city đầu tiên
                const techCityId = tech.cityId || tech.CityId;
                const techCityName = (tech.cityName || tech.CityName || tech.city || tech.City || '').toString().toLowerCase().trim();

                const cityFromTechId = cityList.find((c: CityDTO) => c.id === techCityId);
                const cityFromTechName = cityList.find((c: CityDTO) => c.cityName?.toLowerCase?.().trim() === techCityName);
                const fallbackCity = cityList[0];

                const resolvedCityId = cityFromTechId?.id || cityFromTechName?.id || fallbackCity?.id || '';
                setCityId(resolvedCityId);
                console.log('✅ Auto-selected cityId:', resolvedCityId, { techCityId, techCityName });

                // Auto-select service dựa trên serviceName của tech
                const techServiceName = tech.serviceName || tech.ServiceName;
                if (techServiceName) {
                    const matchedService = serviceList.find((s: ServiceDTO) =>
                        s.serviceName === techServiceName
                    );
                    if (matchedService) {
                        setSelectedServiceId(matchedService.id);
                        console.log('✅ Auto-selected serviceId:', matchedService.id);
                    }
                }
            } catch (error) {
                console.error('Failed to load booking metadata:', error);
            }
        };
        loadMeta();
    }, [tech]);

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
                const { latitude: currentLatitude, longitude: currentLongitude } = pos.coords;
                setLatitude(currentLatitude.toString());
                setLongitude(currentLongitude.toString());
                setAddress(`${currentLatitude.toFixed(5)}, ${currentLongitude.toFixed(5)}`);
                toast.success('📍 Đã lấy vị trí hiện tại!');
            },
            () => toast.error('Không lấy được vị trí. Vui lòng nhập thủ công.')
        );
    };

    const handleSubmit = async () => {
        // ✅ VALIDATION ĐẦY ĐỦ
        if (!user?.id) {
            toast.error('Vui lòng đăng nhập trước!');
            return;
        }
        if (!desc.trim()) {
            toast.error('Vui lòng mô tả sự cố');
            return;
        }
        if (!selectedServiceId) {
            toast.error('Vui lòng chọn loại dịch vụ');
            return;
        }
        if (!address.trim()) {
            toast.error('Vui lòng nhập địa chỉ');
            return;
        }

        let resolvedCityId = cityId || tech.cityId || tech.CityId;

        if (!resolvedCityId) {
            const techCityName = (tech.cityName || tech.CityName || tech.city || tech.City || '').toString().toLowerCase().trim();
            const matchedByName = cities.find(c => c.cityName?.toLowerCase?.().trim() === techCityName);
            resolvedCityId = matchedByName?.id || '';
        }

        if (!resolvedCityId || !cities.some(c => c.id === resolvedCityId)) {
            const debugPayload = {
                cityId,
                techCityId: tech.cityId || tech.CityId,
                techCityName: tech.cityName || tech.CityName || tech.city || tech.City,
                citiesCount: cities.length,
                firstCities: cities.slice(0, 5)
            };
            console.error('❌ Invalid city mapping for booking:', debugPayload);
            toast.error('Không xác định được thành phố hợp lệ cho đơn hàng');
            return;
        }

        setIsSubmitting(true);

        // ✅ TẠO PAYLOAD VỚI CITYID/SERVICEID ĐÚNG
        const orderData = {
            customerId: user.id,
            technicianId: tech.technicianId || tech.TechnicianId,
            serviceId: selectedServiceId,
            title: title.trim() || 'Yêu cầu sửa chữa',
            description: desc.trim(),
            address: address.trim(),
            cityId: resolvedCityId,
            latitude,
            longitude,
            imageFiles: imageFiles,
            videoFile: videoFiles.length > 0 ? videoFiles[0] : undefined
        };

        // ✅ DEBUG LOG
        console.group('🔍 DEBUG ORDER DATA');
        console.log('User ID:', user.id);
        console.log('Tech Object:', tech);
        console.log('Selected ServiceId:', selectedServiceId);
        console.log('Full Order Data:', orderData);
        console.groupEnd();

        try {
            const response = await technicianCatalogService.placeOrder(orderData);
            console.log('✅ Success Response:', response);
            toast.success('🎉 Đặt thợ thành công! Đang chờ xác nhận...');
            navigate('/customer/orders?status=pending');
        } catch (err: any) {
            // ✅ CHI TIẾT LỖI
            console.group('❌ ERROR DETAILS');
            console.error('Full Error:', err);
            console.error('Response:', err?.response);
            console.error('Response Data:', err?.response?.data);
            console.error('Response Status:', err?.response?.status);
            console.groupEnd();

            // ✅ HIỂN THỊ LỖI CHI TIẾT TỪ BACKEND
            let errorMsg = 'Đặt thợ thất bại';
            if (err?.response?.data?.message) {
                errorMsg = err.response.data.message;
            } else if (typeof err?.response?.data === 'string') {
                errorMsg = err.response.data;
            } else if (err?.message) {
                errorMsg = err.message;
            }

            toast.error(`❌ Lỗi: ${errorMsg}`);
            console.error('Final display error:', errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };
    const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=108.1,15.95,108.35,16.15&layer=mapnik`;

    return (
        <DialogContent className="sm:max-w-[540px] bg-[#0a1122] border-white/10 text-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle className="text-xl">
                    Đặt Thợ: {tech.technicianName || tech.TechnicianName}
                </DialogTitle>
                <p className="text-sm text-zinc-400">
                    {tech.serviceName || tech.ServiceName} · ⭐ {tech.avgScore || tech.AvgScore || 5.0}
                </p>
            </DialogHeader>

            <div className="space-y-4 mt-2">
                {/* ✅ DROPDOWN CHỌN SERVICE */}
                <div className="space-y-1.5">
                    <Label>Loại dịch vụ <span className="text-red-400">*</span></Label>
                    <select
                        value={selectedServiceId}
                        onChange={e => setSelectedServiceId(e.target.value)}
                        className="w-full h-10 bg-white/5 border border-white/10 rounded-md px-3 text-white text-sm focus:ring-1 focus:ring-primary outline-none"
                    >
                        <option value="" className="bg-[#0a1122]">Chọn dịch vụ...</option>
                        {services.map(s => (
                            <option key={s.id} value={s.id} className="bg-[#0a1122]">
                                {s.serviceName}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Tiêu đề */}
                <div className="space-y-1.5">
                    <Label>Tiêu đề</Label>
                    <Input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Vd: Điều hòa không mát"
                        className="bg-white/5 border-white/10 text-white"
                    />
                </div>

                {/* Mô tả */}
                <div className="space-y-1.5">
                    <Label>Mô tả chi tiết <span className="text-red-400">*</span></Label>
                    <Textarea
                        value={desc}
                        onChange={e => setDesc(e.target.value)}
                        rows={3}
                        placeholder="Mô tả rõ sự cố để thợ chuẩn bị phù hợp..."
                        className="bg-white/5 border-white/10 text-white resize-none"
                    />
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
                                        onClick={() => {
                                            setImagePreviews(p => p.filter((_, j) => j !== i));
                                            setImageFiles(p => p.filter((_, j) => j !== i));
                                        }}
                                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                        <X size={8} />
                                    </button>
                                </div>
                            ))}
                            {videoPreviews.map((src, i) => (
                                <div key={i} className="relative group w-14 h-14">
                                    <video src={src} className="w-full h-full rounded-lg object-cover border border-white/10" />
                                    <button type="button"
                                        onClick={() => {
                                            setVideoPreviews(p => p.filter((_, j) => j !== i));
                                            setVideoFiles(p => p.filter((_, j) => j !== i));
                                        }}
                                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                        <X size={8} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Thành phố */}
                <div className="space-y-1.5">
                    <Label>Thành phố <span className="text-red-400">*</span></Label>
                    <select
                        value={cityId}
                        onChange={e => setCityId(e.target.value)}
                        className="w-full h-10 bg-white/5 border border-white/10 rounded-md px-3 text-white text-sm focus:ring-1 focus:ring-primary outline-none"
                    >
                        {cities.map(c => (
                            <option key={c.id} value={c.id} className="bg-[#0a1122]">
                                {c.cityName}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Địa chỉ */}
                <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-primary-light" />
                        Địa chỉ <span className="text-red-400">*</span>
                    </Label>
                    <div className="flex gap-2">
                        <Input
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                            placeholder="Nhập địa chỉ của bạn..."
                            className="flex-1 bg-white/5 border-white/10 text-white text-sm"
                        />
                        <Button type="button" variant="outline" size="sm"
                            className="flex-shrink-0 bg-white/5 border-white/10 hover:bg-primary/10 hover:border-primary/30 px-3"
                            onClick={handleGetLocation}
                            title="Lấy vị trí hiện tạii">
                            <Navigation size={15} />
                        </Button>
                    </div>
                    <p className="text-[10px] text-zinc-500">Bấm 📡 để tự động lấy vị trí GPS hiện tại</p>
                </div>

                {/* Map */}
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
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [address, setAddress] = useState('');
    const [latitude, setLatitude] = useState<string>("16.047079");
    const [longitude, setLongitude] = useState<string>("108.206230");
    const [isSearching, setIsSearching] = useState(false);
    const [foundTech, setFoundTech] = useState<any>(null);
    const [searchStatus, setSearchStatus] = useState<'idle' | 'searching' | 'found' | 'not_found'>('idle');

    const addLocalOrder = (status: 'Pending Confirmation') => {
        if (!user?.id || !foundTech) return;
        const localKey = 'ff_customer_local_orders';
        const current = (() => {
            try {
                const parsed = JSON.parse(localStorage.getItem(localKey) || '[]');
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                return [];
            }
        })();

        current.unshift({
            id: `local-${Date.now()}`,
            customerId: user.id,
            technicianId: foundTech.id || foundTech.technicianId || foundTech.TechnicianId,
            technicianName: foundTech.fullName || foundTech.name || foundTech.TechnicianName,
            serviceName: services.find((s: ServiceDTO) => s.id === selectedService)?.serviceName || foundTech.specialty || '',
            title: title.trim() || 'Đặt thợ tự động',
            description: desc,
            address,
            status,
            createdAt: new Date().toISOString(),
            source: 'autofind-local'
        });

        localStorage.setItem(localKey, JSON.stringify(current));
    };

    const handleStartSearch = async () => {
        if (!user?.id) return toast.error('Vui lòng đăng nhập!');
        if (!selectedService || !selectedCity || !desc || !address) return toast.error('Vui lòng điền đủ thông tin!');

        const fallbackFindByFilter = async () => {
            // 1) Ưu tiên BE filter theo service + city
            const listByServiceAndCity = await technicianCatalogService.filterTechnicians({
                serviceId: selectedService,
                cityId: selectedCity
            });
            const techniciansByServiceAndCity = Array.isArray(listByServiceAndCity)
                ? listByServiceAndCity
                : (listByServiceAndCity?.items || listByServiceAndCity?.data || []);

            let finalCandidates = techniciansByServiceAndCity;

            // 2) fallback BE filter chỉ theo service
            if (finalCandidates.length === 0) {
                const listByServiceOnly = await technicianCatalogService.filterTechnicians({
                    serviceId: selectedService
                });
                finalCandidates = Array.isArray(listByServiceOnly)
                    ? listByServiceOnly
                    : (listByServiceOnly?.items || listByServiceOnly?.data || []);
            }

            // 3) fallback FE: lấy all rồi tự lọc (đồng bộ khi BE filter lệch dữ liệu)
            if (finalCandidates.length === 0) {
                const allRes = await technicianCatalogService.getAllTechnicians();
                const allTechs = Array.isArray(allRes) ? allRes : (allRes?.items || allRes?.data || []);
                const selectedServiceObj = services.find((s: ServiceDTO) => s.id === selectedService);
                const selectedServiceName = (selectedServiceObj?.serviceName || '').toLowerCase().trim();

                finalCandidates = allTechs.filter((t: any) => {
                    const techServiceId = t.serviceId || t.ServiceId;
                    const techServiceName = (t.serviceName || t.ServiceName || '').toLowerCase().trim();
                    const techCityId = t.cityId || t.CityId;

                    const serviceMatch = (techServiceId && techServiceId === selectedService) ||
                        (selectedServiceName && techServiceName === selectedServiceName);
                    const cityMatch = !selectedCity || (techCityId && techCityId === selectedCity);
                    return serviceMatch && cityMatch;
                });

                if (finalCandidates.length === 0) {
                    // fallback cuối: chỉ match service, bỏ city
                    finalCandidates = allTechs.filter((t: any) => {
                        const techServiceId = t.serviceId || t.ServiceId;
                        const techServiceName = (t.serviceName || t.ServiceName || '').toLowerCase().trim();
                        return (techServiceId && techServiceId === selectedService) ||
                            (selectedServiceName && techServiceName === selectedServiceName);
                    });
                }
            }

            const firstTech = finalCandidates[0];
            if (!firstTech) return false;

            setFoundTech({
                ...firstTech,
                technicianId: firstTech.technicianId || firstTech.TechnicianId,
                fullName: firstTech.technicianName || firstTech.TechnicianName,
                name: firstTech.technicianName || firstTech.TechnicianName,
                rating: firstTech.averageRating || firstTech.AverageRating || 5,
                specialty: firstTech.serviceName || firstTech.ServiceName,
                serviceName: firstTech.serviceName || firstTech.ServiceName || 'Kỹ thuật viên',
                orderCount: firstTech.orderCount || firstTech.OrderCount || 0,
                ratingCount: firstTech.ratingCount || firstTech.RatingCount || 0,
                avatarURL: firstTech.avatarURL || firstTech.AvatarURL || firstTech.avatarUrl || firstTech.AvatarUrl,
                phone: firstTech.phone || firstTech.Phone || '',
                address: firstTech.address || firstTech.Address || '',
                city: firstTech.city || firstTech.City || ''
            });
            setSearchStatus('found');
            toast.success('Đã tìm thợ theo dữ liệu hiện có');
            return true;
        };

        setIsSearching(true);
        setSearchStatus('searching');
        try {
            // Ưu tiên flow autofind theo backend
            await autoFindService.findTechnicians(user.id, {
                customerId: user.id,
                serviceId: selectedService,
                cityId: selectedCity,
                latitude,
                longitude,
                description: desc
            });

            const res = await autoFindService.checkAcceptance(user.id);
            if (res && (res.id || res.technicianId || res.TechnicianId)) {
                setFoundTech({
                    ...res,
                    technicianId: res.technicianId || res.TechnicianId || res.id,
                    fullName: res.fullName || res.FullName || res.name,
                    name: res.name || res.fullName || res.FullName,
                    specialty: res.serviceName || res.ServiceName || 'Kỹ thuật viên',
                    serviceName: res.serviceName || res.ServiceName || 'Kỹ thuật viên',
                    rating: res.score || res.Score || res.avgScore || res.AvgScore || 5,
                    orderCount: res.orderCount || res.OrderCount || 0,
                    ratingCount: res.ratingCount || res.RatingCount || 0,
                    avatarURL: res.avatarURL || res.AvatarURL || res.avatarUrl || res.AvatarUrl,
                    phone: res.phone || res.Phone || '',
                    address: res.address || res.Address || '',
                    city: res.city || res.City || ''
                });
                setSearchStatus('found');
                return;
            }

            const ok = await fallbackFindByFilter();
            if (!ok) setSearchStatus('not_found');
        } catch (err) {
            console.error(err);
            try {
                const ok = await fallbackFindByFilter();
                if (!ok) {
                    setSearchStatus('not_found');
                    toast.error('Không tìm thấy thợ phù hợp lúc này');
                }
            } catch (fallbackErr) {
                console.error(fallbackErr);
                setSearchStatus('not_found');
                toast.error('Không tìm thấy thợ phù hợp lúc này');
            }
        } finally {
            setIsSearching(false);
        }
    };

    const handleRejectTechnician = async () => {
        if (!user?.id || !foundTech) return;
        setIsSearching(true);


        const rejectedTechId = foundTech.id || foundTech.technicianId || foundTech.TechnicianId;

        // Không tạo local rejected order ở phía customer.
        // Rejected orders chỉ hiển thị khi technician từ chối order thật từ backend.

        const fallbackNextTechnician = async () => {
            const listByServiceAndCity = await technicianCatalogService.filterTechnicians({
                serviceId: selectedService,
                cityId: selectedCity
            });
            const firstList = Array.isArray(listByServiceAndCity)
                ? listByServiceAndCity
                : (listByServiceAndCity?.items || listByServiceAndCity?.data || []);

            let candidates = firstList;
            if (candidates.length === 0) {
                const listByServiceOnly = await technicianCatalogService.filterTechnicians({ serviceId: selectedService });
                candidates = Array.isArray(listByServiceOnly)
                    ? listByServiceOnly
                    : (listByServiceOnly?.items || listByServiceOnly?.data || []);
            }

            const nextTech = candidates.find((t: any) => {
                const tid = t.technicianId || t.TechnicianId;
                const currentId = foundTech?.technicianId || foundTech?.TechnicianId || foundTech?.id;
                return tid && tid !== rejectedTechId && tid !== currentId;
            });

            if (!nextTech) return false;

            setFoundTech({
                ...nextTech,
                technicianId: nextTech.technicianId || nextTech.TechnicianId,
                fullName: nextTech.technicianName || nextTech.TechnicianName,
                name: nextTech.technicianName || nextTech.TechnicianName,
                rating: nextTech.averageRating || nextTech.AverageRating || 5,
                specialty: nextTech.serviceName || nextTech.ServiceName,
                serviceName: nextTech.serviceName || nextTech.ServiceName || 'Kỹ thuật viên',
                orderCount: nextTech.orderCount || nextTech.OrderCount || 0,
                ratingCount: nextTech.ratingCount || nextTech.RatingCount || 0,
                avatarURL: nextTech.avatarURL || nextTech.AvatarURL || nextTech.avatarUrl || nextTech.AvatarUrl,
                phone: nextTech.phone || nextTech.Phone || '',
                address: nextTech.address || nextTech.Address || '',
                city: nextTech.city || nextTech.City || ''
            });
            setSearchStatus('found');
            toast.success('Đã từ chối thợ hiện tại. Đã đề xuất thợ khác.');
            return true;
        };

        try {
            // Re-find lại để backend tính đề xuất mới theo cùng tiêu chí
            await autoFindService.findTechnicians(user.id, {
                customerId: user.id,
                serviceId: selectedService,
                cityId: selectedCity,
                latitude,
                longitude,
                description: desc
            });

            const res = await autoFindService.checkAcceptance(user.id);
            if (res && (res.id || res.technicianId || res.TechnicianId)) {
                const nextBackendId = res.id || res.technicianId || res.TechnicianId;
                if (nextBackendId && nextBackendId !== rejectedTechId) {
                    setFoundTech({
                        ...res,
                        technicianId: res.technicianId || res.TechnicianId || res.id,
                        fullName: res.fullName || res.FullName || res.name,
                        name: res.name || res.fullName || res.FullName,
                        specialty: res.serviceName || res.ServiceName || 'Kỹ thuật viên',
                        serviceName: res.serviceName || res.ServiceName || 'Kỹ thuật viên',
                        rating: res.score || res.Score || res.avgScore || res.AvgScore || 5,
                        orderCount: res.orderCount || res.OrderCount || 0,
                        ratingCount: res.ratingCount || res.RatingCount || 0,
                        avatarURL: res.avatarURL || res.AvatarURL || res.avatarUrl || res.AvatarUrl,
                        phone: res.phone || res.Phone || '',
                        address: res.address || res.Address || '',
                        city: res.city || res.City || ''
                    });
                    setSearchStatus('found');
                    toast.success('Đã từ chối thợ hiện tại. Đã đề xuất thợ khác.');
                    return;
                }
            }

            const hasFallback = await fallbackNextTechnician();
            if (hasFallback) return;

            setFoundTech(null);
            setSearchStatus('not_found');
            try { await autoFindService.clearSession(user.id); } catch { }
            toast.success('Đã từ chối. Không còn thợ phù hợp để đề xuất thêm.');
        } catch {
            try {
                const hasFallback = await fallbackNextTechnician();
                if (hasFallback) return;
            } catch { }

            try { await autoFindService.clearSession(user.id); } catch { }
            toast.success('Đã từ chối thợ. Vui lòng thử tìm lại để nhận đề xuất khác.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleConfirmBooking = async () => {
        if (!foundTech || !user) return;
        try {
            // Step 3: đồng ý thợ -> gọi API 2 tạo order
            await autoFindService.placeAutoOrder({
                customerId: user.id,
                technicianId: foundTech.id || foundTech.technicianId || foundTech.TechnicianId,
                serviceId: selectedService,
                cityId: selectedCity,
                title: title.trim() || 'Đặt thợ tự động',
                description: desc,
                address,
                latitude,
                longitude,
                status: 'Pending Confirmation'
            });

            // Step 4: tạo order thành công -> clear cache
            try { await autoFindService.clearSession(user.id); } catch { }

            toast.success('Đặt thợ thành công!');
            onClose();
            navigate('/customer/orders?status=pending');
        } catch (err) {
            // fallback frontend-only: vẫn tạo local order để hiện ở trang pending
            addLocalOrder('Pending Confirmation');
            toast.success('Đã lưu đơn chờ xác nhận (tạm thời).');
            onClose();
            navigate('/customer/orders?status=pending');
        }
    };

    return (
        <DialogContent className="sm:max-w-[760px] bg-[#0a1122] border-white/10 text-white">
            <DialogHeader>
                <DialogTitle>Tìm kỹ thuật viên tự động</DialogTitle>
            </DialogHeader>

            {searchStatus === 'idle' && (
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label>Loại dịch vụ</Label>
                        <select
                            value={selectedService}
                            onChange={e => setSelectedService(e.target.value)}
                            className="w-full h-10 bg-white/5 border border-white/10 rounded-md px-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                        >
                            <option value="" className="bg-[#0a1122]">Chọn dịch vụ...</option>
                            {services.map((s: ServiceDTO) => <option key={s.id} value={s.id} className="bg-[#0a1122]">{s.serviceName}</option>)}
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

                    <div className="space-y-1.5 md:col-span-2">
                        <Label>Tiêu đề</Label>
                        <Input
                            placeholder="Ví dụ: Điều hòa không mát"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="bg-white/5 border-white/10"
                        />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                        <Label>Mô tả sự cố</Label>
                        <Textarea
                            placeholder="Mô tả ngắn gọn vấn đề của bạn..."
                            value={desc}
                            onChange={e => setDesc(e.target.value)}
                            className="bg-white/5 border-white/10 min-h-[96px]"
                        />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                        <Label>Địa chỉ</Label>
                        <Input
                            placeholder="Nhập địa chỉ của bạn..."
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                            className="bg-white/5 border-white/10"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Latitude</Label>
                        <Input type="text" value={latitude} onChange={e => setLatitude(e.target.value)} className="bg-white/5 border-white/10" />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Longitude</Label>
                        <Input type="text" value={longitude} onChange={e => setLongitude(e.target.value)} className="bg-white/5 border-white/10" />
                    </div>

                    <div className="md:col-span-2 pt-1">
                        <Button onClick={handleStartSearch} className="w-full bg-primary hover:bg-primary-dark font-bold py-6" disabled={isSearching}>
                            {isSearching ? 'Đang tìm...' : 'Bắt đầu tìm kiếm thợ'}
                        </Button>
                    </div>
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

                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-primary/20 overflow-hidden flex items-center justify-center text-2xl font-bold">
                                {foundTech.avatarURL ? (
                                    <img src={foundTech.avatarURL} alt="avatar" className="w-full h-full object-cover" />
                                ) : (
                                    (foundTech.fullName || foundTech.name || 'T')[0]
                                )}
                            </div>
                            <div>
                                <p className="font-bold text-lg">{foundTech.fullName || foundTech.name}</p>
                                <p className="text-sm text-zinc-400 flex items-center gap-1">
                                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                    {foundTech.rating || 5.0} · {foundTech.specialty || 'Kỹ thuật viên'}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 space-y-2 text-sm">
                            <p className="text-zinc-300">
                                <span className="text-zinc-500">Dịch vụ:</span> {foundTech.serviceName || foundTech.specialty || 'Kỹ thuật viên'}
                            </p>
                            <p className="text-zinc-300">
                                <span className="text-zinc-500">Địa chỉ:</span> {foundTech.address || 'Chưa cập nhật'}
                            </p>
                            <p className="text-zinc-300">
                                <span className="text-zinc-500">Thành phố:</span> {foundTech.city || 'Chưa cập nhật'}
                            </p>
                            <p className="text-zinc-300">
                                <span className="text-zinc-500">Kinh nghiệm:</span> {foundTech.orderCount || 0} đơn đã xử lý
                            </p>
                            <p className="text-zinc-300">
                                <span className="text-zinc-500">Lượt đánh giá:</span> {foundTech.ratingCount || 0} đánh giá
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1 border-white/10" onClick={handleRejectTechnician} disabled={isSearching}>
                            {isSearching ? 'Đang lấy thợ khác...' : 'Từ chối thợ này'}
                        </Button>
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
