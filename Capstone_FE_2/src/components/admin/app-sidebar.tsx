import { Link, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Wrench,
  MapPin,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import Cookies from "js-cookie"
import useAuthStore from "@/store/authStore"

const mainNav = [
  {
    title: "Tổng quan",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Quản lý tài khoản",
    href: "/admin/yeu-cau",
    icon: ClipboardList,
  },
  {
    title: "Kỹ thuật viên",
    href: "/admin/ky-thuat-vien",
    icon: Users,
  },
  {
    title: "Dịch vụ",
    href: "/admin/dich-vu",
    icon: Wrench,
  },
  {
    title: "Thành phố",
    href: "/admin/thanh-pho",
    icon: MapPin,
  },
]

const secondaryNav = [
  {
    title: "Thông báo",
    href: "/admin/thong-bao",
    icon: Bell,
  },
]

export function AppSidebar() {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false)
  const [adminUser, setAdminUser] = useState<any>(null)
  const logout = useAuthStore((state) => state.logout)

  useEffect(() => {
    // Load user from localStorage
    const storedUser = localStorage.getItem("adminUser")
    if (storedUser) {
      setAdminUser(JSON.parse(storedUser))
    }
  }, [])

  const handleLogout = () => {
    logout()
    Cookies.remove("token")
    localStorage.removeItem("adminUser")
    localStorage.removeItem("accessToken")
    localStorage.removeItem("fastfix-auth-storage")
    localStorage.removeItem("fastfix_token")
    localStorage.removeItem("refreshToken")
    window.location.href = "/"
  }

  return (
    <aside
      className={cn(
        "flex flex-col bg-zinc-950 text-slate-300 border-r border-white/5 transition-all duration-300 h-screen sticky top-0",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 px-5 py-5 hover:opacity-80 transition-opacity">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#2563eb]">
          <Wrench className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-white">
              FastFix
            </span>
            <span className="text-[11px] text-slate-400">
              Quản lý sửa chữa
            </span>
          </div>
        )}
      </Link>

      <Separator className="bg-slate-800 mx-3" />

      {/* Main Navigation */}
      <nav className="flex-1 flex flex-col gap-1 px-3 py-4">
        <span className={cn(
          "text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2",
          collapsed ? "text-center" : "px-3"
        )}>
          {collapsed ? "---" : "Menu chính"}
        </span>
        {mainNav.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                isActive
                  ? "bg-[#2563eb] text-white shadow-md font-semibold"
                  : "text-slate-300 font-medium hover:bg-slate-800 hover:text-white",
                collapsed && "justify-center px-2"
              )}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && (
                <span className="flex-1">{item.title}</span>
              )}
            </Link>
          )
        })}

        <Separator className="bg-white/5 my-3" />

        <span className={cn(
          "text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2",
          collapsed ? "text-center" : "px-3"
        )}>
          {collapsed ? "---" : "Hệ thống"}
        </span>
        {secondaryNav.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                isActive
                  ? "bg-[#2563eb] text-white shadow-md font-semibold"
                  : "text-slate-300 font-medium hover:bg-slate-800 hover:text-white",
                collapsed && "justify-center px-2"
              )}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && (
                <span className="flex-1">{item.title}</span>
              )}
            </Link>
          )
        })}

      </nav>

      {/* User & Collapse */}
      <div className="px-3 pb-4">
        <Separator className="bg-white/5 mb-3" />
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-white text-sm font-bold uppercase">
              {adminUser?.fullName?.charAt(0) || "A"}
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium text-white truncate">
                {adminUser?.fullName || "Admin"}
              </span>
              <span className="text-[11px] text-slate-400 truncate">
                {adminUser?.email || "admin@fastfix.com"}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Đăng xuất</span>
            </Button>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
          <span className="sr-only">Thu gọn menu</span>
        </Button>
      </div>
    </aside>
  )
}
