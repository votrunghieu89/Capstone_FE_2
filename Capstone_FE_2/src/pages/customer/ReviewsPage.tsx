import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageCircle, Info, Loader2, ClipboardList, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/authStore';
import ratingService from '@/services/ratingService';
import orderService from '@/services/orderService';
import { Button } from '@/components/ui/button';

export default function ReviewsPage() {
    const { user } = useAuthStore();
    const [reviews, setReviews] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [averageRating, setAverageRating] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 6;

    const [editingReviewId, setEditingReviewId] = useState<string>('');
    const [editScore, setEditScore] = useState(5);
    const [editFeedback, setEditFeedback] = useState('');
    const [techNameMap, setTechNameMap] = useState<Record<string, string>>({});

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

            const reviewDataBase = reviewDataRemote.map((r: any) => ({
                ...r,
                orderId: String(r.orderId || r.OrderId || r.id || r.Id || ''),
                feedbackId: String(r.feedbackId || r.FeedbackId || r.id || r.Id || ''),
                score: Number(r.score || r.Score || r.rating || r.Rating || 0),
                feedback: String(r.feedback || r.Feedback || r.reviewText || r.content || ''),
                createdAt: r.createdAt || r.CreateAt || r.updatedAt || r.UpdateAt || r.reviewedAt || r.ReviewedAt || r.feedbackCreatedAt || r.FeedbackCreatedAt || null,
                technicianId: String(r.technicianId || r.TechnicianId || ''),
                technicianName: r.technicianName || r.TechnicianName || r.tech || '',
                technicianLabel: r.technicianName || r.TechnicianName || r.tech || ''
            }));

            const reviewData = await Promise.all(reviewDataBase.map(async (r: any) => {
                const orderId = String(r.orderId || '');
                if (!orderId) return r;

                try {
                    const detail = await orderService.getOrderDetail(orderId);
                    const payload = detail?.data || detail || {};
                    return {
                        ...r,
                        createdAt: r.createdAt || payload.createdAt || payload.CreateAt || payload.updatedAt || payload.UpdateAt || payload.orderDate || payload.OrderDate || null,
                        technicianId: r.technicianId || String(payload.technicianId || payload.TechnicianId || ''),
                        technicianName: r.technicianName || payload.technicianName || payload.TechnicianName || payload.tech || '',
                        technicianLabel: r.technicianLabel || payload.technicianName || payload.TechnicianName || payload.tech || ''
                    };
                } catch {
                    return r;
                }
            }));

            const sortedReviews = [...reviewData].sort((a: any, b: any) => {
                const ta = new Date(a.createdAt || a.orderDate || a.OrderDate || 0).getTime();
                const tb = new Date(b.createdAt || b.orderDate || b.OrderDate || 0).getTime();
                return tb - ta;
            });

            setReviews(sortedReviews);

            const nameEntries = await Promise.all(sortedReviews.map(async (r: any) => {
                const oid = String(r.orderId || r.OrderId || '');
                const name = await fetchTechnicianName(r);
                return [oid, name] as const;
            }));
            setTechNameMap(Object.fromEntries(nameEntries.filter(([oid]) => !!oid)));

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

    const totalPages = Math.max(1, Math.ceil(reviews.length / pageSize));
    const pagedReviews = reviews.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    useEffect(() => {
        setCurrentPage(1);
        reloadData();
    }, [user?.id]);

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [currentPage, totalPages]);

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

    const fetchTechnicianName = async (review: any) => {
        const currentName = review.technicianName || review.TechnicianName || review.tech || review.technicianLabel || '';
        if (currentName) return currentName;

        const techId = String(review.technicianId || review.TechnicianId || '');
        if (!techId) return 'Thợ FastFix';

        try {
            const detail = await orderService.getOrderDetail(String(review.orderId || review.OrderId || ''));
            const payload = detail?.data || detail || {};
            return payload.technicianName || payload.TechnicianName || payload.tech || payload.Technician || 'Thợ FastFix';
        } catch {
            return 'Thợ FastFix';
        }
    };

    const formatExactTime = (value: any) => {
        if (!value) return '—';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '—';
        return d.toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
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
                <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-6 items-start">
                    <aside className="space-y-4 xl:sticky xl:top-6">
                        <div className="bg-[#0a1122] border border-white/5 rounded-2xl p-5 shadow-xl">
                            <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500 mb-3">Tổng quan</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-xl bg-white/5 border border-white/5 p-4">
                                    <p className="text-zinc-500 text-xs">Số đánh giá</p>
                                    <p className="mt-1 text-2xl font-bold text-white">{reviews.length}</p>
                                </div>
                                <div className="rounded-xl bg-white/5 border border-white/5 p-4">
                                    <p className="text-zinc-500 text-xs">Điểm TB</p>
                                    <p className="mt-1 text-2xl font-bold text-amber-400">{averageRating > 0 ? averageRating.toFixed(1) : '5.0'}</p>
                                </div>
                            </div>
                        </div>

                        {reviews.length > 0 && (
                            <div className="bg-[#0a1122] border border-white/5 rounded-2xl p-5 shadow-xl">
                                <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500 mb-3">Phân trang</p>
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm text-zinc-400">
                                        Trang <span className="text-white font-semibold">{currentPage}</span> / {totalPages}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" className="border-white/10" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                                            Trước
                                        </Button>
                                        <Button variant="outline" className="border-white/10" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                                            Sau
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </aside>

                    <section className="space-y-4 min-w-0">
                        {reviews.length > 0 ? (
                            pagedReviews.map((review, idx) => (
                                <motion.div
                                    key={review.id || idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-[#0a1122] border border-white/5 rounded-2xl p-5 sm:p-6 shadow-xl hover:border-white/10 transition-colors"
                                >
                                    <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4 items-start">
                                        <div className="min-w-0 space-y-3">
                                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                                <div className="min-w-0">
                                                    <h3 className="text-lg font-bold text-white mb-1 truncate">
                                                        Đơn hàng #{String(review.orderId || '').substring(0, 8) || 'Dịch vụ'}
                                                    </h3>
                                                    <p className="text-sm text-zinc-400 leading-relaxed">
                                                        Thợ: <span className="font-semibold text-zinc-300">{techNameMap[review.orderId] || review.technicianLabel || review.technicianName || review.tech || 'Thợ FastFix'}</span>
                                                    </p>
                                                    <p className="text-sm text-zinc-400 leading-relaxed mt-1">
                                                        Đánh giá lúc: <span className="text-zinc-200">{formatExactTime(review.createdAt || review.updatedAt || review.CreateAt || review.UpdateAt || review.reviewedAt || review.ReviewedAt || review.feedbackCreatedAt || review.FeedbackCreatedAt)}</span>
                                                    </p>
                                                </div>
                                                <div className="self-start px-3 py-1.5 rounded-lg border text-xs font-semibold bg-green-500/10 border-green-500/30 text-green-400 whitespace-nowrap">
                                                    Đã đánh giá
                                                </div>
                                            </div>

                                            <div className="rounded-xl bg-[#050b18] p-4 border border-white/5 text-zinc-300 text-sm leading-relaxed relative">
                                                <MessageCircle className="absolute -top-3 -left-2 w-6 h-6 text-zinc-600 fill-[#050b18] stroke-zinc-700" />
                                                {editingReviewId === String(review.id || review.Id || review.feedbackId || review.FeedbackId || '') ? (
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-2 flex-wrap">
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
                                                        <div className="flex flex-col sm:flex-row justify-end gap-2">
                                                            <Button variant="ghost" onClick={() => setEditingReviewId('')} className="w-full sm:w-auto">Hủy</Button>
                                                            <Button className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white" onClick={() => handleSaveEdit(review)}>
                                                                Lưu chỉnh sửa
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="relative z-10 italic">"{review.feedback || review.reviewText || review.content || 'Không có bình luận'}"</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-3 lg:pt-1">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                                                <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5">
                                                    <p className="text-[11px] uppercase tracking-wide text-zinc-500">Đánh giá</p>
                                                    <div className="mt-1 flex items-center gap-1 text-amber-400">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <Star key={star} className={`w-4 h-4 ${star <= Number(review.score || review.Score || 0) ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'}`} />
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5">
                                                    <p className="text-[11px] uppercase tracking-wide text-zinc-500">Mã đơn</p>
                                                    <p className="text-zinc-200 mt-1 font-medium truncate font-mono">{String(review.orderId || '') || '—'}</p>
                                                </div>
                                            </div>

                                            <div className="flex justify-end gap-2 pt-1">
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
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-center py-16 flex flex-col items-center bg-[#0a1122] border border-white/5 rounded-2xl">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                    <ClipboardList className="w-8 h-8 text-zinc-500" />
                                </div>
                                <p className="text-zinc-400 font-medium mb-2">Bạn chưa có đánh giá nào.</p>
                                <p className="text-zinc-500 text-sm">Các đánh giá của bạn về dịch vụ sẽ hiển thị tại đây.</p>
                            </div>
                        )}
                    </section>
                </div>
            )}
        </motion.div>
    );
}
