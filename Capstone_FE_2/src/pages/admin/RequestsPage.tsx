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
import axios from "axios"
import {
  getRoleFromAccessToken,
  getRoleFromPersistedStore,
  getTokenFromCookie,
  getTokenFromPersistedStore,
  isTokenExpired,
} from "@/utils/authToken"
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
  "nguoi-dung": { label: "Người dùng", className: "bg-blue-950/40 text-blue-300 border-blue-800" },
  "ky-thuat-vien": { label: "Kỹ thuật viên", className: "bg-amber-950/40 text-amber-300 border-amber-800" },
}

function normalizeRole(role?: string): AccountRole | null {
  const value = (role || "").trim().toLowerCase()
  if (value === "customer" || value === "nguoi-dung") return "nguoi-dung"
  if (value === "technician" || value === "ky-thuat-vien") return "ky-thuat-vien"
  return null
}

function normalizeListPayload<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[]
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (obj.data && typeof obj.data === "object") {
      const dataObj = obj.data as Record<string, unknown>
      if (Array.isArray(dataObj.items)) return dataObj.items as T[]
    }
  }
  return []
}

function getTokenCandidates(): string[] {
  const lsToken = localStorage.getItem("accessToken") || ""
  const legacyToken = localStorage.getItem("fastfix_token") || ""
  const persistedToken = getTokenFromPersistedStore()
  const persistedRole = getRoleFromPersistedStore()
  const cookieToken = getTokenFromCookie()

  const candidates: string[] = []
  if (persistedRole === "admin" && persistedToken && !isTokenExpired(persistedToken)) {
    candidates.push(persistedToken)
  }
  for (const token of [lsToken, cookieToken, legacyToken, persistedToken]) {
    if (!token || isTokenExpired(token)) continue
    const role = getRoleFromAccessToken(token)
    if (!role || role.includes("admin")) {
      candidates.push(token)
    }
  }
  return Array.from(new Set(candidates))
}

const adminClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
})

const adminCookieClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
})

async function adminGet(path: string): Promise<unknown> {
  const candidates = getTokenCandidates()
  for (const token of candidates) {
    try {
      const res = await adminClient.get(path, { headers: { Authorization: `Bearer ${token}` } })
      if (localStorage.getItem("accessToken") !== token) {
        localStorage.setItem("accessToken", token)
      }
      return res.data
    } catch (error: any) {
      if (error?.response?.status !== 401) throw error
    }
  }
  const fallback = await adminCookieClient.get(path)
  return fallback.data
}

async function adminPut(path: string, data: unknown): Promise<unknown> {
  const candidates = getTokenCandidates()
  for (const token of candidates) {
    try {
      const res = await adminClient.put(path, data, { headers: { Authorization: `Bearer ${token}` } })
      if (localStorage.getItem("accessToken") !== token) {
        localStorage.setItem("accessToken", token)
      }
      return res.data
    } catch (error: any) {
      if (error?.response?.status !== 401) throw error
    }
  }
  const fallback = await adminCookieClient.put(path, data)
  return fallback.data
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
    let mounted = true

    ;(async () => {
      try {
        const data = await adminGet("/admin/users")
        const users = normalizeListPayload<UserItem>(data)

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
              isVerified: true,
              createdAt: user.createdAt,
            } satisfies AccountItem
          })
          .filter((item): item is AccountItem => item !== null)

        if (!mounted) return
        setAccounts(mapped)
      } catch {
        if (!mounted) return
        setAccounts([])
      } finally {
        if (!mounted) return
        setIsLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
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

    try {
      if (target.role === "ky-thuat-vien") {
        await adminPut(`/admin/technicians/${id}/toggle-active`, { isActive: nextActive })
      } else {
        await adminPut(`/admin/users/${id}/toggle-active`, { isActive: nextActive })
      }
      setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, isActive: nextActive } : a)))
    } catch {
      // Keep UI stable if API call fails.
    }
  }

  const handleOpenDetail = async (account: AccountItem) => {
    setSelectedAccount(account)
    setIsDetailOpen(true)

    try {
      const detailData = await adminGet(`/admin/users/${account.id}`)
      const detailObj = (detailData && typeof detailData === "object" && "data" in (detailData as Record<string, unknown>))
        ? ((detailData as Record<string, unknown>).data as UserDetailItem)
        : (detailData as UserDetailItem)

      if (!detailObj) return

      const role = normalizeRole(detailObj.role) || account.role
      setSelectedAccount({
        id: detailObj.id || account.id,
        fullName: detailObj.fullName || account.fullName,
        email: detailObj.email || account.email,
        phone: detailObj.phone || account.phone,
        role,
        isActive: detailObj.isActive,
        isVerified: detailObj.isVerified,
        createdAt: detailObj.createdAt || account.createdAt,
      })
    } catch {
      // Keep already selected row data if detail API fails.
    }
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

      <main className="flex-1 p-6 flex flex-col gap-4 max-w-[1400px] w-full mx-auto">
        <Card className="border border-slate-800 bg-[#0b111f] shadow-sm rounded-xl">
          <CardContent className="p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Tìm kiếm tài khoản..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-[#101a2f] border-slate-700 text-slate-100 placeholder:text-slate-500"
                />
              </div>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px] bg-[#101a2f] border-slate-700 text-slate-100">
                  <SelectValue placeholder="Lọc theo vai trò" />
                </SelectTrigger>
                <SelectContent className="border-slate-700 bg-[#101a2f] text-slate-100">
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="nguoi-dung">Người dùng</SelectItem>
                  <SelectItem value="ky-thuat-vien">Kỹ thuật viên</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Badge variant="outline" className="bg-[#101a2f] text-slate-200 border-slate-700 px-3 py-1.5 text-xs font-semibold">
              Tổng: {filteredAccounts.length}
            </Badge>
          </CardContent>
        </Card>

        <Card className="border border-slate-800 bg-[#0b111f] shadow-sm overflow-hidden rounded-xl">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-[#101a2f] border-b border-slate-800">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-bold text-slate-300 h-12">Họ tên</TableHead>
                  <TableHead className="text-xs font-bold text-slate-300 h-12 hidden md:table-cell">Email</TableHead>
                  <TableHead className="text-xs font-bold text-slate-300 h-12 text-center">Vai trò</TableHead>
                  <TableHead className="text-xs font-bold text-slate-300 h-12 text-center">Trạng thái</TableHead>
                  <TableHead className="text-xs font-bold text-slate-300 h-12 text-center">Thao tác</TableHead>
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
                    <TableCell className="text-sm font-semibold text-slate-100">{account.fullName}</TableCell>
                    <TableCell className="text-[13px] text-slate-400 hidden md:table-cell max-w-[220px] truncate">
                      {account.email}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`font-semibold ${roleMap[account.role].className}`}>
                        {roleMap[account.role].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={
                          account.isActive
                            ? "font-semibold bg-emerald-900/40 text-emerald-300 border-emerald-700"
                            : "font-semibold bg-red-900/40 text-red-300 border-red-700"
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
                            ? "border-amber-700 text-amber-300 hover:text-amber-200 hover:bg-amber-900/30"
                            : "border-emerald-700 text-emerald-300 hover:text-emerald-200 hover:bg-emerald-900/30"
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
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
