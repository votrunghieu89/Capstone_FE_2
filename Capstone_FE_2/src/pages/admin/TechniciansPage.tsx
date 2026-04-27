import { useEffect, useMemo, useState } from "react"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MoreHorizontal, Phone, Star, Eye, MessageSquare, Loader2, Mail, MapPin, Wrench, Plus
} from "lucide-react"
import { adminApi } from "@/services/adminApi"

type TechStatus = "san-sang" | "nghi-phep"

type TechItem = {
  id: string
  name: string
  phone: string
  email: string
  description: string
  status: TechStatus
  rating: number
  reviews: number
  experiences: string
  orderCount: number
  address: string
  cityName: string
  services: string[]
}

const statusMap = {
  "san-sang": { label: "Sẵn sàng", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  "nghi-phep": { label: "Nghỉ phép", className: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
}

function getInitials(name: string) {
  if (!name) return "??";
  return name.split(" ").map(x => x[0]).join("").toUpperCase()
}

export default function TechniciansPage() {
  const [technicians, setTechnicians] = useState<TechItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedTech, setSelectedTech] = useState<TechItem | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isReviewsOpen, setIsReviewsOpen] = useState(false)
  const [reviews, setReviews] = useState<any[]>([])

  // State cho Modal Thêm mới
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newTech, setNewTech] = useState({ fullName: "", email: "", phoneNumber: "", description: "" })

  useEffect(() => {
    loadTechnicians()
  }, [])

  const loadTechnicians = async () => {
    try {
      const data = await adminApi.getTechniciansFull()
      setTechnicians(data)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTech = async () => {
    if (!newTech.fullName || !newTech.email || !newTech.phoneNumber) {
      alert("Vui lòng điền đủ các trường bắt buộc (*)")
      return
    }
    setIsSubmitting(true)
    try {
      await adminApi.createTechnician(newTech)
      setIsCreateOpen(false)
      setNewTech({ fullName: "", email: "", phoneNumber: "", description: "" })
      await loadTechnicians()
    } catch (err) {
      console.error(err)
      alert("Lỗi khi thêm kỹ thuật viên. Kiểm tra lại Backend.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const filtered = useMemo(() => {
    return technicians.filter(t =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (statusFilter === "all" || t.status === statusFilter)
    )
  }, [technicians, searchQuery, statusFilter])

  return (
    <>
      <DashboardHeader title="Kỹ thuật viên" description="Quản lý thông tin và trạng thái kỹ thuật viên" />

      {/* --- FILTER BAR & ADD BUTTON (NẰM CÙNG HÀNG) --- */}
      <div className="bg-[#0b111f] border border-slate-800 p-4 rounded-xl mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <Input
            placeholder="Tìm theo tên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#0f1627] border-slate-700 max-w-sm"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-[#0f1627] border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0f1627] border-slate-700">
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="san-sang">Sẵn sàng</SelectItem>
              <SelectItem value="nghi-phep">Nghỉ phép</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Nút thêm nằm cùng hàng bên phải */}
        <Button onClick={() => setIsCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700 shrink-0">
          <Plus className="w-4 h-4 mr-2" /> Thêm kỹ thuật viên
        </Button>
      </div>

      {/* --- MODAL THÊM MỚI --- */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="bg-[#0d1322] border-slate-800 text-white">
          <DialogHeader><DialogTitle>Thêm kỹ thuật viên mới</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <Input placeholder="Họ và tên *" value={newTech.fullName} onChange={(e) => setNewTech({ ...newTech, fullName: e.target.value })} className="bg-[#0f1627] border-slate-700" />
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="Email *" value={newTech.email} onChange={(e) => setNewTech({ ...newTech, email: e.target.value })} className="bg-[#0f1627] border-slate-700" />
              <Input placeholder="Số điện thoại *" value={newTech.phoneNumber} onChange={(e) => setNewTech({ ...newTech, phoneNumber: e.target.value })} className="bg-[#0f1627] border-slate-700" />
            </div>
            <textarea placeholder="Mô tả kinh nghiệm" value={newTech.description} onChange={(e) => setNewTech({ ...newTech, description: e.target.value })} className="w-full h-24 bg-[#0f1627] border border-slate-700 rounded-md p-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
            <Button disabled={isSubmitting} onClick={handleCreateTech} className="w-full bg-blue-600 hover:bg-blue-700">
              {isSubmitting ? <Loader2 className="animate-spin" /> : "Xác nhận tạo kỹ thuật viên"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- DANH SÁCH --- */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-10"><Loader2 className="animate-spin text-blue-500" /></div>
        ) : filtered.map((tech) => (
          <Card key={tech.id} className="bg-[#0b111f] border-slate-800 hover:border-blue-500/50 transition-all shadow-lg">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  {/* AVATAR: Kích thước 14x14 như yêu cầu */}
                  <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-900/20">
                    {getInitials(tech.name)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">{tech.name}</h3>
                    <Badge variant="outline" className={`${statusMap[tech.status]?.className || ""} text-[10px]`}>
                      {statusMap[tech.status]?.label || "N/A"}
                    </Badge>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-[#0d1322] border-slate-700 text-white">
                    <DropdownMenuItem onClick={() => { setSelectedTech(tech); setIsDetailOpen(true); }}>
                      <Eye className="w-4 h-4 mr-2" /> Chi tiết
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2 text-sm text-slate-400">
                <p className="flex items-center gap-2"><Phone className="w-3 h-3 text-blue-400" /> {tech.phone}</p>
                <p className="flex items-center gap-2 text-xs truncate"><Mail className="w-3 h-3 text-blue-400" /> {tech.email}</p>
              </div>

              <div className="flex items-center gap-1 text-yellow-400 mt-4 pt-3 border-t border-slate-800/50">
                <Star className="w-4 h-4 fill-yellow-400" />
                <span className="font-bold text-sm">{tech.rating || 5}</span>
                <span className="text-slate-500 text-xs">({tech.reviews || 0} đánh giá)</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}