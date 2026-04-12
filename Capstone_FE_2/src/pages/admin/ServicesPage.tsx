import { useEffect, useMemo, useState } from "react"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search, Wrench, ListChecks, Plus, Trash2 } from "lucide-react"
import { adminApi } from "@/services/adminApi"
import type { AdminServiceSummaryItem } from "@/types/admin"
import toast from "react-hot-toast"

export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })
  const [isCreating, setIsCreating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [rows, setRows] = useState<AdminServiceSummaryItem[]>([])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const services: AdminServiceSummaryItem[] = await adminApi.getServicesSummary()
      const withoutHvac = services.filter((item) => item.name.trim().toLowerCase() !== "hvac")
      setRows(withoutHvac)
    } catch (err: any) {
      const message = err?.response?.data?.message || "Không thể tải dữ liệu dịch vụ"
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const resetForm = () => {
    setFormData({ name: "", description: "" })
  }

  const openCreateDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const handleCreateService = async () => {
    const name = formData.name.trim()
    const description = formData.description.trim()

    if (!name) {
      toast.error("Vui lòng nhập tên dịch vụ")
      return
    }

    setIsCreating(true)
    try {
      await adminApi.createService({
        name,
        description: description || null,
      })

      toast.success("Thêm dịch vụ thành công")
      setIsDialogOpen(false)
      resetForm()
      await loadData()
    } catch (err: any) {
      const message = err?.response?.data?.message || "Không thể thêm dịch vụ"
      toast.error(message)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteService = async (serviceName: string) => {
    const ok = window.confirm(`Xóa dịch vụ ${serviceName}?`)
    if (!ok) return

    try {
      await adminApi.deleteService(serviceName)
      toast.success("Xóa dịch vụ thành công")
      await loadData()
    } catch (err: any) {
      const message = err?.response?.data?.message || "Không thể xóa dịch vụ"
      toast.error(message)
    }
  }

  const filteredRows = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase()
    if (!keyword) return rows
    return rows.filter((item) => item.name.toLowerCase().includes(keyword))
  }, [rows, searchQuery])

  const totals = useMemo(() => {
    const totalServices = rows.length
    const totalRequests = rows.reduce((sum, item) => sum + item.total, 0)

    return { totalServices, totalRequests }
  }, [rows])

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
      <DashboardHeader
        title="Dịch vụ"
        description="Theo dõi các nhóm dịch vụ từ dữ liệu yêu cầu sửa chữa"
      />

      <main className="flex-1 p-6 flex flex-col gap-5 max-w-[1200px] w-full mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#eff6ff] text-[#2563eb] flex items-center justify-center">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Tổng dịch vụ</p>
                <p className="text-2xl font-bold text-slate-900">{totals.totalServices}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <ListChecks className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Tổng yêu cầu</p>
                <p className="text-2xl font-bold text-slate-900">{totals.totalRequests}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Tìm dịch vụ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-[#2563eb]"
                />
              </div>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-md font-medium px-5" onClick={openCreateDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm dịch vụ
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Thêm dịch vụ mới</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-4 py-4">
                    <div className="flex flex-col gap-2">
                      <Label>Tên dịch vụ</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Nhập tên dịch vụ"
                        disabled={isCreating}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label>Mô tả (không bắt buộc)</Label>
                      <Input
                        value={formData.description}
                        onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Mô tả ngắn về dịch vụ"
                        disabled={isCreating}
                      />
                    </div>

                    <Button className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white w-full mt-2" onClick={handleCreateService} disabled={isCreating}>
                      {isCreating ? "Đang thêm..." : "Thêm dịch vụ"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm rounded-xl">
          <CardContent className="p-4">
            {isLoading ? (
              <div className="px-2 py-10 text-center text-slate-500">
                <p className="font-medium">Đang tải danh sách dịch vụ...</p>
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="px-2 py-10 text-center text-slate-500">
                <Wrench className="h-8 w-8 mx-auto mb-3 text-slate-400" />
                <p className="font-medium">Không có dữ liệu dịch vụ</p>
                <p className="text-sm mt-1">Hệ thống sẽ hiển thị khi có yêu cầu theo danh mục.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredRows.map((item) => {
                  return (
                    <div
                      key={item.name}
                      className="text-left border rounded-xl p-4 transition border-slate-200 bg-white hover:border-slate-300"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                          <p className="text-xs text-slate-500 mt-1">Tổng yêu cầu: {item.total}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation()
                            handleDeleteService(item.name)
                          }}
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <div className="mt-3">
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          Hoàn thành: {item.completed}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}