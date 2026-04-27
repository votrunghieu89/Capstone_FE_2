import { useState, useEffect } from 'react';

export interface GeoLocation {
  lat: number;
  lng: number;
  accuracy?: number; // độ chính xác (mét)
}

interface UseCurrentLocationReturn {
  location: GeoLocation | null;
  error: string | null;
  loading: boolean;
}

export function useCurrentLocation(): UseCurrentLocationReturn {
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Trình duyệt không hỗ trợ định vị GPS');
      setLoading(false);
      return;
    }

    // watchPosition: tự động cập nhật liên tục khi di chuyển
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLoading(false);
        setError(null);
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Bạn đã từ chối quyền truy cập vị trí');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Không thể xác định vị trí hiện tại');
            break;
          case err.TIMEOUT:
            setError('Hết thời gian chờ lấy vị trí GPS');
            break;
          default:
            setError('Lỗi không xác định khi lấy vị trí');
        }
        setLoading(false);
      },
      {
        enableHighAccuracy: true, // Dùng GPS thật (chính xác hơn WiFi/Cell)
        maximumAge: 10000,        // Cache vị trí tối đa 10 giây
        timeout: 15000,           // Timeout sau 15 giây
      }
    );

    // Cleanup: dừng watchPosition khi component unmount
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return { location, error, loading };
}
