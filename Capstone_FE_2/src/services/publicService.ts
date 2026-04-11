import api from './api';

export interface CityDTO {
  cityId: string;
  cityName: string;
}

export interface ServiceDTO {
  id: string;
  serviceName: string;
  description: string;
}

const publicService = {
  // GET /api/admin/cities
  getCities: async (): Promise<CityDTO[]> => {
    const res = await api.get('/admin/cities');
    return res.data;
  },

  // GET /api/service
  getServices: async (): Promise<ServiceDTO[]> => {
    const res = await api.get('/service');
    return res.data;
  }
};

export default publicService;
