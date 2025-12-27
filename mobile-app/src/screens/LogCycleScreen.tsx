import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useCycleStore } from '../stores/cycleStore';
import { CYCLE_SYMPTOMS } from '../types/cycle';

type LogCycleScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'LogCycle'>;

interface Props {
  navigation: LogCycleScreenNavigationProp;
}

// Match Dashboard colors with period-specific red
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
  // Period-specific colors
  periodRed: '#EF4444',
  periodLight: '#FEF2F2',
  periodBorder: '#FECACA',
};

export default function LogCycleScreen({ navigation }: Props) {
  const [selectedFlow, setSelectedFlow] = useState<'light' | 'medium' | 'heavy'>('medium');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const { startCycle, isLoading } = useCycleStore();

  const toggleSymptom = (symptom: string) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== symptom));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };

  const handleSubmit = async () => {
    try {
      const today = new Date().toISOString();
      await startCycle(today, selectedFlow, selectedSymptoms);
      
      Alert.alert('Success', 'Period started!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to log cycle');
    }
  };

  const formatSymptom = (symptom: string) => {
    return symptom
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Log Period Start</Text>
          <Text style={styles.subtitle}>Track your menstrual cycle</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.form}>
            {/* Flow Selection */}
            <View style={styles.section}>
              <Text style={styles.label}>Flow</Text>
              <View style={styles.flowContainer}>
                {(['light', 'medium', 'heavy'] as const).map((flow) => (
                  <TouchableOpacity
                    key={flow}
                    style={[
                      styles.flowButton,
                      selectedFlow === flow && styles.flowButtonActive,
                    ]}
                    onPress={() => setSelectedFlow(flow)}
                    disabled={isLoading}
                  >
                    <View style={styles.flowIconContainer}>
                      <Text style={styles.flowIcon}>💧</Text>
                      {flow === 'medium' && <Text style={styles.flowIcon}>💧</Text>}
                      {flow === 'heavy' && (
                        <>
                          <Text style={styles.flowIcon}>💧</Text>
                          <Text style={styles.flowIcon}>💧</Text>
                        </>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.flowButtonText,
                        selectedFlow === flow && styles.flowButtonTextActive,
                      ]}
                    >
                      {flow.charAt(0).toUpperCase() + flow.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Symptoms Selection */}
            <View style={styles.section}>
              <Text style={styles.label}>Symptoms (Optional)</Text>
              <View style={styles.symptomGrid}>
                {CYCLE_SYMPTOMS.map((symptom) => (
                  <TouchableOpacity
                    key={symptom}
                    style={[
                      styles.symptomButton,
                      selectedSymptoms.includes(symptom) && styles.symptomButtonActive,
                    ]}
                    onPress={() => toggleSymptom(symptom)}
                    disabled={isLoading}
                  >
                    <Text
                      style={[
                        styles.symptomButtonText,
                        selectedSymptoms.includes(symptom) && styles.symptomButtonTextActive,
                      ]}
                    >
                      {formatSymptom(symptom)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Summary Card */}
            {(selectedFlow || selectedSymptoms.length > 0) && (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Summary</Text>
                <View style={styles.summaryContent}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Flow:</Text>
                    <Text style={styles.summaryValue}>
                      {selectedFlow.charAt(0).toUpperCase() + selectedFlow.slice(1)}
                    </Text>
                  </View>
                  {selectedSymptoms.length > 0 && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Symptoms:</Text>
                      <Text style={styles.summaryValue}>
                        {selectedSymptoms.length} selected
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <Text style={styles.submitButtonText}>
                {isLoading ? 'Starting Cycle...' : 'Start Cycle'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  flex: {
    flex: 1,
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
  titleContainer: {
    gap: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.charcoal,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textLight,
    fontWeight: '400',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  form: {
    gap: 24,
  },
  section: {
    gap: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textDark,
    letterSpacing: 0.2,
  },
  flowContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  flowButton: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  flowButtonActive: {
    borderColor: colors.periodRed,
    backgroundColor: colors.periodLight,
    borderWidth: 3,
  },
  flowIconContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  flowIcon: {
    fontSize: 20,
  },
  flowButtonText: {
    fontSize: 14,
    color: colors.textDark,
    fontWeight: '500',
  },
  flowButtonTextActive: {
    color: colors.periodRed,
    fontWeight: '600',
  },
  symptomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  symptomButton: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  symptomButtonActive: {
    backgroundColor: colors.sage,
    borderColor: colors.sage,
  },
  symptomButtonText: {
    fontSize: 14,
    color: colors.textDark,
    fontWeight: '500',
  },
  symptomButtonTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.periodRed,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  summaryContent: {
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textLight,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: colors.textDark,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: colors.periodRed,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: colors.periodBorder,
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});