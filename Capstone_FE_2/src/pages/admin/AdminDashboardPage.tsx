import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { StatsCards } from "@/components/admin/stats-cards"
import { DashboardCharts } from "@/components/admin/dashboard-charts"
import { api, type AdminStats, type RequestItem, type UserItem } from "@/lib/api"

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [users, setUsers] = useState<UserItem[]>([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [requestsLoading, setRequestsLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(true)

  useEffect(() => {
    api.getStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setStatsLoading(false))

    api.getRequests()
      .then(setRequests)
      .catch(console.error)
      .finally(() => setRequestsLoading(false))

    api.getUsers()
      .then(setUsers)
      .catch(console.error)
      .finally(() => setUsersLoading(false))
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
