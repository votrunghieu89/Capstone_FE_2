import { GeoLocation } from '@/hooks/useCurrentLocation';

/**
 * Mở Google Maps với lộ trình từ vị trí KTV → địa chỉ khách hàng
 * Không cần API Key — dùng Google Maps URL scheme
 *
 * @param origin      Vị trí GPS hiện tại của KTV hoặc địa chỉ chuỗi
 * @param destination Địa chỉ khách hàng (string từ order.address)
 */
export function openGoogleMapsRoute(
  origin: GeoLocation | string | null,
  destination: string
): void {
  if (!destination) return;

  let url: string;

  if (origin && typeof origin !== 'string') {
    // Có GPS thật → dùng tọa độ chính xác làm điểm xuất phát
    url =
      `https://www.google.com/maps/dir/?api=1` +
      `&origin=${origin.lat},${origin.lng}` +
      `&destination=${encodeURIComponent(destination)}` +
      `&travelmode=driving`;
  } else if (typeof origin === 'string') {
    // Dùng chuỗi địa chỉ làm điểm xuất phát
    url =
      `https://www.google.com/maps/dir/?api=1` +
      `&origin=${encodeURIComponent(origin)}` +
      `&destination=${encodeURIComponent(destination)}` +
      `&travelmode=driving`;
  } else {
    // Fallback: chưa có GPS → Google Maps sẽ tự hỏi vị trí người dùng
    url =
      `https://www.google.com/maps/dir/?api=1` +
      `&destination=${encodeURIComponent(destination)}` +
      `&travelmode=driving`;
  }

  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Tạo src URL cho iframe bản đồ dựa trên vị trí GPS hiện tại
 * Nếu không có GPS, fallback về tọa độ đã lưu trong profile
 *
 * @param location    Vị trí GPS hiện tại
 * @param fallbackLat Latitude fallback (từ profile)
 * @param fallbackLng Longitude fallback (từ profile)
 * @param zoom        Mức zoom (mặc định 15)
 */
export function getMapEmbedSrc(
  location: GeoLocation | null,
  fallbackLat?: string | number | null,
  fallbackLng?: string | number | null,
  zoom: number = 15
): string {
  const DEFAULT_SRC =
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d122691.61914371526!2d108.132717088925!3d16.047165882643883!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x314219c7922b6539%3A0x1390977800000000!2zxJDDoCBO4bq5bmcsIFZp4buHdCBOYW0!5e0!3m2!1svi!2s!4v1713170000000!5m2!1svi!2s';

  if (location) {
    return `https://maps.google.com/maps?q=${location.lat},${location.lng}&z=${zoom}&output=embed`;
  }

  const lat = fallbackLat != null ? Number(fallbackLat) : NaN;
  const lng = fallbackLng != null ? Number(fallbackLng) : NaN;

  if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
    return `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom - 2}&output=embed`;
  }

  return DEFAULT_SRC;
}

/**
 * Tạo src URL cho iframe bản đồ dựa trên chuỗi địa chỉ
 * @param address Chuỗi địa chỉ cần hiển thị
 * @param zoom Mức zoom (mặc định 15)
 */
export function getMapEmbedSrcByAddress(address: string | null, zoom: number = 15): string {
  if (!address) {
    return 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d122691.61914371526!2d108.132717088925!3d16.047165882643883!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x314219c7922b6539%3A0x1390977800000000!2zxJDDoCBO4bq5bmcsIFZp4buHdCBOYW0!5e0!3m2!1svi!2s!4v1713170000000!5m2!1svi!2s';
  }
  return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&z=${zoom}&output=embed`;
}

/**
 * Mở Google Maps chỉ để xem 1 địa chỉ (không cần origin - dùng cho NewRequests)
 */
export function openGoogleMapsLocation(address: string): void {
  if (!address) return;
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}
