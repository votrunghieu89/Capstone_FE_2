import { useEffect, useRef, useState } from "react";
import { useInView } from "@/hooks/useInView";
import imageOne from "../../../assets/dfdfgf.jpg";
import imageTwo from "../../../assets/dgdfgdf.jpg";
import imageThree from "../../../assets/dgfdg.jpg";

const slides = [
  {
    image: imageOne,
    title: "Dịch vụ tận nhà",
    description:
      "Kỹ thuật viên FastFix hỗ trợ sửa chữa, kiểm tra và bảo trì ngay tại địa điểm của khách hàng.",
  },
  {
    image: imageTwo,
    title: "Thợ sửa chữa chuyên nghiệp",
    description:
      "Xử lý đa dạng thiết bị gia dụng như máy giặt, tủ lạnh, bếp, điện nước và các hạng mục trong nhà.",
  },
  {
    image: imageThree,
    title: "Minh bạch sau khi hoàn tất",
    description:
      "Khách hàng được tư vấn, nhận hóa đơn chi tiết và đánh giá chất lượng sau mỗi lần sử dụng dịch vụ.",
  },
];

export function FeaturedTechniciansSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { threshold: 0.1 });
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 4000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <section id="technicians" ref={sectionRef} className="relative overflow-hidden bg-ff-primary py-24">
      <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-ff-accent-blue/10 blur-[140px]" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <span className="mb-4 inline-block rounded-full bg-ff-cta-orange/10 px-4 py-1.5 text-xs font-semibold text-ff-cta-orange">
            Dịch vụ thực tế
          </span>
          <h2 className="font-poppins text-3xl font-bold tracking-tight text-white text-balance sm:text-4xl">
            FastFix đồng hành tại nhà bạn
          </h2>
        </div>

        <div
          className={`relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-[0_24px_80px_rgba(0,0,0,0.32)] ${isInView ? "animate-fade-up" : "opacity-0"
            }`}
        >
          <div className="relative aspect-[16/8] min-h-[360px]">
            {slides.map((slide, index) => (
              <img
                key={slide.title}
                src={slide.image}
                alt={slide.title}
                className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${activeIndex === index ? "scale-100 opacity-100" : "scale-105 opacity-0"
                  }`}
              />
            ))}

            <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/90 via-[#020617]/25 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <div className="max-w-2xl">
                <p className="mb-3 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white/80 backdrop-blur">
                  FastFix Service
                </p>
                <h3 className="font-poppins text-2xl font-bold text-white sm:text-3xl">
                  {slides[activeIndex].title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-white/70 sm:text-base">
                  {slides[activeIndex].description}
                </p>
              </div>
            </div>
          </div>

          <div className="absolute bottom-6 right-6 flex gap-2">
            {slides.map((slide, index) => (
              <button
                key={slide.title}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`h-2.5 rounded-full transition-all duration-300 ${activeIndex === index ? "w-8 bg-white" : "w-2.5 bg-white/40 hover:bg-white/70"
                  }`}
                aria-label={`Chuyển đến ảnh ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
