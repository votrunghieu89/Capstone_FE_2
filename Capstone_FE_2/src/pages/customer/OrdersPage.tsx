import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Wrench, Calendar, Clock, ClipboardList, X, Loader2, RefreshCw, MessageCircle } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import orderService from '@/services/orderService';
import ratingService from '@/services/ratingService';
import chatService from '@/services/chatService';
import { useNotificationSignalR } from '@/hooks/useNotificationSignalR';
import { useChatSignalR } from '@/hooks/useChatSignalR';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Star } from 'lucide-react';

const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh';

const formatVietnamHourLabel = (date: Date) => {
    if (!date || Number.isNaN(date.getTime())) return '—';

    const parts = new Intl.DateTimeFormat('vi-VN', {
        timeZone: VIETNAM_TIME_ZONE,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).formatToParts(date);

    const hour = parts.find((part) => part.type === 'hour')?.value ?? '00';
    const minute = parts.find((part) => part.type === 'minute')?.value ?? '00';
    return minute === '00' ? `${hour}h` : `${hour}h${minute}`;
};

const formatVietnamDateTime = (value: any) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';

    return new Intl.DateTimeFormat('vi-VN', {
        timeZone: VIETNAM_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(date);
};

const getEstimatedTimeValue = (payload: any) => {
    const raw = payload?.estimatedTime ?? payload?.EstimatedTime ?? payload?.eta ?? payload?.ETA ?? payload?.estimatedMinutes ?? payload?.EstimatedMinutes;
    if (raw === null || raw === undefined || raw === '') return 0;
    const normalizedRaw = typeof raw === 'string' ? raw.replace(',', '.').trim() : raw;
    const value = Number(normalizedRaw);
    return Number.isFinite(value) && value > 0 ? value : 0;
};

const buildEtaWindowText = (etaMinutesRaw: any, baseDateRaw?: any) => {
    const etaMinutes = getEstimatedTimeValue({ estimatedTime: etaMinutesRaw });
    if (!etaMinutes) return '';

    const baseDate = baseDateRaw ? new Date(baseDateRaw) : null;
    const base = baseDate && !Number.isNaN(baseDate.getTime()) ? baseDate : new Date();
    const start = new Date(base.getTime() + etaMinutes * 60 * 1000);
    const end = new Date(start.getTime() + 10 * 60 * 1000);
    return `${formatVietnamHourLabel(start)} - ${formatVietnamHourLabel(end)}`;
};

const getEtaFallbackLabel = (etaMinutesRaw: any) => {
    const etaMinutes = getEstimatedTimeValue({ estimatedTime: etaMinutesRaw });
    if (!etaMinutes) return 'Đang cập nhật';
    return `${etaMinutes} phút`;
};

const normalizeAttachmentUrl = (value: any) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value?.url || value?.Url || value?.fileUrl || value?.FileUrl || value?.fileName || value?.FileName || value?.path || value?.Path || '';
};

const isLikelyImageUrl = (value: string) => /\.(png|jpe?g|gif|webp|bmp|svg)(\?|#|$)/i.test(String(value || '')) || String(value || '').startsWith('data:image/');

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

    const normalizeAttachments = (payload: any) => {
        const imageUrlsRaw = payload?.ImageUrls ?? payload?.imageUrls ?? payload?.images ?? payload?.Images ?? [];
        const imageUrls = Array.isArray(imageUrlsRaw)
            ? imageUrlsRaw.map(normalizeAttachmentUrl).filter(Boolean)
            : (typeof imageUrlsRaw === 'string' ? [imageUrlsRaw] : []);
        return { imageUrls };
    };

    // Listen to real-time notifications (from SignalR)
    const { notifications } = useNotificationSignalR();
    const { joinRoom, leaveRoom, isConnected, notifications: chatNotifications } = useChatSignalR();
    const unreadBySenderId = useMemo(() => {
        const map: Record<string, number> = {};
        (chatNotifications || []).forEach((n: any) => {
            const senderId = String(n?.SenderId || n?.SenderID || n?.senderId || n?.senderID || n?.senderid || '').trim();
            if (!senderId) return;
            map[senderId] = (map[senderId] || 0) + 1;
        });
        return map;
    }, [chatNotifications]);
    const [unreadByOtherId, setUnreadByOtherId] = useState<Record<string, number>>({});
    const refreshUnreadFromRooms = useCallback(async () => {
        if (!user?.id) return;
        try {
            const res = await chatService.getAllRooms(user.id, 1, 100);
            const rooms = Array.isArray(res) ? res : (res?.items || res?.data || []);
            const map: Record<string, number> = {};
            rooms.forEach((room: any) => {
                const otherId = String(room?.otherId || room?.OtherId || room?.otherPartyId || room?.OtherPartyId || '').trim();
                if (!otherId) return;
                const unreadCount = Number(room?.unreadCount ?? room?.UnreadCount ?? 0);
                const hasUnread = Boolean(room?.hasUnread ?? room?.HasUnread);
                const value = Number.isFinite(unreadCount) && unreadCount > 0 ? unreadCount : (hasUnread ? 1 : 0);
                if (value > 0) map[otherId] = Math.max(map[otherId] || 0, value);
            });
            setUnreadByOtherId(map);
        } catch {
            // keep previous unread state
        }
    }, [user?.id]);
    useEffect(() => {
        if (!user?.id) return;
        void refreshUnreadFromRooms();
        const timer = window.setInterval(() => {
            void refreshUnreadFromRooms();
        }, 8000);
        return () => window.clearInterval(timer);
    }, [refreshUnreadFromRooms, user?.id]);
    useEffect(() => {
        if (!chatNotifications.length) return;
        void refreshUnreadFromRooms();
    }, [chatNotifications.length, refreshUnreadFromRooms]);
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
                    if (statusParam === 'pending') return s === 'pending' || s === 'pending-confirmation' || s === 'confirmed';
                    if (statusParam === 'in-progress') return s === 'in-progress' || s === 'inprogress';
                    if (statusParam === 'completed') return s === 'completed' || s === 'done';
                    if (statusParam === 'cancelled') return s === 'cancelled' || s === 'canceled';
                    if (statusParam === 'rejected') return s === 'rejected';
                    return true;
                })
                .map((o: any) => {
                    const { imageUrls } = normalizeAttachments(o);
                    const rawEta = o.estimatedTime ?? o.EstimatedTime ?? o.eta ?? o.ETA;
                    const parsedEta = Number(typeof rawEta === 'string' ? rawEta.replace(',', '.').trim() : rawEta);
                    const source = String(o.source || 'autofind-local').toLowerCase();
                    const inferredEta = Number.isFinite(parsedEta) && parsedEta > 0
                        ? parsedEta
                        : (source.includes('autofind') || source.includes('local') ? 110 : 0);

                    return {
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
                        City: o.city,
                        city: o.city,
                        CityName: o.cityName || o.CityName || o.city || o.City,
                        cityName: o.cityName || o.CityName || o.city || o.City,
                        EstimatedTime: inferredEta,
                        estimatedTime: inferredEta,
                        Status: o.status,
                        status: o.status,
                        CreateAt: o.createdAt,
                        createdAt: o.createdAt,
                        OrderDate: o.createdAt,
                        orderDate: o.createdAt,
                        source: o.source || 'autofind-local',
                        imageUrls,
                        ImageUrls: imageUrls
                    };
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

            const dataToShow = remoteAndLocal;
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

    const confirmCancelWithToast = () =>
        new Promise<boolean>((resolve) => {
            toast((t) => (
                <div className="space-y-2">
                    <p className="text-sm font-medium">Bạn có chắc chắn muốn hủy đơn hàng này?</p>
                    <div className="flex items-center justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="h-8 px-3"
                            onClick={() => {
                                toast.dismiss(t.id);
                                resolve(false);
                            }}
                        >
                            Không
                        </Button>
                        <Button
                            type="button"
                            className="h-8 px-3 bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => {
                                toast.dismiss(t.id);
                                resolve(true);
                            }}
                        >
                            Xác nhận hủy
                        </Button>
                    </div>
                </div>
            ), { duration: 10000 });
        });

    const handleCancel = async (order: any) => {
        const isConfirmed = await confirmCancelWithToast();
        if (!isConfirmed) {
            toast('Đã hủy thao tác hủy đơn.');
            return;
        }

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


        try {
            await orderService.confirmCompletedOrder({ orderId, technicianId: technicianId || undefined });
            await fetchOrders(true);
            toast.success("Đơn hàng đã chuyển sang trạng thái hoàn thành.");
            navigate('/customer/history');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Xác nhận thất bại");
        }
    };

    const resolveTechnicianChatId = (order: any) => {
        const candidates = [
            order?.technicianAccountId,
            order?.TechnicianAccountId,
            order?.technicianId,
            order?.TechnicianId,
            order?.accountId,
            order?.AccountId,
            order?.receiverId,
            order?.ReceiverId,
            order?.otherId,
            order?.OtherId,
        ];

        return candidates.map((v) => String(v || '').trim()).find(Boolean) || '';
    };

    const handleChatWithTech = (order: any) => {
        const techId = resolveTechnicianChatId(order);
        if (!techId) {
            // Fallback: vẫn vào trang chat để user chọn cuộc hội thoại có sẵn
            navigate('/customer/contact');
            return;
        }

        localStorage.setItem('technicianId', techId);
        navigate(`/customer/contact?techId=${encodeURIComponent(techId)}`);
    };

    useEffect(() => {
        const chatRoomId = selectedOrder ? String(pick(selectedOrder, ['roomId', 'RoomId']) || '') : '';
        if (chatRoomId) {
            joinRoom(chatRoomId).catch(() => undefined);
            return () => {
                leaveRoom(chatRoomId).catch(() => undefined);
            };
        }
    }, [selectedOrder, joinRoom, leaveRoom]);

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

        if (statusParam === 'pending') return s === 'pending' || s === 'pending-confirmation' || s === 'confirmed';

        if (statusParam === 'in-progress') return s === 'in-progress' || s === 'inprogress';
        if (statusParam === 'completed') return false;
        if (statusParam === 'cancelled') return s === 'cancelled' || s === 'canceled';
        if (statusParam === 'rejected') return s === 'rejected';

        return s === statusParam;
    });

    const filteredOrders = filteredOrdersBase;
    const pendingWaitingCount = filteredOrders.filter((o) => {
        const s = normalizeStatus(o.status || o.Status || '');
        return s === 'pending' || s === 'pending-confirmation';
    }).length;
    const pendingConfirmedCount = filteredOrders.filter((o) => {
        const s = normalizeStatus(o.status || o.Status || '');
        return s === 'confirmed';
    }).length;

    const getStatusTitle = (status: string) => {
        switch (status) {
            case 'pending': return 'Đơn đang chờ';
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

    const formatDateTime = (value: any) => formatVietnamDateTime(value);

    const buildEtaLabel = (order: any) => {
        const etaRaw = pick(order, ['estimatedTime', 'EstimatedTime', 'eta', 'ETA', 'estimatedMinutes', 'EstimatedMinutes']);
        const createdAt = pick(order, ['CreatedAt', 'createdAt', 'CreateAt', 'createAt', 'OrderDate', 'orderDate']);
        const etaWindow = buildEtaWindowText(etaRaw, createdAt);
        return etaWindow || getEtaFallbackLabel(etaRaw);
    };

    const buildEtaMinutesText = (order: any) => getEtaFallbackLabel(pick(order, ['EstimatedTime', 'estimatedTime', 'eta', 'ETA', 'estimatedMinutes', 'EstimatedMinutes']));



    const normalizeDetailPayload = (payload: any) => {
        if (!payload || typeof payload !== 'object') return payload;
        const { imageUrls } = normalizeAttachments(payload);

        return {
            ...payload,
            Id: pick(payload, ['Id', 'id', 'OrderId', 'orderId']),
            ServiceName: pick(payload, ['ServiceName', 'serviceName']),
            TechnicianName: pick(payload, ['TechnicianName', 'technicianName']),
            Title: pick(payload, ['Title', 'title']),
            Description: pick(payload, ['Description', 'description']),
            Address: pick(payload, ['Address', 'address']),
            City: pick(payload, ['City', 'city']),
            CityName: pick(payload, ['CityName', 'cityName', 'City', 'city']),
            cityName: pick(payload, ['cityName', 'CityName', 'city', 'City']),
            Status: pick(payload, ['Status', 'status']),
            EstimatedTime: pick(payload, ['EstimatedTime', 'estimatedTime', 'eta', 'ETA', 'estimatedMinutes', 'EstimatedMinutes']),
            CreateAt: pick(payload, ['CreateAt', 'createAt', 'CreatedAt', 'createdAt', 'OrderDate', 'orderDate']),
            LastUpdateAt: pick(payload, ['LastUpdateAt', 'lastUpdateAt', 'UpdatedAt', 'updatedAt']),
            imageUrls,
            ImageUrls: imageUrls
        };
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.03] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.25)] md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Quản lý Đơn hàng</h1>
                        <p className="mt-2 max-w-2xl text-sm text-zinc-400">Theo dõi trạng thái và tiến độ sửa chữa thiết bị của bạn.</p>
                    </div>
                    <div className="flex items-center gap-3 self-start sm:self-auto">
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-400">{filteredOrders.length} đơn hàng</span>
                        <button onClick={() => fetchOrders(true)} className="rounded-lg p-2 text-zinc-500 transition-all hover:bg-white/5 hover:text-zinc-300" title="Làm mới">
                            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                        </button>
                        {refreshing && <span className="text-xs text-zinc-500">Cập nhật...</span>}
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-[#0a1122] p-4 sm:p-6">
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-white">{getStatusTitle(statusParam)}</h2>
                        {statusParam === 'pending' && (
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                                <span className="rounded-full border border-zinc-500/30 bg-zinc-500/10 px-2.5 py-1 text-zinc-300">
                                    Đơn đang chờ xác nhận: {pendingWaitingCount}
                                </span>
                                <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-blue-300">
                                    Đơn đã xác nhận: {pendingConfirmedCount}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-zinc-500">{filteredOrders.length} đơn hàng</span>
                        <button onClick={() => fetchOrders(true)} className="rounded-lg p-1.5 text-zinc-500 transition-all hover:bg-white/5 hover:text-zinc-300" title="Làm mới">
                            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                        </button>
                        {refreshing && <span className="text-xs text-zinc-500">Cập nhật...</span>}
                    </div>
                </div>

                {isLoading ? (
                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
                            <Loader2 className="h-7 w-7 animate-spin text-primary" />
                        </div>
                        <p className="mt-4 text-sm font-medium text-white">Đang tải đơn hàng...</p>
                        <p className="mt-1 text-xs text-zinc-500">Vui lòng chờ trong giây lát.</p>
                    </div>
                ) : filteredOrders.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredOrders.map((order, idx) => (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                key={order.id || order.Id || idx}
                                className="group relative overflow-hidden rounded-3xl border border-white/8 bg-[#16181f] shadow-2xl transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_18px_50px_rgba(0,0,0,0.45)]"
                            >
                                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-80" />

                                <div className="flex items-start justify-end gap-3 border-b border-[#2a2d3e] bg-[#1c1f2e] px-4 py-4">
                                    <div className="shrink-0">
                                        <StatusBadge status={order.status || order.Status || 'Pending'} />
                                    </div>
                                </div>

                                <div className="mx-3 mt-3 rounded-2xl border border-[#2a3b70] bg-gradient-to-r from-[#19254a] to-[#1f2e5c] px-4 py-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#5c6fa8]">
                                                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-500/15 text-blue-200">⏱</span>
                                                Khung giờ dự kiến
                                            </p>
                                            <p className="mt-1 text-3xl font-black leading-none text-white">{buildEtaLabel(order)}</p>
                                            <p className="mt-0.5 text-[11px] text-[#5c6fa8]">{buildEtaMinutesText(order)}</p>
                                        </div>
                                        <span className="shrink-0 rounded-lg bg-blue-500 px-2.5 py-1 text-[11px] font-extrabold tracking-widest text-white shadow-lg">ETA</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 px-4 pt-4 pb-2">
                                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#22253a] text-base">🔧</div>
                                    <h3 className="line-clamp-2 text-sm font-bold leading-tight text-[#e2e6f3]">{pick(order, ['title', 'Title']) || 'Yêu cầu sửa chữa'}</h3>
                                </div>
                                <p className="px-4 pb-2 text-sm leading-relaxed text-[#8b93b8] line-clamp-2">
                                    {pick(order, ['description', 'Description']) || '—'}
                                </p>

                                <div className="grid grid-cols-1 gap-2 px-3 pb-3 sm:grid-cols-2">
                                    <div className="rounded-2xl border border-[#272a3d] bg-[#1c1f2e] px-3 py-3 sm:col-span-1">
                                        <p className="mb-1 text-[9.5px] font-bold uppercase tracking-widest text-[#555a77]">Dịch vụ</p>
                                        <p className="truncate text-[13px] font-semibold text-[#dde1f3]">{pick(order, ['serviceName', 'ServiceName']) || '—'}</p>
                                    </div>
                                    <div className="flex items-center gap-2.5 rounded-2xl border border-[#272a3d] bg-[#1c1f2e] px-3 py-3 sm:col-span-1">
                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#3b4068] bg-[#22253a] text-[11px] font-semibold text-[#60a5fa]">
                                            {(pick(order, ['technicianName', 'TechnicianName']) || '—').toString().slice(0, 1).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[9.5px] font-bold uppercase tracking-widest text-[#555a77]">Kỹ thuật viên</p>
                                            <p className="truncate text-[13px] font-semibold text-[#60a5fa]">{pick(order, ['technicianName', 'TechnicianName']) || 'Chưa gán thợ'}</p>
                                        </div>
                                    </div>
                                    <div className="rounded-2xl border border-[#272a3d] bg-[#1c1f2e] px-3 py-3 sm:col-span-1">
                                        <p className="mb-1 text-[9.5px] font-bold uppercase tracking-widest text-[#555a77]">Thành phố</p>
                                        <p className={`truncate text-[13px] font-semibold ${pick(order, ['cityName', 'CityName', 'city', 'City']) ? 'text-[#dde1f3]' : 'text-[#555a77]'}`}>{pick(order, ['cityName', 'CityName', 'city', 'City']) || '—'}</p>
                                    </div>
                                    <div className="rounded-2xl border border-[#272a3d] bg-[#1c1f2e] px-3 py-3 sm:col-span-1">
                                        <p className="mb-1 text-[9.5px] font-bold uppercase tracking-widest text-[#555a77]">Địa chỉ</p>
                                        <p className={`truncate text-[13px] font-semibold ${pick(order, ['address', 'Address']) || pick(order, ['cityName', 'CityName', 'city', 'City']) ? 'text-[#dde1f3]' : 'text-[#555a77]'}`}>
                                            {(() => {
                                                const address = String(pick(order, ['address', 'Address']) || '').trim();
                                                const city = String(pick(order, ['cityName', 'CityName', 'city', 'City']) || '').trim();
                                                if (!address && !city) return '—';
                                                if (address && city) return `${address}, ${city}`;
                                                return address || city;
                                            })()}
                                        </p>
                                    </div>
                                </div>

                                <div className="mx-3 rounded-2xl border border-[#272a3d] bg-[#1c1f2e] px-3 py-2.5">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="flex items-center gap-1.5 text-xs text-[#555a77]">
                                            <Calendar className="h-3.5 w-3.5" /> Tạo lúc
                                        </span>
                                        <span className="text-xs font-semibold text-[#8b93b8]">
                                            {formatDateTime(pick(order, ['createdAt', 'CreatedAt', 'orderDate', 'OrderDate']))}
                                        </span>
                                    </div>
                                </div>

                                <div className="px-3 pb-3 pt-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            variant="outline"
                                            className="h-11 w-full truncate border-[#2e3250] px-3 text-[13px] font-bold text-[#8b93b8] hover:border-[#4a5080] hover:bg-transparent hover:text-[#c5cadf]"
                                            onClick={() => handleOpenDetail(order)}
                                        >
                                            📋 Xem chi tiết
                                        </Button>

                                        {(() => {
                                            const status = normalizeStatus(order.status || order.Status || '');
                                            return status === 'in-progress' || status === 'inprogress';
                                        })() && (
                                                <Button
                                                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white h-11 text-[13px] font-bold truncate px-3 shadow-lg shadow-green-600/25"
                                                    onClick={() => handleConfirmComplete(order)}
                                                >
                                                    ✓ Hoàn thành
                                                </Button>
                                            )}

                                        {(() => {
                                            const status = normalizeStatus(order.status || order.Status || '');
                                            return status === 'pending' || status === 'pending-confirmation';
                                        })() && (
                                                <Button
                                                    variant="outline"
                                                    className="w-full border-blue-500/30 text-blue-400 hover:bg-blue-500/10 h-11 text-[13px] font-bold truncate px-3"
                                                    onClick={() => handleOpenUpdate(order)}
                                                >
                                                    Cập nhật
                                                </Button>
                                            )}

                                        {(() => {
                                            const status = normalizeStatus(order.status || order.Status || '');
                                            return status === 'pending' || status === 'pending-confirmation';
                                        })() && (
                                                <Button
                                                    variant="outline"
                                                    className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 h-11 text-[13px] font-bold truncate px-3"
                                                    onClick={() => handleCancel(order)}
                                                >
                                                    <X className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                                                    <span className="truncate">Hủy đơn</span>
                                                </Button>
                                            )}

                                        {(() => {
                                            const status = normalizeStatus(order.status || order.Status || '');
                                            return status !== 'cancelled' && status !== 'canceled';
                                        })() && (
                                                <Button
                                                    variant="ghost"
                                                    className="relative w-full border border-[#272a3d] bg-[#1c1f2e] hover:bg-[#22253a] hover:border-[#3b4068] text-[#8b93b8] hover:text-[#c5cadf] h-11 text-[13px] font-bold truncate px-3"
                                                    onClick={async () => {
                                                        const roomId = String(pick(order, ['roomId', 'RoomId']) || '').trim();
                                                        const techName = String(pick(order, ['technicianName', 'TechnicianName']) || '').trim();
                                                        const orderId = String(pick(order, ['id', 'Id', 'orderId', 'OrderId']) || '').trim();

                                                        // 1) Nếu đã có roomId từ backend thì dùng luôn
                                                        if (roomId) {
                                                            if (orderId) localStorage.setItem(`ff_order_room_${orderId}`, roomId);
                                                            const q = new URLSearchParams({ roomId });
                                                            if (techName) q.set('techName', techName);
                                                            if (orderId) q.set('orderId', orderId);
                                                            navigate(`/customer/contact?${q.toString()}`);
                                                            return;
                                                        }

                                                        // 2) Khóa cứng đúng room: tạo/lấy room ngay tại Orders rồi điều hướng theo roomId
                                                        const techId = resolveTechnicianChatId(order);
                                                        if (user?.id && techId) {
                                                            try {
                                                                const roomRes = await chatService.getOrCreateRoom(user.id, techId);
                                                                const ensuredRoomId = String(roomRes?.roomId || roomRes?.RoomId || roomRes?.id || roomRes?.Id || roomRes || '').trim();
                                                                if (ensuredRoomId) {
                                                                    if (orderId) localStorage.setItem(`ff_order_room_${orderId}`, ensuredRoomId);
                                                                    localStorage.setItem(`ff_order_other_${orderId}`, techId);
                                                                    const q = new URLSearchParams({ roomId: ensuredRoomId });
                                                                    if (techName) q.set('techName', techName);
                                                                    if (orderId) q.set('orderId', orderId);
                                                                    localStorage.setItem('technicianId', techId);
                                                                    navigate(`/customer/contact?${q.toString()}`);
                                                                    return;
                                                                }
                                                            } catch (err: any) {
                                                                console.error('getOrCreateRoom from Orders failed', err);
                                                            }
                                                        }

                                                        // 3) Fallback mềm
                                                        if (techId) {
                                                            const q = new URLSearchParams({ techId });
                                                            if (techName) q.set('techName', techName);
                                                            localStorage.setItem('technicianId', techId);
                                                            navigate(`/customer/contact?${q.toString()}`);
                                                            return;
                                                        }

                                                        if (techName) {
                                                            navigate(`/customer/contact?techName=${encodeURIComponent(techName)}`);
                                                        } else {
                                                            navigate('/customer/contact');
                                                        }
                                                    }}
                                                >
                                                    {(() => {
                                                        const techId = resolveTechnicianChatId(order);
                                                        const key = String(techId || '').trim();
                                                        const unreadCount = key ? Math.max(unreadBySenderId[key] || 0, unreadByOtherId[key] || 0) : 0;
                                                        if (!unreadCount) return null;
                                                        return (
                                                            <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-[#ff2d55] text-white text-[9px] font-black flex items-center justify-center ring-2 ring-[#1c1f2e] z-10">
                                                                {unreadCount > 99 ? '99+' : unreadCount}
                                                            </span>
                                                        );
                                                    })()}
                                                    💬 Chat với thợ
                                                </Button>
                                            )}
                                    </div>
                                </div>

                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                            <ClipboardList className="h-8 w-8 text-zinc-500" />
                        </div>
                        <p className="mt-4 text-sm font-medium text-white">Chưa có đơn hàng nào.</p>
                        <p className="mt-1 text-xs text-zinc-500">Khi có đơn, chúng sẽ xuất hiện tại đây.</p>
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

    const formatDateTime = (value: any) => formatVietnamDateTime(value);

    const extractImageUrls = (source: any) => {
        const direct = source?.ImageUrls ?? source?.imageUrls ?? source?.images ?? source?.Images;
        if (Array.isArray(direct)) return direct.map(normalizeAttachmentUrl).filter(Boolean);
        if (typeof direct === 'string') return [direct].filter(Boolean);

        const attachments = source?.OrderAttachments ?? source?.orderAttachments ?? source?.attachments ?? source?.Attachments;
        if (Array.isArray(attachments)) {
            return attachments
                .filter((a: any) => String(a?.FileType || a?.fileType || '').toLowerCase() === 'image')
                .map((a: any) => normalizeAttachmentUrl(a?.FileName || a?.fileName || a?.Url || a?.url || a))
                .filter(Boolean);
        }

        return [] as string[];
    };

    const normalizeDetailPayload = (payload: any, fallback?: any) => {
        if (!payload || typeof payload !== 'object') return fallback || payload;

        const imageUrls = [
            ...extractImageUrls(payload),
            ...extractImageUrls(fallback)
        ].filter(Boolean);

        return {
            ...(fallback || {}),
            ...payload,
            Id: pick(payload, ['Id', 'id', 'OrderId', 'orderId']) || pick(fallback, ['Id', 'id', 'OrderId', 'orderId']),
            ServiceName: pick(payload, ['ServiceName', 'serviceName']) || pick(fallback, ['ServiceName', 'serviceName']),
            TechnicianName: pick(payload, ['TechnicianName', 'technicianName']) || pick(fallback, ['TechnicianName', 'technicianName']),
            Title: pick(payload, ['Title', 'title']) || pick(fallback, ['Title', 'title']),
            Description: pick(payload, ['Description', 'description']) || pick(fallback, ['Description', 'description']),
            Address: pick(payload, ['Address', 'address']) || pick(fallback, ['Address', 'address']),
            City: pick(payload, ['City', 'city']) || pick(fallback, ['City', 'city']),
            Status: pick(payload, ['Status', 'status']) || pick(fallback, ['Status', 'status']),
            EstimatedTime: pick(payload, ['EstimatedTime', 'estimatedTime', 'eta', 'ETA', 'estimatedMinutes', 'EstimatedMinutes']) || pick(fallback, ['EstimatedTime', 'estimatedTime', 'eta', 'ETA', 'estimatedMinutes', 'EstimatedMinutes']),
            CreateAt: pick(payload, ['CreateAt', 'createAt', 'CreatedAt', 'createdAt', 'OrderDate', 'orderDate']) || pick(fallback, ['CreateAt', 'createAt', 'CreatedAt', 'createdAt', 'OrderDate', 'orderDate']),
            ImageUrls: imageUrls,
            imageUrls: imageUrls
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
                const rawDetail = res?.data || res || {};
                setDetail(normalizeDetailPayload(rawDetail, order));
            } catch {
                setDetail(normalizeDetailPayload(order, order));
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetail();
    }, [order]);

    const data = detail || order;

    const status = String(pick(data, ['status', 'Status']) || '—');
    const fallbackEtaSource = pick(order, ['EstimatedTime', 'estimatedTime', 'eta', 'ETA', 'estimatedMinutes', 'EstimatedMinutes']);
    const fallbackCreatedAt = pick(order, ['CreatedAt', 'createdAt', 'CreateAt', 'createAt', 'OrderDate', 'orderDate']);
    const detailEtaSource = pick(data, ['EstimatedTime', 'estimatedTime', 'eta', 'ETA', 'estimatedMinutes', 'EstimatedMinutes']);
    const detailCreatedAt = pick(data, ['CreatedAt', 'createdAt', 'CreateAt', 'createAt', 'OrderDate', 'orderDate']);
    const etaValue = buildEtaWindowText(
        detailEtaSource || fallbackEtaSource,
        detailCreatedAt || fallbackCreatedAt
    ) || '—';
    const orderCode = String(pick(data, ['id', 'Id']) || '—');

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
            <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 18 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 18 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-2xl bg-[#111521]/95 backdrop-blur-2xl border border-white/10 rounded-[28px] shadow-[0_30px_90px_rgba(0,0,0,0.55)] overflow-hidden"
            >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-green-500" />

                <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-5 border-b border-white/8">
                    <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-[0.28em] text-blue-300/80 font-semibold">Chi tiết đơn hàng</p>
                        <h2 className="text-2xl font-bold text-white mt-1">{pick(data, ['title', 'Title']) || 'Yêu cầu sửa chữa'}</h2>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-300">
                            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">{status || '—'}</span>
                            <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">ETA: {etaValue}</span>
                        </div>
                    </div>
                    <Button variant="ghost" onClick={onClose} className="text-zinc-400 hover:text-white hover:bg-white/5 rounded-full">Đóng</Button>
                </div>

                {isLoading ? (
                    <div className="py-14 flex justify-center"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
                ) : (
                    <div className="p-6 space-y-4 max-h-[72vh] overflow-y-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                                <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Dịch vụ</p>
                                <p className="mt-2 text-white font-semibold">{pick(data, ['serviceName', 'ServiceName']) || '—'}</p>
                            </div>
                            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                                <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Kỹ thuật viên</p>
                                <p className="mt-2 text-white font-semibold truncate">{pick(data, ['technicianName', 'TechnicianName']) || '—'}</p>
                            </div>
                            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                                <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Thời gian tạo</p>
                                <p className="mt-2 text-white font-semibold">{formatDateTime(pick(data, ['CreateAt', 'createAt', 'createdAt', 'CreatedAt', 'orderDate', 'OrderDate']))}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="rounded-2xl bg-[#161b28] border border-white/10 p-4">
                                <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 mb-2">Mô tả sự cố</p>
                                <p className="text-sm leading-relaxed text-zinc-100 whitespace-pre-wrap">{pick(data, ['description', 'Description']) || '—'}</p>
                            </div>
                            <div className="rounded-2xl bg-[#161b28] border border-white/10 p-4">
                                <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 mb-2">Địa chỉ</p>
                                <p className="text-sm leading-relaxed text-zinc-100">{pick(data, ['address', 'Address']) || '—'}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Trạng thái</p>
                                <div className="mt-2">
                                    <StatusBadge status={String(status || '')} />
                                </div>
                            </div>
                            <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 p-4">
                                <p className="text-[11px] uppercase tracking-[0.18em] text-blue-200/80">ETA</p>
                                <p className="mt-2 text-3xl font-black leading-none text-white">{etaValue}</p>

                            </div>
                        </div>

                        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 mb-3">Tệp đính kèm</p>
                            {(() => {
                                const imageUrlsRaw = pick(data, ['ImageUrls', 'imageUrls']);
                                const images = Array.isArray(imageUrlsRaw)
                                    ? imageUrlsRaw.map(normalizeAttachmentUrl).filter(Boolean)
                                    : (typeof imageUrlsRaw === 'string' ? [imageUrlsRaw] : []);
                                const validImages = images.filter(isLikelyImageUrl);

                                if (validImages.length === 0) return <p className="text-white/70 text-sm">Chưa có ảnh đính kèm.</p>;

                                return (
                                    <div>
                                        <p className="text-sm text-zinc-400 mb-2">Ảnh</p>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {validImages.map((img: string, idx: number) => (
                                                <a key={`${img}-${idx}`} href={String(img)} target="_blank" rel="noreferrer" className="block">
                                                    <img
                                                        src={String(img)}
                                                        alt={`Order attachment ${idx + 1}`}
                                                        className="w-full h-32 object-cover rounded-2xl border border-white/10 hover:opacity-90 transition-opacity"
                                                    />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}
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
    const s = String(status || '').toLowerCase().replace(/\s+/g, '-');
    let color = 'bg-white/10 text-white border-white/30';
    let label = 'Chờ xác nhận';

    if (s === 'pending' || s === 'pending-confirmation') { color = 'bg-zinc-500/10 text-zinc-300 border-zinc-500/20'; label = 'Chờ xác nhận'; }
    else if (s === 'confirmed') { color = 'bg-blue-500/10 text-blue-400 border-blue-500/20'; label = 'Đã xác nhận'; }
    else if (s === 'accepted') { color = 'bg-blue-500/10 text-blue-400 border-blue-500/20'; label = 'Đã tiếp nhận'; }
    else if (s === 'in-progress' || s === 'inprogress') { color = 'bg-amber-500/10 text-amber-400 border-amber-500/20'; label = 'Đang thực hiện'; }
    else if (s === 'completed' || s === 'done') { color = 'bg-green-500/10 text-green-400 border-green-500/20'; label = 'Hoàn thành'; }
    else if (s === 'cancelled' || s === 'canceled') { color = 'bg-red-500/10 text-red-400 border-red-500/20'; label = 'Đã hủy'; }
    else if (s === 'rejected') { color = 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20'; label = 'Đã bị từ chối'; }

    return <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${color}`}>{label}</span>;
}
