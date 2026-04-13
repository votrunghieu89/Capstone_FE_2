import {
  ClipboardList,
  Users,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { AdminStats } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"

interface StatsCardsProps {
  stats: AdminStats | null
  loading?: boolean
}

export function StatsCards({ stats, loading }: StatsCardsProps) {
  const cards = [
    {
      title: "Tổng yêu cầu",
      value: stats?.totalRequests ?? 0,
      icon: ClipboardList,
    },
    {
      title: "Tổng tài khoản",
      value: (stats?.totalUsers ?? 0) + (stats?.totalTechnicians ?? 0),
      icon: Users,
    },
    {
      title: "Hoàn thành",
      value: stats?.completedRequests ?? 0,
      icon: CheckCircle2,
    },
    {
      title: "Đã hủy",
      value: stats?.cancelledRequests ?? 0,
      icon: AlertTriangle,
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border border-border bg-card">
            <CardContent className="p-5">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16 mb-3" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="border border-white/5 bg-white/5 shadow-sm hover:shadow-lg transition-all hover:bg-white/[0.07] group rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">
                  {card.title}
                </span>
                <span className="text-3xl font-black text-white italic tracking-tighter">
                  {card.value.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-white/5 border border-white/5 group-hover:scale-110 transition-transform">
                <card.icon className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
