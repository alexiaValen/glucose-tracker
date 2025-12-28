// src/screens/ClientDetailScreen.tsx
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
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';
import { coachService } from '../services/coach.service';
import { useCoachStore } from '../stores/coachStore';
import { CYCLE_PHASES } from '../types/cycle';

type ClientDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ClientDetail'>;
type ClientDetailScreenRouteProp = RouteProp<RootStackParamList, 'ClientDetail'>;

interface Props {
  navigation: ClientDetailScreenNavigationProp;
  route: ClientDetailScreenRouteProp;
}

const colors = {
  sage: '#7A8B6F',
  charcoal: '#3A3A3A',
  warmBrown: '#8B6F47',
  cream: '#FAF8F4',
  lightSage: '#B8C5A8',
  white: '#FFFFFF',
  textDark: '#2C2C2C',
  textLight: '#6B6B6B',
  border: '#E8E6E0',
  accentPeach: '#D4A798',
};

export default function ClientDetailScreen({ navigation, route }: Props) {
  const { clientId } = route.params;
  const { selectedClient } = useCoachStore();
  const [readings, setReadings] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [symptoms, setSymptoms] = useState<any[]>([]);
  const [cycle, setCycle] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadClientData();
  }, [clientId]);

  const loadClientData = async () => {
    setIsLoading(true);
    try {
      const [glucoseData, statsData, symptomsData, cycleData] = await Promise.all([
        coachService.getClientGlucose(clientId, 20),
        coachService.getClientStats(clientId),
        coachService.getClientSymptoms(clientId, 10),
        coachService.getClientCycle(clientId),
      ]);

      setReadings(glucoseData);
      setStats(statsData);
      setSymptoms(symptomsData);
      setCycle(cycleData.currentCycle || null);
    } catch (error) {
      console.error('Failed to load client data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Just now';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Just now';
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Just now';
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

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.sage} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Clients</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {selectedClient?.firstName} {selectedClient?.lastName}
        </Text>
        <Text style={styles.subtitle}>Client Health Dashboard</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Card */}
        {stats && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Last 7 Days</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.avgGlucose?.toFixed(0) || '—'}</Text>
                <Text style={styles.statLabel}>Average</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.minGlucose?.toFixed(0) || '—'}</Text>
                <Text style={styles.statLabel}>Lowest</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.maxGlucose?.toFixed(0) || '—'}</Text>
                <Text style={styles.statLabel}>Highest</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.timeInRange?.toFixed(0) || '—'}%</Text>
                <Text style={styles.statLabel}>In Range</Text>
              </View>
            </View>
          </View>
        )}

        {/* Cycle Card */}
        {cycle && (
          <View style={styles.cycleCard}>
            <View style={styles.cycleHeader}>
              <Text style={styles.cycleTitle}>Current Cycle</Text>
              <View style={styles.cycleDayBadge}>
                <Text style={styles.cycleDayText}>Day {cycle.current_day}</Text>
              </View>
            </View>
            <View style={styles.cyclePhaseContainer}>
              <Text style={styles.cyclePhaseText}>
                {CYCLE_PHASES.find(p => p.id === cycle.phase)?.label || cycle.phase}
              </Text>
            </View>
            {cycle.flow && (
              <Text style={styles.cycleFlow}>
                Flow: {cycle.flow.charAt(0).toUpperCase() + cycle.flow.slice(1)}
              </Text>
            )}
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
          <Text style={styles.sectionTitle}>Recent Glucose Readings</Text>

          {readings.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No readings yet</Text>
              <Text style={styles.emptySubtext}>Client hasn't logged any glucose readings</Text>
            </View>
          ) : (
            readings.slice(0, 10).map((reading) => (
              <View key={reading.id} style={styles.readingCard}>
                <View style={styles.readingHeader}>
                  <View>
                    <Text style={styles.readingValue}>{reading.value} mg/dL</Text>
                    <Text style={styles.readingDate}>{formatDate(reading.measured_at)}</Text>
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: colors.white,
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.sage,
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textLight,
    fontWeight: '400',
  },
  content: {
    flex: 1,
  },
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
    color: colors.warmBrown,
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
    color: colors.warmBrown,
  },
  symptomNotes: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 10,
    lineHeight: 20,
  },
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