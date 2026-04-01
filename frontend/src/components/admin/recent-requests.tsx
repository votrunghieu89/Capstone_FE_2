import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MoreHorizontal, Eye } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const recentRequests = [
  {
    id: "YC-001",
    customer: "Nguyễn Văn A",
    phone: "0912 345 678",
    service: "Sửa điện",
    address: "123 Lê Lợi, Q.1, TP.HCM",
    status: "dang-xu-ly" as const,
    priority: "cao" as const,
    date: "25/02/2026",
    technician: "Trần Văn B",
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
    technician: "Chưa gán",
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
    technician: "Hoàng Văn E",
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
    technician: "Nguyễn Văn G",
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
    technician: "Chưa gán",
  },
]

const statusMap = {
  "dang-xu-ly": { label: "Đang xử lý", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  "cho-xu-ly": { label: "Chờ xử lý", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  "hoan-thanh": { label: "Hoàn thành", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
}

const priorityMap = {
  "cao": { label: "Cao", className: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
  "trung-binh": { label: "Trung bình", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  "thap": { label: "Thấp", className: "bg-white/5 text-zinc-400 border-white/10" },
}

export function RecentRequests() {
  return (
    <Card className="border border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-semibold text-card-foreground">
          Yêu cầu sửa chữa gần đây
        </CardTitle>
        <Button variant="outline" size="sm" className="text-xs">
          Xem tất cả
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-semibold">Mã YC</TableHead>
              <TableHead className="text-xs font-semibold">Khách hàng</TableHead>
              <TableHead className="text-xs font-semibold">Dịch vụ</TableHead>
              <TableHead className="text-xs font-semibold hidden lg:table-cell">Địa chỉ</TableHead>
              <TableHead className="text-xs font-semibold">Trạng thái</TableHead>
              <TableHead className="text-xs font-semibold hidden md:table-cell">Ưu tiên</TableHead>
              <TableHead className="text-xs font-semibold hidden md:table-cell">KTV</TableHead>
              <TableHead className="text-xs font-semibold w-[40px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentRequests.map((request) => (
              <TableRow key={request.id} className="hover:bg-muted/50">
                <TableCell className="font-mono text-xs font-medium text-primary">
                  {request.id}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-card-foreground">
                      {request.customer}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {request.phone}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-card-foreground">
                  {request.service}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground hidden lg:table-cell max-w-[200px] truncate">
                  {request.address}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={statusMap[request.status].className}
                  >
                    {statusMap[request.status].label}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge
                    variant="outline"
                    className={priorityMap[request.priority].className}
                  >
                    {priorityMap[request.priority].label}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-card-foreground hidden md:table-cell">
                  {request.technician}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Tùy chọn</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" />
                        Xem chi tiết
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
  )
}
