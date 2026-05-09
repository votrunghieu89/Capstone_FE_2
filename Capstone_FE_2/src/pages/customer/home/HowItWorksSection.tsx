import { useRef } from "react";
import { ClipboardList, ReceiptText, Wrench } from "lucide-react";
import { useInView } from "@/hooks/useInView";

const steps = [
  {
    step: 1,
    icon: ClipboardList,
    title: "Tạo yêu cầu sửa chữa",
    description: "Khách hàng chọn dịch vụ, nhập địa chỉ, mô tả sự cố và có thể đính kèm hình ảnh để kỹ thuật viên nắm rõ tình trạng.",
    color: "bg-ff-cta-orange",
  },
  {
    step: 2,
    icon: Wrench,
    title: "Thợ nhận và xử lý đơn",
    description: "Kỹ thuật viên xác nhận đơn, liên hệ khách qua chat, di chuyển đến địa điểm và cập nhật tiến trình từ nhận đơn đến hoàn thành.",
    color: "bg-ff-accent-blue",
  },
  {
    step: 3,
    icon: ReceiptText,
    title: "Hóa đơn, thanh toán, đánh giá",
    description: "Sau khi hoàn thành, kỹ thuật viên tạo hóa đơn chi tiết; khách thanh toán, xác nhận và gửi đánh giá chất lượng dịch vụ.",
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
            Quy trình FastFix
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-white/60">
            Từ lúc gửi yêu cầu đến khi hoàn tất thanh toán và đánh giá
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line - Desktop */}
          <div className="absolute left-0 right-0 top-[60px] hidden h-[2px] lg:block">
            <div
              className={`h-full bg-white/10 transition-all duration-1000 ${isInView ? "w-full" : "w-0"
                }`}
            />
          </div>

          <div className="grid gap-12 lg:grid-cols-3 lg:gap-8">
            {steps.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className={`relative flex flex-col items-center text-center ${isInView ? "animate-fade-up" : "opacity-0"
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
