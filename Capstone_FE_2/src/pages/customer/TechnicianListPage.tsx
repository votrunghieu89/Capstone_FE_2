import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Star, MapPin, CheckCircle, Phone, MessageSquare, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const CATEGORIES = ['Tất cả', 'Điều hòa', 'Tủ lạnh', 'Máy giặt', 'Điện nước', 'Thiết bị gia dụng'];

const MOCK_TECHNICIANS = [
    {
        id: 1, name: 'Nguyễn Văn Minh', specialty: 'Điều hòa & Tủ lạnh', rating: 4.9,
        reviews: 128, location: 'Hải Châu, Đà Nẵng', experience: '5 năm kinh nghiệm',
        isOnline: true, completedJobs: 342, avatar: 'M', tags: ['Điều hòa', 'Tủ lạnh'],
        price: '150.000đ/h', bio: 'Chuyên sửa chữa điện lạnh gia dụng, tay nghề cao, uy tín.'
    },
    {
        id: 2, name: 'Trần Thị Lan', specialty: 'Máy giặt & Điện gia dụng', rating: 4.8,
        reviews: 89, location: 'Thanh Khê, Đà Nẵng', experience: '4 năm kinh nghiệm',
        isOnline: true, completedJobs: 210, avatar: 'L', tags: ['Máy giặt', 'Thiết bị gia dụng'],
        price: '130.000đ/h', bio: 'Thợ nữ chuyên nghiệp, tận tâm, vệ sinh sạch sẽ khi làm.'
    },
    {
        id: 3, name: 'Lê Hoàng Dũng', specialty: 'Điện nước tổng hợp', rating: 4.7,
        reviews: 201, location: 'Ngũ Hành Sơn, Đà Nẵng', experience: '7 năm kinh nghiệm',
        isOnline: false, completedJobs: 580, avatar: 'D', tags: ['Điện nước'],
        price: '120.000đ/h', bio: 'Thợ điện nước lành nghề, nhận tất cả dịch vụ sửa chữa tại nhà.'
    },
    {
        id: 4, name: 'Phạm Quang Huy', specialty: 'Điều hòa chuyên sâu', rating: 5.0,
        reviews: 55, location: 'Sơn Trà, Đà Nẵng', experience: '3 năm kinh nghiệm',
        isOnline: true, completedJobs: 145, avatar: 'H', tags: ['Điều hòa'],
        price: '180.000đ/h', bio: 'Chứng chỉ kỹ thuật viên điện lạnh quốc tế, sửa mọi thương hiệu.'
    },
    {
        id: 5, name: 'Võ Thị Hồng', specialty: 'Tủ lạnh & Máy lạnh', rating: 4.6,
        reviews: 73, location: 'Liên Chiểu, Đà Nẵng', experience: '4 năm kinh nghiệm',
        isOnline: true, completedJobs: 190, avatar: 'H', tags: ['Tủ lạnh', 'Điều hòa'],
        price: '140.000đ/h', bio: 'Sửa chữa nhanh, bảo hành dài hạn cho từng ca dịch vụ.'
    },
    {
        id: 6, name: 'Đỗ Văn Phúc', specialty: 'Điện gia dụng & Điện nước', rating: 4.5,
        reviews: 142, location: 'Cẩm Lệ, Đà Nẵng', experience: '6 năm kinh nghiệm',
        isOnline: false, completedJobs: 410, avatar: 'P', tags: ['Điện nước', 'Thiết bị gia dụng'],
        price: '110.000đ/h', bio: 'Đội thợ chuyên nghiệp, phục vụ tận nơi, báo giá minh bạch.'
    },
];

export default function TechnicianListPage() {
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('Tất cả');

    const filtered = MOCK_TECHNICIANS.filter(t => {
        const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
            t.specialty.toLowerCase().includes(search.toLowerCase());
        const matchCategory = activeCategory === 'Tất cả' || t.tags.includes(activeCategory);
        return matchSearch && matchCategory;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <h1 className="text-2xl font-bold text-white">Danh sách Kỹ thuật viên</h1>
                <p className="text-zinc-400 mt-1 text-sm">Tìm và chọn thợ sửa chữa phù hợp với nhu cầu của bạn</p>
            </motion.div>

            {/* Search & Filter */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col sm:flex-row gap-3"
            >
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm theo tên, dịch vụ..."
                        className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-primary"
                    />
                </div>
                <Button variant="outline" className="border-white/10 bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 gap-2">
                    <Filter className="w-4 h-4" />
                    Lọc
                </Button>
            </motion.div>

            {/* Category Tabs */}
            <div className="flex gap-2 flex-wrap">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${activeCategory === cat
                                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Results count */}
            <p className="text-xs text-zinc-500">{filtered.length} kỹ thuật viên được tìm thấy</p>

            {/* Technician Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((tech, index) => (
                    <motion.div
                        key={tech.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.06 }}
                        whileHover={{ y: -4 }}
                        className="group bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-primary/20 rounded-2xl p-5 transition-all duration-300 cursor-pointer"
                    >
                        {/* Top row */}
                        <div className="flex items-start gap-4">
                            <div className="relative flex-shrink-0">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 to-blue-500/20 flex items-center justify-center text-xl font-bold text-white">
                                    {tech.avatar}
                                </div>
                                {tech.isOnline && (
                                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#02050b]" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <h3 className="font-semibold text-white truncate">{tech.name}</h3>
                                    <CheckCircle className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                                </div>
                                <p className="text-xs text-zinc-400 mt-0.5 truncate">{tech.specialty}</p>
                                <div className="flex items-center gap-1 mt-1.5">
                                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                    <span className="text-sm font-bold text-white">{tech.rating}</span>
                                    <span className="text-xs text-zinc-500">({tech.reviews} đánh giá)</span>
                                </div>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="mt-4 space-y-2">
                            <p className="text-xs text-zinc-400 line-clamp-2">{tech.bio}</p>
                            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                <span>{tech.location}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-zinc-500">{tech.experience} · {tech.completedJobs} ca</span>
                                <span className="text-sm font-bold text-primary-light">{tech.price}</span>
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="flex gap-1.5 mt-3 flex-wrap">
                            {tech.tags.map(tag => (
                                <span key={tag} className="px-2 py-0.5 bg-primary/10 text-primary-light rounded-full text-[10px] font-medium">
                                    {tag}
                                </span>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="mt-4 flex gap-2">
                            <Button
                                className="flex-1 h-8 text-xs bg-primary/10 hover:bg-primary text-primary-light hover:text-white border border-primary/20 transition-all"
                                variant="ghost"
                            >
                                <Phone className="w-3.5 h-3.5 mr-1" />
                                Gọi ngay
                            </Button>
                            <Button
                                className="flex-1 h-8 text-xs bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-all"
                                variant="ghost"
                            >
                                <MessageSquare className="w-3.5 h-3.5 mr-1" />
                                Nhắn tin
                            </Button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-16 text-zinc-500">
                    <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p>Không tìm thấy kỹ thuật viên phù hợp</p>
                </div>
            )}
        </div>
    );
}
