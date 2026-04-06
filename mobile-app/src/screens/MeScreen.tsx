// mobile-app/src/screens/MeScreen.tsx
// Upgraded UI — forest dark glassmorphism
// ALL navigation, logic, auth calls preserved

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
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../stores/authStore';
import { AxisMarker, SeverityContinuum } from '../components/SimpleIcons';

// ── Tokens ─────────────────────────────────────────────────────────────────────
const T = {
  bgDeep:        '#0F1C12',
  bgMid:         '#162019',
  glass:         'rgba(255,255,255,0.06)',
  glassMid:      'rgba(255,255,255,0.09)',
  glassBorder:   'rgba(255,255,255,0.10)',
  glassBorderHi: 'rgba(255,255,255,0.18)',
  sage:          '#7A9B7E',
  sageBright:    '#9ABD9E',
  sageDeep:      '#3D5540',
  gold:          '#C9A96E',
  goldGlow:      'rgba(201,169,110,0.14)',
  goldBorder:    'rgba(201,169,110,0.22)',
  textPrimary:   '#F0EDE6',
  textSecondary: 'rgba(240,237,230,0.55)',
  textMuted:     'rgba(240,237,230,0.30)',
  errorRed:      '#E07070',
  errorBg:       'rgba(224,112,112,0.10)',
  errorBorder:   'rgba(224,112,112,0.20)',
} as const;

// ── Row item ───────────────────────────────────────────────────────────────────
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
          <Text style={[r.label, danger && { color: T.errorRed }]}>{label}</Text>
          {desc ? <Text style={r.desc}>{desc}</Text> : null}
        </View>
        {!danger && <Text style={r.arrow}>›</Text>}
      </TouchableOpacity>
      {!last && <View style={r.divider} />}
    </>
  );
}
const r = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 18 },
  iconWrap:{ width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center',
    backgroundColor: T.glass },
  emoji:   { fontSize: 18 },
  info:    { flex: 1 },
  label:   { fontSize: 15, fontWeight: '600', color: T.textPrimary, marginBottom: 2 },
  desc:    { fontSize: 12, color: T.textMuted, lineHeight: 17 },
  arrow:   { fontSize: 20, color: T.textMuted },
  divider: { height: 1, backgroundColor: T.glassBorder, marginHorizontal: 18 },
});

// ── Section ────────────────────────────────────────────────────────────────────
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
  lbl:  { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: T.textMuted, marginBottom: 10 },
  card: {
    backgroundColor: T.glass, borderRadius: 20,
    borderWidth: 1, borderColor: T.glassBorder, overflow: 'hidden',
  },
});

// ── Main ───────────────────────────────────────────────────────────────────────
export default function MeScreen({ navigation }: { navigation: any }) {
  const { user, logout } = useAuthStore();

  const initial = user?.firstName?.charAt(0).toUpperCase() || '?';
  const hue = ((user?.firstName?.charCodeAt(0) ?? 65) * 41) % 360;

  const confirmLogout = () =>
    Alert.alert('Sign out?', 'You\'ll need to log in again.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: logout },
    ]);

  return (
    <View style={s.root}>
      <LinearGradient
        colors={[T.bgDeep, T.bgMid, '#162819']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
      />

      <SafeAreaView style={s.safe} edges={['top']}>
        {/* ── PROFILE HEADER ────────────────────────────────────────── */}
        <View style={s.profileHeader}>
          <View style={[s.avatar, { backgroundColor: `hsla(${hue},22%,24%,1)`,
            borderColor: `hsla(${hue},28%,40%,0.35)` }]}>
            <Text style={[s.avatarTxt, { color: `hsl(${hue},38%,72%)` }]}>{initial}</Text>
          </View>
          <View style={s.profileInfo}>
            <Text style={s.profileName}>{user?.firstName} {user?.lastName}</Text>
            <Text style={s.profileEmail}>{user?.email}</Text>
          </View>
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
        >
          {/* LOG */}
          <Section label="LOG">
            <Row
              emoji="⬤"
              label="Log Glucose"
              desc="Record a blood sugar reading"
              iconBg="rgba(122,155,126,0.15)"
              onPress={() => navigation.navigate('AddGlucose')}
            />
            <Row
              emoji="〰"
              label="Log Symptoms"
              desc="Track how you're feeling"
              iconBg="rgba(201,169,110,0.12)"
              onPress={() => navigation.navigate('AddSymptom')}
            />
            <Row
              emoji="🌿"
              label="Log Cycle"
              desc="Update your cycle dates"
              iconBg="rgba(61,85,64,0.25)"
              onPress={() => navigation.navigate('LogCycle')}
              last
            />
          </Section>

          {/* PREFERENCES */}
          <Section label="PREFERENCES">
            <Row
              emoji="🌾"
              label="Rhythm Profile"
              desc="Regular, PCOS, perimenopause…"
              iconBg="rgba(122,155,126,0.12)"
              onPress={() => navigation.navigate('RhythmProfile')}
            />
            <Row
              emoji="⚙"
              label="Settings"
              desc="App preferences & account"
              iconBg="rgba(255,255,255,0.06)"
              onPress={() => navigation.navigate('Settings')}
            />
            <Row
              emoji="❤"
              label="Apple Health"
              desc="Sync your health data"
              iconBg="rgba(224,112,112,0.12)"
              onPress={() => navigation.navigate('HealthSync')}
              last
            />
          </Section>

          {/* ACCOUNT */}
          <Section label="ACCOUNT">
            <Row
              emoji="👋"
              label="Sign Out"
              desc=""
              onPress={confirmLogout}
              danger
              last
            />
          </Section>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root:  { flex: 1 },
  safe:  { flex: 1 },

  profileHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingHorizontal: 22, paddingTop: 20, paddingBottom: 28,
    borderBottomWidth: 1, borderBottomColor: T.glassBorder,
  },
  avatar: {
    width: 58, height: 58, borderRadius: 29, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarTxt:    { fontSize: 22, fontWeight: '700' },
  profileInfo:  { flex: 1 },
  profileName:  { fontSize: 20, fontWeight: '700', color: T.textPrimary, letterSpacing: -0.3 },
  profileEmail: { fontSize: 13, color: T.textMuted, marginTop: 3 },

  scroll:  { flex: 1 },
  content: { paddingHorizontal: 22, paddingTop: 28 },
});