import { useState } from "react"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
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
  MapPin,
  Eye,
  Edit,
  Trash2,
} from "lucide-react"

const technicians = [
  {
    id: "KTV-001",
    name: "Trần Văn B",
    phone: "0912 111 222",
    email: "tranvanb@fixhome.vn",
    specialty: "Điện dân dụng",
    status: "dang-lam" as const,
    jobsDone: 124,
    jobsMonth: 24,
    rating: 4.8,
    reviews: 98,
    initials: "TB",
    area: "Quận 1, 3, 5",
    joinDate: "15/03/2024",
  },
  {
    id: "KTV-002",
    name: "Hoàng Văn E",
    phone: "0933 222 333",
    email: "hoangvane@fixhome.vn",
    specialty: "Điều hòa & máy lạnh",
    status: "ranh" as const,
    jobsDone: 156,
    jobsMonth: 31,
    rating: 4.9,
    reviews: 142,
    initials: "HE",
    area: "Quận 7, Phú Nhuận, Bình Thạnh",
    joinDate: "01/01/2024",
  },
  {
    id: "KTV-003",
    name: "Nguyễn Văn G",
    phone: "0944 333 444",
    email: "nguyenvang@fixhome.vn",
    specialty: "Máy giặt & gia dụng",
    status: "dang-lam" as const,
    jobsDone: 89,
    jobsMonth: 18,
    rating: 4.6,
    reviews: 67,
    initials: "NG",
    area: "Quận 10, 11, Tân Bình",
    joinDate: "10/06/2024",
  },
  {
    id: "KTV-004",
    name: "Lê Văn K",
    phone: "0955 444 555",
    email: "levank@fixhome.vn",
    specialty: "Nước & ống nước",
    status: "nghi" as const,
    jobsDone: 201,
    jobsMonth: 27,
    rating: 4.7,
    reviews: 178,
    initials: "LK",
    area: "Quận 2, 9, Thủ Đức",
    joinDate: "20/09/2023",
  },
  {
    id: "KTV-005",
    name: "Phạm Minh T",
    phone: "0966 555 666",
    email: "phamminht@fixhome.vn",
    specialty: "Sơn & sửa nhà",
    status: "ranh" as const,
    jobsDone: 67,
    jobsMonth: 14,
    rating: 4.5,
    reviews: 52,
    initials: "PT",
    area: "Quận 6, 8, Bình Tân",
    joinDate: "05/11/2024",
  },
  {
    id: "KTV-006",
    name: "Đỗ Quang M",
    phone: "0977 666 777",
    email: "doquangm@fixhome.vn",
    specialty: "Khóa & cửa",
    status: "dang-lam" as const,
    jobsDone: 112,
    jobsMonth: 22,
    rating: 4.8,
    reviews: 89,
    initials: "DM",
    area: "Quận 4, Nhà Bè, Q.12",
    joinDate: "28/05/2024",
  },
]

const techStatusMap: Record<string, { label: string; className: string }> = {
  "dang-lam": { label: "Đang làm việc", className: "bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe]" },
  "ranh": { label: "Sẵn sàng", className: "bg-[#ecfdf5] text-[#10b981] border-[#a7f3d0]" },
  "nghi": { label: "Nghỉ phép", className: "bg-slate-100 text-slate-600 border-slate-200" },
}

export default function TechniciansPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedTech, setSelectedTech] = useState<typeof technicians[0] | null>(null)

  const filteredTechnicians = technicians.filter((tech) => {
    const matchesSearch =
      tech.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tech.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tech.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || tech.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
      <DashboardHeader
        title="Kỹ thuật viên"
        description="Quản lý đội ngũ kỹ thuật viên sửa chữa"
      />
      <main className="flex-1 p-6 flex flex-col gap-5 max-w-[1600px] w-full mx-auto">
        {/* Toolbar */}
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
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-md font-medium px-5">
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
                    <Input placeholder="Nhập họ tên..." />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Số điện thoại</Label>
                    <Input placeholder="0xxx xxx xxx" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Email</Label>
                  <Input placeholder="email@fixhome.vn" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label>Chuyên môn</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn chuyên môn" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dien">Điện dân dụng</SelectItem>
                        <SelectItem value="nuoc">Nước & ống nước</SelectItem>
                        <SelectItem value="dieu-hoa">Điều hòa & máy lạnh</SelectItem>
                        <SelectItem value="gia-dung">Máy giặt & gia dụng</SelectItem>
                        <SelectItem value="khoa">Khóa & cửa</SelectItem>
                        <SelectItem value="son">Sơn & sửa nhà</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Khu vực phụ trách</Label>
                    <Input placeholder="VD: Quận 1, 3, 5" />
                  </div>
                </div>
                <Button className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white w-full mt-2">
                  Thêm kỹ thuật viên
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary */}
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

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTechnicians.map((tech) => (
            <Card key={tech.id} className="border border-slate-200 bg-white hover:shadow-md transition-shadow rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border border-slate-100">
                      <AvatarFallback className="bg-[#eff6ff] text-[#2563eb] font-bold">
                        {tech.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-[15px] font-bold text-slate-800">{tech.name}</h3>
                      <p className="text-[12px] font-mono text-[#2563eb] mt-0.5">{tech.id}</p>
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
                        <Eye className="h-4 w-4 mr-2" />
                        Xem chi tiết
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer">
                        <Edit className="h-4 w-4 mr-2" />
                        Chỉnh sửa
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600 focus:text-red-600 cursor-pointer">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Xóa
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
                  <div className="flex items-start gap-2.5 text-[13px] text-slate-600">
                    <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{tech.area}</span>
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
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-[11px] font-medium text-slate-500">Tháng này: <span className="text-slate-800 font-bold">{tech.jobsMonth} việc</span></span>
                    <Progress value={(tech.jobsMonth / 35) * 100} className="h-1.5 w-24 bg-slate-100" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {/* Detail Dialog */}
      <Dialog open={!!selectedTech} onOpenChange={() => setSelectedTech(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thông tin kỹ thuật viên</DialogTitle>
          </DialogHeader>
          {selectedTech && (
            <div className="flex flex-col gap-4 py-2">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border border-slate-100">
                  <AvatarFallback className="bg-[#eff6ff] text-[#2563eb] text-lg font-bold">
                    {selectedTech.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{selectedTech.name}</h3>
                  <p className="text-sm font-mono text-[#2563eb] font-medium">{selectedTech.id}</p>
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
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="text-sm text-slate-700">{selectedTech.area}</span>
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

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#eff6ff] border border-[#bfdbfe]">
                  <span className="text-xl font-extrabold text-[#2563eb]">{selectedTech.jobsDone}</span>
                  <span className="text-[11px] font-semibold text-[#60a5fa] uppercase tracking-wider mt-1">Tổng việc</span>
                </div>
                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0]">
                  <span className="text-xl font-extrabold text-[#10b981]">{selectedTech.jobsMonth}</span>
                  <span className="text-[11px] font-semibold text-[#34d399] uppercase tracking-wider mt-1">Tháng này</span>
                </div>
                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#fffbeb] border border-[#fde68a]">
                  <div className="flex items-center gap-1 mb-0.5">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="text-xl font-extrabold text-[#f59e0b]">{selectedTech.rating}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-[#fbbf24] uppercase tracking-wider mt-0.5">{selectedTech.reviews} đánh giá</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mt-2 flex justify-between items-center">
                <Label className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider">Ngày tham gia</Label>
                <p className="text-[13px] font-bold text-slate-800">{selectedTech.joinDate}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
