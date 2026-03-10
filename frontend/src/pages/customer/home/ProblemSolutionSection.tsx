import { useRef } from "react";
import { AlertTriangle, DollarSign, ShieldAlert, Users } from "lucide-react";
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
    icon: DollarSign,
    problem: "Không biết giá",
    solution: "AI dự đoán chi phí trước khi đặt lịch",
    color: "text-ff-accent-blue",
    bgColor: "bg-ff-accent-blue/10",
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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {problems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className={`group relative rounded-2xl border border-white/10 bg-white/5 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                  isInView ? "animate-fade-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${item.bgColor}`}>
                  <Icon className={`h-6 w-6 ${item.color}`} />
                </div>
                <h3 className="mb-2 font-poppins text-lg font-semibold text-white">
                  {item.problem}
                </h3>
                <p className="text-sm leading-relaxed text-white/60">
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
