/** ETA / khung giờ dự kiến — dùng chung Customer & Technician (múi giờ VN). */

const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh';

export const formatVietnamHourLabel = (date: Date) => {
  if (!date || Number.isNaN(date.getTime())) return '—';

  const parts = new Intl.DateTimeFormat('vi-VN', {
    timeZone: VIETNAM_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const hour = parts.find((part) => part.type === 'hour')?.value ?? '00';
  const minute = parts.find((part) => part.type === 'minute')?.value ?? '00';
  return minute === '00' ? `${hour}h` : `${hour}h${minute}`;
};

export const getEstimatedTimeValue = (payload: any) => {
  const raw =
    payload?.estimatedTime ??
    payload?.EstimatedTime ??
    payload?.eta ??
    payload?.ETA ??
    payload?.estimatedMinutes ??
    payload?.EstimatedMinutes;
  if (raw === null || raw === undefined || raw === '') return 0;
  const normalizedRaw = typeof raw === 'string' ? raw.replace(',', '.').trim() : raw;
  const value = Number(normalizedRaw);
  return Number.isFinite(value) && value > 0 ? value : 0;
};

/**
 * Khung giờ dự kiến hoàn thành: (mốc HT − 10 phút, không trước lúc tạo đơn) → mốc HT,
 * với mốc HT = CreatedAt + EstimationTime (phút).
 */
export const buildEtaWindowText = (etaMinutesRaw: any, baseDateRaw?: any) => {
  const etaMinutes = getEstimatedTimeValue({ estimatedTime: etaMinutesRaw });
  if (!etaMinutes) return '';

  const baseDate = baseDateRaw ? new Date(baseDateRaw) : null;
  const base = baseDate && !Number.isNaN(baseDate.getTime()) ? baseDate : new Date();
  const end = new Date(base.getTime() + etaMinutes * 60 * 1000);
  const tenMinMs = 10 * 60 * 1000;
  const start = new Date(Math.max(base.getTime(), end.getTime() - tenMinMs));
  return `${formatVietnamHourLabel(start)} - ${formatVietnamHourLabel(end)}`;
};

export const getEtaFallbackLabel = (etaMinutesRaw: any) => {
  const etaMinutes = getEstimatedTimeValue({ estimatedTime: etaMinutesRaw });
  if (!etaMinutes) return 'Đang cập nhật';
  return `${etaMinutes} phút`;
};
