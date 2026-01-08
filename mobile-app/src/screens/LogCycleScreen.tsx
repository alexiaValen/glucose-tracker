// mobile-app/src/screens/LogCycleScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../theme/colors';
import { cycleService } from '../services/cycle.service';

export const LogCycleScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [startDate, setStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogCycle = async () => {
    setIsLoading(true);
    try {
      await cycleService.logCycleStart(startDate.toISOString());
      
      Alert.alert(
        'Success',
        'Cycle start date logged successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
  console.error('Error logging cycle:', error);
  const errorMessage = error.response?.data?.error || 'Failed to log cycle start date';
  Alert.alert('Error', errorMessage);
} finally {
  setIsLoading(false);
}
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Log Cycle Start</Text>
        <Text style={styles.subtitle}>
          Select the first day of your menstrual cycle
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.dateSection}>
          <Text style={styles.label}>Start Date</Text>
          
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
            disabled={isLoading}
          >
            <Text style={styles.dateText}>
              {startDate.toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setStartDate(selectedDate);
                }
              }}
              maximumDate={new Date()}
            />
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 Tip</Text>
          <Text style={styles.infoText}>
            Log the first day of your period to help track your cycle patterns and
            understand how they may affect your glucose levels.
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.logButton, isLoading && styles.logButtonDisabled]} 
          onPress={handleLogCycle}
          disabled={isLoading}
        >
          <Text style={styles.logButtonText}>
            {isLoading ? 'Logging...' : 'Log Cycle Start'}
          </Text>
        </TouchableOpacity>

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
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
  },
  content: {
    flex: 1,
    padding: 20,
  },
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
    padding: 20,
    borderWidth: 2,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  dateText: {
    fontSize: 17,
    color: colors.textDark,
    textAlign: 'center',
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: colors.accentPeach,
    borderRadius: 14,
    padding: 20,
    marginBottom: 32,
    borderLeftWidth: 4,
    borderLeftColor: colors.sage,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textDark,
    lineHeight: 20,
  },
  logButton: {
    backgroundColor: colors.sage,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
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
  logButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});