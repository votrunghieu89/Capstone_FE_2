const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh';

export const formatVietnamHourLabel = (date: Date) => {
  if (!date || Number.isNaN(date.getTime())) return '—';
  const parts = new Intl.DateTimeFormat('vi-VN', {
    timeZone: VIETNAM_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const hour = parts.find((p) => p.type === 'hour')?.value ?? '00';
  const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';
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
  const normalized = typeof raw === 'string' ? raw.replace(',', '.').trim() : raw;
  const value = Number(normalized);
  return Number.isFinite(value) && value > 0 ? value : 0;
};

export const buildEtaWindowText = (etaMinutesRaw: any, baseDateRaw?: any) => {
  const etaMinutes = getEstimatedTimeValue({ estimatedTime: etaMinutesRaw });
  if (!etaMinutes) return '';

  const baseDate = baseDateRaw ? new Date(baseDateRaw) : null;
  const base = baseDate && !Number.isNaN(baseDate.getTime()) ? baseDate : new Date();
  const start = new Date(base.getTime() + etaMinutes * 60 * 1000);
  const end = new Date(start.getTime() + 10 * 60 * 1000);
  return `${formatVietnamHourLabel(start)} - ${formatVietnamHourLabel(end)}`;
};

export const getEtaFallbackLabel = (etaMinutesRaw: any) => {
  const etaMinutes = getEstimatedTimeValue({ estimatedTime: etaMinutesRaw });
  if (!etaMinutes) return 'Đang cập nhật';
  return `${etaMinutes} phút`;
};
