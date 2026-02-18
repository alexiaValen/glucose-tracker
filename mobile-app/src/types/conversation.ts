// /mnt/project/src/types/conversation.ts

export interface Message {
  id: string;
  conversation_id: string; // group_id for groups, or direct user-to-user
  sender_id: string;
  content: string;
  created_at: string;
  read_at?: string;
}

export interface ConversationGroup {
  id: string; // becomes conversation_id in Message
  coach_id: string;
  client_ids: string[]; // for now, always [client_id]
  is_private: boolean; // client's privacy setting
  created_at: string;
  updated_at?: string; // for sorting by last activity
  last_message?: string; // preview text for conversations list
  last_message_at?: string; // timestamp for sorting
}

export interface CoachingPrivacySettings {
  user_id: string;
  coach_can_see_data: boolean;
  allow_group_coaching: boolean; // always false for now (coming soon)
  updated_at: string;
}

// For API responses
export interface ConversationListResponse {
  conversations: ConversationGroup[];
}

export interface MessagesResponse {
  messages: Message[];
  conversation: ConversationGroup;
}

// Legacy types for backward compatibility with existing screens
export interface LegacyMessage {
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

export interface LegacyConversation {
  user?: ConversationUser | null;
  lastMessage?: LegacyMessage | null;
  unreadCount?: number | null;
}