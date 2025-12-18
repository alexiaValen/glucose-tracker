import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useCycleStore } from '../stores/cycleStore';
import { CYCLE_SYMPTOMS } from '../types/cycle';

export default function LogCycleScreen({ navigation }: any) {
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
      
      Alert.alert('Success', 'Cycle started!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to log cycle');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Log Period Start</Text>
          <Text style={styles.subtitle}>Track your menstrual cycle</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Flow</Text>
          <View style={styles.flowButtons}>
            {['light', 'medium', 'heavy'].map((flow) => (
              <TouchableOpacity
                key={flow}
                style={[
                  styles.flowButton,
                  selectedFlow === flow && styles.flowButtonActive,
                ]}
                onPress={() => setSelectedFlow(flow as any)}
                disabled={isLoading}
              >
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
                  {symptom.replace(/_/g, ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.submitButtonText}>
              {isLoading ? 'Starting...' : 'Start Cycle'}
            </Text>
          </TouchableOpacity>
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
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    fontSize: 16,
    color: '#6366F1',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginTop: 16,
  },
  flowButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  flowButton: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  flowButtonActive: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  flowButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  flowButtonTextActive: {
    color: '#EF4444',
  },
  symptomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  symptomButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  symptomButtonActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  symptomButtonText: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  symptomButtonTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    backgroundColor: '#FCA5A5',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});