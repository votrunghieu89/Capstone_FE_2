import { useRef } from "react";
import { Star, MapPin, Clock, Calendar } from "lucide-react";
import { useInView } from "@/hooks/useInView";

const technicians = [
  {
    name: "Nguyễn Văn Minh",
    specialty: "Điện nước",
    rating: 4.9,
    reviews: 234,
    distance: "1.2 km",
    experience: "8 năm",
    startingPrice: "150.000đ",
    topRated: true,
    avatarColor: "bg-ff-cta-orange/20",
    initial: "M",
  },
  {
    name: "Trần Thị Lan",
    specialty: "Điều hòa",
    rating: 4.8,
    reviews: 189,
    distance: "2.1 km",
    experience: "6 năm",
    startingPrice: "200.000đ",
    topRated: true,
    avatarColor: "bg-ff-accent-blue/20",
    initial: "L",
  },
  {
    name: "Lê Văn Hùng",
    specialty: "Sơn sửa",
    rating: 4.7,
    reviews: 156,
    distance: "3.5 km",
    experience: "10 năm",
    startingPrice: "180.000đ",
    topRated: false,
    avatarColor: "bg-ff-success/20",
    initial: "H",
  },
  {
    name: "Phạm Đức Anh",
    specialty: "Ống khóa",
    rating: 4.9,
    reviews: 312,
    distance: "1.8 km",
    experience: "12 năm",
    startingPrice: "120.000đ",
    topRated: true,
    avatarColor: "bg-ff-cta-orange/20",
    initial: "A",
  },
];

export function FeaturedTechniciansSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { threshold: 0.1 });

  return (
    <section id="technicians" ref={sectionRef} className="bg-ff-primary py-24">
      <div className="mx-auto max-w-7xl px-6">
        {/* Section Header */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <span className="mb-4 inline-block rounded-full bg-ff-cta-orange/10 px-4 py-1.5 text-xs font-semibold text-ff-cta-orange">
            Thợ nổi bật
          </span>
          <h2 className="font-poppins text-3xl font-bold tracking-tight text-white text-balance sm:text-4xl">
            Thợ uy tín gần bạn
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-white/60">
            Những thợ được đánh giá cao nhất trên nền tảng FastFix
          </p>
        </div>

        {/* Technician Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {technicians.map((tech, index) => (
            <div
              key={index}
              className={`group relative rounded-2xl border border-white/10 bg-white/5 p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:border-ff-accent-blue/30 ${
                isInView ? "animate-fade-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Top Rated Badge */}
              {tech.topRated && (
                <div className="absolute -right-2 -top-2 rounded-full bg-ff-cta-orange px-3 py-1 text-[10px] font-bold text-white shadow-lg">
                  Top Rated
                </div>
              )}

              {/* Avatar */}
              <div className="mb-4 flex items-center gap-4">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${tech.avatarColor}`}>
                  <span className="font-poppins text-lg font-bold text-white">
                    {tech.initial}
                  </span>
                </div>
                <div>
                  <h3 className="font-poppins text-base font-semibold text-white">
                    {tech.name}
                  </h3>
                  <p className="text-sm text-white/60">{tech.specialty}</p>
                </div>
              </div>

              {/* Rating */}
              <div className="mb-4 flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(tech.rating)
                          ? "fill-ff-cta-orange text-ff-cta-orange"
                          : "fill-white/20 text-white/20"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-white">{tech.rating}</span>
                <span className="text-xs text-white/60">({tech.reviews})</span>
              </div>

              {/* Info */}
              <div className="mb-6 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <MapPin className="h-3.5 w-3.5 text-ff-accent-blue" />
                  {tech.distance}
                </div>
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <Clock className="h-3.5 w-3.5 text-ff-success" />
                  {tech.experience}
                </div>
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <span className="text-xs text-white/60">Từ</span>
                  <span className="font-semibold text-white">{tech.startingPrice}</span>
                </div>
              </div>

              {/* CTA */}
              <button className="w-full gap-2 bg-white/10 hover:bg-ff-cta-orange/90 border border-white/10 hover:border-ff-cta-orange text-sm font-semibold text-white py-3 rounded-xl transition-all duration-200 flex items-center justify-center">
                <Calendar className="h-4 w-4" />
                Đặt lịch
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
