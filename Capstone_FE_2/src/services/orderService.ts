import api from './api';

export interface OrderActionDTO {
  orderId: string;
  technicianId?: string;
}

export interface OrderUpdateFormDTO {
  orderId: string;
  title?: string;
  description?: string;
  address?: string;
  cityId?: string;
  latitude?: number;
  longitude?: number;
  videoUrl?: File;
  images?: File[];
}

const orderService = {
  // Customer endpoints
  getCurrentOrders: async (customerId: string) => {
    const res = await api.get(`/customer/order/current/${customerId}`);
    return res.data;
  },

  getOrderHistory: async (customerId: string) => {
    const res = await api.get(`/customer/order/history/${customerId}`);
    return res.data;
  },

  getInProgressOrders: async (customerId: string) => {
    const res = await api.get(`/customer/order/in-progress/${customerId}`);
    return res.data;
  },

  getCanceledOrders: async (customerId: string) => {
    const res = await api.get(`/customer/order/canceled/${customerId}`);
    return res.data;
  },

  getRejectedOrders: async (customerId: string) => {
    const res = await api.get(`/customer/order/rejected/${customerId}`);
    return res.data;
  },

  getOrderDetail: async (orderId: string) => {
    const res = await api.get(`/customer/order/detail/${orderId}`);
    return res.data;
  },

  cancelOrder: async (data: OrderActionDTO) => {
    const res = await api.post(`/customer/order/cancel`, data);
    return res.data;
  },

  confirmCompletedOrder: async (data: OrderActionDTO) => {
    const res = await api.post(`/customer/order/confirm-complete`, data);
    return res.data;
  },

  updateOrder: async (data: OrderUpdateFormDTO) => {
    const formData = new FormData();
    formData.append('OrderId', data.orderId);

    if (typeof data.title === 'string') formData.append('Title', data.title);
    if (typeof data.description === 'string') formData.append('Description', data.description);
    if (typeof data.address === 'string') formData.append('Address', data.address);
    if (typeof data.cityId === 'string' && data.cityId) formData.append('CityId', data.cityId);
    if (typeof data.latitude === 'number') formData.append('Latitude', String(data.latitude));
    if (typeof data.longitude === 'number') formData.append('Longitude', String(data.longitude));
    if (data.videoUrl) formData.append('videoUrl', data.videoUrl);

    if (data.images && data.images.length > 0) {
      data.images.forEach(img => formData.append('ImageUrls', img));
    }

    const res = await api.put(`/customer/order/update`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  }
};

export default orderService;
