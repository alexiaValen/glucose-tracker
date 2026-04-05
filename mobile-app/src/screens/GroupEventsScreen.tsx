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
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';
import { colors } from '../theme/colors';
import { api } from '../config/api';

type Nav = NativeStackNavigationProp<RootStackParamList, 'GroupEvents'>;
type Route = RouteProp<RootStackParamList, 'GroupEvents'>;
interface Props { navigation: Nav; route: Route }

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

const STATUS_CONFIG = {
  upcoming: { label: 'Upcoming', color: colors.gold, bg: 'rgba(214,199,161,0.12)' },
  live: { label: '● Live Now', color: '#4ADE80', bg: 'rgba(74,222,128,0.12)' },
  completed: { label: 'Completed', color: colors.textMuted, bg: 'rgba(245,243,238,0.06)' },
};

export default function GroupEventsScreen({ navigation, route }: Props) {
  const { groupId, groupName, isCoach } = route.params;

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rsvpingId, setRsvpingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // Create form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newZoom, setNewZoom] = useState('');
  const [newHomework, setNewHomework] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await api.get(`/groups/${groupId}/sessions`);
      setSessions(res.data?.sessions ?? []);
    } catch {
      // leave empty
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [groupId]);

  useEffect(() => { load(); }, [load]);

  const handleRsvp = async (sessionId: string) => {
    setRsvpingId(sessionId);
    try {
      await api.post(`/groups/${groupId}/sessions/${sessionId}/rsvp`);
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId ? { ...s, userProgress: { completed: false, homework_submitted: false } } : s
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
        title: newTitle.trim(),
        description: newDescription.trim(),
        session_date: new Date(newDate).toISOString(),
        zoom_link: newZoom.trim(),
        homework: newHomework.trim(),
        week_number: sessions.length + 1,
      });
      setShowCreate(false);
      setNewTitle(''); setNewDescription(''); setNewDate('');
      setNewZoom(''); setNewHomework('');
      await load();
    } catch {
      Alert.alert('Error', 'Failed to create session.');
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const isUpcoming = (iso: string) => new Date(iso) > new Date();

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerLabel}>GROUP EVENTS</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>{groupName}</Text>
        </View>
        {isCoach && (
          <TouchableOpacity style={styles.newBtn} onPress={() => setShowCreate(true)}>
            <Text style={styles.newBtnText}>+ Event</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.sage} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.sage} />
          }
          showsVerticalScrollIndicator={false}
        >
          {sessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📅</Text>
              <Text style={styles.emptyTitle}>No events scheduled</Text>
              <Text style={styles.emptyBody}>
                {isCoach
                  ? 'Create your first group event or live session above.'
                  : 'Your coach hasn\'t scheduled any events yet. Check back soon.'}
              </Text>
            </View>
          ) : (
            sessions.map((session) => {
              const cfg = STATUS_CONFIG[session.status] ?? STATUS_CONFIG.upcoming;
              const hasRsvp = !!session.userProgress;
              const upcoming = isUpcoming(session.session_date);

              return (
                <View key={session.id} style={styles.eventCard}>
                  {/* Top row */}
                  <View style={styles.eventTopRow}>
                    <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
                      <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                    <Text style={styles.weekLabel}>Week {session.week_number}</Text>
                  </View>

                  {/* Title */}
                  <Text style={styles.eventTitle}>{session.title}</Text>

                  {/* Date */}
                  <View style={styles.eventDateRow}>
                    <Text style={styles.calIcon}>📅</Text>
                    <Text style={styles.eventDate}>{formatDate(session.session_date)}</Text>
                  </View>

                  {/* Description */}
                  {session.description ? (
                    <Text style={styles.eventDesc}>{session.description}</Text>
                  ) : null}

                  {/* Zoom link */}
                  {session.zoom_link ? (
                    <View style={styles.zoomRow}>
                      <Text style={styles.zoomIcon}>📹</Text>
                      <Text style={styles.zoomText} numberOfLines={1}>{session.zoom_link}</Text>
                    </View>
                  ) : null}

                  {/* Recording */}
                  {session.recording_url && session.status === 'completed' ? (
                    <View style={styles.zoomRow}>
                      <Text style={styles.zoomIcon}>▶️</Text>
                      <Text style={styles.zoomText}>Recording available</Text>
                    </View>
                  ) : null}

                  {/* Homework */}
                  {session.homework ? (
                    <View style={styles.homeworkCard}>
                      <Text style={styles.homeworkLabel}>HOMEWORK</Text>
                      <Text style={styles.homeworkText}>{session.homework}</Text>
                    </View>
                  ) : null}

                  {/* RSVP (clients only, upcoming sessions) */}
                  {!isCoach && upcoming && (
                    <TouchableOpacity
                      style={[styles.rsvpBtn, hasRsvp && styles.rsvpBtnDone]}
                      onPress={() => !hasRsvp && handleRsvp(session.id)}
                      disabled={hasRsvp || rsvpingId === session.id}
                      activeOpacity={0.8}
                    >
                      {rsvpingId === session.id ? (
                        <ActivityIndicator size="small" color={hasRsvp ? colors.sage : colors.bg} />
                      ) : (
                        <Text style={[styles.rsvpBtnText, hasRsvp && styles.rsvpBtnTextDone]}>
                          {hasRsvp ? '✓ RSVP\'d' : 'I\'ll be there'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
      )}

      {/* Create Session Modal (Coach only) */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ width: '100%' }}
          >
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>New Group Event</Text>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalFieldGroup}>
                  <Text style={styles.modalFieldLabel}>TITLE</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={newTitle}
                    onChangeText={setNewTitle}
                    placeholder="e.g. Week 4 Live Q&A"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={styles.modalFieldGroup}>
                  <Text style={styles.modalFieldLabel}>DATE & TIME</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={newDate}
                    onChangeText={setNewDate}
                    placeholder="2025-02-12 18:00"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={styles.modalFieldGroup}>
                  <Text style={styles.modalFieldLabel}>ZOOM / MEETING LINK</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={newZoom}
                    onChangeText={setNewZoom}
                    placeholder="https://zoom.us/j/..."
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.modalFieldGroup}>
                  <Text style={styles.modalFieldLabel}>SESSION NOTES / DESCRIPTION</Text>
                  <TextInput
                    style={[styles.modalInput, { minHeight: 100 }]}
                    value={newDescription}
                    onChangeText={setNewDescription}
                    placeholder="What will we cover in this session..."
                    placeholderTextColor={colors.textMuted}
                    multiline
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.modalFieldGroup}>
                  <Text style={styles.modalFieldLabel}>HOMEWORK (OPTIONAL)</Text>
                  <TextInput
                    style={[styles.modalInput, { minHeight: 80 }]}
                    value={newHomework}
                    onChangeText={setNewHomework}
                    placeholder="Homework or prep work for this session..."
                    placeholderTextColor={colors.textMuted}
                    multiline
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setShowCreate(false)}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalSaveBtn, creating && { opacity: 0.5 }]}
                    onPress={handleCreateSession}
                    disabled={creating}
                  >
                    {creating ? (
                      <ActivityIndicator size="small" color={colors.bg} />
                    ) : (
                      <Text style={styles.modalSaveText}>Create Event</Text>
                    )}
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: { fontSize: 18, color: colors.textPrimary },
  headerLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: colors.textMuted,
    marginBottom: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  newBtn: {
    backgroundColor: colors.gold,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  newBtnText: { fontSize: 13, fontWeight: '700', color: colors.bg },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 24 },

  eventCard: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },
  eventTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  weekLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },

  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.2,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  eventDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  calIcon: { fontSize: 13 },
  eventDate: { fontSize: 13, color: colors.gold, fontWeight: '500' },

  eventDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
    marginBottom: 12,
  },

  zoomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  zoomIcon: { fontSize: 13 },
  zoomText: { fontSize: 13, color: colors.sage, flex: 1 },

  homeworkCard: {
    backgroundColor: 'rgba(214,199,161,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(214,199,161,0.15)',
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  homeworkLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: colors.gold,
    marginBottom: 5,
  },
  homeworkText: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },

  rsvpBtn: {
    marginTop: 8,
    backgroundColor: colors.gold,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  rsvpBtnDone: {
    backgroundColor: colors.glassSage,
    borderWidth: 1,
    borderColor: colors.glassBorderStrong,
  },
  rsvpBtnText: { fontSize: 14, fontWeight: '700', color: colors.bg, letterSpacing: 0.3 },
  rsvpBtnTextDone: { color: colors.sage },

  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyEmoji: { fontSize: 40, marginBottom: 16 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11,31,20,0.85)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#0F2A1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: colors.glassBorder,
    paddingTop: 12,
    paddingHorizontal: 20,
    maxHeight: '90%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.glassBorder,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 24,
    letterSpacing: -0.2,
    fontStyle: 'italic',
  },
  modalFieldGroup: { marginBottom: 18 },
  modalFieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: colors.textMuted,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.textPrimary,
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  modalSaveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.gold,
    alignItems: 'center',
  },
  modalSaveText: { fontSize: 14, fontWeight: '700', color: colors.bg },
});
