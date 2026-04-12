import { useEffect, useMemo, useState } from "react"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  Search,
  MoreHorizontal,
  Phone,
  Mail,
  Star,
  Briefcase,
  Eye,
  Trash2,
} from "lucide-react"
import { adminApi } from "@/services/adminApi"
import type { TechnicianItem } from "@/types/admin"
import toast from "react-hot-toast"

type TechStatus = "dang-lam" | "ranh" | "nghi"

type TechCard = {
  displayId: string
  userId: string
  name: string
  phone: string
  email: string
  specialty: string
  status: TechStatus
  jobsDone: number
  rating: number
  reviews: number
  initials: string
  joinDate: string
  experienceYears: number
  hourlyRate: number | null
}

const techStatusMap: Record<string, { label: string; className: string }> = {
  "dang-lam": { label: "Đang làm việc", className: "bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe]" },
  "ranh": { label: "Sẵn sàng", className: "bg-[#ecfdf5] text-[#10b981] border-[#a7f3d0]" },
  "nghi": { label: "Nghỉ phép", className: "bg-slate-100 text-slate-600 border-slate-200" },
}

const initialForm = {
  fullName: "",
  phone: "",
  email: "",
  password: "",
  specialty: "",
  status: "ranh" as TechStatus,
}

function buildInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("")
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("vi-VN")
}

function mapTechnician(item: TechnicianItem, index: number): TechCard {
  const status: TechStatus = item.isActive
    ? item.isAvailable
      ? "ranh"
      : "dang-lam"
    : "nghi"

  return {
    displayId: `KTV-${String(index + 1).padStart(3, "0")}`,
    userId: item.userId,
    name: item.fullName,
    phone: item.phone || "--",
    email: item.email,
    specialty: item.bio || "Chưa cập nhật",
    status,
    jobsDone: item.totalJobsCompleted,
    rating: Number(item.averageRating || 0),
    reviews: item.totalReviews,
    initials: buildInitials(item.fullName) || "TV",
    joinDate: formatDate(item.createdAt),
    experienceYears: item.experienceYears,
    hourlyRate: item.hourlyRate,
  }
}

export default function TechniciansPage() {
  const [technicians, setTechnicians] = useState<TechCard[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedTech, setSelectedTech] = useState<TechCard | null>(null)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState(initialForm)

  const loadTechnicians = async () => {
    try {
      const data: TechnicianItem[] = await adminApi.getTechnicians()
      setTechnicians(data.map(mapTechnician))
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Không thể tải danh sách kỹ thuật viên"
      toast.error(msg)
    }
  }

  useEffect(() => {
    loadTechnicians()
  }, [])

  const filteredTechnicians = useMemo(
    () =>
      technicians.filter((tech) => {
        const matchesSearch =
          tech.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tech.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tech.displayId.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === "all" || tech.status === statusFilter
        return matchesSearch && matchesStatus
      }),
    [technicians, searchQuery, statusFilter]
  )

  const resetForm = () => {
    setFormData(initialForm)
  }

  const openCreateDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const handleSaveTechnician = async () => {
    if (!formData.fullName || !formData.email) {
      toast.error("Vui lòng nhập đủ họ tên và email")
      return
    }

    if (!formData.password) {
      toast.error("Vui lòng nhập mật khẩu khi tạo mới")
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password || undefined,
        phone: formData.phone || undefined,
        bio: formData.specialty || undefined,
        experienceYears: 0,
        hourlyRate: undefined,
        isAvailable: formData.status === "ranh",
      }

      await adminApi.createTechnician({
        ...payload,
        password: formData.password,
      })
      toast.success("Thêm kỹ thuật viên thành công")

      setIsDialogOpen(false)
      resetForm()
      await loadTechnicians()
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Không thể lưu kỹ thuật viên"
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTechnician = async (tech: TechCard) => {
    const ok = window.confirm(`Xóa kỹ thuật viên ${tech.name}?`)
    if (!ok) return

    try {
      await adminApi.deleteTechnician(tech.userId)
      toast.success("Xóa kỹ thuật viên thành công")
      await loadTechnicians()
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Không thể xóa kỹ thuật viên"
      toast.error(msg)
    }
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
      <DashboardHeader title="Kỹ thuật viên" description="Quản lý đội ngũ kỹ thuật viên sửa chữa" />

      <main className="flex-1 p-6 flex flex-col gap-5 max-w-[1600px] w-full mx-auto">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Tìm kiếm kỹ thuật viên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-[#2563eb]"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] bg-slate-50 border-slate-200 focus:ring-[#2563eb]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="ranh">Sẵn sàng</SelectItem>
                <SelectItem value="dang-lam">Đang làm việc</SelectItem>
                <SelectItem value="nghi">Nghỉ phép</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-md font-medium px-5" onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm kỹ thuật viên
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Thêm kỹ thuật viên mới</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label>Họ tên</Label>
                    <Input value={formData.fullName} onChange={(e) => setFormData((p) => ({ ...p, fullName: e.target.value }))} placeholder="Nhập họ tên..." />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Số điện thoại</Label>
                    <Input value={formData.phone} onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))} placeholder="0xxx xxx xxx" />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Email</Label>
                  <Input value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} placeholder="email@fixhome.vn" />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Mật khẩu</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                    placeholder="Nhập mật khẩu"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Chuyên môn</Label>
                  <Select value={formData.specialty} onValueChange={(value) => setFormData((p) => ({ ...p, specialty: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn chuyên môn" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Điện dân dụng">Điện dân dụng</SelectItem>
                      <SelectItem value="Nước & ống nước">Nước & ống nước</SelectItem>
                      <SelectItem value="Điều hòa & máy lạnh">Điều hòa & máy lạnh</SelectItem>
                      <SelectItem value="Máy giặt & gia dụng">Máy giặt & gia dụng</SelectItem>
                      <SelectItem value="Khóa & cửa">Khóa & cửa</SelectItem>
                      <SelectItem value="Sơn & sửa nhà">Sơn & sửa nhà</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Trạng thái</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData((p) => ({ ...p, status: value as TechStatus }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ranh">Sẵn sàng</SelectItem>
                      <SelectItem value="dang-lam">Đang làm việc</SelectItem>
                      <SelectItem value="nghi">Nghỉ phép</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white w-full mt-2" onClick={handleSaveTechnician} disabled={isSubmitting}>
                  {isSubmitting ? "Đang lưu..." : "Thêm kỹ thuật viên"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-wrap gap-2 mb-2">
          <Badge variant="outline" className="bg-white text-slate-700 border-slate-200 px-3 py-1.5 shadow-sm text-xs font-semibold">
            Tổng: {technicians.length}
          </Badge>
          <Badge variant="outline" className="bg-[#ecfdf5] text-[#10b981] border-[#a7f3d0] px-3 py-1.5 shadow-sm text-xs font-semibold">
            Sẵn sàng: {technicians.filter((t) => t.status === "ranh").length}
          </Badge>
          <Badge variant="outline" className="bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe] px-3 py-1.5 shadow-sm text-xs font-semibold">
            Đang làm việc: {technicians.filter((t) => t.status === "dang-lam").length}
          </Badge>
          <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 px-3 py-1.5 shadow-sm text-xs font-semibold">
            Nghỉ phép: {technicians.filter((t) => t.status === "nghi").length}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTechnicians.map((tech) => (
            <Card key={tech.userId} className="border border-slate-200 bg-white hover:shadow-md transition-shadow rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border border-slate-100">
                      <AvatarFallback className="bg-[#eff6ff] text-[#2563eb] font-bold">{tech.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-[15px] font-bold text-slate-800">{tech.name}</h3>
                      <p className="text-[12px] font-mono text-[#2563eb] mt-0.5">{tech.displayId}</p>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-800">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Tùy chọn</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => setSelectedTech(tech)} className="cursor-pointer">
                        <Eye className="h-4 w-4 mr-2" />Xem chi tiết
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteTechnician(tech)} className="text-red-600 focus:text-red-600 cursor-pointer">
                        <Trash2 className="h-4 w-4 mr-2" />Xóa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <Badge variant="outline" className={`font-semibold mb-4 ${techStatusMap[tech.status].className}`}>
                  {techStatusMap[tech.status].label}
                </Badge>

                <div className="flex flex-col gap-2.5">
                  <div className="flex items-start gap-2.5 text-[13px] text-slate-600">
                    <Briefcase className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <span className="font-medium text-slate-700">{tech.specialty}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[13px] text-slate-600">
                    <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>{tech.phone}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="text-[13px] font-bold text-slate-800">{tech.rating}</span>
                    <span className="text-[11px] text-slate-500 ml-0.5">({tech.reviews})</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <Dialog open={!!selectedTech} onOpenChange={() => setSelectedTech(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thông tin kỹ thuật viên</DialogTitle>
          </DialogHeader>
          {selectedTech && (
            <div className="flex flex-col gap-4 py-2">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border border-slate-100">
                  <AvatarFallback className="bg-[#eff6ff] text-[#2563eb] text-lg font-bold">{selectedTech.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{selectedTech.name}</h3>
                  <p className="text-sm font-mono text-[#2563eb] font-medium">{selectedTech.displayId}</p>
                  <Badge variant="outline" className={`mt-2 font-semibold ${techStatusMap[selectedTech.status].className}`}>
                    {techStatusMap[selectedTech.status].label}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-col gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="text-sm font-medium text-slate-700">{selectedTech.specialty}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="text-sm text-slate-700">{selectedTech.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="text-sm text-slate-700">{selectedTech.email}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
