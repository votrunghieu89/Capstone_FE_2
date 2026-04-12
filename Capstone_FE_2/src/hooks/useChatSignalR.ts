import { useEffect, useState, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import useAuthStore from '@/store/authStore';

export function useChatSignalR() {
  const { user } = useAuthStore();
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [messages, setMessages] = useState<any[]>([]);

  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!user?.id || connectionRef.current) return;

    const newConnection = new signalR.HubConnectionBuilder()
      // Make sure the base URL matches the Vite proxy or backend URL
      .withUrl(`/hubs/chat?AccountId=${user.id}`, {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .build();

    connectionRef.current = newConnection;

    newConnection.on('ChatMessage', (message: any) => {
      if (isMounted) {
        setMessages(prev => [...prev, message]);
      }
    });

    const startConnection = async () => {
      if (!connectionRef.current || connectionRef.current.state !== signalR.HubConnectionState.Disconnected) return;
      try {
        await newConnection.start();
        if (isMounted) {
          setConnection(newConnection);
          console.log('SignalR Chat Connected');
        } else {
          newConnection.stop().catch(() => {});
        }
      } catch (err: any) {
        if (isMounted && err.name !== 'AbortError' && !err.message?.includes('stop() was called')) {
          console.error('SignalR Chat Connection Error: ', err);
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

  return { connection, messages, setMessages };
}
