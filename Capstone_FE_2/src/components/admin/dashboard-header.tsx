

import { Bell, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface DashboardHeaderProps {
  title: string
  description?: string
}

export function DashboardHeader({ title, description }: DashboardHeaderProps) {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-6 py-5 border-b border-slate-800 bg-[#0f1d3a]">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">{title}</h1>
        {description && (
          <p className="text-sm text-slate-300/85 mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Tìm kiếm..."
            className="pl-9 w-[240px] bg-[#15284d] border-slate-700 text-slate-100 placeholder:text-slate-400"
          />
        </div>
        <Button variant="outline" size="icon" className="relative border-slate-700 bg-[#15284d] text-slate-100 hover:bg-[#1b3361]">
          <Bell className="h-4 w-4" />
          <Badge className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 text-[10px] bg-[#1e3a8a] text-white">
            3
          </Badge>
          <span className="sr-only">Thông báo</span>
        </Button>
      </div>
    </header>
  )
}
