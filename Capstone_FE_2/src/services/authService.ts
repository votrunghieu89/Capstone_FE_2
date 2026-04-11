import api from './api';
import type { LoginData, LoginResultDTO } from '../types/auth';

const authService = {
  // POST /api/auth/login
  login: async (data: LoginData): Promise<LoginResultDTO> => {
    const res = await api.post('/auth/login', data);
    return res.data;
  },

  // POST /api/auth/logout 
  logout: async (accountId: string): Promise<{ message: string }> => {
    const res = await api.post('/auth/logout', { accountId });
    return res.data;
  },

  // POST /api/auth/register/save (save to Redis temporarily)
  saveRegisterInfo: async (data: any): Promise<{ message: string }> => {
    const res = await api.post('/auth/register/save', data);
    return res.data;
  },

  // POST /api/auth/send-otp
  sendOTP: async (email: string): Promise<{ message: string }> => {
    const res = await api.post('/auth/send-otp', { email });
    return res.data;
  },

  // POST /api/auth/verify-otp
  verifyOTP: async (email: string, otp: string): Promise<{ message: string }> => {
    const res = await api.post('/auth/verify-otp', { email, otp });
    return res.data;
  },

  // POST /api/auth/register/customer/confirm
  confirmRegisterCustomer: async (email: string): Promise<{ message: string }> => {
    const res = await api.post('/auth/register/customer/confirm', { email });
    return res.data;
  },

  // POST /api/auth/register/technician
  registerTechnician: async (data: any): Promise<{ message: string }> => {
    const res = await api.post('/auth/register/technician', data);
    return res.data;
  },

  // POST /api/auth/refresh-token
  refreshToken: async (id: string, role: string, email: string, refressToken: string): Promise<{ accessToken: string }> => {
    const res = await api.post('/auth/refresh-token', { id, role, email, refressToken });
    return res.data;
  },

  // POST /api/auth/check-email
  checkEmail: async (email: string): Promise<{ message: string; accountId?: string }> => {
    const res = await api.post('/auth/check-email', { email });
    return res.data;
  },

  // POST /api/auth/change-password
  changePassword: async (id: string, oldPassword: string, newPassword: string, confirmPassword: string): Promise<{ message: string }> => {
    const res = await api.post('/auth/change-password', { id, oldPassword, newPassword, confirmPassword });
    return res.data;
  },

  // PUT /api/auth/update-online-status
  updateOnlineStatus: async (accountId: string, isOnline: number): Promise<{ message: string }> => {
    const res = await api.put('/auth/update-online-status', { accountId, isOnline });
    return res.data;
  },

  // POST /api/auth/login/google/customer
  loginGoogleCustomer: async (idToken: string, accessToken: string): Promise<LoginResultDTO> => {
    const res = await api.post('/auth/login/google/customer', { idToken, accessToken });
    return res.data;
  },
};

export default authService;
