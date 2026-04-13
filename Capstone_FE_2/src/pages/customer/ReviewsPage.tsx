import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageCircle, Info, Loader2, ClipboardList, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/authStore';
import ratingService from '@/services/ratingService';
import { Button } from '@/components/ui/button';

export default function ReviewsPage() {
    const { user } = useAuthStore();
    const [reviews, setReviews] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [averageRating, setAverageRating] = useState(0);

    const [editingReviewId, setEditingReviewId] = useState<string>('');
    const [editScore, setEditScore] = useState(5);
    const [editFeedback, setEditFeedback] = useState('');

    const reloadData = async () => {
        if (!user?.id) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const reviewRes = await ratingService.getCustomerRatings(user.id);
            const unpack = (payload: any): any[] => {
                if (Array.isArray(payload)) return payload;
                if (Array.isArray(payload?.data)) return payload.data;
                if (Array.isArray(payload?.items)) return payload.items;
                if (Array.isArray(payload?.result)) return payload.result;
                if (Array.isArray(payload?.result?.data)) return payload.result.data;
                return [];
            };

            let reviewDataRemote = unpack(reviewRes);
            if (reviewDataRemote.length === 0) {
                // fallback endpoint alias
                const altRes = await ratingService.viewRatings(user.id);
                reviewDataRemote = unpack(altRes);
            }

            const reviewData = reviewDataRemote.map((r: any) => ({
                ...r,
                orderId: String(r.orderId || r.OrderId || r.id || r.Id || ''),
                feedbackId: String(r.feedbackId || r.FeedbackId || r.id || r.Id || ''),
                score: Number(r.score || r.Score || r.rating || r.Rating || 0),
                feedback: String(r.feedback || r.Feedback || r.reviewText || r.content || ''),
                createdAt: r.createdAt || r.CreateAt || r.updatedAt || r.UpdateAt || null,
                technicianId: String(r.technicianId || r.TechnicianId || ''),
                technicianName: r.technicianName || r.TechnicianName || r.tech || 'Thợ FastFix'
            }));

            const sortedReviews = [...reviewData].sort((a: any, b: any) => {
                const ta = new Date(a.createdAt || 0).getTime();
                const tb = new Date(b.createdAt || 0).getTime();
                return tb - ta;
            });

            setReviews(sortedReviews);

            if (reviewData.length > 0) {
                const total = reviewData.reduce((sum: number, r: any) => sum + (Number(r.score) || 0), 0);
                setAverageRating(Number((total / reviewData.length).toFixed(1)));
            } else {
                setAverageRating(0);
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

    const handleStartEdit = (review: any) => {
        const rid = String(review.id || review.Id || review.feedbackId || review.FeedbackId || '');
        if (!rid) return;
        setEditingReviewId(rid);
        setEditScore(Number(review.score || review.Score || 5));
        setEditFeedback(String(review.feedback || review.Feedback || ''));
    };

    const handleSaveEdit = async (review: any) => {
        const rid = String(review.id || review.Id || review.feedbackId || review.FeedbackId || '');
        if (!rid) return;

        try {
            await ratingService.updateRating({
                feedbackId: rid,
                score: editScore,
                feedback: editFeedback
            });
            toast.success('Cập nhật đánh giá thành công');
            setEditingReviewId('');
            await reloadData();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Không thể cập nhật đánh giá');
        }
    };

    const handleDeleteReview = async (review: any) => {
        const rid = String(review.id || review.Id || review.feedbackId || review.FeedbackId || '');
        if (!rid) return;
        if (!window.confirm('Bạn có chắc muốn xóa đánh giá này?')) return;

        try {
            await ratingService.deleteRating(rid);
            toast.success('Đã xóa đánh giá');
            await reloadData();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Không thể xóa đánh giá');
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
                        Danh sách đánh giá bạn đã gửi.
                    </p>
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

                                    {editingReviewId === String(review.id || review.Id || review.feedbackId || review.FeedbackId || '') ? (
                                        <div className="bg-[#050b18] rounded-xl p-4 border border-white/10 space-y-3 mb-4">
                                            <div className="flex items-center gap-2">
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                    <button key={s} type="button" onClick={() => setEditScore(s)} className="p-1">
                                                        <Star className={`w-5 h-5 ${s <= editScore ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'}`} />
                                                    </button>
                                                ))}
                                            </div>
                                            <textarea
                                                value={editFeedback}
                                                onChange={(e) => setEditFeedback(e.target.value)}
                                                rows={3}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                                            />
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" onClick={() => setEditingReviewId('')}>Hủy</Button>
                                                <Button className="bg-primary hover:bg-primary-dark text-white" onClick={() => handleSaveEdit(review)}>
                                                    Lưu chỉnh sửa
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-[#050b18] rounded-xl p-4 text-zinc-300 text-sm leading-relaxed mb-4 border border-white/5 relative">
                                            <MessageCircle className="absolute -top-3 -left-2 w-6 h-6 text-zinc-600 fill-[#050b18] stroke-zinc-700" />
                                            <p className="relative z-10 italic">"{review.feedback || review.reviewText || review.content || 'Không có bình luận'}"</p>
                                        </div>
                                    )}

                                    <div className="flex gap-2 justify-end">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-9 px-3 rounded-lg border border-sky-500/35 bg-sky-500/10 text-sky-200 hover:bg-sky-500/20"
                                            onClick={() => handleStartEdit(review)}
                                        >
                                            <Pencil className="w-4 h-4 mr-1.5" /> Sửa
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-9 px-3 rounded-lg border border-rose-500/35 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20"
                                            onClick={() => handleDeleteReview(review)}
                                        >
                                            <Trash2 className="w-4 h-4 mr-1.5" /> Xóa
                                        </Button>
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
