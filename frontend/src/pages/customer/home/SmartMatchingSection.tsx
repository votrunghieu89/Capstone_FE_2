import { useRef } from "react";
import { ScanEye, MapPin, Award, Calculator } from "lucide-react";
import { useInView } from "@/hooks/useInView";

const features = [
  {
    icon: ScanEye,
    title: "AI chẩn đoán từ hình ảnh",
    description:
      "Upload ảnh sự cố, AI tự động nhận diện vấn đề và đề xuất giải pháp phù hợp.",
  },
  {
    icon: MapPin,
    title: "Matching theo GPS",
    description:
      "Tìm thợ gần nhất trong bán kính 5km để đảm bảo thời gian phản hồi nhanh nhất.",
  },
  {
    icon: Award,
    title: "Ưu tiên thợ uy tín",
    description:
      "Hệ thống xếp hạng dựa trên đánh giá, kinh nghiệm và tỷ lệ hoàn thành công việc.",
  },
  {
    icon: Calculator,
    title: "Dự đoán chi phí",
    description:
      "AI phân tích dữ liệu lịch sử để báo giá chính xác trước khi bạn đặt lịch.",
  },
];

export function SmartMatchingSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { threshold: 0.1 });

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-[#1e293b] py-24">
      {/* Background effects */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)",
        backgroundSize: "40px 40px",
      }} />
      <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-ff-accent-blue/5 blur-[150px]" />

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Section Header */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <span className="mb-4 inline-block rounded-full border border-ff-accent-blue/30 bg-ff-accent-blue/10 px-4 py-1.5 text-xs font-semibold text-ff-accent-blue">
            Điểm khác biệt
          </span>
          <h2 className="font-poppins text-3xl font-bold tracking-tight text-white text-balance sm:text-4xl">
            Smart Matching AI
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-white/50">
            Công nghệ AI tiên tiến giúp kết nối bạn với thợ phù hợp nhất
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {features.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className={`group relative rounded-2xl border border-white/8 bg-white/3 p-8 transition-all duration-300 hover:border-ff-accent-blue/30 hover:bg-white/5 ${
                  isInView ? "animate-fade-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start gap-5">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-ff-accent-blue/10 transition-colors duration-300 group-hover:bg-ff-accent-blue/20">
                    <Icon className="h-7 w-7 text-ff-accent-blue" />
                  </div>
                  <div>
                    <h3 className="mb-2 font-poppins text-lg font-semibold text-white">
                      {item.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-white/50">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Animation Visual */}
        <div className={`mt-16 flex justify-center ${isInView ? "animate-fade-up" : "opacity-0"}`} style={{ animationDelay: "0.5s" }}>
          <div className="relative flex items-center gap-8">
            {/* Input */}
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <ScanEye className="h-8 w-8 text-ff-cta-orange" />
            </div>

            {/* Connection dots */}
            <div className="flex gap-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-2 w-2 rounded-full bg-ff-accent-blue/40"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>

            {/* AI Core */}
            <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-ff-accent-blue/30 bg-ff-accent-blue/10">
              <div className="absolute inset-0 animate-pulse-ring rounded-3xl border border-ff-accent-blue/20" />
              <span className="font-poppins text-xl font-bold text-ff-accent-blue">AI</span>
            </div>

            {/* Connection dots */}
            <div className="flex gap-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-2 w-2 rounded-full bg-ff-success/40"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>

            {/* Output */}
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <Award className="h-8 w-8 text-ff-success" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
