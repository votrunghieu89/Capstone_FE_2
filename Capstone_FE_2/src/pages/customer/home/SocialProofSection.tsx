import { useRef, useEffect, useState } from "react";
import { Users, CheckCircle, ThumbsUp } from "lucide-react";
import { useInView } from "@/hooks/useInView";

const stats = [
  {
    icon: Users,
    value: 5200,
    suffix: "+",
    label: "Thợ đã xác minh",
    color: "text-ff-accent-blue",
    bgColor: "bg-ff-accent-blue/10",
  },
  {
    icon: CheckCircle,
    value: 48000,
    suffix: "+",
    label: "Yêu cầu hoàn thành",
    color: "text-ff-success",
    bgColor: "bg-ff-success/10",
  },
  {
    icon: ThumbsUp,
    value: 98,
    suffix: "%",
    label: "Tỷ lệ hài lòng",
    color: "text-ff-cta-orange",
    bgColor: "bg-ff-cta-orange/10",
  },
];

function AnimatedCounter({ target, suffix, isActive }: { target: number; suffix: string; isActive: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isActive, target]);

  const formatted = count >= 1000 ? `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}K` : count.toString();

  return (
    <span>
      {formatted}
      {suffix}
    </span>
  );
}

export function SocialProofSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { threshold: 0.3 });

  return (
    <section ref={sectionRef} className="bg-[#1e293b] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="font-poppins text-3xl font-bold tracking-tight text-white text-balance sm:text-4xl">
            Con số nói lên tất cả
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-white/60">
            Hàng ngàn người đã tin tưởng FastFix
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className={`flex flex-col items-center rounded-2xl bg-white/5 border border-white/10 p-8 text-center shadow-sm transition-all duration-300 hover:border-ff-accent-blue/20 ${
                  isInView ? "animate-fade-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${stat.bgColor}`}>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
                <p className={`font-poppins text-4xl font-extrabold ${stat.color} sm:text-5xl`}>
                  <AnimatedCounter
                    target={stat.value}
                    suffix={stat.suffix}
                    isActive={isInView}
                  />
                </p>
                <p className="mt-2 text-base text-white/60">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
