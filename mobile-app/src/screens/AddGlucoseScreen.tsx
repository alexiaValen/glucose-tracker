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
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useGlucoseStore } from '../stores/glucoseStore';

type AddGlucoseScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddGlucose'>;

interface Props {
  navigation: AddGlucoseScreenNavigationProp;
}

// Match Dashboard colors
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

const MEAL_CONTEXTS = [
  { label: 'Fasting', value: 'fasting' },
  { label: 'Before Meal', value: 'pre_meal' },
  { label: 'After Meal', value: 'post_meal' },
  { label: 'Bedtime', value: 'bedtime' },
  { label: 'Other', value: 'other' },
];

export default function AddGlucoseScreen({ navigation }: Props) {
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Log Glucose</Text>
        <Text style={styles.subtitle}>Track your glucose levels</Text>
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
            {/* Glucose Input */}
            <View style={styles.inputSection}>
              <Text style={styles.label}>Glucose Level</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 95"
                  placeholderTextColor={colors.textLight}
                  value={value}
                  onChangeText={setValue}
                  keyboardType="numeric"
                  editable={!isLoading}
                />
                <Text style={styles.unit}>mg/dL</Text>
              </View>
            </View>

            {/* Context Selection */}
            <View style={styles.section}>
              <Text style={styles.label}>Context</Text>
              <View style={styles.contextGrid}>
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
            </View>

            {/* Notes */}
            <View style={styles.section}>
              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput
                style={styles.textArea}
                placeholder="How are you feeling? Any additional context..."
                placeholderTextColor={colors.textLight}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                editable={!isLoading}
                textAlignVertical="top"
              />
            </View>

            {/* Submit Button */}
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
  inputSection: {
    gap: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textDark,
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  input: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    color: colors.sage,
    paddingVertical: 20,
  },
  unit: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
    marginLeft: 8,
  },
  contextGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  contextButton: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    minWidth: '30%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  contextButtonActive: {
    backgroundColor: colors.sage,
    borderColor: colors.sage,
  },
  contextButtonText: {
    fontSize: 14,
    color: colors.textDark,
    fontWeight: '500',
  },
  contextButtonTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  textArea: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    fontSize: 15,
    color: colors.textDark,
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  submitButton: {
    backgroundColor: colors.sage,
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
    backgroundColor: colors.lightSage,
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});