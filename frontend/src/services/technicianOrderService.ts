import api from './api';

export interface OrderActionDTO {
  orderId: string;
}

const technicianOrderService = {
  getConfirmingOrders: async (technicianId: string) => {
    const res = await api.get(`/technician/order/confirming/${technicianId}`);
    return res.data;
  },

  getInProgressOrders: async (technicianId: string) => {
    const res = await api.get(`/technician/order/in-progress/${technicianId}`);
    return res.data;
  },

  getHistoryOrders: async (technicianId: string) => {
    const res = await api.get(`/technician/order/history/${technicianId}`);
    return res.data;
  },

  confirmOrder: async (data: OrderActionDTO) => {
    const res = await api.post('/technician/order/confirm', data);
    return res.data;
  },

  startOrder: async (data: OrderActionDTO) => {
    const res = await api.post('/technician/order/start', data);
    return res.data;
  },

  completeOrder: async (data: OrderActionDTO) => {
    const res = await api.post('/technician/order/complete', data);
    return res.data;
  },

  rejectOrder: async (data: OrderActionDTO) => {
    const res = await api.post('/technician/order/reject', data);
    return res.data;
  }
};

export default technicianOrderService;
