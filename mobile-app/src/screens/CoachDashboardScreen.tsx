// mobile-app/src/screens/CoachDashboardScreen.tsx
// Redesigned coach dashboard — combines MediCore stat-card layout (Image 5),
// mobile status-list pattern (Image 6), and welcome + table feel (Image 7).
// ALL logic / navigation / store calls preserved exactly.

import React, { useEffect, useCallback, useState, useMemo, useRef } from 'react';
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
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useAuthStore }  from '../stores/authStore';
import { useCoachStore } from '../stores/coachStore';
import type { ClientSummary } from '../services/coach.service';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

// ─────────────────────────────────────────────────────────────────────────────
// TOKENS — warm off-white palette matching Settings/Login
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  pageBg:      '#F7F5F2',
  cardBg:      '#FFFFFF',
  cardBorder:  'rgba(0,0,0,0.05)',
  divider:     '#EDEAE5',

  inkDark:     '#1A1814',
  inkMid:      '#4A4640',
  inkMuted:    '#9B9690',

  forest:      '#2B4535',
  forestLight: 'rgba(43,69,53,0.09)',
  forestBorder:'rgba(43,69,53,0.22)',
  sage:        '#4D6B54',

  gold:        '#A8916A',
  goldLight:   'rgba(168,145,106,0.10)',
  goldBorder:  'rgba(168,145,106,0.22)',

  ok:          '#2B6040',
  okBg:        'rgba(43,96,64,0.09)',
  okBorder:    'rgba(43,96,64,0.18)',
  warn:        '#8C6E3C',
  warnBg:      'rgba(140,110,60,0.09)',
  warnBorder:  'rgba(140,110,60,0.18)',
  alert:       '#C0413A',
  alertBg:     'rgba(192,65,58,0.09)',
  alertBorder: 'rgba(192,65,58,0.18)',

  shadow:      '#1A1814',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function clientStatus(c: ClientSummary): 'ok' | 'warn' | 'alert' {
  const last = c.recentStats?.lastReading;
  const tir  = c.recentStats?.timeInRange ?? 100;
  if (last && (last < 70 || last > 250)) return 'alert';
  if (tir < 50) return 'alert';
  if (tir < 70) return 'warn';
  return 'ok';
}

function relativeTime(iso?: string): string {
  if (!iso) return 'No data';
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1)  return 'Just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24)  return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

// ─────────────────────────────────────────────────────────────────────────────
// AVATAR
// ─────────────────────────────────────────────────────────────────────────────
function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(w => w[0] ?? '').slice(0, 2).join('').toUpperCase();
  const hue = ((name.charCodeAt(0) ?? 65) * 41 + (name.charCodeAt(1) ?? 0) * 17) % 360;
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: `hsla(${hue},22%,88%,1)`,
      borderWidth: 1, borderColor: `hsla(${hue},22%,72%,0.4)`,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ fontSize: size * 0.34, fontWeight: '600', color: `hsl(${hue},30%,30%)` }}>
        {initials}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAT CARD — inspired by MediCore (Image 5)
// ─────────────────────────────────────────────────────────────────────────────
function StatCard({
  label, value, unit, sub, accent,
}: {
  label: string; value: string | number; unit?: string;
  sub?: string; accent?: string;
}) {
  return (
    <View style={[stat.root, { borderTopColor: accent ?? T.forest, borderTopWidth: 3 }]}>
      <Text style={stat.label}>{label}</Text>
      <View style={stat.valRow}>
        <Text style={stat.value}>{value}</Text>
        {unit ? <Text style={stat.unit}>{unit}</Text> : null}
      </View>
      {sub ? <Text style={stat.sub}>{sub}</Text> : null}
    </View>
  );
}
const stat = StyleSheet.create({
  root: {
    flex: 1, backgroundColor: T.cardBg,
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: T.cardBorder,
    shadowColor: T.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  label: {
    fontSize: 10, fontWeight: '600', letterSpacing: 0.8,
    color: T.inkMuted, textTransform: 'uppercase', marginBottom: 8,
  },
  valRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  value: { fontSize: 26, fontWeight: '300', color: T.inkDark, letterSpacing: -0.5 },
  unit:  { fontSize: 12, color: T.inkMuted, marginBottom: 4 },
  sub:   { fontSize: 11, color: T.inkMuted, marginTop: 4 },
});

// ─────────────────────────────────────────────────────────────────────────────
// STATUS ROW — inspired by mobile policy list (Image 6)
// ─────────────────────────────────────────────────────────────────────────────
function StatusRow({
  label, count, desc, color, bg, border, onPress,
}: {
  label: string; count: number; desc: string;
  color: string; bg: string; border: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={sr.root} onPress={onPress} activeOpacity={0.78}>
      <View style={[sr.indicator, { backgroundColor: color }]} />
      <View style={sr.info}>
        <Text style={sr.label}>{label}</Text>
        <Text style={sr.desc}>{desc}</Text>
      </View>
      <View style={[sr.badge, { backgroundColor: bg, borderColor: border }]}>
        <Text style={[sr.badgeTxt, { color }]}>{count}</Text>
      </View>
      <Text style={sr.arrow}>›</Text>
    </TouchableOpacity>
  );
}
const sr = StyleSheet.create({
  root: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 18,
    gap: 14,
  },
  indicator: {
    width: 4, height: 36, borderRadius: 2,
  },
  info: { flex: 1 },
  label: { fontSize: 14, fontWeight: '500', color: T.inkDark },
  desc:  { fontSize: 12, color: T.inkMuted, marginTop: 2 },
  badge: {
    minWidth: 32, height: 28, borderRadius: 20,
    paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  badgeTxt: { fontSize: 13, fontWeight: '600' },
  arrow: { fontSize: 20, color: T.inkMuted },
});

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT ROW — clean list row inspired by Image 7 table rows
// ─────────────────────────────────────────────────────────────────────────────
function ClientRow({
  client, onPress, onMessage, onLongPress, onEdit, onRemove, last,
}: {
  client: ClientSummary; onPress: () => void; onMessage: () => void;
  onLongPress: () => void; onEdit: () => void; onRemove: () => void; last?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const full   = `${client.firstName} ${client.lastName}`.trim() || 'Client';
  const last_r = client.recentStats?.lastReading;
  const tir    = client.recentStats?.timeInRange;
  const status = clientStatus(client);

  const statusColor = status === 'ok' ? T.ok : status === 'warn' ? T.warn : T.alert;
  const statusBg    = status === 'ok' ? T.okBg : status === 'warn' ? T.warnBg : T.alertBg;
  const statusLabel = status === 'ok' ? 'In Range' : status === 'warn' ? 'Watch' : 'Alert';

  return (
    <>
      <TouchableOpacity
        style={cr.root}
        onPress={() => { setExpanded(e => !e); onPress(); }}
        onLongPress={onLongPress}
        activeOpacity={0.78}
        delayLongPress={500}
      >
        <Avatar name={full} size={38} />
        <View style={cr.info}>
          <Text style={cr.name}>{full}</Text>
          <Text style={cr.meta}>
            {last_r ? `${last_r} mg/dL` : '—'}
            {tir != null ? `  ·  ${tir}% TIR` : ''}
          </Text>
        </View>
        <View style={[cr.status, { backgroundColor: statusBg }]}>
          <Text style={[cr.statusTxt, { color: statusColor }]}>{statusLabel}</Text>
        </View>
        {/* actions: edit + message + remove */}
        <View style={cr.actions}>
          <TouchableOpacity style={cr.actionBtn} onPress={onEdit} activeOpacity={0.75}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}>
            <Text style={cr.actionIcon}>✎</Text>
          </TouchableOpacity>
          <TouchableOpacity style={cr.actionBtn} onPress={onMessage} activeOpacity={0.75}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}>
            <Text style={cr.actionIcon}>✉</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[cr.actionBtn, cr.removeBtn]} onPress={onRemove} activeOpacity={0.75}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}>
            <Text style={cr.removeIcon}>✕</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
      {!last && <View style={cr.divider} />}
    </>
  );
}
const cr = StyleSheet.create({
  root: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 13, gap: 10,
  },
  info:    { flex: 1 },
  name:    { fontSize: 14, fontWeight: '500', color: T.inkDark },
  meta:    { fontSize: 12, color: T.inkMuted, marginTop: 2 },
  status: {
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 20,
  },
  statusTxt: { fontSize: 11, fontWeight: '600' },
  actions:   { flexDirection: 'row', gap: 6, alignItems: 'center' },
  actionBtn: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: T.forestLight,
    borderWidth: 1, borderColor: T.forestBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  removeBtn: {
    backgroundColor: 'rgba(192,65,58,0.07)',
    borderColor: 'rgba(192,65,58,0.18)',
  },
  actionIcon: { fontSize: 13, color: T.forest },
  removeIcon: { fontSize: 11, color: T.alert, fontWeight: '600' },
  divider:    { height: 1, backgroundColor: T.divider, marginHorizontal: 18 },
});

// ─────────────────────────────────────────────────────────────────────────────
// QUICK ACTION — compact pill buttons
// ─────────────────────────────────────────────────────────────────────────────
function QuickAction({
  icon, label, onPress, primary,
}: {
  icon: string; label: string; onPress: () => void; primary?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[qa.root, primary && qa.rootPrimary]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      <Text style={{ fontSize: 16 }}>{icon}</Text>
      <Text style={[qa.label, primary && qa.labelPrimary]}>{label}</Text>
    </TouchableOpacity>
  );
}
const qa = StyleSheet.create({
  root: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14,
    backgroundColor: T.cardBg,
    borderRadius: 14, borderWidth: 1, borderColor: T.cardBorder,
    shadowColor: T.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  rootPrimary: {
    backgroundColor: T.forest,
    borderColor: T.forest,
  },
  label: { fontSize: 13, fontWeight: '500', color: T.inkMid },
  labelPrimary: { color: '#F0EDE8' },
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION HEADER
// ─────────────────────────────────────────────────────────────────────────────
function SectionHeader({ title, action, onAction }: {
  title: string; action?: string; onAction?: () => void;
}) {
  return (
    <View style={sh.row}>
      <Text style={sh.title}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
          <Text style={sh.action}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
const sh = StyleSheet.create({
  row:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title:  { fontSize: 10, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase', color: T.inkMuted },
  action: { fontSize: 13, fontWeight: '500', color: T.forest },
});

// ─────────────────────────────────────────────────────────────────────────────
// ADD CLIENT MODAL
// ─────────────────────────────────────────────────────────────────────────────
function AddClientModal({
  visible, onClose, onAdd,
}: {
  visible: boolean; onClose: () => void; onAdd: (email: string) => Promise<void>;
}) {
  const [email,   setEmail]   = useState('');
  const [busy,    setBusy]    = useState(false);
  const [error,   setError]   = useState('');
  const inputRef = useRef<TextInput>(null);

  const reset = () => { setEmail(''); setBusy(false); setError(''); };

  const handleAdd = async () => {
    if (!email.trim()) { setError('Enter an email address'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Enter a valid email address'); return; }
    setBusy(true); setError('');
    try {
      await onAdd(email.trim().toLowerCase());
      reset(); onClose();
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Failed to add client');
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={m.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={m.backdrop} onPress={() => { reset(); onClose(); }} />
        <View style={m.sheet}>
          <View style={m.handle} />
          <Text style={m.title}>Add Client</Text>
          <Text style={m.subtitle}>Enter the email address of their TLC account.</Text>

          <View style={[m.fieldWrap, error ? m.fieldError : null]}>
            <TextInput
              ref={inputRef}
              style={m.input}
              value={email}
              onChangeText={v => { setEmail(v); setError(''); }}
              placeholder="client@example.com"
              placeholderTextColor={T.inkMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              editable={!busy}
              returnKeyType="done"
              onSubmitEditing={handleAdd}
            />
          </View>
          {error ? <Text style={m.errorTxt}>{error}</Text> : null}

          <TouchableOpacity
            style={[m.btn, busy && m.btnDisabled]}
            onPress={handleAdd}
            activeOpacity={0.85}
            disabled={busy}
          >
            {busy
              ? <ActivityIndicator color="#fff" />
              : <Text style={m.btnTxt}>Add Client</Text>
            }
          </TouchableOpacity>
          <TouchableOpacity style={m.cancelBtn} onPress={() => { reset(); onClose(); }} disabled={busy}>
            <Text style={m.cancelTxt}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EDIT CLIENT MODAL
// ─────────────────────────────────────────────────────────────────────────────
function EditClientModal({
  client, visible, onClose, onSave,
}: {
  client: ClientSummary | null; visible: boolean; onClose: () => void;
  onSave: (id: string, updates: { firstName?: string; lastName?: string }) => Promise<void>;
}) {
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [busy,      setBusy]      = useState(false);
  const [error,     setError]     = useState('');

  useEffect(() => {
    if (client) { setFirstName(client.firstName); setLastName(client.lastName); setError(''); }
  }, [client]);

  const handleSave = async () => {
    if (!firstName.trim()) { setError('First name is required'); return; }
    setBusy(true); setError('');
    try {
      await onSave(client!.id, { firstName: firstName.trim(), lastName: lastName.trim() });
      setBusy(false); onClose();
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Failed to update');
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={m.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={m.backdrop} onPress={onClose} />
        <View style={m.sheet}>
          <View style={m.handle} />
          <Text style={m.title}>Edit Client</Text>
          <Text style={m.subtitle}>{client?.email}</Text>

          <View style={m.nameRow}>
            <View style={[m.fieldWrap, { flex: 1 }]}>
              <TextInput
                style={m.input}
                value={firstName}
                onChangeText={v => { setFirstName(v); setError(''); }}
                placeholder="First name"
                placeholderTextColor={T.inkMuted}
                autoCapitalize="words"
                editable={!busy}
              />
            </View>
            <View style={[m.fieldWrap, { flex: 1 }]}>
              <TextInput
                style={m.input}
                value={lastName}
                onChangeText={v => { setLastName(v); setError(''); }}
                placeholder="Last name"
                placeholderTextColor={T.inkMuted}
                autoCapitalize="words"
                editable={!busy}
              />
            </View>
          </View>
          {error ? <Text style={m.errorTxt}>{error}</Text> : null}

          <TouchableOpacity
            style={[m.btn, busy && m.btnDisabled]}
            onPress={handleSave}
            activeOpacity={0.85}
            disabled={busy}
          >
            {busy
              ? <ActivityIndicator color="#fff" />
              : <Text style={m.btnTxt}>Save Changes</Text>
            }
          </TouchableOpacity>
          <TouchableOpacity style={m.cancelBtn} onPress={onClose} disabled={busy}>
            <Text style={m.cancelTxt}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Modal styles
const m = StyleSheet.create({
  overlay:  { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: T.cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    gap: 0,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: T.divider,
    alignSelf: 'center', marginBottom: 20,
  },
  title:    { fontSize: 18, fontWeight: '600', color: T.inkDark, marginBottom: 6 },
  subtitle: { fontSize: 13, color: T.inkMuted, marginBottom: 20 },
  nameRow:  { flexDirection: 'row', gap: 10, marginBottom: 16 },
  fieldWrap: {
    backgroundColor: '#FAFAF8', borderRadius: 10,
    borderWidth: 1, borderColor: T.divider,
    marginBottom: 16,
  },
  fieldError: { borderColor: T.alert },
  input: {
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 15 : 12,
    fontSize: 15, color: T.inkDark,
  },
  errorTxt: { fontSize: 13, color: T.alert, marginTop: -10, marginBottom: 14, marginLeft: 4 },
  btn: {
    height: 52, backgroundColor: T.forest,
    borderRadius: 11, alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  btnDisabled: { opacity: 0.5 },
  btnTxt: { fontSize: 15, fontWeight: '500', color: '#F0EDE8' },
  cancelBtn: { alignItems: 'center', paddingVertical: 10 },
  cancelTxt: { fontSize: 14, color: T.inkMuted },
});

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function CoachDashboardScreen() {
  const navigation = useNavigation<NavProp>();
  const { user, logout } = useAuthStore();
  const { clients, isLoading, fetchClients, addClient, removeClient, editClient } = useCoachStore();
  const [refreshing,   setRefreshing]   = useState(false);
  const [showAdd,      setShowAdd]      = useState(false);
  const [editTarget,   setEditTarget]   = useState<ClientSummary | null>(null);
  const fadeAnim = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    fetchClients();
    Animated.timing(fadeAnim, { toValue: 1, duration: 420, useNativeDriver: true }).start();
  }, [fetchClients]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchClients();
    setRefreshing(false);
  }, [fetchClients]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = clients.length;
    if (total === 0) return { total, avgGlucose: 0, avgTIR: 0, inRange: 0, watching: 0, alerts: 0 };
    const withData = clients.filter(c => c.recentStats?.avgGlucose);
    const avgGlucose = withData.length
      ? Math.round(withData.reduce((a, c) => a + (c.recentStats?.avgGlucose ?? 0), 0) / withData.length)
      : 0;
    const withTIR = clients.filter(c => c.recentStats?.timeInRange != null);
    const avgTIR = withTIR.length
      ? Math.round(withTIR.reduce((a, c) => a + (c.recentStats?.timeInRange ?? 0), 0) / withTIR.length)
      : 0;
    const inRange  = clients.filter(c => clientStatus(c) === 'ok').length;
    const watching = clients.filter(c => clientStatus(c) === 'warn').length;
    const alerts   = clients.filter(c => clientStatus(c) === 'alert').length;
    return { total, avgGlucose, avgTIR, inRange, watching, alerts };
  }, [clients]);

  // ── Greeting ───────────────────────────────────────────────────────────────
  const firstName = user?.firstName ?? 'Coach';
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // ── Navigation ────────────────────────────────────────────────────────────
  const goToClient        = (id: string)       => navigation.navigate('ClientDetail', { clientId: id });
  const goToMsg           = (c: ClientSummary) => navigation.navigate('Messaging', {
    userName: `${c.firstName} ${c.lastName}`.trim() || c.email,
  });
  const goToConversations = () => navigation.navigate('Conversations');
  const goToSettings      = () => navigation.navigate('CoachSettings');
  const goToNewLesson     = () => navigation.navigate('CreateLesson' as any, {});

  const confirmLogout = () =>
    Alert.alert('Sign out?', "You'll need to log in again.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: logout },
    ]);

  // ── Client actions ────────────────────────────────────────────────────────
  const handleRemove = (c: ClientSummary) => {
    const name = `${c.firstName} ${c.lastName}`.trim() || c.email;
    Alert.alert(
      `Remove ${name}?`,
      'They will no longer be in your client list. Their account and data are not affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: async () => {
            try { await removeClient(c.id); }
            catch (e: any) { Alert.alert('Error', e?.message || 'Failed to remove client'); }
          },
        },
      ]
    );
  };

  const handleLongPress = (c: ClientSummary) => {
    const name = `${c.firstName} ${c.lastName}`.trim() || c.email;
    Alert.alert(name, 'What would you like to do?', [
      { text: 'Edit',   onPress: () => setEditTarget(c) },
      { text: 'Remove', style: 'destructive', onPress: () => handleRemove(c) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View style={s.root}>
      <SafeAreaView style={s.safe} edges={['top']}>

        {/* ── MODALS ─────────────────────────────────────────────────── */}
        <AddClientModal
          visible={showAdd}
          onClose={() => setShowAdd(false)}
          onAdd={addClient}
        />
        <EditClientModal
          client={editTarget}
          visible={!!editTarget}
          onClose={() => setEditTarget(null)}
          onSave={editClient}
        />

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.forest} />
          }
        >
          <Animated.View style={{ opacity: fadeAnim }}>

            {/* ── HEADER ─────────────────────────────────────────────── */}
            <View style={s.header}>
              <View style={s.headerLeft}>
                <Text style={s.greet}>{greet},</Text>
                <Text style={s.name}>{firstName}</Text>
                <Text style={s.date}>{today}</Text>
              </View>
              <View style={s.headerRight}>
                {/* Add client button */}
                <TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(true)} activeOpacity={0.82}>
                  <Text style={s.addBtnTxt}>+ Client</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.iconBtn} onPress={goToConversations} activeOpacity={0.75}>
                  <Text style={s.iconBtnTxt}>✉</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.iconBtn} onPress={goToSettings} activeOpacity={0.75}>
                  <Text style={s.iconBtnTxt}>⚙</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── STAT CARDS ────────────────────────────────────────────── */}
            <View style={s.statsRow}>
              <StatCard
                label="Clients"
                value={stats.total}
                sub={stats.total === 1 ? '1 active' : `${stats.total} active`}
                accent={T.forest}
              />
              <StatCard
                label="Avg Glucose"
                value={stats.avgGlucose || '—'}
                unit={stats.avgGlucose ? 'mg/dL' : undefined}
                sub="across clients"
                accent={T.gold}
              />
              <StatCard
                label="In Range"
                value={stats.avgTIR || '—'}
                unit={stats.avgTIR ? '%' : undefined}
                sub="avg time in range"
                accent={T.ok}
              />
            </View>

            {/* ── CLIENT STATUS OVERVIEW ────────────────────────────────── */}
            {clients.length > 0 && (
              <View style={s.section}>
                <SectionHeader title="Overview" />
                <View style={s.card}>
                  <StatusRow label="In Range"        count={stats.inRange}  desc="TIR ≥ 70% — no action needed"        color={T.ok}   bg={T.okBg}   border={T.okBorder}   onPress={() => {}} />
                  <View style={s.divider} />
                  <StatusRow label="Needs Attention" count={stats.watching} desc="TIR 50–70% — worth a check-in"        color={T.warn} bg={T.warnBg} border={T.warnBorder} onPress={() => {}} />
                  <View style={s.divider} />
                  <StatusRow label="Alert"           count={stats.alerts}   desc="Low TIR or out-of-range reading"      color={T.alert} bg={T.alertBg} border={T.alertBorder} onPress={() => {}} />
                </View>
              </View>
            )}

            {/* ── CLIENT LIST ───────────────────────────────────────────── */}
            <View style={s.section}>
              <SectionHeader
                title={`${clients.length} Client${clients.length !== 1 ? 's' : ''}`}
                action="+ Add"
                onAction={() => setShowAdd(true)}
              />

              {isLoading && !refreshing ? (
                <View style={s.loadWrap}><ActivityIndicator color={T.forest} /></View>
              ) : clients.length === 0 ? (
                <TouchableOpacity style={s.emptyCard} onPress={() => setShowAdd(true)} activeOpacity={0.82}>
                  <Text style={s.emptyEmoji}>🌱</Text>
                  <Text style={s.emptyTitle}>No clients yet</Text>
                  <Text style={s.emptyDesc}>Tap to add your first client.</Text>
                  <View style={s.emptyAddBtn}>
                    <Text style={s.emptyAddTxt}>+ Add Client</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={s.card}>
                  {clients.map((c, i) => (
                    <ClientRow
                      key={c.id}
                      client={c}
                      onPress={() => goToClient(c.id)}
                      onMessage={() => goToMsg(c)}
                      onLongPress={() => handleLongPress(c)}
                      onEdit={() => setEditTarget(c)}
                      onRemove={() => handleRemove(c)}
                      last={i === clients.length - 1}
                    />
                  ))}
                </View>
              )}
            </View>

            {/* ── QUICK ACTIONS ─────────────────────────────────────────── */}
            <View style={s.section}>
              <SectionHeader title="Quick Actions" />
              <View style={s.actionsRow}>
                <QuickAction icon="＋" label="New Lesson" onPress={goToNewLesson} primary />
                <QuickAction icon="💬" label="Messages"   onPress={goToConversations} />
              </View>
            </View>

            {/* ── SIGN OUT ──────────────────────────────────────────────── */}
            <TouchableOpacity style={s.signOut} onPress={confirmLogout} activeOpacity={0.75}>
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
  content: { paddingHorizontal: 20, paddingTop: 4 },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', paddingTop: 24, paddingBottom: 24,
  },
  headerLeft: { flex: 1 },
  headerRight: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingTop: 4 },
  greet: { fontSize: 13, color: T.inkMuted, fontWeight: '400' },
  name: { fontSize: 28, fontWeight: '300', color: T.inkDark, letterSpacing: -0.5, marginTop: 2 },
  date: { fontSize: 12, color: T.inkMuted, marginTop: 4 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: T.cardBg, borderWidth: 1, borderColor: T.cardBorder,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: T.shadow, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  iconBtnTxt: { fontSize: 15, color: T.inkMid },
  addBtn: {
    height: 34, paddingHorizontal: 14, borderRadius: 9,
    backgroundColor: T.forest,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnTxt: { fontSize: 13, fontWeight: '600', color: '#F0EDE8' },

  // Stat cards row
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },

  // Section
  section:  { marginBottom: 24 },
  loadWrap: { paddingVertical: 32, alignItems: 'center' },

  // Card wrapper — used for client list and status overview
  card: {
    backgroundColor: T.cardBg,
    borderRadius: 16, borderWidth: 1, borderColor: T.cardBorder,
    overflow: 'hidden',
    shadowColor: T.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  divider: { height: 1, backgroundColor: T.divider, marginHorizontal: 18 },

  // Empty state
  emptyCard: {
    backgroundColor: T.cardBg, borderRadius: 16,
    borderWidth: 1, borderColor: T.cardBorder,
    padding: 36, alignItems: 'center', gap: 8,
    shadowColor: T.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  emptyEmoji: { fontSize: 32, marginBottom: 4 },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: T.inkDark },
  emptyDesc:  { fontSize: 13, color: T.inkMuted, textAlign: 'center', lineHeight: 19 },
  emptyAddBtn: {
    marginTop: 16, height: 42, paddingHorizontal: 24,
    backgroundColor: T.forest, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyAddTxt: { fontSize: 14, fontWeight: '500', color: '#F0EDE8' },

  // Quick actions
  actionsRow: { flexDirection: 'row', gap: 12 },

  // Sign out
  signOut: { alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 28, marginBottom: 8 },
  signOutTxt: { fontSize: 13, fontWeight: '400', color: 'rgba(192,65,58,0.5)', letterSpacing: 0.2 },
});
