import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Mail, Lock, User, Phone, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/authStore';

/* ── Validation Schemas ── */
const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

const registerSchema = z.object({
  fullName: z.string().min(2, 'Họ tên tối thiểu 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/* ═══════════════════════════════════════
   AUTH MODAL COMPONENT
   ═══════════════════════════════════════ */
export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const { login, register: registerUser, isLoading } = useAuthStore();

  // ── Login Form ──
  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // ── Register Form ──
  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', phone: '', password: '', confirmPassword: '' },
  });

  const handleLogin = async (data: LoginForm) => {
    try {
      const user = await login(data);
      if (user && (user as any).role?.toLowerCase() === 'admin') {
        toast.success('Đăng nhập Admin thành công!', { duration: 3000 });
        onClose();
        loginForm.reset();
        window.location.href = '/admin';
      } else if (user && (user as any).role?.toLowerCase() === 'technician') {
        toast.success('Đăng nhập Kỹ Thuật Viên thành công!', { duration: 3000 });
        onClose();
        loginForm.reset();
        window.location.href = '/technician';
      } else {
        toast.success('Đăng nhập thành công! 🎉');
        onClose();
        loginForm.reset();
        window.location.href = '/customer';
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đăng nhập thất bại';
      toast.error(msg);
    }
  };

  const handleRegister = async (data: RegisterForm) => {
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phone: data.phone || undefined,
      });
      toast.success('Đăng ký thành công! Chào mừng bạn đến với FastFix 🎉');
      onClose();
      registerForm.reset();
      // Redirect to customer portal after registration
      window.location.href = '/customer';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đăng ký thất bại';
      toast.error(msg);
    }
  };

  const switchTab = (newTab: 'login' | 'register') => {
    setTab(newTab);
    setShowPassword(false);
    loginForm.clearErrors();
    registerForm.clearErrors();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-bg-card/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl shadow-black/40 overflow-hidden"
          >
            {/* Glow effect */}
            <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-secondary/15 blur-3xl" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-text-secondary hover:text-white hover:bg-white/10 transition-all"
            >
              <X size={16} />
            </button>

            <div className="relative z-[1] p-8">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 bg-primary/15 border border-primary/30 rounded-full px-4 py-1.5 mb-4 text-xs text-primary-light">
                  <Sparkles size={12} /> FastFix
                </div>
                <h2 className="text-2xl font-bold">
                  {tab === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
                </h2>
                <p className="text-sm text-text-secondary mt-1">
                  {tab === 'login'
                    ? 'Chào mừng bạn trở lại FastFix!'
                    : 'Tham gia cộng đồng sửa chữa #1 Đà Nẵng'}
                </p>
              </div>

              {/* Tabs */}
              <div className="flex bg-white/5 rounded-xl p-1 mb-6">
                {(['login', 'register'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => switchTab(t)}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${tab === t
                      ? 'bg-primary text-white shadow-md shadow-primary/30'
                      : 'text-text-secondary hover:text-white'
                      }`}
                  >
                    {t === 'login' ? 'Đăng nhập' : 'Đăng ký'}
                  </button>
                ))}
              </div>

              {/* ── LOGIN FORM ── */}
              {tab === 'login' && (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={loginForm.handleSubmit(handleLogin)}
                  className="space-y-4"
                >
                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">Email</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
                      <input
                        {...loginForm.register('email')}
                        type="email"
                        placeholder="email@example.com"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-primary/50 focus:shadow-[0_0_20px_rgba(37,99,235,0.1)] transition-all placeholder:text-text-secondary/50"
                      />
                    </div>
                    {loginForm.formState.errors.email && (
                      <p className="text-xs text-red-400 mt-1">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">Mật khẩu</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
                      <input
                        {...loginForm.register('password')}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm outline-none focus:border-primary/50 focus:shadow-[0_0_20px_rgba(37,99,235,0.1)] transition-all placeholder:text-text-secondary/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="text-xs text-red-400 mt-1">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  {/* Forgot password link */}
                  <div className="text-right">
                    <a href="#" className="text-xs text-primary-light hover:text-primary transition-colors">
                      Quên mật khẩu?
                    </a>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white font-bold text-sm shadow-lg shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>Đăng nhập</>
                    )}
                  </button>
                </motion.form>
              )}

              {/* ── REGISTER FORM ── */}
              {tab === 'register' && (
                <motion.form
                  key="register"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={registerForm.handleSubmit(handleRegister)}
                  className="space-y-3.5"
                >
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">Họ và tên</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
                      <input
                        {...registerForm.register('fullName')}
                        type="text"
                        placeholder="Nguyễn Văn A"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-primary/50 focus:shadow-[0_0_20px_rgba(37,99,235,0.1)] transition-all placeholder:text-text-secondary/50"
                      />
                    </div>
                    {registerForm.formState.errors.fullName && (
                      <p className="text-xs text-red-400 mt-1">{registerForm.formState.errors.fullName.message}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">Email</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
                      <input
                        {...registerForm.register('email')}
                        type="email"
                        placeholder="email@example.com"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-primary/50 focus:shadow-[0_0_20px_rgba(37,99,235,0.1)] transition-all placeholder:text-text-secondary/50"
                      />
                    </div>
                    {registerForm.formState.errors.email && (
                      <p className="text-xs text-red-400 mt-1">{registerForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">Số điện thoại <span className="text-text-secondary/50">(tuỳ chọn)</span></label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
                      <input
                        {...registerForm.register('phone')}
                        type="tel"
                        placeholder="0905 xxx xxx"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-primary/50 focus:shadow-[0_0_20px_rgba(37,99,235,0.1)] transition-all placeholder:text-text-secondary/50"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">Mật khẩu</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
                      <input
                        {...registerForm.register('password')}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Tối thiểu 6 ký tự"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm outline-none focus:border-primary/50 focus:shadow-[0_0_20px_rgba(37,99,235,0.1)] transition-all placeholder:text-text-secondary/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {registerForm.formState.errors.password && (
                      <p className="text-xs text-red-400 mt-1">{registerForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">Xác nhận mật khẩu</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
                      <input
                        {...registerForm.register('confirmPassword')}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Nhập lại mật khẩu"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-primary/50 focus:shadow-[0_0_20px_rgba(37,99,235,0.1)] transition-all placeholder:text-text-secondary/50"
                      />
                    </div>
                    {registerForm.formState.errors.confirmPassword && (
                      <p className="text-xs text-red-400 mt-1">{registerForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white font-bold text-sm shadow-lg shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                  >
                    {isLoading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>Tạo tài khoản</>
                    )}
                  </button>
                </motion.form>
              )}

              {/* Footer */}
              <p className="text-center text-xs text-text-secondary mt-5">
                Bằng việc tiếp tục, bạn đồng ý với{' '}
                <a href="#" className="text-primary-light hover:underline">Điều khoản dịch vụ</a>{' '}
                và{' '}
                <a href="#" className="text-primary-light hover:underline">Chính sách bảo mật</a>.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
