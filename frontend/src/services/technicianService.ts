import api from './api';

export interface CreateOrderDTO {
  customerId: string;
  technicianId: string;
  serviceId?: string;
  title: string;
  description: string;
  address: string;
  cityId: string;
  latitude: number;
  longitude: number;
  videoFile?: File;
  imageFiles?: File[];
}

const technicianService = {
  // ... existing methods ...
  getAllTechnicians: async () => {
    const res = await api.get('/customer/technicians/all');
    return res.data;
  },

  getTechniciansByArea: async (city: string) => {
    const res = await api.get(`/customer/technicians/by-area/${city}`);
    return res.data;
  },

  getTechniciansByService: async (serviceId: string) => {
    const res = await api.get(`/customer/technicians/by-service/${serviceId}`);
    return res.data;
  },

  getTechniciansByRate: async () => {
    const res = await api.get('/customer/technicians/by-rate');
    return res.data;
  },

  searchTechnicians: async (query: string) => {
    const res = await api.get(`/customer/technicians/search?SearchName=${query}`);
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
    formData.append('Latitude', Number(data.latitude).toString());
    formData.append('Longitude', Number(data.longitude).toString());
    
    if (data.serviceId) {
        formData.append('ServiceId', data.serviceId);
    } else {
        // Fallback for Guid if not provided
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

export default technicianService;
