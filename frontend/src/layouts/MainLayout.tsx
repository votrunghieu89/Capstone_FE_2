import { useState, useRef, useEffect } from "react";
import { Outlet, Link } from "react-router-dom";
import {
  Search,
  Phone,
  MapPin,
  ChevronRight,
  Mail,
  Facebook,
  Youtube,
  LogOut,
  UserCircle,
  ClipboardList,
  ShieldAlert,
  LayoutDashboard,
  Settings
} from "lucide-react";
import logoImg from "../assets/logo.png";

import AuthModal from "../components/shared/AuthModal";
import useAuthStore from "../store/authStore";

/* ═══════════════════════════════════════
   NAVBAR
   ═══════════════════════════════════════ */
function Navbar() {
  const [showAuth, setShowAuth] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, user, logout, fetchMe } = useAuthStore();

  // Fetch user info on mount if token exists
  useEffect(() => {
    if (isAuthenticated && !user) {
      fetchMe();
    }
  }, [isAuthenticated, user, fetchMe]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Check for login query parameter
  const hasTriggeredRef = useRef(false);
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('login') === 'admin') {
      console.log('Admin login detected in URL');
      if (isAuthenticated && user) {
        if ((user as any).role?.toLowerCase() === 'admin') {
          console.log('User is already admin, clearing search param...');
          // Prevent auto-redirect to /admin, just clear param so they stay on home page
          window.history.replaceState({}, document.title, window.location.pathname);
          return;
        } else {
          window.history.replaceState({}, document.title, window.location.pathname);
          return;
        }
      }
      
      if (!isAuthenticated && !hasTriggeredRef.current) {
        console.log('User not authenticated, opening modal');
        setShowAuth(true);
        hasTriggeredRef.current = true;
      }
    }
  }, [isAuthenticated, user]);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[100] h-[var(--header-height)] bg-[#050b18] border-b border-white/5 flex items-center justify-between px-10">
        {/* Logo */}
        <a
          href="/"
          className="flex items-center gap-2.5 font-extrabold text-white no-underline group"
          style={{ fontSize: '40px', lineHeight: 1 }}
        >
          <span className="logo-glow-wrap">
            <img
              src={logoImg}
              alt="FastFix"
              className="logo-glow-img w-20 h-20 object-contain"
              style={{ filter: 'brightness(1.3) contrast(1.1) drop-shadow(0 0 10px rgba(96,165,250,0.7))' }}
            />
          </span>
          <span>
            Fast<span className="text-primary-light">Fix</span>
          </span>
        </a>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-10 text-sm">
          <a href="#" className="text-white font-bold border-b-2 border-primary pb-1 translate-y-[2px]">
            Tìm thợ
          </a>
          <a href="#" className="text-zinc-400 font-bold hover:text-white transition-colors">
            Dịch vụ
          </a>
          <a href="#" className="text-zinc-400 font-bold hover:text-white transition-colors">
            Cách hoạt động
          </a>
          <a href="#" className="text-zinc-400 font-bold hover:text-white transition-colors">
            Trở thành thợ
          </a>
          <a href="#" className="text-zinc-400 font-bold hover:text-white transition-colors">
            Hỗ trợ
          </a>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-8">

          {isAuthenticated && user ? (
            /* ── User Menu ── */
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-primary/30 transition-all"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-bold">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:block text-sm font-semibold text-text max-w-[120px] truncate">
                  {user.fullName}
                </span>
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-bg-card/95 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl shadow-black/40 py-2 z-50">
                  <div className="px-4 py-2.5 border-b border-white/5">
                    <p className="text-sm font-semibold truncate">
                      {user.fullName}
                    </p>
                    <p className="text-xs text-text-secondary truncate">
                      {user.email}
                    </p>
                  </div>
                  {(user as any).role?.toLowerCase() === 'admin' ? (
                    <>
                      <Link
                        to="/admin"
                        onClick={() => setShowMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-white hover:bg-white/5 transition-all"
                      >
                        <LayoutDashboard size={16} /> Bảng điều khiển
                      </Link>
                      <Link
                        to="/admin/cai-dat"
                        onClick={() => setShowMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-white hover:bg-white/5 transition-all"
                      >
                        <Settings size={16} /> Cài đặt
                      </Link>
                    </>
                  ) : (user as any).role?.toLowerCase() === 'technician' ? (
                    <>
                      <Link
                        to="/technician"
                        onClick={() => setShowMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-white hover:bg-white/5 transition-all"
                      >
                        <LayoutDashboard size={16} /> Bảng công việc
                      </Link>
                      <Link
                        to="/technician/dang-thuc-hien"
                        onClick={() => setShowMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-white hover:bg-white/5 transition-all"
                      >
                        <ClipboardList size={16} /> Đơn sửa chữa
                      </Link>
                    </>
                  ) : (
                    <>
                      <a
                        href="#"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-white hover:bg-white/5 transition-all"
                      >
                        <UserCircle size={16} /> Hồ sơ cá nhân
                      </a>
                      <a
                        href="#"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-white hover:bg-white/5 transition-all"
                      >
                        <ClipboardList size={16} /> Đơn sửa chữa
                      </a>
                    </>
                  )}
                  <div className="border-t border-white/5 mt-1 pt-1">
                    <button
                      onClick={() => {
                        logout();
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-all"
                    >
                      <LogOut size={16} /> Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ── Login/Register ── */
            <div className="flex items-center gap-6">
              <button
                onClick={() => setShowAuth(true)}
                className="px-6 py-2.5 rounded-xl border-2 border-primary/50 hover:border-primary text-primary-light font-bold text-sm transition-all hover:bg-primary/5"
              >
                Đăng nhập
              </button>
              <button
                onClick={() => setShowAuth(true)}
                className="bg-primary hover:bg-primary-dark text-white font-bold px-8 py-3 rounded-2xl text-sm transition-all shadow-lg shadow-primary/20 active:scale-95"
              >
                Đăng ký
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}

/* ═══════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════ */
function Footer() {
  return (
    <footer className="bg-[#0a1122] border-t border-white/5">
      <div className="max-w-5xl mx-auto px-6 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <a
              href="/"
              className="flex items-center gap-2 font-extrabold text-white mb-4 no-underline group"
              style={{ fontSize: '40px', lineHeight: 1 }}
            >
              <img
                src={logoImg}
                alt="FastFix"
                className="w-16 h-16 object-contain rounded-lg bg-white/5"
              />
              <span>Fast<span className="text-primary-light">Fix</span></span>
            </a>
            <p className="text-text-secondary text-sm leading-relaxed">
              Nền tảng sửa chữa nhà #1 tại Đà Nẵng. Kết nối bạn với thợ giỏi, uy
              tín nhất miền Trung.
            </p>
          </div>

          {/* Dịch vụ */}
          <div>
            <h4 className="font-semibold text-sm mb-4">Dịch vụ</h4>
            <ul className="space-y-2.5 text-sm text-text-secondary">
              {[
                "Sửa điện",
                "Sửa nước",
                "Điều hòa",
                "Sơn nhà",
                "Khóa & Cửa",
              ].map((s) => (
                <li key={s}>
                  <a
                    href="#"
                    className="hover:text-primary-light transition-colors flex items-center gap-1"
                  >
                    <ChevronRight size={12} /> {s}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Khu vực */}
          <div>
            <h4 className="font-semibold text-sm mb-4">Khu vực Đà Nẵng</h4>
            <ul className="space-y-2.5 text-sm text-text-secondary">
              {["Hải Châu", "Thanh Khê", "Sơn Trà", "Liên Chiểu", "Cẩm Lệ"].map(
                (d) => (
                  <li key={d}>
                    <a
                      href="#"
                      className="hover:text-primary-light transition-colors flex items-center gap-1"
                    >
                      <MapPin size={12} /> {d}
                    </a>
                  </li>
                ),
              )}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-sm mb-4">Liên hệ</h4>
            <ul className="space-y-3 text-sm text-text-secondary">
              <li className="flex items-center gap-2">
                <Phone size={14} /> 0236 xxx xxxx
              </li>
              <li className="flex items-center gap-2">
                <Mail size={14} /> support@fastfix.vn
              </li>
              <li className="flex items-center gap-2">
                <MapPin size={14} /> Đà Nẵng, Việt Nam
              </li>
            </ul>
            <div className="flex gap-3 mt-4">
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-text-secondary hover:text-primary-light hover:border-primary/30 transition-all"
              >
                <Facebook size={16} />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-text-secondary hover:text-primary-light hover:border-primary/30 transition-all"
              >
                <Youtube size={16} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-secondary">
          <p>© 2026 FastFix Team. All rights reserved.</p>
          <div className="flex gap-5">
            <a href="#" className="hover:text-primary-light transition-colors">
              Chính sách bảo mật
            </a>
            <a href="#" className="hover:text-primary-light transition-colors">
              Điều khoản sử dụng
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════
   MAIN LAYOUT
   ═══════════════════════════════════════ */
export default function MainLayout() {
  return (
    <>
      <Navbar />
      <main className="mt-[var(--header-height)] min-h-[calc(100vh-var(--header-height))]">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
