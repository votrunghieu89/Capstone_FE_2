import { useRef } from "react";
import { Camera, Brain, UserCheck } from "lucide-react";
import { useInView } from "@/hooks/useInView";

const steps = [
  {
    step: 1,
    icon: Camera,
    title: "Chụp ảnh sự cố",
    description: "Chụp ảnh hoặc mô tả vấn đề cần sửa chữa. AI sẽ tự động nhận diện loại sự cố.",
    color: "bg-ff-cta-orange",
  },
  {
    step: 2,
    icon: Brain,
    title: "AI phân tích & báo giá",
    description: "AI phân tích hình ảnh, dự đoán chi phí và đề xuất giải pháp phù hợp nhất.",
    color: "bg-ff-accent-blue",
  },
  {
    step: 3,
    icon: UserCheck,
    title: "Thợ gần nhất nhận việc",
    description: "Hệ thống tự động tìm thợ uy tín gần bạn nhất. Theo dõi tiến trình real-time.",
    color: "bg-ff-success",
  },
];

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { threshold: 0.15 });

  return (
    <section id="how-it-works" ref={sectionRef} className="relative bg-ff-primary py-24">
      <div className="mx-auto max-w-7xl px-6">
        {/* Section Header */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <span className="mb-4 inline-block rounded-full bg-ff-accent-blue/10 px-4 py-1.5 text-xs font-semibold text-ff-accent-blue">
            Cách hoạt động
          </span>
          <h2 className="font-poppins text-3xl font-bold tracking-tight text-white text-balance sm:text-4xl">
            3 bước đơn giản
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-white/60">
            Từ sự cố đến giải pháp chỉ trong vài phút
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line - Desktop */}
          <div className="absolute left-0 right-0 top-[60px] hidden h-[2px] lg:block">
            <div
              className={`h-full bg-white/10 transition-all duration-1000 ${
                isInView ? "w-full" : "w-0"
              }`}
            />
          </div>

          <div className="grid gap-12 lg:grid-cols-3 lg:gap-8">
            {steps.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className={`relative flex flex-col items-center text-center ${
                    isInView ? "animate-fade-up" : "opacity-0"
                  }`}
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  {/* Step number with icon */}
                  <div className="relative mb-8">
                    <div className={`flex h-[120px] w-[120px] items-center justify-center rounded-3xl ${item.color}/10`}>
                      <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${item.color}`}>
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    {/* Step number badge */}
                    <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-ff-primary">
                      {item.step}
                    </div>
                  </div>

                  <h3 className="mb-3 font-poppins text-xl font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="max-w-xs text-sm leading-relaxed text-white/60">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
