import { useState } from "react"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Phone,
  MapPin,
  Calendar,
  User,
} from "lucide-react"

const allRequests = [
  {
    id: "YC-001",
    customer: "Nguyễn Văn A",
    phone: "0912 345 678",
    service: "Sửa điện",
    address: "123 Lê Lợi, Q.1, TP.HCM",
    status: "dang-xu-ly" as const,
    priority: "cao" as const,
    date: "25/02/2026",
    time: "08:30",
    technician: "Trần Văn B",
    description: "Mất điện phòng ngủ, cầu dao tự nhảy liên tục",
    cost: "350,000d",
  },
  {
    id: "YC-002",
    customer: "Lê Thị C",
    phone: "0987 654 321",
    service: "Sửa nước",
    address: "456 Nguyễn Huệ, Q.3, TP.HCM",
    status: "cho-xu-ly" as const,
    priority: "trung-binh" as const,
    date: "25/02/2026",
    time: "09:15",
    technician: "Chưa gán",
    description: "Ống nước bị rò rỉ phòng bếp",
    cost: "--",
  },
  {
    id: "YC-003",
    customer: "Phạm Văn D",
    phone: "0909 111 222",
    service: "Sửa điều hòa",
    address: "789 Hai Bà Trưng, Q.5, TP.HCM",
    status: "hoan-thanh" as const,
    priority: "thap" as const,
    date: "24/02/2026",
    time: "14:00",
    technician: "Hoàng Văn E",
    description: "Điều hòa không mát, cần vệ sinh và nạp gas",
    cost: "500,000d",
  },
  {
    id: "YC-004",
    customer: "Võ Thị F",
    phone: "0933 444 555",
    service: "Sửa máy giặt",
    address: "321 Võ Văn Tần, Q.10, TP.HCM",
    status: "dang-xu-ly" as const,
    priority: "cao" as const,
    date: "24/02/2026",
    time: "10:45",
    technician: "Nguyễn Văn G",
    description: "Máy giặt không vắt, bị kẹt nước bên trong",
    cost: "450,000d",
  },
  {
    id: "YC-005",
    customer: "Đặng Văn H",
    phone: "0966 777 888",
    service: "Sửa khóa",
    address: "654 CMT8, Q.Tân Bình, TP.HCM",
    status: "cho-xu-ly" as const,
    priority: "trung-binh" as const,
    date: "24/02/2026",
    time: "16:30",
    technician: "Chưa gán",
    description: "Khóa cửa chính bị kẹt, không mở được",
    cost: "--",
  },
  {
    id: "YC-006",
    customer: "Trần Thị I",
    phone: "0922 333 444",
    service: "Sửa điện",
    address: "987 Phạm Văn Đồng, Q.Bình Thạnh, TP.HCM",
    status: "da-huy" as const,
    priority: "thap" as const,
    date: "23/02/2026",
    time: "11:00",
    technician: "--",
    description: "Khách hàng tự hủy yêu cầu",
    cost: "--",
  },
  {
    id: "YC-007",
    customer: "Bùi Văn J",
    phone: "0944 555 666",
    service: "Sửa nước",
    address: "147 Lý Thường Kiệt, Q.11, TP.HCM",
    status: "hoan-thanh" as const,
    priority: "cao" as const,
    date: "23/02/2026",
    time: "07:00",
    technician: "Lê Văn K",
    description: "Ống nước chính bị vỡ, nước tràn ra nhà",
    cost: "800,000d",
  },
  {
    id: "YC-008",
    customer: "Ngô Thị L",
    phone: "0977 888 999",
    service: "Sửa điều hòa",
    address: "258 Bạch Đằng, Q.Phú Nhuận, TP.HCM",
    status: "dang-xu-ly" as const,
    priority: "trung-binh" as const,
    date: "23/02/2026",
    time: "13:30",
    technician: "Hoàng Văn E",
    description: "Điều hòa bị chảy nước, không lạnh đủ",
    cost: "400,000d",
  },
]

const statusMap: Record<string, { label: string; className: string }> = {
  "dang-xu-ly": { label: "Đang xử lý", className: "bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe]" },
  "cho-xu-ly": { label: "Chờ xử lý", className: "bg-[#fffbeb] text-[#f59e0b] border-[#fde68a]" },
  "hoan-thanh": { label: "Hoàn thành", className: "bg-[#ecfdf5] text-[#10b981] border-[#a7f3d0]" },
  "da-huy": { label: "Đã hủy", className: "bg-red-50 text-red-600 border-red-200" },
}

const priorityMap: Record<string, { label: string; className: string }> = {
  "cao": { label: "Cao", className: "bg-red-50 text-red-600 border-red-200" },
  "trung-binh": { label: "Trung bình", className: "bg-[#fffbeb] text-[#f59e0b] border-[#fde68a]" },
  "thap": { label: "Thấp", className: "bg-slate-100 text-slate-600 border-slate-200" },
}

export default function RequestsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedRequest, setSelectedRequest] = useState<typeof allRequests[0] | null>(null)

  const filteredRequests = allRequests.filter((request) => {
    const matchesSearch =
      request.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.service.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || request.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
      <DashboardHeader
        title="Yêu cầu sửa chữa"
        description="Quản lý và theo dõi tất cả các yêu cầu sửa chữa"
      />
      <main className="flex-1 p-6 flex flex-col gap-5 max-w-[1600px] w-full mx-auto">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Tìm kiếm yêu cầu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-[#2563eb]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] bg-slate-50 border-slate-200 focus:ring-[#2563eb]">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="cho-xu-ly">Chờ xử lý</SelectItem>
                  <SelectItem value="dang-xu-ly">Đang xử lý</SelectItem>
                  <SelectItem value="hoan-thanh">Hoàn thành</SelectItem>
                  <SelectItem value="da-huy">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-md font-medium px-5">
                <Plus className="h-4 w-4 mr-2" />
                Tạo yêu cầu mới
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Tạo yêu cầu sửa chữa mới</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label>Họ tên khách hàng</Label>
                    <Input placeholder="Nhập họ tên..." />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Số điện thoại</Label>
                    <Input placeholder="0xxx xxx xxx" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Địa chỉ</Label>
                  <Input placeholder="Nhập địa chỉ đầy đủ..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label>Loại dịch vụ</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn dịch vụ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dien">Sửa điện</SelectItem>
                        <SelectItem value="nuoc">Sửa nước</SelectItem>
                        <SelectItem value="dieu-hoa">Sửa điều hòa</SelectItem>
                        <SelectItem value="may-giat">Sửa máy giặt</SelectItem>
                        <SelectItem value="khoa">Sửa khóa</SelectItem>
                        <SelectItem value="khac">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Mức độ ưu tiên</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn mức độ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cao">Cao</SelectItem>
                        <SelectItem value="trung-binh">Trung bình</SelectItem>
                        <SelectItem value="thap">Thấp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Mô tả chi tiết</Label>
                  <Textarea placeholder="Mô tả sự cố cần sửa chữa..." rows={3} />
                </div>
                <Button className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white w-full mt-2">
                  Tạo yêu cầu
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary badges */}
        <div className="flex flex-wrap gap-2 mb-2">
          <Badge variant="outline" className="bg-white text-slate-700 border-slate-200 px-3 py-1.5 shadow-sm text-xs font-semibold">
            Tất cả: {allRequests.length}
          </Badge>
          <Badge variant="outline" className="bg-[#fffbeb] text-[#f59e0b] border-[#fde68a] px-3 py-1.5 shadow-sm text-xs font-semibold">
            Chờ xử lý: {allRequests.filter((r) => r.status === "cho-xu-ly").length}
          </Badge>
          <Badge variant="outline" className="bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe] px-3 py-1.5 shadow-sm text-xs font-semibold">
            Đang xử lý: {allRequests.filter((r) => r.status === "dang-xu-ly").length}
          </Badge>
          <Badge variant="outline" className="bg-[#ecfdf5] text-[#10b981] border-[#a7f3d0] px-3 py-1.5 shadow-sm text-xs font-semibold">
            Hoàn thành: {allRequests.filter((r) => r.status === "hoan-thanh").length}
          </Badge>
        </div>

        {/* Table */}
        <Card className="border border-slate-200 bg-white shadow-sm overflow-hidden rounded-xl">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50 border-b border-slate-200">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-bold text-slate-600 h-12">Mã YC</TableHead>
                  <TableHead className="text-xs font-bold text-slate-600 h-12">Khách hàng</TableHead>
                  <TableHead className="text-xs font-bold text-slate-600 h-12">Dịch vụ</TableHead>
                  <TableHead className="text-xs font-bold text-slate-600 h-12 hidden lg:table-cell">Địa chỉ</TableHead>
                  <TableHead className="text-xs font-bold text-slate-600 h-12 text-center">Trạng thái</TableHead>
                  <TableHead className="text-xs font-bold text-slate-600 h-12 text-center hidden md:table-cell">Ưu tiên</TableHead>
                  <TableHead className="text-xs font-bold text-slate-600 h-12 hidden md:table-cell">Ngày tạo</TableHead>
                  <TableHead className="text-xs font-bold text-slate-600 h-12 hidden lg:table-cell">KTV</TableHead>
                  <TableHead className="text-xs font-bold text-slate-600 h-12 hidden lg:table-cell">Chi phí</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id} className="hover:bg-slate-50 border-b border-slate-100 transition-colors">
                    <TableCell className="font-mono text-xs font-semibold text-[#2563eb]">
                      {request.id}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-800">
                          {request.customer}
                        </span>
                        <span className="text-[11px] text-slate-500 mt-0.5">
                          {request.phone}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[13px] font-medium text-slate-700">
                      {request.service}
                    </TableCell>
                    <TableCell className="text-[13px] text-slate-500 hidden lg:table-cell max-w-[200px] truncate">
                      {request.address}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`font-semibold ${statusMap[request.status]?.className}`}>
                        {statusMap[request.status]?.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center hidden md:table-cell">
                      <Badge variant="outline" className={`font-semibold ${priorityMap[request.priority]?.className}`}>
                        {priorityMap[request.priority]?.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[13px] text-slate-500 hidden md:table-cell">
                      {request.date}
                    </TableCell>
                    <TableCell className="text-[13px] font-medium text-slate-700 hidden lg:table-cell">
                      {request.technician}
                    </TableCell>
                    <TableCell className="text-[13px] font-bold text-slate-800 hidden lg:table-cell">
                      {request.cost}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-800">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Tùy chọn</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => setSelectedRequest(request)} className="cursor-pointer">
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {/* Detail Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Chi tiết yêu cầu{" "}
              <span className="font-mono text-[#2563eb]">{selectedRequest?.id}</span>
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="flex flex-col gap-4 py-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={statusMap[selectedRequest.status]?.className}>
                  {statusMap[selectedRequest.status]?.label}
                </Badge>
                <Badge variant="outline" className={priorityMap[selectedRequest.priority]?.className}>
                  Ưu tiên: {priorityMap[selectedRequest.priority]?.label}
                </Badge>
              </div>

              <div className="flex flex-col gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 mt-0.5 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-sm font-semibold text-slate-800">{selectedRequest.customer}</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 mt-0.5 text-slate-400 shrink-0" />
                  <span className="text-sm text-slate-600">{selectedRequest.phone}</span>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 mt-0.5 text-slate-400 shrink-0" />
                  <span className="text-sm text-slate-600 leading-relaxed">{selectedRequest.address}</span>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 mt-0.5 text-slate-400 shrink-0" />
                  <span className="text-sm text-slate-600">{selectedRequest.date} lúc {selectedRequest.time}</span>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mô tả sự cố</Label>
                <p className="text-[13px] text-slate-700 mt-1.5 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">{selectedRequest.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kỹ thuật viên</Label>
                  <p className="text-sm font-bold text-slate-800 mt-1">{selectedRequest.technician}</p>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Chi phí</Label>
                  <p className="text-sm font-bold text-[#2563eb] mt-1">
                    {selectedRequest.cost}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
