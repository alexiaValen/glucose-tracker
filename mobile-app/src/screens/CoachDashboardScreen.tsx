// mobile-app/src/screens/CoachDashboardScreen.tsx
// REFACTORED: Matches dashboard design system — cream/sage/forest palette.
// ALL logic / navigation / store calls preserved exactly.

import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useAuthStore }  from '../stores/authStore';
import { useCoachStore } from '../stores/coachStore';
import type { ClientSummary } from '../services/coach.service';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
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
  inkMutedDark: 'rgba(237,233,225,0.55)',

  forest:       '#2C4435',
  sage:         '#4D6B54',
  sageMid:      '#698870',
  sageLight:    'rgba(77,107,84,0.10)',
  sageBorder:   'rgba(77,107,84,0.22)',
  gold:         '#8C6E3C',
  goldLight:    'rgba(140,110,60,0.10)',
  goldBorder:   'rgba(140,110,60,0.22)',

  ok:           '#3B5E40',
  okBg:         'rgba(59,94,64,0.10)',
  low:          '#8C3B3B',
  lowBg:        'rgba(140,59,59,0.10)',
  high:         '#8C6E3C',

  border:       'rgba(28,30,26,0.09)',
  borderMid:    'rgba(28,30,26,0.15)',
  shadow:       '#18201A',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function gColor(v?: number): string {
  if (!v)      return T.inkMuted;
  if (v < 70)  return T.low;
  if (v > 180) return T.high;
  return T.ok;
}

// ─────────────────────────────────────────────────────────────────────────────
// AVATAR — light surface version matching cream palette
// ─────────────────────────────────────────────────────────────────────────────
function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(w => w[0] ?? '').slice(0, 2).join('').toUpperCase();
  const hue = ((name.charCodeAt(0) ?? 65) * 41 + (name.charCodeAt(1) ?? 0) * 17) % 360;
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: `hsla(${hue},22%,82%,1)`,
      borderWidth: 1, borderColor: `hsla(${hue},22%,68%,0.5)`,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{
        fontSize: size * 0.34, fontWeight: '700',
        color: `hsl(${hue},30%,28%)`,
      }}>
        {initials}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT CARD
// ─────────────────────────────────────────────────────────────────────────────
function ClientCard({
  client, onPress, onMessage,
}: {
  client: ClientSummary;
  onPress: () => void;
  onMessage: () => void;
}) {
  const full = `${client.firstName} ${client.lastName}`.trim();
  const last = client.recentStats?.lastReading;
  const tir  = client.recentStats?.timeInRange;
  const col  = gColor(last);

  return (
    <TouchableOpacity style={cc.root} onPress={onPress} activeOpacity={0.82}>
      <Avatar name={full || client.email} size={44} />

      <View style={cc.info}>
        <Text style={cc.name}>{full || 'Client'}</Text>
        <Text style={cc.email} numberOfLines={1}>{client.email}</Text>

        {(last || tir != null) ? (
          <View style={cc.pills}>
            {last ? (
              <View style={[cc.pill, { backgroundColor: `${col}12`, borderColor: `${col}28` }]}>
                <View style={[cc.dot, { backgroundColor: col }]} />
                <Text style={[cc.pillTxt, { color: col }]}>{last} mg/dL</Text>
              </View>
            ) : null}
            {tir != null ? (
              <View style={cc.pill}>
                <Text style={cc.pillTxt}>{tir}% in range</Text>
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
        <Text style={cc.msgIcon}>✉</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
const cc = StyleSheet.create({
  root: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: T.cardCream,
    borderRadius: 18, borderWidth: 1, borderColor: T.border,
    paddingVertical: 14, paddingHorizontal: 16,
    marginBottom: 10, gap: 13,
    shadowColor: T.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  info:    { flex: 1 },
  name:    { fontSize: 15, fontWeight: '600', color: T.inkDark, letterSpacing: 0.1 },
  email:   { fontSize: 12, color: T.inkMuted, marginTop: 2 },
  pills:   { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: T.cardSage, borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: T.border,
  },
  dot:     { width: 5, height: 5, borderRadius: 3 },
  pillTxt: { fontSize: 11, fontWeight: '500', color: T.inkMid },
  noData:  { fontSize: 11, color: T.inkMuted, marginTop: 5, fontStyle: 'italic' },
  msgBtn:  {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: T.cardSage,
    borderWidth: 1, borderColor: T.border,
    alignItems: 'center', justifyContent: 'center',
  },
  msgIcon: { fontSize: 14, color: T.inkMid },
});

// ─────────────────────────────────────────────────────────────────────────────
// QUICK ACTION CARD
// ─────────────────────────────────────────────────────────────────────────────
function QuickCard({
  emoji, label, onPress, primary, gold,
}: {
  emoji: string; label: string; onPress: () => void;
  primary?: boolean; gold?: boolean;
}) {
  const bg        = primary ? T.cardForest : gold ? T.cardTan : T.cardCream;
  const labelColor = primary ? T.inkOnDark : gold ? T.gold : T.inkMid;
  const emojiSize = 18;

  return (
    <TouchableOpacity
      style={[qc.root, { backgroundColor: bg }]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      <Text style={{ fontSize: emojiSize }}>{emoji}</Text>
      <Text style={[qc.label, { color: labelColor }]}>{label}</Text>
    </TouchableOpacity>
  );
}
const qc = StyleSheet.create({
  root: {
    flex: 1, alignItems: 'center',
    borderRadius: 16, paddingVertical: 18,
    borderWidth: 1, borderColor: T.border,
    gap: 6, overflow: 'hidden',
    shadowColor: T.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  label: { fontSize: 10, fontWeight: '600', letterSpacing: 0.4 },
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION LABEL
// ─────────────────────────────────────────────────────────────────────────────
function SectionLabel({ text }: { text: string }) {
  return <Text style={sl.txt}>{text}</Text>;
}
const sl = StyleSheet.create({
  txt: {
    fontSize: 9, fontWeight: '700',
    letterSpacing: 1.5, textTransform: 'uppercase',
    color: T.inkMuted, marginBottom: 12,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function CoachDashboardScreen() {
  const navigation = useNavigation<NavProp>();
  const { user, logout } = useAuthStore();
  const { clients, isLoading, fetchClients } = useCoachStore();
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    fetchClients();
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [fetchClients]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchClients();
    setRefreshing(false);
  }, [fetchClients]);

  // Derived — all preserved
  const firstName = user?.firstName ?? 'Coach';
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning,' : h < 17 ? 'Good afternoon,' : 'Good evening,';

  // Nav — all unchanged
  const goToClient        = (id: string)       => navigation.navigate('ClientDetail', { clientId: id });
  const goToMsg           = (c: ClientSummary) => navigation.navigate('Messaging', {
    userName: `${c.firstName} ${c.lastName}`.trim() || c.email,
  });
  const goToConversations = () => navigation.navigate('Conversations');
  const goToNewLesson     = () => navigation.navigate('CreateLesson' as any, {});
  const goToAllLessons    = () => navigation.navigate('CoachLessons' as any);

  const confirmLogout = () =>
    Alert.alert("Sign out?", "You'll need to log in again.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: logout },
    ]);

  return (
    <View style={s.root}>
      <SafeAreaView style={s.safe} edges={['top']}>
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.sage} />
          }
        >
          <Animated.View style={{ opacity: fadeAnim }}>

            {/* ── HEADER ────────────────────────────────────────────── */}
            <View style={s.header}>
              <View>
                <Text style={s.greetSm}>{greet}</Text>
                <Text style={s.greetLg}>{firstName}</Text>
              </View>
              <TouchableOpacity
                style={s.iconBtn}
                onPress={goToConversations}
                activeOpacity={0.75}
              >
                <Text style={s.iconBtnTxt}>✉</Text>
              </TouchableOpacity>
            </View>

            {/* ── QUICK ACTIONS ─────────────────────────────────────── */}
            <View style={s.quickRow}>
              <QuickCard emoji="＋" label="New Lesson" onPress={goToNewLesson} primary />
              <QuickCard emoji="📋" label="All Lessons" onPress={goToAllLessons} />
              <QuickCard emoji="💬" label="Messages"   onPress={goToConversations} />
            </View>

            {/* ── CLIENTS ───────────────────────────────────────────── */}
            <View style={s.section}>
              <SectionLabel
                text={clients.length > 0
                  ? `${clients.length} Client${clients.length !== 1 ? 's' : ''}`
                  : 'Clients'}
              />

              {isLoading && !refreshing ? (
                <View style={s.loadWrap}>
                  <ActivityIndicator color={T.sage} />
                </View>
              ) : clients.length === 0 ? (
                <View style={s.emptyCard}>
                  <Text style={s.emptyEmoji}>🌱</Text>
                  <Text style={s.emptyTitle}>No clients yet</Text>
                  <Text style={s.emptyDesc}>
                    Clients who join your program will appear here.
                  </Text>
                </View>
              ) : (
                clients.map(c => (
                  <ClientCard
                    key={c.id}
                    client={c}
                    onPress={() => goToClient(c.id)}
                    onMessage={() => goToMsg(c)}
                  />
                ))
              )}
            </View>

            {/* ── COMMUNITY ─────────────────────────────────────────── */}
            <View style={s.section}>
              <SectionLabel text="Community" />
              <TouchableOpacity
                style={s.commCard}
                onPress={goToConversations}
                activeOpacity={0.82}
              >
                <View style={s.commIcon}>
                  <Text style={{ fontSize: 20 }}>💬</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.commTitle}>Group Chat</Text>
                  <Text style={s.commDesc}>Message clients individually or together</Text>
                </View>
                <Text style={s.commArrow}>›</Text>
              </TouchableOpacity>
            </View>

            {/* ── SIGN OUT ──────────────────────────────────────────── */}
            <TouchableOpacity
              style={s.signOutBtn}
              onPress={confirmLogout}
              activeOpacity={0.75}
            >
              <Text style={s.signOutTxt}>Sign out</Text>
            </TouchableOpacity>

            <View style={{ height: 48 }} />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: T.pageBg },
  safe:    { flex: 1 },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: 22, paddingTop: 4 },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 20, paddingBottom: 28,
  },
  greetSm: {
    fontSize: 13, fontWeight: '400',
    color: T.inkMuted, letterSpacing: 0.2,
  },
  greetLg: {
    fontSize: 28, fontWeight: '300',
    color: T.inkDark, letterSpacing: -0.6, marginTop: 2,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: T.cardCream,
    borderWidth: 1, borderColor: T.border,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: T.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  iconBtnTxt: { fontSize: 16, color: T.inkMid },

  // Quick actions
  quickRow: { flexDirection: 'row', gap: 10, marginBottom: 32 },

  // Sections
  section:   { marginBottom: 28 },
  loadWrap:  { paddingVertical: 32, alignItems: 'center' },

  // Empty state
  emptyCard: {
    backgroundColor: T.cardCream,
    borderRadius: 18, borderWidth: 1, borderColor: T.border,
    padding: 32, alignItems: 'center', gap: 8,
    shadowColor: T.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  emptyEmoji: { fontSize: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: T.inkDark },
  emptyDesc:  {
    fontSize: 13, color: T.inkMuted,
    textAlign: 'center', lineHeight: 19,
  },

  // Community card
  commCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: T.cardCream,
    borderRadius: 18, borderWidth: 1, borderColor: T.border,
    padding: 18, gap: 14,
    shadowColor: T.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  commIcon: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: T.goldLight,
    borderWidth: 1, borderColor: T.goldBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  commTitle: { fontSize: 15, fontWeight: '600', color: T.inkDark },
  commDesc:  { fontSize: 12, color: T.inkMuted, marginTop: 2, lineHeight: 17 },
  commArrow: { fontSize: 22, color: T.inkMuted, fontWeight: '300' },

  // Sign out
  signOutBtn: {
    alignSelf: 'center',
    paddingVertical: 10, paddingHorizontal: 28,
    marginBottom: 8,
  },
  signOutTxt: {
    fontSize: 14, fontWeight: '500',
    color: 'rgba(140,59,59,0.55)',
    letterSpacing: 0.3,
  },
});