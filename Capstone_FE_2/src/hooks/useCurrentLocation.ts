import { useEffect, useState } from 'react';

export interface CurrentLocation {
  lat: number;
  lng: number;
}

interface UseCurrentLocationResult {
  location: CurrentLocation | null;
  loading: boolean;
  error: string | null;
  refreshLocation: () => void;
}

export function useCurrentLocation(): UseCurrentLocationResult {
  const [location, setLocation] = useState<CurrentLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setError('Trình duyệt không hỗ trợ định vị.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) return;
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLoading(false);
      },
      (geoError) => {
        if (cancelled) return;
        const message =
          geoError.code === geoError.PERMISSION_DENIED
            ? 'Bạn cần cho phép truy cập vị trí để sử dụng tính năng này.'
            : geoError.message || 'Không thể lấy vị trí hiện tại.';
        setError(message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      },
    );

    return () => {
      cancelled = true;
    };
  }, [refreshIndex]);

  const refreshLocation = () => {
    setRefreshIndex((value) => value + 1);
  };

  return { location, loading, error, refreshLocation };
}