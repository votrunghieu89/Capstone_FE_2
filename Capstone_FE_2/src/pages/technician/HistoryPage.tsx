import { useState, useEffect, useMemo, Fragment } from 'react';
import {
  Calendar, ChevronDown, Star, Download, CheckCircle2,
  User as UserIcon, Loader2, Clock, MapPin, MessageSquare,
  Refrigerator, Droplets, Zap, RotateCw, XCircle, ShieldAlert,
  Activity, Eye, X, ChevronLeft, ChevronRight, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/authStore';
import technicianOrderService from '@/services/technicianOrderService';
import technicianService from '@/services/technicianService';
import { statisticService } from '@/services/statisticService';
import type { ViewOrderDTO, ViewOrderDetailDTO } from '@/types/order';
import type { RatingOverviewDTO } from '@/types/technician';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

type TabType = 'all' | 'completed' | 'canceled' | 'rejected' | 'ratings';

interface ExtendedOrderDTO extends ViewOrderDTO {
  category: 'completed' | 'canceled' | 'rejected';
  rating?: number;
  feedback?: string;
}

export default function TechHistoryPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') as TabType || 'all';

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  useEffect(() => {
    const tab = searchParams.get('tab') as TabType;
    if (tab && tab !== activeTab && ['all', 'completed', 'canceled', 'rejected', 'ratings'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const [items, setItems] = useState<ExtendedOrderDTO[]>([]);
  const [ratingsList, setRatingsList] = useState<any[]>([]);
  const [ratingOverview, setRatingOverview] = useState<RatingOverviewDTO | null>(null);

  const [stats, setStats] = useState({ totalOrders: 0, avgRating: 0, totalCompleted: 0, totalCanceled: 0, totalRejected: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingData, setLoadingData] = useState(false);

  // Filters & Pagination
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  // Modal Detail State
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderDetail, setOrderDetail] = useState<ViewOrderDetailDTO | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (user?.id) loadStats();
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) fetchTabData();
    setCurrentPage(1); // Reset page on tab change
  }, [activeTab, user?.id]);

  const loadStats = async () => {
    if (!user?.id) return;
    try {
      setLoadingStats(true);
      const [total, avg, completed, overview, canceled, rejected] = await Promise.allSettled([
        technicianService.getTotalOrders(user.id),
        technicianService.getAvgRating(user.id),
        technicianService.getTotalCompleted(user.id),
        technicianService.getRatingOverview(user.id),
        statisticService.getTotalCanceled(user.id),
        statisticService.getTotalRejected(user.id)
      ]);
      setStats({
        totalOrders: total.status === 'fulfilled' ? total.value : 0,
        avgRating: avg.status === 'fulfilled' ? avg.value : 0,
        totalCompleted: completed.status === 'fulfilled' ? completed.value : 0,
        totalCanceled: canceled.status === 'fulfilled' ? canceled.value : 0,
        totalRejected: rejected.status === 'fulfilled' ? rejected.value : 0
      });
      if (overview.status === 'fulfilled') setRatingOverview(overview.value);
    } catch (e) {
      console.error("General Stats Fetch Error:", e);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchTabData = async () => {
    if (!user?.id) return;
    setLoadingData(true);
    setItems([]);
    try {
      const rawRatings: any = await technicianService.getRatings(user.id).catch(() => []);
      const rr: any = rawRatings as any;
      const allRatings = Array.isArray(rr) ? rr : (rr && (rr.value || rr.data || rr.$values) ? (rr.value || rr.data || rr.$values) : []);

      // Sort ratings latest first
      const sortedRatings = [...allRatings].sort((a, b) => {
        const bt = new Date((b as any)?.createdAt || (b as any)?.CreatedAt || 0).getTime();
        const at = new Date((a as any)?.createdAt || (a as any)?.CreatedAt || 0).getTime();
        return bt - at;
      });
      setRatingsList(sortedRatings);

      const getRatingInfoForOrder = (orderId: string) => {
        const r = allRatings.find((x: any) => String(x?.orderId || x?.OrderId || '') === String(orderId || ''));
        return r
          ? {
            rating: Number((r as any)?.score ?? (r as any)?.Score ?? 0) || undefined,
            feedback: String((r as any)?.feedback ?? (r as any)?.Feedback ?? '') || undefined,
          }
          : { rating: undefined, feedback: undefined };
      };

      if (activeTab === 'all') {
        const [completed, canceled, rejected] = await Promise.all([
          technicianOrderService.getHistoryOrders(user.id).catch(() => []),
          technicianOrderService.getCanceledOrders(user.id).catch(() => []),
          technicianOrderService.getRejectedOrders(user.id).catch(() => [])
        ]);

        const merged: ExtendedOrderDTO[] = [
          ...(completed || []).map(o => ({ ...o, category: 'completed' as const, ...getRatingInfoForOrder(o.orderId) })),
          ...(canceled || []).map(o => ({ ...o, category: 'canceled' as const })),
          ...(rejected || []).map(o => ({ ...o, category: 'rejected' as const }))
        ];

        // Sort by date desc
        merged.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
        setItems(merged);
      } else {
        let res: ViewOrderDTO[] = [];
        let cat: 'completed' | 'canceled' | 'rejected' = 'completed';

        if (activeTab === 'completed') {
          res = await technicianOrderService.getHistoryOrders(user.id);
          cat = 'completed';
        } else if (activeTab === 'canceled') {
          res = await technicianOrderService.getCanceledOrders(user.id);
          cat = 'canceled';
        } else if (activeTab === 'rejected') {
          res = await technicianOrderService.getRejectedOrders(user.id);
          cat = 'rejected';
        }

        const mapped = (res || []).map(o => ({
          ...o,
          category: cat,
          ...(cat === 'completed' ? getRatingInfoForOrder(o.orderId) : {})
        }));
        mapped.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
        setItems(mapped);
      }
    } catch (e) {
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoadingData(false);
    }
  };

  // Filter & Pagination Logic
  const filteredItems = useMemo(() => {
    if (activeTab === 'ratings') {
      return ratingsList.filter(item => {
        if (startDate) {
          const itemDate = new Date(item.createdAt);
          itemDate.setHours(0, 0, 0, 0);
          const filterStart = new Date(startDate);
          filterStart.setHours(0, 0, 0, 0);
          if (itemDate < filterStart) return false;
        }
        if (endDate) {
          const itemDate = new Date(item.createdAt);
          itemDate.setHours(0, 0, 0, 0);
          const filterEnd = new Date(endDate);
          filterEnd.setHours(0, 0, 0, 0);
          if (itemDate > filterEnd) return false;
        }
        return true;
      });
    }

    return items.filter(item => {
      if (startDate) {
        const itemDate = new Date(item.orderDate);
        itemDate.setHours(0, 0, 0, 0);
        const filterStart = new Date(startDate);
        filterStart.setHours(0, 0, 0, 0);
        if (itemDate < filterStart) return false;
      }
      if (endDate) {
        const itemDate = new Date(item.orderDate);
        itemDate.setHours(0, 0, 0, 0);
        const filterEnd = new Date(endDate);
        filterEnd.setHours(0, 0, 0, 0);
        if (itemDate > filterEnd) return false;
      }
      return true;
    });
  }, [items, ratingsList, startDate, endDate, activeTab]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const currentItems = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleClearDateFilter = () => {
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const openDetailModal = async (orderId: string) => {
    setSelectedOrderId(orderId);
    setLoadingDetail(true);
    setOrderDetail(null);
    try {
      // Technician history should call technician detail endpoint
      const res = await technicianOrderService.getOrderDetail(orderId);
      const raw = res?.value || res?.data || res;
      const data = raw
        ? {
          ...raw,
          ImageUrls: raw.imageUrls || raw.ImageUrls || [],
          videoUrl: raw.videoUrl || raw.VideoUrl || '',
          cityName: raw.cityName || raw.city || '',
        }
        : null;
      setOrderDetail(data);
    } catch (error) {
      console.error(error);
      toast.error('Không thể tải chi tiết đơn hàng');
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeDetailModal = () => {
    setSelectedOrderId(null);
    setOrderDetail(null);
  };

  // UI Helpers
  const getBadgeStyle = (category: 'completed' | 'canceled' | 'rejected') => {
    switch (category) {
      case 'completed': return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case 'canceled': return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      case 'rejected': return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      default: return "bg-slate-500/10 text-slate-500 border-slate-500/20";
    }
  };

  const getBadgeText = (category: 'completed' | 'canceled' | 'rejected') => {
    switch (category) {
      case 'completed': return "Hoàn thành";
      case 'canceled': return "Đã hủy";
      case 'rejected': return "Từ chối";
      default: return "Chưa cập nhật";
    }
  };



  if (loadingStats) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0b14]">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0b14] text-slate-300 p-8 space-y-10 pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
        <div className="flex items-center gap-12">
          <h1 className="text-3xl font-black text-white tracking-tighter shadow-sm">LỊCH SỬ HOẠT ĐỘNG</h1>
        </div>


      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="bg-[#11121d] rounded-[32px] p-8 border border-white/[0.03] relative overflow-hidden group shadow-2xl shadow-black/40">
          <div className="space-y-6 relative z-10">
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              HOÀN THÀNH
            </p>
            <div className="flex flex-col gap-3">
              <span className="text-6xl font-black text-white leading-none tracking-tighter">{stats.totalCompleted}</span>
              <div className="w-full">
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.4)] transition-all duration-1000"
                    style={{ width: `${stats.totalOrders > 0 ? (stats.totalCompleted / stats.totalOrders) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">
                  Đơn đã hoàn thành
                </p>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-30 group-hover:scale-110 transition-all duration-700 pointer-events-none">
            <CheckCircle2 size={80} className="text-emerald-500" />
          </div>
        </div>

        {/* Canceled Card */}
        <div className="bg-[#11121d] rounded-[32px] p-8 border border-white/[0.03] relative overflow-hidden group shadow-2xl shadow-black/40">
          <div className="space-y-6 relative z-10">
            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
              ĐƠN BỊ HỦY
            </p>
            <div className="flex flex-col gap-3">
              <span className="text-6xl font-black text-white leading-none tracking-tighter">{stats.totalCanceled}</span>
              <div className="w-full">
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-rose-500 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.4)] transition-all duration-1000"
                    style={{ width: `${stats.totalOrders > 0 ? (stats.totalCanceled / stats.totalOrders) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">
                  Đơn bị hủy
                </p>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-30 group-hover:scale-110 transition-all duration-700 pointer-events-none">
            <XCircle size={80} className="text-rose-500" />
          </div>
        </div>

        {/* Rejected Card */}
        <div className="bg-[#11121d] rounded-[32px] p-8 border border-white/[0.03] relative overflow-hidden group shadow-2xl shadow-black/40">
          <div className="space-y-6 relative z-10">
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
              TỪ CHỐI
            </p>
            <div className="flex flex-col gap-3">
              <span className="text-6xl font-black text-white leading-none tracking-tighter">{stats.totalRejected}</span>
              <div className="w-full">
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.4)] transition-all duration-1000"
                    style={{ width: `${stats.totalOrders > 0 ? (stats.totalRejected / stats.totalOrders) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">
                  Đơn từ chối
                </p>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-30 group-hover:scale-110 transition-all duration-700 pointer-events-none">
            <ShieldAlert size={80} className="text-orange-500" />
          </div>
        </div>

        <div className="bg-[#11121d] rounded-[32px] p-8 border border-white/[0.03] shadow-2xl shadow-black/40 overflow-hidden relative group">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 relative z-10">Đánh giá độ uy tín</p>
          <div className="flex items-center gap-6 relative z-10">
            <span className="text-6xl font-black text-white leading-none tracking-tighter drop-shadow-xl">
              {ratingOverview && (ratingOverview.totalRating > 0 || (ratingOverview as any).TotalRating > 0)
                ? (ratingOverview.avgScore ?? (ratingOverview as any).AvgScore).toFixed(1)
                : (stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "5.0")}
            </span>
            <div className="space-y-2.5">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const currentScore = (ratingOverview && (ratingOverview.totalRating > 0 || (ratingOverview as any).TotalRating > 0))
                    ? (ratingOverview.avgScore ?? (ratingOverview as any).AvgScore)
                    : (stats.avgRating > 0 ? stats.avgRating : 5);
                  return (
                    <Star
                      key={star}
                      size={18}
                      className={cn(
                        "fill-amber-400 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]",
                        star > Math.round(currentScore) && "opacity-20 fill-transparent drop-shadow-none"
                      )}
                    />
                  );
                })}
              </div>
              <p className="text-[9px] text-amber-400/80 font-bold uppercase tracking-widest">Từ {ratingOverview?.totalRating ?? (ratingOverview as any)?.TotalRating ?? 0} lượt phản hồi</p>
            </div>
          </div>
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-30 group-hover:-rotate-12 group-hover:scale-110 transition-all duration-700">
            <Star size={80} className="text-amber-500 fill-amber-500" />
          </div>
        </div>


      </div>

      {/* Main Content Area */}
      <div className="space-y-6 pt-6">

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 border-b border-white/[0.05] pb-4">
          {/* Filter Tabs */}
          <div className="flex items-center gap-4 overflow-x-auto custom-scrollbar pb-2">
            {[
              { id: 'all', label: 'Tất cả', icon: Activity },
              { id: 'completed', label: 'Hoàn thành', icon: CheckCircle2 },
              { id: 'canceled', label: 'Đã hủy', icon: XCircle },
              { id: 'rejected', label: 'Từ chối', icon: ShieldAlert },
              { id: 'ratings', label: 'Đánh giá', icon: Star },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={cn(
                  "flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap shadow-xl border focus:outline-none",
                  activeTab === tab.id
                    ? "bg-blue-600 border-blue-500 text-white shadow-[0_4px_20px_rgba(37,99,235,0.4)]"
                    : "bg-[#11121d] border-transparent text-slate-500 hover:text-slate-300 hover:bg-[#1a1b26]"
                )}
              >
                <tab.icon size={16} className={cn(activeTab === tab.id ? "text-white" : "text-slate-600")} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Actions & Filters */}
          <div className="flex flex-wrap items-center gap-4 shrink-0">
            {/* Date Range Picker */}
            <div className="flex items-center gap-2 bg-[#11121d] px-3 py-2 rounded-2xl border border-white/[0.05] shadow-xl">
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="text-slate-500 ml-2 uppercase text-[10px] tracking-widest">Từ</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-[#1a1b26] border border-white/10 rounded-lg px-2 py-1.5 text-slate-300 outline-none focus:border-blue-500"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="text-slate-500 uppercase text-[10px] tracking-widest">Đến</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-[#1a1b26] border border-white/10 rounded-lg px-2 py-1.5 text-slate-300 outline-none focus:border-blue-500"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              {(startDate || endDate) && (
                <button
                  onClick={handleClearDateFilter}
                  className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors ml-1"
                  title="Xóa bộ lọc"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <button
              onClick={fetchTabData}
              disabled={loadingData}
              className="flex items-center justify-center w-12 h-12 bg-[#11121d] rounded-[16px] border border-white/[0.05] text-slate-400 hover:text-white transition-all active:scale-95 shadow-xl"
              title="Làm mới dữ liệu"
            >
              <RotateCw size={18} className={cn(loadingData && "animate-spin text-blue-500")} />
            </button>
          </div>
        </div>

        {/* List Render */}
        {loadingData ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Đang tải dữ liệu...</p>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-10">
            {currentItems.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[32px] bg-[#11121d]/50">
                <FileText size={48} className="mx-auto text-slate-600 mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Không có đơn hàng nào phù hợp với điều kiện tìm kiếm.</p>
              </div>
            ) : (
              <>
                {activeTab === 'ratings' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentItems.map((rating: any, index: number) => (
                      <div key={rating.ratingId || rating.feedbackId || index} className="bg-[#11121d] p-6 rounded-2xl border border-white/5 shadow-xl flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#1a1b26] flex items-center justify-center border border-white/10 shrink-0">
                              <UserIcon size={16} className="text-slate-400" />
                            </div>
                            <div>
                              <h4 className="font-bold text-white text-sm">{rating.customerName || rating.customerFullName || 'Khách hàng'}</h4>
                              <span className="text-[10px] text-slate-500 font-medium">
                                {rating.createdAt ? format(new Date(rating.createdAt), 'dd/MM/yyyy HH:mm') : '-'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                            <span className="text-amber-500 font-black mr-1 text-xs">{rating.score}</span>
                            <Star size={12} className="fill-amber-400 text-amber-400" />
                          </div>
                        </div>
                        <div className="bg-black/20 p-4 rounded-xl border border-white/[0.02] grow">
                          <p className="text-sm text-slate-300 italic">
                            {rating.feedback ? `"${rating.feedback}"` : "Không để lại lời bình luận"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                      <thead>
                        <tr className="border-b border-white/10 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          <th className="pb-3 px-4">Mã đơn</th>
                          <th className="pb-3 px-4">Khách hàng</th>
                          <th className="pb-3 px-4">Dịch vụ</th>
                          <th className="pb-3 px-4">Ngày tạo</th>
                          <th className="pb-3 px-4">Thời gian</th>
                          <th className="pb-3 px-4">Trạng thái</th>
                          <th className="pb-3 px-4 text-center">Đánh giá</th>
                          <th className="pb-3 px-4 text-center">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.02]">
                        {currentItems.map((item) => (
                          <Fragment key={item.orderId}>
                            <tr className="group hover:bg-[#11121d] transition-colors duration-200">
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-300">
                                    #{item.orderId.slice(0, 8).toUpperCase()}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-[#1a1b26] flex items-center justify-center border border-white/10 shrink-0">
                                    <UserIcon size={14} className="text-slate-400" />
                                  </div>
                                  <span className="font-bold text-white text-sm">{item.customerName || 'Ẩn danh'}</span>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <span className="text-sm font-semibold text-slate-300">{item.serviceName || item.title || 'Dịch vụ'}</span>
                              </td>
                              <td className="py-4 px-4">
                                <span className="text-sm text-slate-400 font-medium">
                                  {item.orderDate ? format(new Date(item.orderDate), 'dd/MM/yyyy') : '-'}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <span className="font-bold text-white text-sm">
                                  {item.orderDate ? format(new Date(item.orderDate), 'HH:mm') : '-'}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <span className={cn("px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border", getBadgeStyle(item.category))}>
                                  {getBadgeText(item.category)}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-center">
                                {item.category === 'completed' && item.rating ? (
                                  <div className="flex items-center justify-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        size={14}
                                        className={cn(
                                          "fill-amber-400 text-amber-400",
                                          star > item.rating! && "opacity-20 fill-transparent text-amber-400/50"
                                        )}
                                      />
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-slate-600 font-bold">-</span>
                                )}
                              </td>
                              <td className="py-4 px-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => openDetailModal(item.orderId)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest hover:bg-blue-500/20 transition-colors"
                                >
                                  <Eye size={14} />
                                  Chi tiết
                                </button>
                              </td>
                            </tr>
                            <tr className="border-b border-white/[0.02]">
                              <td colSpan={8} className="px-4 pb-4 pt-1">
                                <div className="bg-black/20 p-3 rounded-xl ml-4 mr-4 flex flex-col gap-1.5 border border-white/[0.02]">
                                  <div className="flex items-center gap-2">
                                    <MessageSquare size={12} className="text-slate-500" />
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Nhận xét</span>
                                  </div>
                                  <p className="text-xs text-slate-400 italic pl-5">
                                    {item.category === 'completed'
                                      ? (item.feedback ? `"${item.feedback}"` : "Không có nhận xét")
                                      : "Không có nhận xét"}
                                  </p>
                                </div>
                              </td>
                            </tr>
                          </Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <p className="text-xs font-bold text-slate-500">
                      Hiển thị trang <span className="text-white">{currentPage}</span> / {totalPages} (Tổng số {filteredItems.length} đơn)
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg bg-[#11121d] border border-white/10 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      {Array.from({ length: totalPages }).map((_, i) => {
                        const page = i + 1;
                        // Show max 5 page buttons
                        if (totalPages > 5 && (page < currentPage - 2 || page > currentPage + 2)) {
                          if (page === 1 || page === totalPages) {
                            return <span key={page} className="text-slate-600 px-1">...</span>;
                          }
                          return null;
                        }
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={cn(
                              "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                              currentPage === page
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                                : "bg-[#11121d] border border-white/10 text-slate-400 hover:bg-[#1a1b26] hover:text-white"
                            )}
                          >
                            {page}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg bg-[#11121d] border border-white/10 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrderId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0f172a] border border-white/10 rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative"
            >
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between shrink-0 bg-[#11121d]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-lg tracking-tight">Chi tiết đơn hàng</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">#{selectedOrderId.slice(0, 8).toUpperCase()}</p>
                  </div>
                </div>
                <button
                  onClick={closeDetailModal}
                  className="w-8 h-8 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                {loadingDetail ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    <span className="text-xs font-bold text-slate-500 uppercase">Đang tải dữ liệu...</span>
                  </div>
                ) : orderDetail ? (
                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#1a1b26] p-4 rounded-2xl border border-white/5">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Dịch vụ</p>
                        <p className="font-bold text-white text-sm">{orderDetail.serviceName || orderDetail.title}</p>
                      </div>
                      <div className="bg-[#1a1b26] p-4 rounded-2xl border border-white/5">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Thời gian tạo</p>
                        <p className="font-bold text-white text-sm">{format(new Date(orderDetail.orderDate), 'dd/MM/yyyy HH:mm')}</p>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="bg-[#11121d] rounded-2xl p-5 border border-white/5 space-y-4">
                      <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest border-b border-white/5 pb-2">Thông tin Khách Hàng</h4>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#1a1b26] flex items-center justify-center text-slate-400 border border-white/10 shrink-0">
                          <UserIcon size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-white text-base">{orderDetail.customerName || 'Khách hàng'}</p>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">{orderDetail.customerPhone || 'Chưa cung cấp SĐT'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 mt-3 pt-3 border-t border-white/5">
                        <MapPin size={16} className="text-slate-500 shrink-0 mt-0.5" />
                        <p className="text-sm font-medium text-slate-300 leading-tight">{orderDetail.address}</p>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="bg-[#11121d] rounded-2xl p-5 border border-white/5">
                      <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest border-b border-white/5 pb-2 mb-3">Mô tả sự cố / Ghi chú</h4>
                      <p className="text-sm text-slate-300 italic bg-[#1a1b26] p-4 rounded-xl border border-white/5 leading-relaxed">
                        {orderDetail.description || 'Không có mô tả chi tiết từ khách hàng.'}
                      </p>
                    </div>

                    {/* Attachments if any */}
                    {orderDetail.ImageUrls && orderDetail.ImageUrls.length > 0 && (
                      <div className="bg-[#11121d] rounded-2xl p-5 border border-white/5">
                        <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-widest border-b border-white/5 pb-2 mb-3">Hình ảnh đính kèm</h4>
                        <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                          {orderDetail.ImageUrls.map((url, i) => (
                            <img key={i} src={url} alt={`Evidence ${i}`} className="h-24 w-24 object-cover rounded-xl border border-white/10" />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-10 text-center text-slate-500">Lỗi không thể lấy chi tiết đơn hàng</div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
