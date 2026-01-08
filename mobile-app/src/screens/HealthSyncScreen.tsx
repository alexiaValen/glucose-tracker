// mobile-app/src/screens/HealthSyncScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { healthKitService } from '../services/healthkit.service';
//import healthKitService from '../services/healthkit.service';
import { colors } from '../theme/colors';

interface SyncStatus {
  isConnected: boolean;
  lastSync: Date | null;
  latestGlucose: { value: number; timestamp: string } | null;
  autoSyncEnabled: boolean;
}

export const HealthSyncScreen: React.FC = () => {
  const [status, setStatus] = useState<SyncStatus>({
    isConnected: false,
    lastSync: null,
    latestGlucose: null,
    autoSyncEnabled: false,
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setIsLoading(true);

      // Check if available
      const isConnected = await healthKitService.isAvailable();
      
      // Get last sync time
      const lastSync = await healthKitService.getLastSyncTime();
      
      // Get auto-sync status
      const autoSyncEnabled = await healthKitService.isAutoSyncEnabled();
      
      // Get latest glucose
      let latestGlucose = null;
      if (isConnected) {
        const latest = await healthKitService.getLatestGlucose();
        if (latest) {
          latestGlucose = {
            value: latest.value,
            timestamp: latest.timestamp,
          };
        }
      }

      setStatus({
        isConnected,
        lastSync,
        latestGlucose,
        autoSyncEnabled,
      });
    } catch (error) {
      console.error('Error loading status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const success = await healthKitService.requestPermissions();
      if (success) {
        Alert.alert(
          'Success',
          'Connected to Apple Health! You can now sync your glucose readings.',
          [{ text: 'OK', onPress: loadStatus }]
        );
      } else {
        Alert.alert(
          'Permission Denied',
          'Please enable Health permissions in Settings to use this feature.'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to Apple Health');
      console.error(error);
    }
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const count = await healthKitService.syncToBackend();
      
      Alert.alert(
        'Sync Complete',
        `${count} ${count === 1 ? 'reading' : 'readings'} synced from Apple Health`
      );
      
      await loadStatus();
    } catch (error) {
      Alert.alert('Sync Failed', 'Could not sync with Apple Health');
      console.error(error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleAutoSync = async (enabled: boolean) => {
    try {
      await healthKitService.setAutoSync(enabled);
      setStatus((prev) => ({ ...prev, autoSyncEnabled: enabled }));
      
      if (enabled) {
        Alert.alert(
          'Auto-Sync Enabled',
          'Your glucose readings will sync automatically every 15 minutes'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Could not update auto-sync setting');
      console.error(error);
    }
  };

  const formatTimestamp = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return d.toLocaleDateString();
  };

  if (Platform.OS !== 'ios') {
    return (
      <View style={styles.container}>
        <View style={styles.unavailableContainer}>
          <Ionicons name="phone-portrait-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.unavailableTitle}>iOS Only</Text>
          <Text style={styles.unavailableText}>
            Apple Health integration is only available on iOS devices
          </Text>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Connection Status */}
      <View style={styles.section}>
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.statusIconContainer}>
              <Ionicons
                name={status.isConnected ? 'checkmark-circle' : 'alert-circle-outline'}
                size={32}
                color={status.isConnected ? colors.success : colors.textSecondary}
              />
            </View>
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTitle}>
                {status.isConnected ? 'Connected' : 'Not Connected'}
              </Text>
              <Text style={styles.statusSubtitle}>
                {status.isConnected
                  ? 'Syncing with Apple Health'
                  : 'Connect to sync glucose data'}
              </Text>
            </View>
          </View>

          {!status.isConnected && (
            <TouchableOpacity style={styles.connectButton} onPress={handleConnect}>
              <Text style={styles.connectButtonText}>Connect Apple Health</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {status.isConnected && (
        <>
          {/* Latest Glucose */}
          {status.latestGlucose && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Latest from Apple Health</Text>
              <View style={styles.glucoseCard}>
                <View style={styles.glucoseMain}>
                  <Text style={styles.glucoseValue}>{status.latestGlucose.value}</Text>
                  <Text style={styles.glucoseUnit}>mg/dL</Text>
                </View>
                <Text style={styles.glucoseTime}>
                  {formatTimestamp(status.latestGlucose.timestamp)}
                </Text>
              </View>
            </View>
          )}

          {/* Sync Controls */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sync Settings</Text>
            
            {/* Manual Sync */}
            <TouchableOpacity
              style={styles.syncButton}
              onPress={handleSync}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Ionicons name="sync-outline" size={20} color={colors.white} />
                  <Text style={styles.syncButtonText}>Sync Now</Text>
                </>
              )}
            </TouchableOpacity>

            {status.lastSync && (
              <Text style={styles.lastSyncText}>
                Last synced: {formatTimestamp(status.lastSync)}
              </Text>
            )}

            {/* Auto-Sync Toggle */}
            <View style={styles.autoSyncCard}>
              <View style={styles.autoSyncText}>
                <Text style={styles.autoSyncTitle}>Automatic Sync</Text>
                <Text style={styles.autoSyncSubtitle}>
                  Sync every 15 minutes in background
                </Text>
              </View>
              <Switch
                value={status.autoSyncEnabled}
                onValueChange={handleToggleAutoSync}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={status.autoSyncEnabled ? colors.primary : colors.white}
              />
            </View>
          </View>

          {/* Info Cards */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How It Works</Text>
            
            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="watch-outline" size={24} color={colors.primary} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Apple Watch</Text>
                <Text style={styles.infoText}>
                  Readings from your CGM or blood glucose apps automatically sync through Apple Health
                </Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="sync-circle-outline" size={24} color={colors.primary} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Two-Way Sync</Text>
                <Text style={styles.infoText}>
                  Readings you enter in GraceFlow are also saved to Apple Health
                </Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="shield-checkmark-outline" size={24} color={colors.primary} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Privacy First</Text>
                <Text style={styles.infoText}>
                  Your health data stays on your device. Only synced readings are shared with your coach
                </Text>
              </View>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },

  // Status Card
  statusCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIconContainer: {
    marginRight: 12,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  connectButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  connectButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },

  // Glucose Card
  glucoseCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  glucoseMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  glucoseValue: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.primary,
  },
  glucoseUnit: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.textSecondary,
    marginLeft: 8,
  },
  glucoseTime: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  // Sync Controls
  syncButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  syncButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  lastSyncText: {
    textAlign: 'center',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  autoSyncCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  autoSyncText: {
    flex: 1,
    marginRight: 12,
  },
  autoSyncTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  autoSyncSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  // Info Cards
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // Unavailable State
  unavailableContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  unavailableTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    marginTop: 20,
    marginBottom: 12,
  },
  unavailableText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});