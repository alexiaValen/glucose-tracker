// mobile-app/src/screens/HealthSyncScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { healthKitService } from '../services/healthKit.service';

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
  green: '#10B981',
  red: '#EF4444',
};

export default function HealthSyncScreen({ navigation }: any) {
  const [isHealthKitAvailable, setIsHealthKitAvailable] = useState(false);
  const [isHealthKitEnabled, setIsHealthKitEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });
  const [stats, setStats] = useState<any>(null);
  const [lastSyncDate, setLastSyncDate] = useState<Date | null>(null);

  useEffect(() => {
    checkHealthKitStatus();
  }, []);

  const checkHealthKitStatus = async () => {
    setIsLoading(true);
    try {
      const available = await healthKitService.isAvailable();
      setIsHealthKitAvailable(available);

      if (available) {
        // Try to get stats to see if we have permission
        const glucoseStats = await healthKitService.getGlucoseStats(7);
        setIsHealthKitEnabled(!!glucoseStats);
        setStats(glucoseStats);
      }
    } catch (error) {
      console.error('Error checking HealthKit status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnableHealthKit = async () => {
    try {
      const success = await healthKitService.initialize();
      if (success) {
        setIsHealthKitEnabled(true);
        Alert.alert('Success', 'Apple Health integration enabled!');
        loadHealthData();
      } else {
        Alert.alert('Error', 'Failed to enable Apple Health integration');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to enable Apple Health integration');
    }
  };

  const loadHealthData = async () => {
    try {
      const glucoseStats = await healthKitService.getGlucoseStats(30);
      setStats(glucoseStats);
    } catch (error) {
      console.error('Error loading health data:', error);
    }
  };

  const handleSyncNow = async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    setSyncProgress({ current: 0, total: 0 });

    try {
      const result = await healthKitService.syncGlucoseToBackend(
        (current, total) => {
          setSyncProgress({ current, total });
        }
      );

      setLastSyncDate(new Date());
      
      Alert.alert(
        'Sync Complete',
        `Successfully synced ${result.synced} readings${result.failed > 0 ? `\n${result.failed} failed` : ''}`
      );

      // Reload stats
      await loadHealthData();
    } catch (error) {
      Alert.alert('Error', 'Failed to sync glucose data');
    } finally {
      setIsSyncing(false);
      setSyncProgress({ current: 0, total: 0 });
    }
  };

  const handleReadLatest = async () => {
    try {
      const latest = await healthKitService.getLatestGlucoseReading();
      if (latest) {
        Alert.alert(
          'Latest Reading',
          `${latest.value} mg/dL\n${latest.date.toLocaleString()}\nSource: ${latest.source || 'Unknown'}`
        );
      } else {
        Alert.alert('No Data', 'No recent glucose readings found in Apple Health');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to read glucose data');
    }
  };

  const handleWriteTest = async () => {
    Alert.prompt(
      'Test Write',
      'Enter glucose value (mg/dL)',
      async (value) => {
        const glucoseValue = parseInt(value);
        if (isNaN(glucoseValue) || glucoseValue < 20 || glucoseValue > 600) {
          Alert.alert('Invalid', 'Please enter a valid glucose value (20-600)');
          return;
        }

        const success = await healthKitService.writeGlucoseData(glucoseValue);
        if (success) {
          Alert.alert('Success', `Wrote ${glucoseValue} mg/dL to Apple Health`);
        } else {
          Alert.alert('Error', 'Failed to write to Apple Health');
        }
      },
      'plain-text',
      '100'
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.sage} />
      </View>
    );
  }

  if (!isHealthKitAvailable) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Health Sync</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.unavailableContainer}>
          <Text style={styles.unavailableIcon}>⚕️</Text>
          <Text style={styles.unavailableText}>Apple Health Not Available</Text>
          <Text style={styles.unavailableSubtext}>
            This device doesn't support Apple Health integration
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Health Sync</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <View>
              <Text style={styles.cardTitle}>Apple Health</Text>
              <Text style={styles.statusText}>
                {isHealthKitEnabled ? 'Connected' : 'Not Connected'}
              </Text>
            </View>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: isHealthKitEnabled ? colors.green : colors.red },
              ]}
            />
          </View>

          {!isHealthKitEnabled && (
            <TouchableOpacity style={styles.enableButton} onPress={handleEnableHealthKit}>
              <Text style={styles.enableButtonText}>Enable Apple Health</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats Card */}
        {isHealthKitEnabled && stats && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>30-Day Apple Health Stats</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.average}</Text>
                <Text style={styles.statLabel}>Average</Text>
                <Text style={styles.statUnit}>mg/dL</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.timeInRange}%</Text>
                <Text style={styles.statLabel}>Time in Range</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.min}</Text>
                <Text style={styles.statLabel}>Lowest</Text>
                <Text style={styles.statUnit}>mg/dL</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.max}</Text>
                <Text style={styles.statLabel}>Highest</Text>
                <Text style={styles.statUnit}>mg/dL</Text>
              </View>
            </View>
            <Text style={styles.statsFooter}>
              {stats.totalReadings} readings in Apple Health
            </Text>
          </View>
        )}

        {/* Sync Card */}
        {isHealthKitEnabled && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sync Data</Text>
            <Text style={styles.cardDescription}>
              Import glucose readings from Apple Health to GraceFlow
            </Text>

            {lastSyncDate && (
              <Text style={styles.lastSyncText}>
                Last synced: {lastSyncDate.toLocaleString()}
              </Text>
            )}

            {isSyncing && syncProgress.total > 0 && (
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>
                  Syncing {syncProgress.current} of {syncProgress.total}...
                </Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${(syncProgress.current / syncProgress.total) * 100}%` },
                    ]}
                  />
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]}
              onPress={handleSyncNow}
              disabled={isSyncing}
            >
              <Text style={styles.syncButtonText}>
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Actions Card */}
        {isHealthKitEnabled && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Actions</Text>

            <TouchableOpacity style={styles.actionButton} onPress={handleReadLatest}>
              <Text style={styles.actionButtonText}>📖 Read Latest Reading</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleWriteTest}>
              <Text style={styles.actionButtonText}>✏️ Write Test Reading</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={loadHealthData}>
              <Text style={styles.actionButtonText}>🔄 Refresh Stats</Text>
            </TouchableOpacity>
          </View>
        )}

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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.cream,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    paddingVertical: 8,
  },
  backText: {
    color: colors.sage,
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textDark,
  },
  content: {
    flex: 1,
  },
  card: {
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 4,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  enableButton: {
    backgroundColor: colors.sage,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  enableButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    marginBottom: 12,
  },
  statItem: {
    width: '50%',
    padding: 8,
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.sage,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textDark,
    marginBottom: 2,
  },
  statUnit: {
    fontSize: 12,
    color: colors.textLight,
  },
  statsFooter: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 8,
  },
  lastSyncText: {
    fontSize: 13,
    color: colors.textLight,
    marginBottom: 12,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressText: {
    fontSize: 14,
    color: colors.textDark,
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.sage,
  },
  syncButton: {
    backgroundColor: colors.sage,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  syncButtonDisabled: {
    backgroundColor: colors.lightSage,
    opacity: 0.6,
  },
  syncButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: colors.cream,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 15,
    color: colors.textDark,
    fontWeight: '500',
  },
  unavailableContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  unavailableIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  unavailableText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 8,
    textAlign: 'center',
  },
  unavailableSubtext: {
    fontSize: 15,
    color: colors.textLight,
    textAlign: 'center',
  },
});