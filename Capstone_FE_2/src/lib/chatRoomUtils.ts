/** Dùng chung cho ChatWidget (customer) và TechnicianChatWidget — khớp nhiều biến thể BE. */

export function getChatRoomId(room: any): string {
  return String(room?.roomId || room?.RoomId || room?.RoomID || room?.id || room?.Id || '');
}

export function messageImageUrls(msg: any): string[] {
  const raw = msg?.imageUrls ?? msg?.ImageUrls;
  if (Array.isArray(raw)) return raw.filter(Boolean).map(String);
  const single = msg?.imageUrl ?? msg?.ImageUrl;
  return single ? [String(single)] : [];
}

/** Thời điểm gửi tin — hỗ trợ nhiều tên field từ BE. */
export function messageTimestampMs(msg: any): number {
  const raw =
    msg?.createAt ??
    msg?.CreateAt ??
    msg?.createdAt ??
    msg?.CreatedAt ??
    msg?.sentTime ??
    msg?.SentTime ??
    0;
  const t = new Date(raw).getTime();
  return Number.isFinite(t) ? t : 0;
}

/** Cũ nhất lên trên, mới nhất xuống dưới (giống Messenger). */
export function sortChatMessagesOldestFirst(messages: any[] | null | undefined): any[] {
  return [...(messages || [])].sort((a, b) => messageTimestampMs(a) - messageTimestampMs(b));
}

export function otherPartyIdFromRoom(room: any, currentUserId?: string): string {
  const candidates = [
    room?.otherId,
    room?.OtherId,
    room?.otherPartyId,
    room?.OtherPartyId,
    room?.customerId,
    room?.CustomerId,
    room?.technicianId,
    room?.TechnicianId,
    room?.userA,
    room?.UserA,
    room?.userB,
    room?.UserB,
  ]
    .map((v) => String(v || '').trim())
    .filter(Boolean);
  if (!currentUserId) return candidates[0] || '';
  const me = String(currentUserId).trim();
  return candidates.find((id) => id !== me) || candidates[0] || '';
}
