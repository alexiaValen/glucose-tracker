import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useAuthStore } from '../stores/authStore';
import { useGlucoseStore } from '../stores/glucoseStore';
import { useSymptomStore } from '../stores/symptomStore';
import { useCycleStore } from '../stores/cycleStore';
import { CYCLE_PHASES } from '../types/cycle';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { checkHealthKitStatus } from '../utils/healthKit.utils';
import { colors } from '../theme/colors';

type DashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

interface Props {
  navigation: DashboardScreenNavigationProp;
}

// const colors = {
//   sage: '#7A8B6F',
//   charcoal: '#3A3A3A',
//   warmBrown: '#8B6F47',
//   cream: '#FAF8F4',
//   lightSage: '#B8C5A8',
//   white: '#FFFFFF',
//   textDark: '#2C2C2C',
//   textLight: '#6B6B6B',
//   border: '#E8E6E0',
//   accentPeach: '#D4A798',
// };

export default function DashboardScreen({ navigation }: Props) {
  const { user, logout } = useAuthStore();
  const { readings, stats, isLoading, fetchReadings, fetchStats } = useGlucoseStore();
  const { symptoms, fetchSymptoms } = useSymptomStore();
  const { currentCycle, fetchCurrentCycle } = useCycleStore();
  const [cycleTrackingEnabled, setCycleTrackingEnabled] = useState(true);

  useEffect(() => {
    fetchReadings();
    fetchStats();
    fetchSymptoms();
    fetchCurrentCycle();
    //checkHealthKitStatus();
    loadCycleTrackingSetting();
  }, []);

  const loadCycleTrackingSetting = async () => {
    try {
      const enabled = await AsyncStorage.getItem('cycleTrackingEnabled');
      if (enabled !== null) {
        setCycleTrackingEnabled(enabled === 'true');
      }
    } catch (error) {
      console.error('Error loading cycle tracking setting:', error);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/a';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/a';
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch (error) {
      return 'N/a';
    }
  };

  const getMealContextLabel = (context?: string) => {
    const labels: Record<string, string> = {
      fasting: 'Fasting',
      pre_meal: 'Before Meal',
      post_meal: 'After Meal',
      bedtime: 'Bedtime',
      other: 'Other',
    };
    return labels[context || 'other'] || 'Other';
  };

  const getSymptomLabel = (type: string) => {
    const symptoms: Record<string, string> = {
      headache: 'Headache',
      fatigue: 'Fatigue',
      dizziness: 'Dizziness',
      hunger: 'Hunger',
      irritability: 'Irritability',
      nausea: 'Nausea',
      shaking: 'Shaking',
      sweating: 'Sweating',
      brain_fog: 'Brain Fog',
      anxiety: 'Anxiety',
      cramps: 'Cramps',
      bloating: 'Bloating',
      mood_swings: 'Mood Swings',
      other: 'Other',
    };
    return symptoms[type] || type;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.subtitle}>GraceFlow</Text>
          <Text style={styles.greeting}>Hello, {user?.firstName || 'there'}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Settings')} 
            style={styles.settingsButton}
          >
            <Text style={styles.settingsButtonText}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Conversations')} 
            style={styles.messagesButton}
          >
            <Text style={styles.messagesButtonText}>💬</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Card */}
        {stats && (
  <View style={styles.statsCard}>
    <Text style={styles.statsTitle}>Last 7 Days</Text>
    <View style={styles.statsGrid}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>
          {stats.avgGlucose?.toFixed(0) || stats.average?.toFixed(0) || '0'}
        </Text>
        <Text style={styles.statLabel}>Average</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statValue}>
          {stats.minGlucose?.toFixed(0) || stats.min?.toFixed(0) || '0'}
        </Text>
        <Text style={styles.statLabel}>Lowest</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statValue}>
          {stats.maxGlucose?.toFixed(0) || stats.max?.toFixed(0) || '0'}
        </Text>
        <Text style={styles.statLabel}>Highest</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statValue}>
          {stats.timeInRange?.toFixed(0) || stats.in_range_percentage?.toFixed(0) || '0'}%
        </Text>
        <Text style={styles.statLabel}>In Range</Text>
      </View>
    </View>
  </View>
)}

        {/* Cycle Card */}
        {cycleTrackingEnabled && currentCycle && (
          <View style={styles.cycleCard}>
            <View style={styles.cycleHeader}>
              <Text style={styles.cycleTitle}>Current Cycle</Text>
              <View style={styles.cycleDayBadge}>
                <Text style={styles.cycleDayText}>Day {currentCycle.current_day}</Text>
              </View>
            </View>
            <View style={styles.cyclePhaseContainer}>
              <Text style={styles.cyclePhaseText}>
                {CYCLE_PHASES.find(p => p.id === currentCycle.phase)?.label || currentCycle.phase}
              </Text>
            </View>
            {currentCycle.flow && (
              <Text style={styles.cycleFlow}>
                Flow: {currentCycle.flow.charAt(0).toUpperCase() + currentCycle.flow.slice(1)}
              </Text>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonPrimary]}
            onPress={() => navigation.navigate('AddGlucose')}
          >
            <Text style={styles.actionButtonText}>Log Glucose</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={() => navigation.navigate('AddSymptom')}
          >
            <Text style={styles.actionButtonTextSecondary}>Log Symptom</Text>
          </TouchableOpacity>
        </View>

        {/* Log Period Button */}
        {cycleTrackingEnabled && (
          <View style={styles.periodButtonContainer}>
            <TouchableOpacity
              style={styles.periodButton}
              onPress={() => navigation.navigate('LogCycle')}
            >
              <Text style={styles.periodButtonIcon}>🩸</Text>
              <Text style={styles.periodButtonText}>Log Period Start</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Recent Symptoms */}
        {symptoms.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Symptoms</Text>
            {symptoms.slice(0, 3).map((symptom) => (
              <View key={symptom.id} style={styles.symptomCard}>
                <View style={styles.symptomHeader}>
                  <View style={styles.symptomInfo}>
                    <Text style={styles.symptomType}>
                      {getSymptomLabel(symptom.symptom_type)}
                    </Text>
                    <Text style={styles.symptomDate}>
                      {formatDate(symptom.logged_at)}
                    </Text>
                  </View>
                  <View style={styles.severityBadge}>
                    <Text style={styles.severityText}>{symptom.severity}/10</Text>
                  </View>
                </View>
                {symptom.notes && (
                  <Text style={styles.symptomNotes}>{symptom.notes}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Recent Readings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Readings</Text>

          {isLoading && readings.length === 0 ? (
            <ActivityIndicator size="large" color={colors.sage} style={{ marginTop: 20 }} />
          ) : readings.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No readings yet</Text>
              <Text style={styles.emptySubtext}>Tap "Log Glucose" to add your first reading</Text>
            </View>
          ) : (
            readings.slice(0, 5).map((reading) => (
              <View key={reading.id} style={styles.readingCard}>
                <View style={styles.readingHeader}>
                  <View>
                    <Text style={styles.readingValue}>{reading.created_at} mg/dL</Text>
                    <Text style={styles.readingDate}>{formatDate(reading.created_at)}</Text>
                  </View>
                  <View style={styles.contextBadge}>
                    <Text style={styles.contextText}>
                      {getMealContextLabel(reading.meal_context)}
                    </Text>
                  </View>
                </View>
                {reading.notes && <Text style={styles.readingNotes}>{reading.notes}</Text>}
              </View>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingTop: 60,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textLight,
    fontWeight: '400',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  settingsButtonText: {
    fontSize: 18,
  },
  messagesButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  messagesButtonText: {
    fontSize: 18,
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutText: {
    color: colors.textDark,
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  
  // Stats Card
  statsCard: {
    backgroundColor: colors.white,
    margin: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 20,
    letterSpacing: 0.3,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.sage,
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textLight,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Cycle Card
  cycleCard: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.accentPeach,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cycleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cycleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textDark,
    letterSpacing: 0.3,
  },
  cycleDayBadge: {
    backgroundColor: colors.cream,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  cycleDayText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.charcoal,//warm brown was here but had an error
  },
  cyclePhaseContainer: {
    backgroundColor: colors.cream,
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  cyclePhaseText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textDark,
    textAlign: 'center',
  },
  cycleFlow: {
    fontSize: 13,
    color: colors.textLight,
    fontWeight: '500',
  },

  // Action Buttons
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  actionButtonPrimary: {
    backgroundColor: colors.sage,
  },
  actionButtonSecondary: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.sage,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  actionButtonTextSecondary: {
    color: colors.sage,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // Period Button
  periodButtonContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  periodButton: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.accentPeach,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  periodButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  periodButtonText: {
    color: colors.accentPeach,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // Sections
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: 14,
    letterSpacing: 0.2,
  },

  // Symptom Cards
  symptomCard: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.lightSage,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  symptomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  symptomInfo: {
    flex: 1,
  },
  symptomType: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  symptomDate: {
    fontSize: 12,
    color: colors.textLight,
    fontWeight: '400',
  },
  severityBadge: {
    backgroundColor: colors.cream,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  severityText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.charcoal,//warmBrown was here but had an error
  },
  symptomNotes: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 10,
    lineHeight: 20,
  },

  // Reading Cards
  readingCard: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  readingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  readingValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.sage,
    marginBottom: 4,
  },
  readingDate: {
    fontSize: 12,
    color: colors.textLight,
    fontWeight: '400',
  },
  contextBadge: {
    backgroundColor: colors.cream,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  contextText: {
    fontSize: 12,
    color: colors.textDark,
    fontWeight: '500',
  },
  readingNotes: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 8,
    lineHeight: 20,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textLight,
    marginBottom: 6,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
});