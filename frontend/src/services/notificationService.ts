import api from './api';

export interface AppNotification {
  id: string;
  senderId: string;
  receiverId: string;
  action: string;
  message: string;
  isRead: boolean;
  createAt: string;
}

const notificationService = {
  getAll: async (accountId: string) => {
    const res = await api.get(`/notification/${accountId}`);
    return res.data;
  },
  markAsRead: async (notificationId: string) => {
    const res = await api.post(`/notification/mark/${notificationId}`);
    return res.data;
  },
  markAllAsRead: async (accountId: string) => {
    const res = await api.post(`/notification/mark-all/${accountId}`);
    return res.data;
  }
};

export default notificationService;
