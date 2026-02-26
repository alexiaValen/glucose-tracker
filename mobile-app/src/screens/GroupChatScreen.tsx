// mobile-app/src/screens/GroupChatScreen.tsx
// Group message thread — members read/send, coach can also manage members

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { BotanicalBackground } from '../components/BotanicalBackground';
import { colors } from '../theme/colors';
import { useAuthStore } from '../stores/authStore';

const API_BASE = process.env.EXPO_PUBLIC_API_URL;

interface Message {
  id: string;
  message: string;
  created_at: string;
  sender_id: string;
  sender: { id: string; first_name: string; last_name: string; email: string } | null;
}

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  joinedAt: string;
  membershipType: string;
}

export default function GroupChatScreen({ navigation, route }: { navigation: any; route: any }) {
  const { groupId, groupName } = route.params;
  const { user } = useAuthStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isCoach, setIsCoach] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    checkRole();
    fetchMessages();
    // Poll every 5s for new messages
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  // Read from SecureStore — same place tokens are written at login
  const getToken = async () => SecureStore.getItemAsync('accessToken');

  const checkRole = () => {
    setIsCoach(user?.role === 'coach');
  };

  const fetchMessages = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/groups/${groupId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        console.error('fetchMessages failed:', res.status);
        return;
      }
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/groups/${groupId}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMembers(data.members || []);
    } catch (err) {
      console.error('Error fetching members:', err);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    const optimisticText = input.trim();
    setInput('');
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/groups/${groupId}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: optimisticText }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('Send failed:', res.status, err);
        Alert.alert('Error', 'Failed to send message. Please try again.');
        setInput(optimisticText); // restore text on failure
        return;
      }
      const data = await res.json();
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (err) {
      console.error('Send error:', err);
      Alert.alert('Error', 'Failed to send message');
      setInput(optimisticText);
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    Alert.alert('Delete Message', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const token = await getToken();
          await fetch(`${API_BASE}/groups/${groupId}/messages/${messageId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          setMessages((prev) => prev.filter((m) => m.id !== messageId));
        },
      },
    ]);
  };

  const addMember = async () => {
    if (!addEmail.trim()) return;
    setAddingMember(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/groups/${groupId}/members`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: addEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert('Error', data.error || 'Failed to add member');
      } else {
        setAddEmail('');
        fetchMembers();
        Alert.alert('Added', `${data.member.first_name} has been added to the group.`);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const removeMember = async (member: Member) => {
    Alert.alert(
      'Remove Member',
      `Remove ${member.first_name} ${member.last_name} from this group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const token = await getToken();
            await fetch(`${API_BASE}/groups/${groupId}/members/${member.id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            setMembers((prev) => prev.filter((m) => m.id !== member.id));
          },
        },
      ]
    );
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender_id === user?.id;
    const senderName = item.sender
      ? `${item.sender.first_name} ${item.sender.last_name}`.trim()
      : 'Unknown';
    const time = new Date(item.created_at).toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit', hour12: true,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    const canDelete = isMe || isCoach;

    return (
      <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
        {!isMe && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{senderName.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          {!isMe && <Text style={styles.senderName}>{senderName}</Text>}
          <Text style={[styles.messageText, isMe && styles.messageTextMe]}>{item.message}</Text>
          <View style={styles.messageMeta}>
            <Text style={[styles.timeText, isMe && styles.timeTextMe]}>{time}</Text>
            {canDelete && (
              <TouchableOpacity onPress={() => deleteMessage(item.id)} style={styles.deleteBtn}>
                <Text style={styles.deleteBtnText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <BotanicalBackground variant="green" intensity="light">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{groupName || 'Group Chat'}</Text>
            <Text style={styles.headerSubtitle}>Group message</Text>
          </View>
          {isCoach && (
            <TouchableOpacity
              style={styles.membersBtn}
              onPress={() => {
                fetchMembers();
                setShowMembers(true);
              }}
            >
              <Text style={styles.membersBtnText}>Members</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Messages */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.forestGreen} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🌿</Text>
                <Text style={styles.emptyText}>No messages yet</Text>
                <Text style={styles.emptySubtext}>Be the first to say something</Text>
              </View>
            }
          />
        )}

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Message the group..."
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!input.trim() || sending}
          >
            <Text style={styles.sendBtnText}>{sending ? '...' : '↑'}</Text>
          </TouchableOpacity>
        </View>

        {/* Members Modal (coach only) */}
        <Modal visible={showMembers} animationType="slide" presentationStyle="pageSheet">
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Group Members</Text>
              <TouchableOpacity onPress={() => setShowMembers(false)}>
                <Text style={styles.modalClose}>Done</Text>
              </TouchableOpacity>
            </View>

            {/* Add member */}
            <View style={styles.addMemberRow}>
              <TextInput
                style={styles.addMemberInput}
                value={addEmail}
                onChangeText={setAddEmail}
                placeholder="Add by email address"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.addBtn, (!addEmail.trim() || addingMember) && styles.addBtnDisabled]}
                onPress={addMember}
                disabled={!addEmail.trim() || addingMember}
              >
                <Text style={styles.addBtnText}>{addingMember ? '...' : 'Add'}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.memberList}>
              {members.length === 0 && (
                <Text style={styles.noMembers}>No members yet</Text>
              )}
              {members.map((member) => (
                <View key={member.id} style={styles.memberRow}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>
                      {member.first_name?.charAt(0).toUpperCase() || '?'}
                    </Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>
                      {member.first_name} {member.last_name}
                    </Text>
                    <Text style={styles.memberEmail}>{member.email}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeMember(member)}
                    style={styles.removeBtn}
                  >
                    <Text style={styles.removeBtnText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </BotanicalBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(212,214,212,0.25)',
    gap: 12,
  },
  backBtn: { padding: 4 },
  backText: { fontSize: 22, color: colors.forestGreen },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.textDark },
  headerSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  membersBtn: {
    backgroundColor: 'rgba(107,127,110,0.1)', paddingHorizontal: 12,
    paddingVertical: 6, borderRadius: 14,
  },
  membersBtnText: { fontSize: 13, fontWeight: '600', color: colors.forestGreen },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messageList: { padding: 16, paddingBottom: 8 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 17, fontWeight: '600', color: colors.textDark, marginBottom: 6 },
  emptySubtext: { fontSize: 14, color: colors.textMuted },
  messageRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end', gap: 8 },
  messageRowMe: { flexDirection: 'row-reverse' },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(107,127,110,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 13, fontWeight: '700', color: colors.forestGreen },
  bubble: {
    maxWidth: '75%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10,
  },
  bubbleThem: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: 'rgba(212,214,212,0.3)',
  },
  bubbleMe: {
    backgroundColor: colors.forestGreen,
    borderBottomRightRadius: 4,
  },
  senderName: { fontSize: 11, fontWeight: '700', color: colors.sage, marginBottom: 3 },
  messageText: { fontSize: 15, color: colors.textDark, lineHeight: 21 },
  messageTextMe: { color: '#FFFFFF' },
  messageMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
  timeText: { fontSize: 10, color: colors.textMuted },
  timeTextMe: { color: 'rgba(255,255,255,0.6)' },
  deleteBtn: { padding: 2 },
  deleteBtnText: { fontSize: 10, color: 'rgba(200,90,84,0.6)' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12, paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 1, borderTopColor: 'rgba(212,214,212,0.3)',
  },
  input: {
    flex: 1, backgroundColor: 'rgba(245,244,240,0.9)', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: colors.textDark,
    borderWidth: 1, borderColor: 'rgba(212,214,212,0.4)', maxHeight: 100,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.forestGreen,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: 'rgba(107,127,110,0.3)' },
  sendBtnText: { fontSize: 18, color: '#FFFFFF', fontWeight: '700' },
  modal: { flex: 1, backgroundColor: '#FAF8F4' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(212,214,212,0.25)',
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.textDark },
  modalClose: { fontSize: 16, fontWeight: '600', color: colors.forestGreen },
  addMemberRow: {
    flexDirection: 'row', gap: 10, padding: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(212,214,212,0.2)',
  },
  addMemberInput: {
    flex: 1, backgroundColor: 'rgba(245,244,240,0.9)', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: colors.textDark,
    borderWidth: 1, borderColor: 'rgba(212,214,212,0.4)',
  },
  addBtn: {
    backgroundColor: colors.forestGreen, paddingHorizontal: 18,
    paddingVertical: 10, borderRadius: 12, justifyContent: 'center',
  },
  addBtnDisabled: { backgroundColor: 'rgba(107,127,110,0.3)' },
  addBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  memberList: { flex: 1, padding: 16 },
  noMembers: { textAlign: 'center', color: colors.textMuted, marginTop: 40, fontSize: 15 },
  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(212,214,212,0.25)',
  },
  memberAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(107,127,110,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  memberAvatarText: { fontSize: 16, fontWeight: '700', color: colors.forestGreen },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 15, fontWeight: '600', color: colors.textDark },
  memberEmail: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  removeBtn: {
    backgroundColor: 'rgba(200,90,84,0.1)', paddingHorizontal: 12,
    paddingVertical: 6, borderRadius: 10,
  },
  removeBtnText: { fontSize: 12, fontWeight: '600', color: colors.error },
});