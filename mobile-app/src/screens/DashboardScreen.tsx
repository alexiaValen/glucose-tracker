
import { Alert, Platform } from 'react-native';
import { useCycleStore } from '../stores/cycleStore';
import { CYCLE_PHASES } from '../types/cycle';
import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { useGlucoseStore } from '../stores/glucoseStore';
import { useSymptomStore } from '../stores/symptomStore';
import { SYMPTOM_TYPES } from '../types/symptom';

export default function DashboardScreen({ navigation }: any) {
  const { 
    user, 
    logout 
  } = useAuthStore();

  const { 
    readings, 
    stats, 
    isLoading, 
    fetchReadings, 
    fetchStats,
    syncFromHealthKit,      // newest 
    initializeHealthKit //newest
    } = useGlucoseStore();
  const { 
    symptoms, 
    fetchSymptoms 
  } = useSymptomStore();
  const { 
    currentCycle, 
    fetchCurrentCycle 
  } = useCycleStore();

  useEffect(() => {
    fetchReadings();
    fetchStats();
    fetchSymptoms();
    fetchCurrentCycle();
  }, []);

const [isSyncing, setIsSyncing] = React.useState(false);
const [lastSyncTime, setLastSyncTime] = React.useState<Date | null>(null);

const handleHealthKitSync = async () => {
  if (Platform.OS !== 'ios') {
    Alert.alert('Not Available', 'HealthKit is only available on iOS devices');
    return;
  }

  setIsSyncing(true);
  
  try {
    // First, initialize/request permissions
    const initialized = await initializeHealthKit();
    
    if (!initialized) {
      Alert.alert(
        'Permission Required',
        'Please grant access to HealthKit in Settings to sync your glucose data.'
      );
      setIsSyncing(false);
      return;
    }

    // Sync data
    const syncedCount = await syncFromHealthKit();
    setLastSyncTime(new Date());
    
    Alert.alert(
      'Sync Complete',
      `Synced ${syncedCount} new reading${syncedCount !== 1 ? 's' : ''} from Apple Health`
    );
  } catch (error: any) {
    console.error('Sync error:', error);
    Alert.alert('Sync Failed', error.message || 'Could not sync from HealthKit');
  } finally {
    setIsSyncing(false);
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
      fasting: '🌅 Fasting',
      pre_meal: '🍽️ Before Meal',
      post_meal: '🍴 After Meal',
      bedtime: '🌙 Bedtime',
      other: '📊 Other',
    };
    return labels[context || 'other'] || '📊';
  };

  const getSymptomEmoji = (type: string) => {
    const symptom = SYMPTOM_TYPES.find(s => s.id === type);
    return symptom?.emoji || '📝';
  };

  const getSymptomLabel = (type: string) => {
    const symptom = SYMPTOM_TYPES.find(s => s.id === type);
    if (!symptom) return type;
    return symptom.label.replace(/.*\s/, '');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.firstName || 'there'}! 👋</Text>
          <Text style={styles.subtitle}>Grace & Glucose</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Stats Card */}
        {stats && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Last 7 Days</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.avgGlucose.toFixed(0)}</Text>
                <Text style={styles.statLabel}>Avg</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.minGlucose.toFixed(0)}</Text>
                <Text style={styles.statLabel}>Min</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.maxGlucose.toFixed(0)}</Text>
                <Text style={styles.statLabel}>Max</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.timeInRange.toFixed(0)}%</Text>
                <Text style={styles.statLabel}>In Range</Text>
              </View>
            </View>
          </View>
        )}

        {/* Cycle Card */}
        {currentCycle && (
          <View style={styles.cycleCard}>
            <View style={styles.cycleHeader}>
              <Text style={styles.cycleTitle}>Current Cycle</Text>
              <Text style={styles.cycleDay}>Day {currentCycle.current_day}</Text>
            </View>
            <View style={styles.cyclePhase}>
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

       {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonPrimary]}
            onPress={() => navigation.navigate('AddGlucose')}
          >
            <Text style={styles.actionButtonText}>+ Glucose</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={() => navigation.navigate('AddSymptom')}
          >
            <Text style={styles.actionButtonTextSecondary}>+ Symptom</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonCycle]}
            onPress={() => navigation.navigate('LogCycle')}
          >
            <Text style={styles.actionButtonTextCycle}>🩸 Cycle</Text>
          </TouchableOpacity>
        </View>

        {/* HealthKit Sync Section - ADD THIS NEW SECTION */}
        {Platform.OS === 'ios' && (
          <View style={styles.healthKitSection}>
            <View style={styles.healthKitHeader}>
              <Text style={styles.healthKitTitle}>🍎 Apple Health</Text>
              {lastSyncTime && (
                <Text style={styles.lastSyncText}>
                  Last synced: {formatDate(lastSyncTime.toISOString())}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]}
              onPress={handleHealthKitSync}
              disabled={isSyncing}
            >
              <Text style={styles.syncButtonText}>
                {isSyncing ? '⏳ Syncing...' : '🔄 Sync from Apple Health'}
              </Text>
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
                  <Text style={styles.symptomIcon}>
                    {getSymptomEmoji(symptom.symptom_type)}
                  </Text>
                  <View style={styles.symptomInfo}>
                    <Text style={styles.symptomType}>
                      {getSymptomLabel(symptom.symptom_type)}
                    </Text>
                    <Text style={styles.symptomDate}>
                      {formatDate(symptom.logged_at)}
                    </Text>
                  </View>
                  <Text style={styles.symptomSeverity}>
                    {symptom.severity}/10
                  </Text>
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
            <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 20 }} />
          ) : readings.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No readings yet</Text>
              <Text style={styles.emptySubtext}>Tap "+ Glucose" to add your first reading</Text>
            </View>
          ) : (
            readings.slice(0, 5).map((reading) => (
              <View key={reading.id} style={styles.readingCard}>
                <View style={styles.readingHeader}>
                  <Text style={styles.readingValue}>{reading.value} mg/dL</Text>
                  <Text style={styles.readingContext}>
                    {getMealContextLabel(reading.mealContext)}
                  </Text>
                </View>
                <Text style={styles.readingDate}>{formatDate(reading.measuredAt)}</Text>
                {reading.notes && <Text style={styles.readingNotes}>{reading.notes}</Text>}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  statsCard: {
    backgroundColor: '#FFF',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonPrimary: {
    backgroundColor: '#6366F1',
  },
  actionButtonSecondary: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonTextSecondary: {
    color: '#6366F1',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  symptomCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  symptomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  symptomIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  symptomInfo: {
    flex: 1,
  },
  symptomType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  symptomDate: {
    fontSize: 12,
    color: '#999',
  },
  symptomSeverity: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  symptomNotes: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  readingCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  readingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  readingValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  readingContext: {
    fontSize: 14,
    color: '#666',
  },
  readingDate: {
    fontSize: 12,
    color: '#999',
  },
  readingNotes: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  cycleCard: {
    backgroundColor: '#FEF2F2',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FCA5A5',
  },
  cycleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cycleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#991B1B',
  },
  cycleDay: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  cyclePhase: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  cyclePhaseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  cycleFlow: {
    fontSize: 14,
    color: '#991B1B',
  },
  actionButtonCycle: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  actionButtonTextCycle: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  healthKitSection: {
    backgroundColor: '#F0F9FF',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  healthKitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  healthKitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0369A1',
  },
  lastSyncText: {
    fontSize: 11,
    color: '#0369A1',
  },
  syncButton: {
    backgroundColor: '#0EA5E9',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  syncButtonDisabled: {
    backgroundColor: '#BAE6FD',
  },
  syncButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
});