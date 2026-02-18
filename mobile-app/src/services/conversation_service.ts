// mobile-app/src/services/conversation.service.ts
import { api } from '../config/api';
import { ConversationGroup, Message } from '../types/conversation';

/**
 * Service for managing group conversations (coach-led messaging)
 * This is separate from legacy messageService to avoid breaking existing screens
 */
export const conversationService = {
  /**
   * Get or create a 1:1 conversation between coach and client
   * Auto-creates if doesn't exist
   */
  async getOrCreateCoachConversation(coachId: string, clientId: string): Promise<ConversationGroup> {
    const response = await api.post('/conversations/get-or-create', {
      coach_id: coachId,
      client_id: clientId,
    });
    return response.data?.conversation ?? response.data;
  },

  /**
   * Get all conversations for current user (coach or client)
   */
  async getConversations(): Promise<ConversationGroup[]> {
    const response = await api.get('/conversations');
    return response.data?.conversations ?? [];
  },

  /**
   * Get messages for a specific conversation
   */
  async getMessages(conversationId: string, limit = 50): Promise<Message[]> {
    const response = await api.get(`/messages`, {
      params: { conversation_id: conversationId, limit },
    });
    return response.data?.messages ?? [];
  },

  /**
   * Send a message to a conversation
   */
  async sendMessage(conversationId: string, content: string): Promise<Message> {
    const response = await api.post('/messages', {
      conversation_id: conversationId,
      content,
    });
    return response.data?.message ?? response.data;
  },

  /**
   * Update conversation privacy setting (client only)
   */
  async updatePrivacy(conversationId: string, isPrivate: boolean): Promise<void> {
    await api.patch(`/conversations/${conversationId}`, {
      is_private: isPrivate,
    });
  },

  /**
   * Mark conversation messages as read
   */
  async markAsRead(conversationId: string): Promise<void> {
    await api.put(`/conversations/${conversationId}/read`);
  },
};