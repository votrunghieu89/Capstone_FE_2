import { useEffect, useMemo, useState } from "react"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Wrench, ListChecks, Search, Plus, Trash2 } from "lucide-react"
import { adminDelete, adminGet, adminPost, normalizeListPayload } from "@/utils/adminHttp"
import type { AdminServiceSummaryItem } from "@/types/admin"

type ServiceItem = {
  id: string
  name: string
  totalRequests: number
  completedRequests: number
  description?: string
}

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([]) // Khởi tạo mảng rỗng
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [formError, setFormError] = useState("")
  const [newService, setNewService] = useState({ name: "", description: "" })

  useEffect(() => {
    let mounted = true

    const fetchData = async () => {
      try {
        const payload = await adminGet("/admin/services-summary")
        // Mapping dữ liệu từ Backend
        const rows = normalizeListPayload<any>(payload).map((row) => ({
          id: row.id, // Lấy ID chuẩn từ DB
          name: row.name,
          totalRequests: Number(row.total || 0),
          completedRequests: Number(row.completed || 0),
        }))

        if (mounted) {
          setServices(rows)
        }
      } catch {
        if (mounted) setServices([])
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    fetchData()
    return () => { mounted = false }
  }, [])

  const filteredServices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return services
    return services.filter((item) => item.name.toLowerCase().includes(q))
  }, [searchQuery, services])

  const totalRequests = services.reduce((sum, item) => sum + item.totalRequests, 0)

  const handleDeleteService = async (id: string) => {
    // Lưu trạng thái cũ để rollback nếu xóa lỗi
    const snapshot = services
    setServices((prev) => prev.filter((item) => item.id !== id))

    try {
      // Gửi ID trực tiếp tới BE
      await adminDelete(`/admin/services/${id}`)
    } catch {
      setServices(snapshot)
    }
  }

  const handleCreateService = async () => {
    const name = newService.name.trim()
    if (!name) { setFormError("Vui lòng nhập tên dịch vụ"); return }

    try {
      const response = await adminPost("/admin/services", {
        // Đổi "name" thành "serviceName" (hoặc tên chính xác trong DTO của bạn)
        serviceName: name,
        description: newService.description.trim() || undefined,
      })

      const payload = await adminGet("/admin/services-summary")
      const rows = normalizeListPayload<any>(payload).map((row) => ({
        id: row.id,
        name: row.name,
        totalRequests: Number(row.total || 0),
        completedRequests: Number(row.completed || 0),
      }))

      setServices(rows)
      setNewService({ name: "", description: "" })
      setIsCreateOpen(false)
      setFormError("")
    } catch {
      setFormError("Có lỗi xảy ra khi tạo dịch vụ")
    }
  }
  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#070b14] text-slate-100">
      <DashboardHeader title="Dịch vụ" description="Theo dõi các nhóm dịch vụ từ dữ liệu yêu cầu sửa chữa" />

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg border border-slate-800 bg-[#0d1322] text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-base text-slate-100">Thêm dịch vụ mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input value={newService.name} onChange={(e) => setNewService(p => ({ ...p, name: e.target.value }))} placeholder="Nhập tên dịch vụ" className="bg-[#101a2f] border-slate-700" />
            <Input value={newService.description} onChange={(e) => setNewService(p => ({ ...p, description: e.target.value }))} placeholder="Mô tả" className="bg-[#101a2f] border-slate-700" />
            {formError && <p className="text-xs text-red-300">{formError}</p>}
            <Button className="w-full bg-[#2563eb]" onClick={handleCreateService}>Thêm dịch vụ</Button>
          </div>
        </DialogContent>
      </Dialog>

      <main className="flex-1 p-6 flex flex-col gap-4 max-w-[1400px] w-full mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border border-slate-800 bg-[#0b111f] rounded-xl">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-950/40 border border-blue-800 flex items-center justify-center">
                <Wrench className="h-5 w-5 text-blue-300" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Tổng dịch vụ</p>
                <p className="text-xl font-bold text-slate-100">{services.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-slate-800 bg-[#0b111f] rounded-xl">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-950/40 border border-emerald-800 flex items-center justify-center">
                <ListChecks className="h-5 w-5 text-emerald-300" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Tổng yêu cầu</p>
                <p className="text-xl font-bold text-slate-100">{totalRequests}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-slate-800 bg-[#0b111f] rounded-xl">
          <CardContent className="p-4 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input placeholder="Tìm dịch vụ..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-[#101a2f] border-slate-700" />
            </div>
            <Button onClick={() => setIsCreateOpen(true)}><Plus className="h-4 w-4 mr-2" /> Thêm</Button>
          </CardContent>
        </Card>

        <Card className="border border-slate-800 bg-[#0b111f] rounded-xl">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredServices.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-700 bg-[#14171f] p-4 flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-slate-100">{item.name}</p>
                    <p className="text-xs text-slate-400 mt-1">Tổng yêu cầu: {item.totalRequests}</p>
                    <span className="mt-2 inline-block rounded-md border border-emerald-800 bg-emerald-950/40 px-2 py-1 text-xs text-emerald-300">
                      Hoàn thành: {item.completedRequests}
                    </span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteService(item.id)} className="text-red-400 hover:text-red-300">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}