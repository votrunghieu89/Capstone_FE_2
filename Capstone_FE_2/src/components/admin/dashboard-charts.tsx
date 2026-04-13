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
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

const weeklyData = [
  { name: "T2", yeucau: 32, hoanthanh: 28 },
  { name: "T3", yeucau: 45, hoanthanh: 41 },
  { name: "T4", yeucau: 38, hoanthanh: 35 },
  { name: "T5", yeucau: 52, hoanthanh: 48 },
  { name: "T6", yeucau: 41, hoanthanh: 39 },
  { name: "T7", yeucau: 58, hoanthanh: 52 },
  { name: "CN", yeucau: 22, hoanthanh: 20 },
]

const serviceData = [
  { name: "Sửa điện", value: 35 },
  { name: "Sửa nước", value: 25 },
  { name: "Điều hòa", value: 20 },
  { name: "Gia dụng", value: 12 },
  { name: "Khác", value: 8 },
]

const COLORS = [
  "#2563eb", // Blue
  "#f97316", // Orange
  "#10b981", // Green
  "#8b5cf6", // Purple
  "#6b7280", // Gray
]

export function DashboardCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="border border-border bg-card lg:col-span-2 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-card-foreground">
            Yêu cầu theo tuần
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={weeklyData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "13px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                }}
              />
              <Bar
                dataKey="yeucau"
                name="Yêu cầu"
                fill="#2563eb"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="hoanthanh"
                name="Hoàn thành"
                fill="#f97316"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-card-foreground">
            Phân loại dịch vụ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={serviceData}
                cx="50%"
                cy="45%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {serviceData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "13px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                }}
                formatter={(value: any) => [`${value}%`, ""]}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "12px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
