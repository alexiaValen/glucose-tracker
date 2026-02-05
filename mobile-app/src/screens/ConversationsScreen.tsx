// mobile-app/src/screens/ConversationsScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { messageService, Conversation } from '../services/message.service';
import { useAuthStore } from '../stores/authStore';
import { colors } from '../theme/colors';

type ConversationsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Conversations'
>;

interface Props {
  navigation: ConversationsScreenNavigationProp;
}

export default function ConversationsScreen({ navigation }: Props) {
  const { user, logout } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadConversations();

    // Refresh conversations every 10 seconds
    const interval = setInterval(loadConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadConversations = async () => {
    try {
      const data = await messageService.getConversations();
      setConversations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setConversations([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes < 1 ? 'Just now' : `${minutes}m`;
    }
    if (hours < 24) return `${hours}h`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  const truncateMessage = (message: string, maxLength: number = 50) => {
    if (!message) return '';
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  // ✅ Safe helpers for missing user fields
  const getInitials = (c: Conversation) => {
    const first = (c?.user?.firstName ?? '').trim().charAt(0).toUpperCase();
    const last = (c?.user?.lastName ?? '').trim().charAt(0).toUpperCase();
    return `${first || '?'}${last || ''}`;
  };

  const getDisplayName = (c: Conversation) => {
    const first = (c?.user?.firstName ?? '').trim();
    const last = (c?.user?.lastName ?? '').trim();
    const full = `${first} ${last}`.trim();
    return full || c?.user?.email || 'Unknown';
  };

  const handleConversationPress = (conversation: Conversation) => {
    const userId = conversation?.user?.id;
    if (!userId) return;

    navigation.navigate('Messaging', {
      userId,
      userName: getDisplayName(conversation),
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.sage} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Messages</Text>
          <Text style={styles.headerSubtitle}>
            {conversations.length} {conversations.length === 1 ? 'conversation' : 'conversations'}
          </Text>
        </View>

        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.sage} />
        }
      >
        {conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>
              {user?.role === 'coach'
                ? 'Messages from your clients will appear here'
                : 'Messages with your coach will appear here'}
            </Text>
          </View>
        ) : (
          conversations.map((conversation, index) => {
            const initials = getInitials(conversation);
            const displayName = getDisplayName(conversation);

            const lastMessageText = conversation?.lastMessage?.message ?? '';
            const lastMessageTime = conversation?.lastMessage?.created_at;

            const key = conversation?.user?.id ?? `${index}`;

            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.conversationCard,
                  index === conversations.length - 1 && styles.lastConversationCard,
                ]}
                onPress={() => handleConversationPress(conversation)}
                activeOpacity={0.85}
              >
                {/* Avatar */}
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>

                {/* Content */}
                <View style={styles.conversationContent}>
                  <View style={styles.conversationHeader}>
                    <Text style={styles.conversationName}>{displayName}</Text>
                    <Text style={styles.conversationTime}>{formatTime(lastMessageTime)}</Text>
                  </View>

                  <View style={styles.conversationFooter}>
                    <Text
                      style={[
                        styles.conversationMessage,
                        (conversation?.unreadCount ?? 0) > 0 && styles.conversationMessageUnread,
                      ]}
                      numberOfLines={1}
                    >
                      {truncateMessage(lastMessageText)}
                    </Text>

                    {(conversation?.unreadCount ?? 0) > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>{conversation.unreadCount}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Arrow */}
                <View style={styles.arrowContainer}>
                  <Text style={styles.arrow}>›</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.cream,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { paddingVertical: 8, paddingRight: 12 },
  backText: { color: colors.sage, fontSize: 16, fontWeight: '600' },

  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.charcoal, marginBottom: 2 },
  headerSubtitle: { fontSize: 13, color: colors.textLight },

  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutText: { color: colors.textDark, fontSize: 14, fontWeight: '500' },

  content: { flex: 1 },

  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lastConversationCard: { borderBottomWidth: 0 },

  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.lightSage,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: colors.sage },

  conversationContent: { flex: 1 },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  conversationName: { fontSize: 17, fontWeight: '600', color: colors.textDark },
  conversationTime: { fontSize: 13, color: colors.textLight },

  conversationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  conversationMessage: { flex: 1, fontSize: 15, color: colors.textLight },
  conversationMessageUnread: { fontWeight: '600', color: colors.textDark },

  unreadBadge: {
    backgroundColor: colors.sage,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginLeft: 8,
  },
  unreadBadgeText: { color: colors.white, fontSize: 12, fontWeight: '700' },

  arrowContainer: { marginLeft: 8 },
  arrow: { fontSize: 24, color: colors.textLight, fontWeight: '300' },

  emptyState: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: { fontSize: 15, color: colors.textLight, textAlign: 'center', lineHeight: 22 },
});