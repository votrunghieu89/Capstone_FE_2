import api from './api';
import type { OrderOverviewDTO, OrderDetailDTO, CreateOrderDTO, OrderActionDTO } from '../types/order';

/**
 * Customer Order Service
 * Maps 1:1 to Capstone_BE_2 CustomerOrderController endpoints
 * Base route: /api/customer/order
 */
const customerOrderService = {
  // GET /api/customer/order/current/{customerId}
  getCurrentOrders: async (customerId: string): Promise<OrderOverviewDTO[]> => {
    const res = await api.get(`/customer/order/current/${customerId}`);
    return res.data;
  },

  // GET /api/customer/order/history/{customerId}
  getOrderHistory: async (customerId: string): Promise<OrderOverviewDTO[]> => {
    const res = await api.get(`/customer/order/history/${customerId}`);
    return res.data;
  },

  // GET /api/customer/order/canceled/{customerId}
  getCancelledOrders: async (customerId: string): Promise<OrderOverviewDTO[]> => {
    const res = await api.get(`/customer/order/canceled/${customerId}`);
    return res.data;
  },

  // GET /api/customer/order/rejected/{customerId}
  getRejectedOrders: async (customerId: string): Promise<OrderOverviewDTO[]> => {
    const res = await api.get(`/customer/order/rejected/${customerId}`);
    return res.data;
  },

  // GET /api/customer/order/detail/{orderId}
  getOrderDetail: async (orderId: string): Promise<OrderDetailDTO> => {
    const res = await api.get(`/customer/order/detail/${orderId}`);
    return res.data;
  },

  // POST /api/customer/order/cancel
  cancelOrder: async (dto: OrderActionDTO): Promise<{ message: string }> => {
    const res = await api.post('/customer/order/cancel', dto);
    return res.data;
  },

  // POST /api/customer/order/confirm-complete
  confirmComplete: async (dto: OrderActionDTO): Promise<{ message: string }> => {
    const res = await api.post('/customer/order/confirm-complete', dto);
    return res.data;
  },

  // PUT /api/customer/order/update
  updateOrder: async (data: any): Promise<{ message: string }> => {
    const res = await api.put('/customer/order/update', data);
    return res.data;
  },
};

export default customerOrderService;
