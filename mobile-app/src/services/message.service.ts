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

export interface Conversation {
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
  lastMessage: Message;
  unreadCount: number;
}

export const messageService = {
  // Get all conversations for current user
  async getConversations(): Promise<Conversation[]> {
    const response = await api.get('/messages/conversations');
    return response.data.conversations || response.data;
  },

  // Get messages between current user and another user
  async getMessages(userId: string, limit = 50): Promise<Message[]> {
    const response = await api.get(`/messages/${userId}`, {
      params: { limit },
    });
    return response.data.messages || response.data;
  },

  // Send a message
  async sendMessage(recipientId: string, message: string): Promise<Message> {
    const response = await api.post('/messages', {
      recipientId,
      message,
    });
    return response.data.message || response.data;
  },

  // Mark messages as read
  async markAsRead(userId: string): Promise<void> {
    await api.put(`/messages/${userId}/read`);
  },

  // Get unread count
  async getUnreadCount(): Promise<number> {
    const response = await api.get('/messages/unread-count');
    return response.data.count || 0;
  },
};