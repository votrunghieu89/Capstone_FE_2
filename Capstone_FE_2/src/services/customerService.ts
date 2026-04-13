import api from './api';

export interface ServiceCategory {
  id: string;
  serviceName: string;
  description: string;
}

const customerService = {
  // GET /api/service
  getAllServices: async (): Promise<ServiceCategory[]> => {
    const res = await api.get('/service');
    return res.data;
  },

  // GET /api/service/{id}
  getServiceById: async (id: string): Promise<ServiceCategory> => {
    const res = await api.get(`/service/${id}`);
    return res.data;
  },
};

export default customerService;
