import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Plus, Wrench, Calendar, Clock, ClipboardList, X, ImageIcon, Loader2, Upload, RefreshCw } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import orderService from '@/services/orderService';
import ratingService from '@/services/ratingService';
import { useNotificationSignalR } from '@/hooks/useNotificationSignalR';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Star } from 'lucide-react';

export default function OrdersPage() {
    const { user } = useAuthStore();
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const statusParam = queryParams.get('status') || "all";

    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);
    
    // Listen to real-time notifications (from SignalR)
    const { notifications } = useNotificationSignalR();
    const fetchOrders = useCallback(async (silent = false) => {
        if (!user?.id) { setIsLoading(false); return; }
        if (!silent) setIsLoading(true); else setRefreshing(true);
        try {
            let res;
            if (statusParam === 'pending' || statusParam === 'accepted' || statusParam === 'in-progress' || statusParam === 'all') {
                res = await orderService.getCurrentOrders(user.id);
            } else if (statusParam === 'completed') {
                res = await orderService.getOrderHistory(user.id);
            } else if (statusParam === 'cancelled') {
                res = await orderService.getCanceledOrders(user.id);
            } else {
                res = await orderService.getCurrentOrders(user.id);
            }
            
            const raw = Array.isArray(res) ? res : (res.items || res.data || []);
            setOrders(raw);
        } catch {
            if (!silent) setOrders([]);
        } finally {
            if (!silent) setIsLoading(false); else setRefreshing(false);
        }
    }, [user, statusParam]);

    const handleCancel = async (orderId: string) => {
        if (!window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) return;
        try {
            await orderService.cancelOrder({ orderId });
            toast.success("Đã hủy đơn hàng thành công");
            fetchOrders(true);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Không thể hủy đơn hàng");
        }
    };

    const handleConfirmComplete = async (orderId: string) => {
        try {
            await orderService.confirmCompletedOrder({ orderId });
            toast.success("Cảm ơn bạn đã xác nhận hoàn thành!");
            fetchOrders(true);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Xác nhận thất bại");
        }
    };

    const handleChatWithTech = (techId: string) => {
        navigate(`/customer/contact?techId=${techId}`);
    };

    const handleOpenRating = (order: any) => {
        setSelectedOrder(order);
        setShowRatingModal(true);
    };

    // Initial load
    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    // Auto-refresh whenever a new notification arrives (technician changed order status)
    useEffect(() => {
        if (notifications.length > 0) {
            fetchOrders(true);
        }
    }, [notifications.length, fetchOrders]);

    const filteredOrders = orders.filter(o => {
        if (statusParam === 'all') return true;
        const s = (o.status || o.Status || '').toLowerCase().replace(' ', '-');
        
        if (statusParam === 'completed') return s === 'completed' || s === 'done';
        if (statusParam === 'cancelled') return s === 'cancelled' || s === 'canceled' || s === 'rejected';
        if (statusParam === 'pending') return s === 'pending' || s === 'pending-confirmation';
        return s === statusParam;
    });

    const getStatusTitle = (status: string) => {
        switch (status) {
            case 'pending': return 'Đang chờ xác nhận';
            case 'accepted': return 'Đã tiếp nhận';
            case 'in-progress': return 'Đang thực hiện';
            case 'completed': return 'Đã hoàn thành';
            case 'cancelled': return 'Đơn đã hủy';
            default: return 'Tất cả đơn hàng';
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Quản lý Đơn hàng</h1>
                    <p className="text-muted-foreground mt-2">Theo dõi trạng thái và tiến độ sửa chữa thiết bị của bạn.</p>
                </div>
            </div>

            <div className="bg-[#0a1122] border border-white/5 rounded-2xl p-4 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">{getStatusTitle(statusParam)}</h2>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-zinc-500">{filteredOrders.length} đơn hàng</span>
                        <button onClick={() => fetchOrders(true)} className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-zinc-300 transition-all" title="Làm mới">
                            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                        </button>
                        {refreshing && <span className="text-xs text-zinc-500">Cập nhật...</span>}
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : filteredOrders.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredOrders.map((order, idx) => (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                key={order.id || order.Id || idx}
                                className="border border-white/5 bg-[#050b18] rounded-xl p-5 hover:border-primary/30 transition-all group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white/5 text-zinc-300">
                                        #{(String(order.id || order.Id || '')).substring(0, 8)}
                                    </div>
                                    <StatusBadge status={order.status || order.Status || 'Pending'} />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 group-hover:text-primary-light transition-colors">
                                    <Wrench className="w-5 h-5 text-zinc-400 group-hover:text-primary-light" />
                                    {order.description || order.Description || 'Yêu cầu sửa chữa'}
                                </h3>
                                <div className="space-y-2 text-sm text-zinc-400">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(order.createdAt || order.CreatedAt || Date.now()).toLocaleDateString('vi-VN')}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        {new Date(order.createdAt || order.CreatedAt || Date.now()).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    {(order.technicianName || order.TechnicianName) && (
                                        <div className="flex items-center gap-2 text-primary-light font-medium">
                                            <Wrench className="w-4 h-4" />
                                            {order.technicianName || order.TechnicianName}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 flex flex-col gap-2">
                                    {/* Action Buttons based on Status */}
                                    {((order.status || order.Status || '').toLowerCase() === 'pending') && (
                                        <Button 
                                            variant="outline" 
                                            className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 h-9 text-xs"
                                            onClick={() => handleCancel(order.id || order.Id)}
                                        >
                                            <X className="w-3.5 h-3.5 mr-1.5" /> Hủy yêu cầu
                                        </Button>
                                    )}

                                    {((order.status || order.Status || '').toLowerCase() === 'in-progress' || (order.status || order.Status || '').toLowerCase() === 'inprogress') && (
                                        <Button 
                                            className="w-full bg-green-600 hover:bg-green-700 text-white h-9 text-xs"
                                            onClick={() => handleConfirmComplete(order.id || order.Id)}
                                        >
                                            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Xác nhận hoàn thành
                                        </Button>
                                    )}

                                    {((order.status || order.Status || '').toLowerCase() === 'completed' || (order.status || order.Status || '').toLowerCase() === 'done') && (
                                        <Button 
                                            className="w-full bg-primary hover:bg-primary-dark text-white h-9 text-xs"
                                            onClick={() => handleOpenRating(order)}
                                        >
                                            <Star className="w-3.5 h-3.5 mr-1.5 fill-current" /> Đánh giá dịch vụ
                                        </Button>
                                    )}

                                    {/* Chat Button if technician assigned */}
                                    {(order.technicianId || order.TechnicianId) && (order.status || order.Status || '').toLowerCase() !== 'cancelled' && (
                                        <Button 
                                            variant="ghost"
                                            className="w-full bg-white/5 hover:bg-white/10 text-white h-9 text-xs"
                                            onClick={() => handleChatWithTech(order.technicianId || order.TechnicianId)}
                                        >
                                            Chat với thợ
                                        </Button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <ClipboardList className="w-8 h-8 text-zinc-500" />
                        </div>
                        <p className="text-zinc-400 font-medium mb-4">Chưa có đơn hàng nào.</p>
                        <Button onClick={() => navigate('/customer/technicians')} variant="outline" className="text-primary-light border-primary/30 hover:bg-primary/10">
                            <Plus className="w-4 h-4 mr-2" /> Đặt dịch vụ ngay
                        </Button>
                    </div>
                )}
            </div>
            <AnimatePresence>
                {showCreateModal && (
                    <CreateOrderModal
                        userId={user?.id || ''}
                        onClose={() => setShowCreateModal(false)}
                        onCreated={(newOrder) => {
                            setOrders(prev => [newOrder, ...prev]);
                            setShowCreateModal(false);
                            fetchOrders(true);
                        }}
                    />
                )}
                {showRatingModal && selectedOrder && (
                    <RatingModal
                        order={selectedOrder}
                        onClose={() => {
                            setShowRatingModal(false);
                            setSelectedOrder(null);
                        }}
                        onSuccess={() => {
                            setShowRatingModal(false);
                            setSelectedOrder(null);
                            fetchOrders(true);
                        }}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function CreateOrderModal({ userId, onClose, onCreated }: { userId: string; onClose: () => void; onCreated: (order: any) => void }) {
    const [description, setDescription] = useState('');
    const [technicianId, setTechnicianId] = useState('');
    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        setImages(prev => [...prev, ...files]);
        setPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
    };

    const removeImage = (idx: number) => {
        setImages(prev => prev.filter((_, i) => i !== idx));
        setPreviews(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description.trim()) return toast.error('Vui lòng mô tả sự cố');
        if (!technicianId.trim()) return toast.error('Vui lòng nhập ID kỹ thuật viên');
        setIsSubmitting(true);
        try {
            // Import dynamically since technicianService is used globally without adding it to the top level imports here to avoid clutter
            const { default: technicianService } = await import('@/services/technicianService');
            const result = await technicianService.placeOrder({ 
                customerId: userId, 
                technicianId, 
                description, 
                imageFiles: images,
                title: 'Yêu cầu sửa chữa',
                address: 'Chưa rõ địa chỉ',
                cityId: '00000000-0000-0000-0000-000000000000',
                latitude: 0,
                longitude: 0
            });
            toast.success('Đặt dịch vụ thành công! 🎉');
            onCreated(result);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Đặt dịch vụ thất bại');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-lg bg-bg-card/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            >
                <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-primary/20 blur-3xl" />
                <button onClick={onClose} className="absolute top-4 right-4 z-10 w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-text-secondary hover:text-white transition-all">
                    <X size={16} />
                </button>

                <form onSubmit={handleSubmit} className="relative z-[1] p-8 space-y-5">
                    <div className="text-center mb-2">
                        <div className="inline-flex items-center gap-2 bg-primary/15 border border-primary/30 rounded-full px-4 py-1.5 mb-3 text-xs text-primary-light">
                            <Wrench size={12} /> Đặt Dịch Vụ Sửa Chữa
                        </div>
                        <h2 className="text-2xl font-bold text-white">Mô tả sự cố</h2>
                        <p className="text-sm text-text-secondary mt-1">Chúng tôi sẽ kết nối bạn với thợ phù hợp nhất</p>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1.5">ID Kỹ Thuật Viên <span className="text-red-400">*</span></label>
                        <input
                            type="text"
                            value={technicianId}
                            onChange={e => setTechnicianId(e.target.value)}
                            placeholder="Nhập ID của thợ (từ danh sách kỹ thuật viên)"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/50 transition-all placeholder:text-text-secondary/50"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1.5">Mô tả sự cố <span className="text-red-400">*</span></label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={3}
                            placeholder="Vd: Điều hòa không mát, bật lên nghe tiếng kêu lạ..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/50 transition-all placeholder:text-text-secondary/50 resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                            Ảnh mô tả sự cố <span className="text-text-secondary/50">(tuỳ chọn)</span>
                        </label>
                        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border border-dashed border-white/20 rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                        >
                            <Upload size={24} className="mx-auto text-text-secondary mb-1" />
                            <p className="text-xs text-text-secondary">Click để chọn ảnh</p>
                        </div>
                        {previews.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                {previews.map((src, idx) => (
                                    <div key={idx} className="relative group">
                                        <img src={src} alt="preview" className="w-16 h-16 rounded-lg object-cover border border-white/10" />
                                        <button type="button" onClick={() => removeImage(idx)} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <X size={10} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white font-bold text-sm shadow-lg shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <><ImageIcon size={16} /> Gửi yêu cầu sửa chữa</>}
                    </button>
                </form>
            </motion.div>
        </motion.div>
    );
}

function RatingModal({ order, onClose, onSuccess }: { order: any; onClose: () => void; onSuccess: () => void }) {
    const { user } = useAuthStore();
    const [score, setScore] = useState(5);
    const [feedback, setFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id) return;
        setIsSubmitting(true);
        try {
            await ratingService.createRating({
                customerId: user.id,
                technicianId: order.technicianId || order.TechnicianId,
                orderId: order.id || order.Id,
                score,
                feedback
            });
            toast.success("Cảm ơn bạn đã đánh giá dịch vụ! ❤️");
            onSuccess();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Không thể gửi đánh giá");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-md bg-bg-card/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-8"
            >
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Đánh giá dịch vụ</h2>
                    <p className="text-sm text-text-secondary mt-1">Trải nghiệm của bạn với thợ <b>{order.technicianName || order.TechnicianName}</b> như thế nào?</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => setScore(s)}
                                className="transition-transform hover:scale-110 active:scale-95"
                            >
                                <Star
                                    size={36}
                                    className={`${s <= score ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-600'} transition-colors`}
                                />
                            </button>
                        ))}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1.5Caps">Ý kiến của bạn</label>
                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            rows={4}
                            placeholder="Chia sẻ thêm về chất lượng sửa chữa, thái độ của thợ..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/50 transition-all placeholder:text-text-secondary/50 resize-none text-white"
                        />
                    </div>

                    <div className="flex gap-3">
                        <Button type="button" variant="ghost" onClick={onClose} className="flex-1 text-zinc-400 hover:text-white">Bỏ qua</Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-[2] bg-primary hover:bg-primary-dark text-white font-bold"
                        >
                            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : "Gửi đánh giá"}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const s = status.toLowerCase().replace(' ', '-');
    let color = "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    let label = "Chờ xác nhận";

    if (s === 'accepted') { color = "bg-blue-500/10 text-blue-400 border-blue-500/20"; label = "Đã tiếp nhận"; }
    else if (s === 'in-progress' || s === 'inprogress') { color = "bg-amber-500/10 text-amber-400 border-amber-500/20"; label = "Đang thực hiện"; }
    else if (s === 'completed' || s === 'done') { color = "bg-green-500/10 text-green-400 border-green-500/20"; label = "Hoàn thành"; }
    else if (s === 'cancelled' || s === 'canceled') { color = "bg-red-500/10 text-red-400 border-red-500/20"; label = "Đã hủy"; }

    return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${color}`}>{label}</span>;
}
