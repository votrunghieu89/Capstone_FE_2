import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('fastfix_token') || null,
  isAuthenticated: !!localStorage.getItem('fastfix_token'),

  login: (user, token) => {
    localStorage.setItem('fastfix_token', token);
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('fastfix_token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  setUser: (user) => set({ user }),
}));

export default useAuthStore;
