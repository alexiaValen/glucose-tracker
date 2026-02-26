// mobile-app/src/screens/DashboardScreen.tsx
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
import { SignalRingThin, AxisMarker, SeverityContinuum } from '../components/SimpleIcons';
import { RhythmCard } from '../components/RhythmCard';
import { CYCLE_PROFILE_KEY, CycleProfile } from '../screens/RhythmProfileScreen';

const API_BASE = process.env.EXPO_PUBLIC_API_URL;

if (!API_BASE) {
  throw new Error('Missing EXPO_PUBLIC_API_URL');
}

type DashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

interface Props {
  navigation: DashboardScreenNavigationProp;
}

export default function DashboardScreen({ navigation }: Props) {
  const { user, logout } = useAuthStore();
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
    loadData();
    loadSettings();
    loadGroupMembership();
  }, []);

  // Refresh settings when returning from Settings or RhythmProfile screens
  useEffect(() => {
    const unsub = navigation.addListener('focus', loadSettings);
    return unsub;
  }, [navigation]);

  const loadData = async () => {
    try {
      await Promise.all([
        fetchReadings(),
        fetchStats(),
        fetchCurrentCycle(),
        fetchSymptoms(),
      ]);
    } catch (error) {
      console.error('loadData error:', error);
    }
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
      const response = await fetch(`${API_BASE}/groups/my-membership`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.membership) {
        setGroupMembership(data.membership);
      } else {
        // Auto-enroll into the 12-Week Metabolic Reset Program silently
        try {
          await fetch(`${API_BASE}/groups/join`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessCode: 'HFR-FEB2025', paymentType: 'founding' }),
          });
          // Re-fetch after joining
          const retry = await fetch(`${API_BASE}/groups/my-membership`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          const retryData = await retry.json();
          if (retryData.membership) setGroupMembership(retryData.membership);
        } catch {
          // Silent fail — user sees fallback card
        }
      }
    } catch (error) {
      setGroupMembership(null);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    await loadGroupMembership();
    setRefreshing(false);
  };

  const getGlucoseStatusText = () => {
    const avg = stats?.average || stats?.avgGlucose || 0;
    if (avg < 70) return 'LOW';
    if (avg > 180) return 'HIGH';
    return 'IN RANGE';
  };

  const getSeverityColor = (severity: number) => {
    if (severity <= 3) return 'rgba(107,127,110,0.4)';
    if (severity <= 6) return 'rgba(184,164,95,0.5)';
    return 'rgba(139,111,71,0.6)';
  };

  // Navigate to group chat — works from both group card and coach card
  const navigateToGroupChat = () => {
    if (!groupMembership) return;
    const parent = navigation.getParent<any>();
    parent?.navigate('GroupChat', {
      groupId: groupMembership.group_id,
      groupName: '12-Week Metabolic Reset',
    });
  };

  return (
    <BotanicalBackground variant="3d" intensity="medium">
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.greetingContainer}>
              <SignalRingThin size={20} muted="rgba(107,127,110,0.15)" />
              <View>
                <Text style={styles.greetingLight}>Hello</Text>
                <Text style={styles.greetingBold}>{user?.firstName || 'there'}</Text>
              </View>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <Text style={styles.iconGlyph}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6B7F6E" />
          }
        >
          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('AddGlucose')}
              activeOpacity={0.85}
            >
              <AxisMarker size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Log glucose</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('AddSymptom')}
              activeOpacity={0.85}
            >
              <SeverityContinuum size={20} color="#2B2B2B" muted="#CFC9BF" />
              <Text style={styles.secondaryButtonText}>Log symptoms</Text>
            </TouchableOpacity>
          </View>

          {/* Group Program Card — auto-enrolled into 12-Week Metabolic Reset */}
          {groupMembership ? (
            <View style={styles.enrolledSection}>

              {/* Group Chat */}
              <TouchableOpacity
                style={styles.groupChatCard}
                onPress={navigateToGroupChat}
                activeOpacity={0.85}
              >
                <Text style={styles.groupChatEmoji}>💬</Text>
                <View style={styles.groupChatContent}>
                  <Text style={styles.groupChatLabel}>GROUP CHAT</Text>
                  <Text style={styles.groupChatName}>12-Week Metabolic Reset</Text>
                </View>
                <Text style={styles.groupChatArrow}>→</Text>
              </TouchableOpacity>

              {/* Continue learning */}
              <View style={styles.sessionQuickAccess}>
                <Text style={styles.sessionQuickLabel}>CONTINUE LEARNING</Text>
                <TouchableOpacity
                  style={styles.sessionQuickCard}
                  onPress={() => navigation.navigate('SessionDetail', {
                    groupId: groupMembership.group_id,
                    sessionId: '1',
                  })}
                  activeOpacity={0.85}
                >
                  <View style={styles.sessionQuickIcon}>
                    <Text style={styles.sessionQuickIconText}>✨</Text>
                  </View>
                  <View style={styles.sessionQuickInfo}>
                    <Text style={styles.sessionQuickNumber}>WEEK 1</Text>
                    <Text style={styles.sessionQuickTitle}>Holy — Set Apart by Christ</Text>
                  </View>
                  <Text style={styles.sessionQuickArrow}>→</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // Fallback while auto-enroll runs or if it fails
            <TouchableOpacity
              style={styles.joinGroupButton}
              onPress={() => navigation.navigate('JoinGroup')}
            >
              <View style={styles.joinGroupIcon}>
                <Text style={styles.joinGroupEmoji}>👥</Text>
              </View>
              <View style={styles.joinGroupContent}>
                <Text style={styles.joinGroupTitle}>12-Week Metabolic Reset</Text>
                <Text style={styles.joinGroupSubtitle}>Tap to join your program</Text>
              </View>
              <Text style={styles.joinGroupArrow}>→</Text>
            </TouchableOpacity>
          )}



          {/* Glucose Overview Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.sectionHeader}>GLUCOSE OVERVIEW</Text>
              <SignalRingThin size={16} muted="rgba(107,127,110,0.08)" />
            </View>
            <View style={styles.glucoseReading}>
              <View>
                <Text style={styles.displayLarge}>
                  {Math.round(stats?.average || stats?.avgGlucose || 0)}
                  <Text style={styles.unitText}> mg/dL</Text>
                </Text>
                <Text style={styles.glucoseSubtext}>7-day average</Text>
              </View>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>{getGlucoseStatusText()}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{Math.round(stats?.average || stats?.avgGlucose || 0)}</Text>
                <Text style={styles.statLabel}>Avg</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{Math.round(stats?.in_range_percentage || stats?.timeInRange || 0)}%</Text>
                <Text style={styles.statLabel}>In Range</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats?.count || 0}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
            </View>
            {safeReadings.length > 0 && (
              <View style={styles.recentReading}>
                <View style={styles.recentDot} />
                <Text style={styles.recentText}>Latest: {safeReadings[0].value ?? safeReadings[0].glucose_level} mg/dL</Text>
                <Text style={styles.recentTime}>
                  {new Date(safeReadings[0].measured_at || safeReadings[0].timestamp || safeReadings[0].created_at || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            )}
          </View>

          {/* Cycle Tracking + Spiritual Rhythm */}
          {cycleTrackingEnabled && (
            <>
              {/* Only show cycle card for regular-cycle users */}
              {cycleProfile === 'regular' && (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.sectionHeader}>MENSTRUAL CYCLE</Text>
                    <View style={styles.cyclePhaseGlyph}>
                      <SignalRingThin size={16} muted="rgba(107,127,110,0.3)" />
                    </View>
                  </View>
                  {currentCycle ? (
                    <View style={styles.cycleContent}>
                      <Text style={styles.cycleDay}>
                        Day {Math.min(currentCycle.current_day, 28)} of 28
                      </Text>
                      <View style={styles.cycleProgressBar}>
                        <View
                          style={[
                            styles.cycleProgressFill,
                            { width: `${Math.min((currentCycle.current_day / 28) * 100, 100)}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.cyclePhase}>
                        {currentCycle.phase.charAt(0).toUpperCase() + currentCycle.phase.slice(1)}
                      </Text>
                      <TouchableOpacity
                        style={styles.cycleEditButton}
                        onPress={() => navigation.navigate('LogCycle')}
                      >
                        <Text style={styles.cycleEditText}>Edit cycle</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.emptyStateButton}
                      onPress={() => navigation.navigate('LogCycle')}
                    >
                      <Text style={styles.emptyStateText}>+ Start Tracking Cycle</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Rhythm Card — shows for everyone */}
              {(currentCycle || cycleProfile !== 'regular') && (
                <RhythmCard
                  phase={currentCycle?.phase}
                  currentDay={currentCycle?.current_day}
                  cycleProfile={cycleProfile}
                />
              )}
            </>
          )}

          {/* Recent Symptoms */}
          {safeSymptoms.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.sectionHeader}>RECENT SYMPTOMS</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAllLink}>See all</Text>
                </TouchableOpacity>
              </View>
              {safeSymptoms.slice(0, 3).map((symptom, index) => (
                <View
                  key={symptom.id}
                  style={[
                    styles.symptomItem,
                    index === safeSymptoms.slice(0, 3).length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View style={styles.symptomLeft}>
                    <View style={[styles.severityTick, { backgroundColor: getSeverityColor(symptom.severity) }]} />
                    <Text style={styles.symptomName}>{symptom.symptom_type.replace('_', ' ')}</Text>
                  </View>
                  <View style={styles.symptomRight}>
                    <Text style={styles.symptomSeverity}>{symptom.severity} / 10</Text>
                  </View>
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
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(212,214,212,0.25)',
  },
  headerLeft: { flex: 1 },
  greetingContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  greetingLight: { fontSize: 14, fontWeight: '400', letterSpacing: 0.3, color: 'rgba(42,45,42,0.5)' },
  greetingBold: { fontSize: 22, fontWeight: '600', letterSpacing: -0.3, color: '#2B2B2B' },
  headerActions: { flexDirection: 'row', gap: 12 },
  iconButton: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderWidth: 1.5, borderColor: 'rgba(42,45,42,0.15)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  iconGlyph: { fontSize: 18 },
  content: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 24 },
  quickActions: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  primaryButton: {
    flex: 1, backgroundColor: '#6B7F6E', borderRadius: 14,
    paddingVertical: 18, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 4,
  },
  primaryButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF', letterSpacing: 0.3 },
  secondaryButton: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1.5, borderColor: 'rgba(42,45,42,0.12)',
    borderRadius: 14, paddingVertical: 17, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  secondaryButtonText: { fontSize: 16, fontWeight: '600', color: '#2B2B2B', letterSpacing: 0.3 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 20, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(212,214,212,0.25)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionHeader: { fontSize: 11, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(42,45,42,0.5)' },
  glucoseReading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  displayLarge: { fontSize: 32, fontWeight: '300', letterSpacing: -0.5, color: '#2B2B2B' },
  unitText: { fontSize: 14, fontWeight: '500', color: 'rgba(42,45,42,0.4)' },
  glucoseSubtext: { fontSize: 13, color: 'rgba(42,45,42,0.5)', marginTop: 4 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#B89A5A' },
  statusText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', color: 'rgba(42,45,42,0.7)' },
  divider: { height: 1, backgroundColor: 'rgba(212,214,212,0.3)', marginBottom: 20 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700', color: '#2B2B2B', marginBottom: 6 },
  statLabel: { fontSize: 11, fontWeight: '500', color: 'rgba(42,45,42,0.5)' },
  recentReading: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(212,214,212,0.2)', gap: 10,
  },
  recentDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#6B7F6E' },
  recentText: { flex: 1, fontSize: 13, color: 'rgba(42,45,42,0.65)', fontWeight: '500' },
  recentTime: { fontSize: 12, color: 'rgba(42,45,42,0.45)' },
  cyclePhaseGlyph: { opacity: 0.3 },
  cycleContent: { gap: 12 },
  cycleDay: { fontSize: 15, fontWeight: '500', color: '#2B2B2B' },
  cycleProgressBar: { height: 6, backgroundColor: 'rgba(212,214,212,0.25)', borderRadius: 3, overflow: 'hidden' },
  cycleProgressFill: { height: '100%', backgroundColor: 'rgba(107,127,110,0.4)', borderRadius: 3 },
  cyclePhase: { fontSize: 13, fontWeight: '500', color: 'rgba(42,45,42,0.65)' },
  cycleEditButton: {
    alignSelf: 'center', marginTop: 4,
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20,
    backgroundColor: 'rgba(107,127,110,0.08)',
    borderWidth: 1, borderColor: 'rgba(107,127,110,0.2)',
  },
  cycleEditText: { fontSize: 12, fontWeight: '600', color: '#6B7F6E', letterSpacing: 0.3 },
  emptyStateButton: { paddingVertical: 14, alignItems: 'center' },
  emptyStateText: { fontSize: 14, fontWeight: '600', color: 'rgba(42,45,42,0.5)' },
  seeAllLink: { fontSize: 13, fontWeight: '500', color: 'rgba(42,45,42,0.5)', letterSpacing: 0.1 },
  symptomItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(212,214,212,0.2)',
  },
  symptomLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  severityTick: { width: 2, height: 20, borderRadius: 1 },
  symptomName: { fontSize: 15, fontWeight: '500', color: '#2B2B2B', textTransform: 'capitalize' },
  symptomRight: { alignItems: 'flex-end' },
  symptomSeverity: { fontSize: 13, fontWeight: '400', color: 'rgba(42,45,42,0.5)' },
  coachCard: {
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 20, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(212,214,212,0.25)',
    flexDirection: 'row', alignItems: 'center', gap: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  coachAvatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(107,127,110,0.1)', borderWidth: 1, borderColor: 'rgba(107,127,110,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  coachAvatarText: { fontSize: 22, fontWeight: '700', color: '#6B7F6E' },
  coachInfo: { flex: 1 },
  coachLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(42,45,42,0.5)', marginBottom: 6 },
  coachName: { fontSize: 16, fontWeight: '600', letterSpacing: 0.2, color: '#2B2B2B', marginBottom: 4 },
  coachAction: { fontSize: 14, fontWeight: '500', color: '#6B7F6E' },
  joinGroupButton: {
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 20, padding: 20, marginBottom: 16,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(212,214,212,0.25)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  joinGroupIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(107,127,110,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  joinGroupEmoji: { fontSize: 24 },
  joinGroupContent: { flex: 1 },
  joinGroupTitle: { fontSize: 16, fontWeight: '600', color: '#2B2B2B', marginBottom: 4 },
  joinGroupSubtitle: { fontSize: 13, color: 'rgba(42,45,42,0.6)' },
  joinGroupArrow: { fontSize: 20, color: '#6B7F6E', fontWeight: '600' },
  groupChatCard: {
    backgroundColor: colors.forestGreen, borderRadius: 18, padding: 16, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  groupChatEmoji: { fontSize: 22 },
  groupChatContent: { flex: 1 },
  groupChatLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
  groupChatName: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  groupChatArrow: { fontSize: 18, color: 'rgba(255,255,255,0.8)' },
  enrolledSection: { marginBottom: 16 },
  enrolledCard: {
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 20, padding: 20, marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(212,214,212,0.25)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  enrolledBadge: { backgroundColor: 'rgba(107,127,110,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 12 },
  enrolledBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 1, color: '#6B7F6E' },
  enrolledTitle: { fontSize: 18, fontWeight: '600', color: '#2B2B2B', marginBottom: 6, letterSpacing: 0.2 },
  enrolledSubtitle: { fontSize: 13, color: 'rgba(42,45,42,0.6)' },
  sessionQuickAccess: { marginTop: 0 },
  sessionQuickLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(42,45,42,0.5)', marginBottom: 12, paddingLeft: 4 },
  sessionQuickCard: {
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 20, padding: 18,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(212,214,212,0.25)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  sessionQuickIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(107,127,110,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  sessionQuickIconText: { fontSize: 24 },
  sessionQuickInfo: { flex: 1 },
  sessionQuickNumber: { fontSize: 10, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(107,127,110,0.7)', marginBottom: 4 },
  sessionQuickTitle: { fontSize: 15, fontWeight: '600', color: '#2B2B2B', letterSpacing: 0.2 },
  sessionQuickArrow: { fontSize: 20, color: '#6B7F6E', fontWeight: '600', marginLeft: 8 },
});