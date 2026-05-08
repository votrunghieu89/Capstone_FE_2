import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, FilePlus2, FilePenLine, Loader2, Plus, ReceiptText, Search, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/authStore';
import invoiceService, { BankOption, CompletedInvoiceOrder, InvoiceDetail } from '@/services/invoiceService';
import technicianOrderService from '@/services/technicianOrderService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type InvoiceStateMap = Record<string, boolean>;
type CustomerNameMap = Record<string, string>;
type MaterialFormItem = {
  materialName: string;
  price: string;
  quantity: string;
};

const emptyMaterial = (): MaterialFormItem => ({
  materialName: '',
  price: '',
  quantity: '1',
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

const onlyDigits = (value: string) => value.replace(/\D/g, '');

const moneyInputToVnd = (value: string) => {
  const amount = Number(onlyDigits(value) || 0);
  return amount * 1000;
};

const formatCurrency = (amount: number) =>
  amount.toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  });

const confirmActionWithToast = (message: string, confirmLabel: string, danger = false) =>
  new Promise<boolean>((resolve) => {
    toast(
      (t) => (
        <div className="space-y-3">
          <p className="text-sm font-semibold">{message}</p>
          <div className="flex justify-end gap-2">
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
              className={cn(
                'h-8 px-3 text-white',
                danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'
              )}
              onClick={() => {
                toast.dismiss(t.id);
                resolve(true);
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      ),
      { duration: 10000 }
    );
  });

const OrderActionButton = ({
  disabled,
  icon: Icon,
  label,
  onClick,
  tone,
}: {
  disabled: boolean;
  icon: typeof FilePlus2;
  label: string;
  onClick: () => void;
  tone: 'blue' | 'emerald' | 'violet';
}) => {
  const toneClass = {
    blue: 'border-blue-500/35 bg-blue-500/10 text-blue-200 hover:bg-blue-500/20',
    emerald: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20',
    violet: 'border-violet-500/35 bg-violet-500/10 text-violet-200 hover:bg-violet-500/20',
  }[tone];

  return (
    <Button
      type="button"
      variant="ghost"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'h-10 rounded-xl border px-3 text-xs font-bold transition',
        toneClass,
        disabled && 'pointer-events-none opacity-35 grayscale'
      )}
    >
      <Icon className="mr-1.5 h-4 w-4" />
      {label}
    </Button>
  );
};

export default function InvoicePage() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<CompletedInvoiceOrder[]>([]);
  const [invoiceState, setInvoiceState] = useState<InvoiceStateMap>({});
  const [customerNames, setCustomerNames] = useState<CustomerNameMap>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [creatingOrder, setCreatingOrder] = useState<CompletedInvoiceOrder | null>(null);
  const [invoiceFormMode, setInvoiceFormMode] = useState<'create' | 'update'>('create');
  const [isSubmittingInvoice, setIsSubmittingInvoice] = useState(false);
  const [laborCost, setLaborCost] = useState('');
  const [materials, setMaterials] = useState<MaterialFormItem[]>([emptyMaterial()]);
  const [bankCode, setBankCode] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [detailOrder, setDetailOrder] = useState<CompletedInvoiceOrder | null>(null);
  const [invoiceDetail, setInvoiceDetail] = useState<InvoiceDetail | null>(null);
  const [invoicePaid, setInvoicePaid] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [invoiceActionLoading, setInvoiceActionLoading] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, [user?.id]);

  useEffect(() => {
    invoiceService.getBanks()
      .then(setBanks)
      .catch((error) => {
        console.error('Failed to load banks:', error);
        toast.error('Không thể tải danh sách ngân hàng.');
      });
  }, []);

  const loadInvoices = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const completedOrders = await invoiceService.getTechnicianCompletedOrders(user.id);
      setOrders(completedOrders);

      const [checks, nameEntries] = await Promise.all([
        Promise.all(
          completedOrders.map(async (order) => {
            try {
              const hasInvoice = await invoiceService.checkInvoice(order.orderId);
              return [order.orderId, hasInvoice] as const;
            } catch {
              return [order.orderId, false] as const;
            }
          })
        ),
        Promise.all(
          completedOrders.map(async (order) => {
            try {
              const detailRes = await technicianOrderService.getOrderDetail(order.orderId);
              const detail = detailRes?.value ?? detailRes?.data ?? detailRes ?? {};
              const customerName = String(detail.customerName || detail.CustomerName || '').trim();
              return [order.orderId, customerName] as const;
            } catch {
              return [order.orderId, ''] as const;
            }
          })
        ),
      ]);

      setInvoiceState(Object.fromEntries(checks));
      setCustomerNames(Object.fromEntries(nameEntries.filter(([, name]) => Boolean(name))));
    } catch (error) {
      console.error('Failed to load technician invoices:', error);
      toast.error('Không thể tải danh sách hóa đơn.');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return orders;
    return orders.filter((order) =>
      [order.title, order.orderId, order.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))
    );
  }, [orders, search]);

  const createdCount = Object.values(invoiceState).filter(Boolean).length;
  const waitingCount = Math.max(orders.length - createdCount, 0);
  const selectedBank = banks.find((bank) => bank.bankCode === bankCode);
  const laborCostVnd = moneyInputToVnd(laborCost);
  const materialTotal = materials.reduce((sum, material) => (
    sum + moneyInputToVnd(material.price) * Number(material.quantity || 0)
  ), 0);
  const grandTotal = laborCostVnd + materialTotal;

  const openCreateInvoice = (order: CompletedInvoiceOrder) => {
    setCreatingOrder(order);
    setInvoiceFormMode('create');
    setLaborCost('');
    setMaterials([emptyMaterial()]);
    setBankCode('');
    setBankAccount('');
    setBankAccountName('');
  };

  const openUpdateInvoice = async (order: CompletedInvoiceOrder) => {
    setCreatingOrder(order);
    setInvoiceFormMode('update');
    setIsSubmittingInvoice(true);
    try {
      const updateInfo = await invoiceService.getInvoiceUpdateInfo(order.orderId);
      setLaborCost(updateInfo.laborCost > 0 ? String(Math.round(updateInfo.laborCost / 1000)) : '');
      setMaterials(
        updateInfo.materials.length > 0
          ? updateInfo.materials.map((material) => ({
            materialName: material.materialName,
            price: material.price > 0 ? String(Math.round(material.price / 1000)) : '',
            quantity: material.quantity > 0 ? String(material.quantity) : '1',
          }))
          : [emptyMaterial()]
      );
      setBankCode(updateInfo.bankCode || '');
      setBankAccount(updateInfo.bankAccount || '');
      setBankAccountName(updateInfo.bankAccountName || '');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể tải thông tin hóa đơn để cập nhật.');
      setCreatingOrder(null);
    } finally {
      setIsSubmittingInvoice(false);
    }
  };

  const updateMaterial = (index: number, key: keyof MaterialFormItem, value: string) => {
    setMaterials((prev) => prev.map((item, idx) => (
      idx === index
        ? {
          ...item,
          [key]: key === 'price' || key === 'quantity' ? onlyDigits(value) : value,
        }
        : item
    )));
  };

  const handleCreateInvoice = async () => {
    if (!creatingOrder) return;

    const validMaterials = materials
      .map((material) => ({
        materialName: material.materialName.trim(),
        price: moneyInputToVnd(material.price),
        quantity: Number(material.quantity || 0),
      }))
      .filter((material) => material.materialName && material.price > 0 && material.quantity > 0);

    if (laborCostVnd <= 0) {
      toast.error('Vui lòng nhập tiền công hợp lệ.');
      return;
    }

    if (!bankCode || !bankAccount.trim() || !bankAccountName.trim()) {
      toast.error('Vui lòng nhập đầy đủ thông tin ngân hàng.');
      return;
    }

    const confirmed = await confirmActionWithToast(
      invoiceFormMode === 'create' ? 'Bạn có chắc muốn tạo hóa đơn này?' : 'Bạn có chắc muốn cập nhật hóa đơn này?',
      invoiceFormMode === 'create' ? 'Tạo hóa đơn' : 'Cập nhật'
    );
    if (!confirmed) return;

    setIsSubmittingInvoice(true);
    try {
      const payload = {
        orderId: creatingOrder.orderId,
        laborCost: laborCostVnd,
        bankCode,
        bankAccount: bankAccount.trim(),
        bankAccountName: bankAccountName.trim(),
        materials: validMaterials,
      };

      if (invoiceFormMode === 'create') {
        await invoiceService.createInvoice(payload);
      } else {
        await invoiceService.updateInvoice(creatingOrder.orderId, payload);
      }

      toast.success(invoiceFormMode === 'create' ? 'Tạo hóa đơn thành công.' : 'Cập nhật hóa đơn thành công.');
      setCreatingOrder(null);
      await loadInvoices();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể tạo hóa đơn.');
    } finally {
      setIsSubmittingInvoice(false);
    }
  };

  const openInvoiceDetail = async (order: CompletedInvoiceOrder) => {
    setDetailOrder(order);
    setInvoiceDetail(null);
    setInvoicePaid(false);
    setDetailLoading(true);
    try {
      const detail = await invoiceService.getInvoiceDetail(order.orderId);
      setInvoiceDetail(detail);
      if (detail.invoiceId) {
        const paid = await invoiceService.isPayment(detail.invoiceId);
        setInvoicePaid(paid);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể tải chi tiết hóa đơn.');
      setDetailOrder(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!invoiceDetail?.invoiceId) return;
    const confirmed = await confirmActionWithToast('Xác nhận hóa đơn này đã được thanh toán?', 'Xác nhận');
    if (!confirmed) return;

    setInvoiceActionLoading(true);
    try {
      await invoiceService.confirmPayment(invoiceDetail.invoiceId);
      toast.success('Đã xác nhận thanh toán.');
      setInvoicePaid(true);
      setInvoiceDetail((prev) => prev ? { ...prev, paymentStatus: 1 } : prev);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể xác nhận thanh toán.');
    } finally {
      setInvoiceActionLoading(false);
    }
  };

  const handleDeleteInvoice = async () => {
    if (!invoiceDetail?.invoiceId || !detailOrder) return;
    const confirmed = await confirmActionWithToast('Bạn có chắc muốn xóa hóa đơn này?', 'Delete', true);
    if (!confirmed) return;

    setInvoiceActionLoading(true);
    try {
      await invoiceService.deleteInvoice(invoiceDetail.invoiceId);
      toast.success('Đã xóa hóa đơn.');
      setDetailOrder(null);
      setInvoiceDetail(null);
      await loadInvoices();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể xóa hóa đơn.');
    } finally {
      setInvoiceActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.03] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.25)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-blue-400 font-semibold">Hóa đơn</p>
            <h1 className="mt-1 text-3xl font-bold text-white">Quản lý hóa đơn</h1>

          </div>

          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-slate-500">Tổng đơn</p>
              <p className="mt-1 text-2xl font-black text-white">{orders.length}</p>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-emerald-300">Đã có HĐ</p>
              <p className="mt-1 text-2xl font-black text-white">{createdCount}</p>
            </div>
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-amber-300">Chưa có</p>
              <p className="mt-1 text-2xl font-black text-white">{waitingCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo mã đơn, tiêu đề..."
            className="h-11 rounded-xl border-white/10 bg-white/5 pl-9 text-white placeholder:text-slate-500"
          />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={loadInvoices}
          className="h-11 rounded-xl border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
        >
          Tải lại
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-[#0a1122] p-12 text-center">
          <ClipboardList className="mx-auto h-12 w-12 text-slate-600" />
          <p className="mt-4 font-semibold text-slate-300">Chưa có đơn hoàn thành phù hợp.</p>
          <p className="mt-2 text-sm text-slate-500">
            Bạn cần có ít nhất một đơn đã hoàn thành trước khi tạo hóa đơn.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map((order, index) => {
            const hasInvoice = Boolean(invoiceState[order.orderId]);

            return (
              <motion.div
                key={order.orderId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="rounded-3xl border border-white/10 bg-[#0a1122] p-5 shadow-xl transition hover:border-blue-500/30"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          'rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider',
                          hasInvoice
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                            : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                        )}
                      >
                        {hasInvoice ? 'Đã tạo hóa đơn' : 'Chưa tạo hóa đơn'}
                      </span>
                    </div>

                    <h2 className="mt-3 truncate text-lg font-bold text-white">
                      {order.title || 'Đơn đã hoàn thành'}
                    </h2>
                    <div className="mt-2 grid gap-1.5 text-sm text-slate-400 lg:grid-cols-2">

                      <p>
                        Khách hàng:{' '}
                        <span className="font-semibold text-slate-200">
                          {customerNames[order.orderId] || 'Đang cập nhật'}
                        </span>
                      </p>

                      <p>
                        Hoàn thành lúc: <span className="text-slate-200">{formatDateTime(order.createdAt)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row xl:shrink-0">
                    <OrderActionButton
                      label="Tạo hóa đơn"
                      icon={FilePlus2}
                      tone="blue"
                      disabled={hasInvoice}
                      onClick={() => openCreateInvoice(order)}
                    />
                    <OrderActionButton
                      label="Cập nhật hóa đơn"
                      icon={FilePenLine}
                      tone="emerald"
                      disabled={!hasInvoice}
                      onClick={() => openUpdateInvoice(order)}
                    />
                    <OrderActionButton
                      label="Hóa đơn"
                      icon={ReceiptText}
                      tone="violet"
                      disabled={!hasInvoice}
                      onClick={() => openInvoiceDetail(order)}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {creatingOrder && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#071022] shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#071022]/95 px-6 py-4 backdrop-blur">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-blue-400">
                  {invoiceFormMode === 'create' ? 'Tạo hóa đơn' : 'Cập nhật hóa đơn'}
                </p>
                <h2 className="mt-1 text-xl font-bold text-white">{creatingOrder.title || 'Đơn đã hoàn thành'}</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Khách hàng: <span className="text-slate-300">{customerNames[creatingOrder.orderId] || 'Đang cập nhật'}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCreatingOrder(null)}
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid flex-1 gap-6 overflow-y-auto p-6 xl:grid-cols-[minmax(0,2fr)_minmax(300px,0.7fr)]">
              <div className="min-w-0 space-y-5">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">Chi phí sửa chữa</h3>
                  <div className="mt-4 space-y-2">
                    <label className="text-xs font-semibold text-slate-400">Tiền công</label>
                    <Input
                      value={laborCost}
                      onChange={(event) => setLaborCost(onlyDigits(event.target.value))}
                      placeholder="Ví dụ: 300"
                      className="h-11 rounded-xl border-white/10 bg-white/5 text-white"
                    />
                    <p className="text-xs text-slate-500">
                      <span className="font-bold text-emerald-300">{formatCurrency(laborCostVnd)}</span>
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-white">Vật liệu</h3>
                      <p className="mt-1 text-xs text-slate-500">Thêm từng vật liệu đã sử dụng cho đơn này.</p>
                    </div>
                    <Button
                      type="button"
                      onClick={() => setMaterials((prev) => [...prev, emptyMaterial()])}
                      className="h-9 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <Plus className="mr-1.5 h-4 w-4" />
                      Thêm
                    </Button>
                  </div>

                  <div className="mt-4 max-h-[42vh] space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                    {materials.map((material, index) => (
                      <div key={index} className="rounded-2xl border border-white/10 bg-[#050b18] p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Vật liệu #{index + 1}</p>
                          <Button
                            type="button"
                            variant="ghost"
                            disabled={materials.length === 1}
                            onClick={() => setMaterials((prev) => prev.filter((_, idx) => idx !== index))}
                            className="h-8 rounded-xl border border-rose-500/30 bg-rose-500/10 px-2 text-rose-200 hover:bg-rose-500/20 disabled:opacity-40"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_120px] lg:items-end">
                          <div className="min-w-0 space-y-1.5">
                            <label className="text-xs font-semibold text-slate-400">Tên vật liệu</label>
                            <Input
                              value={material.materialName}
                              onChange={(event) => updateMaterial(index, 'materialName', event.target.value)}
                              placeholder="Ví dụ: Dây điện"
                              className="h-10 rounded-xl border-white/10 bg-white/5 text-white"
                            />
                          </div>
                          <div className="min-w-0 space-y-1.5">
                            <label className="text-xs font-semibold text-slate-400">Giá</label>
                            <div className="grid grid-cols-[minmax(0,1fr)_120px] items-center gap-3">
                              <Input
                                value={material.price}
                                onChange={(event) => updateMaterial(index, 'price', event.target.value)}
                                placeholder="Ví dụ: 50"
                                className="h-10 min-w-0 flex-1 rounded-xl border-white/10 bg-white/5 text-white"
                              />
                              <span className="rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-right text-[11px] font-semibold text-emerald-300">
                                {formatCurrency(moneyInputToVnd(material.price))}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-400">Số lượng</label>
                            <Input
                              value={material.quantity}
                              onChange={(event) => updateMaterial(index, 'quantity', event.target.value)}
                              placeholder="1"
                              className="h-10 rounded-xl border-white/10 bg-white/5 text-white"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="min-w-0 space-y-5 xl:sticky xl:top-0 xl:self-start">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">Thông tin thanh toán</h3>
                  <div className="mt-4 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400">Ngân hàng</label>
                      <select
                        value={bankCode}
                        onChange={(event) => setBankCode(event.target.value)}
                        className="h-11 w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 text-sm text-white outline-none focus:border-blue-500/50"
                      >
                        <option value="">Chọn ngân hàng...</option>
                        {banks.map((bank) => (
                          <option key={bank.bankCode} value={bank.bankCode}>
                            {bank.bankName}
                          </option>
                        ))}
                      </select>
                      {selectedBank && <p className="text-xs text-slate-500">Mã ngân hàng: {selectedBank.bankCode}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400">Mã số thẻ / số tài khoản</label>
                      <Input
                        value={bankAccount}
                        onChange={(event) => setBankAccount(event.target.value)}
                        placeholder="Nhập số tài khoản"
                        className="h-11 rounded-xl border-white/10 bg-white/5 text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400">Tên tài khoản</label>
                      <Input
                        value={bankAccountName}
                        onChange={(event) => setBankAccountName(event.target.value)}
                        placeholder="Nhập tên chủ tài khoản"
                        className="h-11 rounded-xl border-white/10 bg-white/5 text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">Tổng thanh toán</p>
                  <div className="mt-3 space-y-2 text-sm text-slate-300">
                    <div className="flex justify-between gap-3">
                      <span>Tiền công</span>
                      <span className="font-semibold text-white">{formatCurrency(laborCostVnd)}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span>Vật liệu</span>
                      <span className="font-semibold text-white">{formatCurrency(materialTotal)}</span>
                    </div>
                    <div className="border-t border-white/10 pt-3">
                      <div className="flex justify-between gap-3">
                        <span className="font-bold text-emerald-200">Tổng cộng</span>
                        <span className="text-xl font-black text-white">{formatCurrency(grandTotal)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  disabled={isSubmittingInvoice}
                  onClick={handleCreateInvoice}
                  className="h-12 w-full rounded-2xl bg-blue-600 font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-60"
                >
                  {isSubmittingInvoice ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ReceiptText className="mr-2 h-4 w-4" />}
                  {invoiceFormMode === 'create' ? 'Hoàn thành' : 'Cập nhật hóa đơn'}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {detailOrder && (
        <div className="fixed inset-0 z-[230] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-white/10 bg-[#071022] text-slate-200 shadow-2xl"
          >
            {detailLoading ? (
              <div className="flex min-h-[520px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
              </div>
            ) : invoiceDetail ? (
              <div className="p-6 sm:p-8">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex flex-1 items-center gap-6">
                    <div className="h-px flex-1 bg-white/15" />
                    <h2 className="shrink-0 text-3xl font-light tracking-[0.22em] text-slate-100">HÓA ĐƠN</h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setDetailOrder(null);
                      setInvoiceDetail(null);
                    }}
                    className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-8 grid gap-6 md:grid-cols-[1fr_230px]">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-400">Khách hàng:</p>
                      <div className="mt-2 space-y-1 text-sm tracking-wide text-slate-400">
                        <p className="font-semibold text-white">{invoiceDetail.nameCustomer || customerNames[detailOrder.orderId] || 'Khách hàng'}</p>
                        <p>{invoiceDetail.customerPhone || 'Chưa có số điện thoại'}</p>
                        <p>{[invoiceDetail.adressOrder, invoiceDetail.cityNameOrder].filter(Boolean).join(', ') || 'Chưa có địa chỉ'}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-400">Dịch vụ:</p>
                      <div className="mt-2 space-y-1 text-sm tracking-wide text-slate-400">
                        <p>{invoiceDetail.serviceName || detailOrder.title || 'Dịch vụ sửa chữa'}</p>
                        <p>Kỹ thuật viên: {invoiceDetail.nameTechnician || user?.fullName || 'FastFix Technician'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 text-right">
                    <div className="text-sm tracking-wide text-slate-400">
                      <p><span className="font-black uppercase text-white">Mã hóa đơn:</span> {invoiceDetail.invoiceId.slice(0, 8)}</p>
                      <p><span className="font-black uppercase text-white">Ngày tạo:</span> {formatDateTime(invoiceDetail.createdAt)}</p>
                      <p>
                        <span className="font-black uppercase text-white">Trạng thái:</span>{' '}
                        <span className={cn('font-bold', invoicePaid ? 'text-emerald-300' : 'text-amber-300')}>
                          {invoicePaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                        </span>
                      </p>
                    </div>

                    <div className="ml-auto flex h-40 w-40 items-center justify-center rounded-2xl border border-white/10 bg-white p-2">
                      {invoiceDetail.qrCode ? (
                        <img src={invoiceDetail.qrCode} alt="QR thanh toán" className="h-full w-full object-contain" />
                      ) : (
                        <p className="text-center text-xs text-slate-500">Không có QR thanh toán</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                  <div className="grid grid-cols-[1fr_120px_70px_120px] gap-3 border-b border-white/10 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-blue-300">
                    <p>Mô tả</p>
                    <p className="text-right">Đơn giá</p>
                    <p className="text-right">SL</p>
                    <p className="text-right">Thành tiền</p>
                  </div>

                  <div className="divide-y divide-white/10">
                    <div className="grid grid-cols-[1fr_120px_70px_120px] gap-3 px-4 py-2.5 text-sm text-slate-300">
                      <p>Tiền công</p>
                      <p className="text-right">{formatCurrency(invoiceDetail.laborCost)}</p>
                      <p className="text-right">1</p>
                      <p className="text-right font-semibold text-white">{formatCurrency(invoiceDetail.laborCost)}</p>
                    </div>

                    {invoiceDetail.materials.map((material, index) => (
                      <div key={`${material.materialName}-${index}`} className="grid grid-cols-[1fr_120px_70px_120px] gap-3 px-4 py-2.5 text-sm text-slate-300">
                        <p>{material.materialName || `Vật liệu ${index + 1}`}</p>
                        <p className="text-right">{formatCurrency(material.price)}</p>
                        <p className="text-right">{material.quantity}</p>
                        <p className="text-right font-semibold text-white">{formatCurrency(material.subtotal || material.price * material.quantity)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <div className="w-full max-w-xs space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-black uppercase tracking-wider text-slate-400">Tạm tính</span>
                      <span className="font-semibold text-white">{formatCurrency(invoiceDetail.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between border-t border-white/10 pt-2 text-base">
                      <span className="font-black uppercase tracking-wider text-emerald-300">Tổng cộng</span>
                      <span className="font-black text-white">{formatCurrency(invoiceDetail.totalAmount)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex flex-col items-stretch justify-end gap-3 border-t border-white/10 pt-5 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDetailOrder(null);
                      setInvoiceDetail(null);
                    }}
                    className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="button"
                    disabled={invoicePaid || invoiceActionLoading}
                    onClick={handleDeleteInvoice}
                    className="bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-35"
                  >
                    Delete
                  </Button>
                  <Button
                    type="button"
                    disabled={invoicePaid || invoiceActionLoading}
                    onClick={handleConfirmPayment}
                    className="bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-35"
                  >
                    {invoiceActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Xác nhận thanh toán
                  </Button>
                </div>
              </div>
            ) : null}
          </motion.div>
        </div>
      )}
    </div>
  );
}
