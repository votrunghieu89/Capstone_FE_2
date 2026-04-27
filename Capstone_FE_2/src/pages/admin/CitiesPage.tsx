import { useEffect, useState, useCallback } from "react"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MapPin, Search, Plus, Trash2, Loader2 } from "lucide-react"
import { adminDelete, adminGet, adminPost, normalizeListPayload } from "@/utils/adminHttp"

type CityItem = { id: string; name: string }

export default function CitiesPage() {
  const [cities, setCities] = useState<CityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newCity, setNewCity] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState("")

  // Hàm load dữ liệu dùng chung
  const fetchCities = useCallback(async () => {
    try {
      const payload = await adminGet("/admin/cities")
      const rows = normalizeListPayload<any>(payload).map((row) => ({
        id: row.cityId || row.id,
        name: row.cityName || row.name,
      }))
      setCities(rows.filter((c) => c.name))
    } catch (err) {
      console.error(err)
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

  const handleCreateCity = async () => {
    if (!newCity.trim()) {
      setFormError("Vui lòng nhập tên thành phố")
      return
    }

    setIsSubmitting(true)
    try {
      // Gửi đúng key "cityName" như Backend mong đợi
      await adminPost("/admin/cities", { cityName: newCity.trim() })
      await fetchCities() // Load lại list
      setNewCity("")
      setIsCreateOpen(false)
      setFormError("")
    } catch {
      setFormError("Có lỗi xảy ra, không thể thêm thành phố")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCity = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa thành phố này?")) return

    try {
      await adminDelete(`/admin/cities/${id}`)
      setCities((prev) => prev.filter((item) => item.id !== id))
    } catch {
      alert("Xóa thất bại")
    }
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#070b14] text-slate-100">
      <DashboardHeader title="Thành phố" description="Quản lý danh sách thành phố hỗ trợ dịch vụ" />

      {/* Modal Thêm */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="border-slate-800 bg-[#0d1322]">
          <DialogHeader>
            <DialogTitle>Thêm thành phố mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              value={newCity}
              onChange={(e) => setNewCity(e.target.value)}
              placeholder="Ví dụ: Đà Nẵng"
              className="bg-[#101a2f] border-slate-700"
            />
            {formError && <p className="text-xs text-red-400">{formError}</p>}
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={handleCreateCity}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : "Thêm thành phố"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <main className="flex-1 p-6 space-y-6 max-w-[1400px] w-full mx-auto">
        {/* Stats Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-slate-800 bg-[#0b111f]">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-950/40 border border-blue-800 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-blue-300" />
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider">Tổng thành phố</p>
                <p className="text-2xl font-bold">{cities.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-[#0b111f] border-slate-800"
            />
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" /> Thêm mới
          </Button>
        </div>

        {/* Table */}
        <Card className="border-slate-800 bg-[#0b111f] overflow-hidden">
          <Table>
            <TableHeader className="bg-[#101a2f]">
              <TableRow className="hover:bg-transparent border-slate-800">
                <TableHead className="text-slate-300">Tên thành phố</TableHead>
                <TableHead className="text-right text-slate-300">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={2} className="text-center py-10">Đang tải...</TableCell></TableRow>
              ) : filteredCities.map((item) => (
                <TableRow key={item.id} className="border-slate-800 hover:bg-[#111b32]">
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteCity(item.id)} className="text-red-400 hover:text-red-300 hover:bg-red-950/30">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </main>
    </div>
  )
}