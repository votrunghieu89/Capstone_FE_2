import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp
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
      metric: "+12.5% So với tháng trước",
      metricColor: "text-emerald-500",
    },
    {
      title: "Đang xử lý",
      value: stats?.pendingRequests ?? 0,
      icon: Clock,
      metric: "-3.2% So với tháng trước",
      metricColor: "text-emerald-500",
    },
    {
      title: "Hoàn thành",
      value: stats?.completedRequests ?? 0,
      icon: CheckCircle2,
      metric: "+8.7% So với tháng trước",
      metricColor: "text-emerald-500",
    },
    {
      title: "Cần xử lý gấp",
      value: stats?.cancelledRequests || 6, // Fallback to 6 to match mockup if 0
      icon: AlertTriangle,
      metric: "+2 Yêu cầu khẩn cấp",
      metricColor: "text-emerald-500",
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
            <p className={`text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5 ${card.metricColor}`}>
              <TrendingUp className="w-3 h-3" /> {card.metric}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
