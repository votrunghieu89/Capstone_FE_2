import { useEffect, useMemo, useState } from "react"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, ReceiptText, Search } from "lucide-react"
import { toast } from "react-hot-toast"
import { adminGet, normalizeListPayload } from "@/utils/adminHttp"

type AdminInvoice = {
  invoiceId: string
  orderId: string
  customerName: string
  technicianName: string
  paymentStatus: number
  totalAmount: number
  createdAt?: string
}

type InvoiceDetail = {
  invoiceId: string
  nameCustomer?: string
  nameTechnician?: string
  serviceName?: string
  adressOrder?: string
  cityNameOrder?: string
  customerPhone?: string
  materials: Array<{
    materialName: string
    price: number
    quantity: number
    subtotal: number
  }>
  laborCost: number
  totalAmount: number
  qrCode?: string
  paymentStatus: number
  createdAt?: string
}

const formatCurrency = (amount: number) =>
  amount.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  })

const formatDateTime = (value?: string) => {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

const normalizeInvoice = (row: any): AdminInvoice => ({
  invoiceId: String(row.invoiceId || row.InvoiceId || ""),
  orderId: String(row.orderId || row.OrderId || ""),
  customerName: row.customerName || row.CustomerName || "Khách hàng",
  technicianName: row.technicianName || row.TechnicianName || "Kỹ thuật viên",
  paymentStatus: Number(row.paymentStatus ?? row.PaymentStatus ?? 0),
  totalAmount: Number(row.totalAmount || row.TotalAmount || 0),
  createdAt: row.createdAt || row.CreatedAt,
})

const normalizeDetail = (row: any): InvoiceDetail => ({
  invoiceId: String(row.invoiceId || row.InvoiceId || ""),
  nameCustomer: row.nameCustomer || row.NameCustomer,
  nameTechnician: row.nameTechnician || row.NameTechnician,
  serviceName: row.serviceName || row.ServiceName,
  adressOrder: row.adressOrder || row.AdressOrder || row.addressOrder || row.AddressOrder,
  cityNameOrder: row.cityNameOrder || row.CityNameOrder,
  customerPhone: row.customerPhone || row.CustomerPhone,
  materials: normalizeListPayload<any>(row.materials || row.Materials).map((material) => ({
    materialName: material.materialName || material.MaterialName || "",
    price: Number(material.price || material.Price || 0),
    quantity: Number(material.quantity || material.Quantity || 0),
    subtotal: Number(material.subtotal || material.Subtotal || 0),
  })),
  laborCost: Number(row.laborCost || row.LaborCost || 0),
  totalAmount: Number(row.totalAmount || row.TotalAmount || 0),
  qrCode: row.qrCode || row.QRCode,
  paymentStatus: Number(row.paymentStatus ?? row.PaymentStatus ?? 0),
  createdAt: row.createdAt || row.CreatedAt,
})

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<AdminInvoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedInvoice, setSelectedInvoice] = useState<AdminInvoice | null>(null)
  const [invoiceDetail, setInvoiceDetail] = useState<InvoiceDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const fetchInvoices = async () => {
    setIsLoading(true)
    try {
      const payload = await adminGet("/Invoice/admin/all-invoices")
      setInvoices(normalizeListPayload<any>(payload).map(normalizeInvoice).filter((item) => item.invoiceId && item.orderId))
    } catch (error) {
      console.error("Failed to load invoices:", error)
      toast.error("Không thể tải danh sách hóa đơn")
      setInvoices([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [])

  const filteredInvoices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return invoices
    return invoices.filter((item) =>
      [item.invoiceId, item.orderId, item.customerName, item.technicianName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    )
  }, [invoices, searchQuery])

  const paidCount = invoices.filter((item) => item.paymentStatus === 1).length
  const unpaidCount = Math.max(invoices.length - paidCount, 0)
  const totalRevenue = invoices.reduce((sum, item) => sum + item.totalAmount, 0)

  const openDetail = async (invoice: AdminInvoice) => {
    setSelectedInvoice(invoice)
    setInvoiceDetail(null)
    setDetailLoading(true)
    try {
      const payload = await adminGet(`/Invoice/detail/${invoice.orderId}`)
      setInvoiceDetail(normalizeDetail(payload))
    } catch (error) {
      console.error("Failed to load invoice detail:", error)
      toast.error("Không thể tải chi tiết hóa đơn")
      setSelectedInvoice(null)
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-[#070b14] text-slate-100">
      <DashboardHeader title="Hóa đơn" description="Theo dõi và xem chi tiết hóa đơn của toàn hệ thống" />

      <main className="flex-1 p-6 flex flex-col gap-4 max-w-[1400px] w-full mx-auto">
        <Card className="rounded-xl border border-slate-800 bg-[#0b111f]">
          <CardContent className="flex gap-4 p-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                placeholder="Tìm theo mã hóa đơn, mã đơn, khách hàng, kỹ thuật viên..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="border-slate-700 bg-[#101a2f] pl-9"
              />
            </div>
            <Button onClick={fetchInvoices} className="bg-blue-600 hover:bg-blue-700">
              Tải lại
            </Button>
          </CardContent>
        </Card>

        <Card className="flex-1 rounded-xl border border-slate-800 bg-[#0b111f]">
          <CardContent className="p-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Loader2 className="mb-2 h-8 w-8 animate-spin" />
                <p>Đang tải danh sách hóa đơn...</p>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="py-16 text-center text-slate-500">Không tìm thấy hóa đơn phù hợp.</div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-800">
                <div className="grid grid-cols-[1.1fr_1fr_1fr_140px_160px_120px] gap-3 bg-slate-900/70 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <span>Mã hóa đơn</span>
                  <span>Khách hàng</span>
                  <span>Kỹ thuật viên</span>
                  <span className="text-right">Tổng tiền</span>
                  <span>Ngày tạo</span>
                  <span className="text-right">Thao tác</span>
                </div>

                <div className="divide-y divide-slate-800">
                  {filteredInvoices.map((invoice) => (
                    <div key={invoice.invoiceId} className="grid grid-cols-[1.1fr_1fr_1fr_140px_160px_120px] gap-3 px-4 py-3 text-sm text-slate-300">
                      <div className="min-w-0">
                        <p className="truncate font-mono text-slate-100">{invoice.invoiceId.slice(0, 8)}</p>
                        <p className="truncate text-xs text-slate-500">Đơn: {invoice.orderId.slice(0, 8)}</p>
                      </div>
                      <span className="truncate">{invoice.customerName}</span>
                      <span className="truncate">{invoice.technicianName}</span>
                      <span className="text-right font-semibold text-slate-100">{formatCurrency(invoice.totalAmount)}</span>
                      <div>
                        <p>{formatDateTime(invoice.createdAt)}</p>
                        <Badge className={invoice.paymentStatus === 1 ? "mt-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "mt-1 border-amber-500/30 bg-amber-500/10 text-amber-300"}>
                          {invoice.paymentStatus === 1 ? "Đã thanh toán" : "Chưa thanh toán"}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <Button size="sm" variant="outline" className="border-slate-700 text-slate-200 hover:bg-slate-800" onClick={() => openDetail(invoice)}>
                          Xem
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={Boolean(selectedInvoice)} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto border border-slate-800 bg-[#071022] text-slate-100">
          <DialogHeader>
            <DialogTitle>Chi tiết hóa đơn</DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
          ) : invoiceDetail ? (
            <div className="space-y-8">
              <div className="flex items-start justify-between gap-6">
                <div className="flex flex-1 items-center gap-5">
                  <div className="h-px flex-1 bg-white/15" />
                  <h2 className="shrink-0 text-3xl font-light tracking-[0.22em] text-slate-100">HÓA ĐƠN</h2>
                </div>
                <div className="text-right text-sm text-slate-400">
                  <p><span className="font-black uppercase text-white">Mã hóa đơn:</span> {invoiceDetail.invoiceId.slice(0, 8)}</p>
                  <p><span className="font-black uppercase text-white">Ngày tạo:</span> {formatDateTime(invoiceDetail.createdAt)}</p>
                  <p>
                    <span className="font-black uppercase text-white">Trạng thái:</span>{" "}
                    <span className={invoiceDetail.paymentStatus === 1 ? "font-bold text-emerald-300" : "font-bold text-amber-300"}>
                      {invoiceDetail.paymentStatus === 1 ? "Đã thanh toán" : "Chưa thanh toán"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-[1fr_210px]">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-400">Khách hàng</p>
                    <div className="mt-2 space-y-1 text-sm text-slate-400">
                      <p className="font-semibold text-white">{invoiceDetail.nameCustomer || "Khách hàng"}</p>
                      <p>{invoiceDetail.customerPhone || "Chưa có số điện thoại"}</p>
                      <p>{[invoiceDetail.adressOrder, invoiceDetail.cityNameOrder].filter(Boolean).join(", ") || "Chưa có địa chỉ"}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-400">Dịch vụ</p>
                    <div className="mt-2 space-y-1 text-sm text-slate-400">
                      <p>{invoiceDetail.serviceName || "Dịch vụ sửa chữa"}</p>
                      <p>Kỹ thuật viên: {invoiceDetail.nameTechnician || "Kỹ thuật viên"}</p>
                    </div>
                  </div>
                </div>

                <div className="ml-auto flex h-40 w-40 items-center justify-center rounded-2xl border border-white/10 bg-white p-2">
                  {invoiceDetail.qrCode ? (
                    <img src={invoiceDetail.qrCode} alt="QR thanh toán" className="h-full w-full object-contain" />
                  ) : (
                    <p className="text-center text-xs text-slate-500">Không có QR</p>
                  )}
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
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

              <div className="flex justify-end">
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
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
} 
