import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Star, MapPin, CheckCircle, Filter, Camera, X, Loader2, Navigation, LoaderCircle, Wrench, MapPin as LocationPin, Building2, Briefcase, MessageSquareText, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { getAddressLocation } from '@/services/addressLocationService';

const normalizeText = (value: string) =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

const decodeMojibake = (value: string) => {
    if (!value) return '';
    try {
        const fixed = decodeURIComponent(escape(value));
        return fixed;
    } catch {
        return value;
    }
};

const formatVietnameseCityLabel = (value: string) => decodeMojibake(value || 'Đà Nẵng');

const OSM_GEOCODE_URL = 'https://nominatim.openstreetmap.org/search';
const OSM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';

const parseLatLng = (value: unknown) => {
    const num = typeof value === 'string' ? Number(value) : Number(value ?? NaN);
    return Number.isFinite(num) ? num : null;
};

const resolveLocationFromAddress = async (inputAddress: string, inputCityText: string) => {
    const address = inputAddress.trim();
    const cityName = inputCityText.trim();

    if (!address && !cityName) {
        return null;
    }

    try {
        return await getAddressLocation({
            address,
            cityName,
        });
    } catch (error) {
        console.warn('resolveLocationFromAddress failed', error, { address, cityName });
        return null;
    }
};

const normalizeTechStatus = (tech: any): 'online' | 'offline' | 'busy' => {
    const raw = String(tech?.status || tech?.Status || '').trim().toLowerCase();
    if (raw === 'busy') return 'busy';
    if (raw === 'offline') return 'offline';
    if (raw === 'online') return 'online';

    if (tech?.isOnline === true || tech?.IsOnline === true || tech?.isOnline === 1 || tech?.IsOnline === 1) {
        return 'online';
    }
    return 'offline';
};

const isDemoTech = (tech: any) => String(tech?.technicianId || tech?.TechnicianId || '').startsWith('demo-');
const isBookableTech = (tech: any) => normalizeTechStatus(tech) === 'online' && !isDemoTech(tech);

const getTechYears = (tech: any) => Number(tech?.yearOfExperience ?? tech?.YearOfExperience ?? 0);

const getTechEstimatedTime = (tech: any) => Number(tech?.estimatedTime ?? tech?.EstimatedTime ?? NaN);

const buildAddressQuery = (address: string, cityName: string) => {
    const cleanedAddress = decodeMojibake(address).trim();
    const cleanedCity = decodeMojibake(cityName).trim();
    const cityBase = cleanedCity
        .replace(/^(thanh pho|thành phố|tp\.?|tp|tinh|tỉnh)\s+/i, '')
        .trim();
    const cityAliases = [cleanedCity, cityBase]
        .filter((item, idx, arr) => !!item && arr.indexOf(item) === idx);
    return [cleanedAddress, ...cityAliases, 'Việt Nam'].filter(Boolean).join(', ');
};

const mapToIframeUrl = (latitude: string, longitude: string, label?: string) => {
    const lat = parseLatLng(latitude);
    const lng = parseLatLng(longitude);
    if (lat === null || lng === null) {
        return 'https://www.openstreetmap.org/export/embed.html?bbox=108.15,15.97,108.25,16.07&layer=mapnik';
    }
    const delta = 0.01;
    const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
    const marker = `marker=${lat},${lng}`;
    const center = `&mlat=${lat}&mlon=${lng}`;
    const text = label ? `&query=${encodeURIComponent(decodeMojibake(label))}` : '';
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&${marker}${center}${text}`;
};

const normalizeCityName = (value: string) => formatVietnameseCityLabel(value || 'Đà Nẵng');

const comparableCityText = (value: string) =>
    normalizeText(decodeMojibake(value || ''))
        .replace(/^thanh pho\s+/i, '')
        .replace(/^tp\.?\s+/i, '')
        .replace(/^tinh\s+/i, '')
        .trim();

const resolveTechnicianGuid = (tech: any) =>
    String(
        tech?.accountId || tech?.AccountId ||
        tech?.userId || tech?.UserId ||
        tech?.technicianId || tech?.TechnicianId ||
        tech?.id || tech?.Id ||
        ''
    ).trim();

const TECHNICIANS_PER_PAGE = 9;


function InfoItem({ label, value }: { label: string; value: string }) {
    const getIcon = () => {
        const key = label.toLowerCase();
        if (key.includes('dịch vụ')) return <Wrench className="w-4 h-4 text-primary" />;
        if (key.includes('địa chỉ')) return <LocationPin className="w-4 h-4 text-primary" />;
        if (key.includes('thành phố')) return <Building2 className="w-4 h-4 text-primary" />;
        if (key.includes('kinh nghiệm')) return <Briefcase className="w-4 h-4 text-primary" />;
        if (key.includes('đánh giá')) return <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />;
        return <MessageSquareText className="w-4 h-4 text-primary" />;
    };

    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/7 transition-colors">
            <div className="flex items-center gap-2">
                {getIcon()}
                <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">{label}</p>
            </div>
            <p className="mt-2 text-sm font-semibold text-white">{value}</p>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TechnicianListPage() {
    const { user } = useAuthStore();
    const navigate = useNavigate();

    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('Tất cả');
    const [cityFilter, setCityFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [technicians, setTechnicians] = useState<any[]>([]);
    const [services, setServices] = useState<ServiceDTO[]>([]);
    const [cities, setCities] = useState<CityDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAutoFinding, setIsAutoFinding] = useState(false);
    const [forceDemoMode, setForceDemoMode] = useState(true);
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailTech, setDetailTech] = useState<any>(null);
    const [detailSourceTech, setDetailSourceTech] = useState<any>(null);

    const normalizeText = (v: any) => String(v || '').trim().toLowerCase();

    const getCityName = (cityList: CityDTO[], cityId?: string, fallback = '') => {
        const id = cityId != null ? String(cityId).trim() : '';
        if (!id) return fallback;
        const found = cityList.find(c => String(c.id).toLowerCase() === id.toLowerCase());
        return found?.cityName || fallback;
    };

    const getTechCardCityLabel = (tech: any) => {
        const fromPayload = (tech.cityName || tech.CityName || tech.city || tech.City || '').trim();
        if (fromPayload) return fromPayload;
        return getCityName(cities, tech.cityId || tech.CityId, '') || '—';
    };

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
                        cityName: decodeMojibake(c.cityName || c.CityName || c.name || c.city || c.City)
                    }))
                    .filter((c: any) => !!c.id && !!c.cityName);

                setServices(serviceList);
                setCities(cityList);

                const response = await fetch('/api/customer/technicians/all');
                if (!response.ok) throw new Error('Failed to load technicians');
                const techRes = await response.json();
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

    const openTechnicianDetail = async (tech: any) => {
        const technicianId = String(tech?.technicianId || tech?.TechnicianId || tech?.id || tech?.Id || '').trim();
        if (!technicianId) return;
        setDetailOpen(true);
        setDetailLoading(true);
        setDetailSourceTech(tech);
        setDetailTech(tech);
        try {
            const response = await fetch(`/api/technician/profile/${encodeURIComponent(technicianId)}`);
            if (!response.ok) throw new Error('Failed to load technician detail');
            const data = await response.json();
            setDetailTech(data?.data || data);
        } catch (error) {
            console.error('Failed to fetch technician detail:', error);
            toast.error('Không thể tải thông tin chi tiết kỹ thuật viên.');
        } finally {
            setDetailLoading(false);
        }
    };

    const closeTechnicianDetail = () => {
        setDetailOpen(false);
        setDetailTech(null);
        setDetailSourceTech(null);
        setDetailLoading(false);
    };

    const selectedCard = [...technicians,].find((t: any) => {
        const techId = String(t?.technicianId || t?.TechnicianId || t?.id || t?.Id || '').trim();
        const detailId = String(detailSourceTech?.technicianId || detailSourceTech?.TechnicianId || detailSourceTech?.id || detailSourceTech?.Id || '').trim();
        return techId && techId === detailId;
    }) || detailSourceTech || null;

    const detailCityNameFromPayload =
        detailTech?.cityName || detailTech?.CityName || detailTech?.city || detailTech?.City ||
        selectedCard?.cityName || selectedCard?.CityName || selectedCard?.city || selectedCard?.City || '';
    const detailCityIdForLookup =
        detailTech?.cityId || detailTech?.CityId || selectedCard?.cityId || selectedCard?.CityId || '';
    const detailCityName =
        (detailCityNameFromPayload || '').trim() || getCityName(cities, detailCityIdForLookup, '') || '';
    const detailStatus = normalizeTechStatus(selectedCard || detailSourceTech || detailTech);
    const profileDescription = decodeMojibake(
        String(detailTech?.description ?? detailTech?.Description ?? '').trim()
    );

    const filtered = [...technicians,].filter(t => {
        const name = (t.technicianName || t.TechnicianName || '').toLowerCase();
        const spec = (t.serviceName || t.ServiceName || '').toLowerCase();
        const searchLower = search.toLowerCase();

        const matchSearch = name.includes(searchLower) || spec.includes(searchLower);

        const matchCategory = activeCategory === 'Tất cả' ||
            normalizeText(t.serviceName || t.ServiceName) === normalizeText(activeCategory);

        const normalizedCityFilter = comparableCityText(cityFilter);
        const normalizedTechCity = comparableCityText(getTechCardCityLabel(t));
        const matchCity = !normalizedCityFilter || normalizedTechCity === normalizedCityFilter;

        return matchSearch && matchCategory && matchCity;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / TECHNICIANS_PER_PAGE));
    const currentPageSafe = Math.min(currentPage, totalPages);
    const paginatedTechnicians = filtered.slice(
        (currentPageSafe - 1) * TECHNICIANS_PER_PAGE,
        currentPageSafe * TECHNICIANS_PER_PAGE
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [search, activeCategory, cityFilter]);

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [currentPage, totalPages]);

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.03] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.25)] md:p-6"
            >
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.28em] text-primary/80 font-semibold">Kỹ thuật viên</p>
                        <h1 className="text-2xl md:text-3xl font-bold text-white mt-1">Danh sách Kỹ thuật viên</h1>
                        <p className="text-zinc-400 mt-2 text-sm max-w-2xl">Tìm và chọn thợ sửa chữa phù hợp với nhu cầu của bạn. Xem nhanh kinh nghiệm, đánh giá và trạng thái để chọn đúng người.</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <span className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5">{filtered.length} kỹ thuật viên</span>
                        <span className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5">{activeCategory}</span>
                        {cityFilter && (
                            <span className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5">{cityFilter}</span>
                        )}
                    </div>
                </div>
            </motion.div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 shadow-[0_14px_45px_rgba(0,0,0,0.18)]">
                <div className="flex flex-col gap-3 lg:flex-row">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <Input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={async (e) => {
                                if (e.key !== 'Enter') return;
                                try {
                                    setIsLoading(true);
                                    const response = await fetch('/api/customer/technicians/all');
                                    if (!response.ok) throw new Error('Failed to load technicians');
                                    const techRes = await response.json();
                                    setTechnicians(Array.isArray(techRes) ? techRes : (techRes.items || techRes.data || []));
                                } finally {
                                    setIsLoading(false);
                                }
                            }}
                            placeholder="Tìm theo tên, dịch vụ... (Enter để tìm)"
                            className="pl-9 h-11 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-primary/50 rounded-xl"
                        />
                    </div>
                    <div className="relative lg:w-64">
                        <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                        <select
                            value={activeCategory}
                            onChange={e => setActiveCategory(e.target.value)}
                            className="w-full h-11 rounded-xl border border-white/10 bg-white/5 pl-9 pr-9 text-sm text-white outline-none transition focus:border-primary/50"
                        >
                            <option value="Tất cả" className="bg-[#0a1122]">Tất cả dịch vụ</option>
                            {services.map(ser => (
                                <option key={ser.id} value={ser.serviceName} className="bg-[#0a1122]">
                                    {ser.serviceName}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="relative md:w-56">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                        <select
                            value={cityFilter}
                            onChange={e => setCityFilter(e.target.value)}
                            className="w-full h-11 rounded-xl border border-white/10 bg-white/5 pl-9 pr-9 text-sm text-white outline-none transition focus:border-primary/50"
                        >
                            <option value="" className="bg-[#0a1122]">Tất cả thành phố</option>
                            {cities.map(city => (
                                <option key={city.id} value={city.cityName} className="bg-[#0a1122]">
                                    {city.cityName}
                                </option>
                            ))}
                        </select>
                    </div>
                    <Button
                        variant="outline"
                        className="border-white/10 bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 gap-2 h-11 rounded-xl px-4"
                        onClick={async () => {
                            try {
                                setIsLoading(true);
                                const response = await fetch('/api/customer/technicians/all');
                                if (!response.ok) throw new Error('Failed to load technicians');
                                const techRes = await response.json();
                                setTechnicians(Array.isArray(techRes) ? techRes : (techRes.items || techRes.data || []));
                            } finally {
                                setIsLoading(false);
                            }
                        }}
                    >
                        <Filter className="w-4 h-4" /> Lọc
                    </Button>
                </div>
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

            <p className="text-xs text-zinc-500">
                {filtered.length} kỹ thuật viên
                {filtered.length > TECHNICIANS_PER_PAGE && (
                    <span className="ml-2 text-zinc-600">
                        Trang {currentPageSafe}/{totalPages} · Hiển thị {paginatedTechnicians.length}/9
                    </span>
                )}
            </p>

            {isLoading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {paginatedTechnicians.map((tech, index) => (
                        <motion.div
                            key={`${tech.technicianId || tech.TechnicianId || 'tech'}-${tech.serviceId || tech.ServiceId || 'service'}-${tech.cityId || tech.CityId || 'city'}-${index}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.06 }}
                            whileHover={{ y: -4 }}
                            className="group relative overflow-hidden rounded-3xl border border-blue-500/20 bg-[#0f1627] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.18)] transition-all duration-300 hover:border-blue-400/40 hover:bg-[#121c33]"
                        >
                            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-blue-400/70 to-transparent opacity-80" />

                            <div className="flex items-start gap-4">
                                <div className="relative flex-shrink-0">
                                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/30 to-cyan-400/20 text-xl font-bold text-white ring-1 ring-blue-400/20">
                                        {tech.avatarUrl ? (
                                            <img src={tech.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            (tech.fullName && tech.fullName[0]) || (tech.name && tech.name[0]) || 'T'
                                        )}
                                    </div>
                                    <span
                                        className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#02050b] ${normalizeTechStatus(tech) === 'online'
                                            ? 'bg-green-500'
                                            : normalizeTechStatus(tech) === 'busy'
                                                ? 'bg-amber-500'
                                                : 'bg-zinc-500'
                                            }`}
                                        title={normalizeTechStatus(tech) === 'online' ? 'Online' : normalizeTechStatus(tech) === 'busy' ? 'Busy' : 'Offline'}
                                    />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="min-w-0">
                                            <h3 className="truncate text-[15px] font-bold text-white">{tech.technicianName || tech.TechnicianName}</h3>
                                            <p className="mt-1 truncate text-xs text-zinc-400">{tech.serviceName || tech.ServiceName || 'Dịch vụ chuyên nghiệp'}</p>
                                        </div>
                                        <CheckCircle className="h-4 w-4 flex-shrink-0 text-blue-400" />
                                    </div>

                                    <div className="mt-3 flex flex-wrap items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-sm">
                                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                        <span className="font-bold text-white">{tech.averageRating || tech.AverageRating || tech.rating || 5.0}</span>
                                        <span className="text-xs text-zinc-500">({tech.ratingCount || tech.RatingCount || tech.reviewCount || 0})</span>
                                        <span className="ml-2 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-zinc-300">Đơn {tech.orderCount || tech.OrderCount || 0}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-1 gap-2.5 text-sm text-zinc-300">
                                <div className="flex items-center justify-between rounded-2xl border border-blue-500/20 bg-blue-500/5 px-3 py-2.5">
                                    <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">Kinh nghiệm</span>
                                    <span className="font-semibold text-white">{getTechYears(tech) > 0 ? `${getTechYears(tech)} năm` : 'Chưa cập nhật'}</span>
                                </div>
                                <div className="flex items-center justify-between rounded-2xl border border-blue-500/20 bg-blue-500/5 px-3 py-2.5">
                                    <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">Trạng thái</span>
                                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${normalizeTechStatus(tech) === 'online' ? 'bg-green-500/10 text-green-400' : normalizeTechStatus(tech) === 'busy' ? 'bg-amber-500/10 text-amber-400' : 'bg-zinc-500/10 text-zinc-400'}`}>
                                        {normalizeTechStatus(tech) === 'online' ? 'Online' : normalizeTechStatus(tech) === 'busy' ? 'Busy' : 'Offline'}
                                    </span>
                                </div>
                                {Number.isFinite(getTechEstimatedTime(tech)) && getTechEstimatedTime(tech) > 0 && (
                                    <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
                                        <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">Ước tính đến</span>
                                        <span className="font-semibold text-white">{getTechEstimatedTime(tech)} phút</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between gap-2 rounded-2xl border border-blue-500/20 bg-blue-500/5 px-3 py-2.5">
                                    <span className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
                                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                                        Thành phố
                                    </span>
                                    <span className="text-right text-sm font-semibold text-white">{getTechCardCityLabel(tech)}</span>
                                </div>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-1.5">
                                {(tech.tags || ['Dịch vụ sửa chữa']).map((tag: string) => (
                                    <span key={tag} className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-medium text-primary-light">{tag}</span>
                                ))}
                            </div>

                            <div className="mt-4 flex gap-2">
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button
                                            disabled={!isBookableTech(tech)}
                                            title={!isBookableTech(tech)
                                                ? (isDemoTech(tech)
                                                    ? 'Thợ demo chỉ dùng để test giao diện, không thể đặt'
                                                    : (normalizeTechStatus(tech) === 'busy' ? 'Thợ hiện đang bận, chưa thể đặt' : 'Thợ hiện offline, chưa thể đặt'))
                                                : 'Đặt thợ'}
                                            className="h-11 flex-1 rounded-xl bg-primary font-semibold text-white shadow-md shadow-primary/20 hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <CheckCircle className="mr-1.5 h-4 w-4" />
                                            {!isBookableTech(tech)
                                                ? (isDemoTech(tech)
                                                    ? 'Demo - không đặt'
                                                    : (normalizeTechStatus(tech) === 'busy' ? 'Thợ đang bận' : 'Thợ offline'))
                                                : 'Đặt thợ'}
                                        </Button>
                                    </DialogTrigger>
                                    <BookTechnicianDialog tech={tech} />
                                </Dialog>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-11 rounded-xl border-white/10 bg-white/5 px-4 font-semibold text-white hover:bg-white/10"
                                    onClick={() => openTechnicianDetail(tech)}
                                >
                                    Chi tiết
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {!isLoading && filtered.length > TECHNICIANS_PER_PAGE && (
                <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 sm:flex-row">
                    <p className="text-sm text-zinc-500">
                        Hiển thị {(currentPageSafe - 1) * TECHNICIANS_PER_PAGE + 1}
                        {' - '}
                        {Math.min(currentPageSafe * TECHNICIANS_PER_PAGE, filtered.length)}
                        {' '}trên {filtered.length} kỹ thuật viên
                    </p>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={currentPageSafe === 1}
                            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                            className="h-10 rounded-xl border-white/10 bg-white/5 px-3 text-zinc-300 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                            <Button
                                key={page}
                                type="button"
                                variant="outline"
                                onClick={() => setCurrentPage(page)}
                                className={`h-10 min-w-10 rounded-xl border-white/10 px-3 font-semibold ${page === currentPageSafe
                                    ? 'bg-primary text-white hover:bg-primary-dark'
                                    : 'bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                {page}
                            </Button>
                        ))}

                        <Button
                            type="button"
                            variant="outline"
                            disabled={currentPageSafe === totalPages}
                            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                            className="h-10 rounded-xl border-white/10 bg-white/5 px-3 text-zinc-300 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {!isLoading && filtered.length === 0 && (
                <div className="text-center py-16 text-zinc-500">
                    <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p>Không tìm thấy kỹ thuật viên phù hợp</p>
                </div>
            )}

            <Dialog open={detailOpen} onOpenChange={(open) => !open && closeTechnicianDetail()}>
                <DialogContent className="max-w-5xl border-white/10 bg-[#0b1220] text-white md:max-w-[1200px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Chi tiết kỹ thuật viên</DialogTitle>
                    </DialogHeader>
                    {detailLoading ? (
                        <div className="flex min-h-[300px] items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : detailTech ? (
                        <div className="grid gap-5 lg:grid-cols-[360px_1fr] items-start">
                            <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-4 ">
                                <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[24px] bg-gradient-to-br from-blue-500/30 to-cyan-400/20 text-4xl font-bold text-white ring-1 ring-blue-400/20">
                                    {detailTech.avatarUrl || detailTech.AvatarUrl || detailTech.avatarURL || detailTech.AvatarURL ? (
                                        <img
                                            src={detailTech.avatarUrl || detailTech.AvatarUrl || detailTech.avatarURL || detailTech.AvatarURL}
                                            alt="avatar"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        (detailTech.fullName || detailTech.TechnicianName || detailTech.technicianName || 'T')[0]
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3 rounded-[28px] border border-white/10 bg-white/5 p-5 h-full">
                                <div>
                                    <h3 className="text-2xl font-bold text-white">{detailTech.fullName || detailTech.FullName || detailTech.technicianName || detailTech.TechnicianName || '—'}</h3>
                                    <p className="mt-1 text-sm text-zinc-400">{detailTech.serviceName || detailTech.ServiceName || '—'}</p>
                                </div>

                                <div className="flex flex-wrap gap-2 text-xs text-zinc-300">
                                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">⭐ {detailTech.averageRating || detailTech.AverageRating || 0}</span>
                                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">ĐG {detailTech.ratingCount || detailTech.RatingCount || detailTech.totalRating || detailTech.TotalRating || 0}</span>
                                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">Đơn {detailTech.orderCount || detailTech.OrderCount || detailTech.totalOrders || detailTech.TotalOrders || 0}</span>
                                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">KN {detailTech.yearOfExperience || detailTech.YearOfExperience || detailTech.experiences || detailTech.Experiences || 0} năm</span>
                                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">Trạng thái {detailStatus || '—'}</span>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-2xl border border-white/10 bg-[#111c32] px-4 py-3"><span className="text-zinc-500">Số điện thoại: </span>{detailTech.phoneNumber || detailTech.PhoneNumber || '—'}</div>
                                    <div className="rounded-2xl border border-white/10 bg-[#111c32] px-4 py-3"><span className="text-zinc-500">Địa chỉ: </span>{detailTech.address || detailTech.Address || '—'}</div>
                                    <div className="rounded-2xl border border-white/10 bg-[#111c32] px-4 py-3"><span className="text-zinc-500">Thành phố: </span>{detailCityName || '—'}</div>
                                    <div className="rounded-2xl border border-white/10 bg-[#111c32] px-4 py-3"><span className="text-zinc-500">Dịch vụ: </span>{detailTech.serviceName || detailTech.ServiceName || '—'}</div>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-[#111c32] px-4 py-3">
                                    <span className="text-zinc-500">Trạng thái: </span>{detailStatus || '—'}
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-[#111c32] px-4 py-3 whitespace-pre-wrap">
                                    <span className="text-zinc-500">Mô tả: </span>
                                    {profileDescription || 'Chưa có mô tả'}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-10 text-center text-zinc-400">Không có dữ liệu chi tiết.</div>
                    )}
                </DialogContent>
            </Dialog>
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
    const [latitude, setLatitude] = useState<string>('');
    const [longitude, setLongitude] = useState<string>('');
    const [resolvedDisplayAddress, setResolvedDisplayAddress] = useState('');
    const [resolvedGeoMeta, setResolvedGeoMeta] = useState<{ source?: string; method?: string; confidence?: number; query?: string }>({});
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
    const [selectedCityId, setSelectedCityId] = useState('');
    const [cityText, setCityText] = useState('Đà Nẵng');
    const cityName = cityText?.trim() || 'Đà Nẵng';

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
                        cityName: decodeMojibake(c.cityName || c.CityName || c.name || c.city || c.City)
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

                const resolvedCityText = cityFromTechName?.cityName || cityFromTechId?.cityName || fallbackCity?.cityName || techCityName || '';
                const resolvedCityId = cityFromTechName?.id || cityFromTechId?.id || fallbackCity?.id || '';
                setCityText(resolvedCityText);
                setSelectedCityId(resolvedCityId);
                console.log('✅ Auto-selected city text:', resolvedCityText, 'cityId:', resolvedCityId, { techCityId, techCityName });

                // Auto-select service dựa trên dịch vụ gắn với technician, khách không được đổi ở form.
                const techServiceId = tech.serviceId || tech.ServiceId;
                if (techServiceId) {
                    setSelectedServiceId(String(techServiceId));
                }
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

    const resolveLocationFromAddress = async (inputAddress: string, inputCityText: string) => {
        const normalizedAddress = comparableCityText(inputAddress);
        const cityFromAddress = cities.find(c => {
            const city = comparableCityText(c.cityName || '');
            return city && normalizedAddress.includes(city);
        }) || null;

        const matchedCityText = inputCityText.trim() || cityFromAddress?.cityName || cityText || '';
        const payloadAddress = inputAddress.trim();
        const payloadCity = matchedCityText.trim();
        const query = buildAddressQuery(payloadAddress, payloadCity);

        const normalizeResult = (apiResult: any, source = 'unknown') => {
            const lat = apiResult?.lat ?? apiResult?.latitude;
            const lon = apiResult?.lon ?? apiResult?.lng ?? apiResult?.longitude;
            return {
                lat,
                lon,
                display_name: apiResult?.display_name || apiResult?.displayName || apiResult?.name,
                source: apiResult?.source || source,
                method: apiResult?.method,
                confidence: apiResult?.confidence,
                query: apiResult?.query || query
            };
        };

        try {
            const apiResult = await getAddressLocation({
                address: query,
                cityName: payloadCity
            });

            const normalized = normalizeResult(apiResult, 'addressLocationService');
            if (parseLatLng(normalized.lat) !== null && parseLatLng(normalized.lon) !== null) {
                return normalized;
            }
        } catch (error) {
            console.warn('Primary resolve location failed', error, { payloadAddress, payloadCity, query });
        }

        try {
            const fallbackUrl = `${OSM_GEOCODE_URL}?format=jsonv2&limit=1&addressdetails=1&q=${encodeURIComponent(query)}`;
            const response = await fetch(fallbackUrl, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`OSM geocode failed with ${response.status}`);
            }

            const items = await response.json();
            const firstItem = Array.isArray(items) ? items[0] : null;
            const normalized = normalizeResult(firstItem, 'nominatim-search');
            if (parseLatLng(normalized.lat) !== null && parseLatLng(normalized.lon) !== null) {
                return normalized;
            }
        } catch (error) {
            console.warn('Fallback geocode failed', error, { payloadAddress, payloadCity, query });
        }

        return null;
    };

    const handleGetLocation = async () => {
        if (!address.trim()) {
            toast.error('Vui lòng nhập địa chỉ trước');
            return null;
        }

        const resolvedLocation = await resolveLocationFromAddress(address, cityName).catch(() => null);
        const candidateLat = parseLatLng(resolvedLocation?.lat);
        const candidateLng = parseLatLng(resolvedLocation?.lon);

        if (candidateLat === null || candidateLng === null) {
            console.warn('Geocode returned invalid coords', { address, cityName, resolvedLocation });
            toast.error('Không xác định được tọa độ từ địa chỉ và thành phố');
            return null;
        }

        setLatitude(candidateLat.toString());
        setLongitude(candidateLng.toString());
        setResolvedDisplayAddress(resolvedLocation?.display_name || `${address}, ${cityName || 'Việt Nam'}`);
        setResolvedGeoMeta({
            source: resolvedLocation?.source,
            method: resolvedLocation?.method,
            confidence: resolvedLocation?.confidence,
            query: resolvedLocation?.query
        });
        toast.success('📍 Đã ghim vị trí từ địa chỉ!');
        return resolvedLocation;
    };

    const handleLocation = handleGetLocation;

    const handleTestGeocoding = async () => {
        if (!address.trim()) {
            toast.error('Vui lòng nhập địa chỉ trước');
            return;
        }
        const resolvedLocation = await resolveLocationFromAddress(address, cityName).catch(() => null);
        if (resolvedLocation?.lat && resolvedLocation?.lon) {
            toast.success('Đã lấy kết quả geocoding');
        } else {
            toast.error('Không lấy được tọa độ từ địa chỉ và thành phố');
        }
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

        if ((!latitude || !longitude) || parseLatLng(latitude) === null || parseLatLng(longitude) === null) {
            toast('Đang xác định vị trí từ địa chỉ và thành phố...');
            const resolvedLocation = await resolveLocationFromAddress(address, cityName).catch(() => null);
            const candidateLat = parseLatLng(resolvedLocation?.lat);
            const candidateLng = parseLatLng(resolvedLocation?.lon);

            if (candidateLat === null || candidateLng === null) {
                console.warn('Submit geocode failed', { address, cityName, resolvedLocation });
                toast.error('Không xác định được tọa độ từ địa chỉ và thành phố');
                return;
            }

            setLatitude(candidateLat.toString());
            setLongitude(candidateLng.toString());
            setResolvedDisplayAddress(resolvedLocation?.display_name || `${address}, ${cityText || 'Việt Nam'}`);
            setResolvedGeoMeta({
                source: resolvedLocation?.source,
                method: resolvedLocation?.method,
                confidence: resolvedLocation?.confidence,
                query: resolvedLocation?.query
            });

            const freshLatitude = candidateLat.toString();
            const freshLongitude = candidateLng.toString();
            const resolvedLatitude = parseLatLng(freshLatitude);
            const resolvedLongitude = parseLatLng(freshLongitude);

            if (resolvedLatitude === null || resolvedLongitude === null) {
                toast.error('Vui lòng xác định vị trí từ địa chỉ trước khi đặt thợ');
                return;
            }

            const cityLookup = cities.find(c => c.id === selectedCityId || c.cityName?.trim() === cityText.trim());
            console.log('🔍 City values before submit', {
                cityText,
                selectedCityId,
                cityLookup,
                cities: cities.map(c => ({ id: c.id, cityName: c.cityName }))
            });

            const cityIdForSubmit = cityLookup?.id || selectedCityId;
            if (!cityIdForSubmit) {
                toast.error('Không tìm thấy CityId hợp lệ, vui lòng chọn lại thành phố');
                return;
            }

            if (isDemoTech(tech)) {
                toast.success('Đang chạy chế độ demo: thợ test chỉ hiển thị giao diện, không gửi đơn thật.');
                navigate('/customer/orders?status=pending');
                return;
            }

            setIsSubmitting(true);

            const orderData = {
                customerId: user.id,
                technicianId: tech.technicianId || tech.TechnicianId,
                serviceId: selectedServiceId,
                cityId: cityIdForSubmit,
                title: title.trim() || 'Yêu cầu sửa chữa',
                description: desc.trim(),
                address: address.trim(),
                latitude: resolvedLatitude.toString(),
                longitude: resolvedLongitude.toString(),
                imageFiles,
                videoFile: videoFiles[0]
            };

            try {
                const response = await technicianCatalogService.placeOrder(orderData);
                console.log('✅ Success Response:', response);
                toast.success('🎉 Đặt thợ thành công! Đang chờ xác nhận...');
                navigate('/customer/orders?status=pending');
            } catch (err: any) {
                console.group('❌ ERROR DETAILS');
                console.error('Full Error:', err);
                console.error('Response:', err?.response);
                console.error('Response Data:', err?.response?.data);
                console.error('Response Status:', err?.response?.status);
                console.groupEnd();

                let errorMsg = 'Đặt thợ thất bại';
                const responseData = err?.response?.data;
                const validationErrors = responseData?.errors;
                if (validationErrors && typeof validationErrors === 'object') {
                    const details = Object.entries(validationErrors)
                        .flatMap(([field, messages]) =>
                            Array.isArray(messages)
                                ? messages.map((msg: any) => `${field}: ${msg}`)
                                : [`${field}: ${String(messages)}`]
                        )
                        .join(' | ');
                    errorMsg = details || responseData?.message || errorMsg;
                } else if (responseData?.message) {
                    errorMsg = responseData.message;
                } else if (typeof responseData === 'string') {
                    errorMsg = responseData;
                } else if (err?.message) {
                    errorMsg = err.message;
                }

                toast.error(`❌ Lỗi: ${errorMsg}`);
                console.error('Final display error:', errorMsg);
            } finally {
                setIsSubmitting(false);
            }
            return;
        }

        const resolvedLatitude = parseLatLng(latitude);
        const resolvedLongitude = parseLatLng(longitude);

        if (resolvedLatitude === null || resolvedLongitude === null) {
            toast.error('Vui lòng xác định vị trí từ địa chỉ trước khi đặt thợ');
            return;
        }

        const cityLookup = cities.find(c => c.id === selectedCityId || c.cityName?.trim() === cityText.trim());
        console.log('🔍 City values before submit', {
            cityText,
            selectedCityId,
            cityLookup,
            cities: cities.map(c => ({ id: c.id, cityName: c.cityName }))
        });

        const cityIdForSubmit = cityLookup?.id || selectedCityId;
        if (!cityIdForSubmit) {
            toast.error('Không tìm thấy CityId hợp lệ, vui lòng chọn lại thành phố');
            return;
        }

        if (isDemoTech(tech)) {
            toast.success('Đang chạy chế độ demo: thợ test chỉ hiển thị giao diện, không gửi đơn thật.');
            navigate('/customer/orders?status=pending');
            return;
        }

        setIsSubmitting(true);

        // ✅ TẠO PAYLOAD ĐÚNG CHO ENDPOINT ĐẶT ĐƠN TỰ ĐỘNG
        const orderData = {
            customerId: user.id,
            technicianId: tech.technicianId || tech.TechnicianId,
            serviceId: selectedServiceId,
            cityId: cityIdForSubmit,
            title: title.trim() || 'Yêu cầu sửa chữa',
            description: desc.trim(),
            address: address.trim(),
            latitude: resolvedLatitude.toString(),
            longitude: resolvedLongitude.toString(),
            imageFiles,
            videoFile: videoFiles[0]
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
            const responseData = err?.response?.data;
            const validationErrors = responseData?.errors;
            if (validationErrors && typeof validationErrors === 'object') {
                const details = Object.entries(validationErrors)
                    .flatMap(([field, messages]) =>
                        Array.isArray(messages)
                            ? messages.map((msg: any) => `${field}: ${msg}`)
                            : [`${field}: ${String(messages)}`]
                    )
                    .join(' | ');
                errorMsg = details || responseData?.message || errorMsg;
            } else if (responseData?.message) {
                errorMsg = responseData.message;
            } else if (typeof responseData === 'string') {
                errorMsg = responseData;
            } else if (err?.message) {
                errorMsg = err.message;
            }

            toast.error(`❌ Lỗi: ${errorMsg}`);
            console.error('Final display error:', errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };
    const mapSrc = mapToIframeUrl(latitude, longitude, resolvedDisplayAddress || address);

    return (
        <DialogContent className="w-[98vw] sm:max-w-[1180px] bg-[#0a1122] border border-white/10 text-white max-h-[90vh] overflow-y-auto rounded-3xl p-0 shadow-2xl shadow-black/50">
            <div className="border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent px-6 py-5">
                <DialogHeader className="space-y-2">
                    <DialogTitle className="text-2xl font-semibold tracking-tight">
                        Đặt Thợ: {tech.technicianName || tech.TechnicianName}
                    </DialogTitle>
                    <p className="text-sm text-zinc-400">
                        {tech.serviceName || tech.ServiceName} · ⭐ {tech.avgScore || tech.AvgScore || 5.0}
                    </p>
                </DialogHeader>
            </div>

            <div className="px-6 py-6">
                <div className="grid gap-7 lg:grid-cols-1">
                    <div className="space-y-6">
                        {/* Dịch vụ cố định theo technician, khách không chọn ở đây */}
                        <div className="space-y-1.5">
                            <Label>Dịch vụ của thợ <span className="text-red-400">*</span></Label>
                            <div className="flex h-11 w-full cursor-not-allowed items-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-sm text-zinc-400 opacity-70">
                                {tech.serviceName || tech.ServiceName || services.find(s => s.id === selectedServiceId)?.serviceName || 'Dịch vụ chưa cập nhật'}
                            </div>
                        </div>

                        {/* Tiêu đề */}
                        <div className="space-y-1.5">
                            <Label>Tiêu đề</Label>
                            <Input
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Vd: Điều hòa không mát"
                                className="h-11 rounded-2xl bg-white/5 border-white/10 text-white"
                            />
                        </div>

                        {/* Mô tả */}
                        <div className="space-y-1.5">
                            <Label>Mô tả chi tiết <span className="text-red-400">*</span></Label>
                            <Textarea
                                value={desc}
                                onChange={e => setDesc(e.target.value)}
                                rows={5}
                                placeholder="Mô tả rõ sự cố để thợ chuẩn bị phù hợp..."
                                className="rounded-2xl bg-white/5 border-white/10 text-white resize-none"
                            />
                        </div>

                        {/* Upload ảnh / video */}
                        <div className="space-y-1.5">
                            <Label>Hình ảnh</Label>
                            <input ref={imageRef} type="file" accept="image/*" multiple onChange={handleImages} className="hidden" />
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Button type="button" variant="outline"
                                    className="flex-1 h-11 rounded-2xl bg-white/5 border-white/10 hover:bg-primary/10 hover:border-primary/30"
                                    onClick={() => imageRef.current?.click()}>
                                    <Camera className="w-4 h-4 mr-2" /> Chọn ảnh
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

                    </div>

                    <div className="space-y-6">
                        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 space-y-4">
                            {/* Thành phố + địa chỉ nhập thủ công */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label>Thành phố <span className="text-red-400">*</span></Label>
                                    <Input
                                        value={cityText}
                                        placeholder="Ví dụ: Đà Nẵng"
                                        readOnly
                                        tabIndex={-1}
                                        className="h-11 rounded-2xl bg-white/5 border-white/10 text-white text-sm cursor-not-allowed select-none"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="flex items-center gap-1.5">
                                        <MapPin size={13} className="text-primary-light" />
                                        Địa chỉ <span className="text-red-400">*</span>
                                    </Label>
                                    <Input
                                        value={address}
                                        onChange={e => setAddress(e.target.value)}
                                        placeholder="Ví dụ: 123 Hoàng Diệu"
                                        className="h-11 rounded-2xl bg-white/5 border-white/10 text-white text-sm"
                                    />
                                    <p className="text-[10px] text-zinc-500">Nhập địa chỉ chi tiết nơi cần sửa chữa.</p>
                                </div>
                            </div>


                        </div>

                        <Button
                            className="w-full h-12 rounded-2xl bg-primary hover:bg-primary-dark text-white font-bold flex items-center justify-center gap-2"
                            onClick={handleSubmit}
                            disabled={isSubmitting}>
                            {isSubmitting
                                ? <><Loader2 size={16} className="animate-spin" /> Đang gửi...</>
                                : <><CheckCircle size={16} /> Hoàn thành — Đặt lịch sửa chữa</>
                            }
                        </Button>
                    </div>
                </div>
            </div>
        </DialogContent>
    );
}


// ─── Auto Find Dialog ──────────────────────────────────────────────────────────
function AutoFindDialog({ services, cities, onClose }: { services: ServiceDTO[], cities: CityDTO[], onClose: () => void }) {
    const { user } = useAuthStore();
    const navigate = useNavigate();

    const [selectedService, setSelectedService] = useState('');
    const [cityText, setCityText] = useState('');
    const cityName = cityText?.trim() || '';
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [address, setAddress] = useState('');
    const [latitude, setLatitude] = useState<string>('');
    const [longitude, setLongitude] = useState<string>('');
    const [resolvedDisplayAddress, setResolvedDisplayAddress] = useState('');
    const [resolvedGeoMeta, setResolvedGeoMeta] = useState<{ source?: string; method?: string; confidence?: number; query?: string }>({});
    const [isSearching, setIsSearching] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [rejectedTechIds, setRejectedTechIds] = useState<string[]>([]);
    const [foundTech, setFoundTech] = useState<any>(null);
    const [selectedCityId, setSelectedCityId] = useState('');
    const [searchStatus, setSearchStatus] = useState<'idle' | 'searching' | 'found' | 'not_found'>('idle');
    const [searchReason, setSearchReason] = useState('');
    const searchRequestRef = useRef(0);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const autoFindImageRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!cities.length) return;
        if (!selectedCityId || !cities.some(c => String(c.id) === String(selectedCityId))) {
            const firstCity = cities[0];
            setSelectedCityId(firstCity.id);
            setCityText(firstCity.cityName || '');
        }
    }, [cities, selectedCityId]);

    const resetAutoFindForm = () => {
        searchRequestRef.current += 1;
        setSelectedService('');
        const firstCity = cities[0];
        setSelectedCityId(firstCity?.id || '');
        setCityText(firstCity?.cityName || '');
        setTitle('');
        setDesc('');
        setAddress('');
        setLatitude('');
        setLongitude('');
        setResolvedDisplayAddress('');
        setResolvedGeoMeta({});
        setIsSearching(false);
        setIsTransitioning(false);
        setIsConfirming(false);
        setRejectedTechIds([]);
        setFoundTech(null);
        setSearchStatus('idle');
        setSearchReason('');
        setImagePreviews(prev => {
            prev.forEach(url => URL.revokeObjectURL(url));
            return [];
        });
        setImageFiles([]);
        if (autoFindImageRef.current) autoFindImageRef.current.value = '';
    };

    const handleAutoFindImages = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setImageFiles(prev => [...prev, ...files]);
        setImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
        if (autoFindImageRef.current) autoFindImageRef.current.value = '';
    };

    const handleCloseAutoFind = () => {
        searchRequestRef.current += 1;
        setImagePreviews(prev => {
            prev.forEach(url => URL.revokeObjectURL(url));
            return [];
        });
        setImageFiles([]);
        if (autoFindImageRef.current) autoFindImageRef.current.value = '';
        if (user?.id) {
            void autoFindService.clearSession(user.id).catch(() => undefined);
        }
        onClose();
    };

    const handleGetLocation = async () => {
        if (!address.trim()) {
            toast.error('Vui lòng nhập địa chỉ trước');
            return;
        }

        const resolvedLocation = await resolveLocationFromAddress(address, cityText).catch(() => null);

        const candidateLat = parseLatLng(resolvedLocation?.lat);
        const candidateLng = parseLatLng(resolvedLocation?.lon);

        if (candidateLat === null || candidateLng === null) {
            toast.error('Không xác định được tọa độ từ địa chỉ và thành phố');
            return;
        }

        setLatitude(candidateLat.toString());
        setLongitude(candidateLng.toString());
        setResolvedDisplayAddress(resolvedLocation?.display_name || `${address}, ${cityText || 'Việt Nam'}`);
        setResolvedGeoMeta({
            source: resolvedLocation?.source,
            method: resolvedLocation?.method,
            confidence: resolvedLocation?.confidence,
            query: resolvedLocation?.query
        });
        toast.success('Đã lấy được latitude/longitude');
    };

    const handleStartSearch = async () => {
        if (!user?.id) return toast.error('Vui lòng đăng nhập!');
        if (!selectedService || !selectedCityId || !desc || !address) return toast.error('Vui lòng điền đủ thông tin!');
        console.log('🔍 AutoFind payload before submit', { selectedService, selectedCityId, cityText, title, desc, address, latitude, longitude });

        const requestId = ++searchRequestRef.current;
        setIsSearching(true);
        setSearchStatus('searching');
        try {
            const resolvedLocation = await resolveLocationFromAddress(address, cityName).catch(() => null);
            if (requestId !== searchRequestRef.current) return;
            const candidateLat = parseLatLng(resolvedLocation?.lat ?? latitude);
            const candidateLng = parseLatLng(resolvedLocation?.lon ?? longitude);
            if (candidateLat === null || candidateLng === null) {
                toast.error('Không xác định được tọa độ từ địa chỉ và thành phố');
                setSearchStatus('idle');
                return;
            }

            const latValue = candidateLat.toString();
            const lngValue = candidateLng.toString();
            setLatitude(latValue);
            setLongitude(lngValue);
            setResolvedDisplayAddress(resolvedLocation?.display_name || `${address}, ${cityName || 'Việt Nam'}`);

            await autoFindService.clearSession(user.id).catch(() => undefined);
            if (requestId !== searchRequestRef.current) return;
            await autoFindService.findTechnicians(user.id, {
                customerId: user.id,
                serviceId: selectedService,
                cityId: selectedCityId,
                latitude: latValue,
                longitude: lngValue,
                description: desc
            });
            if (requestId !== searchRequestRef.current) return;
            const res = await autoFindService.checkAcceptance(user.id);
            if (requestId !== searchRequestRef.current) return;
            if (!res || !(res.id || res.technicianId || res.TechnicianId)) {
                setSearchStatus('not_found');
                setSearchReason('Không có thợ phù hợp với tiêu chí bạn chọn.');
                toast.error('Không tìm thấy thợ phù hợp lúc này');
                return;
            }

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
                city: res.city || res.City || '',
                estimatedTime: res.estimatedTime ?? res.EstimatedTime
            });
            setSearchStatus('found');
            setSearchReason('');
        } catch (err: any) {
            if (requestId !== searchRequestRef.current) return;
            const status = err?.response?.status;
            const message = err?.response?.data?.message || '';
            if (status === 400) {
                setSearchStatus('not_found');
                setSearchReason(message || 'Không có thợ phù hợp với tiêu chí bạn chọn.');
                toast.error(message || 'Không có thợ phù hợp lúc này');
            } else {
                setSearchStatus('not_found');
                setSearchReason('Có lỗi khi tìm thợ. Vui lòng thử lại hoặc đổi dịch vụ/thành phố.');
                toast.error('Không thể tìm kỹ thuật viên lúc này');
            }
        } finally {
            if (requestId !== searchRequestRef.current) return;
            setIsSearching(false);
            setTimeout(() => setIsTransitioning(false), 500);
        }
    };

    const handleRejectTechnician = async () => {
        if (!user?.id || !foundTech) return;
        setIsSearching(true);
        setIsTransitioning(true);

        const rejectedTechId = resolveTechnicianGuid(foundTech);
        setRejectedTechIds(prev => prev.includes(rejectedTechId) ? prev : [...prev, rejectedTechId]);

        try {
            const attempted = new Set<string>([...rejectedTechIds, rejectedTechId, resolveTechnicianGuid(foundTech)]);
            let nextCandidate: any = null;

            for (let i = 0; i < 15; i += 1) {
                const res = await autoFindService.checkAcceptance(user.id);
                if (!res || !(res.id || res.technicianId || res.TechnicianId)) break;
                const nextBackendId = String(res.id || res.technicianId || res.TechnicianId);
                if (!attempted.has(nextBackendId)) {
                    nextCandidate = res;
                    break;
                }
            }

            if (!nextCandidate) {
                setFoundTech(null);
                setSearchStatus('not_found');
                setSearchReason('Không còn thợ nào khác phù hợp lúc này.');
                await autoFindService.clearSession(user.id).catch(() => undefined);
                toast.error('Không có thợ phù hợp tiếp theo.');
                return;
            }

            setFoundTech({
                ...nextCandidate,
                technicianId: nextCandidate.technicianId || nextCandidate.TechnicianId || nextCandidate.id,
                fullName: nextCandidate.fullName || nextCandidate.FullName || nextCandidate.name,
                name: nextCandidate.name || nextCandidate.fullName || nextCandidate.FullName,
                specialty: nextCandidate.serviceName || nextCandidate.ServiceName || 'Kỹ thuật viên',
                serviceName: nextCandidate.serviceName || nextCandidate.ServiceName || 'Kỹ thuật viên',
                rating: nextCandidate.score || nextCandidate.Score || nextCandidate.avgScore || nextCandidate.AvgScore || 5,
                orderCount: nextCandidate.orderCount || nextCandidate.OrderCount || 0,
                ratingCount: nextCandidate.ratingCount || nextCandidate.RatingCount || 0,
                avatarURL: nextCandidate.avatarURL || nextCandidate.AvatarURL || nextCandidate.avatarUrl || nextCandidate.AvatarUrl,
                phone: nextCandidate.phone || nextCandidate.Phone || '',
                address: nextCandidate.address || nextCandidate.Address || '',
                city: nextCandidate.city || nextCandidate.City || '',
                estimatedTime: nextCandidate.estimatedTime ?? nextCandidate.EstimatedTime
            });
            setSearchStatus('found');
            setSearchReason('');
            toast.success('Đã đề xuất kỹ thuật viên tiếp theo.');
        } catch {
            setSearchStatus('not_found');
            setSearchReason('Không còn thợ nào khác phù hợp lúc này.');
            toast.error('Không có thợ phù hợp tiếp theo.');
        } finally {
            setIsTransitioning(false);
            setIsSearching(false);
        }
    };

    const handleConfirmBooking = async () => {
        if (!foundTech || !user) return;
        setIsConfirming(true);
        try {
            const resolvedCityId = selectedCityId;

            if (!resolvedCityId) {
                toast.error('Không xác định được cityId hợp lệ, vui lòng chọn lại thành phố');
                return;
            }

            const currentLat = parseLatLng(latitude);
            const currentLng = parseLatLng(longitude);
            const resolvedLocation = (currentLat !== null && currentLng !== null)
                ? null
                : await resolveLocationFromAddress(address, cityName).catch(() => null);
            const resolvedLatitude = resolvedLocation?.lat || latitude;
            const resolvedLongitude = resolvedLocation?.lon || longitude;
            const resolvedAddress = resolvedLocation?.display_name || address;
            const estimatedTimeValue = Number(getTechEstimatedTime(foundTech));
            const finalEstimatedTime = Number.isFinite(estimatedTimeValue) && estimatedTimeValue > 0
                ? estimatedTimeValue
                : 150;

            setLatitude(resolvedLatitude);
            setLongitude(resolvedLongitude);
            setAddress(resolvedAddress);

            // Step 3: đồng ý thợ -> gọi API 2 tạo order
            await autoFindService.placeAutoOrder({
                customerId: user.id,
                technicianId: resolveTechnicianGuid(foundTech),
                serviceId: selectedService,
                cityId: resolvedCityId,
                title: title.trim() || 'Đặt thợ tự động',
                description: desc,
                address: resolvedAddress,
                latitude: resolvedLatitude,
                longitude: resolvedLongitude,
                estimatedTime: finalEstimatedTime,
                status: 'Pending Confirmation',
                ...(imageFiles.length ? { imageFiles } : {})
            });

            toast.success('Đặt thợ thành công!');
            onClose();
            navigate('/customer/orders?status=pending');
            // cleanup in background so dialog can close immediately
            void autoFindService.clearSession(user.id).catch(() => undefined);
        } catch (err: any) {
            const responseData = err?.response?.data;
            const errorMessage = responseData?.message || err?.message || 'Đặt thợ thất bại';
            console.error('AutoFind place order failed', {
                error: err,
                responseData,
                payload: {
                    customerId: user?.id,
                    technicianId: resolveTechnicianGuid(foundTech),
                    serviceId: selectedService,
                    cityText,
                    selectedCityId,
                    latitude,
                    longitude
                }
            });
            toast.error(errorMessage);
        } finally {
            setIsConfirming(false);
        }
    };

    return (
        <DialogContent showCloseButton={false} className="sm:max-w-[860px] overflow-hidden border border-white/10 bg-[#07101f] p-0 text-white shadow-2xl">
            <div className="border-b border-white/10 bg-gradient-to-r from-blue-600/20 via-primary/15 to-cyan-500/10 px-6 py-5">
                <DialogHeader className="flex-row items-start justify-between gap-4 space-y-0">
                    <div>
                        <DialogTitle className="text-xl font-bold">Tìm kỹ thuật viên tự động</DialogTitle>
                        <p className="mt-1 text-sm text-zinc-400">
                            Hệ thống sẽ quét và ghép thợ phù hợp nhất theo dịch vụ, thành phố và vị trí của bạn.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={resetAutoFindForm} className="h-9 rounded-full border-white/10 bg-white/5 px-4 text-xs font-semibold text-white hover:bg-white/10">
                            Reset
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={handleCloseAutoFind} className="h-9 w-9 rounded-full border border-white/10 bg-white/5 p-0 text-zinc-300 hover:bg-white/10 hover:text-white">
                            X
                        </Button>
                    </div>
                </DialogHeader>
            </div>

            <div className="max-h-[78vh] overflow-y-auto px-6 py-5">
                {searchStatus === 'idle' && (
                    <div className="space-y-5">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label className="text-zinc-300">Loại dịch vụ</Label>
                                <select
                                    value={selectedService}
                                    onChange={e => setSelectedService(e.target.value)}
                                    className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition focus:border-primary/50"
                                >
                                    <option value="" className="bg-[#0a1122]">Chọn dịch vụ...</option>
                                    {services.map((s: ServiceDTO) => <option key={s.id} value={s.id} className="bg-[#0a1122]">{s.serviceName}</option>)}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-zinc-300">Thành phố</Label>
                                <select
                                    value={selectedCityId}
                                    onChange={e => {
                                        const cityId = e.target.value;
                                        setSelectedCityId(cityId);
                                        const city = cities.find((c: CityDTO) => String(c.id) === String(cityId));
                                        setCityText(city?.cityName || '');
                                    }}
                                    className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition focus:border-primary/50"
                                >
                                    <option value="" className="bg-[#0a1122]">Chọn thành phố...</option>
                                    {cities.map((c: CityDTO) => (
                                        <option key={c.id} value={c.id} className="bg-[#0a1122]">
                                            {c.cityName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5 md:col-span-2">
                                <Label className="text-zinc-300">Tiêu đề</Label>
                                <Input
                                    placeholder="Ví dụ: Điều hòa không mát"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="h-11 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-zinc-500 focus:border-primary/50"
                                />
                            </div>

                            <div className="space-y-1.5 md:col-span-2">
                                <Label className="text-zinc-300">Mô tả sự cố</Label>
                                <Textarea
                                    placeholder="Mô tả ngắn gọn vấn đề của bạn..."
                                    value={desc}
                                    onChange={e => setDesc(e.target.value)}
                                    className="min-h-[110px] rounded-xl border-white/10 bg-white/5 text-white placeholder:text-zinc-500 focus:border-primary/50"
                                />
                            </div>

                            <div className="space-y-1.5 md:col-span-2">
                                <Label className="text-zinc-300">Địa chỉ</Label>
                                <Input
                                    placeholder="Nhập địa chỉ của bạn..."
                                    value={address}
                                    onChange={e => setAddress(e.target.value)}
                                    className="h-11 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-zinc-500 focus:border-primary/50"
                                />
                            </div>

                            <div className="space-y-1.5 md:col-span-2">
                                <Label className="text-zinc-300">Hình ảnh <span className="font-normal text-zinc-500">(tùy chọn)</span></Label>
                                <input
                                    ref={autoFindImageRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleAutoFindImages}
                                    className="hidden"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-11 w-full rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 sm:w-auto"
                                    onClick={() => autoFindImageRef.current?.click()}
                                >
                                    <Camera className="mr-2 h-4 w-4" /> Chọn ảnh
                                </Button>
                                {imagePreviews.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {imagePreviews.map((src, i) => (
                                            <div key={`${src}-${i}`} className="group relative h-14 w-14">
                                                <img src={src} alt="" className="h-full w-full rounded-lg border border-white/10 object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        URL.revokeObjectURL(src);
                                                        setImagePreviews(p => p.filter((_, j) => j !== i));
                                                        setImageFiles(p => p.filter((_, j) => j !== i));
                                                    }}
                                                    className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition group-hover:opacity-100"
                                                >
                                                    <X size={8} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>

                        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-white">Sẵn sàng tìm thợ phù hợp</p>
                                    <p className="mt-1 text-xs text-zinc-500">Kết quả sẽ ưu tiên khu vực gần bạn và dịch vụ đúng nhu cầu.</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Button onClick={handleStartSearch} className="h-11 rounded-xl bg-primary px-5 font-bold text-white hover:bg-primary-dark" disabled={isSearching}>
                                        {isSearching ? 'Đang tìm...' : 'Bắt đầu tìm kiếm thợ'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {searchStatus === 'searching' && (
                    <div className="flex min-h-[420px] flex-col items-center justify-center gap-6 text-center">
                        <div className="relative">
                            <div className="h-24 w-24 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Navigation className="h-8 w-8 text-primary animate-pulse" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Đang tìm thợ gần bạn...</h3>
                            <p className="mt-2 max-w-md text-sm text-zinc-400">Hệ thống đang kiểm tra thợ phù hợp nhất theo dịch vụ, khu vực và trạng thái rảnh.</p>
                        </div>
                        <Button
                            variant="ghost"
                            className="rounded-xl text-red-400 hover:bg-red-400/10 hover:text-red-300"
                            onClick={async () => {
                                searchRequestRef.current += 1;
                                if (user?.id) await autoFindService.clearSession(user.id).catch(() => undefined);
                                setIsSearching(false);
                                setIsTransitioning(false);
                                setIsConfirming(false);
                                setFoundTech(null);
                                setSearchReason('');
                                setSearchStatus('idle');
                            }}
                        >
                            Hủy tìm kiếm
                        </Button>
                    </div>
                )}

                {searchStatus === 'found' && foundTech && (
                    <div className="space-y-5">
                        <div className="rounded-2xl border border-green-500/20 bg-green-500/5 px-4 py-3 text-center sm:px-5">
                            <CheckCircle className="mx-auto mb-2 h-14 w-14 text-green-500" />
                            <h3 className="text-2xl font-bold text-white">Đã tìm thấy thợ!</h3>
                            <p className="mt-1 text-sm text-zinc-400">Kỹ thuật viên <b className="text-white">{foundTech.fullName || foundTech.name}</b> đã sẵn sàng.</p>
                        </div>

                        {isTransitioning ? (
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                                <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 text-center">
                                    <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                                    <div>
                                        <p className="text-lg font-semibold text-white">Đang xử lý...</p>
                                        <p className="mt-1 text-sm text-zinc-400">Chuẩn bị hiển thị thợ tiếp theo</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-5 rounded-3xl border border-white/10 bg-white/[0.04] p-5 lg:grid-cols-[280px_1fr] lg:p-6">
                                <div className="flex flex-col items-center gap-4 text-center">
                                    <div className="flex h-60 w-56 items-center justify-center overflow-hidden rounded-[32px] bg-primary/20 text-5xl font-bold text-white ring-1 ring-white/10 md:h-[380px] md:w-60">
                                        {foundTech.avatarURL ? (
                                            <img src={foundTech.avatarURL} alt="avatar" className="h-full w-full object-cover" />
                                        ) : (
                                            (foundTech.fullName || foundTech.name || 'T')[0]
                                        )}
                                    </div>
                                    <div className="space-y-1 px-2">
                                        <div className="flex items-center justify-center gap-2">
                                            <MessageSquareText className="h-4 w-4 text-primary" />
                                            <p className="truncate text-xl font-bold text-white">{foundTech.fullName || foundTech.name || 'Tech AC 01'}</p>
                                        </div>
                                        <div className="flex items-center justify-center gap-1 text-sm text-zinc-400">
                                            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                            <span>{foundTech.rating || 5.0}</span>
                                            <span>·</span>
                                            <span>{foundTech.ratingCount || 0} đánh giá</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                                    <InfoItem label="Dịch vụ" value={foundTech.serviceName || foundTech.specialty || 'Kỹ thuật viên'} />
                                    <InfoItem label="Địa chỉ" value={foundTech.address || 'Chưa cập nhật'} />
                                    <InfoItem label="Thành phố" value={normalizeCityName(foundTech.city || 'Đà Nẵng')} />
                                    <InfoItem label="Kinh nghiệm" value={getTechYears(foundTech) > 0 ? `${getTechYears(foundTech)} năm` : 'Chưa cập nhật'} />
                                    <InfoItem label="Thời gian ước tính" value={foundTech.etaWindow || (Number.isFinite(getTechEstimatedTime(foundTech)) && getTechEstimatedTime(foundTech) > 0 ? `${getTechEstimatedTime(foundTech)} phút` : 'Chưa cập nhật')} />
                                </div>
                            </div>
                        )}

                        {!isTransitioning && (
                            <div className="grid gap-3 sm:grid-cols-2">
                                <Button variant="outline" className="h-11 rounded-xl border-white/10 bg-white/5 font-semibold text-white hover:bg-white/10" onClick={handleRejectTechnician} disabled={isSearching || isTransitioning || isConfirming}>
                                    {isSearching ? 'Đang lấy thợ khác...' : 'Từ chối thợ này'}
                                </Button>
                                <Button className="h-11 rounded-xl bg-green-600 font-bold text-white hover:bg-green-700" onClick={handleConfirmBooking} disabled={isTransitioning || isConfirming}>
                                    {isConfirming ? 'Đang đặt lịch...' : 'Xác nhận đặt lịch'}
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {searchStatus === 'not_found' && (
                    <div className="flex min-h-[360px] flex-col items-center justify-center gap-6 text-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
                            <X className="h-10 w-10 text-red-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Không tìm thấy thợ rảnh</h3>
                            <p className="mt-2 text-sm text-zinc-400">Hiện tại không có kỹ thuật viên nào rảnh trong khu vực này. Bạn có muốn thử lại không?</p>
                            {searchReason && <p className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-200">{searchReason}</p>}
                        </div>
                        <div className="flex w-full gap-3 sm:w-auto">
                            <Button variant="outline" className="h-11 flex-1 rounded-xl border-white/10 bg-white/5 font-semibold text-white hover:bg-white/10" onClick={handleCloseAutoFind}>Đóng</Button>
                            <Button className="h-11 flex-1 rounded-xl bg-primary font-semibold text-white hover:bg-primary-dark" onClick={handleStartSearch}>Thử lại ngay</Button>
                        </div>
                    </div>
                )}
            </div>
        </DialogContent>
    );
}
