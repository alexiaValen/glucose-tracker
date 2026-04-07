// mobile-app/src/screens/GroupChatScreen.tsx
// REFACTORED: Matches dashboard design system — cream/sage/forest palette.
// ALL logic, API calls, polling, member management preserved exactly.

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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../stores/authStore';

const API_BASE = process.env.EXPO_PUBLIC_API_URL;
const { width: SW } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
// TOKENS — exact match to DashboardScreen
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  pageBg:       '#F0EBE0',
  cardCream:    '#F8F4EC',
  cardSage:     '#E2E8DF',
  cardForest:   '#2C4435',
  cardTan:      '#DDD3C0',
  cardOffWhite: '#EDE8DF',

  inkDark:      '#1C1E1A',
  inkMid:       '#484B44',
  inkMuted:     '#8A8E83',
  inkOnDark:    '#EDE9E1',

  forest:       '#2C4435',
  sage:         '#4D6B54',
  sageMid:      '#698870',
  sageLight:    'rgba(77,107,84,0.10)',
  sageBorder:   'rgba(77,107,84,0.22)',
  gold:         '#8C6E3C',
  goldLight:    'rgba(140,110,60,0.10)',

  low:          '#8C3B3B',
  border:       'rgba(28,30,26,0.09)',
  borderMid:    'rgba(28,30,26,0.15)',
  shadow:       '#18201A',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// TYPES (preserved exactly)
// ─────────────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  content: string;
  message?: string;
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

// ─────────────────────────────────────────────────────────────────────────────
// AVATAR — light surface
// ─────────────────────────────────────────────────────────────────────────────
function Avatar({
  name, size = 32, isCoach = false,
}: { name: string; size?: number; isCoach?: boolean }) {
  const initials = name.split(' ').map(w => w[0] ?? '').slice(0, 2).join('').toUpperCase();
  const hue = ((name.charCodeAt(0) ?? 65) * 41 + (name.charCodeAt(1) ?? 0) * 17) % 360;

  if (isCoach) {
    return (
      <View style={{
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: T.sageLight,
        borderWidth: 1, borderColor: T.sageBorder,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ fontSize: size * 0.46 }}>🌿</Text>
      </View>
    );
  }
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: `hsla(${hue},20%,82%,1)`,
      borderWidth: 1, borderColor: `hsla(${hue},20%,68%,0.5)`,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ fontSize: size * 0.34, fontWeight: '700', color: `hsl(${hue},28%,28%)` }}>
        {initials}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RELATIVE TIME (preserved exactly)
// ─────────────────────────────────────────────────────────────────────────────
function relTime(iso: string): string {
  const d = new Date(iso), now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m`;
  if (hours < 24) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  if (days < 7)   return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function GroupChatScreen({ navigation, route }: { navigation: any; route: any }) {
  const { groupId, groupName } = route.params;
  const { user } = useAuthStore();

  // ── All state preserved exactly ────────────────────────────────────────────
  const [messages,     setMessages]     = useState<Message[]>([]);
  const [members,      setMembers]      = useState<Member[]>([]);
  const [input,        setInput]        = useState('');
  const [loading,      setLoading]      = useState(true);
  const [coachId,      setCoachId]      = useState<string | null>(null);
  const [sending,      setSending]      = useState(false);
  const [isCoach,      setIsCoach]      = useState(false);
  const [showMembers,  setShowMembers]  = useState(false);
  const [addEmail,     setAddEmail]     = useState('');
  const [addingMember, setAddingMember] = useState(false);

  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    setIsCoach(user?.role === 'coach');
    fetchMessages();
    fetchGroupDetails();
    const iv = setInterval(fetchMessages, 5000);
    return () => clearInterval(iv);
  }, []);

  const getToken = () => SecureStore.getItemAsync('accessToken');

  // ── All API calls preserved exactly ────────────────────────────────────────
  const fetchGroupDetails = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.group?.coach_id) setCoachId(data.group.coach_id);
      else if (data.coach_id)   setCoachId(data.coach_id);
    } catch {}
  };

  const fetchMessages = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/groups/${groupId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) { console.error('fetchMessages error:', err); }
    finally { setLoading(false); }
  };

  const fetchMembers = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/groups/${groupId}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMembers(data.members || []);
    } catch (err) { console.error('fetchMembers error:', err); }
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    const text = input.trim();
    setInput('');
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/groups/${groupId}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      });
      if (!res.ok) { Alert.alert('Error', 'Failed to send message.'); setInput(text); return; }
      const data = await res.json();
      if (data.message) {
        setMessages(prev => [...prev, data.message]);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
      }
    } catch { Alert.alert('Error', 'Failed to send message'); setInput(text); }
    finally { setSending(false); }
  };

  const deleteMessage = async (messageId: string) => {
    Alert.alert('Delete message?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const token = await getToken();
          await fetch(`${API_BASE}/groups/${groupId}/messages/${messageId}`, {
            method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
          });
          setMessages(prev => prev.filter(m => m.id !== messageId));
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
      if (!res.ok) { Alert.alert('Error', data.error || 'Failed to add member'); }
      else {
        setAddEmail('');
        fetchMembers();
        Alert.alert('Added', `${data.member.first_name} has been added.`);
      }
    } catch { Alert.alert('Error', 'Failed to add member'); }
    finally { setAddingMember(false); }
  };

  const removeMember = (member: Member) => {
    Alert.alert('Remove member?', `Remove ${member.first_name} ${member.last_name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          const token = await getToken();
          await fetch(`${API_BASE}/groups/${groupId}/members/${member.id}`, {
            method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
          });
          setMembers(prev => prev.filter(m => m.id !== member.id));
        },
      },
    ]);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // MESSAGE BUBBLE
  // ─────────────────────────────────────────────────────────────────────────
  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMe       = item.sender_id === user?.id;
    const isCoachMsg = !isMe && coachId && item.sender_id === coachId;
    const senderName = item.sender
      ? `${item.sender.first_name} ${item.sender.last_name}`.trim()
      : 'Unknown';
    const canDelete  = isMe || isCoach;
    const prevMsg    = messages[index - 1];
    const sameAsPrev = prevMsg && prevMsg.sender_id === item.sender_id;
    const text       = item.content || item.message || '';

    return (
      <View style={[mb.row, isMe && mb.rowMe, sameAsPrev && { marginTop: 2 }]}>
        {/* Avatar — only when sender changes */}
        {!isMe && !sameAsPrev && (
          <Avatar name={senderName} size={28} isCoach={!!isCoachMsg} />
        )}
        {!isMe && !!sameAsPrev && <View style={{ width: 28 }} />}

        <View style={[mb.wrap, isMe && mb.wrapMe]}>
          {/* Sender name */}
          {!isMe && !sameAsPrev && (
            <Text style={[mb.sender, isCoachMsg && mb.senderCoach]}>
              {senderName}{isCoachMsg ? ' · Coach' : ''}
            </Text>
          )}

          {/* Bubble */}
          <View style={[
            mb.bubble,
            isMe       ? mb.bubbleMe    : mb.bubbleThem,
            isCoachMsg ? mb.bubbleCoach : null,
          ]}>
            <Text style={[mb.text, isMe && mb.textMe]}>{text}</Text>
          </View>

          {/* Meta row */}
          <View style={[mb.meta, isMe && mb.metaMe]}>
            <Text style={mb.time}>{relTime(item.created_at)}</Text>
            {canDelete && (
              <TouchableOpacity
                onPress={() => deleteMessage(item.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={mb.del}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={s.root}>
      <SafeAreaView style={s.safe} edges={['top']}>

        {/* ── HEADER ────────────────────────────────────────────────── */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
            <Text style={s.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle} numberOfLines={1}>{groupName || 'Group Chat'}</Text>
            <Text style={s.headerSub}>Group message</Text>
          </View>
          {isCoach && (
            <TouchableOpacity
              style={s.membersBtn}
              onPress={() => { fetchMembers(); setShowMembers(true); }}
              activeOpacity={0.75}
            >
              <Text style={s.membersBtnTxt}>Members</Text>
            </TouchableOpacity>
          )}
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* ── MESSAGES ─────────────────────────────────────────────── */}
          {loading ? (
            <View style={s.loadWrap}>
              <ActivityIndicator color={T.sage} size="large" />
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={item => item.id}
              renderItem={renderMessage}
              contentContainerStyle={s.list}
              onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={s.empty}>
                  <Text style={s.emptyEmoji}>🌿</Text>
                  <Text style={s.emptyTitle}>No messages yet</Text>
                  <Text style={s.emptySub}>Be the first to say something</Text>
                </View>
              }
            />
          )}

          {/* ── INPUT BAR ─────────────────────────────────────────────── */}
          <View style={s.inputBar}>
            <TextInput
              style={s.input}
              value={input}
              onChangeText={setInput}
              placeholder="Message the group…"
              placeholderTextColor={T.inkMuted}
              multiline
              maxLength={1000}
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity
              style={[s.sendBtn, (!input.trim() || sending) && s.sendBtnOff]}
              onPress={sendMessage}
              disabled={!input.trim() || sending}
              activeOpacity={0.82}
            >
              <Text style={[s.sendArrow, (!input.trim() || sending) && s.sendArrowOff]}>
                {sending ? '…' : '↑'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* ── MEMBERS MODAL (coach only) ───────────────────────────────── */}
      <Modal visible={showMembers} animationType="slide" presentationStyle="pageSheet">
        <View style={mo.root}>
          <View style={mo.header}>
            <Text style={mo.title}>Group Members</Text>
            <TouchableOpacity onPress={() => setShowMembers(false)} activeOpacity={0.75}>
              <Text style={mo.done}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={mo.scroll} showsVerticalScrollIndicator={false}>
            {members.length > 0 && (
              <Text style={mo.sectionLbl}>CURRENT MEMBERS</Text>
            )}
            {members.map(mem => (
              <View key={mem.id} style={mo.memberRow}>
                <Avatar name={`${mem.first_name} ${mem.last_name}`} size={40} />
                <View style={{ flex: 1 }}>
                  <Text style={mo.memberName}>{mem.first_name} {mem.last_name}</Text>
                  <Text style={mo.memberEmail}>{mem.email}</Text>
                </View>
                <TouchableOpacity
                  style={mo.removeBtn}
                  onPress={() => removeMember(mem)}
                  activeOpacity={0.75}
                >
                  <Text style={mo.removeTxt}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}

            <Text style={[mo.sectionLbl, { marginTop: members.length > 0 ? 28 : 0 }]}>
              ADD MEMBER
            </Text>
            <View style={mo.addRow}>
              <TextInput
                style={mo.addInput}
                value={addEmail}
                onChangeText={setAddEmail}
                placeholder="Email address"
                placeholderTextColor={T.inkMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[mo.addBtn, (!addEmail.trim() || addingMember) && mo.addBtnOff]}
                onPress={addMember}
                disabled={!addEmail.trim() || addingMember}
                activeOpacity={0.82}
              >
                <Text style={mo.addBtnTxt}>{addingMember ? '…' : 'Add'}</Text>
              </TouchableOpacity>
            </View>

            {members.length === 0 && (
              <Text style={mo.noMembers}>No members yet — add someone above</Text>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGE BUBBLE STYLES
// ─────────────────────────────────────────────────────────────────────────────
const mb = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 10 },
  rowMe:  { flexDirection: 'row-reverse' },
  wrap:   { maxWidth: SW * 0.72, gap: 3 },
  wrapMe: { alignItems: 'flex-end' },

  sender: {
    fontSize: 11, fontWeight: '600',
    color: T.inkMuted, marginLeft: 2, marginBottom: 2,
  },
  senderCoach: { color: T.sage },

  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleThem: {
    backgroundColor: T.cardCream,
    borderWidth: 1, borderColor: T.border,
    borderBottomLeftRadius: 4,
  },
  bubbleCoach: {
    backgroundColor: T.sageLight,
    borderWidth: 1, borderColor: T.sageBorder,
    borderBottomLeftRadius: 4,
  },
  bubbleMe: {
    backgroundColor: T.cardForest,
    borderBottomRightRadius: 4,
  },

  text:   { fontSize: 15, color: T.inkDark, lineHeight: 21 },
  textMe: { color: T.inkOnDark },

  meta:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 4 },
  metaMe: { flexDirection: 'row-reverse', marginLeft: 0, marginRight: 4 },
  time:   { fontSize: 10, color: T.inkMuted },
  del:    { fontSize: 10, color: 'rgba(140,59,59,0.45)' },
});

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN STYLES
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.pageBg },
  safe: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingTop: 12, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: T.border,
    backgroundColor: T.pageBg, gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: T.cardCream,
    borderWidth: 1, borderColor: T.border,
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow:    { fontSize: 17, color: T.inkMid },
  headerCenter: { flex: 1 },
  headerTitle:  { fontSize: 16, fontWeight: '600', color: T.inkDark, letterSpacing: -0.1 },
  headerSub:    { fontSize: 11, color: T.inkMuted, marginTop: 1 },
  membersBtn: {
    backgroundColor: T.sageLight, borderWidth: 1, borderColor: T.sageBorder,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
  },
  membersBtnTxt: { fontSize: 12, fontWeight: '600', color: T.sage },

  loadWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:     { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },

  empty: { flex: 1, alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: T.inkDark },
  emptySub:   { fontSize: 14, color: T.inkMuted },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    borderTopWidth: 1, borderTopColor: T.border,
    backgroundColor: T.pageBg,
  },
  input: {
    flex: 1, backgroundColor: T.cardCream,
    borderRadius: 22, borderWidth: 1, borderColor: T.border,
    paddingHorizontal: 18, paddingVertical: 11,
    fontSize: 15, color: T.inkDark, maxHeight: 110,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: T.cardForest,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnOff: { backgroundColor: T.cardTan },
  sendArrow:    { fontSize: 18, color: T.inkOnDark, fontWeight: '700' },
  sendArrowOff: { color: T.inkMuted },
});

// ─────────────────────────────────────────────────────────────────────────────
// MODAL STYLES
// ─────────────────────────────────────────────────────────────────────────────
const mo = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.pageBg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 22, paddingTop: 60, paddingBottom: 20,
    borderBottomWidth: 1, borderBottomColor: T.border,
    backgroundColor: T.pageBg,
  },
  title: { fontSize: 20, fontWeight: '600', color: T.inkDark, letterSpacing: -0.3 },
  done:  { fontSize: 15, fontWeight: '600', color: T.sage },
  scroll: { padding: 20 },

  sectionLbl: {
    fontSize: 9, fontWeight: '700', letterSpacing: 1.5,
    textTransform: 'uppercase', color: T.inkMuted, marginBottom: 12,
  },

  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: T.cardCream,
    borderRadius: 16, borderWidth: 1, borderColor: T.border,
    padding: 14, marginBottom: 10,
  },
  memberName:  { fontSize: 15, fontWeight: '600', color: T.inkDark },
  memberEmail: { fontSize: 12, color: T.inkMuted, marginTop: 2 },
  removeBtn: {
    backgroundColor: 'rgba(140,59,59,0.08)',
    borderWidth: 1, borderColor: 'rgba(140,59,59,0.18)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
  },
  removeTxt: { fontSize: 12, fontWeight: '600', color: T.low },

  addRow:   { flexDirection: 'row', gap: 10 },
  addInput: {
    flex: 1, backgroundColor: T.cardCream,
    borderRadius: 14, borderWidth: 1, borderColor: T.border,
    paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 14, color: T.inkDark,
  },
  addBtn: {
    backgroundColor: T.cardForest,
    paddingHorizontal: 18, paddingVertical: 12,
    borderRadius: 14, justifyContent: 'center',
  },
  addBtnOff: { backgroundColor: T.cardTan },
  addBtnTxt: { fontSize: 14, fontWeight: '600', color: T.inkOnDark },
  noMembers: { textAlign: 'center', color: T.inkMuted, marginTop: 40, fontSize: 14 },
});