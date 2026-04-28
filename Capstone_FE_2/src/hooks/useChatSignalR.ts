import { useCallback, useEffect, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import useAuthStore from '@/store/authStore';

type ChatListener = (message: any) => void;

const resolveHubBaseUrl = () => {
  const backend = (import.meta.env.VITE_BACKEND_URL || '').trim().replace(/\/$/, '');
  if (backend) return backend;

  const apiUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
  if (apiUrl) return apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;

  return `${window.location.protocol}//${window.location.hostname}:5271`;
};

let sharedConnection: signalR.HubConnection | null = null;
let sharedConnecting: Promise<signalR.HubConnection | null> | null = null;
let sharedRoomId: string | null = null;
const listeners = new Set<ChatListener>();

async function ensureSharedConnection() {
  if (sharedConnection && sharedConnection.state !== signalR.HubConnectionState.Disconnected) {
    return sharedConnection;
  }
  if (sharedConnecting) return sharedConnecting;

  sharedConnecting = (async () => {
    const hubUrl = `${resolveHubBaseUrl()}/hubs/chat`;
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => localStorage.getItem('accessToken') || localStorage.getItem('token') || '',
        withCredentials: true,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connection.on('ChatMessage', (message: any) => {
      listeners.forEach((listener) => listener(message));
    });

    connection.onreconnected(async () => {
      if (sharedRoomId) {
        try {
          await connection.invoke('JoinRoom', sharedRoomId);
        } catch {
          // ignore
        }
      }
    });

    connection.onclose(() => {
      if (sharedConnection === connection) {
        sharedConnection = null;
        sharedRoomId = null;
      }
    });

    await connection.start();
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

    if (sharedRoomId === rid) {
      setConnection(conn);
      return;
    }

    if (sharedRoomId && sharedRoomId !== rid) {
      try {
        await conn.invoke('LeaveRoom', sharedRoomId);
      } catch {
        // ignore
      }
    }

    await conn.invoke('JoinRoom', String(rid));
    sharedRoomId = String(rid);
    setConnection(conn);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    let mounted = true;
    const handler = (message: any) => {
      if (!mounted) return;
      setMessages(prev => {
        const key = String(message?.MessId || message?.messId || message?.id || message?.Id || '');
        if (key && prev.some((m: any) => String(m?.MessId || m?.messId || m?.id || m?.Id || '') === key)) return prev;
        return [...prev, message];
      });
    };

    listeners.add(handler);
    void ensureSharedConnection().then((conn) => {
      if (mounted) setConnection(conn);
      if (conn && roomRef.current) {
        void joinRoom(roomRef.current);
      }
    });

    return () => {
      mounted = false;
      listeners.delete(handler);
    };
  }, [joinRoom, user?.id]);

  const leaveRoom = useCallback(async (targetRoomId?: string) => {
    const rid = targetRoomId || roomRef.current;
    const conn = sharedConnection;
    if (!rid || !conn || conn.state !== signalR.HubConnectionState.Connected) return;
    try {
      await conn.invoke('LeaveRoom', String(rid));
    } finally {
      if (sharedRoomId === rid) sharedRoomId = null;
    }
  }, []);

  return { connection, messages, setMessages, joinRoom, leaveRoom, isConnected };
}
