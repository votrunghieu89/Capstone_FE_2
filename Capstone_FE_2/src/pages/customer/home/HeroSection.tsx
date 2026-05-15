import { MapPin, Zap, Shield, Phone, Wrench } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-ff-primary">
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Accent glow */}
      <div className="absolute right-0 top-1/4 h-[500px] w-[500px] rounded-full bg-ff-accent-blue/10 blur-[120px]" />
      <div className="absolute -left-32 bottom-0 h-[400px] w-[400px] rounded-full bg-ff-cta-orange/10 blur-[100px]" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-6 pt-[72px] lg:flex-row lg:gap-16">
        {/* Left Content */}
        <div className="flex flex-1 flex-col items-center gap-8 py-16 text-center lg:items-start lg:text-left">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-ff-accent-blue/30 bg-ff-accent-blue/10 px-4 py-1.5">
            <Zap className="h-3.5 w-3.5 text-ff-accent-blue" />
            <span className="text-xs font-medium text-ff-accent-blue">
              AI-Powered Smart Matching
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-poppins text-4xl font-extrabold leading-tight tracking-tight text-white text-balance sm:text-5xl lg:text-6xl">
            Sửa chữa gia đình{" "}
            <span className="bg-gradient-to-r from-ff-cta-orange to-ff-cta-orange/80 bg-clip-text text-transparent">
              trong 15 phút
            </span>
          </h1>

          {/* Technician registration callout */}
          <div className="w-full max-w-xl">
            <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.09] via-white/[0.04] to-transparent p-px shadow-xl shadow-black/25">
              <div className="relative rounded-[15px] bg-ff-primary/80 px-5 py-5 backdrop-blur-sm sm:px-6 sm:py-6">
                <div
                  className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-ff-cta-orange/25 blur-3xl transition-opacity duration-500 group-hover:opacity-90"
                  aria-hidden
                />
                <div className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-ff-accent-blue/20 blur-3xl" aria-hidden />
                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-ff-cta-orange/30 bg-ff-cta-orange/15 text-ff-cta-orange shadow-inner">
                    <Wrench className="h-6 w-6" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1 space-y-3 text-left">
                    <p className="text-[15px] leading-relaxed text-white/90 sm:text-base">
                      Nếu bạn muốn{" "}
                      <span className="font-semibold text-white">
                        đăng ký trở thành thợ sửa chữa
                      </span>
                      , hãy liên hệ số điện thoại bên dưới — chúng tôi sẽ hỗ trợ bạn sớm nhất có thể.
                    </p>
                    <a
                      href="tel:0766571523"
                      className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl border border-ff-cta-orange/40 bg-ff-cta-orange/15 px-4 py-3.5 text-lg font-bold tracking-wide text-white ring-2 ring-transparent transition-all duration-200 hover:border-ff-cta-orange/70 hover:bg-ff-cta-orange/25 hover:ring-ff-cta-orange/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ff-accent-blue focus-visible:ring-offset-2 focus-visible:ring-offset-ff-primary sm:w-auto sm:justify-start"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ff-cta-orange text-white shadow-lg shadow-ff-cta-orange/30">
                        <Phone className="h-4 w-4" />
                      </span>
                      <span className="bg-gradient-to-r from-white to-white/85 bg-clip-text text-transparent">
                        0766 571 523
                      </span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary CTA */}
          <button className="gap-2 rounded-xl border border-ff-accent-blue/30 bg-transparent px-6 py-3 text-ff-accent-blue hover:bg-ff-accent-blue/10 transition-all flex items-center">
            <MapPin className="h-4 w-4" />
            Tìm thợ gần bạn
          </button>

          {/* Trust signals */}
          <div className="flex flex-wrap items-center gap-6 pt-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-ff-success" />
              <span className="text-sm text-white/50">Thợ xác minh</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-ff-cta-orange" />
              <span className="text-sm text-white/50">Phản hồi 15 phút</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-ff-accent-blue" />
              <span className="text-sm text-white/50">63 tỉnh thành</span>
            </div>
          </div>
        </div>

        {/* Right Visual */}
        <div className="hidden flex-1 items-center justify-center lg:flex">
          <div className="relative">
            {/* Floating App Mockup */}
            <div className="animate-float relative h-[480px] w-[280px] rounded-[32px] border border-white/10 bg-ff-surface-dark p-3 shadow-2xl">
              <div className="flex h-full flex-col rounded-[24px] bg-white/5 p-4">
                {/* Mock Status Bar */}
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs text-white/40">9:41</span>
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-ff-success" />
                    <div className="h-2 w-4 rounded-full bg-white/30" />
                  </div>
                </div>

                {/* Mock Header */}
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ff-cta-orange">
                    <Zap className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">FastFix</p>
                    <p className="text-[10px] text-white/40">Smart Repair</p>
                  </div>
                </div>

                {/* Mock Content */}
                <div className="mb-4 rounded-xl bg-ff-accent-blue/10 p-3">
                  <p className="text-xs font-medium text-ff-accent-blue">AI đang phân tích...</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-3/4 rounded-full bg-ff-accent-blue transition-all" />
                  </div>
                </div>

                <div className="flex-1 space-y-3">
                  {/* Mock Technician Cards */}
                  <div className="rounded-xl border border-white/8 bg-white/3 p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-ff-cta-orange/20" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-white">Nguyễn Văn A</p>
                        <div className="flex items-center gap-1">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <svg key={i} className="h-2.5 w-2.5 fill-ff-cta-orange text-ff-cta-orange" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-[10px] text-white/40">4.9</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-ff-success">1.2km</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/8 bg-white/3 p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-ff-accent-blue/20" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-white">Trần Văn B</p>
                        <div className="flex items-center gap-1">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <svg key={i} className={`h-2.5 w-2.5 ${i < 4 ? 'fill-ff-cta-orange text-ff-cta-orange' : 'fill-white/20 text-white/20'}`} viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-[10px] text-white/40">4.7</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-ff-success">2.5km</span>
                    </div>
                  </div>
                </div>

                {/* Mock CTA */}
                <div className="mt-3 rounded-xl bg-ff-cta-orange py-2.5 text-center text-xs font-semibold text-white">
                  Đặt lịch ngay
                </div>
              </div>
            </div>

            {/* Floating notification bubbles */}
            <div className="animate-float absolute -left-16 top-16 rounded-xl border border-white/8 bg-ff-surface-dark p-3 shadow-xl" style={{ animationDelay: "0.5s" }}>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ff-success/20">
                  <Shield className="h-4 w-4 text-ff-success" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-white">Thợ đã xác minh</p>
                  <p className="text-[8px] text-white/40">Uy tín 100%</p>
                </div>
              </div>
            </div>

            <div className="animate-float absolute -right-12 bottom-24 rounded-xl border border-white/8 bg-ff-surface-dark p-3 shadow-xl" style={{ animationDelay: "1s" }}>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ff-accent-blue/20">
                  <MapPin className="h-4 w-4 text-ff-accent-blue" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-white">GPS Matching</p>
                  <p className="text-[8px] text-white/40">Thợ gần nhất</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
        <span className="text-xs text-white/30">Cuộn xuống</span>
        <div className="h-8 w-5 rounded-full border border-white/20 p-1">
          <div className="h-2 w-full animate-bounce rounded-full bg-white/40" />
        </div>
      </div>
    </section>
  );
}
