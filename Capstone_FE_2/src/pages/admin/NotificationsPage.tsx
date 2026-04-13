import { useEffect, useMemo, useState, type ComponentType } from "react"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Separator } from "@/components/ui/separator"
import {
  Bell,
  CheckCheck,
  Search,
  ShieldAlert,
  MessageSquare,
  UserPlus,
  UserCog,
  Trash2,
} from "lucide-react"
import { adminApi } from "@/services/adminApi"
import type { AdminNotificationItem, UserDetailItem } from "@/types/admin"
import toast from "react-hot-toast"

type NotificationType = "system" | "account" | "security" | "feedback"

type NotificationItem = {
  id: string
  title: string
  message: string
  createdAt: string
  type: NotificationType
  referenceId: string | null
  referenceType: string | null
  read: boolean
}

const typeMeta: Record<
  NotificationType,
  {
    label: string
    icon: ComponentType<{ className?: string }>
    badgeClass: string
  }
> = {
  system: {
    label: "Hệ thống",
    icon: Bell,
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
  },
  account: {
    label: "Tài khoản",
    icon: UserPlus,
    badgeClass: "bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe]",
  },
  security: {
    label: "Bảo mật",
    icon: ShieldAlert,
    badgeClass: "bg-red-50 text-red-600 border-red-200",
  },
  feedback: {
    label: "Phản hồi KH",
    icon: MessageSquare,
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
}

function toRelativeTime(isoDate: string) {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return isoDate

  const diffMs = date.getTime() - Date.now()
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const rtf = new Intl.RelativeTimeFormat("vi", { numeric: "auto" })

  if (Math.abs(diffMs) < hour) {
    return rtf.format(Math.round(diffMs / minute), "minute")
  }
  if (Math.abs(diffMs) < day) {
    return rtf.format(Math.round(diffMs / hour), "hour")
  }

  return rtf.format(Math.round(diffMs / day), "day")
}

function normalizeType(type: string | null): NotificationType {
  const value = (type || "").trim().toLowerCase()
  if (value === "account") return "account"
  if (value === "security") return "security"
  if (value === "feedback") return "feedback"
  return "system"
}

function mapApiItem(item: AdminNotificationItem): NotificationItem {
  return {
    id: item.id,
    title: item.title,
    message: item.message,
    createdAt: toRelativeTime(item.createdAt),
    type: normalizeType(item.notificationType),
    referenceId: item.referenceId,
    referenceType: item.referenceType,
    read: item.isRead,
  }
}

function mapRoleLabel(role: string) {
  const normalized = role.toLowerCase()
  if (normalized === "customer") return "Người dùng"
  if (normalized === "technician") return "Kỹ thuật viên"
  if (normalized === "admin") return "Quản trị viên"
  return role
}

export default function NotificationsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState<"all" | "unread" | NotificationType>("all")
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [registrationDetail, setRegistrationDetail] = useState<UserDetailItem | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [approving, setApproving] = useState(false)

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const params = {
        search: searchQuery || undefined,
        type:
          filter === "account" || filter === "security" || filter === "system" || filter === "feedback"
            ? filter
            : undefined,
        unreadOnly: filter === "unread" ? true : undefined,
      }

      const data: AdminNotificationItem[] = await adminApi.getNotifications(params)
      setNotifications(data.map(mapApiItem))
    } catch (err: any) {
      const message = err?.response?.data?.message || "Không thể tải thông báo"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadNotifications()
    }, 250)

    return () => clearTimeout(timer)
  }, [searchQuery, filter])

  const filteredNotifications = useMemo(() => notifications, [notifications])

  const unreadCount = notifications.filter((item) => !item.read).length

  const markAllAsRead = async () => {
    setActionLoading(true)
    try {
      await adminApi.markAllNotificationsRead()
      await loadNotifications()
    } catch (err: any) {
      const message = err?.response?.data?.message || "Không thể cập nhật thông báo"
      toast.error(message)
    } finally {
      setActionLoading(false)
    }
  }

  const clearReadNotifications = async () => {
    setActionLoading(true)
    try {
      await adminApi.deleteReadNotifications()
      await loadNotifications()
    } catch (err: any) {
      const message = err?.response?.data?.message || "Không thể xóa thông báo đã đọc"
      toast.error(message)
    } finally {
      setActionLoading(false)
    }
  }

  const toggleReadState = async (item: NotificationItem) => {
    setActionLoading(true)
    try {
      await adminApi.updateNotificationRead(item.id, !item.read)
      await loadNotifications()
    } catch (err: any) {
      const message = err?.response?.data?.message || "Không thể cập nhật trạng thái thông báo"
      toast.error(message)
    } finally {
      setActionLoading(false)
    }
  }

  const openNotificationDetail = async (item: NotificationItem) => {
    setSelectedNotification(item)
    setRegistrationDetail(null)
    setIsDetailOpen(true)

    if (item.type !== "account" || item.referenceType !== "user_registration" || !item.referenceId) {
      return
    }

    setDetailLoading(true)
    try {
      const userDetail: UserDetailItem = await adminApi.getUserDetail(item.referenceId)
      setRegistrationDetail(userDetail)
    } catch (err: any) {
      const message = err?.response?.data?.message || "Không thể tải thông tin tài khoản đăng ký"
      toast.error(message)
    } finally {
      setDetailLoading(false)
    }
  }

  const approveRegistrationAccount = async () => {
    if (!registrationDetail) return

    setApproving(true)
    try {
      await adminApi.approveUserAccount(registrationDetail.id, true)
      toast.success("Duyệt tài khoản thành công")

      const refreshed = await adminApi.getUserDetail(registrationDetail.id)
      setRegistrationDetail(refreshed)
      await loadNotifications()
    } catch (err: any) {
      const message = err?.response?.data?.message || "Không thể duyệt tài khoản"
      toast.error(message)
    } finally {
      setApproving(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
      <DashboardHeader
        title="Thông báo"
        description="Theo dõi yêu cầu đăng ký tài khoản và phản hồi của khách hàng"
      />

      <main className="flex-1 p-6 flex flex-col gap-5 max-w-[1200px] w-full mx-auto">
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardContent className="p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Tìm kiếm thông báo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-[#2563eb]"
                />
              </div>

              <Select value={filter} onValueChange={(value) => setFilter(value as "all" | "unread" | NotificationType)}>
                <SelectTrigger className="w-[170px] bg-slate-50 border-slate-200 focus:ring-[#2563eb]">
                  <SelectValue placeholder="Lọc thông báo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="unread">Chưa đọc</SelectItem>
                  <SelectItem value="feedback">Phản hồi KH</SelectItem>
                  <SelectItem value="account">Tài khoản</SelectItem>
                  <SelectItem value="security">Bảo mật</SelectItem>
                  <SelectItem value="system">Hệ thống</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={markAllAsRead}
                className="border-slate-200 hover:bg-transparent"
                disabled={unreadCount === 0 || actionLoading}
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Đánh dấu tất cả đã đọc
              </Button>
              <Button
                variant="outline"
                onClick={clearReadNotifications}
                className="border-slate-200 text-red-600 hover:text-red-700 hover:bg-transparent"
                disabled={actionLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Xóa đã đọc
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="bg-white text-slate-700 border-slate-200 px-3 py-1.5 text-xs font-semibold">
            Tất cả: {notifications.length}
          </Badge>
          <Badge variant="outline" className="bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe] px-3 py-1.5 text-xs font-semibold">
            Chưa đọc: {unreadCount}
          </Badge>
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1.5 text-xs font-semibold">
            Phản hồi KH: {notifications.filter((item) => item.type === "feedback").length}
          </Badge>
          <Badge variant="outline" className="bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe] px-3 py-1.5 text-xs font-semibold">
            Yêu cầu đăng ký: {notifications.filter((item) => item.type === "account").length}
          </Badge>
          <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 px-3 py-1.5 text-xs font-semibold">
            Bảo mật: {notifications.filter((item) => item.type === "security").length}
          </Badge>
        </div>

        <Card className="border border-slate-200 bg-white shadow-sm overflow-hidden rounded-xl">
          <CardContent className="p-0">
            {loading ? (
              <div className="px-6 py-12 text-center text-slate-500">
                <p className="font-medium">Đang tải thông báo...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-500">
                <Bell className="h-8 w-8 mx-auto mb-3 text-slate-400" />
                <p className="font-medium">Không có thông báo phù hợp</p>
                <p className="text-sm mt-1">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {filteredNotifications.map((item) => {
                  const meta = typeMeta[item.type]
                  const Icon = meta.icon

                  return (
                    <div
                      key={item.id}
                      className="px-5 py-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between cursor-pointer hover:bg-slate-50/60 transition-colors"
                      onClick={() => openNotificationDetail(item)}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="mt-0.5 w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-slate-600" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                            <Badge variant="outline" className={meta.badgeClass}>
                              {meta.label}
                            </Badge>
                            {!item.read && (
                              <Badge variant="outline" className="bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe]">
                                Mới
                              </Badge>
                            )}
                          </div>

                          <p className="text-sm text-slate-600 leading-relaxed">{item.message}</p>

                          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                            <UserCog className="h-3.5 w-3.5" />
                            <span>{item.createdAt}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleReadState(item)
                          }}
                          className="border-slate-200 hover:bg-transparent"
                          disabled={actionLoading}
                        >
                          {item.read ? "Đánh dấu chưa đọc" : "Đánh dấu đã đọc"}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Chi tiết thông báo</DialogTitle>
            </DialogHeader>

            {selectedNotification && (
              <div className="flex flex-col gap-4 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={typeMeta[selectedNotification.type].badgeClass}>
                    {typeMeta[selectedNotification.type].label}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={selectedNotification.read
                      ? "bg-slate-100 text-slate-700 border-slate-200"
                      : "bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe]"}
                  >
                    {selectedNotification.read ? "Đã đọc" : "Chưa đọc"}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-slate-500">Tiêu đề</p>
                  <p className="text-base font-semibold text-slate-900">{selectedNotification.title}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-slate-500">Nội dung</p>
                  <p className="text-sm leading-relaxed text-slate-700">{selectedNotification.message}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-slate-500">Thời gian</p>
                  <p className="text-sm text-slate-700">{selectedNotification.createdAt}</p>
                </div>

                {selectedNotification.type === "account" && selectedNotification.referenceType === "user_registration" && (
                  <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                    <p className="text-sm font-semibold text-slate-800 mb-3">Thông tin tài khoản đăng ký</p>

                    {detailLoading ? (
                      <p className="text-sm text-slate-500">Đang tải thông tin tài khoản...</p>
                    ) : registrationDetail ? (
                      <div className="space-y-2 text-sm text-slate-700">
                        <p><span className="text-slate-500">Họ tên:</span> {registrationDetail.fullName}</p>
                        <p><span className="text-slate-500">Email:</span> {registrationDetail.email}</p>
                        <p><span className="text-slate-500">Số điện thoại:</span> {registrationDetail.phone || "--"}</p>
                        <p><span className="text-slate-500">Vai trò:</span> {mapRoleLabel(registrationDetail.role)}</p>
                        <p>
                          <span className="text-slate-500">Trạng thái duyệt:</span>{" "}
                          {registrationDetail.isVerified ? "Đã duyệt" : "Chờ duyệt"}
                        </p>

                        {!registrationDetail.isVerified && (
                          <div className="pt-2">
                            <Button
                              onClick={approveRegistrationAccount}
                              disabled={approving}
                              className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white"
                            >
                              {approving ? "Đang duyệt..." : "Duyệt tài khoản"}
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">Không tìm thấy thông tin tài khoản.</p>
                    )}
                  </div>
                )}

                <div className="pt-1">
                  <Button
                    variant="outline"
                    className="border-slate-200 hover:bg-transparent"
                    disabled={actionLoading}
                    onClick={() => toggleReadState(selectedNotification)}
                  >
                    {selectedNotification.read ? "Đánh dấu chưa đọc" : "Đánh dấu đã đọc"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Separator className="bg-slate-200" />
      </main>
    </div>
  )
}
