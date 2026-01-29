import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../theme/colors';
import { cycleService } from '../services/cycle.service';
import { useCycleStore } from '../stores/cycleStore';

type FlowIntensity = 'light' | 'medium' | 'heavy';

export const LogCycleScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { currentCycle, fetchCurrentCycle } = useCycleStore();
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [flow, setFlow] = useState<FlowIntensity>('medium');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCycle, setIsLoadingCycle] = useState(true);

  useEffect(() => {
    loadCurrentCycle();
  }, []);

  const loadCurrentCycle = async () => {
    setIsLoadingCycle(true);
    try {
      await fetchCurrentCycle();
    } catch (error) {
      console.error('Error loading current cycle:', error);
    } finally {
      setIsLoadingCycle(false);
    }
  };

  const handleStartCycle = async () => {
    setIsLoading(true);
    try {
      await cycleService.logCycleStart(startDate.toISOString());
      
      Alert.alert(
        'Success! 🌸',
        'Cycle start logged successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              fetchCurrentCycle();
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error logging cycle:', error);
      const errorMessage = error.response?.data?.error || 'Failed to log cycle start';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndCycle = async () => {
    if (!currentCycle) return;

    // Validate end date is after start date
    const cycleStart = new Date(currentCycle.cycle_start_date);
    if (endDate <= cycleStart) {
      Alert.alert('Invalid Date', 'End date must be after the start date');
      return;
    }

    setIsLoading(true);
    try {
      await cycleService.updateCycle(currentCycle.id, {
        cycleEndDate: endDate.toISOString(),
        flow,
      });
      
      Alert.alert(
        'Success! ✨',
        'Cycle ended successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              fetchCurrentCycle();
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error ending cycle:', error);
      const errorMessage = error.response?.data?.error || 'Failed to end cycle';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getCycleDuration = () => {
    if (!currentCycle) return 0;
    const start = new Date(currentCycle.cycle_start_date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (isLoadingCycle) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.sage} />
      </View>
    );
  }

  const hasActiveCycle = !!currentCycle;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {hasActiveCycle ? 'End Cycle' : 'Log Cycle Start'}
        </Text>
        <Text style={styles.subtitle}>
          {hasActiveCycle 
            ? 'Track the last day of your menstrual cycle' 
            : 'Track the first day of your menstrual cycle'}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {hasActiveCycle ? (
          /* END CYCLE VIEW */
          <>
            {/* Current Cycle Info */}
            <View style={styles.currentCycleCard}>
              <View style={styles.currentCycleHeader}>
                <Text style={styles.currentCycleIcon}>🌸</Text>
                <View style={styles.currentCycleInfo}>
                  <Text style={styles.currentCycleTitle}>Current Cycle</Text>
                  <Text style={styles.currentCycleDate}>
                    Started: {formatDate(new Date(currentCycle.cycle_start_date))}
                  </Text>
                </View>
              </View>
              <View style={styles.cycleDuration}>
                <Text style={styles.cycleDurationNumber}>{getCycleDuration()}</Text>
                <Text style={styles.cycleDurationLabel}>days</Text>
              </View>
            </View>

            {/* End Date Picker */}
            <View style={styles.dateSection}>
              <Text style={styles.label}>End Date</Text>
              
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowEndPicker(true)}
                disabled={isLoading}
              >
                <View style={styles.dateIconContainer}>
                  <Text style={styles.dateIcon}>📅</Text>
                </View>
                <Text style={styles.dateText}>{formatDate(endDate)}</Text>
              </TouchableOpacity>

              {showEndPicker && (
                <DateTimePicker
                  value={endDate}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowEndPicker(false);
                    if (selectedDate) {
                      setEndDate(selectedDate);
                    }
                  }}
                  minimumDate={new Date(currentCycle.cycle_start_date)}
                  maximumDate={new Date()}
                />
              )}
            </View>

            {/* Flow Intensity Selector */}
            <View style={styles.flowSection}>
              <Text style={styles.label}>Flow Intensity (Optional)</Text>
              <View style={styles.flowOptions}>
                <TouchableOpacity
                  style={[styles.flowButton, flow === 'light' && styles.flowButtonActive]}
                  onPress={() => setFlow('light')}
                  disabled={isLoading}
                >
                  <Text style={[styles.flowEmoji, flow === 'light' && styles.flowEmojiActive]}>
                    💧
                  </Text>
                  <Text style={[styles.flowText, flow === 'light' && styles.flowTextActive]}>
                    Light
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.flowButton, flow === 'medium' && styles.flowButtonActive]}
                  onPress={() => setFlow('medium')}
                  disabled={isLoading}
                >
                  <Text style={[styles.flowEmoji, flow === 'medium' && styles.flowEmojiActive]}>
                    💧💧
                  </Text>
                  <Text style={[styles.flowText, flow === 'medium' && styles.flowTextActive]}>
                    Medium
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.flowButton, flow === 'heavy' && styles.flowButtonActive]}
                  onPress={() => setFlow('heavy')}
                  disabled={isLoading}
                >
                  <Text style={[styles.flowEmoji, flow === 'heavy' && styles.flowEmojiActive]}>
                    💧💧💧
                  </Text>
                  <Text style={[styles.flowText, flow === 'heavy' && styles.flowTextActive]}>
                    Heavy
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* End Cycle Button */}
            <TouchableOpacity 
              style={[styles.logButton, isLoading && styles.logButtonDisabled]} 
              onPress={handleEndCycle}
              disabled={isLoading}
            >
              {!isLoading && (
                <View style={styles.buttonIconContainer}>
                  <Text style={styles.buttonIcon}>✓</Text>
                </View>
              )}
              <Text style={styles.logButtonText}>
                {isLoading ? 'Saving...' : 'End Cycle'}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          /* START CYCLE VIEW */
          <>
            {/* Start Date Picker */}
            <View style={styles.dateSection}>
              <Text style={styles.label}>Start Date</Text>
              
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowStartPicker(true)}
                disabled={isLoading}
              >
                <View style={styles.dateIconContainer}>
                  <Text style={styles.dateIcon}>🌱</Text>
                </View>
                <Text style={styles.dateText}>{formatDate(startDate)}</Text>
              </TouchableOpacity>

              {showStartPicker && (
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowStartPicker(false);
                    if (selectedDate) {
                      setStartDate(selectedDate);
                    }
                  }}
                  maximumDate={new Date()}
                />
              )}
            </View>

            {/* Info Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Text style={styles.infoIcon}>🌿</Text>
                <Text style={styles.infoTitle}>Cycle Tracking</Text>
              </View>
              <Text style={styles.infoText}>
                Tracking your cycle helps you understand how hormonal changes may affect your glucose levels throughout the month. Notice patterns and adjust your care accordingly.
              </Text>
            </View>

            {/* Start Cycle Button */}
            <TouchableOpacity 
              style={[styles.logButton, isLoading && styles.logButtonDisabled]} 
              onPress={handleStartCycle}
              disabled={isLoading}
            >
              {!isLoading && (
                <View style={styles.buttonIconContainer}>
                  <Text style={styles.buttonIcon}>✓</Text>
                </View>
              )}
              <Text style={styles.logButtonText}>
                {isLoading ? 'Logging...' : 'Log Cycle Start'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginBottom: 12,
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
  },
  subtitle: {
    fontSize: 15,
    color: colors.textLight,
  },
  content: {
    flex: 1,
    padding: 20,
  },

  // Current Cycle Card
  currentCycleCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: colors.sage,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  currentCycleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  currentCycleIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  currentCycleInfo: {
    flex: 1,
  },
  currentCycleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: 4,
  },
  currentCycleDate: {
    fontSize: 14,
    color: colors.textLight,
  },
  cycleDuration: {
    alignItems: 'center',
    paddingLeft: 16,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  cycleDurationNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.sage,
  },
  cycleDurationLabel: {
    fontSize: 12,
    color: colors.textLight,
    fontWeight: '600',
  },

  // Date Section
  dateSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  dateButton: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 18,
    borderWidth: 2,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  dateIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dateIcon: {
    fontSize: 20,
  },
  dateText: {
    fontSize: 16,
    color: colors.textDark,
    fontWeight: '500',
    flex: 1,
  },

  // Flow Section
  flowSection: {
    marginBottom: 24,
  },
  flowOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  flowButton: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  flowButtonActive: {
    borderColor: colors.sage,
    backgroundColor: colors.lightSage,
  },
  flowEmoji: {
    fontSize: 24,
    marginBottom: 6,
    opacity: 0.5,
  },
  flowEmojiActive: {
    opacity: 1,
  },
  flowText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textLight,
  },
  flowTextActive: {
    color: colors.sage,
  },

  // Info Card
  infoCard: {
    backgroundColor: colors.accentPeach,
    borderRadius: 14,
    padding: 18,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: colors.sage,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoIcon: {
    fontSize: 22,
    marginRight: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
  },
  infoText: {
    fontSize: 14,
    color: colors.textDark,
    lineHeight: 20,
  },

  // Log Button
  logButton: {
    backgroundColor: colors.sage,
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  logButtonDisabled: {
    backgroundColor: colors.lightSage,
    opacity: 0.6,
  },
  buttonIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  buttonIcon: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  logButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default LogCycleScreen;