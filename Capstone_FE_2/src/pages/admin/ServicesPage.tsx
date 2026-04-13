import { useEffect, useMemo, useState } from "react"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

const seedServices: ServiceItem[] = [
  { id: "s1", name: "Điện", totalRequests: 0, completedRequests: 0 },
  { id: "s2", name: "Điều hòa", totalRequests: 0, completedRequests: 0 },
  { id: "s3", name: "Gia dụng", totalRequests: 0, completedRequests: 0 },
  { id: "s4", name: "Khóa", totalRequests: 0, completedRequests: 0 },
  { id: "s5", name: "Nước", totalRequests: 0, completedRequests: 0 },
  { id: "s6", name: "Sơn", totalRequests: 0, completedRequests: 0 },
]

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>(seedServices)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [formError, setFormError] = useState("")
  const [newService, setNewService] = useState({
    name: "",
    description: "",
  })

  useEffect(() => {
    let mounted = true

    ;(async () => {
      try {
        let payload: unknown
        try {
          payload = await adminGet("/admin/services-summary")
        } catch {
          payload = await adminGet("/admin/services")
        }

        const rows = normalizeListPayload<AdminServiceSummaryItem>(payload).map((row, index) => ({
          id: `s${index + 1}`,
          name: row.name,
          totalRequests: Number(row.total || 0),
          completedRequests: Number(row.completed || 0),
        }))

        if (!mounted) return
        if (rows.length > 0) setServices(rows)
      } catch {
        if (!mounted) return
        setServices(seedServices)
      } finally {
        if (!mounted) return
        setIsLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  const filteredServices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return services
    return services.filter((item) => item.name.toLowerCase().includes(q))
  }, [searchQuery, services])

  const totalRequests = services.reduce((sum, item) => sum + item.totalRequests, 0)

  const handleDeleteService = async (id: string) => {
    const target = services.find((item) => item.id === id)
    if (!target) return

    const snapshot = services
    setServices((prev) => prev.filter((item) => item.id !== id))

    try {
      await adminDelete(`/admin/services/${encodeURIComponent(target.name)}`)
    } catch {
      setServices(snapshot)
    }
  }

  const handleCreateService = async () => {
    const name = newService.name.trim()
    if (!name) {
      setFormError("Vui lòng nhập tên dịch vụ")
      return
    }

    const duplicated = services.some((item) => item.name.toLowerCase() === name.toLowerCase())
    if (duplicated) {
      setFormError("Tên dịch vụ đã tồn tại")
      return
    }

    const item: ServiceItem = {
      id: `s${Date.now()}`,
      name,
      description: newService.description.trim(),
      totalRequests: 0,
      completedRequests: 0,
    }

    setServices((prev) => [item, ...prev])
    setNewService({ name: "", description: "" })
    setFormError("")
    setIsCreateOpen(false)

    try {
      await adminPost("/admin/services", {
        name,
        description: newService.description.trim() || undefined,
      })

      let payload: unknown
      try {
        payload = await adminGet("/admin/services-summary")
      } catch {
        payload = await adminGet("/admin/services")
      }

      const rows = normalizeListPayload<AdminServiceSummaryItem>(payload).map((row, index) => ({
        id: `s${index + 1}`,
        name: row.name,
        totalRequests: Number(row.total || 0),
        completedRequests: Number(row.completed || 0),
      }))
      if (rows.length > 0) setServices(rows)
    } catch {
      // Keep optimistic local row if API create fails.
    }
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#070b14] text-slate-100">
      <DashboardHeader
        title="Dịch vụ"
        description="Theo dõi các nhóm dịch vụ từ dữ liệu yêu cầu sửa chữa"
      />

      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open)
          if (!open) setFormError("")
        }}
      >
          <DialogContent className="max-w-lg border border-slate-800 bg-[#0d1322] text-slate-100">
            <DialogHeader>
            <DialogTitle className="text-base text-slate-100">Thêm dịch vụ mới</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-200">Tên dịch vụ</p>
              <Input
                value={newService.name}
                onChange={(e) => setNewService((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Nhập tên dịch vụ"
                className="bg-[#101a2f] border-slate-700 text-slate-100 placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-200">Mô tả (không bắt buộc)</p>
              <Input
                value={newService.description}
                onChange={(e) => setNewService((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Mô tả ngắn về dịch vụ"
                className="bg-[#101a2f] border-slate-700 text-slate-100 placeholder:text-slate-500"
              />
            </div>

            {formError && <p className="text-xs text-red-300">{formError}</p>}

            <Button className="w-full bg-[#2563eb] hover:bg-[#1e4fc7] text-white text-sm" onClick={handleCreateService}>
              Thêm dịch vụ
            </Button>
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
          <CardContent className="p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Tìm dịch vụ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-[#101a2f] border-slate-700 text-slate-100 placeholder:text-slate-500"
              />
            </div>
            <Button className="bg-[#2563eb] hover:bg-[#1e4fc7] text-white text-sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm dịch vụ
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-slate-800 bg-[#0b111f] rounded-xl">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {isLoading && (
                <div className="col-span-full text-center py-6 text-slate-400">Đang tải dữ liệu...</div>
              )}
              {filteredServices.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-700 bg-[#14171f] p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-100 leading-none">{item.name}</p>
                      <p className="text-xs text-slate-400 mt-2">Tổng yêu cầu: {item.totalRequests}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg border border-slate-800 text-red-400 hover:text-red-300 hover:bg-red-950/20"
                      onClick={() => handleDeleteService(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mt-3">
                    <span className="inline-flex items-center rounded-md border border-emerald-800 bg-emerald-950/40 px-2 py-1 text-xs font-semibold text-emerald-300">
                      Hoàn thành: {item.completedRequests}
                    </span>
                  </div>
                </div>
              ))}

              {filteredServices.length === 0 && (
                <div className="col-span-full text-center py-10 text-slate-400">
                  Không có dịch vụ phù hợp
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
