import { motion } from 'framer-motion';
import { Star, MessageCircle, Info } from 'lucide-react';

export default function ReviewsPage() {
    const reviewsData = [
        {
            id: 1,
            service: 'Sửa Điều Hòa',
            date: '15/09/2026',
            tech: 'Nguyễn Văn A',
            rating: 5,
            content: 'Thợ làm việc rất chuyên nghiệp, đúng giờ và nhiệt tình. Điều hòa đã hoạt động bình thường, chi phí hợp lý.',
            reply: 'Cảm ơn anh đã tin tưởng dịch vụ của FastFix. Chúc anh một ngày vui vẻ!'
        },
        {
            id: 2,
            service: 'Vệ sinh máy giặt',
            date: '12/05/2026',
            tech: 'Lê C',
            rating: 5,
            content: 'Sạch sẽ, gọn gàng, thái độ phục vụ tốt.',
            reply: null
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                        <Star className="w-8 h-8 text-amber-400" />
                        Đánh giá Dịch vụ
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Chia sẻ trải nghiệm của bạn và xem đánh giá đã gửi.
                    </p>
                </div>
                <div className="bg-primary/10 border border-primary/20 text-primary-light px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-semibold">
                    <Info size={16} /> Đánh giá trung bình: 5.0
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reviewsData.map((review) => (
                    <motion.div
                        key={review.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#0a1122] border border-white/5 rounded-2xl p-6 shadow-xl hover:border-white/10 transition-colors"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1">{review.service}</h3>
                                <p className="text-sm text-zinc-400">
                                    Thợ: <span className="font-semibold text-zinc-300">{review.tech}</span> • {review.date}
                                </p>
                            </div>
                            <div className="flex gap-1 bg-[#050b18] px-3 py-1.5 rounded-lg border border-white/5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                        key={i}
                                        className={`w-4 h-4 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'}`}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="bg-[#050b18] rounded-xl p-4 text-zinc-300 text-sm leading-relaxed mb-4 border border-white/5 relative">
                            <MessageCircle className="absolute -top-3 -left-2 w-6 h-6 text-zinc-600 fill-[#050b18] stroke-zinc-700" />
                            <p className="relative z-10 italic">"{review.content}"</p>
                        </div>

                        {review.reply && (
                            <div className="ml-8 border-l-2 border-primary/30 pl-4 py-1">
                                <p className="text-xs font-bold text-primary mb-1 uppercase tracking-wider">Phản hồi từ thợ</p>
                                <p className="text-sm text-zinc-400">{review.reply}</p>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
