import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import type { RequestItem, UserItem } from "@/lib/api"
import { useMemo } from "react"

interface DashboardChartsProps {
  requests: RequestItem[]
  users: UserItem[]
  loading?: boolean
}

const MONTH_LABELS = ["T11", "T12", "T1", "T2", "T3", "T4"]
const MONTH_KEYS = [10, 11, 0, 1, 2, 3]

function buildMonthlyRequests(requests: RequestItem[]) {
  return MONTH_LABELS.map((label, index) => {
    const monthKey = MONTH_KEYS[index]
    const total = requests.filter((item) => {
      const date = new Date(item.createdAt)
      return !Number.isNaN(date.getTime()) && date.getMonth() === monthKey
    }).length

    return { name: label, total }
  })
}

function buildMonthlyAccounts(users: UserItem[]) {
  return MONTH_LABELS.map((label, index) => {
    const monthKey = MONTH_KEYS[index]

    const customer = users.filter((item) => {
      const date = new Date(item.createdAt)
      return !Number.isNaN(date.getTime()) && date.getMonth() === monthKey && item.role?.toLowerCase() === "customer"
    }).length

    const technician = users.filter((item) => {
      const date = new Date(item.createdAt)
      return !Number.isNaN(date.getTime()) && date.getMonth() === monthKey && item.role?.toLowerCase() === "technician"
    }).length

    return { name: label, customer, technician }
  })
}

function buildServiceStats(requests: RequestItem[]) {
  const map = new Map<string, number>()
  requests.forEach((item) => {
    if (!item.categoryName) return
    map.set(item.categoryName, (map.get(item.categoryName) || 0) + 1)
  })
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
}

export function DashboardCharts({ requests, users, loading }: DashboardChartsProps) {
  const monthlyRequests = useMemo(() => buildMonthlyRequests(requests), [requests])
  const monthlyAccounts = useMemo(() => buildMonthlyAccounts(users), [users])
  const serviceStats = useMemo(() => buildServiceStats(requests), [requests])

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border border-white/5 bg-white/5 lg:col-span-2 shadow-sm rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-3 font-semibold text-white">
              Yêu cầu theo tháng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyRequests} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2d4d" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #1e293b",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "13px",
                  }}
                />
                <Bar
                  dataKey="total"
                  name="Yêu cầu"
                  fill="#2563eb"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-white/5 bg-white/5 shadow-sm rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-3 font-semibold text-white">
              Phân loại dịch vụ
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[280px] flex items-center justify-center">
            {loading ? (
              <p className="text-sm text-slate-400">Đang tải dữ liệu...</p>
            ) : serviceStats.length === 0 ? (
              <p className="text-sm text-slate-400">Chưa có dữ liệu để thống kê</p>
            ) : (
              <div className="w-full space-y-3">
                {serviceStats.map((item) => (
                  <div key={item.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>{item.name}</span>
                      <span>{item.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{
                          width: `${Math.max(
                            8,
                            (item.value / Math.max(...serviceStats.map((s) => s.value), 1)) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border border-white/5 bg-white/5 shadow-sm rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-white">
            Tài khoản được tạo theo tháng (thợ và người dùng)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyAccounts} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2d4d" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #1e293b",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "13px",
                }}
              />
              <Bar
                dataKey="customer"
                name="Người dùng"
                fill="#2563eb"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="technician"
                name="Kỹ thuật viên"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
