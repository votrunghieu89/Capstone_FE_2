import { useEffect, useState, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import useAuthStore from '@/store/authStore';

const resolveHubBaseUrl = () => {
  const backend = (import.meta.env.VITE_BACKEND_URL || '').trim().replace(/\/$/, '');
  if (backend) return backend;

  const apiUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
  if (apiUrl) return apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;

  return `${window.location.protocol}//${window.location.hostname}:5271`;
};

export function useChatSignalR() {
  const { user } = useAuthStore();
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const isConnecting = useRef(false);

  useEffect(() => {
    if (!user?.id || isConnecting.current || connection) return;

    let disposed = false;
    isConnecting.current = true;
    const baseUrl = resolveHubBaseUrl();
    const hubUrl = `${baseUrl}/hubs/chat`;

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => localStorage.getItem('fastfix_token') || '',
        withCredentials: true,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    newConnection.on('ChatMessage', (message: any) => {
      setMessages(prev => [...prev, message]);
    });

    newConnection.onreconnecting(() => {
      console.warn('SignalR Chat reconnecting...');
    });

    newConnection.onreconnected(() => {
      console.log('SignalR Chat reconnected');
    });

    newConnection.onclose((err) => {
      if (err && !disposed) console.error('SignalR Chat closed with error:', err);
    });

    const startConnection = async () => {
      try {
        await newConnection.start();
        if (disposed) return;
        setConnection(newConnection);
        console.log('SignalR Chat Connected');
      } catch (e: any) {
        if (disposed) return;
        const msg = String(e?.message || '');
        // React StrictMode dev có thể stop ngay lúc đang negotiate -> bỏ qua log lỗi nhiễu
        if (msg.includes('stopped during negotiation')) {
          console.warn('SignalR Chat negotiation interrupted (dev cleanup), retrying...');
          try {
            await newConnection.start();
            if (disposed) return;
            setConnection(newConnection);
            console.log('SignalR Chat Connected (retry)');
            return;
          } catch (retryErr) {
            if (!disposed) console.error('SignalR Chat Connection Error (retry): ', retryErr);
          }
        } else {
          console.error('SignalR Chat Connection Error: ', e);
        }
      } finally {
        if (!disposed) isConnecting.current = false;
      }
    };

    void startConnection();

    return () => {
      disposed = true;
      isConnecting.current = false;
      if (newConnection.state !== signalR.HubConnectionState.Disconnected) {
        void newConnection.stop();
      }
      setConnection(null);
    };
  }, [user?.id]);

  return { connection, messages, setMessages };
}
