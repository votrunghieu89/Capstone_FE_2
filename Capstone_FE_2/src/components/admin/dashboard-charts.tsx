import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { useMemo } from "react"

interface DashboardChartsProps {
  requests: any[]
  completedRequests: any[]
  users: any[]
}

export function DashboardCharts({ requests = [], completedRequests = [], users = [] }: DashboardChartsProps) {
  const months = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];

  // Tính toán yêu cầu theo tháng
  const monthlyRequests = useMemo(() => {
    return months.map((label, i) => ({
      name: label,
      total: requests.filter(r => r.createdAt && new Date(r.createdAt).getMonth() === i).length
    }));
  }, [requests]);

  // Tính toán đơn hàng hoàn thành theo tháng
  const monthlyCompleted = useMemo(() => {
    return months.map((label, i) => ({
      name: label,
      total: completedRequests.filter(r => r.completeAt && new Date(r.completeAt).getMonth() === i).length
    }));
  }, [completedRequests]);

  // Tính toán người dùng mới theo tháng
  const monthlyAccounts = useMemo(() => {
    return months.map((label, i) => ({
      name: label,
      customer: users.filter(u =>
        u.createdAt && new Date(u.createdAt).getMonth() === i &&
        (u.role?.toLowerCase() === "customer" || u.role?.toLowerCase() === "nguoi-dung")
      ).length,
      technician: users.filter(u =>
        u.createdAt && new Date(u.createdAt).getMonth() === i &&
        (u.role?.toLowerCase() === "technician" || u.role?.toLowerCase() === "ky-thuat-vien")
      ).length
    }));
  }, [users]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Biểu đồ 1: Tổng yêu cầu */}
        <Card className="bg-slate-900 border-slate-800 shadow-sm rounded-2xl">
          <CardHeader><CardTitle className="text-lg text-white">Lượng yêu cầu nhận được</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyRequests}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b" }} />
                <Bar dataKey="total" name="Yêu cầu" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Biểu đồ 2: Đơn hàng hoàn thành */}
        <Card className="bg-slate-900 border-slate-800 shadow-sm rounded-2xl">
          <CardHeader><CardTitle className="text-lg text-white">Đơn hàng đã hoàn thành</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyCompleted}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b" }} />
                <Bar dataKey="total" name="Hoàn thành" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Biểu đồ 3: Tài khoản mới */}
      <Card className="bg-slate-900 border-slate-800 shadow-sm rounded-2xl">
        <CardHeader><CardTitle className="text-lg text-white">Tăng trưởng thành viên mới</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyAccounts}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b" }} />
              <Legend verticalAlign="top" align="right" />
              <Bar dataKey="customer" name="Khách hàng" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="technician" name="Kỹ thuật viên" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}