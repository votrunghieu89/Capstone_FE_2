import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { StatsCards } from "@/components/admin/stats-cards"
import { RecentRequests } from "@/components/admin/recent-requests"
import { TechnicianOverview } from "@/components/admin/technician-overview"
import { DashboardCharts } from "@/components/admin/dashboard-charts"
import { api, type AdminStats } from "@/lib/api"

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <DashboardHeader
        title="Tổng quan"
        description="Quản lý toàn bộ yêu cầu sửa chữa dân dụng"
      />
      <main className="flex-1 p-6 flex flex-col gap-6">
        <StatsCards stats={stats} loading={loading} />
        <DashboardCharts />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <RecentRequests />
          </div>
          <div>
            <TechnicianOverview />
          </div>
        </div>
      </main>
    </>
  )
}
