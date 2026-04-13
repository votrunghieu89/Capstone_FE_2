import { useEffect, useMemo, useState } from "react"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, CheckCheck, Trash2, Bell, UserRound } from "lucide-react"
import type { AdminNotificationItem } from "@/types/admin"
import { adminDelete, adminGet, adminPost, adminPut, normalizeListPayload } from "@/utils/adminHttp"

type NotificationType = "phan-hoi" | "dang-ky" | "bao-mat"

type NotificationItem = {
  id: string
  title: string
  message: string
  type: NotificationType
  sourceLabel: string
  isRead: boolean
  createdAgo: string
}

const seedNotifications: NotificationItem[] = [
  {
    id: "n1",
    title: "Tài khoản kỹ thuật viên mới được tạo",
    message: "Đã tạo tài khoản kỹ thuật viên p@gmail.com thành công.",
    type: "dang-ky",
    sourceLabel: "Tài khoản",
    isRead: false,
    createdAgo: "3 giờ trước",
  },
  {
    id: "n2",
    title: "Khôi phục dịch vụ",
    message: "Đã khôi phục dịch vụ Điện.",
    type: "bao-mat",
    sourceLabel: "Hệ thống",
    isRead: false,
    createdAgo: "3 giờ trước",
  },
  {
    id: "n3",
    title: "Xóa dịch vụ",
    message: "Đã xóa dịch vụ Điện.",
    type: "bao-mat",
    sourceLabel: "Hệ thống",
    isRead: false,
    createdAgo: "3 giờ trước",
  },
  {
    id: "n4",
    title: "Đã mở khóa kỹ thuật viên",
    message: "Tài khoản kỹ thuật viên a@gmail.com đã được mở khóa.",
    type: "dang-ky",
    sourceLabel: "Tài khoản",
    isRead: false,
    createdAgo: "5 giờ trước",
  },
]

const typeBadgeMap: Record<NotificationType, string> = {
  "phan-hoi": "bg-emerald-950/40 text-emerald-300 border-emerald-800",
  "dang-ky": "bg-blue-950/40 text-blue-300 border-blue-800",
  "bao-mat": "bg-red-950/40 text-red-300 border-red-800",
}

function toRelativeTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Vừa xong"
  const diffHours = Math.max(1, Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60)))
  return `${diffHours} giờ trước`
}

function mapType(input?: string): NotificationType {
  const normalized = (input || "").toLowerCase()
  if (normalized.includes("feedback") || normalized.includes("phan_hoi") || normalized.includes("review")) {
    return "phan-hoi"
  }
  if (normalized.includes("security") || normalized.includes("bao_mat") || normalized.includes("system")) {
    return "bao-mat"
  }
  return "dang-ky"
}

function getPersistedAccountId(): string {
  try {
    const raw = localStorage.getItem("fastfix-auth-storage")
    if (!raw) return ""
    const parsed = JSON.parse(raw) as { state?: { user?: { id?: string } } }
    return parsed?.state?.user?.id || ""
  } catch {
    return ""
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(seedNotifications)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")

  useEffect(() => {
    let mounted = true

    ;(async () => {
      try {
        const payload = await adminGet("/admin/notifications")
        const rows = normalizeListPayload<AdminNotificationItem>(payload).map((item) => ({
          id: item.id,
          title: item.title,
          message: item.message,
          type: mapType(item.notificationType || item.referenceType || undefined),
          sourceLabel: item.referenceType || "Hệ thống",
          isRead: !!item.isRead,
          createdAgo: toRelativeTime(item.createdAt),
        }))

        if (!mounted) return
        if (rows.length > 0) setNotifications(rows)
      } catch {
        if (!mounted) return
        setNotifications(seedNotifications)
      } finally {
        if (!mounted) return
        setIsLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  const filteredNotifications = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return notifications.filter((item) => {
      const matchesSearch =
        q.length === 0 ||
        item.title.toLowerCase().includes(q) ||
        item.message.toLowerCase().includes(q)
      const matchesType = typeFilter === "all" || item.type === typeFilter
      return matchesSearch && matchesType
    })
  }, [notifications, searchQuery, typeFilter])

  const totalCount = notifications.length
  const unreadCount = notifications.filter((item) => !item.isRead).length
  const feedbackCount = notifications.filter((item) => item.type === "phan-hoi").length
  const registerCount = notifications.filter((item) => item.type === "dang-ky").length
  const securityCount = notifications.filter((item) => item.type === "bao-mat").length

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })))

    const accountId = getPersistedAccountId()
    try {
      await adminPut("/admin/notifications/read-all", {})
    } catch {
      try {
        if (accountId) await adminPost(`/notification/mark-all/${accountId}`, {})
      } catch {
        // Keep local state if backend mark-all endpoint is unavailable.
      }
    }
  }

  const clearRead = async () => {
    const snapshot = notifications
    setNotifications((prev) => prev.filter((item) => !item.isRead))

    try {
      await adminDelete("/admin/notifications/read")
    } catch {
      try {
        await adminDelete("/admin/notifications/delete-read")
      } catch {
        setNotifications(snapshot)
      }
    }
  }

  const markRead = async (id: string) => {
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, isRead: true } : item)))

    try {
      await adminPut(`/admin/notifications/${id}/read`, { isRead: true })
    } catch {
      try {
        await adminPost(`/notification/read/${id}`, {})
      } catch {
        // Keep local state if backend read endpoint is unavailable.
      }
    }
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#070b14] text-slate-100">
      <DashboardHeader
        title="Thông báo"
        description="Theo dõi yêu cầu đăng ký tài khoản và phản hồi của khách hàng"
      />

      <main className="flex-1 p-6 flex flex-col gap-4 max-w-[1400px] w-full mx-auto">
        <Card className="border border-slate-800 bg-[#0b111f] rounded-xl">
          <CardContent className="p-4 flex flex-col gap-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    placeholder="Tìm kiếm thông báo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-[#101a2f] border-slate-700 text-slate-100 placeholder:text-slate-500"
                  />
                </div>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[160px] bg-[#101a2f] border-slate-700 text-slate-100">
                    <SelectValue placeholder="Tất cả" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-700 bg-[#101a2f] text-slate-100">
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="phan-hoi">Phản hồi KH</SelectItem>
                    <SelectItem value="dang-ky">Yêu cầu đăng ký</SelectItem>
                    <SelectItem value="bao-mat">Bảo mật</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button className="bg-[#101a2f] hover:bg-[#172340] border border-slate-700 text-slate-100 text-sm" onClick={markAllRead}>
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Đánh dấu tất cả đã đọc
                </Button>
                <Button className="bg-[#101a2f] hover:bg-red-950/30 border border-slate-700 text-red-300 text-sm" onClick={clearRead}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa đã đọc
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-[#101a2f] border-slate-700 text-slate-200 text-xs">Tất cả: {totalCount}</Badge>
              <Badge variant="outline" className="bg-blue-950/40 border-blue-800 text-blue-300 text-xs">Chưa đọc: {unreadCount}</Badge>
              <Badge variant="outline" className="bg-emerald-950/40 border-emerald-800 text-emerald-300 text-xs">Phản hồi KH: {feedbackCount}</Badge>
              <Badge variant="outline" className="bg-blue-950/40 border-blue-800 text-blue-300 text-xs">Yêu cầu đăng ký: {registerCount}</Badge>
              <Badge variant="outline" className="bg-red-950/40 border-red-800 text-red-300 text-xs">Bảo mật: {securityCount}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-800 bg-[#0b111f] rounded-xl overflow-hidden">
          <CardContent className="p-0">
            {isLoading && (
              <div className="text-center py-6 text-slate-400 text-sm">Đang tải dữ liệu...</div>
            )}
            {filteredNotifications.map((item) => (
              <div key={item.id} className="px-5 py-4 border-b border-slate-800/80 hover:bg-[#111b32] transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full border border-slate-800 bg-[#111827] flex items-center justify-center shrink-0">
                      {item.type === "dang-ky" ? (
                        <UserRound className="h-4 w-4 text-slate-400" />
                      ) : (
                        <Bell className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-100">{item.title}</p>
                        <Badge variant="outline" className="text-xs bg-[#111b32] border-slate-700 text-slate-300">
                          {item.sourceLabel}
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${typeBadgeMap[item.type]}`}>
                          Mới
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-300 mt-1">{item.message}</p>
                      <p className="text-xs text-slate-500 mt-1">{item.createdAgo}</p>
                    </div>
                  </div>

                  <Button
                    className="bg-[#101a2f] hover:bg-[#172340] border border-slate-700 text-slate-100 text-sm shrink-0"
                    onClick={() => markRead(item.id)}
                  >
                    Đánh dấu đã đọc
                  </Button>
                </div>
              </div>
            ))}

            {!isLoading && filteredNotifications.length === 0 && (
              <div className="text-center py-10 text-slate-400 text-sm">Không có thông báo phù hợp</div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
