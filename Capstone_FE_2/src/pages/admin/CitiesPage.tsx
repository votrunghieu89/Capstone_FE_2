import { useEffect, useState, useCallback } from "react"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MapPin, Search, Plus, Trash2, Loader2 } from "lucide-react"
import { adminDelete, adminGet, adminPost, normalizeListPayload } from "@/utils/adminHttp"
import { toast } from "react-hot-toast"
import { ConfirmToast } from "@/components/admin/ConfirmToast"

type CityItem = { id: string; name: string }

export default function CitiesPage() {
  const [cities, setCities] = useState<CityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newCity, setNewCity] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Hàm load dữ liệu
  const fetchCities = useCallback(async () => {
    try {
      const payload = await adminGet("/admin/cities")
      const rows = normalizeListPayload<any>(payload).map((row) => ({
        id: row.cityId || row.id,
        name: row.cityName || row.name,
      }))
      setCities(rows.filter((c) => c.name))
    } catch (err) {
      toast.error("Không thể tải danh sách thành phố")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCities()
  }, [fetchCities])

  const filteredCities = cities.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  )

  // --- XỬ LÝ THÊM MỚI ---
  const handleCreateCity = async () => {
    const cityName = newCity.trim()
    if (!cityName) {
      toast.error("Vui lòng nhập tên thành phố")
      return
    }

    setIsSubmitting(true)
    const loadId = toast.loading("Đang thêm thành phố...")

    try {
      await adminPost("/admin/cities", { cityName: cityName })
      await fetchCities()
      setNewCity("")
      setIsCreateOpen(false)
      toast.success(`Đã thêm thành phố ${cityName}`, { id: loadId })
    } catch {
      toast.error("Không thể thêm thành phố. Vui lòng thử lại", { id: loadId })
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- XỬ LÝ XÓA VỚI CONFIRM TOAST ---
  const handleDeleteCity = (id: string, name: string) => {
    toast((t) => (
      <ConfirmToast
        t={t}
        title="Xóa thành phố?"
        message={`Bạn có chắc muốn xóa "${name}" khỏi danh sách hỗ trợ dịch vụ?`}
        onConfirm={() => executeDelete(id)}
      />
    ), { position: "top-center" })
  }

  const executeDelete = async (id: string) => {
    const loadId = toast.loading("Đang xóa...")
    const snapshot = cities

    // Optimistic UI
    setCities((prev) => prev.filter((item) => item.id !== id))

    try {
      await adminDelete(`/admin/cities/${id}`)
      toast.success("Đã xóa thành phố thành công", { id: loadId })
    } catch {
      setCities(snapshot)
      toast.error("Lỗi khi xóa thành phố", { id: loadId })
    }
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#070b14] text-slate-100">
      <DashboardHeader title="Thành phố" description="Quản lý danh sách thành phố hỗ trợ dịch vụ FastFix" />

      {/* Modal Thêm */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="border-slate-800 bg-[#0d1322] text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Thêm thành phố mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <p className="text-xs text-slate-400 uppercase font-semibold">Tên thành phố</p>
              <Input
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                placeholder="Ví dụ: Đà Nẵng, Hồ Chí Minh..."
                className="bg-[#101a2f] border-slate-700 focus:ring-blue-500"
              />
            </div>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleCreateCity}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Xác nhận thêm
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <main className="flex-1 p-6 space-y-6 max-w-[1400px] w-full mx-auto">
        {/* Stats Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-slate-800 bg-[#0b111f] shadow-lg">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-950/40 border border-blue-800 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-blue-300" />
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Khu vực hỗ trợ</p>
                <p className="text-2xl font-bold text-slate-100">{cities.length} Thành phố</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Tìm nhanh thành phố..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-[#0b111f] border-slate-800 text-slate-100"
            />
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" /> Thêm mới
          </Button>
        </div>

        {/* Table */}
        <Card className="border-slate-800 bg-[#0b111f] overflow-hidden rounded-xl shadow-md">
          <Table>
            <TableHeader className="bg-[#101a2f]">
              <TableRow className="hover:bg-transparent border-slate-800">
                <TableHead className="text-slate-300 font-semibold py-4">Tên thành phố</TableHead>
                <TableHead className="text-right text-slate-300 font-semibold py-4 px-6">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-20 text-slate-500">
                    <Loader2 className="animate-spin h-6 w-6 mx-auto mb-2" />
                    Đang tải dữ liệu...
                  </TableCell>
                </TableRow>
              ) : filteredCities.length > 0 ? (
                filteredCities.map((item) => (
                  <TableRow key={item.id} className="border-slate-800 hover:bg-[#111b32] transition-colors">
                    <TableCell className="font-medium text-slate-200 py-4">{item.name}</TableCell>
                    <TableCell className="text-right py-4 px-6">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCity(item.id, item.name)}
                        className="text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-10 text-slate-500">
                    Không tìm thấy thành phố nào phù hợp.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </main>
    </div>
  )
}