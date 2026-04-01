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
    const res = await api.post('auth/login', data);
    const backendUser = res.data;
    
    // Map the expected AuthUser interface to the Capstone_BE_2 LoginResultDTO
    return {
      id: backendUser.id || backendUser.Id || '',
      email: backendUser.email || backendUser.Email || data.email,
      fullName: backendUser.fullName || backendUser.FullName || backendUser.email || backendUser.Email || 'Khách hàng', // Fallback for UI
      role: backendUser.role || backendUser.Role || 'customer',
      token: backendUser.accessToken || backendUser.token,
    };
  },

  registerSave: async (data: RegisterData): Promise<{ message: string }> => {
    const payload = {
      Email: data.email,
      Password: data.password,
      FullName: data.fullName,
      PhoneNumber: data.phone || ''
    };
    const res = await api.post('auth/register/save', payload);
    return res.data;
  },

  registerConfirm: async (email: string): Promise<{ message: string }> => {
    const res = await api.post('auth/register/customer/confirm', { Email: email });
    return res.data;
  },

  sendOtp: async (email: string): Promise<{ message: string }> => {
    const res = await api.post('auth/send-otp', { Email: email });
    return res.data;
  },

  verifyOtp: async (email: string, otp: string): Promise<{ message: string }> => {
    const res = await api.post('auth/verify-otp', { Email: email, OTP: otp });
    return res.data;
  },

  forgetPassword: async (email: string, otp: string, newPassword: string): Promise<{ message: string }> => {
    const res = await api.post('auth/forget-password', { Email: email, OTP: otp, NewPassword: newPassword });
    return res.data;
  },

  getMe: async (): Promise<AuthUser> => {
    // Since backend does not have a GET Auth/me endpoint yet,
    // we reconstruct the session cleanly from the JWT payload to prevent 404 logout loops.
    const token = localStorage.getItem('fastfix_token');
    if (!token) throw new Error("No token");
    
    try {
      const base64Url = token.split('.')[1];
      let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const pad = base64.length % 4;
      if (pad) {
        base64 += '='.repeat(4 - pad);
      }
      const payload = JSON.parse(window.atob(base64));
      
      const email = payload.email || payload.Email || payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] || 'Nhà thầu/Khách';
      const role = payload.role || payload.Role || payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || 'customer';
      
      return {
        id: payload.AccountId || payload.id || '',
        email: email,
        fullName: email,
        role: role,
        token: token
      };
    } catch (err) {
      console.error('JWT Decode Error:', err);
      // localStorage.removeItem('fastfix_token'); // Don't remove token if it's just a decoding error for now
      throw new Error("Invalid token");
    }
  },
};

export default authService;
