// mobile-app/src/screens/MeScreen.tsx
// REFACTORED: Matches dashboard design system — cream/sage/forest palette.
// RhythmProfile row now navigates to unified RhythmScreen.
// ALL navigation, logic, auth calls preserved exactly.

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../stores/authStore';

// ─────────────────────────────────────────────────────────────────────────────
// TOKENS — exact match to DashboardScreen + RhythmScreen
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

  low:          '#8C3B3B',
  border:       'rgba(28,30,26,0.09)',
  borderMid:    'rgba(28,30,26,0.15)',
  shadow:       '#18201A',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// ROW
// ─────────────────────────────────────────────────────────────────────────────
interface RowProps {
  emoji?: string;
  label: string;
  desc?: string;
  onPress: () => void;
  danger?: boolean;
  iconBg?: string;
  last?: boolean;
}

function Row({ emoji, label, desc, onPress, danger, iconBg, last }: RowProps) {
  return (
    <>
      <TouchableOpacity style={r.row} onPress={onPress} activeOpacity={0.75}>
        {emoji ? (
          <View style={[r.iconWrap, iconBg ? { backgroundColor: iconBg } : {}]}>
            <Text style={r.emoji}>{emoji}</Text>
          </View>
        ) : null}
        <View style={r.info}>
          <Text style={[r.label, danger && { color: T.low }]}>{label}</Text>
          {desc ? <Text style={r.desc}>{desc}</Text> : null}
        </View>
        {!danger && <Text style={r.arrow}>›</Text>}
      </TouchableOpacity>
      {!last && <View style={r.divider} />}
    </>
  );
}
const r = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    gap: 14, paddingVertical: 14, paddingHorizontal: 18,
  },
  iconWrap: {
    width: 38, height: 38, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: T.cardSage,
  },
  emoji:   { fontSize: 17 },
  info:    { flex: 1 },
  label:   { fontSize: 15, fontWeight: '600', color: T.inkDark, marginBottom: 2 },
  desc:    { fontSize: 12, color: T.inkMuted, lineHeight: 17 },
  arrow:   { fontSize: 20, color: T.inkMuted },
  divider: { height: 1, backgroundColor: T.border, marginHorizontal: 18 },
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION
// ─────────────────────────────────────────────────────────────────────────────
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={sec.wrap}>
      <Text style={sec.lbl}>{label}</Text>
      <View style={sec.card}>{children}</View>
    </View>
  );
}
const sec = StyleSheet.create({
  wrap: { marginBottom: 24 },
  lbl: {
    fontSize: 9, fontWeight: '700',
    letterSpacing: 1.5, textTransform: 'uppercase',
    color: T.inkMuted, marginBottom: 10,
  },
  card: {
    backgroundColor: T.cardCream,
    borderRadius: 18,
    borderWidth: 1, borderColor: T.border,
    overflow: 'hidden',
    shadowColor: T.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function MeScreen({ navigation }: { navigation: any }) {
  const { user, logout } = useAuthStore();

  const initial = user?.firstName?.charAt(0).toUpperCase() || '?';
  // Deterministic hue from name — kept from original
  const hue = ((user?.firstName?.charCodeAt(0) ?? 65) * 41) % 360;

  const confirmLogout = () =>
    Alert.alert('Sign out?', "You'll need to log in again.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: logout },
    ]);

  return (
    <View style={s.root}>
      <SafeAreaView style={s.safe} edges={['top']}>

        {/* ── PROFILE HEADER ──────────────────────────────────────── */}
        <View style={s.profileHeader}>
          <View style={[
            s.avatar,
            {
              backgroundColor: `hsla(${hue},18%,82%,1)`,
              borderColor: `hsla(${hue},22%,70%,0.5)`,
            },
          ]}>
            <Text style={[s.avatarTxt, { color: `hsl(${hue},30%,28%)` }]}>
              {initial}
            </Text>
          </View>
          <View style={s.profileInfo}>
            <Text style={s.profileName}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text style={s.profileEmail}>{user?.email}</Text>
          </View>
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
        >
          {/* ── LOG ─────────────────────────────────────────────────── */}
          <Section label="Log">
            <Row
              emoji="◉"
              label="Log Glucose"
              desc="Record a blood sugar reading"
              iconBg="rgba(77,107,84,0.14)"
              onPress={() => navigation.navigate('AddGlucose')}
            />
            <Row
              emoji="〰"
              label="Log Symptoms"
              desc="Track how you're feeling"
              iconBg="rgba(140,110,60,0.12)"
              onPress={() => navigation.navigate('AddSymptom')}
            />
            <Row
              emoji="🌿"
              label="Log Cycle"
              desc="Update your cycle dates"
              iconBg="rgba(77,107,84,0.12)"
              onPress={() => navigation.navigate('LogCycle')}
              last
            />
          </Section>

          {/* ── PREFERENCES ─────────────────────────────────────────── */}
          <Section label="Preferences">
            {/* ↓ navigates to unified RhythmScreen (merged profile + rhythm) */}
            <Row
              emoji="🌾"
              label="Rhythm & Profile"
              desc="Your cycle type & daily rhythm"
              iconBg="rgba(77,107,84,0.12)"
              onPress={() => navigation.navigate('Rhythm')}
            />
            <Row
              emoji="⚙"
              label="Settings"
              desc="App preferences & account"
              iconBg={T.cardSage}
              onPress={() => navigation.navigate('Settings')}
            />
            <Row
              emoji="❤"
              label="Apple Health"
              desc="Sync your health data"
              iconBg="rgba(140,59,59,0.10)"
              onPress={() => navigation.navigate('HealthSync')}
              last
            />
          </Section>

          {/* ── ACCOUNT ─────────────────────────────────────────────── */}
          <Section label="Account">
            <Row
              emoji="👋"
              label="Sign Out"
              onPress={confirmLogout}
              danger
              last
            />
          </Section>

          <View style={{ height: 48 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.pageBg },
  safe: { flex: 1 },

  profileHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24,
    borderBottomWidth: 1, borderBottomColor: T.border,
    backgroundColor: T.pageBg,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: T.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  avatarTxt:    { fontSize: 21, fontWeight: '700' },
  profileInfo:  { flex: 1 },
  profileName:  {
    fontSize: 19, fontWeight: '600',
    color: T.inkDark, letterSpacing: -0.3,
  },
  profileEmail: { fontSize: 13, color: T.inkMuted, marginTop: 3 },

  scroll:  { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 28 },
});