// mobile-app/src/screens/GroupChatScreen.tsx
// Upgraded UI — forest dark glassmorphism
// ALL logic, API calls, polling, member management preserved exactly

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
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../stores/authStore';

const API_BASE = process.env.EXPO_PUBLIC_API_URL;
const { width: SW } = Dimensions.get('window');

// ── Design tokens ──────────────────────────────────────────────────────────────
const T = {
  bgDeep:        '#0F1C12',
  bgMid:         '#162019',
  glass:         'rgba(255,255,255,0.06)',
  glassMid:      'rgba(255,255,255,0.09)',
  glassStrong:   'rgba(255,255,255,0.13)',
  glassBorder:   'rgba(255,255,255,0.10)',
  glassBorderHi: 'rgba(255,255,255,0.18)',
  sage:          '#7A9B7E',
  sageBright:    '#9ABD9E',
  sageDeep:      '#3D5540',
  sageGlow:      'rgba(122,155,126,0.20)',
  sageBubble:    'rgba(61,85,64,0.85)',
  gold:          '#C9A96E',
  goldGlow:      'rgba(201,169,110,0.18)',
  goldBorder:    'rgba(201,169,110,0.22)',
  textPrimary:   '#F0EDE6',
  textSecondary: 'rgba(240,237,230,0.55)',
  textMuted:     'rgba(240,237,230,0.30)',
  textOnSage:    '#FFFFFF',
  coachBorder:   'rgba(122,155,126,0.35)',
  errorRed:      '#E07070',
  inputBg:       'rgba(255,255,255,0.08)',
} as const;

// ── Types ──────────────────────────────────────────────────────────────────────
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

// ── Avatar ─────────────────────────────────────────────────────────────────────
function Avatar({ name, size = 34, isCoach = false }: { name: string; size?: number; isCoach?: boolean }) {
  const initials = name.split(' ').map(w => w[0] ?? '').slice(0, 2).join('').toUpperCase();
  const hue = ((name.charCodeAt(0) ?? 65) * 41 + (name.charCodeAt(1) ?? 0) * 17) % 360;
  if (isCoach) {
    return (
      <View style={{
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: 'rgba(122,155,126,0.28)',
        borderWidth: 1.5, borderColor: T.coachBorder,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ fontSize: size * 0.48 }}>🌿</Text>
      </View>
    );
  }
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: `hsla(${hue},22%,26%,1)`,
      borderWidth: 1, borderColor: `hsla(${hue},28%,42%,0.35)`,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ fontSize: size * 0.34, fontWeight: '600', color: `hsl(${hue},38%,74%)` }}>
        {initials}
      </Text>
    </View>
  );
}

// ── Relative time ──────────────────────────────────────────────────────────────
function relTime(iso: string): string {
  const d = new Date(iso), now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m`;
  if (hours < 24) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  if (days < 7)   return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function GroupChatScreen({ navigation, route }: { navigation: any; route: any }) {
  const { groupId, groupName } = route.params;
  const { user } = useAuthStore();

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
    } catch (err) {
      console.error('fetchMessages error:', err);
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
      console.error('fetchMembers error:', err);
    }
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
      if (!res.ok) {
        Alert.alert('Error', 'Failed to send message.');
        setInput(text);
        return;
      }
      const data = await res.json();
      if (data.message) {
        setMessages(prev => [...prev, data.message]);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
      }
    } catch {
      Alert.alert('Error', 'Failed to send message');
      setInput(text);
    } finally {
      setSending(false);
    }
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

  // ── Message bubble ───────────────────────────────────────────────────────────
  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMe        = item.sender_id === user?.id;
    const isCoachMsg  = !isMe && coachId && item.sender_id === coachId;
    const senderName  = item.sender
      ? `${item.sender.first_name} ${item.sender.last_name}`.trim()
      : 'Unknown';
    const canDelete   = isMe || isCoach;
    const prevMsg     = messages[index - 1];
    const sameAsPrev  = prevMsg && prevMsg.sender_id === item.sender_id;
    const text        = item.content || item.message || '';

    return (
      <View style={[m.row, isMe && m.rowMe, sameAsPrev && { marginTop: 3 }]}>
        {/* Avatar — only show when sender changes */}
        {!isMe && !sameAsPrev && (
          <Avatar name={senderName} size={30} isCoach={!!isCoachMsg} />
        )}
        {!isMe && !!sameAsPrev && <View style={{ width: 30 }} />}

        <View style={[m.bubbleWrap, isMe && m.bubbleWrapMe]}>
          {/* Sender name — only on first in group */}
          {!isMe && !sameAsPrev && (
            <Text style={[m.sender, isCoachMsg && m.senderCoach]}>
              {senderName}{isCoachMsg ? ' · Coach' : ''}
            </Text>
          )}

          <View style={[
            m.bubble,
            isMe ? m.bubbleMe : m.bubbleThem,
            isCoachMsg && m.bubbleCoach,
          ]}>
            <Text style={[m.text, isMe && m.textMe]}>{text}</Text>
          </View>

          <View style={[m.meta, isMe && m.metaMe]}>
            <Text style={m.time}>{relTime(item.created_at)}</Text>
            {canDelete && (
              <TouchableOpacity onPress={() => deleteMessage(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={m.del}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={s.root}>
      <LinearGradient
        colors={[T.bgDeep, T.bgMid, '#162819']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
      />

      <SafeAreaView style={s.safe} edges={['top']}>
        {/* ── HEADER ────────────────────────────────────────────────── */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.75}>
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
          keyboardVerticalOffset={0}
        >
          {/* ── MESSAGES ────────────────────────────────────────────── */}
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

          {/* ── INPUT BAR ───────────────────────────────────────────── */}
          <View style={s.inputBar}>
            <TextInput
              style={s.input}
              value={input}
              onChangeText={setInput}
              placeholder="Message the group…"
              placeholderTextColor={T.textMuted}
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
              <Text style={s.sendArrow}>{sending ? '…' : '↑'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* ── MEMBERS MODAL (coach only) ─────────────────────────────── */}
      <Modal visible={showMembers} animationType="slide" presentationStyle="pageSheet">
        <View style={mo.root}>
          <LinearGradient
            colors={[T.bgDeep, T.bgMid]}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={mo.header}>
            <Text style={mo.title}>Group Members</Text>
            <TouchableOpacity onPress={() => setShowMembers(false)} activeOpacity={0.75}>
              <Text style={mo.done}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={mo.scroll}>
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
                <TouchableOpacity style={mo.removeBtn} onPress={() => removeMember(mem)} activeOpacity={0.75}>
                  <Text style={mo.removeTxt}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}

            <Text style={[mo.sectionLbl, { marginTop: members.length > 0 ? 28 : 8 }]}>ADD MEMBER</Text>
            <View style={mo.addRow}>
              <TextInput
                style={mo.addInput}
                value={addEmail}
                onChangeText={setAddEmail}
                placeholder="Email address"
                placeholderTextColor={T.textMuted}
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
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ── Message styles ─────────────────────────────────────────────────────────────
const m = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 10 },
  rowMe:     { flexDirection: 'row-reverse' },
  bubbleWrap:   { maxWidth: SW * 0.72, gap: 3 },
  bubbleWrapMe: { alignItems: 'flex-end' },
  sender:      { fontSize: 11, fontWeight: '600', color: T.textMuted, marginLeft: 2, marginBottom: 2 },
  senderCoach: { color: T.sageBright },
  bubble:    {
    borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10,
  },
  bubbleThem:  {
    backgroundColor: T.glassMid,
    borderWidth: 1, borderColor: T.glassBorder,
    borderBottomLeftRadius: 4,
  },
  bubbleCoach: {
    backgroundColor: 'rgba(122,155,126,0.14)',
    borderColor: T.coachBorder,
    borderBottomLeftRadius: 4,
  },
  bubbleMe:  {
    backgroundColor: T.sageDeep,
    borderBottomRightRadius: 4,
    borderWidth: 1, borderColor: 'rgba(122,155,126,0.25)',
  },
  text:    { fontSize: 15, color: T.textPrimary, lineHeight: 21 },
  textMe:  { color: '#FFFFFF' },
  meta:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 4 },
  metaMe:  { flexDirection: 'row-reverse', marginLeft: 0, marginRight: 4 },
  time:    { fontSize: 10, color: T.textMuted },
  del:     { fontSize: 10, color: 'rgba(224,112,112,0.45)' },
});

// ── Screen styles ──────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:  { flex: 1 },
  safe:  { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingTop: 12, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: T.glassBorder,
    backgroundColor: 'rgba(15,28,18,0.6)',
    gap: 12,
  },
  backBtn:      { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backArrow:    { fontSize: 22, color: T.textSecondary },
  headerCenter: { flex: 1 },
  headerTitle:  { fontSize: 16, fontWeight: '700', color: T.textPrimary, letterSpacing: 0.1 },
  headerSub:    { fontSize: 11, color: T.textMuted, marginTop: 1 },
  membersBtn: {
    backgroundColor: 'rgba(122,155,126,0.14)',
    borderWidth: 1, borderColor: 'rgba(122,155,126,0.25)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
  },
  membersBtnTxt: { fontSize: 12, fontWeight: '600', color: T.sageBright },

  loadWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  list:  { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 10 },
  emptyEmoji: { fontSize: 44 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: T.textPrimary },
  emptySub:   { fontSize: 14, color: T.textMuted },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    borderTopWidth: 1, borderTopColor: T.glassBorder,
    backgroundColor: 'rgba(15,28,18,0.75)',
  },
  input: {
    flex: 1, backgroundColor: T.glass,
    borderRadius: 22, borderWidth: 1, borderColor: T.glassBorder,
    paddingHorizontal: 18, paddingVertical: 11,
    fontSize: 15, color: T.textPrimary, maxHeight: 110,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: T.sageDeep, borderWidth: 1, borderColor: 'rgba(122,155,126,0.30)',
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnOff: { backgroundColor: 'rgba(61,85,64,0.30)', borderColor: T.glassBorder },
  sendArrow: { fontSize: 18, color: '#FFFFFF', fontWeight: '700' },
});

// ── Modal styles ───────────────────────────────────────────────────────────────
const mo = StyleSheet.create({
  root:   { flex: 1, overflow: 'hidden' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 22, paddingTop: 60, paddingBottom: 20,
    borderBottomWidth: 1, borderBottomColor: T.glassBorder,
  },
  title:    { fontSize: 20, fontWeight: '700', color: T.textPrimary },
  done:     { fontSize: 16, fontWeight: '600', color: T.sageBright },
  scroll:   { padding: 20, paddingBottom: 48 },
  sectionLbl: {
    fontSize: 10, fontWeight: '700', letterSpacing: 2,
    color: T.textMuted, marginBottom: 12,
  },
  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: T.glass, borderRadius: 16,
    borderWidth: 1, borderColor: T.glassBorder,
    padding: 14, marginBottom: 10,
  },
  memberName:  { fontSize: 15, fontWeight: '600', color: T.textPrimary },
  memberEmail: { fontSize: 12, color: T.textMuted, marginTop: 2 },
  removeBtn:   {
    backgroundColor: 'rgba(224,112,112,0.10)',
    borderWidth: 1, borderColor: 'rgba(224,112,112,0.20)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
  },
  removeTxt: { fontSize: 12, fontWeight: '600', color: T.errorRed },
  addRow:    { flexDirection: 'row', gap: 10 },
  addInput:  {
    flex: 1, backgroundColor: T.glass,
    borderRadius: 14, borderWidth: 1, borderColor: T.glassBorder,
    paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 14, color: T.textPrimary,
  },
  addBtn:    {
    backgroundColor: T.sageDeep, paddingHorizontal: 18,
    paddingVertical: 12, borderRadius: 14, justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(122,155,126,0.28)',
  },
  addBtnOff: { backgroundColor: 'rgba(61,85,64,0.25)', borderColor: T.glassBorder },
  addBtnTxt: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  noMembers: { textAlign: 'center', color: T.textMuted, marginTop: 40, fontSize: 14 },
});