// mobile-app/src/screens/HealthSyncScreen.tsx
// Unified health-sync screen for iOS (Apple Health / HealthKit) and
// Android (Google Health Connect). Each platform gets its own component;
// the exported HealthSyncScreen just picks the right one.

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
import { healthConnectService, SdkStatus } from '../services/healthconnect.service';
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
  return date.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

// ─── Entry point ─────────────────────────────────────────────────────────────

export const HealthSyncScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  if (Platform.OS === 'android') {
    return <AndroidHealthSync navigation={navigation} />;
  }
  return <IOSHealthSync navigation={navigation} />;
};

// ─────────────────────────────────────────────────────────────────────────────
// iOS — Apple Health / HealthKit
// ─────────────────────────────────────────────────────────────────────────────

function IOSHealthSync({ navigation }: { navigation: any }) {
  const [status,   setStatus]   = useState<SyncStatus>('idle');
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [autoSync, setAutoSync] = useState(false);
  const [result,   setResult]   = useState<SyncResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [hkReady,  setHkReady]  = useState(false);

  useEffect(() => {
    (async () => {
      const [storedRaw, autoEnabled] = await Promise.all([
        SecureStore.getItemAsync('healthkit_last_sync'),
        healthKitService.getAutoSyncEnabled(),
      ]);
      setLastSync(storedRaw ? new Date(storedRaw) : null);
      setAutoSync(autoEnabled);
      const ok = await healthKitService.initialize();
      setHkReady(ok);
      if (ok && autoEnabled) healthKitService.startAutoSync(15);
    })();
  }, []);

  const requestPermissions = useCallback(async () => {
    setStatus('requesting');
    setErrorMsg('');
    try {
      const granted = await healthKitService.requestPermissions();
      if (granted) { setHkReady(true); setStatus('idle'); }
      else {
        setStatus('unauthorized');
        setErrorMsg('Permission denied. Enable it in Settings → Health → Data Access & Devices.');
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err?.message || 'Failed to request permissions.');
    }
  }, []);

  const runSync = useCallback(async () => {
    if (!hkReady) { await requestPermissions(); return; }
    setStatus('syncing'); setResult(null); setErrorMsg('');
    try {
      const res = await healthKitService.syncToBackend();
      setResult(res); setLastSync(new Date()); setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err?.response?.data?.error || err?.message || 'Sync failed. Check your connection.');
    }
  }, [hkReady, requestPermissions]);

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

  const isBusy = status === 'syncing' || status === 'requesting';

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <SyncHeader title="Apple Health" onBack={() => navigation.goBack()} />
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        <HeroCard
          icon={hkReady ? 'heart' : 'heart-outline'}
          iconActive={hkReady}
          title={
            !hkReady     ? 'Connect Apple Health' :
            status === 'syncing'  ? 'Syncing…' :
            status === 'success'  ? 'Sync Complete' :
            status === 'error'    ? 'Sync Failed' :
            'Apple Health Connected'
          }
          subtitle={
            !hkReady ? 'Authorize TLC to read your blood glucose from Apple Health and Apple Watch.' :
            status === 'syncing'  ? 'Uploading your readings to TLC…' :
            status === 'success' && result
              ? `${result.synced} new reading${result.synced !== 1 ? 's' : ''} uploaded · ${result.skipped} already saved`
            : status === 'error'  ? errorMsg
            : `Last synced: ${relativeTime(lastSync)}`
          }
          ctaLabel={!hkReady ? 'Authorize Apple Health' : 'Sync Now'}
          ctaIcon={hkReady ? 'sync' : 'lock-open-outline'}
          isBusy={isBusy}
          onCta={hkReady ? runSync : requestPermissions}
        />

        <AlertBanners status={status} result={result} />

        {hkReady && (
          <SyncSettings
            autoSync={autoSync}
            onToggleAutoSync={toggleAutoSync}
            onFullResync={confirmFullResync}
          />
        )}

        <WhatGetsSynced
          bullets={[
            { icon: 'watch-outline',          text: 'Blood glucose from Apple Watch or any connected CGM' },
            { icon: 'cloud-upload-outline',   text: 'New readings only — existing data is never duplicated' },
            { icon: 'people-outline',         text: 'Synced data is visible to your coach' },
            { icon: 'lock-closed-outline',    text: 'Revoke access any time in Settings → Health' },
          ]}
        />
        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Android — Google Health Connect
// ─────────────────────────────────────────────────────────────────────────────

function AndroidHealthSync({ navigation }: { navigation: any }) {
  const [status,    setStatus]    = useState<SyncStatus>('idle');
  const [sdkStatus, setSdkStatus] = useState<SdkStatus | null>(null);
  const [lastSync,  setLastSync]  = useState<Date | null>(null);
  const [autoSync,  setAutoSync]  = useState(false);
  const [result,    setResult]    = useState<SyncResult | null>(null);
  const [errorMsg,  setErrorMsg]  = useState('');
  const [hcReady,   setHcReady]   = useState(false);

  useEffect(() => {
    (async () => {
      const [sdkStat, storedRaw, autoEnabled] = await Promise.all([
        healthConnectService.getSdkStatus(),
        SecureStore.getItemAsync('hc_last_sync'),
        healthConnectService.getAutoSyncEnabled(),
      ]);
      setSdkStatus(sdkStat);
      setLastSync(storedRaw ? new Date(storedRaw) : null);
      setAutoSync(autoEnabled);

      if (sdkStat === 'available') {
        const ok = await healthConnectService.initialize();
        setHcReady(ok);
        if (ok && autoEnabled) healthConnectService.startAutoSync(15);
      }
    })();
  }, []);

  const requestPermissions = useCallback(async () => {
    setStatus('requesting'); setErrorMsg('');
    try {
      const granted = await healthConnectService.requestPermissions();
      if (granted) { setHcReady(true); setStatus('idle'); }
      else {
        setStatus('unauthorized');
        setErrorMsg('Permission denied. Open Health Connect → App permissions to grant access.');
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err?.message || 'Failed to request permissions.');
    }
  }, []);

  const runSync = useCallback(async () => {
    if (!hcReady) { await requestPermissions(); return; }
    setStatus('syncing'); setResult(null); setErrorMsg('');
    try {
      const res = await healthConnectService.syncToBackend();
      setResult(res); setLastSync(new Date()); setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err?.response?.data?.error || err?.message || 'Sync failed. Check your connection.');
    }
  }, [hcReady, requestPermissions]);

  const toggleAutoSync = useCallback(async (value: boolean) => {
    setAutoSync(value);
    await healthConnectService.setAutoSyncEnabled(value);
    if (value) {
      if (!hcReady) {
        const granted = await healthConnectService.requestPermissions();
        if (!granted) { setAutoSync(false); await healthConnectService.setAutoSyncEnabled(false); return; }
        setHcReady(true);
      }
      healthConnectService.startAutoSync(15);
    } else {
      healthConnectService.stopAutoSync();
    }
  }, [hcReady]);

  const confirmFullResync = () => {
    Alert.alert(
      'Full Re-sync',
      'Re-fetch all readings from the last 7 days and re-upload any not already saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Re-sync',
          onPress: async () => {
            await healthConnectService.clearLastSyncTime();
            setLastSync(null);
            await runSync();
          },
        },
      ]
    );
  };

  const isBusy = status === 'syncing' || status === 'requesting';

  // ── Not supported (very old Android) ────────────────────────────────────
  if (sdkStatus === 'not_supported') {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <SyncHeader title="Health Connect" onBack={() => navigation.goBack()} />
        <View style={s.center}>
          <Ionicons name="phone-portrait-outline" size={52} color={colors.textSecondary} />
          <Text style={s.bigTitle}>Not Supported</Text>
          <Text style={s.subtitle}>
            Health Connect requires Android 9 or higher. Please update your device to use this feature.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Health Connect app not installed ─────────────────────────────────────
  if (sdkStatus === 'not_installed') {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <SyncHeader title="Health Connect" onBack={() => navigation.goBack()} />
        <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <View style={s.heroCard}>
            <View style={s.heroIcon}>
              <Ionicons name="heart-circle-outline" size={32} color={colors.textSecondary} />
            </View>
            <Text style={s.heroTitle}>Health Connect Required</Text>
            <Text style={s.heroSub}>
              Install the free Health Connect app from Google Play to sync your blood glucose data with TLC.
            </Text>
            <TouchableOpacity
              style={s.syncBtn}
              onPress={() => healthConnectService.openPlayStore()}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-google-playstore" size={18} color="#fff" />
              <Text style={s.syncBtnTxt}>Get Health Connect</Text>
            </TouchableOpacity>
          </View>
          <WhatGetsSynced
            bullets={[
              { icon: 'fitness-outline',        text: 'Reads blood glucose from any Health Connect-compatible app or device' },
              { icon: 'cloud-upload-outline',   text: 'Uploads only new readings — no duplicates' },
              { icon: 'people-outline',         text: 'Your coach can see your readings in real time' },
              { icon: 'lock-closed-outline',    text: 'You control access — revoke any time in Health Connect settings' },
            ]}
          />
          <View style={{ height: 48 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Normal flow (SDK available) ──────────────────────────────────────────
  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <SyncHeader title="Health Connect" onBack={() => navigation.goBack()} />
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        <HeroCard
          icon={hcReady ? 'heart' : 'heart-outline'}
          iconActive={hcReady}
          title={
            !hcReady              ? 'Connect Health Connect' :
            status === 'syncing'  ? 'Syncing…' :
            status === 'success'  ? 'Sync Complete' :
            status === 'error'    ? 'Sync Failed' :
            'Health Connect Connected'
          }
          subtitle={
            !hcReady
              ? 'Authorize TLC to read your blood glucose from Google Health Connect.'
            : status === 'syncing'
              ? 'Uploading your readings to TLC…'
            : status === 'success' && result
              ? `${result.synced} new reading${result.synced !== 1 ? 's' : ''} uploaded · ${result.skipped} already saved`
            : status === 'error'
              ? errorMsg
            : `Last synced: ${relativeTime(lastSync)}`
          }
          ctaLabel={!hcReady ? 'Authorize Health Connect' : 'Sync Now'}
          ctaIcon={hcReady ? 'sync' : 'lock-open-outline'}
          isBusy={isBusy}
          onCta={hcReady ? runSync : requestPermissions}
        />

        {/* Manage via Health Connect settings */}
        {hcReady && (
          <TouchableOpacity
            style={s.openSettingsRow}
            onPress={() => healthConnectService.openSettings()}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={16} color={colors.primary} />
            <Text style={s.openSettingsTxt}>Manage permissions in Health Connect</Text>
            <Ionicons name="open-outline" size={14} color={colors.textSecondary} />
          </TouchableOpacity>
        )}

        <AlertBanners status={status} result={result} />

        {hcReady && (
          <SyncSettings
            autoSync={autoSync}
            onToggleAutoSync={toggleAutoSync}
            onFullResync={confirmFullResync}
          />
        )}

        <WhatGetsSynced
          bullets={[
            { icon: 'fitness-outline',        text: 'Blood glucose from any Health Connect compatible app or CGM' },
            { icon: 'cloud-upload-outline',   text: 'New readings only — existing data is never duplicated' },
            { icon: 'people-outline',         text: 'Synced data is visible to your coach' },
            { icon: 'lock-closed-outline',    text: 'Revoke access any time in Health Connect → App permissions' },
          ]}
        />
        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared sub-components
// ─────────────────────────────────────────────────────────────────────────────

function SyncHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={s.header}>
      <TouchableOpacity
        onPress={onBack}
        style={s.backBtn}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="chevron-back" size={22} color={colors.primary} />
        <Text style={s.backTxt}>Back</Text>
      </TouchableOpacity>
      <Text style={s.headerTitle}>{title}</Text>
      <View style={{ width: 70 }} />
    </View>
  );
}

function HeroCard({
  icon, iconActive, title, subtitle, ctaLabel, ctaIcon, isBusy, onCta,
}: {
  icon:       string;
  iconActive: boolean;
  title:      string;
  subtitle:   string;
  ctaLabel:   string;
  ctaIcon:    string;
  isBusy:     boolean;
  onCta:      () => void;
}) {
  return (
    <View style={s.heroCard}>
      <View style={[s.heroIcon, iconActive && s.heroIconActive]}>
        <Ionicons
          name={icon as any}
          size={28}
          color={iconActive ? colors.primary : colors.textSecondary}
        />
      </View>
      <Text style={s.heroTitle}>{title}</Text>
      <Text style={s.heroSub}>{subtitle}</Text>
      <TouchableOpacity
        style={[s.syncBtn, isBusy && s.syncBtnDisabled]}
        onPress={onCta}
        activeOpacity={0.8}
        disabled={isBusy}
      >
        {isBusy
          ? <ActivityIndicator color="#fff" />
          : (
            <>
              <Ionicons name={ctaIcon as any} size={18} color="#fff" />
              <Text style={s.syncBtnTxt}>{ctaLabel}</Text>
            </>
          )
        }
      </TouchableOpacity>
    </View>
  );
}

function AlertBanners({
  status, result,
}: {
  status: SyncStatus;
  result: SyncResult | null;
}) {
  if (status !== 'success' || !result || result.alerts.length === 0) return null;
  return (
    <View style={s.section}>
      <Text style={s.sectionLabel}>READINGS FLAGGED</Text>
      {result.alerts.map((a, i) => (
        <View
          key={i}
          style={[s.alertRow, a.severity === 'critical' ? s.alertCritical : s.alertWarning]}
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
  );
}

function SyncSettings({
  autoSync, onToggleAutoSync, onFullResync,
}: {
  autoSync:          boolean;
  onToggleAutoSync:  (v: boolean) => void;
  onFullResync:      () => void;
}) {
  return (
    <View style={s.section}>
      <Text style={s.sectionLabel}>SETTINGS</Text>
      <View style={s.settingsCard}>
        <View style={s.settingRow}>
          <View style={s.settingText}>
            <Text style={s.settingTitle}>Background Sync</Text>
            <Text style={s.settingSub}>Sync automatically every 15 minutes</Text>
          </View>
          <Switch
            value={autoSync}
            onValueChange={onToggleAutoSync}
            trackColor={{ false: colors.border, true: colors.primary + '66' }}
            thumbColor={autoSync ? colors.primary : '#ccc'}
            ios_backgroundColor={colors.border}
          />
        </View>
        <View style={s.divider} />
        <TouchableOpacity style={s.settingRow} onPress={onFullResync} activeOpacity={0.7}>
          <View style={s.settingText}>
            <Text style={s.settingTitle}>Full Re-sync (Last 7 Days)</Text>
            <Text style={s.settingSub}>Re-fetch all readings — skips duplicates</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function WhatGetsSynced({
  bullets,
}: {
  bullets: Array<{ icon: string; text: string }>;
}) {
  return (
    <View style={s.section}>
      <Text style={s.sectionLabel}>WHAT GETS SYNCED</Text>
      <View style={s.infoCard}>
        {bullets.map((item, i) => (
          <View key={i} style={[s.bulletRow, i > 0 && { marginTop: 12 }]}>
            <View style={s.bulletIcon}>
              <Ionicons name={item.icon as any} size={17} color={colors.primary} />
            </View>
            <Text style={s.bulletTxt}>{item.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#F0EBE0' },
  scroll:  { flex: 1 },
  content: { padding: 20 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.07)',
  },
  backBtn:     { flexDirection: 'row', alignItems: 'center', gap: 2, minWidth: 70 },
  backTxt:     { fontSize: 16, color: colors.primary, fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1C1F1C' },

  heroCard: {
    backgroundColor: '#fff',
    borderRadius: 20, padding: 24, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
    marginBottom: 20,
  },
  heroIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  heroIconActive: { backgroundColor: colors.primaryLight ?? 'rgba(61,85,64,0.1)' },
  heroTitle:      { fontSize: 20, fontWeight: '700', color: '#1C1F1C', marginBottom: 8, textAlign: 'center' },
  heroSub: {
    fontSize: 14, color: '#8E918E', textAlign: 'center',
    lineHeight: 20, marginBottom: 24, paddingHorizontal: 8,
  },
  syncBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.primary ?? '#3D5540',
    paddingVertical: 14, paddingHorizontal: 32,
    borderRadius: 14, minWidth: 200, justifyContent: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  syncBtnDisabled: { opacity: 0.6 },
  syncBtnTxt:      { fontSize: 16, fontWeight: '700', color: '#fff' },

  openSettingsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff',
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)',
    paddingHorizontal: 16, paddingVertical: 12,
    marginBottom: 16,
  },
  openSettingsTxt: { flex: 1, fontSize: 14, color: colors.primary, fontWeight: '500' },

  alertRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: 12, marginBottom: 8,
  },
  alertWarning:     { backgroundColor: 'rgba(184,151,90,0.12)', borderWidth: 1, borderColor: 'rgba(184,151,90,0.3)' },
  alertCritical:    { backgroundColor: 'rgba(200,90,84,0.10)', borderWidth: 1, borderColor: 'rgba(200,90,84,0.3)' },
  alertTxt:         { flex: 1, fontSize: 14, color: '#555855' },
  alertTxtCritical: { color: '#C85A54', fontWeight: '600' },
  alertNote:        { fontSize: 12, color: '#8E918E', marginTop: 4, fontStyle: 'italic' },

  section:      { marginBottom: 20 },
  sectionLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.4,
    color: '#8E918E', marginBottom: 10, textTransform: 'uppercase',
  },

  settingsCard: {
    backgroundColor: '#fff', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 14, gap: 14,
  },
  settingText:  { flex: 1 },
  settingTitle: { fontSize: 15, fontWeight: '600', color: '#1C1F1C' },
  settingSub:   { fontSize: 12, color: '#8E918E', marginTop: 2 },
  divider:      { height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginHorizontal: 18 },

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

  center:   { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  bigTitle: { fontSize: 24, fontWeight: '700', color: '#1C1F1C', marginTop: 20, marginBottom: 12 },
  subtitle: { fontSize: 15, color: '#8E918E', textAlign: 'center', lineHeight: 22 },
});
