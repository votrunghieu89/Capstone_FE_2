import { useEffect, useState, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import useAuthStore from '@/store/authStore';
import notificationService, { AppNotification } from '@/services/notificationService';
import toast from 'react-hot-toast';

export function useNotificationSignalR() {
  const { user } = useAuthStore();
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const accountId = String(user?.id || localStorage.getItem('accountId') || '').trim();

  const normalizeNotification = (item: any): AppNotification => ({
    id: String(item?.id || item?.notificationId || item?.NotificationId || ''),
    senderId: String(item?.senderId || item?.SenderId || ''),
    receiverId: String(item?.receiverId || item?.ReceiverId || ''),
    action: String(item?.action || item?.Action || ''),
    message: String(item?.message || item?.Message || item?.action || item?.Action || ''),
    isRead: Boolean(item?.isRead ?? item?.IsRead ?? false),
    createAt: String(item?.createAt || item?.CreateAt || item?.createdAt || item?.CreatedAt || new Date().toISOString()),
  });

  const sortNewestFirst = (list: AppNotification[]) =>
    [...list].sort((a, b) => {
      const ta = new Date(a.createAt || '').getTime();
      const tb = new Date(b.createAt || '').getTime();
      return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
    });

  // Fetch initial notifications
  useEffect(() => {
    if (accountId) {
      notificationService.getAll(accountId).then(res => {
        const raw = Array.isArray(res) ? res : (res.items || res.data || []);
        setNotifications(sortNewestFirst(raw.map(normalizeNotification)));
      }).catch(err => console.error("Error fetching notifications", err));
    }
  }, [accountId]);

  const connectionRef = useRef<signalR.HubConnection | null>(null);

  // SignalR Connection
  useEffect(() => {
    let isMounted = true;
    if (!accountId || connectionRef.current) return;

    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5271/api';
    const hubBase = String(apiBase).replace(/\/api\/?$/, '');
    const hubUrl = import.meta.env.VITE_SIGNALR_NOTIFICATION_URL || `${hubBase}/NotificationHub`;
    const accessToken = localStorage.getItem('accessToken') || localStorage.getItem('token') || '';
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${hubUrl}?AccountId=${accountId}`, {
        skipNegotiation: false,
        accessTokenFactory: () => accessToken
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .build();

    connectionRef.current = newConnection;

    newConnection.on('ReceiveNotification', (notification: any) => {
      if (isMounted) {
        const normalized = normalizeNotification(notification);
        setNotifications(prev => {
          const deduped = [normalized, ...prev.filter(p => p.id !== normalized.id)];
          return sortNewestFirst(deduped);
        });
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
          newConnection.stop().catch(() => { });
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
          conn.stop().catch(() => { });
        }
        setConnection(null);
      }
    };
  }, [accountId]);

  const markAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => {
        const nid = String((n as any).id || (n as any).notificationId || (n as any).NotificationId || '');
        return nid === id ? { ...n, isRead: true } : n;
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    if (!accountId) return;
    try {
      await notificationService.markAllAsRead(accountId);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  return { connection, notifications, markAsRead, markAllAsRead };
}
