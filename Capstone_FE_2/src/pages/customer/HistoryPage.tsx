import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Calendar, ArrowRight, Loader2, ClipboardList, Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useAuthStore from '@/store/authStore';
import orderService from '@/services/orderService';
import ratingService from '@/services/ratingService';
import toast from 'react-hot-toast';

function normalizeStatus(raw: string) {
  return (raw || '').toLowerCase().replace(/\s+/g, '-');
}

function pick(obj: any, keys: string[]) {
  for (const key of keys) {
    const v = obj?.[key];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return '';
}

export default function HistoryPage() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [ratingMap, setRatingMap] = useState<Record<string, { hasFeedback: boolean; score?: number; feedback?: string }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const historyOrders = useMemo(() => {
    return orders
      .filter((o) => {
        const s = normalizeStatus(pick(o, ['status', 'Status']));
        return s === 'completed' || s === 'done';
      })
      .sort((a, b) => {
        const ta = new Date(pick(a, ['orderDate', 'OrderDate', 'createdAt', 'CreatedAt', 'createAt', 'CreateAt']) || 0).getTime();
        const tb = new Date(pick(b, ['orderDate', 'OrderDate', 'createdAt', 'CreatedAt', 'createAt', 'CreateAt']) || 0).getTime();
        return tb - ta;
      });
  }, [orders]);

  const loadData = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [historyRes, ratingsRes] = await Promise.all([
        orderService.getOrderHistory(user.id),
        ratingService.viewRatings(user.id)
      ]);

      const historyDataRemote = Array.isArray(historyRes) ? historyRes : (historyRes.items || historyRes.data || []);

      const localCompletedOrders = (() => {
        try {
          const parsed = JSON.parse(localStorage.getItem('ff_customer_local_orders') || '[]');
          const arr = Array.isArray(parsed) ? parsed : [];
          return arr
            .filter((o: any) => String(o.customerId || '') === String(user.id || ''))
            .filter((o: any) => {
              const s = normalizeStatus(String(o.status || ''));
              return s === 'completed' || s === 'done';
            })
            .map((o: any) => ({
              id: o.id,
              Id: o.id,
              orderId: o.id,
              OrderId: o.id,
              technicianId: o.technicianId,
              TechnicianId: o.technicianId,
              technicianName: o.technicianName,
              TechnicianName: o.technicianName,
              serviceName: o.serviceName,
              ServiceName: o.serviceName,
              title: o.title,
              Title: o.title,
              description: o.description,
              Description: o.description,
              address: o.address,
              Address: o.address,
              status: o.status,
              Status: o.status,
              orderDate: o.createdAt,
              OrderDate: o.createdAt,
              source: o.source || 'local'
            }));
        } catch {
          return [];
        }
      })();

      const historyData = [...historyDataRemote, ...localCompletedOrders];
      const remoteRatings = Array.isArray(ratingsRes) ? ratingsRes : (ratingsRes.items || ratingsRes.data || []);
      const localRatings = (() => {
        try {
          const parsed = JSON.parse(localStorage.getItem('ff_customer_local_reviews') || '[]');
          const arr = Array.isArray(parsed) ? parsed : [];
          return arr.filter((r: any) => String(r.customerId || '') === String(user.id || ''));
        } catch {
          return [];
        }
      })();

      const ratings = [...remoteRatings, ...localRatings];

      const map: Record<string, { hasFeedback: boolean; score?: number; feedback?: string }> = {};
      ratings.forEach((r: any) => {
        const orderId = pick(r, ['orderId', 'OrderId']);
        if (orderId) {
          map[String(orderId)] = {
            hasFeedback: true,
            score: Number(pick(r, ['score', 'Score', 'rating'])) || undefined,
            feedback: String(pick(r, ['feedback', 'Feedback', 'reviewText', 'content']) || '') || undefined
          };
        }
      });

      setOrders(historyData);
      setRatingMap(map);
    } catch {
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const openDetail = async (order: any) => {
    const orderId = String(pick(order, ['orderId', 'OrderId', 'id', 'Id']));
    if (!ratingMap[orderId]) {
      try {
        const check = await ratingService.isFeedback(orderId);
        const isDone = Boolean(check?.data ?? check?.isFeedback ?? check?.hasFeedback ?? check);
        setRatingMap((prev) => ({
          ...prev,
          [orderId]: {
            hasFeedback: isDone,
            score: prev[orderId]?.score
          }
        }));
      } catch {
        // ignore
      }
    }
    setSelectedOrder(order);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-green-500" />
          Lịch sử Dịch vụ
        </h1>
        <p className="text-muted-foreground mt-2">Các dịch vụ sửa chữa đã được hoàn tất thành công.</p>
      </div>

      <div className="bg-[#0a1122] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#050b18] border-b border-white/5 text-zinc-400 text-sm tracking-wider uppercase">
                <th className="px-6 py-4 font-semibold">Mã Đơn</th>
                <th className="px-6 py-4 font-semibold">Dịch Vụ</th>
                <th className="px-6 py-4 font-semibold">Thời Gian</th>
                <th className="px-6 py-4 font-semibold">Thợ</th>
                <th className="px-6 py-4 font-semibold">Trạng thái đánh giá</th>
                <th className="px-6 py-4 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-zinc-400">
                    <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Đang tải lịch sử...
                  </td>
                </tr>
              ) : historyOrders.length > 0 ? (
                historyOrders.map((item) => {
                  const orderId = String(pick(item, ['orderId', 'OrderId', 'id', 'Id']));
                  const ratingInfo = ratingMap[orderId];
                  const hasRated = Boolean(ratingInfo?.hasFeedback);
                  return (
                    <tr key={orderId} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className="bg-white/5 text-zinc-300 font-medium px-2.5 py-1 rounded text-sm group-hover:bg-primary/10 group-hover:text-primary-light transition-colors">
                          {orderId.slice(0, 8)}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-white font-medium">{pick(item, ['serviceName', 'ServiceName']) || '—'}</td>
                      <td className="px-6 py-5 text-zinc-400">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-zinc-500" />
                          {new Date(pick(item, ['orderDate', 'OrderDate', 'createdAt', 'CreatedAt']) || Date.now()).toLocaleString('vi-VN')}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-zinc-400 text-sm">{pick(item, ['technicianName', 'TechnicianName']) || '—'}</td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-lg border text-xs font-semibold ${hasRated ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
                          {hasRated ? 'Đã đánh giá' : 'Chưa đánh giá'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary-light hover:bg-primary/10 transition-colors" onClick={() => openDetail(item)}>
                          Chi tiết <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-zinc-500">
                    <ClipboardList className="w-5 h-5 inline mr-2" /> Chưa có lịch sử hoàn thành
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedOrder && (
          <HistoryDetailModal
            order={selectedOrder}
            ratingInfo={ratingMap[String(pick(selectedOrder, ['orderId', 'OrderId', 'id', 'Id']))]}
            onClose={() => setSelectedOrder(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function HistoryDetailModal({ order, ratingInfo, onClose }: { order: any; ratingInfo?: { hasFeedback: boolean; score?: number; feedback?: string }; onClose: () => void }) {
  const [detail, setDetail] = useState<any>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(true);

  const orderId = String(pick(order, ['orderId', 'OrderId', 'id', 'Id']));

  useEffect(() => {
    const loadDetail = async () => {
      setIsLoadingDetail(true);
      try {
        const res = await orderService.getOrderDetail(orderId);
        setDetail(res?.data || res || order);
      } catch {
        setDetail(order);
      } finally {
        setIsLoadingDetail(false);
      }
    };

    if (orderId) loadDetail();
  }, [orderId]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-bg-card/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-6"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-white"><X size={18} /></button>
        <h3 className="text-xl font-bold text-white mb-1">Chi tiết lịch sử đơn hàng</h3>
        <p className="text-sm text-zinc-400 mb-5">Đơn #{orderId.slice(0, 8)} · {pick(order, ['serviceName', 'ServiceName']) || '—'}</p>

        {isLoadingDetail ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 md:col-span-2">
              <p className="text-zinc-500 mb-1">Tiêu đề</p>
              <p className="text-white">{pick(detail || order, ['title', 'Title']) || '—'}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-zinc-500 mb-1">Dịch vụ</p>
              <p className="text-white">{pick(detail || order, ['serviceName', 'ServiceName']) || '—'}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-zinc-500 mb-1">Trạng thái</p>
              <p className="text-white">{pick(detail || order, ['status', 'Status']) || '—'}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 md:col-span-2">
              <p className="text-zinc-500 mb-1">Mô tả</p>
              <p className="text-white whitespace-pre-wrap">{pick(detail || order, ['description', 'Description']) || '—'}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 md:col-span-2">
              <p className="text-zinc-500 mb-1">Địa chỉ</p>
              <p className="text-white">{pick(detail || order, ['address', 'Address']) || '—'}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-zinc-500 mb-1">Kỹ thuật viên</p>
              <p className="text-white">{pick(detail || order, ['technicianName', 'TechnicianName']) || '—'}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-zinc-500 mb-1">Đánh giá</p>
              <p className="text-white">{ratingInfo?.hasFeedback ? `Đã đánh giá (${ratingInfo?.score || '—'} sao)` : 'Chưa đánh giá'}</p>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
