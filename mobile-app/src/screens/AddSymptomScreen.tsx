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
import { useSymptomStore } from '../stores/symptomStore';

type AddSymptomScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddSymptom'>;

interface Props {
  navigation: AddSymptomScreenNavigationProp;
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

const SYMPTOM_TYPES = [
  { id: 'headache', label: 'Headache' },
  { id: 'fatigue', label: 'Fatigue' },
  { id: 'dizziness', label: 'Dizziness' },
  { id: 'hunger', label: 'Hunger' },
  { id: 'irritability', label: 'Irritability' },
  { id: 'nausea', label: 'Nausea' },
  { id: 'shaking', label: 'Shaking' },
  { id: 'sweating', label: 'Sweating' },
  { id: 'brain_fog', label: 'Brain Fog' },
  { id: 'anxiety', label: 'Anxiety' },
  { id: 'cramps', label: 'Cramps' },
  { id: 'bloating', label: 'Bloating' },
  { id: 'mood_swings', label: 'Mood Swings' },
  { id: 'other', label: 'Other' },
];

export default function AddSymptomScreen({ navigation }: Props) {
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Log Symptom</Text>
        <Text style={styles.subtitle}>Track how you're feeling</Text>
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
            {/* Symptom Selection */}
            <View style={styles.section}>
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
                    <Text
                      style={[
                        styles.symptomLabel,
                        selectedType === symptom.id && styles.symptomLabelActive,
                      ]}
                    >
                      {symptom.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Severity Slider */}
            <View style={styles.section}>
              <Text style={styles.label}>Severity</Text>
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
                  <View style={styles.severityValueDisplay}>
                    <Text style={styles.severityValueText}>{severity}</Text>
                    <Text style={styles.severityValueLabel}>/10</Text>
                  </View>
                  <Text style={styles.severityLabelText}>Severe</Text>
                </View>
              </View>
            </View>

            {/* Notes */}
            <View style={styles.section}>
              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Any additional details about how you're feeling..."
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
                {isLoading ? 'Saving...' : 'Save Symptom'}
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
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textDark,
    letterSpacing: 0.2,
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
    paddingVertical: 14,
    paddingHorizontal: 20,
    minWidth: '30%',
    alignItems: 'center',
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
  symptomLabel: {
    fontSize: 14,
    color: colors.textDark,
    fontWeight: '500',
    textAlign: 'center',
  },
  symptomLabelActive: {
    color: colors.white,
    fontWeight: '600',
  },
  severityContainer: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  severityNumbers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  severityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.cream,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  severityButtonActive: {
    backgroundColor: colors.sage,
    borderColor: colors.sage,
  },
  severityText: {
    fontSize: 13,
    color: colors.textDark,
    fontWeight: '600',
  },
  severityTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  severityLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  severityLabelText: {
    fontSize: 12,
    color: colors.textLight,
    fontWeight: '500',
  },
  severityValueDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: colors.cream,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  severityValueText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.sage,
  },
  severityValueLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textLight,
    marginLeft: 2,
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