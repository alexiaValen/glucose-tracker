// mobile-app/src/screens/CoachSettingsScreen.tsx
// Coach settings — premium light-mode, same palette as SettingsScreen.
// Sections appropriate for coach role: Profile, Clients, Account.

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
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useAuthStore } from '../stores/authStore';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'CoachSettings'>;

// ─────────────────────────────────────────────────────────────────────────────
// TOKENS — identical to SettingsScreen
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  pageBg:     '#F7F5F2',
  cardBg:     '#FFFFFF',
  cardBorder: 'rgba(0,0,0,0.05)',
  divider:    '#EDEAE5',

  inkDark:    '#1A1814',
  inkMid:     '#4A4640',
  inkMuted:   '#9B9690',

  forest:     '#2B4535',
  gold:       '#A8916A',

  danger:     '#C0413A',
} as const;

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
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
    color: T.inkMuted,
    textTransform: 'uppercase',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  card: {
    backgroundColor: T.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.cardBorder,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// ROW
// ─────────────────────────────────────────────────────────────────────────────
function Row({
  icon, label, desc, value, onPress, last, danger,
}: {
  icon?: string; label: string; desc?: string; value?: string;
  onPress: () => void; last?: boolean; danger?: boolean;
}) {
  return (
    <>
      <TouchableOpacity style={r.row} onPress={onPress} activeOpacity={0.7}>
        {icon ? (
          <View style={[r.iconWrap, danger && r.iconWrapDanger]}>
            <Text style={r.iconTxt}>{icon}</Text>
          </View>
        ) : null}
        <View style={r.info}>
          <Text style={[r.label, danger && { color: T.danger }]}>{label}</Text>
          {desc ? <Text style={r.desc}>{desc}</Text> : null}
        </View>
        {value ? <Text style={r.value}>{value}</Text> : null}
        {!danger && <Text style={r.chevron}>›</Text>}
      </TouchableOpacity>
      {!last && <View style={r.div} />}
    </>
  );
}
const r = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 15,
    paddingHorizontal: 18,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#F3F0EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapDanger: {
    backgroundColor: 'rgba(192,65,58,0.08)',
  },
  iconTxt:  { fontSize: 16 },
  info:     { flex: 1 },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: T.inkDark,
    marginBottom: 1,
  },
  desc: {
    fontSize: 12,
    color: T.inkMuted,
    lineHeight: 17,
  },
  value: {
    fontSize: 12,
    color: T.inkMuted,
    marginRight: 4,
  },
  chevron: {
    fontSize: 20,
    color: T.inkMuted,
    lineHeight: 22,
  },
  div: {
    height: 1,
    backgroundColor: T.divider,
    marginHorizontal: 18,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
export default function CoachSettingsScreen({ navigation }: { navigation: NavProp }) {
  const { user, logout } = useAuthStore();

  const confirmLogout = () =>
    Alert.alert('Sign out?', "You'll need to log in again.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: logout },
    ]);

  const initial = user?.firstName?.charAt(0).toUpperCase() || '?';
  const hue = ((user?.firstName?.charCodeAt(0) ?? 65) * 41) % 360;

  return (
    <View style={s.root}>
      <SafeAreaView style={s.safe} edges={['top']}>

        {/* ── HEADER ──────────────────────────────────────────────── */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.65}>
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
          {/* ── PROFILE CARD ────────────────────────────────────────── */}
          <View style={s.profileCard}>
            <View style={[s.avatar, {
              backgroundColor: `hsla(${hue},20%,92%,1)`,
              borderColor:     `hsla(${hue},25%,75%,0.4)`,
            }]}>
              <Text style={[s.avatarTxt, { color: `hsl(${hue},30%,32%)` }]}>
                {initial}
              </Text>
            </View>
            <View style={s.profileInfo}>
              <Text style={s.profileName}>{user?.firstName} {user?.lastName}</Text>
              <Text style={s.profileEmail}>{user?.email}</Text>
              <View style={s.roleBadge}>
                <Text style={s.roleTxt}>Coach</Text>
              </View>
            </View>
          </View>

          {/* PRACTICE */}
          <Section label="Practice">
            <Row
              icon="◈"
              label="Client Notifications"
              desc="Alerts when clients log or message"
              onPress={() => Alert.alert('Coming soon', 'Notification preferences coming in a future update.')}
            />
            <Row
              icon="⊞"
              label="Session Templates"
              desc="Manage your default session structure"
              onPress={() => Alert.alert('Coming soon', 'Session templates coming in a future update.')}
              last
            />
          </Section>

          {/* ACCOUNT */}
          <Section label="Account">
            <Row
              icon="◈"
              label="Change Password"
              desc="Update your password"
              onPress={() => Alert.alert('Coming soon', 'Password change coming in a future update.')}
            />
            <Row
              icon="→"
              label="Sign Out"
              onPress={confirmLogout}
              danger
              last
            />
          </Section>

          {/* APP */}
          <Section label="App">
            <Row
              icon="◎"
              label="About TLC"
              desc="Version, licenses, and support"
              onPress={() => Alert.alert('TLC', 'Transforming Lives Coaching\nRooted in faith. Moving in health.')}
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
  root:  { flex: 1, backgroundColor: T.pageBg },
  safe:  { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: T.divider,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 20,
    color: T.inkMid,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: T.inkDark,
    letterSpacing: -0.2,
  },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: T.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.cardBorder,
    padding: 18,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTxt: {
    fontSize: 19,
    fontWeight: '600',
  },
  profileInfo:  { flex: 1 },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: T.inkDark,
    letterSpacing: -0.2,
  },
  profileEmail: {
    fontSize: 13,
    color: T.inkMuted,
    marginTop: 3,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    marginTop: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(43,69,53,0.08)',
    borderRadius: 5,
  },
  roleTxt: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    color: T.forest,
    textTransform: 'uppercase',
  },

  scroll:  { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 24 },
});
