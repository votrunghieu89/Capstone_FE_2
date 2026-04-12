import api from './api';

export interface OrderActionDTO {
  orderId: string;
}

export interface OrderUpdateFormDTO {
  orderId: string;
  description: string;
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
    formData.append('Description', data.description);
    if (data.images && data.images.length > 0) {
      data.images.forEach(img => formData.append('Images', img));
    }

    const res = await api.put(`/customer/order/update`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  }
};

export default orderService;
