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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Lock, LockOpen, Search } from "lucide-react"
import type { UserDetailItem, UserItem } from "@/types/admin"

type AccountRole = "nguoi-dung" | "ky-thuat-vien"

type AccountItem = {
  id: string
  fullName: string
  email: string
  phone: string
  role: AccountRole
  isActive: boolean
  isVerified: boolean
  createdAt: string
}

const roleMap: Record<AccountRole, { label: string; className: string }> = {
  "nguoi-dung": { label: "Người dùng", className: "bg-[#0d2747] text-[#5eb3ff] border-[#1b436f]" },
  "ky-thuat-vien": { label: "Kỹ thuật viên", className: "bg-[#33250f] text-[#f8ba4b] border-[#7b5a22]" },
}

const seedAccounts: AccountItem[] = [
  {
    id: "u1",
    fullName: "Quyet",
    email: "p@gmail.com",
    phone: "0123456789",
    role: "ky-thuat-vien",
    isActive: true,
    isVerified: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "u2",
    fullName: "quyết",
    email: "a@gmail.com",
    phone: "0123456788",
    role: "ky-thuat-vien",
    isActive: true,
    isVerified: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "u3",
    fullName: "Trần Văn H",
    email: "h@gmail.com",
    phone: "0912345678",
    role: "nguoi-dung",
    isActive: true,
    isVerified: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "u4",
    fullName: "Hồ SĨ T",
    email: "trieu@gmail.com",
    phone: "0981112222",
    role: "ky-thuat-vien",
    isActive: false,
    isVerified: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "u5",
    fullName: "Bùi Quyết",
    email: "quyet123@gmail.com",
    phone: "0933334444",
    role: "ky-thuat-vien",
    isActive: true,
    isVerified: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "u6",
    fullName: "Đỗ Đạt",
    email: "dat@gmail.com",
    phone: "0901010101",
    role: "nguoi-dung",
    isActive: false,
    isVerified: true,
    createdAt: new Date().toISOString(),
  },
]

function normalizeRole(role?: string): AccountRole | null {
  const value = (role || "").trim().toLowerCase()
  if (value === "customer" || value === "nguoi-dung") return "nguoi-dung"
  if (value === "technician" || value === "ky-thuat-vien") return "ky-thuat-vien"
  return null
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("vi-VN")
}

export default function RequestsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [accounts, setAccounts] = useState<AccountItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<AccountItem | null>(null)

  useEffect(() => {
    const mapped = seedAccounts.reduce<AccountItem[]>((acc, user) => {
      const role = normalizeRole(user.role)
      if (!role) return acc

      acc.push({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone || "--",
        role,
        isActive: user.isActive,
        isVerified: true,
        createdAt: user.createdAt,
      })

      return acc
    }, [])

    setAccounts(mapped)
    setIsLoading(false)
  }, [])

  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      const q = searchQuery.trim().toLowerCase()
      const matchesSearch =
        q.length === 0 ||
        account.fullName.toLowerCase().includes(q) ||
        account.email.toLowerCase().includes(q) ||
        account.phone.toLowerCase().includes(q)

      const matchesRole = roleFilter === "all" || account.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [accounts, searchQuery, roleFilter])

  const handleToggleAccountActive = async (id: string) => {
    const target = accounts.find((a) => a.id === id)
    if (!target) return
    const nextActive = !target.isActive

    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, isActive: nextActive } : a)))
  }

  const handleOpenDetail = async (account: AccountItem) => {
    setSelectedAccount(account)
    setIsDetailOpen(true)
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#070b14] text-slate-100">
      <DashboardHeader
        title="Quản lý tài khoản"
        description="Hiển thị thông tin tài khoản của thợ và người dùng"
      />

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl border border-slate-800 bg-[#0d1322] text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-slate-100 text-lg">Chi tiết tài khoản</DialogTitle>
          </DialogHeader>

          {selectedAccount && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-2">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Họ tên</p>
                <p className="text-base leading-tight font-semibold text-slate-100">{selectedAccount.fullName}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Vai trò</p>
                <p className="text-base text-slate-100">{roleMap[selectedAccount.role].label}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Email</p>
                <p className="text-base text-slate-100 break-all">{selectedAccount.email}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Số điện thoại</p>
                <p className="text-base text-slate-100">{selectedAccount.phone}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Trạng thái tài khoản</p>
                <p className="text-base text-slate-100">{selectedAccount.isActive ? "Hoạt động" : "Tạm khóa"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Xác minh</p>
                <p className="text-base text-slate-100">{selectedAccount.isVerified ? "Đã duyệt" : "Chưa duyệt"}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs font-semibold text-slate-400 uppercase">Ngày tạo</p>
                <p className="text-base text-slate-100">{formatDate(selectedAccount.createdAt)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <main className="flex-1 p-6 flex flex-col gap-5 max-w-[1400px] w-full mx-auto">
        <Card className="border border-slate-800 bg-[#0b111f] shadow-sm rounded-2xl">
          <CardContent className="p-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative flex-1 max-w-[460px] min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Tìm kiếm tài khoản..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 pl-9 bg-[#0f1627] border-slate-700 text-slate-100 placeholder:text-slate-500"
                />
              </div>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px] h-10 bg-[#0f1627] border-slate-700 text-slate-100">
                  <SelectValue placeholder="Lọc theo vai trò" />
                </SelectTrigger>
                <SelectContent className="border-slate-700 bg-[#0f1627] text-slate-100">
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="nguoi-dung">Người dùng</SelectItem>
                  <SelectItem value="ky-thuat-vien">Kỹ thuật viên</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Badge variant="outline" className="bg-[#0f1627] text-slate-200 border-slate-700 px-3 py-1.5 text-sm font-semibold">
              Tổng: {filteredAccounts.length}
            </Badge>
          </CardContent>
        </Card>

        <Card className="border border-slate-800 bg-[#0b111f] shadow-sm overflow-hidden rounded-2xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#10172b] border-b border-slate-800">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-sm font-semibold text-slate-300 h-14 min-w-[190px]">Họ tên</TableHead>
                  <TableHead className="text-sm font-semibold text-slate-300 h-14 min-w-[240px]">Email</TableHead>
                  <TableHead className="text-sm font-semibold text-slate-300 h-14 text-center min-w-[180px]">Vai trò</TableHead>
                  <TableHead className="text-sm font-semibold text-slate-300 h-14 text-center min-w-[190px]">Trạng thái</TableHead>
                  <TableHead className="text-sm font-semibold text-slate-300 h-14 text-center min-w-[170px]">Thao tác</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-slate-400 py-8">
                      Đang tải dữ liệu...
                    </TableCell>
                  </TableRow>
                )}
                {filteredAccounts.map((account) => (
                  <TableRow
                    key={account.id}
                    className="hover:bg-[#111b32] border-b border-slate-800/80 transition-colors cursor-pointer"
                    onClick={() => handleOpenDetail(account)}
                  >
                    <TableCell className="text-[15px] font-medium text-slate-100 py-4 leading-none">{account.fullName}</TableCell>
                    <TableCell className="text-sm text-slate-400 max-w-[220px] truncate py-4 leading-none">
                      {account.email}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`font-semibold text-xs px-2.5 py-0.5 rounded-md ${roleMap[account.role].className}`}>
                        {roleMap[account.role].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={
                          account.isActive
                            ? "font-semibold text-xs rounded-md px-2.5 py-0.5 bg-[#0f3c2f] text-[#3fdf95] border-[#1a6f4f]"
                            : "font-semibold text-xs rounded-md px-2.5 py-0.5 bg-[#421216] text-[#ff5656] border-[#8e222b]"
                        }
                      >
                        {account.isActive ? "Đang hoạt động" : "Đang bị khóa"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation()
                          handleToggleAccountActive(account.id)
                        }}
                        className={
                          account.isActive
                            ? "h-9 min-w-[94px] border-[#5f3b15] bg-[#18161c] text-[#f0a342] hover:text-[#f7b659] hover:bg-[#221c20]"
                            : "h-9 min-w-[94px] border-[#12606c] bg-[#111e2b] text-[#66d5e6] hover:text-[#8de8f2] hover:bg-[#16293a]"
                        }
                      >
                        {account.isActive ? <Lock className="h-4 w-4 mr-1" /> : <LockOpen className="h-4 w-4 mr-1" />}
                        {account.isActive ? "Khóa" : "Mở khóa"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {!isLoading && filteredAccounts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-slate-400 py-8">
                      Không có tài khoản phù hợp
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
