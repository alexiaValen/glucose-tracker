// mobile-app/src/screens/CoachDashboardScreen.tsx
// Refactored: calm, wellness-focused coach hub
// Layout: Header → Quick Actions → Client List → Community

import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useAuthStore } from '../stores/authStore';
import { useCoachStore } from '../stores/coachStore';
import type { ClientSummary } from '../services/coach.service';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

// ── Palette ────────────────────────────────────────────────────────────────────
const P = {
  bg:         '#F5F3EE',
  surface:    '#FFFFFF',
  forest:     '#3D5540',
  sage:       '#6B7F6E',
  sageLight:  'rgba(107,127,110,0.08)',
  sageBorder: 'rgba(107,127,110,0.15)',
  gold:       '#B89A5A',
  goldLight:  'rgba(184,154,90,0.10)',
  ink:        '#2A2D2A',
  inkMid:     '#5C605C',
  inkMuted:   '#9DA89D',
  border:     'rgba(212,214,212,0.4)',
  shadow:     '#1A251C',
} as const;

// ─── Initials Avatar ───────────────────────────────────────────────────────────
function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const initials = name.split(' ').map((w) => w[0] ?? '').slice(0, 2).join('').toUpperCase();
  const hue = ((name.charCodeAt(0) ?? 65) * 37 + (name.charCodeAt(1) ?? 0) * 13) % 360;
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: `hsl(${hue},28%,76%)`,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ fontSize: size * 0.36, fontWeight: '600', color: `hsl(${hue},35%,28%)` }}>
        {initials}
      </Text>
    </View>
  );
}

// ─── Client Row Card ───────────────────────────────────────────────────────────
function ClientCard({
  client, onPress, onMessage,
}: {
  client: ClientSummary;
  onPress: () => void;
  onMessage: () => void;
}) {
  const fullName    = `${client.firstName} ${client.lastName}`.trim();
  const lastReading = client.recentStats?.lastReading;
  const tir         = client.recentStats?.timeInRange;
  const glucoseColor =
    lastReading && lastReading < 70  ? '#C85A54' :
    lastReading && lastReading > 180 ? '#B89A5A' : P.sage;

  return (
    <TouchableOpacity style={cc.card} onPress={onPress} activeOpacity={0.82}>
      <Avatar name={fullName || client.email} size={46} />
      <View style={cc.info}>
        <Text style={cc.name}>{fullName || 'Client'}</Text>
        <Text style={cc.email} numberOfLines={1}>{client.email}</Text>
        {(lastReading || tir != null) ? (
          <View style={cc.pills}>
            {lastReading ? (
              <View style={cc.pill}>
                <View style={[cc.dot, { backgroundColor: glucoseColor }]} />
                <Text style={cc.pillText}>{lastReading} mg/dL</Text>
              </View>
            ) : null}
            {tir != null ? (
              <View style={cc.pill}>
                <Text style={cc.pillText}>{tir}% in range</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <Text style={cc.noData}>No recent data</Text>
        )}
      </View>
      <TouchableOpacity
        style={cc.msgBtn}
        onPress={onMessage}
        activeOpacity={0.75}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={{ fontSize: 16 }}>✉</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
const cc = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: P.surface, borderRadius: 18,
    paddingVertical: 14, paddingHorizontal: 16,
    marginBottom: 10, borderWidth: 1, borderColor: P.border,
    gap: 13,
    shadowColor: P.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  info:     { flex: 1 },
  name:     { fontSize: 15, fontWeight: '600', color: P.ink, letterSpacing: 0.1 },
  email:    { fontSize: 12, color: P.inkMuted, marginTop: 1 },
  pills:    { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  pill:     {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: P.sageLight, borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  dot:      { width: 5, height: 5, borderRadius: 3 },
  pillText: { fontSize: 11, fontWeight: '500', color: P.inkMid },
  noData:   { fontSize: 11, color: P.inkMuted, marginTop: 5, fontStyle: 'italic' },
  msgBtn:   {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: P.sageLight, borderWidth: 1, borderColor: P.sageBorder,
    alignItems: 'center', justifyContent: 'center',
  },
});

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function CoachDashboardScreen() {
  const navigation = useNavigation<NavProp>();
  const { user }   = useAuthStore();
  const { clients, isLoading, fetchClients } = useCoachStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchClients();
    setRefreshing(false);
  }, [fetchClients]);

  const firstName = user?.firstName ?? 'Coach';
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';

  const goToClient  = (id: string) => navigation.navigate('ClientDetail', { clientId: id });
  const goToMessage = (c: ClientSummary) =>
    navigation.navigate('Messaging', { userName: `${c.firstName} ${c.lastName}`.trim() || c.email });
  const goToConversations = () => navigation.navigate('Conversations');
  const goToNewLesson     = () => navigation.navigate('CreateLesson' as any, {});
  const goToAllLessons    = () => navigation.navigate('CoachLessons' as any);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={P.sage} />
        }
      >
        {/* ── HEADER ────────────────────────────────────────────────────── */}
        <View style={s.header}>
          <View>
            <Text style={s.greetSm}>{greet},</Text>
            <Text style={s.greetLg}>{firstName}</Text>
          </View>
          <TouchableOpacity style={s.iconBtn} onPress={goToConversations} activeOpacity={0.75}>
            <Text style={{ fontSize: 17 }}>✉</Text>
          </TouchableOpacity>
        </View>

        {/* ── QUICK ACTIONS ──────────────────────────────────────────────── */}
        <View style={s.quickRow}>
          <TouchableOpacity style={[s.quickCard, s.quickPrimary]} onPress={goToNewLesson} activeOpacity={0.85}>
            <Text style={s.quickEmoji}>＋</Text>
            <Text style={s.quickLabelLight}>New Lesson</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.quickCard} onPress={goToAllLessons} activeOpacity={0.85}>
            <Text style={s.quickEmoji}>📋</Text>
            <Text style={s.quickLabel}>All Lessons</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.quickCard} onPress={goToConversations} activeOpacity={0.85}>
            <Text style={s.quickEmoji}>💬</Text>
            <Text style={s.quickLabel}>Messages</Text>
          </TouchableOpacity>
        </View>

        {/* ── CLIENT LIST ────────────────────────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>
            {clients.length > 0 ? `${clients.length} CLIENT${clients.length !== 1 ? 'S' : ''}` : 'CLIENTS'}
          </Text>

          {isLoading && !refreshing ? (
            <View style={s.loadWrap}><ActivityIndicator color={P.sage} /></View>
          ) : clients.length === 0 ? (
            <View style={s.emptyCard}>
              <Text style={s.emptyEmoji}>🌱</Text>
              <Text style={s.emptyTitle}>No clients yet</Text>
              <Text style={s.emptyDesc}>Clients who join your program will appear here.</Text>
            </View>
          ) : (
            clients.map((c) => (
              <ClientCard
                key={c.id}
                client={c}
                onPress={() => goToClient(c.id)}
                onMessage={() => goToMessage(c)}
              />
            ))
          )}
        </View>

        {/* ── COMMUNITY ──────────────────────────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>COMMUNITY</Text>
          <TouchableOpacity style={s.communityCard} onPress={goToConversations} activeOpacity={0.82}>
            <View style={s.commIcon}><Text style={{ fontSize: 22 }}>💬</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.commTitle}>Group Chat</Text>
              <Text style={s.commDesc}>Message clients individually or together</Text>
            </View>
            <Text style={{ fontSize: 22, color: P.inkMuted }}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: P.bg },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: 22, paddingTop: 4 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', paddingTop: 20, paddingBottom: 28,
  },
  greetSm: { fontSize: 14, fontWeight: '400', color: P.inkMuted },
  greetLg: { fontSize: 28, fontWeight: '700', color: P.ink, letterSpacing: -0.5, marginTop: 2 },
  iconBtn: {
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: P.surface, borderWidth: 1, borderColor: P.border,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: P.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },

  quickRow:       { flexDirection: 'row', gap: 10, marginBottom: 32 },
  quickCard:      {
    flex: 1, alignItems: 'center',
    backgroundColor: P.surface, borderRadius: 16,
    paddingVertical: 16, borderWidth: 1, borderColor: P.border,
    gap: 6,
    shadowColor: P.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  quickPrimary:   { backgroundColor: P.forest, borderColor: P.forest },
  quickEmoji:     { fontSize: 18 },
  quickLabel:     { fontSize: 11, fontWeight: '600', color: P.inkMid, letterSpacing: 0.3 },
  quickLabelLight:{ fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.85)', letterSpacing: 0.3 },

  section:      { marginBottom: 28 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.3, color: P.inkMuted, marginBottom: 14 },

  loadWrap:   { paddingVertical: 32, alignItems: 'center' },
  emptyCard:  {
    backgroundColor: P.surface, borderRadius: 18,
    padding: 28, alignItems: 'center', borderWidth: 1, borderColor: P.border,
  },
  emptyEmoji: { fontSize: 32, marginBottom: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: P.ink, marginBottom: 6 },
  emptyDesc:  { fontSize: 13, color: P.inkMuted, textAlign: 'center', lineHeight: 19 },

  communityCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: P.surface, borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: P.border, gap: 14,
    shadowColor: P.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  commIcon:  {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: P.goldLight, alignItems: 'center', justifyContent: 'center',
  },
  commTitle: { fontSize: 15, fontWeight: '600', color: P.ink, letterSpacing: 0.1 },
  commDesc:  { fontSize: 12, color: P.inkMuted, marginTop: 2, lineHeight: 17 },
});