import { useEffect, useMemo, useState } from "react"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MapPin, Search, Plus, Trash2 } from "lucide-react"
import { adminDelete, adminGet, adminPost, normalizeListPayload } from "@/utils/adminHttp"

type CityItem = {
  id: string
  name: string
}

type ApiCityItem = {
  id?: string
  cityId?: string
  name?: string
  cityName?: string
}

const seedCities: CityItem[] = [
  { id: "c1", name: "TP. Cần Thơ" },
  { id: "c2", name: "TP. Vinh" },
  { id: "c3", name: "TP. Hồ Chí Minh" },
  { id: "c4", name: "Ha Noi" },
  { id: "c5", name: "Da Nang" },
]

export default function CitiesPage() {
  const [cities, setCities] = useState<CityItem[]>(seedCities)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newCity, setNewCity] = useState("")
  const [formError, setFormError] = useState("")

  useEffect(() => {
    let mounted = true

    ;(async () => {
      try {
        const payload = await adminGet("/admin/cities")
        const rows = normalizeListPayload<ApiCityItem>(payload)
          .map((row, index) => ({
            id: row.cityId || row.id || `c${index + 1}`,
            name: row.name || row.cityName || "",
          }))
          .filter((row) => row.name)

        if (!mounted) return
        if (rows.length > 0) setCities(rows)
      } catch {
        if (!mounted) return
        setCities(seedCities)
      } finally {
        if (!mounted) return
        setIsLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  const filteredCities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return cities
    return cities.filter((item) => item.name.toLowerCase().includes(q))
  }, [cities, searchQuery])

  const handleDeleteCity = async (id: string) => {
    const snapshot = cities
    setCities((prev) => prev.filter((item) => item.id !== id))

    try {
      await adminDelete(`/admin/cities/${id}`)
    } catch {
      setCities(snapshot)
    }
  }

  const handleCreateCity = async () => {
    const name = newCity.trim()
    if (!name) {
      setFormError("Vui lòng nhập tên thành phố")
      return
    }

    const exists = cities.some((item) => item.name.toLowerCase() === name.toLowerCase())
    if (exists) {
      setFormError("Thành phố đã tồn tại")
      return
    }

    setCities((prev) => [{ id: `c${Date.now()}`, name }, ...prev])
    setNewCity("")
    setFormError("")
    setIsCreateOpen(false)

    try {
      await adminPost("/admin/cities", { name })
      const payload = await adminGet("/admin/cities")
      const rows = normalizeListPayload<ApiCityItem>(payload)
        .map((row, index) => ({
          id: row.cityId || row.id || `c${index + 1}`,
          name: row.name || row.cityName || "",
        }))
        .filter((row) => row.name)
      if (rows.length > 0) setCities(rows)
    } catch {
      // Keep optimistic local row if API create fails.
    }
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#070b14] text-slate-100">
      <DashboardHeader
        title="Thành phố"
        description="Quản lý danh sách thành phố hỗ trợ dịch vụ"
      />

      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open)
          if (!open) setFormError("")
        }}
      >
        <DialogContent className="max-w-lg border border-slate-800 bg-[#0d1322] text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-base text-slate-100">Thêm thành phố mới</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-200">Tên thành phố</p>
              <Input
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                placeholder="Nhập tên thành phố"
                className="bg-[#101a2f] border-slate-700 text-slate-100 placeholder:text-slate-500"
              />
            </div>

            {formError && <p className="text-xs text-red-300">{formError}</p>}

            <Button className="w-full bg-[#2563eb] hover:bg-[#1e4fc7] text-white text-sm" onClick={handleCreateCity}>
              Thêm thành phố
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <main className="flex-1 p-6 flex flex-col gap-4 max-w-[1400px] w-full mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border border-slate-800 bg-[#0b111f] rounded-xl">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-950/40 border border-blue-800 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-blue-300" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Tổng thành phố</p>
                <p className="text-xl font-bold text-slate-100">{cities.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-800 bg-[#0b111f] rounded-xl">
            <CardContent className="p-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Tìm thành phố..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-[#101a2f] border-slate-700 text-slate-100 placeholder:text-slate-500"
                />
              </div>
              <Button className="bg-[#2563eb] hover:bg-[#1e4fc7] text-white text-sm" onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm thành phố
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-slate-800 bg-[#0b111f] rounded-xl overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-[#101a2f] border-b border-slate-800">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-bold text-slate-300 h-12">Thành phố</TableHead>
                  <TableHead className="text-xs font-bold text-slate-300 h-12 text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-slate-400 py-8">
                      Đang tải dữ liệu...
                    </TableCell>
                  </TableRow>
                )}
                {filteredCities.map((item) => (
                  <TableRow key={item.id} className="border-b border-slate-800/80 hover:bg-[#111b32]">
                    <TableCell className="text-sm text-slate-100">{item.name}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 rounded-lg border border-slate-800 text-red-400 hover:text-red-300 hover:bg-red-950/20"
                        onClick={() => handleDeleteCity(item.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Xóa
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && filteredCities.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-slate-400 py-8">
                      Không có thành phố phù hợp
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
