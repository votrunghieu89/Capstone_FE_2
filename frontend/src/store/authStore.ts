import { create } from 'zustand';
import authService, { type AuthUser, type LoginData, type RegisterData } from '../services/authService';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (data: LoginData) => Promise<AuthUser | void>;
  register: (data: RegisterData) => Promise<void>;
  fetchMe: () => Promise<void>;
  logout: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('fastfix_token'),
  isAuthenticated: !!localStorage.getItem('fastfix_token'),
  isLoading: false,

  login: async (data) => {
    set({ isLoading: true });
    try {
      const user = await authService.login(data);
      localStorage.setItem('fastfix_token', user.token);
      // Set cookie for cross-port login to Admin panel
      document.cookie = `token=${user.token}; path=/; max-age=86400; SameSite=Lax`;
      
      set({ user, token: user.token, isAuthenticated: true, isLoading: false });
      return user; // Return user so callers can check role
    } catch (err: any) {
      set({ isLoading: false });
      if (!err.response) {
         throw new Error('Không thể kết nối đến server. Vui lòng thử lại.');
      }
      
      if (err.response.status === 401) {
         throw new Error('Email hoặc mật khẩu không đúng.');
      }

      // Extract actual server error message
      const serverMsg = err.response?.data?.message;
      throw new Error(serverMsg || 'Đã xảy ra lỗi hệ thống.');
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const user = await authService.register(data);
      localStorage.setItem('fastfix_token', user.token);
      set({ user, token: user.token, isAuthenticated: true, isLoading: false });
    } catch (err: unknown) {
      set({ isLoading: false });
      const serverMsg = (err as any)?.response?.data?.message;
      throw new Error(serverMsg || 'Đăng ký thất bại');
    }
  },

  fetchMe: async () => {
    try {
      const user = await authService.getMe();
      set({ user, isAuthenticated: true });
    } catch {
      localStorage.removeItem('fastfix_token');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },

  logout: () => {
    localStorage.removeItem('fastfix_token');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
