import { useCallback, useEffect, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import useAuthStore from '@/store/authStore';

type ChatListener = (message: any) => void;
type NotificationListener = (message: any) => void;

const resolveHubBaseUrl = () => {
  const backend = (import.meta.env.VITE_BACKEND_URL || '').trim().replace(/\/$/, '');
  if (backend) return backend;

  const apiUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
  if (apiUrl) return apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;

  return `${window.location.protocol}//${window.location.hostname}:5271`;
};

const resolveAccountId = () => {
  const direct = localStorage.getItem('accountId') || localStorage.getItem('userId') || localStorage.getItem('id');
  if (direct) return direct;

  try {
    const raw = localStorage.getItem('fastfix-auth-storage');
    if (!raw) return '';
    const parsed = JSON.parse(raw);
    const userId = parsed?.state?.user?.id;
    return userId ? String(userId) : '';
  } catch {
    return '';
  }
};

let sharedConnection: signalR.HubConnection | null = null;
let sharedConnecting: Promise<signalR.HubConnection | null> | null = null;
const sharedRoomIds = new Set<string>();
const listeners = new Set<ChatListener>();
const notificationListeners = new Set<NotificationListener>();

async function ensureSharedConnection() {
  const accountId = resolveAccountId();
  const currentAccountId = (sharedConnection as any)?._fastfixAccountId;
  if (sharedConnection && currentAccountId && currentAccountId !== accountId) {
    try {
      await sharedConnection.stop();
    } catch {
      // ignore
    }
    sharedConnection = null;
    sharedRoomIds.clear();
  }

  if (sharedConnection && sharedConnection.state !== signalR.HubConnectionState.Disconnected) {
    return sharedConnection;
  }
  if (sharedConnecting) return sharedConnecting;

  sharedConnecting = (async () => {
    const hubUrl = new URL(`${resolveHubBaseUrl()}/ChatHub`);
    if (accountId) {
      hubUrl.searchParams.set('AccountId', accountId);
    }

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl.toString(), {
        accessTokenFactory: () => localStorage.getItem('accessToken') || localStorage.getItem('token') || '',
        withCredentials: true,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connection.on('ChatMessage', (message: any) => {
      listeners.forEach((listener) => listener(message));
    });

    connection.on('NewMessageNotification', (message: any) => {
      notificationListeners.forEach((listener) => listener(message));
      listeners.forEach((listener) => listener(message));
    });

    connection.onreconnected(async () => {
      for (const roomId of sharedRoomIds) {
        try {
          await connection.invoke('JoinRoom', roomId);
        } catch {
          // ignore
        }
      }
    });

    connection.onclose(() => {
      if (sharedConnection === connection) {
        sharedConnection = null;
        sharedRoomIds.clear();
      }
    });

    await connection.start();
    (connection as any)._fastfixAccountId = accountId;
    sharedConnection = connection;
    return connection;
  })();

  try {
    return await sharedConnecting;
  } finally {
    sharedConnecting = null;
  }
}

export function useChatSignalR(roomId?: string) {
  const { user } = useAuthStore();
  const [connection, setConnection] = useState<signalR.HubConnection | null>(sharedConnection);
  const [messages, setMessages] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const roomRef = useRef<string | undefined>(roomId);
  const isConnected = connection?.state === signalR.HubConnectionState.Connected;

  useEffect(() => {
    roomRef.current = roomId;
  }, [roomId]);

  const joinRoom = useCallback(async (targetRoomId?: string) => {
    const rid = targetRoomId || roomRef.current;
    if (!rid || !user?.id) return;

    const conn = await ensureSharedConnection();
    if (!conn || conn.state !== signalR.HubConnectionState.Connected) return;

    const roomId = String(rid);
    if (!sharedRoomIds.has(roomId)) {
      await conn.invoke('JoinRoom', roomId);
      sharedRoomIds.add(roomId);
    }
    roomRef.current = roomId;
    setConnection(conn);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    let mounted = true;
    const appendNotificationIfNew = (message: any) => {
      setNotifications((prev) => {
        const key = String(
          message?.MessId ||
          message?.MessID ||
          message?.messId ||
          message?.id ||
          message?.Id ||
          ''
        );
        if (!key) return prev;
        if (prev.some((m: any) => String(m?.MessId || m?.MessID || m?.messId || m?.id || m?.Id || '') === key)) return prev;
        return [...prev, message];
      });
    };

    const handler = (message: any) => {
      if (!mounted) return;

      const messageRoomId = String(message?.RoomId || message?.roomId || message?.roomID || message?.roomid || '');
      const activeRoomId = String(roomRef.current || '');

      // ChatMessage + NewMessageNotification có thể trùng MessId — gộp vào notifications để badge/unread đếm đúng
      appendNotificationIfNew(message);

      // Chỉ append message thuộc room đang mở để tránh lẫn tin giữa các phòng chat
      if (activeRoomId && messageRoomId && activeRoomId !== messageRoomId) return;

      setMessages(prev => {
        const newId = String(message?.MessId || message?.MessID || message?.messId || message?.id || message?.Id || '');
        const newContent = String(message?.Content || message?.content || '');
        const newSenderId = String(message?.SenderId || message?.senderId || '');
        const newCreatedAt = String(message?.CreateAt || message?.createdAt || '');

        const isDuplicate = prev.some((m: any) => {
          const oldId = String(m?.MessId || m?.MessID || m?.messId || m?.id || m?.Id || '');
          const oldContent = String(m?.Content || m?.content || '');
          const oldSenderId = String(m?.SenderId || m?.senderId || '');
          const oldCreatedAt = String(m?.CreateAt || m?.createdAt || '');

          if (newId && oldId && newId === oldId) return true;

          return (
            newContent &&
            oldContent === newContent &&
            newSenderId === oldSenderId &&
            Math.abs(new Date(newCreatedAt || Date.now()).getTime() - new Date(oldCreatedAt || Date.now()).getTime()) < 2000
          );
        });

        if (isDuplicate) return prev;
        return [...prev, message];
      });
    };

    const notificationHandler = (message: any) => {
      if (!mounted) return;
      appendNotificationIfNew(message);
    };

    listeners.add(handler);
    notificationListeners.add(notificationHandler);
    void ensureSharedConnection().then((conn) => {
      if (mounted) setConnection(conn);
      if (conn && roomRef.current) {
        void joinRoom(roomRef.current);
      }
    });

    return () => {
      mounted = false;
      listeners.delete(handler);
      notificationListeners.delete(notificationHandler);
    };
  }, [joinRoom, user?.id]);

  const leaveRoom = useCallback(async (targetRoomId?: string) => {
    const rid = targetRoomId || roomRef.current;
    const conn = sharedConnection;
    if (!rid || !conn || conn.state !== signalR.HubConnectionState.Connected) return;
    try {
      await conn.invoke('LeaveRoom', String(rid));
    } finally {
      sharedRoomIds.delete(String(rid));
    }
  }, []);

  return { connection, messages, notifications, setMessages, joinRoom, leaveRoom, isConnected };
}
