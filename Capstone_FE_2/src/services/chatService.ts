import api from './api';

export interface ChatMessage {
  id?: string;
  roomId: string;
  senderId: string;
  content?: string;
  imageUrls?: string[];
  videoUrl?: string;
  createdAt?: string;
  isRead?: boolean;
  avatarUrl?: string;
}

export interface CreateMessageFormDTO {
  senderId: string;
  receiverId: string;
  content?: string;
  videoUrl?: File | null;
  imageUrls?: File[];
}

export interface ChatRoom {
  roomId: string;
  otherId: string;
  userName?: string;
  avatarUrl?: string;
  lastMessage?: string;
  lastMessageTime?: string;
}

const unwrap = (payload: any) => {
  if (payload == null) return payload;
  if (Array.isArray(payload)) return payload;

  if (Array.isArray(payload?.value)) return payload.value;
  if (payload?.value && typeof payload.value === 'object') return [payload.value];

  if (Array.isArray(payload?.items)) return payload.items;
  if (payload?.items && typeof payload.items === 'object') return [payload.items];

  if (Array.isArray(payload?.data)) return payload.data;
  if (payload?.data && typeof payload.data === 'object') return [payload.data];

  if (typeof payload === 'object' && (payload.roomId || payload.RoomId || payload.otherId || payload.OtherId)) {
    return [payload];
  }

  return payload;
};

const resolveAccountId = () => {
  const direct = localStorage.getItem('accountId') || localStorage.getItem('userId') || localStorage.getItem('id');
  if (direct) return direct;

  try {
    const raw = localStorage.getItem('fastfix-auth-storage');
    if (!raw) return '';
    const parsed = JSON.parse(raw);
    const userId = parsed?.state?.user?.id;
    return userId ? String(userId) : '';
  } catch {
    return '';
  }
};

const chatService = {
  getAllRooms: async (accountId: string, page = 1, pageSize = 20) => {
    const resolvedAccountId = String(accountId || resolveAccountId() || '').trim();
    if (!resolvedAccountId) return [];

    try {
      const res = await api.get(`/chat/rooms/${resolvedAccountId}`, { params: { page, pageSize } });
      return unwrap(res.data);
    } catch (err: any) {
      if (err?.response?.status === 404) return [];
      throw err;
    }
  },

  getAllMessages: async (roomId: string, page = 1, pageSize = 50) => {
    const res = await api.get(`/chat/messages/${roomId}`, { params: { page, pageSize } });
    return unwrap(res.data);
  },

  getOrCreateRoom: async (userA: string, userB: string) => {
    const res = await api.post(`/chat/room`, null, { params: { userA, userB } });
    return res.data;
  },

  insertMessage: async (data: CreateMessageFormDTO) => {
    const formData = new FormData();
    formData.append('SenderId', data.senderId);
    formData.append('ReceiverId', data.receiverId);
    if (data.content) formData.append('Content', data.content);
    if (data.videoUrl) formData.append('VideoUrl', data.videoUrl);
    data.imageUrls?.forEach((file) => formData.append('ImageUrls', file));

    const res = await api.post(`/chat/message`, formData);
    return res.data;
  },

  markAsRead: async (roomId: string, accountId: string) => {
    const res = await api.post(`/chat/mark-read`, null, { params: { roomId, accountId } });
    return res.data;
  }
};

export default chatService;
