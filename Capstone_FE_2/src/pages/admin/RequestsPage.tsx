import { useEffect, useMemo, useState } from "react"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
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
import { ChevronLeft, ChevronRight, Lock, LockOpen, Search, Loader2, ShieldCheck } from "lucide-react"
import { toast } from "react-hot-toast"
import { ConfirmToast } from "@/components/admin/ConfirmToast"
import { adminGet, adminPut, normalizeListPayload } from "@/utils/adminHttp"

// Cập nhật Type hỗ trợ Admin
type AccountRole = "nguoi-dung" | "ky-thuat-vien" | "admin"

type AccountItem = {
  id: string
  email: string
  phone: string
  role: AccountRole
  isActive: boolean
  isVerified: boolean
  createdAt: string
}

// Cập nhật Map hiển thị thêm Admin
const roleMap: Record<AccountRole, { label: string; className: string }> = {
  "nguoi-dung": { label: "Người dùng", className: "bg-[#0d2747] text-[#5eb3ff] border-[#1b436f]" },
  "ky-thuat-vien": { label: "Kỹ thuật viên", className: "bg-[#33250f] text-[#f8ba4b] border-[#7b5a22]" },
  "admin": { label: "Quản trị viên", className: "bg-[#2d0a0a] text-[#ff4d4d] border-[#5a1a1a]" },
}

// Hàm chuẩn hóa đã hỗ trợ nhận diện Admin từ Backend
function normalizeRole(role?: string): AccountRole | null {
  const value = (role || "").trim().toLowerCase()
  if (value === "customer" || value === "nguoi-dung") return "nguoi-dung"
  if (value === "technician" || value === "ky-thuat-vien") return "ky-thuat-vien"
  if (value === "admin") return "admin"
  return null
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("vi-VN")
}

const ACCOUNTS_PER_PAGE = 8

export default function RequestsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [accounts, setAccounts] = useState<AccountItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<AccountItem | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const payload = await adminGet("/admin/users")
      const data = normalizeListPayload<any>(payload)
      const mapped: AccountItem[] = data.map((u: any) => ({
        id: u.id || u.Id,
        email: u.email || u.Email || "--",
        phone: u.phoneNumber || u.PhoneNumber || u.phone || u.Phone || "--",
        // Logic fix: Ưu tiên normalize, nếu không ra gì mới để mặc định
        role: normalizeRole(u.role || u.Role) || "nguoi-dung",
        isActive: Number(u.isActive ?? u.IsActive ?? 0) === 1,
        isVerified: true,
        createdAt: u.createdAt || u.CreatedAt || u.createAt || u.CreateAt,
      }))
      setAccounts(mapped)
    } catch (err) {
      toast.error("Không thể tải danh sách tài khoản")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      const q = searchQuery.trim().toLowerCase()
      const matchesSearch = q.length === 0 || account.email.toLowerCase().includes(q) || account.phone.toLowerCase().includes(q)
      const matchesRole = roleFilter === "all" || account.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [accounts, searchQuery, roleFilter])

  const totalPages = Math.max(1, Math.ceil(filteredAccounts.length / ACCOUNTS_PER_PAGE))
  const currentPageSafe = Math.min(currentPage, totalPages)
  const paginatedAccounts = filteredAccounts.slice(
    (currentPageSafe - 1) * ACCOUNTS_PER_PAGE,
    currentPageSafe * ACCOUNTS_PER_PAGE
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, roleFilter])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const handleToggleAccountActive = (id: string) => {
    const target = accounts.find((a) => a.id === id)
    if (!target) return

    // Bảo mật: Không cho khóa chính mình/admin khác trên UI
    if (target.role === "admin") {
      toast.error("Không thể thao tác trên tài khoản Quản trị viên")
      return
    }

    const action = target.isActive ? "Khóa" : "Mở khóa"

    toast((t) => (
      <ConfirmToast
        t={t}
        title={`${action} tài khoản này?`}
        message={`Bạn có chắc chắn muốn ${action.toLowerCase()} tài khoản ${target.email}?`}
        onConfirm={() => executeToggleActive(id, target.isActive)}
      />
    ), { position: "top-center" })
  }

  const executeToggleActive = async (id: string, currentStatus: boolean) => {
    const loadId = toast.loading("Đang xử lý...")
    const actionPath = currentStatus ? "lock" : "unlock"
    const snapshot = accounts

    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, isActive: !currentStatus } : a)))

    try {
      const result: any = await adminPut(`/admin/users/${id}/${actionPath}`, {})
      const message = result?.data || result?.message || (currentStatus ? "Đã khóa tài khoản thành công" : "Đã mở khóa tài khoản thành công")
      toast.success(message, { id: loadId })
      await fetchUsers()
    } catch (error: any) {
      setAccounts(snapshot)
      toast.error(error?.response?.data?.error || error?.response?.data?.message || "Thao tác thất bại", { id: loadId })
    }
  }

  const handleOpenDetail = (account: AccountItem) => {
    setSelectedAccount(account)
    setIsDetailOpen(true)
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#070b14] text-slate-100">
      <DashboardHeader title="Quản lý tài khoản" description="Quản lý thông tin và trạng thái người dùng, thợ và quản trị viên" />

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl border border-slate-800 bg-[#0d1322] text-slate-100">
          <DialogHeader><DialogTitle className="text-slate-100 text-lg">Chi tiết tài khoản</DialogTitle></DialogHeader>
          {selectedAccount && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-2">
              <div><p className="text-xs font-semibold text-slate-400 uppercase">Vai trò</p><p className="text-base text-slate-100">{roleMap[selectedAccount.role].label}</p></div>
              <div><p className="text-xs font-semibold text-slate-400 uppercase">Email</p><p className="text-base text-slate-100 break-all">{selectedAccount.email}</p></div>
              <div><p className="text-xs font-semibold text-slate-400 uppercase">Số điện thoại</p><p className="text-base text-slate-100">{selectedAccount.phone}</p></div>
              <div><p className="text-xs font-semibold text-slate-400 uppercase">Trạng thái</p><p className="text-base text-slate-100">{selectedAccount.isActive ? "Hoạt động" : "Tạm khóa"}</p></div>
              <div className="md:col-span-2"><p className="text-xs font-semibold text-slate-400 uppercase">Ngày tạo</p><p className="text-base text-slate-100">{formatDate(selectedAccount.createdAt)}</p></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <main className="flex-1 p-6 flex flex-col gap-5 max-w-[1400px] w-full mx-auto">
        <Card className="border border-slate-800 bg-[#0b111f] shadow-sm rounded-2xl">
          <CardContent className="p-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative flex-1 max-w-[460px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input placeholder="Tìm kiếm theo email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-10 pl-9 bg-[#0f1627] border-slate-700 focus:ring-blue-500/20" />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px] h-10 bg-[#0f1627] border-slate-700 text-slate-200">
                  <SelectValue placeholder="Tất cả vai trò" />
                </SelectTrigger>
                <SelectContent className="bg-[#0f1627] border-slate-700 text-white">
                  <SelectItem value="all">Tất cả vai trò</SelectItem>
                  <SelectItem value="nguoi-dung">Người dùng</SelectItem>
                  <SelectItem value="ky-thuat-vien">Kỹ thuật viên</SelectItem>
                  <SelectItem value="admin">Quản trị viên</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Badge variant="outline" className="bg-[#0f1627] border-slate-700 text-slate-200 px-3 py-1.5 shrink-0">Tổng: {filteredAccounts.length}</Badge>
          </CardContent>
        </Card>

        <Card className="border border-slate-800 bg-[#0b111f] shadow-sm overflow-hidden rounded-2xl">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-[#10172b] border-b border-slate-800">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-slate-300">Email tài khoản</TableHead>
                  <TableHead className="text-center text-slate-300">Vai trò</TableHead>
                  <TableHead className="text-center text-slate-300">Trạng thái</TableHead>
                  <TableHead className="text-center text-slate-300">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-10"><Loader2 className="animate-spin inline mr-2 text-blue-500" /> Đang tải dữ liệu...</TableCell></TableRow>
                ) : filteredAccounts.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-10 text-slate-500">Không tìm thấy tài khoản nào</TableCell></TableRow>
                ) : paginatedAccounts.map((account) => (
                  <TableRow key={account.id} className="hover:bg-[#111b32] border-b border-slate-800/80 cursor-pointer transition-colors" onClick={() => handleOpenDetail(account)}>
                    <TableCell className="text-sm text-slate-400 py-4 font-medium">{account.email}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`w-[135px] justify-center py-1 font-semibold ${roleMap[account.role].className}`}>
                        {account.role === "admin" && <ShieldCheck className="w-3 h-3 mr-1" />}
                        {roleMap[account.role].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`w-[140px] justify-center py-1 ${account.isActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                        <div className={`w-1.5 h-1.5 rounded-full mr-2 ${account.isActive ? "bg-emerald-500" : "bg-red-500"}`} />
                        {account.isActive ? "Hoạt động" : "Bị khóa"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={account.role === "admin"} // Khóa nút cho admin
                        onClick={(e) => { e.stopPropagation(); handleToggleAccountActive(account.id); }}
                        className={cn(
                          "w-28",
                          account.isActive
                            ? "border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                            : "border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10",
                          account.role === "admin" && "opacity-30 cursor-not-allowed grayscale"
                        )}
                      >
                        {account.isActive ? <Lock className="h-3.5 w-3.5 mr-1.5" /> : <LockOpen className="h-3.5 w-3.5 mr-1.5" />}
                        {account.isActive ? "Khóa" : "Mở khóa"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {!isLoading && filteredAccounts.length > ACCOUNTS_PER_PAGE && (
          <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-[#0b111f] px-4 py-3 sm:flex-row">
            <p className="text-sm text-slate-500">
              Hiển thị {(currentPageSafe - 1) * ACCOUNTS_PER_PAGE + 1}
              {" - "}
              {Math.min(currentPageSafe * ACCOUNTS_PER_PAGE, filteredAccounts.length)}
              {" "}trên {filteredAccounts.length} tài khoản
            </p>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPageSafe === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                className="h-9 rounded-xl border-slate-700 bg-[#0f1627] px-3 text-slate-300 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <Button
                  key={page}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    "h-9 min-w-9 rounded-xl border-slate-700 px-3 font-semibold",
                    page === currentPageSafe
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-[#0f1627] text-slate-300 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  {page}
                </Button>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPageSafe === totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                className="h-9 rounded-xl border-slate-700 bg-[#0f1627] px-3 text-slate-300 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}