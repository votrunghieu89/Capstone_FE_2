import { useEffect, useState } from "react"
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

function extractObjectPayload(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== "object") return null

  const obj = payload as Record<string, unknown>
  if (obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)) {
    return obj.data as Record<string, unknown>
  }
  return obj
}

function asNumber(value: unknown): number {
  if (typeof value === "number") return value
  if (typeof value === "string") {
    const parsed = Number(value)
    if (!Number.isNaN(parsed)) return parsed
  }
  return 0
}

function normalizeStatsPayload(payload: unknown): AdminStats | null {
  const data = extractObjectPayload(payload)
  if (!data) return null

  return {
    totalUsers: asNumber(data.totalUsers ?? data.userCount ?? data.totalUser),
    totalTechnicians: asNumber(data.totalTechnicians ?? data.technicianCount ?? data.totalTechnician),
    totalRequests: asNumber(data.totalRequests ?? data.requestCount ?? data.totalRequest),
    pendingRequests: asNumber(data.pendingRequests ?? data.pending ?? data.waitingRequests),
    completedRequests: asNumber(data.completedRequests ?? data.completed ?? data.doneRequests),
    cancelledRequests: asNumber(data.cancelledRequests ?? data.canceledRequests ?? data.cancelled ?? data.canceled),
    activeTechnicians: asNumber(data.activeTechnicians ?? data.onlineTechnicians ?? data.availableTechnicians),
  }
}

function buildStatsFromLists(requests: RequestItem[], users: UserItem[]): AdminStats {
  const roleOf = (role?: string) => (role || "").toLowerCase()
  const totalUsers = users.filter((u) => roleOf(u.role) === "customer" || roleOf(u.role) === "nguoi-dung").length
  const totalTechnicians = users.filter((u) => roleOf(u.role) === "technician" || roleOf(u.role) === "ky-thuat-vien").length
  const activeTechnicians = users.filter(
    (u) => (roleOf(u.role) === "technician" || roleOf(u.role) === "ky-thuat-vien") && u.isActive
  ).length

  const statusOf = (status?: string) => (status || "").toLowerCase()
  const totalRequests = requests.length
  const pendingRequests = requests.filter((r) => statusOf(r.status).includes("pending") || statusOf(r.status).includes("cho")).length
  const completedRequests = requests.filter((r) => statusOf(r.status).includes("completed") || statusOf(r.status).includes("hoan")).length
  const cancelledRequests = requests.filter((r) => statusOf(r.status).includes("cancel") || statusOf(r.status).includes("huy")).length

  return {
    totalUsers,
    totalTechnicians,
    totalRequests,
    pendingRequests,
    completedRequests,
    cancelledRequests,
    activeTechnicians,
  }
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
    if (!role || role.includes("admin") || role === "administrator") {
      candidates.push(token)
    }
  }

  return Array.from(new Set(candidates))
}

const adminDashboardClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

const adminDashboardCookieClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

async function fetchAdminData(path: string): Promise<unknown> {
  const candidates = getTokenCandidates()

  for (const token of candidates) {
    try {
      const res = await adminDashboardClient.get(path, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (localStorage.getItem("accessToken") !== token) {
        localStorage.setItem("accessToken", token)
      }
      return res.data
    } catch (error: any) {
      if (error?.response?.status !== 401) throw error
    }
  }

  const fallback = await adminDashboardCookieClient.get(path)
  return fallback.data
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [users, setUsers] = useState<UserItem[]>([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [requestsLoading, setRequestsLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    ;(async () => {
      const [statsResult, requestsResult, usersResult] = await Promise.allSettled([
        fetchAdminData('/admin/stats'),
        fetchAdminData('/admin/requests'),
        fetchAdminData('/admin/users'),
      ])

      if (!mounted) return

      const parsedRequests =
        requestsResult.status === 'fulfilled'
          ? normalizeListPayload<RequestItem>(requestsResult.value)
          : []
      const parsedUsers =
        usersResult.status === 'fulfilled'
          ? normalizeListPayload<UserItem>(usersResult.value)
          : []

      const parsedStats =
        statsResult.status === 'fulfilled'
          ? normalizeStatsPayload(statsResult.value)
          : null

      setRequests(parsedRequests)
      setUsers(parsedUsers)
      setStats(parsedStats ?? buildStatsFromLists(parsedRequests, parsedUsers))

      setStatsLoading(false)
      setRequestsLoading(false)
      setUsersLoading(false)
    })()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <>
      <DashboardHeader
        title="Tổng quan"
        description="Quản lý toàn bộ yêu cầu sửa chữa dân dụng"
      />
      <main className="flex-1 p-6 flex flex-col gap-6">
        <StatsCards stats={stats} loading={statsLoading} />
        <DashboardCharts
          requests={requests}
          users={users}
          loading={requestsLoading || usersLoading}
        />
      </main>
    </>
  )
}
