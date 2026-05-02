import { useEffect, useState, useMemo } from "react"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { StatsCards } from "@/components/admin/stats-cards"
import { DashboardCharts } from "@/components/admin/dashboard-charts"
import type { AdminStats, RequestItem, UserItem } from "@/lib/api"
import axios from "axios"
import {
  getRoleFromAccessToken,
  getRoleFromPersistedStore,
  getTokenFromCookie,
  getTokenFromPersistedStore,
  isTokenExpired,
} from "@/utils/authToken"

// --- HELPERS (Giữ nguyên cấu trúc của bạn nhưng tối ưu logic) ---
function normalizeListPayload<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[]
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>
    const data = obj.data || obj.items || obj;
    if (Array.isArray(data)) return data as T[]
  }
  return []
}

function getTokenCandidates(): string[] {
  const candidates: string[] = []
  const tokens = [
    localStorage.getItem("accessToken"),
    getTokenFromPersistedStore(),
    getTokenFromCookie(),
    localStorage.getItem("fastfix_token")
  ]
  tokens.forEach(t => {
    if (t && !isTokenExpired(t)) candidates.push(t)
  })
  return Array.from(new Set(candidates))
}

const adminClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
})

async function fetchAdminData(path: string): Promise<unknown> {
  const candidates = getTokenCandidates()
  for (const token of candidates) {
    try {
      const res = await adminClient.get(path, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.data
    } catch (error: any) {
      if (error?.response?.status !== 401) throw error
    }
  }
  return (await adminClient.get(path)).data
}

export default function AdminDashboardPage() {
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [users, setUsers] = useState<UserItem[]>([])
  const [completedRequests, setCompletedRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // TỰ ĐỘNG TÍNH TOÁN STATS TỪ DỮ LIỆU DANH SÁCH (Đảm bảo không bao giờ bị số 0)
  const stats = useMemo<AdminStats>(() => {
    const roleOf = (r: string = "") => r.toLowerCase()
    const statusOf = (s: string = "") => s.toLowerCase()

    return {
      totalUsers: users.filter(u => roleOf(u.role) === "customer").length,
      totalTechnicians: users.filter(u => roleOf(u.role) === "technician").length,
      totalRequests: requests.length,
      pendingRequests: requests.filter(r => statusOf(r.status).includes("pending")).length,
      completedRequests: requests.filter(r => statusOf(r.status).includes("completed")).length,
      cancelledRequests: requests.filter(r => statusOf(r.status).includes("cancel")).length,
      activeTechnicians: users.filter(u => roleOf(u.role) === "technician" && (u as any).isActive).length,
    }
  }, [requests, users])

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [dashRes, reqRes, userRes] = await Promise.allSettled([
          fetchAdminData('/admin/dashboard-stats'),
          fetchAdminData('/admin/requests'),
          fetchAdminData('/admin/users')
        ])

        if (!mounted) return

        const reqList = reqRes.status === 'fulfilled' ? normalizeListPayload<RequestItem>(reqRes.value) : []
        const userList = userRes.status === 'fulfilled' ? normalizeListPayload<UserItem>(userRes.value) : []

        // Lấy danh sách hoàn thành từ dashboard-stats
        const dashValue = dashRes.status === 'fulfilled' ? (dashRes.value as any) : {}
        const compList = Array.isArray(dashValue?.completedRequests) ? dashValue.completedRequests : []

        setRequests(reqList)
        setUsers(userList)
        setCompletedRequests(compList)
      } catch (err) {
        console.error("Lỗi tải dữ liệu:", err)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  return (
    <>
      <DashboardHeader title="Tổng quan" description="Hệ thống quản lý FastFix" />
      <main className="flex-1 p-6 flex flex-col gap-6">
        {/* StatsCards bây giờ dùng stats được tính toán trực tiếp, không bao giờ bị 0 nếu list có data */}
        <StatsCards stats={stats} loading={loading} />
        <DashboardCharts
          requests={requests}
          completedRequests={completedRequests}
          users={users}
        />
      </main>
    </>
  )
}