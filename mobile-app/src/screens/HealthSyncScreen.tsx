// mobile-app/src/screens/HealthSyncScreen.tsx
// Apple Watch / HealthKit sync screen — fully functional

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { healthKitService, SyncResult } from '../services/healthkit.service';
import { colors } from '../theme/colors';

// ─── Types ────────────────────────────────────────────────────────────────────

type SyncStatus =
  | 'idle'
  | 'requesting'
  | 'syncing'
  | 'success'
  | 'error'
  | 'unauthorized';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relativeTime(date: Date | null): string {
  if (!date) return 'Never';
  const diffMs  = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1)  return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24)  return `${diffHr}h ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

// ─── iOS-only guard ───────────────────────────────────────────────────────────

function AndroidPlaceholder({ onBack }: { onBack: () => void }) {
  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn} hitSlop={{ top:10,bottom:10,left:10,right:10 }}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
          <Text style={s.backTxt}>Back</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Apple Health</Text>
        <View style={{ width: 70 }} />
      </View>
      <View style={s.center}>
        <Ionicons name="logo-apple" size={56} color={colors.textSecondary} />
        <Text style={s.bigTitle}>iOS Only</Text>
        <Text style={s.subtitle}>Apple Health sync is available on iPhone and Apple Watch (iOS devices only).</Text>
      </View>
    </SafeAreaView>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export const HealthSyncScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  if (Platform.OS !== 'ios') {
    return <AndroidPlaceholder onBack={() => navigation.goBack()} />;
  }

  const [status,      setStatus]      = useState<SyncStatus>('idle');
  const [lastSync,    setLastSync]    = useState<Date | null>(null);
  const [autoSync,    setAutoSync]    = useState(false);
  const [result,      setResult]      = useState<SyncResult | null>(null);
  const [errorMsg,    setErrorMsg]    = useState('');
  const [hkReady,     setHkReady]     = useState(false);

  // ── Bootstrap: load persisted prefs ────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const [storedRaw, autoEnabled] = await Promise.all([
        SecureStore.getItemAsync('healthkit_last_sync'),
        healthKitService.getAutoSyncEnabled(),
      ]);
      setLastSync(storedRaw ? new Date(storedRaw) : null);
      setAutoSync(autoEnabled);

      // Check if HealthKit is already authorized
      const ok = await healthKitService.initialize();
      setHkReady(ok);
      if (ok && autoEnabled) {
        healthKitService.startAutoSync(15);
      }
    })();

    return () => {
      // Don't stop auto-sync on unmount — let it run in background
    };
  }, []);

  // ── Request permissions ─────────────────────────────────────────────────────
  const requestPermissions = useCallback(async () => {
    setStatus('requesting');
    setErrorMsg('');
    try {
      const granted = await healthKitService.requestPermissions();
      if (granted) {
        setHkReady(true);
        setStatus('idle');
      } else {
        setStatus('unauthorized');
        setErrorMsg('Permission denied. You can enable it in Settings → Health → Data Access & Devices.');
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err?.message || 'Failed to request permissions.');
    }
  }, []);

  // ── Manual sync ─────────────────────────────────────────────────────────────
  const runSync = useCallback(async () => {
    if (!hkReady) {
      await requestPermissions();
      return;
    }
    setStatus('syncing');
    setResult(null);
    setErrorMsg('');
    try {
      const res = await healthKitService.syncToBackend();
      setResult(res);
      setLastSync(new Date());
      setStatus('success');
    } catch (err: any) {
      console.error('Sync error:', err);
      setStatus('error');
      setErrorMsg(err?.response?.data?.error || err?.message || 'Sync failed. Check your connection.');
    }
  }, [hkReady, requestPermissions]);

  // ── Auto-sync toggle ────────────────────────────────────────────────────────
  const toggleAutoSync = useCallback(async (value: boolean) => {
    setAutoSync(value);
    await healthKitService.setAutoSyncEnabled(value);
    if (value) {
      if (!hkReady) {
        const granted = await healthKitService.requestPermissions();
        if (!granted) { setAutoSync(false); await healthKitService.setAutoSyncEnabled(false); return; }
        setHkReady(true);
      }
      healthKitService.startAutoSync(15);
    } else {
      healthKitService.stopAutoSync();
    }
  }, [hkReady]);

  // ── Reset for full re-sync ──────────────────────────────────────────────────
  const confirmFullResync = () => {
    Alert.alert(
      'Full Re-sync',
      'This will fetch up to 1,000 readings from the last 7 days and re-upload any not already saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Re-sync',
          onPress: async () => {
            await healthKitService.clearLastSyncTime();
            setLastSync(null);
            await runSync();
          },
        },
      ]
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  const isBusy = status === 'syncing' || status === 'requesting';

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} hitSlop={{ top:10,bottom:10,left:10,right:10 }}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
          <Text style={s.backTxt}>Back</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Apple Watch Sync</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* ── Status card ──────────────────────────────────────────────────── */}
        <View style={s.heroCard}>
          {/* Icon */}
          <View style={[s.heroIcon, hkReady && s.heroIconActive]}>
            <Ionicons
              name={hkReady ? 'heart' : 'heart-outline'}
              size={28}
              color={hkReady ? colors.primary : colors.textSecondary}
            />
          </View>

          <Text style={s.heroTitle}>
            {!hkReady
              ? 'Connect Apple Health'
              : status === 'syncing'
              ? 'Syncing…'
              : status === 'success'
              ? 'Sync Complete'
              : status === 'error'
              ? 'Sync Failed'
              : 'Apple Health Connected'}
          </Text>

          <Text style={s.heroSub}>
            {!hkReady
              ? 'Authorize GraceFlow to read your blood glucose from Apple Health and Apple Watch.'
              : status === 'syncing'
              ? 'Uploading your readings to GraceFlow…'
              : status === 'success' && result
              ? `${result.synced} new reading${result.synced !== 1 ? 's' : ''} uploaded · ${result.skipped} already saved`
              : status === 'error'
              ? errorMsg
              : `Last synced: ${relativeTime(lastSync)}`}
          </Text>

          {/* Main CTA */}
          <TouchableOpacity
            style={[s.syncBtn, isBusy && s.syncBtnDisabled]}
            onPress={hkReady ? runSync : requestPermissions}
            activeOpacity={0.8}
            disabled={isBusy}
          >
            {isBusy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name={hkReady ? 'sync' : 'lock-open-outline'} size={18} color="#fff" />
                <Text style={s.syncBtnTxt}>
                  {!hkReady ? 'Authorize Apple Health' : 'Sync Now'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Alert banners after sync ──────────────────────────────────────── */}
        {status === 'success' && result && result.alerts.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>READINGS FLAGGED</Text>
            {result.alerts.map((a, i) => (
              <View
                key={i}
                style={[
                  s.alertRow,
                  a.severity === 'critical' ? s.alertCritical : s.alertWarning,
                ]}
              >
                <Ionicons
                  name={a.severity === 'critical' ? 'warning' : 'alert-circle-outline'}
                  size={18}
                  color={a.severity === 'critical' ? '#C85A54' : '#B8975A'}
                />
                <Text style={[s.alertTxt, a.severity === 'critical' && s.alertTxtCritical]}>
                  {a.type === 'high_glucose' ? 'High' : 'Low'} glucose: {a.value} mg/dL
                  {a.severity === 'critical' ? ' — Critical' : ''}
                </Text>
              </View>
            ))}
            <Text style={s.alertNote}>Your coach has been notified about these readings.</Text>
          </View>
        )}

        {/* ── Settings ─────────────────────────────────────────────────────── */}
        {hkReady && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>SETTINGS</Text>

            <View style={s.settingsCard}>
              {/* Auto-sync row */}
              <View style={s.settingRow}>
                <View style={s.settingText}>
                  <Text style={s.settingTitle}>Background Sync</Text>
                  <Text style={s.settingSub}>Sync automatically every 15 minutes</Text>
                </View>
                <Switch
                  value={autoSync}
                  onValueChange={toggleAutoSync}
                  trackColor={{ false: colors.border, true: colors.primary + '66' }}
                  thumbColor={autoSync ? colors.primary : '#ccc'}
                  ios_backgroundColor={colors.border}
                />
              </View>

              <View style={s.divider} />

              {/* Full re-sync row */}
              <TouchableOpacity style={s.settingRow} onPress={confirmFullResync} activeOpacity={0.7}>
                <View style={s.settingText}>
                  <Text style={s.settingTitle}>Full Re-sync (Last 7 Days)</Text>
                  <Text style={s.settingSub}>Re-fetch all readings — skips duplicates</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── What gets synced ──────────────────────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>WHAT GETS SYNCED</Text>
          <View style={s.infoCard}>
            {[
              { icon: 'water-outline',         text: 'Blood glucose readings from Apple Watch or any connected CGM' },
              { icon: 'cloud-upload-outline',   text: 'New readings only — existing data is never duplicated' },
              { icon: 'people-outline',         text: 'Synced data is visible to your coach so they can guide you' },
              { icon: 'lock-closed-outline',    text: 'Only you control sharing — revoke access any time in Settings → Health' },
            ].map((item, i) => (
              <View key={i} style={[s.bulletRow, i > 0 && { marginTop: 12 }]}>
                <View style={s.bulletIcon}>
                  <Ionicons name={item.icon as any} size={17} color={colors.primary} />
                </View>
                <Text style={s.bulletTxt}>{item.text}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:  { flex: 1, backgroundColor: '#F0EBE0' },
  scroll: { flex: 1 },
  content: { padding: 20 },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.07)',
  },
  backBtn:  { flexDirection: 'row', alignItems: 'center', gap: 2, minWidth: 70 },
  backTxt:  { fontSize: 16, color: colors.primary, fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1C1F1C' },

  // Hero card
  heroCard: {
    backgroundColor: '#fff',
    borderRadius: 20, padding: 24,
    alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)',
    shadowColor: '#000', shadowOffset: { width:0, height:2 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
    marginBottom: 20,
  },
  heroIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  heroIconActive: {
    backgroundColor: colors.primaryLight ?? 'rgba(61,85,64,0.1)',
  },
  heroTitle: {
    fontSize: 20, fontWeight: '700', color: '#1C1F1C',
    marginBottom: 8, textAlign: 'center',
  },
  heroSub: {
    fontSize: 14, color: '#8E918E', textAlign: 'center',
    lineHeight: 20, marginBottom: 24, paddingHorizontal: 8,
  },
  syncBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.primary ?? '#3D5540',
    paddingVertical: 14, paddingHorizontal: 32,
    borderRadius: 14, minWidth: 200, justifyContent: 'center',
    shadowColor: colors.primary, shadowOffset: { width:0, height:4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  syncBtnDisabled: { opacity: 0.6 },
  syncBtnTxt: { fontSize: 16, fontWeight: '700', color: '#fff' },

  // Alerts
  alertRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: 12, marginBottom: 8,
  },
  alertWarning:  { backgroundColor: 'rgba(184,151,90,0.12)', borderWidth: 1, borderColor: 'rgba(184,151,90,0.3)' },
  alertCritical: { backgroundColor: 'rgba(200,90,84,0.10)', borderWidth: 1, borderColor: 'rgba(200,90,84,0.3)' },
  alertTxt:      { flex: 1, fontSize: 14, color: '#555855' },
  alertTxtCritical: { color: '#C85A54', fontWeight: '600' },
  alertNote:     { fontSize: 12, color: '#8E918E', marginTop: 4, fontStyle: 'italic' },

  // Sections
  section:      { marginBottom: 20 },
  sectionLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.4,
    color: '#8E918E', marginBottom: 10, textTransform: 'uppercase',
  },

  // Settings card
  settingsCard: {
    backgroundColor: '#fff', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)',
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 14, gap: 14,
  },
  settingText: { flex: 1 },
  settingTitle: { fontSize: 15, fontWeight: '600', color: '#1C1F1C' },
  settingSub:   { fontSize: 12, color: '#8E918E', marginTop: 2 },
  divider:      { height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginHorizontal: 18 },

  // Info card
  infoCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)',
  },
  bulletRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  bulletIcon: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: colors.primaryLight ?? 'rgba(61,85,64,0.1)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  bulletTxt: { flex: 1, fontSize: 14, color: '#555855', lineHeight: 20 },

  // iOS-only screen
  center: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: 40,
  },
  bigTitle: { fontSize: 24, fontWeight: '700', color: '#1C1F1C', marginTop: 20, marginBottom: 12 },
  subtitle: { fontSize: 15, color: '#8E918E', textAlign: 'center', lineHeight: 22 },
});
