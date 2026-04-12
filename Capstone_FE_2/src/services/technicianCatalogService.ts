import api from './api';

const formatDecimalForBackend = (value: number) => {
  if (!Number.isFinite(value)) return '0';
  // Backend hiện parse decimal theo culture có dấu phẩy
  return value.toString().replace('.', ',');
};

export interface CreateOrderDTO {
  customerId: string;
  technicianId: string;
  serviceId?: string;
  title: string;
  description: string;
  address: string;
  cityId: string;
  latitude: string;
  longitude: string;
  videoFile?: File;
  imageFiles?: File[];
}

export interface TechnicianFilterRequestDTO {
  serviceId?: string;
  cityId?: string;
  startRate?: number;
  endRate?: number;
  technicianName?: string;
}

const technicianCatalogService = {
  getAllTechnicians: async () => {
    const res = await api.get('/customer/technicians/all');
    return res.data;
  },

  filterTechnicians: async (filter: TechnicianFilterRequestDTO) => {
    const res = await api.get('/customer/technicians/filter', {
      params: {
        ServiceId: filter.serviceId,
        CityId: filter.cityId,
        StartRate: filter.startRate,
        EndRate: filter.endRate,
        TechnicianName: filter.technicianName
      }
    });
    return res.data;
  },

  getTechniciansByService: async (serviceId: string) => {
    const res = await api.get(`/customer/technicians/by-service/${serviceId}`);
    return res.data;
  },

  getTechniciansByRate: async (start: number, end: number) => {
    const res = await api.get('/customer/technicians/by-rate', {
      params: { start, end }
    });
    return res.data;
  },

  searchTechnicians: async (query: string) => {
    const res = await api.get('/customer/technicians/search', {
      params: { TechnicianName: query }
    });
    return res.data;
  },

  placeOrder: async (data: CreateOrderDTO) => {
    const formData = new FormData();
    formData.append('CustomerId', data.customerId);
    formData.append('TechnicianId', data.technicianId);
    formData.append('Title', data.title);
    formData.append('Description', data.description);
    formData.append('Address', data.address);
    formData.append('CityId', data.cityId);
    formData.append('Latitude', data.latitude.toString());
    formData.append('Longitude', data.longitude.toString());

    if (data.serviceId) {
      formData.append('ServiceId', data.serviceId);
    } else {
      formData.append('ServiceId', '00000000-0000-0000-0000-000000000000');
    }

    if (data.videoFile) {
      formData.append('VideoFile', data.videoFile);
    }

    if (data.imageFiles && data.imageFiles.length > 0) {
      data.imageFiles.forEach(img => formData.append('ImageFiles', img));
    }

    const res = await api.post('/customer/technicians/place-order', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  }
};

export default technicianCatalogService;
