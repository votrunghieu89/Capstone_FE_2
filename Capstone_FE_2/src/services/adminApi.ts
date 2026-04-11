import api from './api';

export const adminApi = {
  // Stats
  getStats: async () => {
    const res = await api.get('/admin/stats');
    return res.data;
  },

  // Users
  getUsers: async (params?: { role?: string; search?: string }) => {
    const res = await api.get('/admin/users', { params });
    return res.data;
  },
  toggleUserActive: async (id: string, isActive: boolean) => {
    const res = await api.put(`/admin/users/${id}/toggle-active`, { isActive });
    return res.data;
  },

  // Technicians
  getTechnicians: async (search?: string) => {
    const res = await api.get('/admin/technicians', { params: { search } });
    return res.data;
  },
  createTechnician: async (data: any) => {
    const res = await api.post('/admin/technicians', data);
    return res.data;
  },
  toggleTechnicianActive: async (id: string, isActive: boolean) => {
    const res = await api.put(`/admin/technicians/${id}/toggle-active`, { isActive });
    return res.data;
  },
  deleteTechnician: async (id: string) => {
    const res = await api.delete(`/admin/technicians/${id}`);
    return res.data;
  },

  // Requests
  getRequests: async (params?: { status?: string; search?: string }) => {
    const res = await api.get('/admin/requests', { params });
    return res.data;
  },
  updateRequestStatus: async (id: string, status: string) => {
    const res = await api.put(`/admin/requests/${id}/status`, { status });
    return res.data;
  }
};
