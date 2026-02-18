// /mnt/project/src/services/message_service.ts
import { api } from '../config/api';
import {
  Message,
  ConversationGroup,
  MessagesResponse,
  ConversationListResponse,
  LegacyMessage,
  LegacyConversation,
  ConversationUser,
} from '../types/conversation';

// ============================================================================
// LEGACY SUPPORT (for existing MessagingScreen & ConversationsScreen)
// ============================================================================

const normalizeConversation = (c: any): LegacyConversation => {
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
  // ========== LEGACY API (current screens use these) ==========
  
  // Get all conversations for current user
  async getConversations(): Promise<LegacyConversation[]> {
    const response = await api.get('/messages/conversations');
    const raw = response.data?.conversations ?? response.data;

    if (!Array.isArray(raw)) return [];
    return raw.map(normalizeConversation);
  },

  // Get messages between current user and another user
  async getMessages(userId: string, limit = 50): Promise<LegacyMessage[]> {
    const response = await api.get(`/messages/${userId}`, {
      params: { limit },
    });
    const raw = response.data?.messages ?? response.data;
    return Array.isArray(raw) ? raw : [];
  },

  // Send a message (legacy direct message)
  async sendMessage(recipientId: string, message: string): Promise<LegacyMessage> {
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

  // ========== NEW GROUP CONVERSATION API ==========
  
  // Get all group conversations
  async getGroupConversations(): Promise<ConversationGroup[]> {
    const response = await api.get('/conversations');
    return response.data?.conversations ?? [];
  },

  // Get messages for a specific conversation
  async getConversationMessages(conversationId: string): Promise<MessagesResponse> {
    const response = await api.get(`/messages?conversation_id=${conversationId}`);
    return {
      messages: response.data?.messages ?? [],
      conversation: response.data?.conversation,
    };
  },

  // Send message to a conversation
  async sendConversationMessage(conversationId: string, content: string): Promise<Message> {
    const response = await api.post('/messages', {
      conversation_id: conversationId,
      content,
    });
    return response.data?.message ?? response.data;
  },

  // Create a new conversation (coach creates group)
  async createConversation(coachId: string, clientIds: string[], isPrivate = true): Promise<ConversationGroup> {
    const response = await api.post('/conversations/create', {
      coach_id: coachId,
      client_ids: clientIds,
      is_private: isPrivate,
    });
    return response.data?.conversation ?? response.data;
  },

  // Update conversation privacy
  async updateConversationPrivacy(conversationId: string, isPrivate: boolean): Promise<void> {
    await api.patch(`/conversations/${conversationId}`, {
      is_private: isPrivate,
    });
  },

  // Check if conversation exists between coach and client
  async getOrCreateCoachConversation(coachId: string, clientId: string): Promise<ConversationGroup> {
    const response = await api.post('/conversations/get-or-create', {
      coach_id: coachId,
      client_id: clientId,
    });
    return response.data?.conversation ?? response.data;
  },
};

// Named exports for backward compatibility
export type { LegacyMessage as Message };
export type { ConversationUser };
export type { LegacyConversation as Conversation };