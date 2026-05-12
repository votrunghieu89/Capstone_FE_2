import { Link, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Wrench,
  MapPin,
  ReceiptText,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import Cookies from "js-cookie"
import useAuthStore from "@/store/authStore"

const mainNav = [
  { title: "Tổng quan", href: "/admin", icon: LayoutDashboard },
  { title: "Quản lý tài khoản", href: "/admin/yeu-cau", icon: ClipboardList },
  { title: "Kỹ thuật viên", href: "/admin/ky-thuat-vien", icon: Users },
  { title: "Dịch vụ", href: "/admin/dich-vu", icon: Wrench },
  { title: "Thành phố", href: "/admin/thanh-pho", icon: MapPin },
  { title: "Hóa đơn", href: "/admin/hoa-don", icon: ReceiptText },
]

export function AppSidebar() {
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  // Lấy dữ liệu user trực tiếp từ Zustand store để đảm bảo đồng bộ
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  const handleLogout = () => {
    logout()
    Cookies.remove("token")
    localStorage.clear()
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
      <Link to="/admin" className="flex items-center gap-3 px-5 py-5 hover:opacity-80 transition-opacity">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#2563eb] shadow-lg shadow-blue-900/20">
          <Wrench className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-white">FastFix</span>
            <span className="text-[11px] text-slate-500 font-medium">Hệ thống Quản trị</span>
          </div>
        )}
      </Link>

      <Separator className="bg-slate-800/50 mx-3" />

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 px-3 py-4 overflow-y-auto">
        <span className={cn(
          "text-[10px] font-bold uppercase tracking-[0.1em] text-slate-600 mb-2",
          collapsed ? "text-center" : "px-3"
        )}>
          {collapsed ? "•••" : "Menu điều hướng"}
        </span>

        {mainNav.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                isActive
                  ? "bg-[#2563eb] text-white shadow-lg shadow-blue-900/20 font-semibold"
                  : "text-slate-400 font-medium hover:bg-white/5 hover:text-white",
                collapsed && "justify-center px-0 w-10 h-10 mx-auto"
              )}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span className="flex-1 truncate">{item.title}</span>}
            </Link>
          )
        })}

      </nav>

      {/* User Section */}
      <div className="px-3 pb-4 space-y-2">
        <Separator className="bg-white/5 mb-3" />

        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 bg-white/[0.03] rounded-xl border border-white/[0.05]">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white text-xs font-black shadow-md">
              {/* Tự động lấy chữ cái đầu của email từ store */}
              {user?.email?.charAt(0).toUpperCase() || "A"}
            </div>

            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-semibold text-white truncate">
                {/* Hiển thị Role làm tên vì store chưa có fullName */}
                {user?.role === "Admin" ? "Quản trị viên" : "Admin"}
              </span>
              <span className="text-[10px] text-slate-500 truncate leading-tight font-medium">
                {/* ĐÂY LÀ PHẦN QUAN TRỌNG: Lấy đúng email từ store bạn đã chụp */}
                {user?.email || "Chưa cập nhật email"}
              </span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full h-9 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-all"
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>
    </aside>
  )
}