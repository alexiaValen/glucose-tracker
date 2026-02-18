// mobile-app/src/screens/DashboardScreen.tsx
// FIXED VERSION - All data displaying correctly, coach chat card added, emojis replaced
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BotanicalBackground } from '../components/BotanicalBackground';
import { SignalRingThin, AxisMarker, SeverityContinuum } from '../components/SimpleIcons';
import { glucoseService } from '../services/glucose.service';

const API_BASE = process.env.EXPO_PUBLIC_API_URL;

if (!API_BASE) {
  throw new Error('Missing EXPO_PUBLIC_API_URL');
}

type DashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

interface Props {
  navigation: DashboardScreenNavigationProp;
}

export default function DashboardScreen({ navigation }: Props){
  const { user, logout } = useAuthStore();
  const { readings, stats, fetchReadings, fetchStats } = useGlucoseStore();
  const { currentCycle, fetchCurrentCycle } = useCycleStore();
  const { symptoms, fetchSymptoms } = useSymptomStore();

  const safeReadings = Array.isArray(readings) ? readings : [];
  const safeSymptoms = Array.isArray(symptoms) ? symptoms : [];
  
  const [refreshing, setRefreshing] = useState(false);
  const [cycleTrackingEnabled, setCycleTrackingEnabled] = useState(true);
  const [myCoach, setMyCoach] = useState<any>(null);
  const [groupMembership, setGroupMembership] = useState<any>(null);

  useEffect(() => {
    loadData();
    loadSettings();
    loadMyCoach();
    loadGroupMembership();
  }, []);

  const loadData = async () => {
    console.log('🔄 Starting loadData...');
    try {
      await Promise.all([
        fetchReadings(),
        fetchStats(),
        fetchCurrentCycle(),
        fetchSymptoms(),
      ]);
      console.log('✅ All data fetched');
    } catch (error) {
      console.error('❌ loadData error:', error);
    }
  };

  const loadSettings = async () => {
    const enabled = await AsyncStorage.getItem('cycleTrackingEnabled');
    setCycleTrackingEnabled(enabled !== 'false');
  };

  const loadMyCoach = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE}/coach/my-coach`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.coach) {
        setMyCoach({
          id: data.coach.id,
          email: data.coach.email,
          firstName: data.coach.first_name,
          lastName: data.coach.last_name,
          role: data.coach.role,
        });
      }
    } catch (error) {
      console.log('No coach assigned');
    }
  };

  const loadGroupMembership = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE}/groups/my-membership`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.membership) {
        setGroupMembership(data.membership);
      }
    } catch (error) {
      console.log('No group membership');
      setGroupMembership(null);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    console.log('🔄 Refreshing dashboard data...');
    await loadData();
    await loadGroupMembership();
    console.log('✅ Refresh complete');
    setRefreshing(false);
  };

  const getGlucoseStatusText = () => {
    const avg = stats?.average || stats?.avgGlucose || 0;
    if (avg < 70) return 'LOW';
    if (avg > 180) return 'HIGH';
    return 'IN RANGE';
  };

  const getSeverityColor = (severity: number) => {
    if (severity <= 3) return 'rgba(107,127,110,0.4)'; // Sage
    if (severity <= 6) return 'rgba(184,164,95,0.5)'; // Gold
    return 'rgba(139,111,71,0.6)'; // Brown
  };

  return (
    <BotanicalBackground variant="3d" intensity="medium">
      <View style={styles.container}>
        {/* Minimal Header */}
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
              onPress={() => navigation.navigate('Conversations')}
            >
              <Text style={styles.iconGlyph}>💬</Text>
            </TouchableOpacity>
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
          {/* Primary CTAs */}
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

          {/* Group Program Card - Conditional based on membership */}
          {!groupMembership ? (
            <TouchableOpacity
              style={styles.joinGroupButton}
              onPress={() => navigation.navigate('JoinGroup')}
            >
              <View style={styles.joinGroupIcon}>
                <Text style={styles.joinGroupEmoji}>👥</Text>
              </View>
              <View style={styles.joinGroupContent}>
                <Text style={styles.joinGroupTitle}>Join a Group Program</Text>
                <Text style={styles.joinGroupSubtitle}>Enter your access code</Text>
              </View>
              <Text style={styles.joinGroupArrow}>→</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.enrolledSection}>
              <TouchableOpacity
                style={styles.enrolledCard}
                onPress={() => navigation.navigate('GroupDashboard', { 
                  groupId: groupMembership.group_id 
                })}
                activeOpacity={0.85}
              >
                <View style={styles.enrolledBadge}>
                  <Text style={styles.enrolledBadgeText}>ENROLLED</Text>
                </View>
                <Text style={styles.enrolledTitle}>
                  {groupMembership.group_name || 'Group Program'}
                </Text>
                <Text style={styles.enrolledSubtitle}>Tap to view all sessions →</Text>
              </TouchableOpacity>

              <View style={styles.sessionQuickAccess}>
                <Text style={styles.sessionQuickLabel}>CONTINUE LEARNING</Text>
                <TouchableOpacity
                  style={styles.sessionQuickCard}
                  onPress={() => navigation.navigate('SessionDetail', { 
                    groupId: groupMembership.group_id,
                    sessionId: '1' 
                  })}
                  activeOpacity={0.85}
                >
                  <View style={styles.sessionQuickIcon}>
                    <Text style={styles.sessionQuickIconText}>✨</Text>
                  </View>
                  <View style={styles.sessionQuickInfo}>
                    <Text style={styles.sessionQuickNumber}>WEEK 1</Text>
                    <Text style={styles.sessionQuickTitle}>Holy - Set Apart by Christ</Text>
                  </View>
                  <Text style={styles.sessionQuickArrow}>→</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Coach Chat Card - only shows when coach is assigned */}
          {myCoach && (
            <TouchableOpacity
              style={styles.coachChatCard}
              onPress={async () => {
                try {
                  const token = await AsyncStorage.getItem('accessToken');
                  const response = await fetch(`${API_BASE}/conversations/get-or-create`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      coach_id: myCoach.id,
                      client_id: user?.id,
                    }),
                  });
                  const data = await response.json();
                  navigation.navigate('Messaging', {
                    conversationId: data.conversation?.id,
                    userName: (`${myCoach.firstName || ''} ${myCoach.lastName || ''}`).trim() || 'Your Coach',
                  });
                } catch (error) {
                  console.error('Failed to open coach chat:', error);
                  navigation.navigate('Messaging', {
                    userId: myCoach.id,
                    userName: (`${myCoach.firstName || ''} ${myCoach.lastName || ''}`).trim() || 'Your Coach',
                  });
                }
              }}
              activeOpacity={0.85}
            >
              <View style={styles.coachChatAvatar}>
                <Text style={styles.coachChatAvatarText}>
                  {(myCoach.firstName?.charAt(0) || '?').toUpperCase()}
                </Text>
              </View>
              <View style={styles.coachChatContent}>
                <Text style={styles.coachChatLabel}>YOUR COACH</Text>
                <Text style={styles.coachChatName}>
                  {(`${myCoach.firstName || ''} ${myCoach.lastName || ''}`).trim() || myCoach.email}
                </Text>
              </View>
              <View style={styles.coachChatAction}>
                <Text style={styles.coachChatArrow}>💬</Text>
              </View>
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
                <Text style={styles.statValue}>
                  {Math.round(stats?.in_range_percentage || stats?.timeInRange || 0)}%
                </Text>
                <Text style={styles.statLabel}>In Range</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats?.total_readings || stats?.count || 0}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
            </View>

            {safeReadings.length > 0 && (
              <View style={styles.recentReading}>
                <View style={styles.recentDot} />
                <Text style={styles.recentText}>
                  Latest: {safeReadings[0].glucose_level} mg/dL
                </Text>
                <Text style={styles.recentTime}>
                  {new Date(safeReadings[0].timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
              </View>
            )}
          </View>

          {/* Cycle Tracking Card */}
          {cycleTrackingEnabled && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.sectionHeader}>MENSTRUAL CYCLE</Text>
                <View style={styles.cyclePhaseGlyph}>
                  <SignalRingThin size={16} muted="rgba(107,127,110,0.3)" />
                </View>
              </View>

              {currentCycle ? (
                <View style={styles.cycleContent}>
                  <Text style={styles.cycleDay}>Day {currentCycle.current_day} of 28</Text>
                  
                  <View style={styles.cycleProgressBar}>
                    <View 
                      style={[
                        styles.cycleProgressFill,
                        { width: `${(currentCycle.current_day / 28) * 100}%` }
                      ]} 
                    />
                  </View>
                  
                  <Text style={styles.cyclePhase}>
                    {currentCycle.phase.charAt(0).toUpperCase() + currentCycle.phase.slice(1)}
                  </Text>
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
                    index === safeSymptoms.slice(0, 3).length - 1 && { borderBottomWidth: 0 }
                  ]}
                >
                  <View style={styles.symptomLeft}>
                    <View style={[
                      styles.severityTick,
                      { backgroundColor: getSeverityColor(symptom.severity) }
                    ]} />
                    <Text style={styles.symptomName}>
                      {symptom.symptom_type.replace('_', ' ')}
                    </Text>
                  </View>
                  <View style={styles.symptomRight}>
                    <Text style={styles.symptomSeverity}>
                      {symptom.severity} / 10
                    </Text>
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
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: 'transparent',
  },
  headerLeft: {
    flex: 1,
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  greetingLight: {
    fontSize: 13,
    color: 'rgba(42,45,42,0.6)',
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  greetingBold: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2B2B2B',
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212,214,212,0.3)',
  },
  iconGlyph: {
    fontSize: 18,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#6B7F6E',
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(212,214,212,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  secondaryButtonText: {
    color: '#2B2B2B',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  // Coach Chat Card
  coachChatCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(107,127,110,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  coachChatAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(107,127,110,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  coachChatAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6B7F6E',
  },
  coachChatContent: {
    flex: 1,
  },
  coachChatLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(107,127,110,0.7)',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  coachChatName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2B2B2B',
  },
  coachChatAction: {
    paddingLeft: 8,
  },
  coachChatArrow: {
    fontSize: 20,
  },
  joinGroupButton: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212,214,212,0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  joinGroupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(107,127,110,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  joinGroupEmoji: {
    fontSize: 24,
  },
  joinGroupContent: {
    flex: 1,
  },
  joinGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2B2B2B',
    marginBottom: 4,
  },
  joinGroupSubtitle: {
    fontSize: 13,
    color: 'rgba(42,45,42,0.6)',
  },
  joinGroupArrow: {
    fontSize: 20,
    color: '#6B7F6E',
    fontWeight: '600',
  },
  enrolledSection: {
    marginBottom: 16,
  },
  enrolledCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(107,127,110,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  enrolledBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(107,127,110,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  enrolledBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7F6E',
    letterSpacing: 0.8,
  },
  enrolledTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2B2B2B',
    marginBottom: 6,
  },
  enrolledSubtitle: {
    fontSize: 13,
    color: 'rgba(42,45,42,0.6)',
  },
  sessionQuickAccess: {
    gap: 8,
  },
  sessionQuickLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(107,127,110,0.7)',
    letterSpacing: 0.8,
    paddingHorizontal: 4,
  },
  sessionQuickCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212,214,212,0.25)',
  },
  sessionQuickIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(107,127,110,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sessionQuickIconText: {
    fontSize: 20,
  },
  sessionQuickInfo: {
    flex: 1,
  },
  sessionQuickNumber: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(107,127,110,0.7)',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  sessionQuickTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2B2B2B',
  },
  sessionQuickArrow: {
    fontSize: 18,
    color: '#6B7F6E',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,214,212,0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(107,127,110,0.7)',
    letterSpacing: 1,
  },
  glucoseReading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  displayLarge: {
    fontSize: 48,
    fontWeight: '700',
    color: '#2B2B2B',
    letterSpacing: -1,
  },
  unitText: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(42,45,42,0.5)',
  },
  glucoseSubtext: {
    fontSize: 13,
    color: 'rgba(42,45,42,0.6)',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(107,127,110,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6B7F6E',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7F6E',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(212,214,212,0.3)',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2B2B2B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(42,45,42,0.6)',
    textTransform: 'capitalize',
  },
  recentReading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212,214,212,0.3)',
  },
  recentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6B7F6E',
  },
  recentText: {
    fontSize: 13,
    color: '#2B2B2B',
    flex: 1,
  },
  recentTime: {
    fontSize: 12,
    color: 'rgba(42,45,42,0.5)',
  },
  cyclePhaseGlyph: {
    opacity: 0.3,
  },
  cycleContent: {
    alignItems: 'center',
  },
  cycleDay: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2B2B2B',
    marginBottom: 16,
  },
  cycleProgressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(212,214,212,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  cycleProgressFill: {
    height: '100%',
    backgroundColor: '#6B7F6E',
    borderRadius: 3,
  },
  cyclePhase: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(42,45,42,0.7)',
  },
  emptyStateButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7F6E',
  },
  symptomItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212,214,212,0.3)',
  },
  symptomLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  severityTick: {
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  symptomName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2B2B2B',
    textTransform: 'capitalize',
  },
  symptomRight: {
    alignItems: 'flex-end',
  },
  symptomSeverity: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(42,45,42,0.6)',
  },
  seeAllLink: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7F6E',
  },
});