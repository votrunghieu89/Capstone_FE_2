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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MapPin, Plus, Search, Trash2 } from "lucide-react"
import toast from "react-hot-toast"

type CityItem = {
  id: string
  name: string
  createdAt: string
}

const STORAGE_KEY = "fastfix_admin_cities"

function buildDefaultCities(): CityItem[] {
  const now = new Date().toISOString()
  return [
    { id: "hcm", name: "TP. Ho Chi Minh", createdAt: now },
    { id: "hn", name: "Ha Noi", createdAt: now },
    { id: "dn", name: "Da Nang", createdAt: now },
  ]
}

function loadCities(): CityItem[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return buildDefaultCities()

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return buildDefaultCities()
    return parsed
      .filter((x) => x && typeof x.name === "string")
      .map((x) => ({
        id: String(x.id || crypto.randomUUID()),
        name: String(x.name),
        createdAt: String(x.createdAt || new Date().toISOString()),
      }))
  } catch {
    return buildDefaultCities()
  }
}

export default function CitiesPage() {
  const [cities, setCities] = useState<CityItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [cityName, setCityName] = useState("")

  useEffect(() => {
    setCities(loadCities())
  }, [])

  useEffect(() => {
    if (cities.length === 0) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cities))
  }, [cities])

  const filteredCities = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase()
    if (!keyword) return cities
    return cities.filter((c) => c.name.toLowerCase().includes(keyword))
  }, [cities, searchQuery])

  const handleAddCity = () => {
    const name = cityName.trim()
    if (!name) {
      toast.error("Vui lòng nhập tên thành phố")
      return
    }

    const exists = cities.some((c) => c.name.trim().toLowerCase() === name.toLowerCase())
    if (exists) {
      toast.error("Thành phố đã tồn tại")
      return
    }

    const next: CityItem = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
    }

    setCities((prev) => [next, ...prev])
    setCityName("")
    setIsDialogOpen(false)
    toast.success("Thêm thành phố thành công")
  }

  const handleDeleteCity = (city: CityItem) => {
    const ok = window.confirm(`Xóa thành phố ${city.name}?`)
    if (!ok) return

    const next = cities.filter((c) => c.id !== city.id)
    setCities(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    toast.success("Xóa thành phố thành công")
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
      <DashboardHeader
        title="Thành phố"
        description="Quản lý danh sách thành phố hỗ trợ dịch vụ"
      />

      <main className="flex-1 p-6 flex flex-col gap-5 max-w-[1200px] w-full mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#eff6ff] text-[#2563eb] flex items-center justify-center">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Tổng thành phố</p>
                <p className="text-2xl font-bold text-slate-900">{cities.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Tìm thành phố..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-[#2563eb]"
                />
              </div>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-md font-medium px-5">
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm thành phố
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Thêm thành phố mới</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-4 py-4">
                    <div className="flex flex-col gap-2">
                      <Label>Tên thành phố</Label>
                      <Input
                        value={cityName}
                        onChange={(e) => setCityName(e.target.value)}
                        placeholder="Nhập tên thành phố"
                      />
                    </div>

                    <Button className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white w-full mt-2" onClick={handleAddCity}>
                      Thêm thành phố
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-slate-200 bg-white shadow-sm overflow-hidden rounded-xl">
          <CardContent className="p-0">
            {filteredCities.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-500">
                <MapPin className="h-8 w-8 mx-auto mb-3 text-slate-400" />
                <p className="font-medium">Không có thành phố</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thành phố</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCities.map((city) => (
                    <TableRow key={city.id}>
                      <TableCell className="font-medium text-slate-900">{city.name}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCity(city)}
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Xóa
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
