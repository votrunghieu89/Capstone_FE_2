import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar,
  CreditCard,
  Eye,
  Loader2,
  MapPin,
  Phone,
  ReceiptText,
  Search,
  UserRound,
  Wrench,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/authStore';
import orderService from '@/services/orderService';
import invoiceService, { type InvoiceDetail } from '@/services/invoiceService';

type CustomerInvoiceOrder = {
  orderId: string;
  technicianName: string;
  serviceName: string;
  title: string;
  status: string;
  orderDate?: string;
  totalAmount: number;
  paymentStatus: number;
  createdAt?: string;
};

const pick = (obj: any, keys: string[]) => {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return '';
};

const formatCurrency = (amount: number) =>
  amount.toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  });

const formatDateTime = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const getPaymentLabel = (status: number) => (status === 1 ? 'Đã thanh toán' : 'Chưa thanh toán');

export default function CustomerInvoicePage() {
  const { user } = useAuthStore();
  const [invoices, setInvoices] = useState<CustomerInvoiceOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<CustomerInvoiceOrder | null>(null);
  const [invoiceDetail, setInvoiceDetail] = useState<InvoiceDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [zoomedQrCode, setZoomedQrCode] = useState<string | null>(null);

  const filteredInvoices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return invoices;

    return invoices.filter((invoice) =>
      [invoice.orderId, invoice.serviceName, invoice.technicianName, invoice.title]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [invoices, searchQuery]);

  const paidCount = invoices.filter((invoice) => invoice.paymentStatus === 1).length;
  const unpaidCount = Math.max(invoices.length - paidCount, 0);
  const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);

  const loadInvoices = async () => {
    if (!user?.id) {
      setInvoices([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const historyRes = await orderService.getOrderHistory(user.id);
      const historyOrders = Array.isArray(historyRes) ? historyRes : (historyRes?.items || historyRes?.data || []);

      const invoiceRows = await Promise.all(
        historyOrders.map(async (order: any) => {
          const orderId = String(pick(order, ['orderId', 'OrderId', 'id', 'Id']) || '');
          if (!orderId) return null;

          try {
            const hasInvoice = await invoiceService.checkInvoice(orderId);
            if (!hasInvoice) return null;

            const detail = await invoiceService.getInvoiceDetail(orderId);
            return {
              orderId,
              technicianName: pick(order, ['technicianName', 'TechnicianName']) || detail.nameTechnician || 'Kỹ thuật viên',
              serviceName: pick(order, ['serviceName', 'ServiceName']) || detail.serviceName || 'Dịch vụ',
              title: pick(order, ['title', 'Title']) || detail.serviceName || 'Đơn sửa chữa',
              status: pick(order, ['status', 'Status']) || 'Completed',
              orderDate: pick(order, ['orderDate', 'OrderDate', 'createdAt', 'CreatedAt']),
              totalAmount: detail.totalAmount,
              paymentStatus: detail.paymentStatus,
              createdAt: detail.createdAt,
            };
          } catch (error) {
            console.warn('Failed to load customer invoice row:', error);
            return null;
          }
        })
      );

      setInvoices(
        invoiceRows
          .filter(Boolean)
          .sort((a, b) => new Date(b?.createdAt || b?.orderDate || 0).getTime() - new Date(a?.createdAt || a?.orderDate || 0).getTime()) as CustomerInvoiceOrder[]
      );
    } catch (error) {
      console.error('Failed to load customer invoices:', error);
      toast.error('Không thể tải danh sách hóa đơn');
      setInvoices([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [user?.id]);

  const openDetail = async (invoice: CustomerInvoiceOrder) => {
    setSelectedInvoice(invoice);
    setInvoiceDetail(null);
    setDetailLoading(true);

    try {
      const detail = await invoiceService.getInvoiceDetail(invoice.orderId);
      setInvoiceDetail(detail);
    } catch (error) {
      console.error('Failed to load invoice detail:', error);
      toast.error('Không thể tải chi tiết hóa đơn');
      setSelectedInvoice(null);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 text-white">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
            <ReceiptText className="h-8 w-8 text-primary" />
            Hóa đơn của tôi
          </h1>
          <p className="mt-2 text-zinc-400">Xem hóa đơn cho các đơn sửa chữa đã hoàn thành.</p>
        </div>

        <button
          onClick={loadInvoices}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-white/10"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ReceiptText className="h-4 w-4" />}
          Tải lại
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#0a1122] p-5 shadow-2xl shadow-black/20">
          <p className="text-sm text-zinc-400">Tổng hóa đơn</p>
          <p className="mt-2 text-3xl font-black">{invoices.length}</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 shadow-2xl shadow-black/20">
          <p className="text-sm text-emerald-200/80">Đã thanh toán</p>
          <p className="mt-2 text-3xl font-black text-emerald-300">{paidCount}</p>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 shadow-2xl shadow-black/20">
          <p className="text-sm text-amber-200/80">Chưa thanh toán</p>
          <p className="mt-2 text-3xl font-black text-amber-300">{unpaidCount}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#0a1122] p-5 shadow-2xl shadow-black/30">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold">Danh sách hóa đơn</h2>
            <p className="mt-1 text-sm text-zinc-500">Tổng giá trị: {formatCurrency(totalAmount)}</p>
          </div>

          <div className="relative w-full lg:w-96">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Tìm theo mã đơn, dịch vụ, thợ..."
              className="w-full rounded-2xl border border-white/10 bg-[#050b18] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-primary/50"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
            <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary" />
            <p>Đang tải danh sách hóa đơn...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] py-16 text-center">
            <ReceiptText className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
            <p className="font-semibold text-zinc-300">Chưa có hóa đơn phù hợp</p>
            <p className="mt-1 text-sm text-zinc-500">Hóa đơn sẽ xuất hiện khi kỹ thuật viên tạo hóa đơn cho đơn đã hoàn thành.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <div className="grid grid-cols-[1.2fr_1fr_150px_160px_110px] gap-4 bg-[#050b18] px-5 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">
              <span>Dịch vụ</span>
              <span>Thợ phụ trách</span>
              <span className="text-right">Tổng tiền</span>
              <span>Trạng thái</span>
              <span className="text-right">Thao tác</span>
            </div>

            <div className="divide-y divide-white/10">
              {filteredInvoices.map((invoice) => (
                <div key={invoice.orderId} className="grid grid-cols-[1.2fr_1fr_150px_160px_110px] gap-4 px-5 py-4 text-sm text-zinc-300 transition hover:bg-white/[0.03]">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{invoice.serviceName}</p>
                    <p className="mt-1 truncate text-xs text-zinc-500">Đơn #{invoice.orderId.slice(0, 8)} • {formatDateTime(invoice.orderDate)}</p>
                  </div>
                  <span className="truncate">{invoice.technicianName}</span>
                  <span className="text-right font-bold text-white">{formatCurrency(invoice.totalAmount)}</span>
                  <div>
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${invoice.paymentStatus === 1 ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-amber-500/30 bg-amber-500/10 text-amber-300'}`}>
                      {getPaymentLabel(invoice.paymentStatus)}
                    </span>
                  </div>
                  <div className="text-right">
                    <button
                      onClick={() => openDetail(invoice)}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary-light"
                    >
                      <Eye className="h-4 w-4" />
                      Xem
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedInvoice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={() => setSelectedInvoice(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              onClick={(event) => event.stopPropagation()}
              className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#08111f] shadow-2xl shadow-black/60"
            >
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <div>
                  <h3 className="text-xl font-bold">Chi tiết hóa đơn</h3>
                  <p className="mt-1 text-sm text-zinc-500">Đơn #{selectedInvoice.orderId.slice(0, 8)}</p>
                </div>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="rounded-full border border-white/10 p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {detailLoading ? (
                <div className="flex flex-col items-center justify-center py-24 text-zinc-400">
                  <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary" />
                  <p>Đang tải chi tiết hóa đơn...</p>
                </div>
              ) : invoiceDetail ? (
                <div className="max-h-[calc(90vh-90px)] overflow-y-auto p-6">
                  <div className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
                    <div className="space-y-5">
                      <div className="grid gap-4 md:grid-cols-2">
                        <InfoCard icon={UserRound} label="Khách hàng" value={invoiceDetail.nameCustomer || user?.fullName || 'Khách hàng'} />
                        <InfoCard icon={Wrench} label="Kỹ thuật viên" value={invoiceDetail.nameTechnician || selectedInvoice.technicianName} />
                        <InfoCard icon={Phone} label="Số điện thoại" value={invoiceDetail.customerPhone || '—'} />
                        <InfoCard icon={Calendar} label="Ngày tạo hóa đơn" value={formatDateTime(invoiceDetail.createdAt)} />
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                        <div className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-400">
                          <MapPin className="h-4 w-4 text-primary" />
                          Thông tin dịch vụ
                        </div>
                        <div className="grid gap-3 text-sm text-zinc-300 md:grid-cols-2">
                          <p><span className="text-zinc-500">Dịch vụ:</span> {invoiceDetail.serviceName || selectedInvoice.serviceName}</p>
                          <p><span className="text-zinc-500">Địa chỉ:</span> {invoiceDetail.adressOrder || '—'}</p>
                          <p><span className="text-zinc-500">Thành phố:</span> {invoiceDetail.cityNameOrder || '—'}</p>
                          <p><span className="text-zinc-500">Trạng thái:</span> {getPaymentLabel(invoiceDetail.paymentStatus)}</p>
                        </div>
                      </div>

                      <div className="overflow-hidden rounded-2xl border border-white/10">
                        <div className="grid grid-cols-[1fr_120px_90px_140px] gap-3 bg-[#050b18] px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
                          <span>Hạng mục</span>
                          <span className="text-right">Đơn giá</span>
                          <span className="text-right">SL</span>
                          <span className="text-right">Thành tiền</span>
                        </div>
                        <div className="divide-y divide-white/10 text-sm">
                          <div className="grid grid-cols-[1fr_120px_90px_140px] gap-3 px-4 py-3 text-zinc-300">
                            <span>Tiền công</span>
                            <span className="text-right">{formatCurrency(invoiceDetail.laborCost)}</span>
                            <span className="text-right">1</span>
                            <span className="text-right font-semibold text-white">{formatCurrency(invoiceDetail.laborCost)}</span>
                          </div>
                          {invoiceDetail.materials.map((material, index) => (
                            <div key={`${material.materialName}-${index}`} className="grid grid-cols-[1fr_120px_90px_140px] gap-3 px-4 py-3 text-zinc-300">
                              <span className="truncate">{material.materialName || `Vật liệu ${index + 1}`}</span>
                              <span className="text-right">{formatCurrency(material.price)}</span>
                              <span className="text-right">{material.quantity}</span>
                              <span className="text-right font-semibold text-white">{formatCurrency(material.subtotal)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div className="rounded-2xl border border-primary/20 bg-primary/10 p-5">
                        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary-light">
                          <CreditCard className="h-4 w-4" />
                          Thanh toán
                        </div>
                        <p className="mt-4 text-sm text-zinc-400">Tổng thanh toán</p>
                        <p className="mt-1 text-3xl font-black text-white">{formatCurrency(invoiceDetail.totalAmount)}</p>
                        <span className={`mt-4 inline-flex rounded-full border px-3 py-1 text-xs font-bold ${invoiceDetail.paymentStatus === 1 ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-amber-500/30 bg-amber-500/10 text-amber-300'}`}>
                          {getPaymentLabel(invoiceDetail.paymentStatus)}
                        </span>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center">
                        <p className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-400">Mã QR thanh toán</p>
                        {invoiceDetail.qrCode ? (
                          <button
                            type="button"
                            onClick={() => setZoomedQrCode(invoiceDetail.qrCode || null)}
                            className="mx-auto block rounded-2xl bg-white p-3 transition hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-primary"
                            title="Bấm để phóng to mã QR"
                          >
                            <img src={invoiceDetail.qrCode} alt="QR thanh toán" className="h-56 w-56 object-contain" />
                          </button>
                        ) : (
                          <div className="flex h-56 items-center justify-center rounded-2xl border border-dashed border-white/10 text-sm text-zinc-500">
                            Chưa có mã QR
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {zoomedQrCode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={() => setZoomedQrCode(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 12 }}
              onClick={(event) => event.stopPropagation()}
              className="relative rounded-3xl border border-white/10 bg-[#071022] p-5 shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setZoomedQrCode(null)}
                className="absolute -right-3 -top-3 rounded-full border border-white/10 bg-slate-900 p-2 text-slate-300 shadow-lg hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="rounded-2xl bg-white p-4">
                <img src={zoomedQrCode} alt="QR thanh toán phóng to" className="h-[min(72vh,520px)] w-[min(72vw,520px)] object-contain" />
              </div>
              <p className="mt-3 text-center text-sm text-slate-400">Mã QR thanh toán</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
        <Icon className="h-4 w-4 text-primary" />
        {label}
      </div>
      <p className="truncate font-semibold text-white">{value}</p>
    </div>
  );
}
