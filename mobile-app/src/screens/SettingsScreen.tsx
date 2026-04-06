// mobile-app/src/screens/SettingsScreen.tsx
// Upgraded UI — forest dark glassmorphism
// ALL logic, AsyncStorage, auth, navigation preserved

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useAuthStore } from '../stores/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CYCLE_PROFILE_KEY, CycleProfile } from './RhythmProfileScreen';

const CYCLE_TRACKING_KEY = 'cycleTrackingEnabled';

const PROFILE_LABELS: Record<CycleProfile, string> = {
  regular:       'Regular Cycle',
  irregular:     'Irregular / PCOS',
  perimenopause: 'Perimenopause',
  menopause:     'Menopause',
  unknown:       'Not Sure',
};

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

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
} as const;

// ── Section wrapper ────────────────────────────────────────────────────────────
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

// ── Row ────────────────────────────────────────────────────────────────────────
function Row({
  emoji, label, desc, value, onPress, last, danger,
}: {
  emoji?: string; label: string; desc?: string; value?: string;
  onPress: () => void; last?: boolean; danger?: boolean;
}) {
  return (
    <>
      <TouchableOpacity style={r.row} onPress={onPress} activeOpacity={0.75}>
        {emoji ? (
          <View style={r.icon}><Text style={r.emoji}>{emoji}</Text></View>
        ) : null}
        <View style={r.info}>
          <Text style={[r.label, danger && { color: T.errorRed }]}>{label}</Text>
          {desc ? <Text style={r.desc}>{desc}</Text> : null}
        </View>
        {value ? <Text style={r.value}>{value}</Text> : null}
        {!danger && <Text style={r.arrow}>›</Text>}
      </TouchableOpacity>
      {!last && <View style={r.div} />}
    </>
  );
}
const r = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, paddingHorizontal: 18 },
  icon:  { width: 36, height: 36, borderRadius: 10, backgroundColor: T.glassMid,
    alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 17 },
  info:  { flex: 1 },
  label: { fontSize: 15, fontWeight: '600', color: T.textPrimary, marginBottom: 2 },
  desc:  { fontSize: 12, color: T.textMuted, lineHeight: 17 },
  value: { fontSize: 12, color: T.textSecondary, marginRight: 6 },
  arrow: { fontSize: 20, color: T.textMuted },
  div:   { height: 1, backgroundColor: T.glassBorder, marginHorizontal: 18 },
});

// ── Toggle row ─────────────────────────────────────────────────────────────────
function ToggleRow({
  emoji, label, desc, value, onChange, last,
}: {
  emoji?: string; label: string; desc?: string;
  value: boolean; onChange: (v: boolean) => void; last?: boolean;
}) {
  return (
    <>
      <View style={t.row}>
        {emoji ? <View style={t.icon}><Text style={t.emoji}>{emoji}</Text></View> : null}
        <View style={t.info}>
          <Text style={t.label}>{label}</Text>
          {desc ? <Text style={t.desc}>{desc}</Text> : null}
        </View>
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ false: 'rgba(255,255,255,0.10)', true: T.sageDeep }}
          thumbColor={value ? T.sageBright : 'rgba(240,237,230,0.55)'}
          ios_backgroundColor="rgba(255,255,255,0.10)"
        />
      </View>
      {!last && <View style={t.div} />}
    </>
  );
}
const t = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, paddingHorizontal: 18 },
  icon:  { width: 36, height: 36, borderRadius: 10, backgroundColor: T.glassMid,
    alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 17 },
  info:  { flex: 1 },
  label: { fontSize: 15, fontWeight: '600', color: T.textPrimary, marginBottom: 2 },
  desc:  { fontSize: 12, color: T.textMuted, lineHeight: 17 },
  div:   { height: 1, backgroundColor: T.glassBorder, marginHorizontal: 18 },
});

// ── Main ───────────────────────────────────────────────────────────────────────
export default function SettingsScreen({ navigation }: { navigation: NavProp }) {
  const { user, logout } = useAuthStore();
  const [cycleEnabled,  setCycleEnabled]  = useState(true);
  const [cycleProfile,  setCycleProfile]  = useState<CycleProfile>('regular');

  const loadSettings = async () => {
    try {
      const en = await AsyncStorage.getItem(CYCLE_TRACKING_KEY);
      if (en !== null) setCycleEnabled(en === 'true');
      const pr = await AsyncStorage.getItem(CYCLE_PROFILE_KEY);
      if (pr) setCycleProfile(pr as CycleProfile);
    } catch {}
  };

  useEffect(() => { loadSettings(); }, []);
  useEffect(() => {
    const unsub = navigation.addListener('focus', loadSettings);
    return unsub;
  }, [navigation]);

  const toggleCycle = async (v: boolean) => {
    try {
      await AsyncStorage.setItem(CYCLE_TRACKING_KEY, v.toString());
      setCycleEnabled(v);
      if (!v) Alert.alert('Rhythm Tracking Disabled', 'You can re-enable it anytime in settings.');
    } catch { Alert.alert('Error', 'Failed to save setting'); }
  };

  const confirmLogout = () =>
    Alert.alert('Sign out?', 'You\'ll need to log in again.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: logout },
    ]);

  const initial = user?.firstName?.charAt(0).toUpperCase() || '?';
  const hue = ((user?.firstName?.charCodeAt(0) ?? 65) * 41) % 360;

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
          <Text style={s.headerTitle}>Settings</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
        >
          {/* ── PROFILE CARD ──────────────────────────────────────── */}
          <View style={s.profileCard}>
            <View style={[s.avatar, { backgroundColor: `hsla(${hue},22%,24%,1)`,
              borderColor: `hsla(${hue},28%,40%,0.35)` }]}>
              <Text style={[s.avatarTxt, { color: `hsl(${hue},38%,72%)` }]}>{initial}</Text>
            </View>
            <View style={s.profileInfo}>
              <Text style={s.profileName}>{user?.firstName} {user?.lastName}</Text>
              <Text style={s.profileEmail}>{user?.email}</Text>
            </View>
          </View>

          {/* FEATURES */}
          <Section label="FEATURES">
            <Row
              emoji="🌾"
              label="Rhythm Profile"
              desc="Your cycle type"
              value={PROFILE_LABELS[cycleProfile]}
              onPress={() => navigation.navigate('RhythmProfile')}
            />
            <ToggleRow
              emoji="〰"
              label="Rhythm Tracking"
              desc="Show spiritual rhythm on dashboard"
              value={cycleEnabled}
              onChange={toggleCycle}
              last
            />
          </Section>

          {/* INTEGRATIONS */}
          <Section label="INTEGRATIONS">
            <Row
              emoji="❤"
              label="Apple Health"
              desc="Sync glucose data"
              onPress={() => navigation.navigate('HealthSync')}
              last
            />
          </Section>

          {/* ACCOUNT */}
          <Section label="ACCOUNT">
            <Row
              emoji="🔑"
              label="Change Password"
              desc="Update your password"
              onPress={() => Alert.alert('Coming soon', 'Password change coming in a future update.')}
            />
            <Row
              emoji="👋"
              label="Sign Out"
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

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingTop: 12, paddingBottom: 18,
    borderBottomWidth: 1, borderBottomColor: T.glassBorder,
  },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backArrow:   { fontSize: 22, color: T.textSecondary },
  headerTitle: { fontSize: 18, fontWeight: '700', color: T.textPrimary, letterSpacing: -0.2 },

  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: T.glass, borderRadius: 20,
    borderWidth: 1, borderColor: T.glassBorder,
    padding: 18, marginBottom: 28,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarTxt:    { fontSize: 20, fontWeight: '700' },
  profileInfo:  { flex: 1 },
  profileName:  { fontSize: 18, fontWeight: '700', color: T.textPrimary, letterSpacing: -0.2 },
  profileEmail: { fontSize: 13, color: T.textMuted, marginTop: 3 },

  scroll:  { flex: 1 },
  content: { paddingHorizontal: 22, paddingTop: 24 },
});