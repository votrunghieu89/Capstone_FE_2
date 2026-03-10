import api from './api';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  role: string;
  token: string;
}

const authService = {
  login: async (data: LoginData): Promise<AuthUser> => {
    const res = await api.post('Auth/login', data);
    return res.data;
  },

  register: async (data: RegisterData): Promise<AuthUser> => {
    const res = await api.post('Auth/register', data);
    return res.data;
  },

  getMe: async (): Promise<AuthUser> => {
    const res = await api.get('Auth/me');
    return res.data;
  },
};

export default authService;
