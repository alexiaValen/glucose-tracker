// mobile-app/src/screens/GroupEventsScreen.tsx
// REFACTORED: Matches dashboard design system — cream/sage/forest palette.
// Default export fixed. ALL logic preserved exactly.

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';
import { api } from '../config/api';

type Nav   = NativeStackNavigationProp<RootStackParamList, 'GroupEvents'>;
type Route = RouteProp<RootStackParamList, 'GroupEvents'>;
interface Props { navigation: Nav; route: Route; }

// ─────────────────────────────────────────────────────────────────────────────
// TYPES (preserved exactly)
// ─────────────────────────────────────────────────────────────────────────────
interface Session {
  id: string;
  title: string;
  description?: string;
  session_date: string;
  zoom_link?: string;
  recording_url?: string;
  week_number: number;
  status: 'upcoming' | 'live' | 'completed';
  materials?: string[];
  homework?: string;
  userProgress?: { completed: boolean; homework_submitted: boolean } | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  pageBg:     '#F0EBE0',
  cardCream:  '#F8F4EC',
  cardSage:   '#E2E8DF',
  cardForest: '#2C4435',
  cardTan:    '#DDD3C0',
  inkDark:    '#1C1E1A',
  inkMid:     '#484B44',
  inkMuted:   '#8A8E83',
  inkOnDark:  '#EDE9E1',
  forest:     '#2C4435',
  sage:       '#4D6B54',
  sageLight:  'rgba(77,107,84,0.10)',
  sageBorder: 'rgba(77,107,84,0.22)',
  gold:       '#8C6E3C',
  goldLight:  'rgba(140,110,60,0.10)',
  ok:         '#3B5E40',
  okLight:    'rgba(59,94,64,0.10)',
  border:     'rgba(28,30,26,0.09)',
  shadow:     '#18201A',
} as const;

const STATUS_CONFIG = {
  upcoming:  { label: 'Upcoming',   color: T.gold,    bg: T.goldLight },
  live:      { label: '● Live Now', color: T.ok,      bg: T.okLight   },
  completed: { label: 'Completed',  color: T.inkMuted, bg: 'rgba(28,30,26,0.05)' },
};

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function GroupEventsScreen({ navigation, route }: Props) {
  const { groupId, groupName, isCoach } = route.params;

  const [sessions,       setSessions]       = useState<Session[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [refreshing,     setRefreshing]     = useState(false);
  const [rsvpingId,      setRsvpingId]      = useState<string | null>(null);
  const [showCreate,     setShowCreate]     = useState(false);

  // Create form state
  const [newTitle,       setNewTitle]       = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDate,        setNewDate]        = useState('');
  const [newZoom,        setNewZoom]        = useState('');
  const [newHomework,    setNewHomework]    = useState('');
  const [creating,       setCreating]       = useState(false);

  const load = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await api.get(`/groups/${groupId}/sessions`);
      setSessions(res.data?.sessions ?? []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [groupId]);

  useEffect(() => { load(); }, [load]);

  // Logic preserved exactly
  const handleRsvp = async (sessionId: string) => {
    setRsvpingId(sessionId);
    try {
      await api.post(`/groups/${groupId}/sessions/${sessionId}/rsvp`);
      setSessions(prev =>
        prev.map(s => s.id === sessionId
          ? { ...s, userProgress: { completed: false, homework_submitted: false } }
          : s
        )
      );
    } catch {
      Alert.alert('Error', 'Could not RSVP. Please try again.');
    } finally {
      setRsvpingId(null);
    }
  };

  const handleCreateSession = async () => {
    if (!newTitle.trim() || !newDate.trim()) {
      Alert.alert('Required', 'Please add a title and date.');
      return;
    }
    setCreating(true);
    try {
      await api.post(`/groups/${groupId}/sessions`, {
        title:        newTitle.trim(),
        description:  newDescription.trim(),
        session_date: new Date(newDate).toISOString(),
        zoom_link:    newZoom.trim(),
        homework:     newHomework.trim(),
        week_number:  sessions.length + 1,
      });
      setShowCreate(false);
      setNewTitle(''); setNewDescription('');
      setNewDate('');  setNewZoom(''); setNewHomework('');
      await load();
    } catch {
      Alert.alert('Error', 'Failed to create session.');
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', {
      weekday: 'long', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });

  return (
    <View style={s.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
            <Text style={s.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.headerLabel}>GROUP EVENTS</Text>
            <Text style={s.headerTitle} numberOfLines={1}>{groupName}</Text>
          </View>
          {isCoach && (
            <TouchableOpacity style={s.newBtn} onPress={() => setShowCreate(true)} activeOpacity={0.85}>
              <Text style={s.newBtnTxt}>+ Event</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color={T.sage} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={s.content}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={T.sage} />
            }
            showsVerticalScrollIndicator={false}
          >
            {sessions.length === 0 ? (
              <View style={s.emptyState}>
                <Text style={s.emptyEmoji}>📅</Text>
                <Text style={s.emptyTitle}>No events scheduled</Text>
                <Text style={s.emptyBody}>
                  {isCoach
                    ? 'Create your first group event or live session above.'
                    : "Your coach hasn't scheduled any events yet. Check back soon."}
                </Text>
              </View>
            ) : (
              sessions.map(session => {
                const cfg      = STATUS_CONFIG[session.status] ?? STATUS_CONFIG.upcoming;
                const hasRsvp  = !!session.userProgress;
                const upcoming = new Date(session.session_date) > new Date();

                return (
                  <View key={session.id} style={s.eventCard}>
                    <View style={s.eventTopRow}>
                      <View style={[s.statusPill, { backgroundColor: cfg.bg }]}>
                        <Text style={[s.statusTxt, { color: cfg.color }]}>{cfg.label}</Text>
                      </View>
                      <Text style={s.weekLbl}>Week {session.week_number}</Text>
                    </View>

                    <Text style={s.eventTitle}>{session.title}</Text>

                    <View style={s.dateRow}>
                      <Text style={{ fontSize: 12 }}>📅</Text>
                      <Text style={s.dateText}>{formatDate(session.session_date)}</Text>
                    </View>

                    {session.description ? (
                      <Text style={s.eventDesc}>{session.description}</Text>
                    ) : null}

                    {session.zoom_link ? (
                      <View style={s.linkRow}>
                        <Text style={{ fontSize: 12 }}>📹</Text>
                        <Text style={s.linkTxt} numberOfLines={1}>{session.zoom_link}</Text>
                      </View>
                    ) : null}

                    {session.recording_url && session.status === 'completed' ? (
                      <View style={s.linkRow}>
                        <Text style={{ fontSize: 12 }}>▶️</Text>
                        <Text style={s.linkTxt}>Recording available</Text>
                      </View>
                    ) : null}

                    {session.homework ? (
                      <View style={s.homeworkCard}>
                        <Text style={s.homeworkLabel}>HOMEWORK</Text>
                        <Text style={s.homeworkTxt}>{session.homework}</Text>
                      </View>
                    ) : null}

                    {!isCoach && upcoming && (
                      <TouchableOpacity
                        style={[s.rsvpBtn, hasRsvp && s.rsvpBtnDone]}
                        onPress={() => !hasRsvp && handleRsvp(session.id)}
                        disabled={hasRsvp || rsvpingId === session.id}
                        activeOpacity={0.82}
                      >
                        {rsvpingId === session.id
                          ? <ActivityIndicator size="small" color={hasRsvp ? T.sage : T.inkOnDark} />
                          : <Text style={[s.rsvpBtnTxt, hasRsvp && s.rsvpBtnTxtDone]}>
                              {hasRsvp ? "✓ RSVP'd" : "I'll be there"}
                            </Text>
                        }
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
            <View style={{ height: 60 }} />
          </ScrollView>
        )}
      </SafeAreaView>

      {/* Create session modal (coach only) */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ width: '100%' }}
          >
            <View style={s.modalSheet}>
              <View style={s.modalHandle} />
              <Text style={s.modalTitle}>New Group Event</Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                {[
                  { label: 'TITLE',                  value: newTitle,       onChange: setNewTitle,       placeholder: 'e.g. Week 4 Live Q&A',    multi: false, cap: 'sentences'  },
                  { label: 'DATE & TIME',             value: newDate,        onChange: setNewDate,        placeholder: '2025-02-12 18:00',        multi: false, cap: 'none'       },
                  { label: 'ZOOM / MEETING LINK',     value: newZoom,        onChange: setNewZoom,        placeholder: 'https://zoom.us/j/...',   multi: false, cap: 'none'       },
                  { label: 'SESSION NOTES',           value: newDescription, onChange: setNewDescription, placeholder: 'What will we cover...',   multi: true,  cap: 'sentences'  },
                  { label: 'HOMEWORK (OPTIONAL)',     value: newHomework,    onChange: setNewHomework,    placeholder: 'Homework or prep work...', multi: true,  cap: 'sentences' },
                ].map(field => (
                  <View key={field.label} style={s.modalField}>
                    <Text style={s.modalFieldLabel}>{field.label}</Text>
                    <TextInput
                      style={[s.modalInput, field.multi && { minHeight: 90 }]}
                      value={field.value}
                      onChangeText={field.onChange}
                      placeholder={field.placeholder}
                      placeholderTextColor={T.inkMuted}
                      multiline={field.multi}
                      textAlignVertical={field.multi ? 'top' : 'center'}
                      autoCapitalize={field.cap as any}
                    />
                  </View>
                ))}

                <View style={s.modalActions}>
                  <TouchableOpacity
                    style={s.modalCancelBtn}
                    onPress={() => setShowCreate(false)}
                    activeOpacity={0.8}
                  >
                    <Text style={s.modalCancelTxt}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.modalSaveBtn, creating && { opacity: 0.5 }]}
                    onPress={handleCreateSession}
                    disabled={creating}
                    activeOpacity={0.85}
                  >
                    {creating
                      ? <ActivityIndicator size="small" color={T.inkOnDark} />
                      : <Text style={s.modalSaveTxt}>Create Event</Text>
                    }
                  </TouchableOpacity>
                </View>
                <View style={{ height: 40 }} />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: T.pageBg },
  header:  {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: T.border,
    backgroundColor: T.pageBg, gap: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: T.cardCream,
    borderWidth: 1, borderColor: T.border,
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow:   { fontSize: 17, color: T.inkMid },
  headerLabel: {
    fontSize: 9, fontWeight: '700', letterSpacing: 1.5,
    textTransform: 'uppercase', color: T.inkMuted, marginBottom: 2,
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: T.inkDark, letterSpacing: -0.2 },
  newBtn: {
    backgroundColor: T.cardForest,
    paddingVertical: 9, paddingHorizontal: 14, borderRadius: 10,
  },
  newBtnTxt: { fontSize: 13, fontWeight: '600', color: T.inkOnDark },

  center:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 20, paddingTop: 24 },

  emptyState: { alignItems: 'center', paddingTop: 72, paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 40, marginBottom: 14 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: T.inkDark, marginBottom: 8 },
  emptyBody:  { fontSize: 14, color: T.inkMuted, textAlign: 'center', lineHeight: 21 },

  eventCard: {
    backgroundColor: T.cardCream,
    borderRadius: 18, borderWidth: 1, borderColor: T.border,
    padding: 18, marginBottom: 14,
    shadowColor: T.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  eventTopRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 10,
  },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusTxt:  { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
  weekLbl:    { fontSize: 11, color: T.inkMuted, fontWeight: '600' },

  eventTitle: {
    fontSize: 17, fontWeight: '600', color: T.inkDark,
    letterSpacing: -0.2, marginBottom: 8, fontStyle: 'italic',
  },
  dateRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  dateText: { fontSize: 13, color: T.gold, fontWeight: '500' },

  eventDesc: { fontSize: 14, color: T.inkMid, lineHeight: 21, marginBottom: 10 },

  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  linkTxt: { fontSize: 13, color: T.sage, flex: 1 },

  homeworkCard: {
    backgroundColor: T.goldLight,
    borderWidth: 1, borderColor: 'rgba(140,110,60,0.18)',
    borderRadius: 10, padding: 12, marginTop: 4, marginBottom: 12,
  },
  homeworkLabel: {
    fontSize: 9, fontWeight: '700', letterSpacing: 1.2,
    color: T.gold, marginBottom: 5,
  },
  homeworkTxt: { fontSize: 13, color: T.inkMid, lineHeight: 20 },

  rsvpBtn: {
    marginTop: 8, backgroundColor: T.cardForest,
    paddingVertical: 12, borderRadius: 12, alignItems: 'center',
  },
  rsvpBtnDone:    { backgroundColor: T.sageLight, borderWidth: 1, borderColor: T.sageBorder },
  rsvpBtnTxt:     { fontSize: 14, fontWeight: '700', color: T.inkOnDark },
  rsvpBtnTxtDone: { color: T.sage },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,20,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: T.pageBg,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, borderColor: T.border,
    paddingTop: 12, paddingHorizontal: 20, maxHeight: '90%',
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: T.border, alignSelf: 'center', marginBottom: 20,
  },
  modalTitle: {
    fontSize: 19, fontWeight: '600', color: T.inkDark,
    marginBottom: 24, letterSpacing: -0.2, fontStyle: 'italic',
  },
  modalField:      { marginBottom: 18 },
  modalFieldLabel: {
    fontSize: 9, fontWeight: '700', letterSpacing: 1.5,
    textTransform: 'uppercase', color: T.inkMuted, marginBottom: 8,
  },
  modalInput: {
    backgroundColor: T.cardCream,
    borderRadius: 12, borderWidth: 1, borderColor: T.border,
    paddingVertical: 12, paddingHorizontal: 14,
    fontSize: 15, color: T.inkDark,
  },
  modalActions:   { flexDirection: 'row', gap: 10, marginTop: 8 },
  modalCancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: T.cardTan,
    borderWidth: 1, borderColor: T.border, alignItems: 'center',
  },
  modalCancelTxt: { fontSize: 14, fontWeight: '600', color: T.inkMid },
  modalSaveBtn: {
    flex: 2, paddingVertical: 14, borderRadius: 14,
    backgroundColor: T.cardForest, alignItems: 'center',
  },
  modalSaveTxt: { fontSize: 14, fontWeight: '700', color: T.inkOnDark },
});