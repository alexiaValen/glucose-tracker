// mobile-app/src/screens/CoachDashboardScreen.tsx
// Elevated UI — deep forest dark, glassmorphism, botanical luxury
// ALL logic/navigation/stores preserved — visual layer only

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
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useAuthStore }  from '../stores/authStore';
import { useCoachStore } from '../stores/coachStore';
import type { ClientSummary } from '../services/coach.service';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
const { width: SW } = Dimensions.get('window');

// ── Tokens ─────────────────────────────────────────────────────────────────────
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
  gold:          '#C9A96E',
  goldGlow:      'rgba(201,169,110,0.18)',
  goldBorder:    'rgba(201,169,110,0.25)',
  low:           '#E07070',
  high:          '#C9A96E',
  ok:            '#7A9B7E',
  textPrimary:   '#F0EDE6',
  textSecondary: 'rgba(240,237,230,0.55)',
  textMuted:     'rgba(240,237,230,0.30)',
} as const;

// ── Decorative rings ───────────────────────────────────────────────────────────
function BgRings() {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {[
        { size: 220, top: -40,  left: SW * 0.5, op: 0.04 },
        { size: 140, top: 200,  left: -50,       op: 0.03 },
        { size: 100, top: 400,  left: SW * 0.6,  op: 0.05 },
      ].map((r, i) => (
        <View key={i} style={{
          position: 'absolute', top: r.top, left: r.left,
          width: r.size, height: r.size, borderRadius: r.size / 2,
          borderWidth: 1, borderColor: `rgba(122,155,126,${r.op * 3})`,
          backgroundColor: `rgba(122,155,126,${r.op})`,
        }} />
      ))}
    </View>
  );
}

// ── Glass card ─────────────────────────────────────────────────────────────────
function GCard({ children, style, strong }: { children: React.ReactNode; style?: object; strong?: boolean }) {
  return (
    <View style={[{
      backgroundColor: strong ? T.glassMid : T.glass,
      borderRadius: 20, borderWidth: 1,
      borderColor: strong ? T.glassBorderHi : T.glassBorder,
    }, style]}>
      {children}
    </View>
  );
}

// ── Avatar with deterministic color ───────────────────────────────────────────
function Avatar({ name, size = 46 }: { name: string; size?: number }) {
  const initials = name.split(' ').map((w) => w[0] ?? '').slice(0, 2).join('').toUpperCase();
  const hue = ((name.charCodeAt(0) ?? 65) * 41 + (name.charCodeAt(1) ?? 0) * 17) % 360;
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: `hsla(${hue},22%,28%,1)`,
      borderWidth: 1, borderColor: `hsla(${hue},28%,45%,0.4)`,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ fontSize: size * 0.34, fontWeight: '600', color: `hsl(${hue},40%,78%)` }}>
        {initials}
      </Text>
    </View>
  );
}

// ── Glucose status color ───────────────────────────────────────────────────────
function gColor(v?: number) {
  if (!v) return T.textSecondary;
  if (v < 70)  return T.low;
  if (v > 180) return T.high;
  return T.ok;
}

// ── Client row ─────────────────────────────────────────────────────────────────
function ClientRow({
  client, onPress, onMessage,
}: {
  client: ClientSummary;
  onPress: () => void;
  onMessage: () => void;
}) {
  const full  = `${client.firstName} ${client.lastName}`.trim();
  const last  = client.recentStats?.lastReading;
  const tir   = client.recentStats?.timeInRange;
  const col   = gColor(last);

  return (
    <TouchableOpacity style={cr.row} onPress={onPress} activeOpacity={0.82}>
      <Avatar name={full || client.email} size={46} />

      <View style={cr.info}>
        <Text style={cr.name}>{full || 'Client'}</Text>
        <Text style={cr.email} numberOfLines={1}>{client.email}</Text>
        {(last || tir != null) ? (
          <View style={cr.pills}>
            {last ? (
              <View style={[cr.pill, { borderColor: `${col}30` }]}>
                <View style={[cr.dot, { backgroundColor: col }]} />
                <Text style={[cr.pillTxt, { color: col }]}>{last} mg/dL</Text>
              </View>
            ) : null}
            {tir != null ? (
              <View style={cr.pill}>
                <Text style={cr.pillTxt}>{tir}% in range</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <Text style={cr.noData}>No recent data</Text>
        )}
      </View>

      <TouchableOpacity
        style={cr.msgBtn}
        onPress={onMessage}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={{ fontSize: 15 }}>✉</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
const cr = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: T.glass, borderRadius: 18,
    borderWidth: 1, borderColor: T.glassBorder,
    paddingVertical: 14, paddingHorizontal: 16,
    marginBottom: 10, gap: 13,
  },
  info:    { flex: 1 },
  name:    { fontSize: 15, fontWeight: '600', color: T.textPrimary, letterSpacing: 0.1 },
  email:   { fontSize: 12, color: T.textMuted, marginTop: 2 },
  pills:   { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  pill:    {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: T.glassBorder,
  },
  dot:     { width: 5, height: 5, borderRadius: 3 },
  pillTxt: { fontSize: 11, fontWeight: '500', color: T.textSecondary },
  noData:  { fontSize: 11, color: T.textMuted, marginTop: 5, fontStyle: 'italic' },
  msgBtn:  {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: T.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
});

// ── Main ───────────────────────────────────────────────────────────────────────
export default function CoachDashboardScreen() {
  const navigation = useNavigation<NavProp>();
  const { user, logout } = useAuthStore();
  const { clients, isLoading, fetchClients } = useCoachStore();
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    fetchClients();
    Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }).start();
  }, [fetchClients]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchClients();
    setRefreshing(false);
  }, [fetchClients]);

  const firstName = user?.firstName ?? 'Coach';
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning,' : h < 17 ? 'Good afternoon,' : 'Good evening,';

  const goToClient  = (id: string)       => navigation.navigate('ClientDetail', { clientId: id });
  const goToMsg     = (c: ClientSummary) => navigation.navigate('Messaging', {
    userName: `${c.firstName} ${c.lastName}`.trim() || c.email,
  });
  const goToConversations = () => navigation.navigate('Conversations');
  const goToNewLesson     = () => navigation.navigate('CreateLesson' as any, {});
  const goToAllLessons    = () => navigation.navigate('CoachLessons' as any);

  return (
    <View style={s.root}>
      <LinearGradient
        colors={[T.bgDeep, T.bgMid, '#162819']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
      />
      <BgRings />

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

            {/* ── HEADER ──────────────────────────────────────────────── */}
            <View style={s.header}>
              <View>
                <Text style={s.greetSm}>{greet}</Text>
                <Text style={s.greetLg}>{firstName}</Text>
              </View>
              <TouchableOpacity style={s.iconBtn} onPress={goToConversations} activeOpacity={0.75}>
                <Text style={{ fontSize: 17 }}>✉</Text>
              </TouchableOpacity>
            </View>

            {/* ── QUICK ACTIONS ───────────────────────────────────────── */}
            <View style={s.quickRow}>
              {/* New Lesson — primary, gold accent */}
              <TouchableOpacity style={[s.quickCard, s.quickPrimary]} onPress={goToNewLesson} activeOpacity={0.85}>
                <LinearGradient
                  colors={['rgba(201,169,110,0.28)', 'rgba(201,169,110,0.12)']}
                  style={StyleSheet.absoluteFillObject}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                />
                <Text style={s.quickEmoji}>＋</Text>
                <Text style={s.quickLblGold}>New Lesson</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.quickCard} onPress={goToAllLessons} activeOpacity={0.85}>
                <Text style={s.quickEmoji}>📋</Text>
                <Text style={s.quickLbl}>All Lessons</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.quickCard} onPress={goToConversations} activeOpacity={0.85}>
                <Text style={s.quickEmoji}>💬</Text>
                <Text style={s.quickLbl}>Messages</Text>
              </TouchableOpacity>
            </View>

            {/* ── CLIENTS ─────────────────────────────────────────────── */}
            <View style={s.section}>
              <Text style={s.sectionLbl}>
                {clients.length > 0 ? `${clients.length} CLIENT${clients.length !== 1 ? 'S' : ''}` : 'CLIENTS'}
              </Text>

              {isLoading && !refreshing ? (
                <View style={s.loadWrap}>
                  <ActivityIndicator color={T.sage} />
                </View>
              ) : clients.length === 0 ? (
                <GCard style={s.emptyCard}>
                  <Text style={s.emptyEmoji}>🌱</Text>
                  <Text style={s.emptyTitle}>No clients yet</Text>
                  <Text style={s.emptyDesc}>Clients who join your program will appear here.</Text>
                </GCard>
              ) : (
                clients.map((c) => (
                  <ClientRow
                    key={c.id}
                    client={c}
                    onPress={() => goToClient(c.id)}
                    onMessage={() => goToMsg(c)}
                  />
                ))
              )}
            </View>

            {/* ── COMMUNITY ───────────────────────────────────────────── */}
            <View style={s.section}>
              <Text style={s.sectionLbl}>COMMUNITY</Text>
              <TouchableOpacity onPress={goToConversations} activeOpacity={0.82}>
                <GCard strong style={s.commCard}>
                  <View style={s.commIcon}>
                    <Text style={{ fontSize: 20 }}>💬</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.commTitle}>Group Chat</Text>
                    <Text style={s.commDesc}>Message clients individually or together</Text>
                  </View>
                  <Text style={{ fontSize: 20, color: T.textMuted }}>›</Text>
                </GCard>
              </TouchableOpacity>
            </View>

            {/* ── SIGN OUT ────────────────────────────────────────────── */}
            <TouchableOpacity
              style={s.signOutBtn}
              activeOpacity={0.75}
              onPress={() =>
                Alert.alert('Sign out?', 'You\'ll need to log in again.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Sign out', style: 'destructive', onPress: logout },
                ])
              }
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

const s = StyleSheet.create({
  root:    { flex: 1 },
  safe:    { flex: 1 },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: 22, paddingTop: 4 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', paddingTop: 20, paddingBottom: 30,
  },
  greetSm: { fontSize: 13, color: T.textSecondary, letterSpacing: 0.3 },
  greetLg: { fontSize: 30, fontWeight: '700', color: T.textPrimary, letterSpacing: -0.8, marginTop: 3 },
  iconBtn: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: T.glass, borderWidth: 1, borderColor: T.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },

  quickRow:  { flexDirection: 'row', gap: 10, marginBottom: 32 },
  quickCard: {
    flex: 1, alignItems: 'center',
    backgroundColor: T.glass, borderRadius: 16,
    paddingVertical: 18, borderWidth: 1, borderColor: T.glassBorder,
    gap: 6, overflow: 'hidden',
  },
  quickPrimary: { borderColor: T.goldBorder },
  quickEmoji:   { fontSize: 18 },
  quickLbl:     { fontSize: 10, fontWeight: '600', letterSpacing: 0.5, color: T.textMuted },
  quickLblGold: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5, color: T.gold },

  section:    { marginBottom: 28 },
  sectionLbl: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: T.textMuted, marginBottom: 14 },

  loadWrap:  { paddingVertical: 32, alignItems: 'center' },
  emptyCard: { padding: 28, alignItems: 'center', gap: 8 },
  emptyEmoji:{ fontSize: 32 },
  emptyTitle:{ fontSize: 16, fontWeight: '600', color: T.textPrimary },
  emptyDesc: { fontSize: 13, color: T.textSecondary, textAlign: 'center', lineHeight: 19 },

  commCard:  { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14 },
  commIcon:  {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: T.goldGlow, borderWidth: 1, borderColor: T.goldBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  commTitle: { fontSize: 15, fontWeight: '600', color: T.textPrimary },
  commDesc:  { fontSize: 12, color: T.textSecondary, marginTop: 2 },

  signOutBtn: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 28,
    marginBottom: 8,
  },
  signOutTxt: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(224,112,112,0.55)',
    letterSpacing: 0.3,
  },
});