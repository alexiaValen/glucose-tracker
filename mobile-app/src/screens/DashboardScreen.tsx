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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BotanicalBackground } from '../components/BotanicalBackground';
import { SignalRingThin, AxisMarker, SeverityContinuum } from '../components/icons';
import { MessageCircle, Settings, Users, ChevronRight } from 'lucide-react-native';

type DashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

interface Props {
  navigation: DashboardScreenNavigationProp;
}

export default function DashboardScreen({ navigation }: Props) {
  const { user, logout } = useAuthStore();
  const { readings, stats, fetchReadings, fetchStats } = useGlucoseStore();
  const { currentCycle, fetchCurrentCycle } = useCycleStore();
  const { symptoms, fetchSymptoms } = useSymptomStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [cycleTrackingEnabled, setCycleTrackingEnabled] = useState(true);
  const [myCoach, setMyCoach] = useState<any>(null);

  useEffect(() => {
    loadData();
    loadSettings();
    loadMyCoach();
  }, []);

  const loadData = async () => {
    await Promise.all([
      fetchReadings(),
      fetchStats(),
      fetchCurrentCycle(),
      fetchSymptoms(),
    ]);
  };

  const loadSettings = async () => {
    const enabled = await AsyncStorage.getItem('cycleTrackingEnabled');
    setCycleTrackingEnabled(enabled !== 'false');
  };

  const loadMyCoach = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/coach/my-coach`, {
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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
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
              activeOpacity={0.85}
            >
              <MessageCircle size={18} color={colors.sage[700]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <Settings size={18} color={colors.sage[700]} />
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
              <AxisMarker size={20} color="#FFFFFF" position="mid" />
              <Text style={styles.primaryButtonText}>Log glucose</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('AddSymptom')}
              activeOpacity={0.85}
            >
              <SeverityContinuum size={20} color="#2B2B2B" muted="#CFC9BF" accent="#B89A5A" />
              <Text style={styles.secondaryButtonText}>Log symptoms</Text>
            </TouchableOpacity>
          </View>

          {/* Join Group Button */}
<TouchableOpacity
  style={styles.joinGroupButton}
  onPress={() => navigation.navigate('JoinGroup')}
>

  <View style={styles.joinGroupIcon}>
    <Users size={18} color={colors.sage[700]} />

  </View>

  
  <View style={styles.joinGroupContent}>
    <Text style={styles.joinGroupTitle}>Join a Group Program</Text>
    <Text style={styles.joinGroupSubtitle}>Enter your access code</Text>
  </View>
  
  <ChevronRight size={20} color={colors.sage[500]} />

</TouchableOpacity>

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
                <Text style={styles.statValue}>{stats?.count || 0}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
            </View>

            {readings.length > 0 && (
              <View style={styles.recentReading}>
                <View style={styles.recentDot} />
                <Text style={styles.recentText}>
                  Latest: {readings[0].glucose_level} mg/dL
                </Text>
                <Text style={styles.recentTime}>
                  {new Date(readings[0].timestamp).toLocaleTimeString([], { 
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
          {symptoms.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.sectionHeader}>RECENT SYMPTOMS</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAllLink}>See all</Text>
                </TouchableOpacity>
              </View>

              {symptoms.slice(0, 3).map((symptom, index) => (
                <View 
                  key={symptom.id} 
                  style={[
                    styles.symptomItem,
                    index === symptoms.slice(0, 3).length - 1 && { borderBottomWidth: 0 }
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

          {/* Coach Card */}
          {myCoach && myCoach.firstName && (
            <TouchableOpacity
              style={styles.coachCard}
              onPress={() => navigation.navigate('Conversations')}
              activeOpacity={0.85}
            >
              <View style={styles.coachAvatar}>
                <Text style={styles.coachAvatarText}>
                  {myCoach.firstName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.coachInfo}>
                <Text style={styles.coachLabel}>YOUR COACH</Text>
                <Text style={styles.coachName}>
                  {myCoach.firstName} {myCoach.lastName || ''}
                </Text>
                <Text style={styles.coachAction}>Message your coach</Text>
              </View>
            </TouchableOpacity>
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

  // Header - Minimal
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 18,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212,214,212,0.25)',
  },
  headerLeft: {
    flex: 1,
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  greetingLight: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0.3,
    color: 'rgba(42,45,42,0.5)',
  },
  greetingBold: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.3,
    color: '#2B2B2B',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    // width: 40,
    // height: 40,
    // borderRadius: 12,
    // backgroundColor: 'rgba(255,255,255,0.4)',
    // borderWidth: 1.5,
    // borderColor: 'rgba(42,45,42,0.15)',
    // alignItems: 'center',
    // justifyContent: 'center',
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.04,
    // shadowRadius: 8,
    // elevation: 1,
    width: 40,
  height: 40,
  borderRadius: 14,
  backgroundColor: 'rgba(255,255,255,0.92)',
  borderWidth: 1,
  borderColor: 'rgba(107,127,110,0.18)',
  alignItems: 'center',
  justifyContent: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.06,
  shadowRadius: 10,
  elevation: 2,
  },
  iconGlyph: {
    fontSize: 18,
  },

  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 24,
  },

  // Quick Actions - Primary & Secondary CTAs
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#6B7F6E',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1.5,
    borderColor: 'rgba(42,45,42,0.12)',
    borderRadius: 14,
    paddingVertical: 17,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2B2B2B',
    letterSpacing: 0.3,
  },

  // Card - Standard
  card: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,214,212,0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(42,45,42,0.5)',
  },

  // Glucose Reading
  glucoseReading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  displayLarge: {
    fontSize: 32,
    fontWeight: '300',
    letterSpacing: -0.5,
    color: '#2B2B2B',
  },
  unitText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(42,45,42,0.4)',
  },
  glucoseSubtext: {
    fontSize: 13,
    color: 'rgba(42,45,42,0.5)',
    marginTop: 4,
    fontWeight: '400',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#B89A5A',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(42,45,42,0.7)',
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: 'rgba(212,214,212,0.3)',
    marginBottom: 20,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2B2B2B',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(42,45,42,0.5)',
  },

  // Recent Reading
  recentReading: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212,214,212,0.2)',
    gap: 10,
  },
  recentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6B7F6E',
  },
  recentText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(42,45,42,0.65)',
    fontWeight: '500',
  },
  recentTime: {
    fontSize: 12,
    color: 'rgba(42,45,42,0.45)',
  },

  // Cycle Tracking
  cyclePhaseGlyph: {
    opacity: 0.3,
  },
  cycleContent: {
    gap: 12,
  },
  cycleDay: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2B2B2B',
  },
  cycleProgressBar: {
    height: 6,
    backgroundColor: 'rgba(212,214,212,0.25)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  cycleProgressFill: {
    height: '100%',
    backgroundColor: 'rgba(107,127,110,0.4)',
    borderRadius: 3,
  },
  cyclePhase: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(42,45,42,0.65)',
  },
  emptyStateButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(42,45,42,0.5)',
  },

  // Symptoms
  seeAllLink: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(42,45,42,0.5)',
    letterSpacing: 0.1,
  },
  symptomItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212,214,212,0.2)',
  },
  symptomLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  severityTick: {
    width: 2,
    height: 20,
    borderRadius: 1,
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
    fontWeight: '400',
    color: 'rgba(42,45,42,0.5)',
  },

  // Coach Card
  coachCard: {
     backgroundColor: 'rgba(255,255,255,0.96)',
  borderRadius: 20,
  padding: 20,
  marginBottom: 16,
  borderWidth: 1,
  borderColor: 'rgba(212,214,212,0.25)',
  flexDirection: 'row',
  alignItems: 'center',
  gap: 16,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.06,
  shadowRadius: 12,
  elevation: 3,
  },
  coachAvatar: {
    width: 56,
  height: 56,
  borderRadius: 28,
  backgroundColor: 'rgba(107,127,110,0.10)',
  borderWidth: 1,
  borderColor: 'rgba(107,127,110,0.18)',
  justifyContent: 'center',
  alignItems: 'center',
  },
  coachAvatarText: {
    fontSize: 22,
  fontWeight: '700',
  color: colors.sage[700],
  },
  coachInfo: {
    flex: 1,
  },
  coachLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(42,45,42,0.5)',
    marginBottom: 6,
  },
  coachName: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
    color: '#2B2B2B',
    marginBottom: 4,
  },
  coachAction: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(42,45,42,0.65)',
  },

  joinGroupButton: {
  backgroundColor: 'rgba(255,255,255,0.95)',
  borderRadius: 20,
  padding: 20,

  marginTop: 16,
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
});