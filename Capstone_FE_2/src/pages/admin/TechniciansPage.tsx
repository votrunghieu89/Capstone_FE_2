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
  MoreHorizontal, Phone, Star, Eye, MessageSquare, Loader2, Mail, MapPin, Wrench, Plus, Trash2
} from "lucide-react"
import { adminApi } from "@/services/adminApi"
import { toast } from "react-hot-toast";
import { ConfirmToast } from "@/components/admin/ConfirmToast";
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

type ReviewItem = {
  ratingId: string
  customerName: string
  score: number
  feedback: string
  createdAt: string
}

const statusMap = {
  "san-sang": { label: "Sẵn sàng", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  "nghi-phep": { label: "Nghỉ phép", className: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
}

function getInitials(name: string) {
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
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newTech, setNewTech] = useState({ fullName: "", email: "", phoneNumber: "", description: "" })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await adminApi.getTechniciansFull()
      setTechnicians(data)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }
  const handleDeleteReview = (ratingId: string) => {
    toast((t) => (
      <ConfirmToast
        t={t}
        title="Xác nhận xóa đánh giá"
        message="Hành động này không thể hoàn tác."
        onConfirm={() => executeDeleteReview(ratingId)}
      />
    ), { duration: 5000, position: "top-center" });
  };

  const executeDeleteReview = async (ratingId: string) => {
    const loadId = toast.loading("Đang xử lý...");
    try {
      await adminApi.deleteFeedback(ratingId);
      toast.success("Đã xóa đánh giá!", { id: loadId });
      setReviews(prev => prev.filter(r => r.ratingId !== ratingId));
      loadData();
    } catch (error) {
      toast.error("Lỗi khi xóa đánh giá", { id: loadId });
    }
  };

  // 3. Ví dụ: Sử dụng cho chức năng Thêm Kỹ thuật viên (nếu muốn xác nhận trước khi lưu
  // Logic Xóa Đánh giá
  const handleCreate = async () => {
    if (!newTech.fullName || !newTech.email || !newTech.phoneNumber) {
      toast.error("Vui lòng điền đủ thông tin bắt buộc!")
      return
    }
    setIsSubmitting(true)
    try {
      await adminApi.createTechnician(newTech)

      // THÔNG BÁO THÀNH CÔNG
      toast.success("Đã thêm kỹ thuật viên mới!")

      setIsCreateOpen(false)
      setNewTech({ fullName: "", email: "", phoneNumber: "", description: "" })
      await loadData()
    } catch (e) {
      toast.error("Lỗi khi tạo mới kỹ thuật viên.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // 3. Logic Xóa Đánh giá

  const filtered = useMemo(() => {
    return technicians.filter(t =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (statusFilter === "all" || t.status === statusFilter)
    )
  }, [technicians, searchQuery, statusFilter])

  // Điều hướng mở Modal
  const openDetail = (tech: TechItem) => {
    setSelectedTech(tech)
    setIsDetailOpen(true)
  }

  const openReviews = (tech: TechItem) => {
    setSelectedTech(tech)
    setIsReviewsOpen(true)
    setReviewsLoading(true)
    adminApi.getTechnicianReviews(tech.id)
      .then(data => { setReviews(data); setReviewsLoading(false) })
      .catch(() => setReviewsLoading(false))
  }

  return (
    <>
      <DashboardHeader title="Kỹ thuật viên" description="Quản lý thông tin và trạng thái kỹ thuật viên" />

      {/* --- FILTER & ACTION BAR --- */}
      <div className="bg-[#0b111f] border border-slate-800 p-4 rounded-xl mb-6 flex justify-between items-center gap-3">
        <div className="flex gap-3">
          <Input placeholder="Tìm theo tên..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-[#0f1627] border-slate-700 w-64" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-[#0f1627] border-slate-700"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#0f1627] border-slate-700">
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="san-sang">Sẵn sàng</SelectItem>
              <SelectItem value="nghi-phep">Nghỉ phép</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> Thêm kỹ thuật viên
        </Button>
      </div>

      {/* --- MODAL TẠO MỚI --- */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="bg-[#0d1322] border-slate-800 text-white">
          <DialogHeader><DialogTitle>Thêm kỹ thuật viên mới</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <Input placeholder="Họ và tên" value={newTech.fullName} onChange={e => setNewTech({ ...newTech, fullName: e.target.value })} className="bg-[#0f1627] border-slate-700" />
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="Email" value={newTech.email} onChange={e => setNewTech({ ...newTech, email: e.target.value })} className="bg-[#0f1627] border-slate-700" />
              <Input placeholder="SĐT" value={newTech.phoneNumber} onChange={e => setNewTech({ ...newTech, phoneNumber: e.target.value })} className="bg-[#0f1627] border-slate-700" />
            </div>
            <textarea placeholder="Mô tả kỹ năng..." value={newTech.description} onChange={e => setNewTech({ ...newTech, description: e.target.value })} className="w-full h-24 bg-[#0f1627] border border-slate-700 rounded p-2 text-sm focus:outline-none focus:border-blue-500" />
            <Button className="w-full" onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : "Xác nhận tạo"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- DETAIL MODAL (GIỮ NGUYÊN THEO YÊU CẦU) --- */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="bg-[#0d1322] border-slate-800 text-white sm:max-w-lg">
          <DialogHeader><DialogTitle>Thông tin chi tiết</DialogTitle></DialogHeader>
          {selectedTech && (
            <div className="space-y-6 pt-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold">
                  {getInitials(selectedTech.name)}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedTech.name}</h3>
                  <Badge className={statusMap[selectedTech.status].className}>
                    {statusMap[selectedTech.status].label}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm bg-[#121929] p-4 rounded-lg">
                <div className="space-y-1">
                  <p className="text-slate-400 text-xs">Điện thoại</p>
                  <p className="font-medium">{selectedTech.phone}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-400 text-xs">Số đơn đã làm</p>
                  <p className="font-medium">{selectedTech.orderCount} đơn</p>
                </div>
                <div className="col-span-2 space-y-1">
                  <p className="text-slate-400 text-xs">Địa chỉ</p>
                  <p className="font-medium flex items-center gap-1"><MapPin className="w-3 h-3" /> {selectedTech.address || "Chưa cập nhật"} - {selectedTech.cityName}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-400 flex items-center gap-2">
                  <Wrench className="w-4 h-4" /> Dịch vụ đảm nhận:
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedTech.services.length > 0 ? selectedTech.services.map((s, i) => (
                    <Badge key={i} variant="secondary" className="bg-blue-900/40 text-blue-200 border-blue-500/30">{s}</Badge>
                  )) : <span className="text-xs text-slate-500 italic">Chưa có thông tin dịch vụ</span>}
                </div>
              </div>
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2 text-slate-400">
                  <Mail className="w-4 h-4" /> <span>{selectedTech.email}</span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-400">Kinh nghiệm:</p>
                  <p className="text-sm text-slate-300 leading-relaxed bg-[#0b111f] p-3 rounded border border-slate-800">{selectedTech.experiences || "Chưa cập nhật"}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* --- REVIEWS MODAL (Tích hợp nút Xóa) --- */}
      <Dialog open={isReviewsOpen} onOpenChange={setIsReviewsOpen}>
        <DialogContent className="bg-[#0d1322] border-slate-800 text-white max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Đánh giá từ khách hàng</DialogTitle></DialogHeader>
          {reviewsLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-500" /></div>
          ) : reviews.length > 0 ? (
            <div className="space-y-3">
              {reviews.map(r => (
                <div key={r.ratingId} className="bg-[#121929] p-4 rounded-lg border border-slate-800 flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-semibold text-blue-300">{r.customerName}</p>
                      <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded text-xs font-bold">
                        <Star className="w-3 h-3 fill-yellow-500" /> {r.score}
                      </div>
                    </div>
                    <p className="text-sm text-slate-300 italic mb-2">"{r.feedback}"</p>
                    <p className="text-[10px] text-slate-500 border-t border-slate-800 pt-2">{new Date(r.createdAt).toLocaleString()}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteReview(r.ratingId)}
                    className="text-slate-500 hover:text-red-500 hover:bg-red-500/10 ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : <p className="text-center text-slate-500 py-6">Chưa có đánh giá nào.</p>}
        </DialogContent>
      </Dialog>

      {/* --- GRID LIST --- */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" /></div>
        ) : filtered.map((tech) => (
          <Card key={tech.id} className="bg-[#0b111f] border-slate-800 hover:border-blue-500/50 transition-all shadow-lg hover:shadow-blue-500/5">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-sm">
                    {getInitials(tech.name)}
                  </div>
                  <div>
                    <h3 className="font-semibold">{tech.name}</h3>
                    <Badge variant="outline" className={`${statusMap[tech.status].className} text-[10px]`}>
                      {statusMap[tech.status].label}
                    </Badge>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-[#0d1322] border-slate-700">
                    <DropdownMenuItem onClick={() => openDetail(tech)}>
                      <Eye className="w-4 h-4 mr-2" /> Chi tiết
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openReviews(tech)}>
                      <MessageSquare className="w-4 h-4 mr-2" /> Đánh giá
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2 text-sm text-slate-400 mb-4">
                <p className="flex items-center gap-2"><Phone className="w-3 h-3" /> {tech.phone}</p>
                <p className="flex items-center gap-2 text-xs truncate"><Mail className="w-3 h-3" /> {tech.email}</p>
              </div>

              <div className="flex items-center justify-between border-t border-slate-800 pt-3">
                <div className="flex items-center gap-1 text-yellow-400">
                  <Star className="w-4 h-4 fill-yellow-400" />
                  <span className="font-bold">{tech.rating}</span>
                  <span className="text-slate-500 text-xs">({tech.reviews} đánh giá)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}