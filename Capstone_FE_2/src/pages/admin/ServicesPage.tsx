import { useEffect, useMemo, useState } from "react"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Wrench, Search, Plus, Trash2, Loader2 } from "lucide-react"
import { adminDelete, adminGet, adminPost, normalizeListPayload } from "@/utils/adminHttp"
import { toast } from "react-hot-toast"
import { ConfirmToast } from "@/components/admin/ConfirmToast"

type ServiceItem = {
  id: string
  name: string
  totalRequests: number
  completedRequests: number
  description?: string
}

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newService, setNewService] = useState({ name: "", description: "" })

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const payload = await adminGet("/admin/services-summary")
      const rows = normalizeListPayload<any>(payload).map((row) => ({
        id: row.id,
        name: row.name,
        totalRequests: Number(row.total || 0),
        completedRequests: Number(row.completed || 0),
      }))
      setServices(rows)
    } catch {
      setServices([])
      toast.error("Không thể tải danh sách dịch vụ")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredServices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return services
    return services.filter((item) => item.name.toLowerCase().includes(q))
  }, [searchQuery, services])

  // --- XỬ LÝ XÓA VỚI CONFIRM TOAST ---
  const handleDeleteService = (id: string, name: string) => {
    toast((t) => (
      <ConfirmToast
        t={t}
        title="Xóa dịch vụ này?"
        message={`Bạn có chắc chắn muốn xóa dịch vụ "${name}"? Hành động này không thể hoàn tác.`}
        onConfirm={() => executeDelete(id)}
      />
    ), { position: "top-center" })
  }

  const executeDelete = async (id: string) => {
    const loadId = toast.loading("Đang xóa dịch vụ...")
    const snapshot = services

    // Optimistic UI update
    setServices((prev) => prev.filter((item) => item.id !== id))

    try {
      await adminDelete(`/admin/services/${id}`)
      toast.success("Đã xóa dịch vụ thành công", { id: loadId })
    } catch {
      setServices(snapshot)
      toast.error("Lỗi khi xóa dịch vụ. Vui lòng thử lại", { id: loadId })
    }
  }

  // --- XỬ LÝ THÊM MỚI ---
  const handleCreateService = async () => {
    const name = newService.name.trim()
    if (!name) {
      toast.error("Vui lòng nhập tên dịch vụ")
      return
    }

    setIsSubmitting(true)
    const loadId = toast.loading("Đang tạo dịch vụ...")

    try {
      await adminPost("/admin/services", {
        serviceName: name,
        description: newService.description.trim() || undefined,
      })

      await fetchData() // Refresh lại danh sách
      setNewService({ name: "", description: "" })
      setIsCreateOpen(false)
      toast.success("Thêm dịch vụ mới thành công!", { id: loadId })
    } catch {
      toast.error("Có lỗi xảy ra khi tạo dịch vụ", { id: loadId })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#070b14] text-slate-100">
      <DashboardHeader title="Dịch vụ" description="Theo dõi các nhóm dịch vụ từ dữ liệu yêu cầu sửa chữa" />

      {/* DIALOG THÊM DỊCH VỤ */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg border border-slate-800 bg-[#0d1322] text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-base text-slate-100">Thêm dịch vụ mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-400">Tên dịch vụ</p>
              <Input
                value={newService.name}
                onChange={(e) => setNewService(p => ({ ...p, name: e.target.value }))}
                placeholder="Ví dụ: Sửa máy giặt"
                className="bg-[#101a2f] border-slate-700 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-400">Mô tả chi tiết</p>
              <Input
                value={newService.description}
                onChange={(e) => setNewService(p => ({ ...p, description: e.target.value }))}
                placeholder="Nhập mô tả ngắn gọn..."
                className="bg-[#101a2f] border-slate-700 focus:ring-blue-500"
              />
            </div>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-2"
              onClick={handleCreateService}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Xác nhận thêm
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <main className="flex-1 p-6 flex flex-col gap-4 max-w-[1400px] w-full mx-auto">
        {/* STATS CARDS */}
        <div className="grid grid-cols-1 gap-4">
          <Card className="border border-slate-800 bg-[#0b111f] rounded-xl overflow-hidden">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-950/40 border border-blue-800 flex items-center justify-center">
                <Wrench className="h-5 w-5 text-blue-300" />
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Tổng dịch vụ</p>
                <p className="text-2xl font-bold text-slate-100">{services.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SEARCH & ACTION */}
        <Card className="border border-slate-800 bg-[#0b111f] rounded-xl">
          <CardContent className="p-4 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Tìm dịch vụ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-[#101a2f] border-slate-700"
              />
            </div>
            <Button onClick={() => setIsCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" /> Thêm mới
            </Button>
          </CardContent>
        </Card>

        {/* SERVICE GRID */}
        <Card className="border border-slate-800 bg-[#0b111f] rounded-xl flex-1">
          <CardContent className="p-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <p>Đang tải dữ liệu dịch vụ...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredServices.map((item) => (
                  <div key={item.id} className="group rounded-xl border border-slate-700 bg-[#14171f] p-4 flex justify-between items-start hover:border-slate-500 transition-all">
                    <div>
                      <p className="font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">{item.name}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <Badge variant="secondary" className="bg-slate-800 text-slate-300 border-none text-[10px]">
                          Tổng: {item.totalRequests}
                        </Badge>
                        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-[10px]">
                          Xong: {item.completedRequests}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteService(item.id, item.name)}
                      className="text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {filteredServices.length === 0 && (
                  <div className="col-span-full text-center py-10 text-slate-500">
                    Không tìm thấy dịch vụ nào phù hợp.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}