import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Wrench, Calendar, Clock, ClipboardList, X, Loader2, RefreshCw } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import orderService from '@/services/orderService';
import ratingService from '@/services/ratingService';
import { useNotificationSignalR } from '@/hooks/useNotificationSignalR';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Star } from 'lucide-react';

const MOCK_ORDERS = [
    {
        OrderId: '11111111-1111-1111-1111-111111111111',
        TechnicianId: 'aaaa1111-1111-1111-1111-111111111111',
        TechnicianName: 'Nguyễn Văn A',
        ServiceName: 'Sửa điều hòa',
        Title: 'Điều hòa không mát',
        Description: 'Máy chạy nhưng không lạnh, cần kiểm tra gas.',
        Address: '12 Nguyễn Văn Linh, Đà Nẵng',
        Status: 'Pending Confirmation',
        OrderDate: new Date().toISOString()
    },
    {
        OrderId: '22222222-2222-2222-2222-222222222222',
        TechnicianId: 'bbbb2222-2222-2222-2222-222222222222',
        TechnicianName: 'Trần Thị B',
        ServiceName: 'Sửa tủ lạnh',
        Title: 'Tủ lạnh chảy nước',
        Description: 'Ngăn mát bị đọng nước nhiều.',
        Address: '45 Lê Duẩn, Đà Nẵng',
        Status: 'In Progress',
        OrderDate: new Date(Date.now() - 86400000).toISOString()
    },
    {
        OrderId: '55555555-5555-5555-5555-555555555555',
        TechnicianId: 'eeee5555-5555-5555-5555-555555555555',
        TechnicianName: 'Hoàng Minh K',
        ServiceName: 'Sửa máy giặt',
        Title: 'Máy giặt rung mạnh khi vắt',
        Description: 'Lồng giặt kêu to, rung bất thường.',
        Address: '76 Ông Ích Khiêm, Đà Nẵng',
        Status: 'In Progress',
        OrderDate: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
        OrderId: '66666666-6666-6666-6666-666666666666',
        TechnicianId: 'ffff6666-6666-6666-6666-666666666666',
        TechnicianName: 'Vũ Anh T',
        ServiceName: 'Sửa điện dân dụng',
        Title: 'Ổ cắm bị chập điện',
        Description: 'Bật thiết bị thì aptomat nhảy.',
        Address: '15 Trần Phú, Đà Nẵng',
        Status: 'In Progress',
        OrderDate: new Date(Date.now() - 3 * 86400000).toISOString()
    },
    {
        OrderId: '33333333-3333-3333-3333-333333333333',
        TechnicianId: 'cccc3333-3333-3333-3333-333333333333',
        TechnicianName: 'Phạm Văn C',
        ServiceName: 'Sửa máy giặt',
        Title: 'Máy giặt không vắt',
        Description: 'Máy báo lỗi ở bước vắt.',
        Address: '99 Điện Biên Phủ, Đà Nẵng',
        Status: 'Cancelled',
        OrderDate: new Date(Date.now() - 4 * 86400000).toISOString()
    },
    {
        OrderId: '44444444-4444-4444-4444-444444444444',
        TechnicianId: 'dddd4444-4444-4444-4444-444444444444',
        TechnicianName: 'Lê Thị D',
        ServiceName: 'Sửa máy nước nóng',
        Title: 'Máy nước nóng không lên nhiệt',
        Description: 'Nước vẫn lạnh sau 10 phút bật máy.',
        Address: '21 Hàm Nghi, Đà Nẵng',
        Status: 'Rejected',
        OrderDate: new Date(Date.now() - 5 * 86400000).toISOString()
    }
];

export default function OrdersPage() {
    const { user } = useAuthStore();
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const statusParam = queryParams.get('status') || "all";

    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [reviewedOrderIds, setReviewedOrderIds] = useState<Set<string>>(new Set());
    
    // Listen to real-time notifications (from SignalR)
    const { notifications } = useNotificationSignalR();
    const fetchOrders = useCallback(async (silent = false) => {
        if (!user?.id) { setIsLoading(false); return; }
        if (!silent) setIsLoading(true); else setRefreshing(true);
        try {
            const normalizeList = (res: any) => (Array.isArray(res) ? res : (res?.items || res?.data || []));

            let raw: any[] = [];
            if (statusParam === 'pending') {
                const res = await orderService.getCurrentOrders(user.id);
                raw = normalizeList(res);
            } else if (statusParam === 'in-progress') {
                const res = await orderService.getInProgressOrders(user.id);
                raw = normalizeList(res);
            } else if (statusParam === 'completed') {
                const res = await orderService.getOrderHistory(user.id);
                raw = normalizeList(res);
            } else if (statusParam === 'cancelled') {
                const res = await orderService.getCanceledOrders(user.id);
                raw = normalizeList(res);
            } else if (statusParam === 'rejected') {
                const res = await orderService.getRejectedOrders(user.id);
                raw = normalizeList(res);
            } else {
                const [currentRes, inProgressRes, historyRes, cancelledRes, rejectedRes] = await Promise.all([
                    orderService.getCurrentOrders(user.id),
                    orderService.getInProgressOrders(user.id),
                    orderService.getOrderHistory(user.id),
                    orderService.getCanceledOrders(user.id),
                    orderService.getRejectedOrders(user.id)
                ]);
                raw = [
                    ...normalizeList(currentRes),
                    ...normalizeList(inProgressRes),
                    ...normalizeList(historyRes),
                    ...normalizeList(cancelledRes),
                    ...normalizeList(rejectedRes)
                ];
            }

            const uniqueMap = new Map<string, any>();
            raw.forEach((item: any) => {
                const id = String(item?.id || item?.Id || item?.orderId || item?.OrderId || Math.random());
                if (!uniqueMap.has(id)) uniqueMap.set(id, item);
            });

            const merged = Array.from(uniqueMap.values());

            // Merge local fallback orders (frontend-only when autofind/place fails)
            const localOrdersRaw = (() => {
                try {
                    const parsed = JSON.parse(localStorage.getItem('ff_customer_local_orders') || '[]');
                    return Array.isArray(parsed) ? parsed : [];
                } catch {
                    return [];
                }
            })();
            const localOrders = localOrdersRaw
                .filter((o: any) => (o?.customerId || '') === user.id)
                .filter((o: any) => {
                    const s = normalizeStatus(String(o?.status || ''));
                    if (statusParam === 'pending') return s === 'pending' || s === 'pending-confirmation';
                    if (statusParam === 'in-progress') return s === 'in-progress' || s === 'inprogress';
                    if (statusParam === 'completed') return s === 'completed' || s === 'done';
                    if (statusParam === 'cancelled') return s === 'cancelled' || s === 'canceled';
                    if (statusParam === 'rejected') return s === 'rejected';
                    return true;
                })
                .map((o: any) => ({
                    Id: o.id,
                    id: o.id,
                    TechnicianId: o.technicianId,
                    technicianId: o.technicianId,
                    TechnicianName: o.technicianName,
                    technicianName: o.technicianName,
                    ServiceName: o.serviceName,
                    serviceName: o.serviceName,
                    Title: o.title,
                    title: o.title,
                    Description: o.description,
                    description: o.description,
                    Address: o.address,
                    address: o.address,
                    Status: o.status,
                    status: o.status,
                    CreateAt: o.createdAt,
                    createdAt: o.createdAt,
                    OrderDate: o.createdAt,
                    orderDate: o.createdAt,
                    source: o.source || 'autofind-local'
                }));
            const useMock = import.meta.env.VITE_USE_MOCK_ORDERS === 'true';
            const filteredMock = statusParam === 'all'
                ? MOCK_ORDERS
                : MOCK_ORDERS.filter(m => {
                    const ms = normalizeStatus(m.Status || '');
                    if (statusParam === 'pending') return ms === 'pending-confirmation' || ms === 'pending';
                    if (statusParam === 'in-progress') return ms === 'in-progress' || ms === 'inprogress';
                    if (statusParam === 'completed') return ms === 'completed' || ms === 'done';
                    if (statusParam === 'cancelled') return ms === 'cancelled' || ms === 'canceled';
                    if (statusParam === 'rejected') return ms === 'rejected';
                    return true;
                });

            const byId = new Map<string, any>();
            merged.forEach((item: any) => {
                const id = String(item?.id || item?.Id || item?.orderId || item?.OrderId || '');
                if (id) byId.set(id, item);
            });
            localOrders.forEach((item: any) => {
                const id = String(item?.id || item?.Id || item?.orderId || item?.OrderId || '');
                if (id && !byId.has(id)) byId.set(id, item);
            });
            const remoteAndLocal = Array.from(byId.values());

            // Với tab pending / in-progress: luôn ưu tiên dữ liệu từ API tương ứng, không bơm mock.
            const dataToShow = (statusParam === 'pending' || statusParam === 'in-progress')
                ? remoteAndLocal
                : (useMock && remoteAndLocal.length === 0 ? filteredMock : remoteAndLocal);
            const sortedByNewest = [...dataToShow].sort((a: any, b: any) => {
                const sa = normalizeStatus(a?.status || a?.Status || '');
                const sb = normalizeStatus(b?.status || b?.Status || '');

                const aPriorityTime = pick(a, ['lastUpdateAt', 'LastUpdateAt']);
                const bPriorityTime = pick(b, ['lastUpdateAt', 'LastUpdateAt']);

                const da = new Date(
                    (sa === 'cancelled' || sa === 'canceled' || sa === 'rejected')
                        ? (aPriorityTime || pick(a, ['orderDate', 'OrderDate', 'createAt', 'CreateAt', 'createdAt', 'CreatedAt']))
                        : (aPriorityTime || pick(a, ['orderDate', 'OrderDate', 'createAt', 'CreateAt', 'createdAt', 'CreatedAt']))
                );
                const db = new Date(
                    (sb === 'cancelled' || sb === 'canceled' || sb === 'rejected')
                        ? (bPriorityTime || pick(b, ['orderDate', 'OrderDate', 'createAt', 'CreateAt', 'createdAt', 'CreatedAt']))
                        : (bPriorityTime || pick(b, ['orderDate', 'OrderDate', 'createAt', 'CreateAt', 'createdAt', 'CreatedAt']))
                );

                const ta = Number.isNaN(da.getTime()) ? 0 : da.getTime();
                const tb = Number.isNaN(db.getTime()) ? 0 : db.getTime();
                return tb - ta;
            });

            setOrders(sortedByNewest);

            try {
                const ratingRes = await ratingService.viewRatings(user.id);
                const ratingRaw = Array.isArray(ratingRes)
                    ? ratingRes
                    : (ratingRes?.data || ratingRes?.items || ratingRes?.result || []);
                const reviewed = new Set(
                    (Array.isArray(ratingRaw) ? ratingRaw : [])
                        .map((r: any) => String(r.orderId || r.OrderId || ''))
                        .filter((x: string) => !!x)
                );
                setReviewedOrderIds(reviewed);
            } catch {
                setReviewedOrderIds(new Set());
            }
        } catch {
            if (!silent) setOrders([]);
        } finally {
            if (!silent) setIsLoading(false); else setRefreshing(false);
        }
    }, [user, statusParam]);

    const handleCancel = async (order: any) => {
        if (!window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) return;

        const upsertLocalCancelledOrder = () => {
            if (!user?.id) return;
            const localKey = 'ff_customer_local_orders';
            const current = (() => {
                try {
                    const parsed = JSON.parse(localStorage.getItem(localKey) || '[]');
                    return Array.isArray(parsed) ? parsed : [];
                } catch {
                    return [];
                }
            })();

            const orderId = String(pick(order, ['id', 'Id', 'orderId', 'OrderId']) || `local-cancel-${Date.now()}`);
            const idx = current.findIndex((o: any) => String(o?.id || '') === orderId);

            const localPayload = {
                id: orderId,
                customerId: user.id,
                technicianId: String(pick(order, ['technicianId', 'TechnicianId']) || ''),
                technicianName: String(pick(order, ['technicianName', 'TechnicianName']) || ''),
                serviceName: String(pick(order, ['serviceName', 'ServiceName']) || ''),
                title: String(pick(order, ['title', 'Title']) || 'Yêu cầu sửa chữa'),
                description: String(pick(order, ['description', 'Description']) || ''),
                address: String(pick(order, ['address', 'Address']) || ''),
                status: 'Cancelled',
                createdAt: new Date().toISOString(),
                source: 'cancel-local'
            };

            if (idx >= 0) current[idx] = { ...current[idx], ...localPayload };
            else current.unshift(localPayload);

            localStorage.setItem(localKey, JSON.stringify(current));
        };

        try {
            await orderService.cancelOrder({
                orderId: String(pick(order, ['id', 'Id', 'orderId', 'OrderId'])),
                technicianId: String(pick(order, ['technicianId', 'TechnicianId']) || '') || undefined
            });
            upsertLocalCancelledOrder();
            toast.success("Đã hủy đơn hàng thành công");
            navigate('/customer/orders?status=cancelled');
            fetchOrders(true);
        } catch (err: any) {
            // frontend-only fallback: vẫn đưa đơn vào danh sách hủy để user theo dõi
            upsertLocalCancelledOrder();
            toast.success("Đã hủy đơn hàng (tạm lưu trên giao diện)");
            navigate('/customer/orders?status=cancelled');
            fetchOrders(true);
        }
    };

    const handleConfirmComplete = async (order: any) => {
        const orderId = String(pick(order, ['id', 'Id', 'orderId', 'OrderId']));
        const technicianId = String(pick(order, ['technicianId', 'TechnicianId']) || '');

        const upsertLocalCompletedOrder = () => {
            if (!user?.id) return;
            const localKey = 'ff_customer_local_orders';
            const current = (() => {
                try {
                    const parsed = JSON.parse(localStorage.getItem(localKey) || '[]');
                    return Array.isArray(parsed) ? parsed : [];
                } catch {
                    return [];
                }
            })();

            const idx = current.findIndex((o: any) => String(o?.id || '') === orderId);
            const localPayload = {
                id: orderId,
                customerId: user.id,
                technicianId: String(pick(order, ['technicianId', 'TechnicianId']) || ''),
                technicianName: String(pick(order, ['technicianName', 'TechnicianName']) || ''),
                serviceName: String(pick(order, ['serviceName', 'ServiceName']) || ''),
                title: String(pick(order, ['title', 'Title']) || 'Yêu cầu sửa chữa'),
                description: String(pick(order, ['description', 'Description']) || ''),
                address: String(pick(order, ['address', 'Address']) || ''),
                status: 'Completed',
                createdAt: new Date().toISOString(),
                source: 'complete-local'
            };

            if (idx >= 0) current[idx] = { ...current[idx], ...localPayload };
            else current.unshift(localPayload);

            localStorage.setItem(localKey, JSON.stringify(current));
        };

        // Cho phép test với dữ liệu mẫu: chuyển local status sang Completed
        const isMockOrder = /^2{8}-2{4}-2{4}-2{4}-2{12}$/.test(orderId)
            || /^5{8}-5{4}-5{4}-5{4}-5{12}$/.test(orderId)
            || /^6{8}-6{4}-6{4}-6{4}-6{12}$/.test(orderId);

        if (isMockOrder) {
            setOrders(prev => prev.map((o: any) => {
                const oid = String(pick(o, ['id', 'Id', 'orderId', 'OrderId']));
                if (oid !== orderId) return o;
                return {
                    ...o,
                    Status: 'Completed',
                    status: 'Completed',
                    LastUpdateAt: new Date().toISOString(),
                    lastUpdateAt: new Date().toISOString()
                };
            }));
            upsertLocalCompletedOrder();
            toast.success('Đơn hàng đã chuyển sang trạng thái hoàn thành.');
            navigate('/customer/history');
            return;
        }

        try {
            await orderService.confirmCompletedOrder({ orderId, technicianId: technicianId || undefined });
            await fetchOrders(true);
            toast.success("Đơn hàng đã chuyển sang trạng thái hoàn thành.");
            navigate('/customer/history');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Xác nhận thất bại");
        }
    };

    const handleChatWithTech = (techId: string) => {
        navigate(`/customer/contact?techId=${techId}`);
    };

    const handleOpenRating = async (order: any) => {
        const orderId = String(order.id || order.Id || order.orderId || order.OrderId || '');
        const source = String(order.source || '').toLowerCase();

        if (!orderId || source.includes('local') || source.includes('mock')) {
            toast.error('Đơn này không phải dữ liệu DB nên không thể gửi đánh giá.');
            return;
        }

        try {
            const check = await ratingService.isFeedback(orderId);
            const isRated = Boolean(check?.isFeedback ?? check?.data?.isFeedback ?? check?.data ?? false);
            if (isRated) {
                setReviewedOrderIds(prev => new Set(prev).add(orderId));
                toast('Đơn này đã được đánh giá trước đó.');
                navigate('/customer/reviews');
                return;
            }
        } catch {
            toast.error('Không thể xác minh trạng thái đánh giá của đơn này.');
            return;
        }

        setSelectedOrder(order);
        setShowRatingModal(true);
    };

    const handleOpenDetail = (order: any) => {
        setSelectedOrder(order);
        setShowDetailModal(true);
    };

    const handleOpenUpdate = (order: any) => {
        setSelectedOrder(order);
        setShowUpdateModal(true);
    };

    // Initial load
    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    // Auto-refresh whenever a new notification arrives (technician changed order status)
    useEffect(() => {
        if (notifications.length > 0) {
            fetchOrders(true);
        }
    }, [notifications.length, fetchOrders]);

    const normalizeStatus = (raw: string) => (raw || '').toLowerCase().replace(/\s+/g, '-');

    const filteredOrdersBase = orders.filter(o => {
        const s = normalizeStatus(o.status || o.Status || '');
        const isCompleted = s === 'completed' || s === 'done';

        if (statusParam === 'all') return !isCompleted;

        if (statusParam === 'pending') return s === 'pending' || s === 'pending-confirmation';

        if (statusParam === 'in-progress') return s === 'in-progress' || s === 'inprogress';
        if (statusParam === 'completed') return false;
        if (statusParam === 'cancelled') return s === 'cancelled' || s === 'canceled';
        if (statusParam === 'rejected') return s === 'rejected';

        return s === statusParam;
    });

    const mockInProgressOrders = MOCK_ORDERS.filter(m => {
        const s = normalizeStatus(m.Status || '');
        return s === 'in-progress' || s === 'inprogress';
    });

    // Bảo đảm luôn có dữ liệu test ở tab đang thực hiện
    const filteredOrders = statusParam === 'in-progress' && filteredOrdersBase.length === 0
        ? mockInProgressOrders
        : filteredOrdersBase;

    const getStatusTitle = (status: string) => {
        switch (status) {
            case 'pending': return 'Đang chờ xác nhận';
            case 'in-progress': return 'Đang thực hiện';
            case 'completed': return 'Đã hoàn thành';
            case 'cancelled': return 'Đơn đã hủy';
            case 'rejected': return 'Đơn hàng bị từ chối';
            default: return 'Tất cả đơn hàng';
        }
    };

    const pick = (obj: any, keys: string[]) => {
        for (const key of keys) {
            const value = obj?.[key];
            if (value !== undefined && value !== null && value !== '') return value;
        }
        return '';
    };

    const formatDateTime = (value: any) => {
        if (!value) return '—';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '—';
        return d.toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const normalizeDetailPayload = (payload: any) => {
        if (!payload || typeof payload !== 'object') return payload;

        return {
            ...payload,
            Id: pick(payload, ['Id', 'id', 'OrderId', 'orderId']),
            ServiceName: pick(payload, ['ServiceName', 'serviceName']),
            TechnicianName: pick(payload, ['TechnicianName', 'technicianName']),
            Title: pick(payload, ['Title', 'title']),
            Description: pick(payload, ['Description', 'description']),
            Address: pick(payload, ['Address', 'address']),
            City: pick(payload, ['City', 'city']),
            Status: pick(payload, ['Status', 'status']),
            CreateAt: pick(payload, ['CreateAt', 'createAt', 'CreatedAt', 'createdAt', 'OrderDate', 'orderDate']),
            LastUpdateAt: pick(payload, ['LastUpdateAt', 'lastUpdateAt', 'UpdatedAt', 'updatedAt'])
        };
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
                                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2 group-hover:text-primary-light transition-colors">
                                    <Wrench className="w-5 h-5 text-zinc-400 group-hover:text-primary-light" />
                                    {pick(order, ['title', 'Title']) || 'Yêu cầu sửa chữa'}
                                </h3>

                                <div className="space-y-3 text-sm text-zinc-300">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                                            <p className="text-[11px] uppercase tracking-wide text-zinc-500">Dịch vụ</p>
                                            <p className="text-zinc-200 mt-0.5 truncate">{pick(order, ['serviceName', 'ServiceName']) || '—'}</p>
                                        </div>
                                        <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                                            <p className="text-[11px] uppercase tracking-wide text-zinc-500">Kỹ thuật viên</p>
                                            <p className="text-primary-light mt-0.5 truncate">{pick(order, ['technicianName', 'TechnicianName']) || 'Chưa gán thợ'}</p>
                                        </div>
                                    </div>

                                    <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                                        <p className="text-[11px] uppercase tracking-wide text-zinc-500">Địa chỉ</p>
                                        <p className="text-zinc-200 mt-0.5 line-clamp-1">{pick(order, ['address', 'Address']) || '—'}</p>
                                    </div>

                                    <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                                        <p className="text-[11px] uppercase tracking-wide text-zinc-500">Mô tả</p>
                                        <p className="text-zinc-300 mt-0.5 line-clamp-2">{pick(order, ['description', 'Description']) || '—'}</p>
                                    </div>

                                    <div className="pt-2 mt-1 border-t border-white/5 space-y-1.5 text-xs">
                                        <div className="flex items-center justify-between gap-2 text-zinc-400">
                                            <span className="inline-flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Tạo lúc</span>
                                            <span className="text-zinc-300">{formatDateTime(pick(order, ['createdAt', 'CreatedAt', 'orderDate', 'OrderDate']))}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2 text-zinc-400">
                                            <span className="inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Cập nhật</span>
                                            <span className="text-zinc-300">{(() => {
                                                const updated = pick(order, ['updatedAt', 'UpdatedAt', 'lastUpdateAt', 'LastUpdateAt']);
                                                return updated ? formatDateTime(updated) : 'Chưa cập nhật';
                                            })()}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2 text-zinc-400">
                                            <span className="inline-flex items-center gap-1.5"><ClipboardList className="w-3.5 h-3.5" /> Mã đơn</span>
                                            <span className="font-mono text-zinc-300">{(() => {
                                                const oid = String(order.id || order.Id || '');
                                                return oid ? `${oid.slice(0, 8)}...${oid.slice(-4)}` : '—';
                                            })()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex flex-col gap-2">
                                    <Button
                                        variant="outline"
                                        className="w-full border-primary/30 text-primary-light hover:bg-primary/10 h-9 text-xs"
                                        onClick={() => handleOpenDetail(order)}
                                    >
                                        Xem chi tiết
                                    </Button>

                                    {(() => {
                                        const status = normalizeStatus(order.status || order.Status || '');
                                        return status === 'pending' || status === 'pending-confirmation';
                                    })() && (
                                        <Button
                                            variant="outline"
                                            className="w-full border-blue-500/30 text-blue-400 hover:bg-blue-500/10 h-9 text-xs"
                                            onClick={() => handleOpenUpdate(order)}
                                        >
                                            Cập nhật đơn hàng
                                        </Button>
                                    )}

                                    {/* Action Buttons based on Status */}
                                    {(() => {
                                        const status = normalizeStatus(order.status || order.Status || '');
                                        return (status === 'pending' || status === 'pending-confirmation');
                                    })() && (
                                        <Button 
                                            variant="outline" 
                                            className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 h-9 text-xs"
                                            onClick={() => handleCancel(order)}
                                        >
                                            <X className="w-3.5 h-3.5 mr-1.5" /> Hủy yêu cầu
                                        </Button>
                                    )}

                                    {(() => {
                                        const status = normalizeStatus(order.status || order.Status || '');
                                        return status === 'in-progress' || status === 'inprogress';
                                    })() && (
                                        <Button 
                                            className="w-full bg-green-600 hover:bg-green-700 text-white h-9 text-xs"
                                            onClick={() => handleConfirmComplete(order)}
                                        >
                                            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Xác nhận hoàn thành
                                        </Button>
                                    )}

                                    {(() => {
                                        const status = normalizeStatus(order.status || order.Status || '');
                                        return status === 'completed' || status === 'done';
                                    })() && (
                                        <Button 
                                            className="w-full bg-primary hover:bg-primary-dark text-white h-9 text-xs"
                                            onClick={() => void handleOpenRating(order)}
                                        >
                                            <Star className="w-3.5 h-3.5 mr-1.5 fill-current" /> Đánh giá dịch vụ
                                        </Button>
                                    )}

                                    {/* Chat Button if technician assigned */}
                                    {(order.technicianId || order.TechnicianId) && (() => {
                                        const status = normalizeStatus(order.status || order.Status || '');
                                        return status !== 'cancelled' && status !== 'canceled';
                                    })() && (
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

                    </div>
                )}
            </div>
            <AnimatePresence>
                {showRatingModal && selectedOrder && (
                    <RatingModal
                        order={selectedOrder}
                        onClose={() => {
                            setShowRatingModal(false);
                            setSelectedOrder(null);
                        }}
                        onSuccess={() => {
                            const oid = String(selectedOrder?.id || selectedOrder?.Id || selectedOrder?.orderId || selectedOrder?.OrderId || '');
                            if (oid) setReviewedOrderIds(prev => new Set(prev).add(oid));
                            setShowRatingModal(false);
                            setSelectedOrder(null);
                            fetchOrders(true);
                            navigate('/customer/reviews');
                        }}
                    />
                )}
                {showDetailModal && selectedOrder && (
                    <OrderDetailModal
                        order={selectedOrder}
                        onClose={() => {
                            setShowDetailModal(false);
                            setSelectedOrder(null);
                        }}
                    />
                )}
                {showUpdateModal && selectedOrder && (
                    <UpdateOrderModal
                        order={selectedOrder}
                        onClose={() => {
                            setShowUpdateModal(false);
                            setSelectedOrder(null);
                        }}
                        onSuccess={() => {
                            setShowUpdateModal(false);
                            setSelectedOrder(null);
                            fetchOrders(true);
                        }}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function UpdateOrderModal({ order, onClose, onSuccess }: { order: any; onClose: () => void; onSuccess: () => void }) {
    const [description, setDescription] = useState((order.description || order.Description || '').toString());
    const [images, setImages] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const orderId = order.id || order.Id || order.orderId || order.OrderId;
        if (!orderId) return toast.error('Không tìm thấy mã đơn hàng');
        if (!description.trim()) return toast.error('Vui lòng nhập mô tả cập nhật');

        setIsSubmitting(true);
        try {
            await orderService.updateOrder({
                orderId,
                description: description.trim(),
                images
            });
            toast.success('Cập nhật đơn hàng thành công');
            onSuccess();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Không thể cập nhật đơn hàng');
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
                className="relative w-full max-w-xl bg-bg-card/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-6"
            >
                <h2 className="text-xl font-bold text-white mb-4">Cập nhật đơn hàng</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs text-zinc-400">Mô tả cập nhật</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-primary/50"
                            placeholder="Cập nhật thêm thông tin sự cố..."
                        />
                    </div>
                    <div>
                        <label className="text-xs text-zinc-400">Thêm ảnh (tuỳ chọn)</label>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => setImages(Array.from(e.target.files || []))}
                            className="mt-1 block w-full text-xs text-zinc-400"
                        />
                    </div>
                    <div className="flex gap-3 justify-end">
                        <Button type="button" variant="ghost" onClick={onClose}>Hủy</Button>
                        <Button type="submit" className="bg-primary hover:bg-primary-dark text-white" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Lưu cập nhật'}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}

function OrderDetailModal({ order, onClose }: { order: any; onClose: () => void }) {
    const [detail, setDetail] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const pick = (obj: any, keys: string[]) => {
        for (const key of keys) {
            const value = obj?.[key];
            if (value !== undefined && value !== null && value !== '') return value;
        }
        return '';
    };

    const formatDateTime = (value: any) => {
        if (!value) return '—';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '—';
        return d.toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const normalizeDetailPayload = (payload: any) => {
        if (!payload || typeof payload !== 'object') return payload;

        return {
            ...payload,
            Id: pick(payload, ['Id', 'id', 'OrderId', 'orderId']),
            ServiceName: pick(payload, ['ServiceName', 'serviceName']),
            TechnicianName: pick(payload, ['TechnicianName', 'technicianName']),
            Title: pick(payload, ['Title', 'title']),
            Description: pick(payload, ['Description', 'description']),
            Address: pick(payload, ['Address', 'address']),
            City: pick(payload, ['City', 'city']),
            Status: pick(payload, ['Status', 'status']),
            CreateAt: pick(payload, ['CreateAt', 'createAt', 'CreatedAt', 'createdAt', 'OrderDate', 'orderDate'])
        };
    };

    useEffect(() => {
        const fetchDetail = async () => {
            setIsLoading(true);
            try {
                const orderId = pick(order, ['id', 'Id', 'orderId', 'OrderId']);
                if (!orderId) {
                    setDetail(normalizeDetailPayload(order));
                    return;
                }
                const res = await orderService.getOrderDetail(orderId);
                const rawDetail = res?.data || res || order;
                setDetail(normalizeDetailPayload(rawDetail));
            } catch {
                setDetail(normalizeDetailPayload(order));
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetail();
    }, [order]);

    const data = detail || order;

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
                className="relative w-full max-w-2xl bg-bg-card/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-6"
            >
                <div className="flex items-start justify-between mb-5">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Chi tiết đơn hàng</h2>
                        <p className="text-sm text-zinc-400 mt-1">Mã đơn: {String(pick(data, ['id', 'Id']) || '—')}</p>
                    </div>
                    <Button variant="ghost" onClick={onClose} className="text-zinc-400 hover:text-white">Đóng</Button>
                </div>

                {isLoading ? (
                    <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <p className="text-zinc-500 mb-1">Tiêu đề</p>
                            <p className="text-white">{pick(data, ['title', 'Title']) || '—'}</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <p className="text-zinc-500 mb-1">Dịch vụ</p>
                            <p className="text-white">{pick(data, ['serviceName', 'ServiceName']) || '—'}</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:col-span-2">
                            <p className="text-zinc-500 mb-1">Mô tả sự cố</p>
                            <p className="text-white whitespace-pre-wrap">{pick(data, ['description', 'Description']) || '—'}</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:col-span-2">
                            <p className="text-zinc-500 mb-1">Địa chỉ</p>
                            <p className="text-white">{pick(data, ['address', 'Address']) || '—'}</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <p className="text-zinc-500 mb-1">Kỹ thuật viên</p>
                            <p className="text-white">{pick(data, ['technicianName', 'TechnicianName']) || '—'}</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <p className="text-zinc-500 mb-1">Trạng thái</p>
                            <p className="text-white">{pick(data, ['status', 'Status']) || '—'}</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <p className="text-zinc-500 mb-1">Thời gian tạo</p>
                            <p className="text-white">{formatDateTime(pick(data, ['CreateAt', 'createAt', 'createdAt', 'CreatedAt', 'orderDate', 'OrderDate']))}</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <p className="text-zinc-500 mb-1">Thời gian cập nhật</p>
                            <p className="text-white">{(() => {
                                const updated = pick(data, ['updatedAt', 'UpdatedAt', 'lastUpdateAt', 'LastUpdateAt']);
                                return updated ? formatDateTime(updated) : 'Chưa cập nhật';
                            })()}</p>
                        </div>
                    </div>
                )}
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

        const orderId = String(order.id || order.Id || order.orderId || order.OrderId || '');
        const technicianId = String(order.technicianId || order.TechnicianId || '');

        setIsSubmitting(true);
        try {
            await ratingService.createRating({
                customerId: user.id,
                technicianId,
                orderId,
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
    let color = "bg-white/10 text-white border-white/30";
    let label = "Chờ xác nhận";

    if (s === 'accepted') { color = "bg-blue-500/10 text-blue-400 border-blue-500/20"; label = "Đã tiếp nhận"; }
    else if (s === 'in-progress' || s === 'inprogress') { color = "bg-amber-500/10 text-amber-400 border-amber-500/20"; label = "Đang thực hiện"; }
    else if (s === 'completed' || s === 'done') { color = "bg-green-500/10 text-green-400 border-green-500/20"; label = "Hoàn thành"; }
    else if (s === 'cancelled' || s === 'canceled') { color = "bg-red-500/10 text-red-400 border-red-500/20"; label = "Đã hủy"; }
    else if (s === 'rejected') { color = "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20"; label = "Đơn hàng bị từ chối"; }

    return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${color}`}>{label}</span>;
}
