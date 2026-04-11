import { useRef } from "react";
import { ArrowRight, Wrench, DollarSign, Clock, Users } from "lucide-react";
import { useInView } from "@/hooks/useInView";

const benefits = [
  { icon: DollarSign, text: "Thu nhập linh hoạt" },
  { icon: Clock, text: "Tự chọn giờ làm" },
  { icon: Users, text: "Mở rộng khách hàng" },
];

export function BecomeTechnicianSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { threshold: 0.2 });

  return (
    <section id="become-technician" ref={sectionRef} className="relative overflow-hidden bg-ff-primary py-24">
      {/* Background accent */}
      <div className="absolute right-0 top-0 h-full w-1/2 bg-ff-accent-blue/5" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div
          className={`flex flex-col items-center gap-12 lg:flex-row lg:gap-16 ${
            isInView ? "animate-fade-up" : "opacity-0"
          }`}
        >
          {/* Content */}
          <div className="flex-1 text-center lg:text-left">
            <span className="mb-4 inline-block rounded-full bg-ff-cta-orange/20 px-4 py-1.5 text-xs font-semibold text-ff-cta-orange">
              Dành cho thợ
            </span>
            <h2 className="mt-4 font-poppins text-3xl font-bold text-white text-balance sm:text-4xl">
              Trở thành thợ FastFix
            </h2>
            <p className="mt-4 max-w-lg text-lg leading-relaxed text-white/50">
              Gia nhập mạng lưới thợ uy tín lớn nhất. Nhận việc tự động, quản lý dễ dàng, tăng thu nhập.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-6 lg:justify-start">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/8">
                      <Icon className="h-5 w-5 text-ff-accent-blue" />
                    </div>
                    <span className="text-sm font-medium text-white/70">
                      {benefit.text}
                    </span>
                  </div>
                );
              })}
            </div>

            <button className="mt-8 h-14 gap-2 rounded-xl bg-ff-cta-orange px-8 text-base font-semibold text-white hover:bg-ff-cta-orange/90 flex items-center transition-colors">
              <Wrench className="h-5 w-5" />
              Đăng ký làm thợ
              <ArrowRight className="h-4 w-4 ml-1" />
            </button>
          </div>

          {/* Visual Stats */}
          <div className="flex flex-1 justify-center">
            <div className="relative grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/8 bg-white/5 p-6">
                <p className="font-poppins text-3xl font-bold text-ff-cta-orange">15M+</p>
                <p className="mt-1 text-sm text-white/50">Thu nhập trung bình / tháng</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-6">
                <p className="font-poppins text-3xl font-bold text-ff-accent-blue">50+</p>
                <p className="mt-1 text-sm text-white/50">Đơn hàng / tháng</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-6">
                <p className="font-poppins text-3xl font-bold text-ff-success">Free</p>
                <p className="mt-1 text-sm text-white/50">Phí đăng ký</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-6">
                <p className="font-poppins text-3xl font-bold text-white">24/7</p>
                <p className="mt-1 text-sm text-white/50">Hỗ trợ</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
