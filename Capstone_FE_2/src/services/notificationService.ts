import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr';
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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5271/api';
const HUB_URL = import.meta.env.VITE_SIGNALR_NOTIFICATION_URL || String(API_URL).replace(/\/api\/?$/, '');

class NotificationService {
  private connection: HubConnection | null = null;

  public async startConnection(): Promise<void> {
    const token = localStorage.getItem('accessToken');
    
    if (!token) return;

    this.connection = new HubConnectionBuilder()
      .withUrl(`${HUB_URL}/hubs/notification`, {
        accessTokenFactory: () => token,
        skipNegotiation: false,
        transport: 1
      })
      .configureLogging(LogLevel.Information)
      .withAutomaticReconnect()
      .build();

    try {
      await this.connection.start();
      console.log('SignalR NotificationHub connected.');
    } catch (err) {
      console.error('SignalR NotificationHub Connection Error: ', err);
      setTimeout(() => this.startConnection(), 5000);
    }
  }

  public onNotificationReceived(callback: (message: string) => void): void {
    if (this.connection) {
      this.connection.on('ReceiveNotification', (message: string) => {
        callback(message);
      });
    }
  }

  public async getAll(accountId: string): Promise<any> {
    const res = await api.get(`/notification/${accountId}`);
    return res.data;
  }

  public async markAsRead(notificationId: string): Promise<any> {
    const res = await api.post(`/notification/mark/${notificationId}`);
    return res.data;
  }

  public async markAllAsRead(accountId: string): Promise<any> {
    const res = await api.post(`/notification/mark-all/${accountId}`);
    return res.data;
  }

  public stopConnection(): void {
    if (this.connection) {
      this.connection.stop();
    }
  }
}

export const notificationService = new NotificationService();

export default notificationService;
