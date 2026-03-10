import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

const technicians = [
  {
    name: "Trần Văn B",
    specialty: "Điện dân dụng",
    status: "dang-lam" as const,
    jobsDone: 24,
    rating: 4.8,
    initials: "TB",
  },
  {
    name: "Hoàng Văn E",
    specialty: "Điều hòa & máy lạnh",
    status: "ranh" as const,
    jobsDone: 31,
    rating: 4.9,
    initials: "HE",
  },
  {
    name: "Nguyễn Văn G",
    specialty: "Máy giặt & gia dụng",
    status: "dang-lam" as const,
    jobsDone: 18,
    rating: 4.6,
    initials: "NG",
  },
  {
    name: "Lê Văn K",
    specialty: "Nước & ống nước",
    status: "nghi" as const,
    jobsDone: 27,
    rating: 4.7,
    initials: "LK",
  },
]

const techStatusMap = {
  "dang-lam": { label: "Đang làm việc", className: "bg-blue-100 text-blue-800 border-blue-200" },
  "ranh": { label: "Sẵn sàng", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  "nghi": { label: "Nghỉ phép", className: "bg-secondary text-secondary-foreground border-border" },
}

export function TechnicianOverview() {
  return (
    <Card className="border border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-card-foreground">
          Kỹ thuật viên
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {technicians.map((tech) => (
          <div
            key={tech.name}
            className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors"
          >
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                {tech.initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-card-foreground truncate">
                  {tech.name}
                </span>
                <Badge
                  variant="outline"
                  className={techStatusMap[tech.status].className}
                >
                  {techStatusMap[tech.status].label}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                {tech.specialty}
              </span>
              <div className="flex items-center gap-3 mt-1.5">
                <div className="flex items-center gap-1.5 flex-1">
                  <Progress value={(tech.jobsDone / 35) * 100} className="h-1.5" />
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                    {tech.jobsDone} việc
                  </span>
                </div>
                <span className="text-[11px] font-medium text-accent">
                  {tech.rating} sao
                </span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
