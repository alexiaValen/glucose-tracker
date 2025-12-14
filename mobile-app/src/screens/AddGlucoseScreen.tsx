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
import { useGlucoseStore } from '../stores/glucoseStore';

const MEAL_CONTEXTS = [
  { label: 'Fasting', value: 'fasting' },
  { label: 'Before Meal', value: 'pre_meal' },
  { label: 'After Meal', value: 'post_meal' },
  { label: 'Bedtime', value: 'bedtime' },
  { label: 'Other', value: 'other' },
];

export default function AddGlucoseScreen({ navigation }: any) {
  const [value, setValue] = useState('');
  const [selectedContext, setSelectedContext] = useState('fasting');
  const [notes, setNotes] = useState('');
  const { addReading, isLoading } = useGlucoseStore();

  const handleSubmit = async () => {
    const glucoseValue = parseFloat(value);

    if (!value || isNaN(glucoseValue)) {
      Alert.alert('Error', 'Please enter a valid glucose value');
      return;
    }

    if (glucoseValue < 20 || glucoseValue > 600) {
      Alert.alert('Error', 'Glucose value must be between 20-600 mg/dL');
      return;
    }

    try {
      await addReading(glucoseValue, selectedContext, notes);
      Alert.alert('Success', 'Glucose reading saved!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to save reading');
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
          <Text style={styles.title}>Log Glucose</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Glucose Level (mg/dL)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 95"
            value={value}
            onChangeText={setValue}
            keyboardType="numeric"
            editable={!isLoading}
          />

          <Text style={styles.label}>Context</Text>
          <View style={styles.contextButtons}>
            {MEAL_CONTEXTS.map((context) => (
              <TouchableOpacity
                key={context.value}
                style={[
                  styles.contextButton,
                  selectedContext === context.value && styles.contextButtonActive,
                ]}
                onPress={() => setSelectedContext(context.value)}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.contextButtonText,
                    selectedContext === context.value && styles.contextButtonTextActive,
                  ]}
                >
                  {context.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="How are you feeling?"
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
              {isLoading ? 'Saving...' : 'Save Reading'}
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
    marginBottom: 8,
    marginTop: 16,
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
  contextButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  contextButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  contextButtonActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  contextButtonText: {
    fontSize: 14,
    color: '#666',
  },
  contextButtonTextActive: {
    color: '#FFF',
    fontWeight: '600',
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