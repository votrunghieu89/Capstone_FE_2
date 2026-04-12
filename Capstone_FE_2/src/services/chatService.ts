import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr';
import api from './api';

export interface ChatMessage {
  id?: string;
  roomId: string;
  senderId: string;
  content: string;
  type: string;
  createdAt?: string;
  isRead?: boolean;
}

export interface CreateMessageFormDTO {
  roomId: string;
  senderId: string;
  content: string;
  type: string; // 'text', 'image'
}

export interface ChatRoom {
  id: string;
  userA: string;
  userB: string;
  lastMessage?: string;
  lastUpdate?: string;
  // additional properties if mapped
}

const HUB_URL = import.meta.env.VITE_SIGNALR_URL || '';

class ChatService {
  private connection: HubConnection | null = null;

  public async startConnection(roomId?: string): Promise<void> {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    this.connection = new HubConnectionBuilder()
      .withUrl(`${HUB_URL}/ChatHub`, {
        accessTokenFactory: () => token
      })
      .configureLogging(LogLevel.Information)
      .withAutomaticReconnect()
      .build();

    try {
      await this.connection.start();
      console.log('SignalR ChatHub connected.');
    } catch (err) {
      console.error('SignalR ChatHub Connection Error: ', err);
      setTimeout(() => this.startConnection(), 5000);
    }
  }

  public onMessageReceived(callback: (senderId: string, message: string) => void): void {
    if (this.connection) {
      this.connection.on('ReceiveMessage', (senderId: string, message: string) => {
        callback(senderId, message);
      });
    }
  }

  public async sendMessage(receiverId: string, message: string): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.invoke('SendMessage', receiverId, message);
      } catch (err) {
        console.error('SignalR SendMessage Error: ', err);
      }
    }
  }

  public async getAllRooms(accountId?: string, page = 1, pageSize = 20): Promise<any[]> {
    if (accountId) {
      const res = await api.get(`/chat/rooms/${accountId}`, { params: { page, pageSize } });
      return res.data;
    }

    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${HUB_URL}/api/ChatRealTime/GetAllRooms?page=1&pageSize=10`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) return [];
    const result = await response.json();
    return result.data || [];
  }

  public async getAllMessages(roomId: string, page = 1, pageSize = 50): Promise<any[]> {
    const res = await api.get(`/chat/messages/${roomId}`, { params: { page, pageSize } });
    return res.data;
  }

  public async getOrCreateRoom(userA: string, userB: string): Promise<any> {
    const res = await api.post(`/chat/room`, null, { params: { userA, userB } });
    return res.data;
  }

  public async insertMessage(data: CreateMessageFormDTO): Promise<any> {
    const res = await api.post(`/chat/message`, data);
    return res.data;
  }

  public async markAsRead(roomId: string, accountId: string): Promise<any> {
    const res = await api.post(`/chat/mark-read`, null, { params: { roomId, accountId } });
    return res.data;
  }

  public stopConnection(): void {
    if (this.connection) {
      this.connection.stop();
    }
  }
}

export const chatService = new ChatService();

export default chatService;
