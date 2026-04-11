import { useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import AppRoutes from './routes/AppRoutes';
import { notificationService } from './services/notificationService';
import { chatService } from './services/chatService';

function App() {
  useEffect(() => {
    // Initialize Real-time services
    const initRealTime = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        await notificationService.startConnection();
        await chatService.startConnection();

        // Listen for global notifications
        notificationService.onNotificationReceived((message) => {
          toast.success(message, {
            duration: 5000,
            icon: '🔔',
          });
        });
      }
    };

    initRealTime();

    return () => {
      notificationService.stopConnection();
      chatService.stopConnection();
    };
  }, []);

  return (
    <>
      <AppRoutes />

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'rgba(30, 41, 59, 0.95)',
            color: '#f1f5f9',
            border: '1px solid rgba(148, 163, 184, 0.15)',
            borderRadius: '12px',
            backdropFilter: 'blur(20px)',
            fontSize: '0.875rem',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#f1f5f9' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#f1f5f9' },
          },
        }}
      />
    </>
  );
}

export default App;
