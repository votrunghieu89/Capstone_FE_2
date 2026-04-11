import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr';

const HUB_URL = import.meta.env.VITE_SIGNALR_URL || '';

class NotificationService {
  private connection: HubConnection | null = null;

  public async startConnection(): Promise<void> {
    const token = localStorage.getItem('accessToken');
    
    if (!token) return;

    this.connection = new HubConnectionBuilder()
      .withUrl(`${HUB_URL}/NotificationHub`, {
        accessTokenFactory: () => token
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

  public stopConnection(): void {
    if (this.connection) {
      this.connection.stop();
    }
  }
}

export const notificationService = new NotificationService();
