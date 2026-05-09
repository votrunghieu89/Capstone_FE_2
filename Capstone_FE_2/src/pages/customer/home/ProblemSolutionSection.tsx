import { useRef } from "react";
import { AlertTriangle, ShieldAlert, Users } from "lucide-react";
import { useInView } from "@/hooks/useInView";

const problems = [
  {
    icon: AlertTriangle,
    problem: "Khó tìm thợ",
    solution: "AI ghép nối thợ phù hợp nhất trong 15 phút",
    color: "text-ff-cta-orange",
    bgColor: "bg-ff-cta-orange/10",
  },
  {
    icon: ShieldAlert,
    problem: "Nguy cơ lừa đảo",
    solution: "Thợ xác minh danh tính, đánh giá công khai",
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
  {
    icon: Users,
    problem: "Người già khó tiếp cận",
    solution: "Giao diện đơn giản, hỗ trợ giọng nói",
    color: "text-ff-success",
    bgColor: "bg-ff-success/10",
  },
];

export function ProblemSolutionSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { threshold: 0.15 });

  return (
    <section id="services" ref={sectionRef} className="relative bg-[#1e293b] py-24">
      <div className="mx-auto max-w-7xl px-6">
        {/* Section Header */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <span className="mb-4 inline-block rounded-full bg-ff-accent-blue/10 px-4 py-1.5 text-xs font-semibold text-ff-accent-blue">
            Vấn đề & Giải pháp
          </span>
          <h2 className="font-poppins text-3xl font-bold tracking-tight text-white text-balance sm:text-4xl">
            Tại sao cần FastFix?
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-white/60">
            Chúng tôi hiểu những khó khăn bạn gặp phải khi tìm dịch vụ sửa chữa
          </p>
        </div>

        {/* Cards Grid */}
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {problems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] p-7 text-center shadow-[0_18px_55px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.08] hover:shadow-xl ${isInView ? "animate-fade-up" : "opacity-0"
                  }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${item.bgColor} ring-1 ring-white/10`}>
                  <Icon className={`h-6 w-6 ${item.color}`} />
                </div>
                <h3 className="mb-2 font-poppins text-xl font-semibold text-white">
                  {item.problem}
                </h3>
                <p className="mx-auto max-w-[240px] text-sm leading-relaxed text-white/65">
                  {item.solution}
                </p>
                {/* Hover accent */}
                <div className={`absolute bottom-0 left-0 h-1 w-0 rounded-b-2xl ${item.bgColor} transition-all duration-300 group-hover:w-full`} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
