// mobile-app/src/screens/MessagingScreen.tsx
// Upgraded UI — forest dark glassmorphism
// ALL logic, polling, file attachment, conversation modes preserved

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';
import { messageService, Message } from '../services/message.service';
import { conversationService } from '../services/conversation.service';
import { useAuthStore } from '../stores/authStore';

type NavProp   = NativeStackNavigationProp<RootStackParamList, 'Messaging'>;
type RouteP    = RouteProp<RootStackParamList, 'Messaging'>;
const { width: SW } = Dimensions.get('window');

interface AttachedFile {
  uri: string;
  name: string;
  type: string;
  size: number;
}

// ── Tokens ─────────────────────────────────────────────────────────────────────
const T = {
  bgDeep:        '#0F1C12',
  bgMid:         '#162019',
  glass:         'rgba(255,255,255,0.06)',
  glassMid:      'rgba(255,255,255,0.09)',
  glassBorder:   'rgba(255,255,255,0.10)',
  glassBorderHi: 'rgba(255,255,255,0.18)',
  sage:          '#7A9B7E',
  sageDeep:      '#3D5540',
  gold:          '#C9A96E',
  textPrimary:   '#F0EDE6',
  textSecondary: 'rgba(240,237,230,0.55)',
  textMuted:     'rgba(240,237,230,0.30)',
} as const;

// ── Relative time ──────────────────────────────────────────────────────────────
function relTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 24)  return `${hrs}h ago`;
  return new Date(ts).toLocaleDateString();
}

export default function MessagingScreen({ navigation, route }: { navigation: NavProp; route: RouteP }) {
  const { userId, userName, conversationId } = route.params;
  const { user } = useAuthStore();

  const [messages,          setMessages]          = useState<Message[]>([]);
  const [newMessage,        setNewMessage]        = useState('');
  const [isLoading,         setIsLoading]         = useState(true);
  const [isSending,         setIsSending]         = useState(false);
  const [attachedFile,      setAttachedFile]      = useState<AttachedFile | null>(null);
  const [showAttachMenu,    setShowAttachMenu]    = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const isConvMode = !!conversationId;

  useEffect(() => {
    loadMessages();
    if (isConvMode && conversationId) conversationService.markAsRead(conversationId);
    else if (userId) messageService.markAsRead(userId);
    const iv = setInterval(loadMessages, 5000);
    return () => clearInterval(iv);
  }, [conversationId, userId]);

  useEffect(() => {
    (async () => {
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    })();
  }, []);

  const loadMessages = async () => {
    try {
      let data: Message[] = [];
      if (isConvMode && conversationId) {
        data = await conversationService.getMessages(conversationId) as any;
      } else if (userId) {
        data = await messageService.getMessages(userId);
      }
      setMessages(data);
      setIsLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err) {
      console.error('loadMessages:', err);
      setIsLoading(false);
    }
  };

  const handlePickImage = async () => {
    setShowAttachMenu(false);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      setAttachedFile({ uri: a.uri, name: a.fileName || 'image.jpg', type: 'image', size: a.fileSize || 0 });
    }
  };

  const handleTakePhoto = async () => {
    setShowAttachMenu(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Camera permission required'); return; }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      setAttachedFile({ uri: a.uri, name: `photo_${Date.now()}.jpg`, type: 'image', size: a.fileSize || 0 });
    }
  };

  const handlePickDocument = async () => {
    setShowAttachMenu(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.length) {
        const a = result.assets[0];
        setAttachedFile({ uri: a.uri, name: a.name, type: 'document', size: a.size || 0 });
      }
    } catch { Alert.alert('Error', 'Failed to select document'); }
  };

  const handleSend = async () => {
    if ((!newMessage.trim() && !attachedFile) || isSending) return;
    setIsSending(true);
    try {
      let text = newMessage.trim();
      if (attachedFile) text += `\n[Attachment: ${attachedFile.name}]`;
      let msg;
      if (isConvMode && conversationId) {
        msg = await conversationService.sendMessage(conversationId, text) as any;
      } else if (userId) {
        msg = await messageService.sendMessage(userId, text);
      }
      if (msg) setMessages(prev => [...prev, msg]);
      setNewMessage('');
      setAttachedFile(null);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch { Alert.alert('Error', 'Failed to send message'); }
    finally { setIsSending(false); }
  };

  const initials = userName.split(' ').map((w: string) => w[0] ?? '').slice(0, 2).join('').toUpperCase();
  const hue = ((userName.charCodeAt(0) ?? 65) * 41) % 360;

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: T.bgDeep, alignItems: 'center', justifyContent: 'center' }}>
        <LinearGradient colors={[T.bgDeep, T.bgMid]} style={StyleSheet.absoluteFillObject} />
        <ActivityIndicator color={T.sage} size="large" />
      </View>
    );
  }

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

          {/* Avatar */}
          <View style={[s.headerAvatar, { backgroundColor: `hsla(${hue},22%,26%,1)` }]}>
            <Text style={[s.headerAvatarTxt, { color: `hsl(${hue},38%,74%)` }]}>{initials}</Text>
          </View>

          <View style={s.headerInfo}>
            <Text style={s.headerName}>{userName}</Text>
            <Text style={s.headerSub}>Direct message</Text>
          </View>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          {/* ── MESSAGES ────────────────────────────────────────────── */}
          <ScrollView
            ref={scrollRef}
            style={s.scroll}
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 ? (
              <View style={s.empty}>
                <Text style={s.emptyEmoji}>✉</Text>
                <Text style={s.emptyTitle}>No messages yet</Text>
                <Text style={s.emptySub}>Start the conversation</Text>
              </View>
            ) : (
              messages.map((msg, i) => {
                const isMe = msg.sender_id === user?.id;
                const prev = messages[i - 1];
                const sameAsPrev = prev && prev.sender_id === msg.sender_id;
                return (
                  <View
                    key={msg.id || i}
                    style={[
                      s.msgRow,
                      isMe ? s.msgRowMe : s.msgRowThem,
                      sameAsPrev && { marginTop: 3 },
                    ]}
                  >
                    <View style={[s.bubble, isMe ? s.bubbleMe : s.bubbleThem]}>
                      <Text style={[s.bubbleTxt, isMe && s.bubbleTxtMe]}>
                        {msg.message}
                      </Text>
                      <Text style={[s.bubbleTime, isMe && s.bubbleTimeMe]}>
                        {relTime(msg.created_at)}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* ── ATTACHMENT PREVIEW ──────────────────────────────────── */}
          {attachedFile && (
            <View style={s.attachPreview}>
              {attachedFile.type === 'image' ? (
                <Image source={{ uri: attachedFile.uri }} style={s.attachImg} />
              ) : (
                <View style={s.attachDocIcon}><Text style={s.attachDocTxt}>DOC</Text></View>
              )}
              <Text style={s.attachName} numberOfLines={1}>{attachedFile.name}</Text>
              <TouchableOpacity onPress={() => setAttachedFile(null)} style={s.attachRemove}>
                <Text style={{ color: T.textMuted, fontSize: 14 }}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── ATTACH MENU ─────────────────────────────────────────── */}
          {showAttachMenu && (
            <View style={s.attachMenu}>
              {[
                { label: '📷  Take Photo',     fn: handleTakePhoto },
                { label: '🖼   Choose Photo',   fn: handlePickImage },
                { label: '📄  Choose Document', fn: handlePickDocument },
              ].map(item => (
                <TouchableOpacity key={item.label} style={s.attachMenuItem} onPress={item.fn} activeOpacity={0.75}>
                  <Text style={s.attachMenuTxt}>{item.label}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={[s.attachMenuItem, s.attachMenuCancel]}
                onPress={() => setShowAttachMenu(false)} activeOpacity={0.75}>
                <Text style={[s.attachMenuTxt, { color: T.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── INPUT BAR ───────────────────────────────────────────── */}
          <View style={s.inputBar}>
            <TouchableOpacity
              style={s.attachBtn}
              onPress={() => setShowAttachMenu(v => !v)}
              activeOpacity={0.75}
            >
              <Text style={s.attachBtnTxt}>＋</Text>
            </TouchableOpacity>
            <TextInput
              style={s.input}
              placeholder="Type a message…"
              placeholderTextColor={T.textMuted}
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[s.sendBtn, ((!newMessage.trim() && !attachedFile) || isSending) && s.sendBtnOff]}
              onPress={handleSend}
              disabled={(!newMessage.trim() && !attachedFile) || isSending}
              activeOpacity={0.82}
            >
              <Text style={s.sendTxt}>{isSending ? '…' : '↑'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

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
  backBtn:        { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backArrow:      { fontSize: 22, color: T.textSecondary },
  headerAvatar:   { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerAvatarTxt:{ fontSize: 13, fontWeight: '600' },
  headerInfo:     { flex: 1 },
  headerName:     { fontSize: 16, fontWeight: '700', color: T.textPrimary, letterSpacing: 0.1 },
  headerSub:      { fontSize: 11, color: T.textMuted, marginTop: 1 },

  scroll:         { flex: 1 },
  scrollContent:  { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },

  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 10 },
  emptyEmoji: { fontSize: 40, color: T.textMuted },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: T.textPrimary },
  emptySub:   { fontSize: 14, color: T.textMuted },

  msgRow:      { marginBottom: 8, flexDirection: 'row' },
  msgRowMe:    { justifyContent: 'flex-end' },
  msgRowThem:  { justifyContent: 'flex-start' },

  bubble: {
    maxWidth: SW * 0.72, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, gap: 4,
  },
  bubbleMe:    { backgroundColor: T.sageDeep, borderBottomRightRadius: 4,
    borderWidth: 1, borderColor: 'rgba(122,155,126,0.25)' },
  bubbleThem:  { backgroundColor: T.glassMid, borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: T.glassBorder },
  bubbleTxt:   { fontSize: 15, color: T.textPrimary, lineHeight: 21 },
  bubbleTxtMe: { color: '#FFFFFF' },
  bubbleTime:  { fontSize: 10, color: T.textMuted, alignSelf: 'flex-end' },
  bubbleTimeMe:{ color: 'rgba(255,255,255,0.45)' },

  attachPreview: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginBottom: 8,
    backgroundColor: T.glass, borderRadius: 14,
    borderWidth: 1, borderColor: T.glassBorder, padding: 12,
  },
  attachImg:     { width: 44, height: 44, borderRadius: 8 },
  attachDocIcon: {
    width: 44, height: 44, borderRadius: 8,
    backgroundColor: 'rgba(201,169,110,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  attachDocTxt:  { fontSize: 10, fontWeight: '700', color: T.gold },
  attachName:    { flex: 1, fontSize: 13, color: T.textSecondary },
  attachRemove:  { padding: 4 },

  attachMenu: {
    backgroundColor: 'rgba(15,28,18,0.95)',
    borderTopWidth: 1, borderTopColor: T.glassBorder,
  },
  attachMenuItem: {
    paddingVertical: 15, paddingHorizontal: 22,
    borderBottomWidth: 1, borderBottomColor: T.glassBorder,
  },
  attachMenuCancel: { borderBottomWidth: 0 },
  attachMenuTxt:    { fontSize: 16, color: T.textSecondary, fontWeight: '500' },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    borderTopWidth: 1, borderTopColor: T.glassBorder,
    backgroundColor: 'rgba(15,28,18,0.75)',
  },
  attachBtn:    { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  attachBtnTxt: { fontSize: 26, color: T.textSecondary, lineHeight: 30 },
  input: {
    flex: 1, backgroundColor: T.glass,
    borderRadius: 22, borderWidth: 1, borderColor: T.glassBorder,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15, color: T.textPrimary, maxHeight: 100,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: T.sageDeep, borderWidth: 1, borderColor: 'rgba(122,155,126,0.30)',
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnOff: { backgroundColor: 'rgba(61,85,64,0.28)', borderColor: T.glassBorder },
  sendTxt:    { fontSize: 18, color: '#FFFFFF', fontWeight: '700' },
});