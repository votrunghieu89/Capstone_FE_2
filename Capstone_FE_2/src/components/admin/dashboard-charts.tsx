import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useMemo } from "react"

interface DashboardChartsProps {
  requests: any[]
  users: any[]
}

export function DashboardCharts({ requests = [], users = [] }: DashboardChartsProps) {
  // 1. Biểu đồ yêu cầu từ Tháng 1 -> Tháng 12
  const monthlyRequests = useMemo(() => {
    const months = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
    return months.map((label, i) => ({
      name: label,
      total: requests.filter(r => {
        const date = new Date(r.createdAt);
        return date.getMonth() === i; // i chạy từ 0 (Tháng 1) đến 11 (Tháng 12)
      }).length
    }));
  }, [requests]);

  // 2. Biểu đồ phân loại dịch vụ (Dữ liệu từ ServiceCategories)
  const serviceStats = useMemo(() => {
    const map = new Map<string, number>();
    requests.forEach(r => {
      const name = r.serviceName || "Khác";
      map.set(name, (map.get(name) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [requests]);

  // 3. Biểu đồ tài khoản mới từ Tháng 1 -> Tháng 12 (Phân loại Customer/Technician)
  const monthlyAccounts = useMemo(() => {
    const months = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
    return months.map((label, i) => ({
      name: label,
      customer: users.filter(u => {
        const date = new Date(u.createdAt);
        return date.getMonth() === i && u.role?.toLowerCase() === "customer";
      }).length,
      technician: users.filter(u => {
        const date = new Date(u.createdAt);
        return date.getMonth() === i && u.role?.toLowerCase() === "technician";
      }).length
    }));
  }, [users]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Biểu đồ 1: Yêu cầu theo tháng */}
        <Card className="lg:col-span-2 bg-slate-900 border-slate-800 shadow-sm rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-white">Yêu cầu theo tháng</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyRequests}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px" }}
                  itemStyle={{ color: "#fff" }}
                />
                <Bar dataKey="total" name="Yêu cầu" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Biểu đồ 2: Phân loại dịch vụ */}
        <Card className="bg-slate-900 border-slate-800 shadow-sm rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-white">Dịch vụ phổ biến</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px] overflow-y-auto custom-scrollbar">
            <div className="w-full space-y-4">
              {serviceStats.map((item) => (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>{item.name}</span>
                    <span className="font-medium">{item.value} đơn</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{ width: `${(item.value / Math.max(...serviceStats.map(s => s.value), 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {serviceStats.length === 0 && <p className="text-slate-500 text-sm italic">Chưa có dữ liệu...</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Biểu đồ 3: Tài khoản mới (Trải dài hết chiều ngang) */}
      <Card className="bg-slate-900 border-slate-800 shadow-sm rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-white">Tài khoản mới (Người dùng & Kỹ thuật viên)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyAccounts}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px" }}
              />
              <Bar dataKey="customer" name="Người dùng" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="technician" name="Kỹ thuật viên" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}