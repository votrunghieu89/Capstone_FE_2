import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr';

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

  public async getAllRooms(): Promise<any[]> {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${HUB_URL}/api/ChatRealTime/GetAllRooms?page=1&pageSize=10`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) return [];
    const result = await response.json();
    return result.data || [];
  }

  public stopConnection(): void {
    if (this.connection) {
      this.connection.stop();
    }
  }
}

export const chatService = new ChatService();
