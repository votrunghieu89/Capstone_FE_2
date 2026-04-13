import { useEffect, useMemo, useState } from "react"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, Search, MoreHorizontal, BriefcaseBusiness, Phone, Star, Eye, Trash2 } from "lucide-react"
import type { TechnicianItem } from "@/types/admin"
import { adminDelete, adminGet, adminPost, normalizeListPayload } from "@/utils/adminHttp"

type TechStatus = "san-sang" | "dang-lam" | "nghi-phep"

type TechItem = {
  id: string
  technicianId: string
  userId: string
  code: string
  name: string
  email: string
  phone: string
  specialty: string
  status: TechStatus
  rating: number
  reviews: number
}

const statusMap: Record<TechStatus, { label: string; className: string }> = {
  "san-sang": { label: "Sẵn sàng", className: "bg-emerald-950/40 text-emerald-300 border-emerald-800" },
  "dang-lam": { label: "Đang làm việc", className: "bg-blue-950/40 text-blue-300 border-blue-800" },
  "nghi-phep": { label: "Nghỉ phép", className: "bg-slate-900/50 text-slate-300 border-slate-700" },
}

const seedTechnicians: TechItem[] = [
  { id: "t1", technicianId: "t1", userId: "t1", code: "KTV-001", name: "Quyet", email: "p@gmail.com", phone: "0123456789", specialty: "Máy giặt & gia dụng", status: "san-sang", rating: 0, reviews: 0 },
  { id: "t2", technicianId: "t2", userId: "t2", code: "KTV-002", name: "quyết", email: "a@gmail.com", phone: "0123456789", specialty: "Nước & ống nước", status: "san-sang", rating: 0, reviews: 0 },
  { id: "t3", technicianId: "t3", userId: "t3", code: "KTV-003", name: "Hồ SĨ T", email: "trieu@gmail.com", phone: "555667778", specialty: "Khóa & cửa", status: "nghi-phep", rating: 0, reviews: 0 },
  { id: "t4", technicianId: "t4", userId: "t4", code: "KTV-004", name: "Bùi Quyết", email: "quyet123@gmail.com", phone: "1112223334", specialty: "Chưa cập nhật", status: "san-sang", rating: 0, reviews: 0 },
  { id: "t5", technicianId: "t5", userId: "t5", code: "KTV-005", name: "Đỗ Kim S", email: "sang@gmail.com", phone: "0988889999", specialty: "Điện lạnh", status: "nghi-phep", rating: 0, reviews: 0 },
  { id: "t6", technicianId: "t6", userId: "t6", code: "KTV-006", name: "Bùi Văn Q", email: "quang@gmail.com", phone: "0900000011", specialty: "Sơn sửa", status: "san-sang", rating: 0, reviews: 0 },
]

function mapTechnician(item: TechnicianItem, index: number): TechItem {
  const status: TechStatus = item.isActive
    ? item.isAvailable
      ? "san-sang"
      : "dang-lam"
    : "nghi-phep"

  return {
    id: item.userId || item.id,
    technicianId: item.id,
    userId: item.userId || item.id,
    code: `KTV-${String(index + 1).padStart(3, "0")}`,
    name: item.fullName,
    email: item.email,
    phone: item.phone || "--",
    specialty: item.bio || "Chưa cập nhật",
    status,
    rating: Number(item.averageRating || 0),
    reviews: item.totalReviews || 0,
  }
}

function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean)
  if (parts.length === 0) return "K"
  return parts.slice(0, 2).map((s) => s[0].toUpperCase()).join("")
}

export default function TechniciansPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [technicians, setTechnicians] = useState<TechItem[]>(seedTechnicians)
  const [selectedTech, setSelectedTech] = useState<TechItem | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [formError, setFormError] = useState("")
  const [newTech, setNewTech] = useState({
    name: "",
    email: "",
    phone: "",
    specialty: "",
    status: "san-sang" as TechStatus,
  })

  const reloadTechnicians = async () => {
    const data = await adminGet("/admin/technicians")
    const list = normalizeListPayload<TechnicianItem>(data).map(mapTechnician)
    setTechnicians(list)
  }

  useEffect(() => {
    let mounted = true

    ;(async () => {
      try {
        const data = await adminGet("/admin/technicians")
        const list = normalizeListPayload<TechnicianItem>(data).map(mapTechnician)
        if (!mounted) return
        setTechnicians(list)
      } catch {
        if (!mounted) return
        setTechnicians(seedTechnicians)
      } finally {
        if (!mounted) return
        setIsLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  const filteredTechnicians = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return technicians.filter((tech) => {
      const matchesSearch =
        q.length === 0 ||
        tech.name.toLowerCase().includes(q) ||
        tech.code.toLowerCase().includes(q) ||
        tech.phone.toLowerCase().includes(q) ||
        tech.specialty.toLowerCase().includes(q)

      const matchesStatus = statusFilter === "all" || tech.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [searchQuery, statusFilter, technicians])

  const readyCount = technicians.filter((t) => t.status === "san-sang").length
  const busyCount = technicians.filter((t) => t.status === "dang-lam").length
  const leaveCount = technicians.filter((t) => t.status === "nghi-phep").length

  const openDetail = (tech: TechItem) => {
    setSelectedTech(tech)
    setIsDetailOpen(true)
  }

  const deleteTech = async (tech: TechItem) => {
    const snapshot = technicians
    setTechnicians((prev) => prev.filter((t) => t.id !== tech.id))

    try {
      const candidateIds = Array.from(new Set([tech.userId, tech.technicianId, tech.id].filter(Boolean)))
      let deleted = false

      for (const candidateId of candidateIds) {
        try {
          await adminDelete(`/admin/technicians/${candidateId}`)
          deleted = true
          break
        } catch {
          // try next candidate id
        }
      }

      if (!deleted) {
        for (const candidateId of candidateIds) {
          try {
            await adminDelete(`/admin/users/${candidateId}`)
            deleted = true
            break
          } catch {
            // try next candidate id
          }
        }
      }

      if (!deleted) {
        throw new Error("Cannot delete technician with provided IDs")
      }

      await reloadTechnicians()
    } catch {
      setTechnicians(snapshot)
    }
  }

  const handleCreateTechnician = async () => {
    const name = newTech.name.trim()
    const email = newTech.email.trim()
    const phone = newTech.phone.trim()
    const specialty = newTech.specialty.trim() || "Chưa cập nhật"

    if (!name || !email || !phone) {
      setFormError("Vui lòng nhập đầy đủ họ tên, email và số điện thoại")
      return
    }

    const nextNumber = technicians.length + 1
    const tempId = `t${Date.now()}`
    const item: TechItem = {
      id: tempId,
      technicianId: tempId,
      userId: tempId,
      code: `KTV-${String(nextNumber).padStart(3, "0")}`,
      name,
      email,
      phone,
      specialty,
      status: newTech.status,
      rating: 0,
      reviews: 0,
    }

    setTechnicians((prev) => [item, ...prev])
    setIsCreateOpen(false)
    setFormError("")
    setNewTech({ name: "", email: "", phone: "", specialty: "", status: "san-sang" })

    try {
      await adminPost("/admin/technicians", {
        fullName: name,
        email,
        phone,
        password: "123456Aa@",
        bio: specialty,
        experienceYears: 0,
        hourlyRate: undefined,
        isAvailable: newTech.status === "san-sang",
      })

      await reloadTechnicians()
    } catch {
      // Keep optimistic local row if API create fails.
    }
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#070b14] text-slate-100">
      <DashboardHeader
        title="Kỹ thuật viên"
        description="Quản lý đội ngũ kỹ thuật viên sửa chữa"
      />

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-xl border border-slate-800 bg-[#0d1322] text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-slate-100 text-lg">Chi tiết kỹ thuật viên</DialogTitle>
          </DialogHeader>
          {selectedTech && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs uppercase text-slate-400 font-semibold">Họ tên</p>
                <p className="text-base text-slate-100 font-semibold">{selectedTech.name}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-400 font-semibold">Mã kỹ thuật viên</p>
                <p className="text-base text-slate-100">{selectedTech.code}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-400 font-semibold">Số điện thoại</p>
                <p className="text-base text-slate-100">{selectedTech.phone}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-400 font-semibold">Email</p>
                <p className="text-base text-slate-100 break-all">{selectedTech.email}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-400 font-semibold">Trạng thái</p>
                <Badge variant="outline" className={statusMap[selectedTech.status].className}>
                  {statusMap[selectedTech.status].label}
                </Badge>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-400 font-semibold">Đánh giá</p>
                <p className="text-base text-slate-100">{selectedTech.rating} ({selectedTech.reviews} đánh giá)</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs uppercase text-slate-400 font-semibold">Chuyên môn</p>
                <p className="text-base text-slate-100">{selectedTech.specialty}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open)
          if (!open) {
            setFormError("")
          }
        }}
      >
        <DialogContent className="max-w-lg border border-slate-800 bg-[#0d1322] text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-slate-100 text-lg">Thêm kỹ thuật viên</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-400 uppercase">Họ tên</p>
              <Input
                value={newTech.name}
                onChange={(e) => setNewTech((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Nhập họ tên"
                className="bg-[#101a2f] border-slate-700 text-slate-100 placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-400 uppercase">Email</p>
              <Input
                value={newTech.email}
                onChange={(e) => setNewTech((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="Nhập email"
                className="bg-[#101a2f] border-slate-700 text-slate-100 placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-400 uppercase">Số điện thoại</p>
              <Input
                value={newTech.phone}
                onChange={(e) => setNewTech((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="Nhập số điện thoại"
                className="bg-[#101a2f] border-slate-700 text-slate-100 placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-400 uppercase">Chuyên môn</p>
              <Input
                value={newTech.specialty}
                onChange={(e) => setNewTech((prev) => ({ ...prev, specialty: e.target.value }))}
                placeholder="Ví dụ: Điện lạnh, nước, khóa cửa..."
                className="bg-[#101a2f] border-slate-700 text-slate-100 placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-400 uppercase">Trạng thái</p>
              <Select
                value={newTech.status}
                onValueChange={(value) => setNewTech((prev) => ({ ...prev, status: value as TechStatus }))}
              >
                <SelectTrigger className="bg-[#101a2f] border-slate-700 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-slate-700 bg-[#101a2f] text-slate-100">
                  <SelectItem value="san-sang">Sẵn sàng</SelectItem>
                  <SelectItem value="dang-lam">Đang làm việc</SelectItem>
                  <SelectItem value="nghi-phep">Nghỉ phép</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formError && (
              <p className="text-sm text-red-300">{formError}</p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="outline"
                className="border-slate-700 text-slate-200 hover:bg-slate-800"
                onClick={() => setIsCreateOpen(false)}
              >
                Hủy
              </Button>
              <Button className="bg-[#2563eb] hover:bg-[#1e4fc7] text-white" onClick={handleCreateTechnician}>
                Lưu kỹ thuật viên
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <main className="flex-1 p-6 flex flex-col gap-4 max-w-[1400px] w-full mx-auto">
        <Card className="border border-slate-800 bg-[#0b111f] shadow-sm rounded-xl">
          <CardContent className="p-4 flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    placeholder="Tìm kiếm kỹ thuật viên..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-[#101a2f] border-slate-700 text-slate-100 placeholder:text-slate-500"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px] bg-[#101a2f] border-slate-700 text-slate-100">
                    <SelectValue placeholder="Tất cả" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-700 bg-[#101a2f] text-slate-100">
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="san-sang">Sẵn sàng</SelectItem>
                    <SelectItem value="dang-lam">Đang làm việc</SelectItem>
                    <SelectItem value="nghi-phep">Nghỉ phép</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="bg-[#2563eb] hover:bg-[#1e4fc7] text-white" onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm kỹ thuật viên
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-[#101a2f] text-slate-200 border-slate-700">Tổng: {technicians.length}</Badge>
              <Badge variant="outline" className="bg-emerald-950/40 text-emerald-300 border-emerald-800">Sẵn sàng: {readyCount}</Badge>
              <Badge variant="outline" className="bg-blue-950/40 text-blue-300 border-blue-800">Đang làm việc: {busyCount}</Badge>
              <Badge variant="outline" className="bg-slate-900/50 text-slate-300 border-slate-700">Nghỉ phép: {leaveCount}</Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {isLoading && (
            <div className="col-span-full text-center text-slate-400 py-8">Đang tải dữ liệu...</div>
          )}
          {filteredTechnicians.map((tech) => (
            <Card
              key={tech.id}
              className="border border-slate-800 bg-[#0b111f] rounded-2xl hover:border-slate-700 transition-colors cursor-pointer"
              onClick={() => openDetail(tech)}
            >
              <CardContent className="p-5 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="h-11 w-11 rounded-full border border-slate-700 bg-[#101a2f] flex items-center justify-center text-[#3b82f6] font-bold">
                      {getInitials(tech.name)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-100 text-sm leading-none">{tech.name}</p>
                      <p className="text-xs text-[#3b82f6] mt-1">{tech.code}</p>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="border-slate-700 bg-[#1a2644] text-slate-100">
                      <DropdownMenuItem onSelect={() => openDetail(tech)}>
                        <Eye className="h-4 w-4" />
                        Xem chi tiết
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-400 focus:text-red-300" onSelect={() => deleteTech(tech)}>
                        <Trash2 className="h-4 w-4" />
                        Xóa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <Badge variant="outline" className={`w-fit ${statusMap[tech.status].className}`}>
                  {statusMap[tech.status].label}
                </Badge>

                <div className="space-y-2">
                  <p className="text-sm text-slate-300 flex items-center gap-2">
                    <BriefcaseBusiness className="h-4 w-4 text-slate-400" />
                    {tech.specialty}
                  </p>
                  <p className="text-sm text-slate-300 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    {tech.phone}
                  </p>
                </div>

                <div className="border-t border-slate-800 pt-3 text-sm text-slate-300 flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  <span className="font-semibold">{tech.rating}</span>
                  <span className="text-slate-500">({tech.reviews})</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
