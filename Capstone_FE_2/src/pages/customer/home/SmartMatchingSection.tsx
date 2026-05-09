import { useRef } from "react";
import {
  AirVent,
  Bath,
  Bolt,
  Camera,
  Car,
  Droplets,
  Fan,
  Flame,
  Hammer,
  Home,
  Laptop,
  Monitor,
  Paintbrush,
  Plug,
  Refrigerator,
  ShieldCheck,
  Smartphone,
  Tv,
  WashingMachine,
  Wrench,
} from "lucide-react";
import { useInView } from "@/hooks/useInView";

const services = [
  {
    icon: AirVent,
    title: "Máy lạnh",
    description: "Vệ sinh, bơm gas, sửa lỗi không lạnh, chảy nước, kêu to.",
  },
  {
    icon: WashingMachine,
    title: "Máy giặt",
    description: "Sửa máy không vắt, không cấp nước, rung lắc, báo lỗi.",
  },
  {
    icon: Refrigerator,
    title: "Tủ lạnh",
    description: "Kiểm tra không lạnh, đóng tuyết, rò điện, thay linh kiện.",
  },
  {
    icon: Bolt,
    title: "Điện dân dụng",
    description: "Sửa chập điện, ổ cắm, CB, đèn chiếu sáng và đường dây.",
  },
  {
    icon: Droplets,
    title: "Nước dân dụng",
    description: "Sửa rò rỉ, nghẹt ống, thay vòi nước, bồn rửa, bồn cầu.",
  },
  {
    icon: Tv,
    title: "Tivi",
    description: "Kiểm tra màn hình, âm thanh, nguồn, tín hiệu và treo tường.",
  },
  {
    icon: Fan,
    title: "Quạt điện",
    description: "Sửa quạt không quay, kêu lớn, hỏng tụ, hỏng motor.",
  },
  {
    icon: Flame,
    title: "Bếp điện, bếp gas",
    description: "Kiểm tra đánh lửa, mặt bếp, rò gas, lỗi cảm ứng.",
  },
  {
    icon: Bath,
    title: "Nhà tắm",
    description: "Sửa vòi sen, lavabo, bình nóng lạnh và phụ kiện vệ sinh.",
  },
  {
    icon: Hammer,
    title: "Lắp đặt nội thất",
    description: "Lắp kệ, rèm, bàn ghế, khoan tường và phụ kiện gia đình.",
  },
  {
    icon: Plug,
    title: "Thiết bị gia dụng",
    description: "Sửa nồi cơm, lò vi sóng, máy hút bụi và thiết bị nhỏ.",
  },
  {
    icon: ShieldCheck,
    title: "Kiểm tra an toàn",
    description: "Rà soát điện, nước, thiết bị cũ để phòng rủi ro.",
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
      <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-ff-accent-blue/10 blur-[150px]" />
      <div className="absolute -bottom-32 right-0 h-[420px] w-[420px] rounded-full bg-ff-success/5 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Section Header */}
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="mb-4 inline-block rounded-full border border-ff-accent-blue/30 bg-ff-accent-blue/10 px-4 py-1.5 text-xs font-semibold text-ff-accent-blue">
            Dịch vụ FastFix
          </span>
          <h2 className="font-poppins text-3xl font-bold tracking-tight text-white text-balance sm:text-4xl">
            Nhiều dịch vụ sửa chữa tại nhà
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-white/50">
            Kết nối nhanh với kỹ thuật viên phù hợp cho từng nhu cầu sửa chữa, lắp đặt và bảo trì.
          </p>
        </div>

        {/* Service Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {services.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className={`group relative min-h-[150px] overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_18px_50px_rgba(2,6,23,0.18)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-ff-accent-blue/35 hover:bg-white/[0.07] hover:shadow-[0_22px_70px_rgba(14,165,233,0.13)] ${isInView ? "animate-fade-up" : "opacity-0"
                  }`}
                style={{ animationDelay: `${Math.min(index, 10) * 0.05}s` }}
              >
                <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-ff-accent-blue/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="flex h-full items-start gap-4">
                  <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl border border-ff-accent-blue/20 bg-ff-accent-blue/10 text-ff-accent-blue shadow-[0_0_28px_rgba(14,165,233,0.08)] transition-all duration-300 group-hover:scale-105 group-hover:bg-ff-accent-blue/20">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="mb-2 font-poppins text-base font-semibold text-white">
                      {item.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-white/55">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
