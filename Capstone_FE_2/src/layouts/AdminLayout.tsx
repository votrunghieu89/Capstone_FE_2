import { Outlet } from "react-router-dom"
import { AppSidebar } from "@/components/admin/app-sidebar"
import { useEffect, useState } from "react"
import {
  getAnyAccessToken,
  getRoleFromAccessToken,
  getRoleFromPersistedStore,
  isTokenExpired,
} from "@/utils/authToken"

function isExplicitNonAdmin(role?: string): boolean {
  if (!role) return false
  const normalized = role.trim().toLowerCase()
  return !(normalized === "admin" || normalized === "administrator" || normalized.includes("admin"))
}

export default function AdminLayout() {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    const accessToken = getAnyAccessToken()
    const tokenRole = getRoleFromAccessToken(accessToken)
    const persistedRole = getRoleFromPersistedStore()

    if (!accessToken || isTokenExpired(accessToken)) {
      window.location.href = '/?login=admin'
      return
    }

    // Only block when role is explicitly non-admin.
    if (isExplicitNonAdmin(tokenRole)) {
      window.location.href = '/?login=admin'
      return
    }

    // Fallback to persisted role only when token has no role claim.
    if (!tokenRole && isExplicitNonAdmin(persistedRole)) {
      window.location.href = '/?login=admin'
      return
    }

    if (localStorage.getItem('accessToken') !== accessToken) {
      localStorage.setItem('accessToken', accessToken)
    }

    setIsAuthorized(true)
  }, [])

  if (isAuthorized === null) return null

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Outlet />
      </div>
    </div>
  )
}
