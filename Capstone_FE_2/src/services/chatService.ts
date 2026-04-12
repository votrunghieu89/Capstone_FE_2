import api from './api';

export interface ChatMessage {
  id?: string;
  roomId: string;
  senderId: string;
  content: string;
  type: string;
  createdAt?: string;
  isRead?: boolean;
}

export interface CreateMessageFormDTO {
  senderId: string;
  receiverId: string;
  content: string;
}

export interface ChatRoom {
  id: string;
  userA: string;
  userB: string;
  lastMessage?: string;
  lastUpdate?: string;
  // additional properties if mapped
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

const chatService = {
  getAllRooms: async (accountId: string, page = 1, pageSize = 20) => {
    const res = await api.get(`/chat/rooms/${accountId}`, { params: { page, pageSize } });
    return unwrap(res.data);
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
    const res = await api.post(`/chat/message`, data);
    return res.data;
  },

  markAsRead: async (roomId: string, accountId: string) => {
    const res = await api.post(`/chat/mark-read`, null, { params: { roomId, accountId } });
    return res.data;
  }
};

export default chatService;
