import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Mail, Lock, User, Phone, Eye, EyeOff, Loader2, Sparkles, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from 'axios';
import useAuthStore from '@/store/authStore';
import authService from '@/services/authService';

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
  const [registerStep, setRegisterStep] = useState<'form' | 'otp'>('form');
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingPassword, setPendingPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, setLoading } = useAuthStore();

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
      useAuthStore.getState().setLoading(true);
      const result = await authService.login({
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });
      login(result);

      const role = result.role?.toLowerCase();
      if (role === 'admin') {
        toast.success('Đăng nhập Admin thành công!', { duration: 3000 });
        onClose();
        loginForm.reset();
        window.location.href = '/admin';
      } else if (role === 'technician') {
        toast.success('Đăng nhập Kỹ Thuật Viên thành công!', { duration: 3000 });
        onClose();
        loginForm.reset();
        window.location.href = '/technician';
      } else {
        toast.success('Đăng nhập thành công!');
        onClose();
        loginForm.reset();
        window.location.href = '/customer';
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const serverMessage = (err.response?.data as { message?: string } | undefined)?.message;

        if (status === 401) {
          toast.error('Sai tên đăng nhập hoặc mật khẩu');
        } else if (status === 404) {
          toast.error('Tài khoản đã bị khoá');
        } else {
          toast.error(serverMessage || 'Đăng nhập thất bại');
        }
      } else {
        const msg = err instanceof Error ? err.message : 'Đăng nhập thất bại';
        toast.error(msg);
      }
    } finally {
      useAuthStore.getState().setLoading(false);
    }
  };

  const handleRegister = async (data: RegisterForm) => {
    const email = data.email.trim().toLowerCase();
    try {
      setLoading(true);
      await authService.saveRegisterInfo({
        email,
        password: data.password,
        fullName: data.fullName.trim(),
        phoneNumber: data.phone?.trim() || '',
      });
      await authService.sendOTP(email);

      setPendingEmail(email);
      setPendingPassword(data.password);
      setOtp('');
      setRegisterStep('otp');
      toast.success('Mã OTP đã được gửi đến email của bạn!');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const serverMessage = (err.response?.data as { message?: string } | undefined)?.message;
        toast.error(serverMessage || 'Không thể lưu thông tin đăng ký hoặc gửi OTP');
      } else {
        toast.error(err instanceof Error ? err.message : 'Đăng ký thất bại');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!pendingEmail) return;
    try {
      setLoading(true);
      await authService.sendOTP(pendingEmail);
      toast.success('Đã gửi lại mã OTP!');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const serverMessage = (err.response?.data as { message?: string } | undefined)?.message;
        toast.error(serverMessage || 'Không thể gửi lại OTP');
      } else {
        toast.error('Không thể gửi lại OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpAndRegister = async () => {
    if (!pendingEmail) return;
    const code = otp.trim();
    if (code.length < 6) {
      toast.error('Vui lòng nhập đủ 6 số OTP');
      return;
    }

    try {
      setLoading(true);
      await authService.verifyOTP(pendingEmail, code);
      await authService.confirmRegisterCustomer(pendingEmail);

      const result = await authService.login({
        email: pendingEmail,
        password: pendingPassword,
      });
      login(result);

      toast.success('Đăng ký thành công! Bạn đã được đăng nhập tự động 🎉');
      resetRegisterFlow();
      onClose();
      window.location.href = '/customer';
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const serverMessage = (err.response?.data as { message?: string } | undefined)?.message;
        toast.error(serverMessage || 'Xác thực OTP hoặc hoàn tất đăng ký thất bại');
      } else {
        toast.error(err instanceof Error ? err.message : 'Xác thực OTP thất bại');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetRegisterFlow = () => {
    setRegisterStep('form');
    setPendingEmail('');
    setPendingPassword('');
    setOtp('');
    registerForm.reset();
  };

  const switchTab = (newTab: 'login' | 'register') => {
    setTab(newTab);
    setShowPassword(false);
    resetRegisterFlow();
    loginForm.clearErrors();
    registerForm.clearErrors();
  };

  useEffect(() => {
    if (!isOpen) {
      resetRegisterFlow();
      setTab('login');
      setShowPassword(false);
      loginForm.clearErrors();
    }
  }, [isOpen]);

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
                  {tab === 'login'
                    ? 'Đăng nhập'
                    : registerStep === 'otp'
                      ? 'Xác thực OTP'
                      : 'Tạo tài khoản'}
                </h2>
                <p className="text-sm text-text-secondary mt-1">
                  {tab === 'login'
                    ? 'Chào mừng bạn trở lại FastFix!'
                    : registerStep === 'otp'
                      ? `Nhập mã 6 số đã gửi tới ${pendingEmail}`
                      : 'Tham gia cộng đồng sửa chữa #1 Đà Nẵng'}
                </p>
              </div>

              {/* Tabs */}
              {registerStep === 'form' && (
                <motion.div className="flex bg-white/5 rounded-xl p-1 mb-6">
                  {(['login', 'register'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => switchTab(t)}
                      className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${tab === t
                        ? 'bg-primary text-white shadow-md shadow-primary/30'
                        : 'text-text-secondary hover:text-white'
                        }`}
                    >
                      {t === 'login' ? 'Đăng nhập' : 'Đăng ký'}
                    </button>
                  ))}
                </motion.div>
              )}

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

              {/* ── REGISTER OTP STEP ── */}
              {tab === 'register' && registerStep === 'otp' && (
                <motion.div
                  key="register-otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setRegisterStep('form');
                      setOtp('');
                    }}
                    className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-white transition-colors"
                  >
                    <ArrowLeft size={14} /> Quay lại chỉnh sửa thông tin
                  </button>

                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">Mã xác nhận (OTP)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="------"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] font-bold outline-none focus:border-primary/50 focus:shadow-[0_0_20px_rgba(37,99,235,0.1)] transition-all placeholder:text-text-secondary/30"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyOtpAndRegister}
                    disabled={isLoading || otp.length < 6}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white font-bold text-sm shadow-lg shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : <>Xác nhận & hoàn tất đăng ký</>}
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="w-full text-xs text-primary-light hover:text-primary transition-colors disabled:opacity-50"
                  >
                    Gửi lại mã OTP
                  </button>
                </motion.div>
              )}

              {/* ── REGISTER FORM ── */}
              {tab === 'register' && registerStep === 'form' && (
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
                      <>Tiếp tục & nhận OTP</>
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
