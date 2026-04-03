// mobile-app/src/screens/DashboardScreen.tsx
// BUILD 3: Home screen hierarchy refactor
// Primary → Log Today | Secondary → Program/Guidance | Tertiary → Stats
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useAuthStore } from '../stores/authStore';
import { useGlucoseStore } from '../stores/glucoseStore';
import { useCycleStore } from '../stores/cycleStore';
import { useSymptomStore } from '../stores/symptomStore';
import { colors } from '../theme/colors';
import * as SecureStore from 'expo-secure-store';
import { BotanicalBackground } from '../components/BotanicalBackground';
import { SignalRingThin } from '../components/SimpleIcons';
import { RhythmCard } from '../components/RhythmCard';
import { CYCLE_PROFILE_KEY, CycleProfile } from './RhythmProfileScreen';
import { QuickLogActions } from '../components/QuickLogActions';
import { ViewingBanner } from '../components/ViewingBanner';

const API_BASE = process.env.EXPO_PUBLIC_API_URL;
if (!API_BASE) throw new Error('Missing EXPO_PUBLIC_API_URL');

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;
};

export default function DashboardScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const { readings, stats, fetchReadings, fetchStats } = useGlucoseStore();
  const { currentCycle, fetchCurrentCycle } = useCycleStore();
  const { symptoms, fetchSymptoms } = useSymptomStore();

  const safeReadings = Array.isArray(readings) ? readings : [];
  const safeSymptoms = Array.isArray(symptoms) ? symptoms : [];

  const [refreshing, setRefreshing] = useState(false);
  const [cycleTrackingEnabled, setCycleTrackingEnabled] = useState(true);
  const [cycleProfile, setCycleProfile] = useState<CycleProfile>('regular');
  const [groupMembership, setGroupMembership] = useState<any>(null);

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener('focus', loadSettings);
    return unsub;
  }, [navigation]);

  const loadAll = async () => {
    await Promise.all([
      fetchReadings(),
      fetchStats(),
      fetchCurrentCycle(),
      fetchSymptoms(),
      loadSettings(),
      loadGroupMembership(),
    ]);
  };

  const loadSettings = async () => {
    const enabled = await SecureStore.getItemAsync('cycleTrackingEnabled');
    setCycleTrackingEnabled(enabled !== 'false');
    const profile = await SecureStore.getItemAsync(CYCLE_PROFILE_KEY);
    if (profile) setCycleProfile(profile as CycleProfile);
  };

  const loadGroupMembership = async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      const res = await fetch(`${API_BASE}/groups/my-membership`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.membership) {
        setGroupMembership(data.membership);
        return;
      }
      // Silent auto-enroll
      try {
        await fetch(`${API_BASE}/groups/join`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessCode: 'HFR-FEB2025', paymentType: 'founding' }),
        });
        const retry = await fetch(`${API_BASE}/groups/my-membership`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const retryData = await retry.json();
        if (retryData.membership) setGroupMembership(retryData.membership);
      } catch { /* silent fail */ }
    } catch {
      setGroupMembership(null);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  // ── Derived values ────────────────────────────────────────────────────────
  const avg = Math.round(stats?.average || stats?.avgGlucose || 0);
  const inRange = Math.round(stats?.in_range_percentage || stats?.timeInRange || 0);
  const latestReading = safeReadings[0];
  const latestVal = latestReading
    ? (latestReading.value ?? latestReading.glucose_level ?? 0)
    : null;

  const glucoseColor =
    latestVal == null ? colors.textMuted
    : latestVal < 70  ? '#E05C5C'
    : latestVal > 180 ? '#E09A3A'
    : colors.forestGreen;

  const getSeverityColor = (s: number) =>
    s <= 3 ? 'rgba(107,127,110,0.5)'
    : s <= 6 ? 'rgba(184,164,95,0.7)'
    : 'rgba(139,111,71,0.8)';

  const navigateToGroupChat = () => {
    if (!groupMembership) return;
    navigation.getParent<any>()?.navigate('GroupChat', {
      groupId: groupMembership.group_id,
      groupName: '12-Week Metabolic Reset',
    });
  };

  return (
    <BotanicalBackground variant="3d" intensity="medium">
      <View style={styles.container}>
        <ViewingBanner />

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.greetingContainer}>
            <SignalRingThin size={20} muted="rgba(107,127,110,0.15)" />
            <View>
              <Text style={styles.greetingLight}>Hello</Text>
              <Text style={styles.greetingBold}>{user?.firstName || 'there'}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.iconGlyph}>⚙️</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6B7F6E" />
          }
        >

          {/* ── PRIMARY: Log Today ── */}
          <QuickLogActions
            onLogGlucose={() => navigation.navigate('AddGlucose')}
            onLogSymptoms={() => navigation.navigate('AddSymptom')}
            onLogCycle={() => navigation.navigate('LogCycle')}
          />

          {/* ── SECONDARY: Glucose snapshot — compact, not a full card ── */}
          {(latestVal !== null || avg > 0) && (
            <View style={styles.glucoseSnapshot}>
              <View style={styles.snapshotLeft}>
                <Text style={styles.snapshotLabel}>LATEST GLUCOSE</Text>
                <View style={styles.snapshotValueRow}>
                  <Text style={[styles.snapshotValue, { color: glucoseColor }]}>
                    {latestVal ?? avg}
                  </Text>
                  <Text style={styles.snapshotUnit}>mg/dL</Text>
                </View>
              </View>
              <View style={styles.snapshotDivider} />
              <View style={styles.snapshotRight}>
                <View style={styles.snapshotStat}>
                  <Text style={styles.snapshotStatValue}>{avg}</Text>
                  <Text style={styles.snapshotStatLabel}>7-day avg</Text>
                </View>
                <View style={styles.snapshotStat}>
                  <Text style={styles.snapshotStatValue}>{inRange}%</Text>
                  <Text style={styles.snapshotStatLabel}>in range</Text>
                </View>
              </View>
            </View>
          )}

          {/* ── SECONDARY: Program guidance ── */}
          {groupMembership ? (
            <View style={styles.programSection}>
              {/* Current lesson — "what to do next" */}
              <TouchableOpacity
                style={styles.lessonCard}
                onPress={() => navigation.navigate('SessionDetail', {
                  groupId: groupMembership.group_id,
                  sessionId: '1',
                })}
                activeOpacity={0.85}
              >
                <View style={styles.lessonIcon}>
                  <Text style={styles.lessonIconText}>✨</Text>
                </View>
                <View style={styles.lessonContent}>
                  <Text style={styles.lessonEyebrow}>CONTINUE · WEEK 1</Text>
                  <Text style={styles.lessonTitle}>Holy — Set Apart by Christ</Text>
                </View>
                <Text style={styles.lessonArrow}>→</Text>
              </TouchableOpacity>

              {/* Group chat — smaller, secondary */}
              <TouchableOpacity
                style={styles.groupChatRow}
                onPress={navigateToGroupChat}
                activeOpacity={0.8}
              >
                <Text style={styles.groupChatRowEmoji}>💬</Text>
                <Text style={styles.groupChatRowText}>12-Week Metabolic Reset · Group Chat</Text>
                <Text style={styles.groupChatRowArrow}>→</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.joinCard}
              onPress={() => navigation.navigate('JoinGroup')}
              activeOpacity={0.85}
            >
              <View style={styles.joinIcon}>
                <Text style={styles.joinEmoji}>🌿</Text>
              </View>
              <View style={styles.joinContent}>
                <Text style={styles.joinTitle}>12-Week Metabolic Reset</Text>
                <Text style={styles.joinSub}>Join your program</Text>
              </View>
              <Text style={styles.joinArrow}>→</Text>
            </TouchableOpacity>
          )}

          {/* ── SECONDARY: Rhythm (cycle-aware, one card) ── */}
          {cycleTrackingEnabled && (
            <>
              {cycleProfile === 'regular' && !currentCycle && (
                <TouchableOpacity
                  style={styles.startCycleCard}
                  onPress={() => navigation.navigate('LogCycle')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.startCycleText}>+ Start tracking your cycle</Text>
                </TouchableOpacity>
              )}

              {(currentCycle || cycleProfile !== 'regular') && (
                <RhythmCard
                  phase={currentCycle?.phase}
                  currentDay={currentCycle?.current_day}
                  cycleProfile={cycleProfile}
                />
              )}
            </>
          )}

          {/* ── TERTIARY: Recent symptoms — only if logged ── */}
          {safeSymptoms.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.sectionLabel}>RECENT SYMPTOMS</Text>
              </View>
              {safeSymptoms.slice(0, 3).map((symptom, index) => (
                <View
                  key={symptom.id}
                  style={[
                    styles.symptomRow,
                    index < Math.min(safeSymptoms.length, 3) - 1 && styles.symptomRowBorder,
                  ]}
                >
                  <View style={[styles.severityTick, { backgroundColor: getSeverityColor(symptom.severity) }]} />
                  <Text style={styles.symptomName}>
                    {(symptom.symptom_type || '').replace('_', ' ')}
                  </Text>
                  <Text style={styles.symptomSeverity}>{symptom.severity}/10</Text>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </BotanicalBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212,214,212,0.25)',
  },
  greetingContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  greetingLight: { fontSize: 14, fontWeight: '400', letterSpacing: 0.3, color: 'rgba(42,45,42,0.5)' },
  greetingBold: { fontSize: 22, fontWeight: '600', letterSpacing: -0.3, color: '#2B2B2B' },
  iconButton: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderWidth: 1.5, borderColor: 'rgba(42,45,42,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  iconGlyph: { fontSize: 18 },

  content: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 24 },

  // ── Glucose snapshot — compact inline strip ──────────────────────────────
  glucoseSnapshot: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,214,212,0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  snapshotLeft: { flex: 1 },
  snapshotLabel: {
    fontSize: 10, fontWeight: '600', letterSpacing: 1.2,
    color: 'rgba(42,45,42,0.45)', marginBottom: 6,
  },
  snapshotValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  snapshotValue: { fontSize: 32, fontWeight: '300', letterSpacing: -0.5 },
  snapshotUnit: { fontSize: 13, color: 'rgba(42,45,42,0.4)', fontWeight: '400' },
  snapshotDivider: {
    width: 1, height: 40,
    backgroundColor: 'rgba(212,214,212,0.4)',
    marginHorizontal: 16,
  },
  snapshotRight: { gap: 6 },
  snapshotStat: { alignItems: 'flex-end' },
  snapshotStatValue: { fontSize: 15, fontWeight: '700', color: '#2B2B2B' },
  snapshotStatLabel: { fontSize: 10, color: 'rgba(42,45,42,0.45)', fontWeight: '400' },

  // ── Program section ───────────────────────────────────────────────────────
  programSection: { marginBottom: 16, gap: 10 },

  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,214,212,0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    gap: 14,
  },
  lessonIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(107,127,110,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  lessonIconText: { fontSize: 22 },
  lessonContent: { flex: 1 },
  lessonEyebrow: {
    fontSize: 10, fontWeight: '600', letterSpacing: 1.2,
    color: 'rgba(107,127,110,0.7)', marginBottom: 4,
  },
  lessonTitle: { fontSize: 15, fontWeight: '600', color: '#2B2B2B', letterSpacing: 0.1 },
  lessonArrow: { fontSize: 18, color: '#6B7F6E' },

  groupChatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(61,85,64,0.08)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(61,85,64,0.12)',
  },
  groupChatRowEmoji: { fontSize: 15 },
  groupChatRowText: { flex: 1, fontSize: 13, fontWeight: '500', color: colors.forestGreen },
  groupChatRowArrow: { fontSize: 14, color: colors.forestGreen },

  joinCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,214,212,0.25)',
    gap: 14,
  },
  joinIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(107,127,110,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  joinEmoji: { fontSize: 22 },
  joinContent: { flex: 1 },
  joinTitle: { fontSize: 15, fontWeight: '600', color: '#2B2B2B', marginBottom: 2 },
  joinSub: { fontSize: 12, color: 'rgba(42,45,42,0.55)' },
  joinArrow: { fontSize: 18, color: '#6B7F6E' },

  // ── Start cycle nudge ─────────────────────────────────────────────────────
  startCycleCard: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(107,127,110,0.15)',
  },
  startCycleText: { fontSize: 14, fontWeight: '500', color: '#6B7F6E' },

  // ── Generic card ──────────────────────────────────────────────────────────
  card: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(212,214,212,0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: { marginBottom: 14 },
  sectionLabel: {
    fontSize: 11, fontWeight: '600', letterSpacing: 1.2,
    textTransform: 'uppercase', color: 'rgba(42,45,42,0.5)',
  },

  // ── Symptoms ──────────────────────────────────────────────────────────────
  symptomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  symptomRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212,214,212,0.2)',
  },
  severityTick: { width: 2, height: 20, borderRadius: 1 },
  symptomName: {
    flex: 1, fontSize: 15, fontWeight: '500',
    color: '#2B2B2B', textTransform: 'capitalize',
  },
  symptomSeverity: { fontSize: 13, color: 'rgba(42,45,42,0.5)' },
});