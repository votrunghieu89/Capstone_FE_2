import api from './api';

export const adminApi = {
  // Stats
  getStats: async () => {
    const res = await api.get('/admin/stats/users');
    return res.data;
  },

  // Users
  getUsers: async (params?: { role?: string; search?: string }) => {
    const res = await api.get('/admin/users', { params });
    return res.data;
  },
  toggleUserActive: async (id: string, isActive: boolean) => {
    const endpoint = isActive ? `/admin/users/${id}/unlock` : `/admin/users/${id}/lock`;
    const res = await api.put(endpoint);
    return res.data;
  },

  // Technicians
  getTechnicians: async (search?: string) => {
    const res = await api.get('/admin/technicians', { params: { search } });
    return res.data;
  },
  createTechnician: async (data: any) => {
    const res = await api.post('/auth/register/technician', data);
    return res.data;
  },
  toggleTechnicianActive: async (id: string, isActive: boolean) => {
    const endpoint = isActive ? `/admin/users/${id}/unlock` : `/admin/users/${id}/lock`;
    const res = await api.put(endpoint);
    return res.data;
  },
  deleteTechnician: async (id: string) => {
    // Assuming backend doesn't have hard delete, we just lock them
    const res = await api.put(`/admin/users/${id}/lock`);
    return res.data;
  },

  // Requests
  getRequests: async (params?: { status?: string; search?: string }) => {
    // Placeholder as backend order management is under CustomerOrder / Service controllers
    return { data: [] };
  },
  updateRequestStatus: async (id: string, status: string) => {
    // Placeholder
    return { success: true };
  }
};
