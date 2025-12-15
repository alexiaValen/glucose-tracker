import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSymptomStore } from '../stores/symptomStore';
import { SYMPTOM_TYPES } from '../types/symptom';

export default function AddSymptomScreen({ navigation }: any) {
  const [selectedType, setSelectedType] = useState('');
  const [severity, setSeverity] = useState(5);
  const [notes, setNotes] = useState('');
  const { addSymptom, isLoading } = useSymptomStore();

  const handleSubmit = async () => {
    if (!selectedType) {
      Alert.alert('Error', 'Please select a symptom type');
      return;
    }

    try {
      await addSymptom(selectedType, severity, notes);
      Alert.alert('Success', 'Symptom logged!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to log symptom');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Log Symptom</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>How are you feeling?</Text>
          <View style={styles.symptomGrid}>
            {SYMPTOM_TYPES.map((symptom) => (
              <TouchableOpacity
                key={symptom.id}
                style={[
                  styles.symptomButton,
                  selectedType === symptom.id && styles.symptomButtonActive,
                ]}
                onPress={() => setSelectedType(symptom.id)}
                disabled={isLoading}
              >
                <Text style={styles.symptomEmoji}>{symptom.emoji}</Text>
                <Text
                  style={[
                    styles.symptomLabel,
                    selectedType === symptom.id && styles.symptomLabelActive,
                  ]}
                >
                  {symptom.label.replace(symptom.emoji + ' ', '')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Severity (1-10)</Text>
          <View style={styles.severityContainer}>
            <View style={styles.severityNumbers}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.severityButton,
                    severity === num && styles.severityButtonActive,
                  ]}
                  onPress={() => setSeverity(num)}
                  disabled={isLoading}
                >
                  <Text
                    style={[
                      styles.severityText,
                      severity === num && styles.severityTextActive,
                    ]}
                  >
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.severityLabels}>
              <Text style={styles.severityLabelText}>Mild</Text>
              <Text style={styles.severityLabelText}>Severe</Text>
            </View>
          </View>

          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any additional details?"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            editable={!isLoading}
          />

          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.submitButtonText}>
              {isLoading ? 'Saving...' : 'Save Symptom'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  symptomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  symptomButton: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    width: '30%',
    minWidth: 100,
  },
  symptomButtonActive: {
    borderColor: '#6366F1',
    backgroundColor: '#F0F0FF',
  },
  symptomEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  symptomLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  symptomLabelActive: {
    color: '#6366F1',
    fontWeight: '600',
  },
  severityContainer: {
    marginBottom: 8,
  },
  severityNumbers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  severityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  severityButtonActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  severityText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  severityTextActive: {
    color: '#FFF',
  },
  severityLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  severityLabelText: {
    fontSize: 11,
    color: '#999',
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    backgroundColor: '#A5A6F6',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});