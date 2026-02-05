// mobile-app/src/services/message.service.ts
import { api } from '../config/api';

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface ConversationUser {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}

export interface Conversation {
  user?: ConversationUser | null;
  lastMessage?: Message | null;
  unreadCount?: number | null;
}

const normalizeConversation = (c: any): Conversation => {
  const user = c?.user ?? null;

  return {
    user: user
      ? {
          id: user.id,
          firstName: user.firstName ?? user.first_name ?? null,
          lastName: user.lastName ?? user.last_name ?? null,
          email: user.email ?? null,
        }
      : null,
    lastMessage: c?.lastMessage ?? c?.last_message ?? null,
    unreadCount: c?.unreadCount ?? c?.unread_count ?? 0,
  };
};

export const messageService = {
  // Get all conversations for current user
  async getConversations(): Promise<Conversation[]> {
    const response = await api.get('/messages/conversations');
    const raw = response.data?.conversations ?? response.data;

    if (!Array.isArray(raw)) return [];
    return raw.map(normalizeConversation);
  },

  // Get messages between current user and another user
  async getMessages(userId: string, limit = 50): Promise<Message[]> {
    const response = await api.get(`/messages/${userId}`, {
      params: { limit },
    });
    const raw = response.data?.messages ?? response.data;
    return Array.isArray(raw) ? raw : [];
  },

  // Send a message
  async sendMessage(recipientId: string, message: string): Promise<Message> {
    const response = await api.post('/messages', {
      recipientId,
      message,
    });
    return response.data?.message ?? response.data;
  },

  // Mark messages as read
  async markAsRead(userId: string): Promise<void> {
    await api.put(`/messages/${userId}/read`);
  },

  // Get unread count
  async getUnreadCount(): Promise<number> {
    const response = await api.get('/messages/unread-count');
    return response.data?.count ?? 0;
  },
};