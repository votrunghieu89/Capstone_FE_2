import api from './api';
import type { ViewOrderDTO, OrderActionDTO } from '../types/order';

/**
 * Technician Order Service
 * Maps 1:1 to Capstone_BE_2 TechnicianOrderController endpoints
 * Base route: /api/technician/order
 */
const technicianOrderService = {
  // GET /api/technician/order/confirming/{technicianId}
  // Đơn chờ xác nhận (Pending Confirmation)
  getConfirmingOrders: async (technicianId: string): Promise<ViewOrderDTO[]> => {
    const res = await api.get(`/technician/order/confirming/${technicianId}`);
    return res.data;
  },

  // GET /api/technician/order/confirmed/{technicianId}
  // Đơn đã xác nhận (Confirmed)
  getConfirmedOrders: async (technicianId: string): Promise<ViewOrderDTO[]> => {
    const res = await api.get(`/technician/order/confirmed/${technicianId}`);
    return res.data;
  },

  // GET /api/technician/order/in-progress/{technicianId}
  // Đơn đang thực hiện (In Progress)
  getInProgressOrder: async (technicianId: string) => {
    const res = await api.get(`/technician/order/in-progress/${technicianId}`);
    return res.data;
  },

  // GET /api/technician/order/history/{technicianId}
  // Lịch sử đơn hoàn thành (Completed)
  getHistoryOrders: async (technicianId: string): Promise<ViewOrderDTO[]> => {
    const res = await api.get(`/technician/order/history/${technicianId}`);
    return res.data;
  },

  // GET /api/technician/order/canceled/{technicianId}
  // Đơn đã hủy
  getCanceledOrders: async (technicianId: string): Promise<ViewOrderDTO[]> => {
    const res = await api.get(`/technician/order/canceled/${technicianId}`);
    return res.data;
  },

  // GET /api/technician/order/rejected/{technicianId}
  // Đơn đã từ chối
  getRejectedOrders: async (technicianId: string): Promise<ViewOrderDTO[]> => {
    const res = await api.get(`/technician/order/rejected/${technicianId}`);
    return res.data;
  },

  // POST /api/technician/order/confirm
  // Xác nhận đơn: Pending Confirmation → Confirmed
  confirmOrder: async (dto: OrderActionDTO): Promise<{ message: string }> => {
    const res = await api.post('/technician/order/confirm', dto);
    return res.data;
  },

  // POST /api/technician/order/start
  // Bắt đầu: Confirmed → In Progress
  startOrder: async (dto: OrderActionDTO): Promise<{ message: string }> => {
    const res = await api.post('/technician/order/start', dto);
    return res.data;
  },

  // POST /api/technician/order/complete/{orderId}
  // Hoàn thành: In Progress → Completed
  completeOrder: async (orderId: string): Promise<{ message: string }> => {
    const res = await api.post(`/technician/order/complete/${orderId}`);
    return res.data;
  },

  // POST /api/technician/order/reject
  // Từ chối: Pending Confirmation → Rejected
  rejectOrder: async (dto: OrderActionDTO): Promise<{ message: string }> => {
    const res = await api.post('/technician/order/reject', dto);
    return res.data;
  },
};

export default technicianOrderService;
