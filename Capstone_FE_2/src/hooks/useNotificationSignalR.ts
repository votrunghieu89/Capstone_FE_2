import { useEffect, useState, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import useAuthStore from '@/store/authStore';
import notificationService, { AppNotification } from '@/services/notificationService';
import toast from 'react-hot-toast';

export function useNotificationSignalR() {
  const { user } = useAuthStore();
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const isConnecting = useRef(false);

  // Fetch initial notifications
  useEffect(() => {
    if (user?.id) {
      notificationService.getAll(user.id).then(res => {
        const raw = Array.isArray(res) ? res : (res.items || res.data || []);
        setNotifications(raw.reverse()); // latest first typically
      }).catch(err => console.error("Error fetching notifications", err));
    }
  }, [user]);

  const connectionRef = useRef<signalR.HubConnection | null>(null);

  // SignalR Connection
  useEffect(() => {
    let isMounted = true;
    if (!user?.id || connectionRef.current) return;

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(`/hubs/notification?AccountId=${user.id}`, {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .build();

    connectionRef.current = newConnection;

    newConnection.on('ReceiveNotification', (notification: any) => {
      if (isMounted) {
        setNotifications(prev => [notification, ...prev]);
        toast('🔔 Bạn có thông báo mới: ' + (notification.message || notification.Action || 'Cập nhật đơn hàng!'), {
          style: { background: '#2563eb', color: '#fff' }
        });
      }
    });

    const startConnection = async () => {
      if (!connectionRef.current || connectionRef.current.state !== signalR.HubConnectionState.Disconnected) return;
      try {
        await newConnection.start();
        if (isMounted) {
          setConnection(newConnection);
          console.log('SignalR Notification Connected');
        } else {
          newConnection.stop().catch(() => {});
        }
      } catch (err: any) {
        if (isMounted && err.name !== 'AbortError' && !err.message?.includes('stop() was called')) {
          console.error('SignalR Notification Error: ', err);
        }
      }
    };

    startConnection();

    return () => {
      isMounted = false;
      if (connectionRef.current) {
        const conn = connectionRef.current;
        connectionRef.current = null;
        if (conn.state !== signalR.HubConnectionState.Disconnected) {
          conn.stop().catch(() => {}); 
        }
        setConnection(null);
      }
    };
  }, [user?.id]);

  const markAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      await notificationService.markAllAsRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  return { connection, notifications, markAsRead, markAllAsRead };
}
