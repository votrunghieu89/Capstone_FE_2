import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageCircle, Info, Loader2, ClipboardList } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import ratingService from '@/services/ratingService';

export default function ReviewsPage() {
    const { user } = useAuthStore();
    const [reviews, setReviews] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [averageRating, setAverageRating] = useState(0);

    useEffect(() => {
        const fetchReviews = async () => {
            if (!user?.id) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const res = await ratingService.viewRatings(user.id);
                const data = Array.isArray(res) ? res : (res.items || res.data || []);
                setReviews(data);
                
                if (data.length > 0) {
                    const total = data.reduce((sum: number, r: any) => sum + (r.score || r.rating || 0), 0);
                    setAverageRating(Number((total / data.length).toFixed(1)));
                } else {
                    setAverageRating(0);
                }
            } catch (error) {
                console.error("Failed to fetch reviews:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReviews();
    }, [user]);

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
                {reviews.length > 0 && (
                    <div className="bg-primary/10 border border-primary/20 text-primary-light px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-semibold">
                        <Info size={16} /> Đánh giá trung bình: {averageRating > 0 ? averageRating.toFixed(1) : "5.0"}
                    </div>
                )}
            </div>

            {isLoading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : reviews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {reviews.map((review, idx) => (
                        <motion.div
                            key={review.id || idx}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-[#0a1122] border border-white/5 rounded-2xl p-6 shadow-xl hover:border-white/10 transition-colors"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-1">
                                        Đơn hàng #{String(review.orderId || '').substring(0, 8) || 'Dịch vụ'}
                                    </h3>
                                    <p className="text-sm text-zinc-400">
                                        Thợ: <span className="font-semibold text-zinc-300">{review.technicianName || review.tech || 'Thợ FastFix'}</span> • {review.createdAt ? new Date(review.createdAt).toLocaleDateString('vi-VN') : (review.date || 'Gần đây')}
                                    </p>
                                </div>
                                <div className="flex gap-1 bg-[#050b18] px-3 py-1.5 rounded-lg border border-white/5">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`w-4 h-4 ${i < (review.score || review.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="bg-[#050b18] rounded-xl p-4 text-zinc-300 text-sm leading-relaxed mb-4 border border-white/5 relative">
                                <MessageCircle className="absolute -top-3 -left-2 w-6 h-6 text-zinc-600 fill-[#050b18] stroke-zinc-700" />
                                <p className="relative z-10 italic">"{review.reviewText || review.content || 'Không có bình luận'}"</p>
                            </div>

                            {review.images && review.images.length > 0 && (
                                <div className="flex gap-2 mt-3 mb-4 overflow-x-auto pb-2">
                                    {review.images.map((img: string, i: number) => (
                                        <img key={i} src={img} alt="review" className="w-16 h-16 object-cover rounded-lg border border-white/10 flex-shrink-0" />
                                    ))}
                                </div>
                            )}

                            {review.reply && (
                                <div className="ml-8 border-l-2 border-primary/30 pl-4 py-1">
                                    <p className="text-xs font-bold text-primary mb-1 uppercase tracking-wider">Phản hồi từ thợ</p>
                                    <p className="text-sm text-zinc-400">{review.reply}</p>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 flex flex-col items-center bg-[#0a1122] border border-white/5 rounded-2xl">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                        <ClipboardList className="w-8 h-8 text-zinc-500" />
                    </div>
                    <p className="text-zinc-400 font-medium mb-2">Bạn chưa có đánh giá nào.</p>
                    <p className="text-zinc-500 text-sm">Các đánh giá của bạn về dịch vụ sẽ hiển thị tại đây.</p>
                </div>
            )}
        </motion.div>
    );
}
