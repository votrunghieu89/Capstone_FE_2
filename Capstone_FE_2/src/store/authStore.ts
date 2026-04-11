import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '../services/authService';
import type { LoginData, AuthUser, LoginResultDTO } from '../types/auth';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginResultDTO) => void;
  register: (data: any) => Promise<void>;
  logout: () => void;
  isOnline: boolean;
  setOnlineStatus: (status: boolean) => void;
  setUser: (user: AuthUser | null) => void;
  fetchMe: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isOnline: true,
      isLoading: false,

      setLoading: (isLoading: boolean) => set({ isLoading }),

      login: (data: LoginResultDTO) => {
        const authUser: AuthUser = {
          id: data.id,
          fullName: data.fullName,
          email: data.email,
          role: data.role,
          phone: data.phone,
          avatarUrl: data.avatarUrl,
        };
        set({
          user: authUser,
          token: data.accessToken,
          isAuthenticated: true,
        });
        localStorage.setItem('accessToken', data.accessToken);
        // Set cookie for cross-port login to Admin panel
        document.cookie = `token=${data.accessToken}; path=/; max-age=86400; SameSite=Lax`;
      },

      register: async (data: any) => {
        // Stub for now to satisfy TS errors in AuthModal
        console.log('Register logic should be implemented in authService first:', data);
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        localStorage.removeItem('accessToken');
        document.cookie = 'token=; path=/; max-age=0';
      },

      setOnlineStatus: (isOnline: boolean) => set({ isOnline }),
      setUser: (user) => set({ user }),

      fetchMe: async () => {
        // Ensure token is synced to localStorage even if rehydration is slow
        const { token, isAuthenticated } = get();
        const storedToken = localStorage.getItem('accessToken');
        
        if (token) {
          localStorage.setItem('accessToken', token);
        } else if (storedToken && !isAuthenticated) {
          // If token exists in storage but not in state, something is out of sync
          // We could trigger a profile fetch here if an endpoint existed
          console.log('Token exists but state is not authenticated. Rehydration might be pending.');
        }
      },
    }),
    {
      name: 'fastfix-auth-storage',
    }
  )
);

export default useAuthStore;
