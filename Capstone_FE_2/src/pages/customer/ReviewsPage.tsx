import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageCircle, Info, Loader2, ClipboardList } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/authStore';
import ratingService from '@/services/ratingService';
import orderService from '@/services/orderService';
import { Button } from '@/components/ui/button';

export default function ReviewsPage() {
    const { user } = useAuthStore();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const focusOrderId = queryParams.get('orderId') || '';

    const [reviews, setReviews] = useState<any[]>([]);
    const [pendingReviewOrders, setPendingReviewOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [averageRating, setAverageRating] = useState(0);

    const [activeOrder, setActiveOrder] = useState<any>(null);
    const [score, setScore] = useState(5);
    const [feedback, setFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const reloadData = async () => {
        if (!user?.id) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const [reviewRes, historyRes] = await Promise.all([
                ratingService.getCustomerRatings(user.id),
                orderService.getOrderHistory(user.id)
            ]);

            const reviewData = Array.isArray(reviewRes) ? reviewRes : (reviewRes.items || reviewRes.data || []);
            const historyOrders = Array.isArray(historyRes) ? historyRes : (historyRes.items || historyRes.data || []);

            const sortedReviews = [...reviewData].sort((a: any, b: any) => {
                const ta = new Date(a.createdAt || a.CreateAt || a.updatedAt || a.UpdateAt || 0).getTime();
                const tb = new Date(b.createdAt || b.CreateAt || b.updatedAt || b.UpdateAt || 0).getTime();
                return tb - ta;
            });

            setReviews(sortedReviews);

            const reviewedOrderIds = new Set(
                reviewData
                    .map((r: any) => String(r.orderId || r.OrderId || ''))
                    .filter((id: string) => !!id)
            );

            const toReview = historyOrders.filter((o: any) => {
                const oid = String(o.orderId || o.OrderId || o.id || o.Id || '');
                return oid && !reviewedOrderIds.has(oid);
            });

            const sortedToReview = toReview.sort((a: any, b: any) => {
                const ta = new Date(a.orderDate || a.OrderDate || 0).getTime();
                const tb = new Date(b.orderDate || b.OrderDate || 0).getTime();
                return tb - ta;
            });

            setPendingReviewOrders(sortedToReview);

            if (reviewData.length > 0) {
                const total = reviewData.reduce((sum: number, r: any) => sum + (r.score || r.rating || 0), 0);
                setAverageRating(Number((total / reviewData.length).toFixed(1)));
            } else {
                setAverageRating(0);
            }

            if (sortedToReview.length > 0) {
                const focus = sortedToReview.find((o: any) => String(o.orderId || o.OrderId || o.id || o.Id || '') === focusOrderId);
                if (focus) {
                    setActiveOrder(focus);
                } else if (!activeOrder) {
                    setActiveOrder(sortedToReview[0]);
                }
            } else {
                setActiveOrder(null);
            }
        } catch (error) {
            console.error('Failed to fetch reviews:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        reloadData();
    }, [user?.id]);

    const submitRating = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id || !activeOrder) return;

        const orderId = String(activeOrder.orderId || activeOrder.OrderId || activeOrder.id || activeOrder.Id || '');
        const technicianId = String(activeOrder.technicianId || activeOrder.TechnicianId || '');

        if (!orderId || !technicianId) {
            toast.error('Thiếu dữ liệu đơn hàng để đánh giá');
            return;
        }

        setIsSubmitting(true);
        try {
            await ratingService.createRating({
                customerId: user.id,
                technicianId,
                orderId,
                score,
                feedback
            });

            toast.success('Gửi đánh giá thành công');
            setScore(5);
            setFeedback('');
            setActiveOrder(null);
            await reloadData();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Không thể gửi đánh giá');
        } finally {
            setIsSubmitting(false);
        }
    };

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
                        Xác nhận hoàn thành xong, bạn có thể đánh giá ngay tại trang này.
                    </p>
                    {focusOrderId && (
                        <p className="text-xs text-amber-300 mt-2">
                            Đơn vừa hoàn thành: #{focusOrderId.slice(0, 8)} — hãy thêm đánh giá cho đơn này.
                        </p>
                    )}
                </div>
                {reviews.length > 0 && (
                    <div className="bg-primary/10 border border-primary/20 text-primary-light px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-semibold">
                        <Info size={16} /> Đánh giá trung bình: {averageRating > 0 ? averageRating.toFixed(1) : '5.0'}
                    </div>
                )}
            </div>

            {isLoading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="space-y-6">
                    {pendingReviewOrders.length > 0 && (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 space-y-4">
                            <h3 className="text-amber-300 font-bold">Đơn hàng chờ bạn đánh giá</h3>

                            <div className="space-y-3">
                                {pendingReviewOrders.map((o: any, idx: number) => {
                                    const oid = String(o.orderId || o.OrderId || o.id || o.Id || '');
                                    const isActive = String(activeOrder?.orderId || activeOrder?.OrderId || activeOrder?.id || activeOrder?.Id || '') === oid;
                                    const isFocus = !!focusOrderId && oid === focusOrderId;
                                    return (
                                        <div key={oid || idx} className={`rounded-xl border p-4 ${isActive ? 'border-primary bg-primary/10' : isFocus ? 'border-amber-300 bg-amber-400/10' : 'border-white/10 bg-white/5'}`}>
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                <div>
                                                    <p className="text-white font-semibold">#{oid.slice(0, 8)} · {o.title || o.Title || 'Đơn dịch vụ'}</p>
                                                    <p className="text-sm text-zinc-400">Thợ: {o.technicianName || o.TechnicianName || 'Kỹ thuật viên'} · {o.serviceName || o.ServiceName || 'Dịch vụ'}</p>
                                                </div>
                                            </div>

                                            {isActive && (
                                                <form onSubmit={submitRating} className="mt-4 border-t border-white/10 pt-4 space-y-4">
                                                    <div className="flex items-center gap-2">
                                                        {[1, 2, 3, 4, 5].map((s) => (
                                                            <button key={s} type="button" onClick={() => setScore(s)} className="p-1">
                                                                <Star className={`w-7 h-7 ${s <= score ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'}`} />
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <textarea
                                                        value={feedback}
                                                        onChange={(e) => setFeedback(e.target.value)}
                                                        rows={4}
                                                        placeholder="Chia sẻ trải nghiệm của bạn với đơn hàng này..."
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white"
                                                    />
                                                    <div className="flex justify-end gap-2">
                                                        <Button type="button" variant="ghost" onClick={() => setActiveOrder(null)}>
                                                            Hủy
                                                        </Button>
                                                        <Button type="submit" className="bg-primary hover:bg-primary-dark text-white" disabled={isSubmitting}>
                                                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gửi đánh giá'}
                                                        </Button>
                                                    </div>
                                                </form>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {reviews.length > 0 ? (
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
                                        <div className="px-3 py-1.5 rounded-lg border text-xs font-semibold bg-green-500/10 border-green-500/30 text-green-400">
                                            Đã đánh giá
                                        </div>
                                    </div>

                                    <div className="bg-[#050b18] rounded-xl p-4 text-zinc-300 text-sm leading-relaxed mb-4 border border-white/5 relative">
                                        <MessageCircle className="absolute -top-3 -left-2 w-6 h-6 text-zinc-600 fill-[#050b18] stroke-zinc-700" />
                                        <p className="relative z-10 italic">"{review.feedback || review.reviewText || review.content || 'Không có bình luận'}"</p>
                                    </div>
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
                </div>
            )}
        </motion.div>
    );
}
