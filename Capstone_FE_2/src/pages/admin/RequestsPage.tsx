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
import { Search, Lock, LockOpen } from "lucide-react"
import { adminApi } from "@/services/adminApi"
import type { UserDetailItem, UserItem } from "@/types/admin"
import toast from "react-hot-toast"

type AccountRole = "nguoi-dung" | "ky-thuat-vien"

type AccountItem = {
  id: string
  fullName: string
  email: string
  phone: string
  role: AccountRole
  isActive: boolean
  createdAt: string
}

const roleMap: Record<string, { label: string; className: string }> = {
  "nguoi-dung": { label: "Người dùng", className: "bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe]" },
  "ky-thuat-vien": { label: "Kỹ thuật viên", className: "bg-[#fffbeb] text-[#f59e0b] border-[#fde68a]" },
}

function normalizeRole(role: string): AccountRole | null {
  const value = role.toLowerCase()
  if (value === "customer") return "nguoi-dung"
  if (value === "technician") return "ky-thuat-vien"
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
  const [isLoading, setIsLoading] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<UserDetailItem | null>(null)

  const loadAccounts = async () => {
    setIsLoading(true)
    try {
      const users: UserItem[] = await adminApi.getUsers()
      const mapped = users
        .map((user) => {
          const role = normalizeRole(user.role)
          if (!role) return null

          return {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone || "--",
            role,
            isActive: user.isActive,
            createdAt: user.createdAt,
          } satisfies AccountItem
        })
        .filter((item): item is AccountItem => item !== null)

      setAccounts(mapped)
    } catch (err: any) {
      const message = err?.response?.data?.message || "Không thể tải danh sách tài khoản"
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAccounts()
  }, [])

  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      const matchesSearch =
        account.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.phone.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesRole = roleFilter === "all" || account.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [accounts, searchQuery, roleFilter])

  const handleToggleAccountActive = async (account: AccountItem) => {
    const nextIsActive = !account.isActive
    const actionLabel = nextIsActive ? "mở khóa" : "khóa"
    const confirmed = window.confirm(`Bạn có chắc muốn ${actionLabel} tài khoản ${account.email}?`)
    if (!confirmed) return

    try {
      if (account.role === "ky-thuat-vien") {
        await adminApi.toggleTechnicianActive(account.id, nextIsActive)
      } else {
        await adminApi.toggleUserActive(account.id, nextIsActive)
      }

      toast.success(nextIsActive ? "Mở khóa tài khoản thành công" : "Khóa tài khoản thành công")
      await loadAccounts()
    } catch (err: any) {
      const message = err?.response?.data?.message || `Không thể ${actionLabel} tài khoản`
      toast.error(message)
    }
  }

  const handleOpenAccountDetail = async (account: AccountItem) => {
    setIsDetailOpen(true)
    setIsDetailLoading(true)

    try {
      const detail: UserDetailItem = await adminApi.getUserDetail(account.id)
      setSelectedAccount(detail)
    } catch (err: any) {
      const message = err?.response?.data?.message || "Không thể tải chi tiết tài khoản"
      toast.error(message)
      setIsDetailOpen(false)
      setSelectedAccount(null)
    } finally {
      setIsDetailLoading(false)
    }
  }

  const handleDetailOpenChange = (open: boolean) => {
    setIsDetailOpen(open)
    if (!open) {
      setSelectedAccount(null)
      setIsDetailLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
      <DashboardHeader
        title="Quản lý tài khoản"
        description="Hiển thị thông tin tài khoản của thợ và người dùng"
      />

      <Dialog open={isDetailOpen} onOpenChange={handleDetailOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết tài khoản</DialogTitle>
          </DialogHeader>

          {isDetailLoading && (
            <div className="py-8 text-center text-slate-500">Đang tải chi tiết...</div>
          )}

          {!isDetailLoading && selectedAccount && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase">Họ tên</p>
                <p className="text-sm font-medium text-slate-900">{selectedAccount.fullName}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase">Vai trò</p>
                <p className="text-sm text-slate-800">
                  {normalizeRole(selectedAccount.role) === "ky-thuat-vien" ? "Kỹ thuật viên" : "Người dùng"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase">Email</p>
                <p className="text-sm text-slate-800 break-all">{selectedAccount.email}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase">Số điện thoại</p>
                <p className="text-sm text-slate-800">{selectedAccount.phone || "--"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase">Trạng thái tài khoản</p>
                <p className="text-sm text-slate-800">{selectedAccount.isActive ? "Hoạt động" : "Tạm khóa"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase">Xác minh</p>
                <p className="text-sm text-slate-800">{selectedAccount.isVerified ? "Đã duyệt" : "Chưa duyệt"}</p>
              </div>

              <div className="space-y-1 md:col-span-2">
                <p className="text-xs font-semibold text-slate-500 uppercase">Ngày tạo</p>
                <p className="text-sm text-slate-800">{formatDate(selectedAccount.createdAt)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <main className="flex-1 p-6 flex flex-col gap-4 max-w-[1400px] w-full mx-auto">
        <Card className="border border-slate-200 bg-white shadow-sm rounded-xl">
          <CardContent className="p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Tìm kiếm tài khoản..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-[#2563eb]"
                />
              </div>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200 focus:ring-[#2563eb]">
                  <SelectValue placeholder="Lọc theo vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="nguoi-dung">Người dùng</SelectItem>
                  <SelectItem value="ky-thuat-vien">Kỹ thuật viên</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-white text-slate-700 border-slate-200 px-3 py-1.5 text-xs font-semibold">
                Tổng: {filteredAccounts.length}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm overflow-hidden rounded-xl">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50 border-b border-slate-200">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-bold text-slate-600 h-12">Họ tên</TableHead>
                  <TableHead className="text-xs font-bold text-slate-600 h-12 hidden md:table-cell">Email</TableHead>
                  <TableHead className="text-xs font-bold text-slate-600 h-12 text-center">Vai trò</TableHead>
                  <TableHead className="text-xs font-bold text-slate-600 h-12 text-center">Trạng thái</TableHead>
                  <TableHead className="text-xs font-bold text-slate-600 h-12 text-center">Thao tác</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                      Đang tải dữ liệu...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && filteredAccounts.map((account) => (
                  <TableRow
                    key={account.id}
                    className="hover:bg-slate-50 border-b border-slate-100 transition-colors cursor-pointer"
                    onClick={() => handleOpenAccountDetail(account)}
                  >
                    <TableCell className="text-sm font-semibold text-slate-800">
                      {account.fullName}
                    </TableCell>
                    <TableCell className="text-[13px] text-slate-600 hidden md:table-cell max-w-[220px] truncate">
                      {account.email}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`font-semibold ${roleMap[account.role]?.className}`}>
                        {roleMap[account.role]?.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={
                          account.isActive
                            ? "font-semibold bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "font-semibold bg-red-50 text-red-700 border-red-200"
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
                          handleToggleAccountActive(account)
                        }}
                        className={
                          account.isActive
                            ? "border-amber-200 text-amber-700 hover:text-amber-800 hover:bg-amber-50"
                            : "border-emerald-200 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                        }
                      >
                        {account.isActive ? (
                          <Lock className="h-4 w-4 mr-1" />
                        ) : (
                          <LockOpen className="h-4 w-4 mr-1" />
                        )}
                        {account.isActive ? "Khóa" : "Mở khóa"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && filteredAccounts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                      Không có tài khoản phù hợp
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
