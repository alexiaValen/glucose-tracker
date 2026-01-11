// mobile-app/src/screens/AddSymptomScreen.tsx
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
import { useNavigation } from '@react-navigation/native';
import { symptomService } from '../services/symptom.service';
import { colors } from '../theme/colors';
import { BotanicalBackground } from '../components/BotanicalBackground';

const SYMPTOM_TYPES = [
  { id: 'headache', label: 'Headache', icon: '🌫️' },
  { id: 'fatigue', label: 'Fatigue', icon: '🍂' },
  { id: 'dizziness', label: 'Dizziness', icon: '🌀' },
  { id: 'hunger', label: 'Hunger', icon: '🌾' },
  { id: 'irritability', label: 'Irritability', icon: '⚡' },
  { id: 'nausea', label: 'Nausea', icon: '🌊' },
  { id: 'shaking', label: 'Shaking', icon: '🍃' },
  { id: 'sweating', label: 'Sweating', icon: '💧' },
  { id: 'brain_fog', label: 'Brain Fog', icon: '☁️' },
  { id: 'anxiety', label: 'Anxiety', icon: '🌪️' },
  { id: 'cramps', label: 'Cramps', icon: '🌿' },
  { id: 'bloating', label: 'Bloating', icon: '🎈' },
  { id: 'mood_swings', label: 'Mood Swings', icon: '🎭' },
  { id: 'other', label: 'Other', icon: '✨' },
];

export default function AddSymptomScreen() {
  const navigation = useNavigation();

  const [selectedType, setSelectedType] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [severity, setSeverity] = useState(5);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedType) {
      Alert.alert('Error', 'Please select a symptom');
      return;
    }

    try {
      setIsLoading(true);

      await symptomService.createSymptom({
        symptomType: selectedType,
        severity,
        notes: notes.trim() || undefined,
      });

      Alert.alert('Success', 'Symptom logged', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.error || 'Failed to log symptom');
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (value: number) => {
    if (value <= 3) return colors.sage;
    if (value <= 6) return colors.goldLeaf;
    return colors.warmBrown;
  };

  const getSeverityLabel = (value: number) => {
    if (value <= 3) return 'Mild';
    if (value <= 6) return 'Moderate';
    return 'Severe';
  };

  const selectedSymptom = SYMPTOM_TYPES.find(s => s.id === selectedType);

  return (
    <BotanicalBackground variant="green" intensity="light">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Log Symptoms</Text>
          <Text style={styles.subtitle}>Track how you're feeling today</Text>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView 
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Symptom Selector */}
            <View style={styles.section}>
              <Text style={styles.label}>How are you feeling?</Text>

              <TouchableOpacity
                style={styles.dropdownTrigger}
                onPress={() => setShowDropdown(!showDropdown)}
              >
                {selectedSymptom ? (
                  <View style={styles.selectedSymptom}>
                    <Text style={styles.selectedIcon}>{selectedSymptom.icon}</Text>
                    <Text style={styles.selectedText}>{selectedSymptom.label}</Text>
                  </View>
                ) : (
                  <Text style={styles.placeholder}>Select a symptom...</Text>
                )}
                <Text style={styles.chevron}>{showDropdown ? '▴' : '▾'}</Text>
              </TouchableOpacity>

              {showDropdown && (
                <View style={styles.dropdown}>
                  <ScrollView 
                    style={styles.dropdownScroll}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={false}
                  >
                    {SYMPTOM_TYPES.map((symptom) => (
                      <TouchableOpacity
                        key={symptom.id}
                        style={[
                          styles.dropdownItem,
                          selectedType === symptom.id && styles.dropdownItemSelected
                        ]}
                        onPress={() => {
                          setSelectedType(symptom.id);
                          setShowDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownIcon}>{symptom.icon}</Text>
                        <Text style={[
                          styles.dropdownText,
                          selectedType === symptom.id && styles.dropdownTextSelected
                        ]}>
                          {symptom.label}
                        </Text>
                        {selectedType === symptom.id && (
                          <Text style={styles.checkmark}>✓</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Severity Slider */}
            <View style={styles.section}>
              <View style={styles.severityHeader}>
                <Text style={styles.label}>Severity</Text>
                <View style={styles.severityBadge}>
                  <Text style={[
                    styles.severityValue,
                    { color: getSeverityColor(severity) }
                  ]}>
                    {severity}/10
                  </Text>
                  <Text style={styles.severityLabelText}>
                    {getSeverityLabel(severity)}
                  </Text>
                </View>
              </View>

              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.severitySlider}
              >
                {Array.from({ length: 10 }).map((_, i) => {
                  const value = i + 1;
                  const isSelected = severity === value;
                  const color = getSeverityColor(value);
                  
                  return (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.severityButton,
                        isSelected && { 
                          backgroundColor: color,
                          borderColor: color,
                          transform: [{ scale: 1.1 }]
                        }
                      ]}
                      onPress={() => setSeverity(value)}
                    >
                      <Text style={[
                        styles.severityButtonText,
                        isSelected && styles.severityButtonTextActive
                      ]}>
                        {value}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Visual severity indicator */}
              <View style={styles.severityBar}>
                <View 
                  style={[
                    styles.severityBarFill,
                    { 
                      width: `${severity * 10}%`,
                      backgroundColor: getSeverityColor(severity)
                    }
                  ]} 
                />
              </View>
            </View>

            {/* Notes */}
            <View style={styles.section}>
              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Any additional details about how you're feeling..."
                placeholderTextColor={colors.textLight}
                multiline
                value={notes}
                onChangeText={setNotes}
                maxLength={500}
              />
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitButton, isLoading && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={isLoading || !selectedType}
            >
              {!isLoading && (
                <View style={styles.buttonIconContainer}>
                  <Text style={styles.buttonIcon}>✓</Text>
                </View>
              )}
              <Text style={styles.submitText}>
                {isLoading ? 'Saving…' : 'Log Symptom'}
              </Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </BotanicalBackground>
  );
}

const styles = StyleSheet.create({
  container: {
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
    fontWeight: '600',
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
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 28,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
    color: colors.textDark,
    letterSpacing: 0.2,
  },

  // Dropdown Trigger
  dropdownTrigger: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  selectedSymptom: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  selectedText: {
    fontSize: 16,
    color: colors.textDark,
    fontWeight: '500',
  },
  placeholder: {
    fontSize: 15,
    color: colors.textLight,
    flex: 1,
  },
  chevron: {
    fontSize: 18,
    color: colors.textLight,
    marginLeft: 8,
  },

  // Inline Dropdown
  dropdown: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.sage,
    borderRadius: 16,
    marginTop: 8,
    maxHeight: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  dropdownScroll: {
    maxHeight: 280,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  dropdownItemSelected: {
    backgroundColor: colors.paleGreen,
  },
  dropdownIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  dropdownText: {
    fontSize: 16,
    color: colors.textDark,
    flex: 1,
  },
  dropdownTextSelected: {
    fontWeight: '600',
    color: colors.sage,
  },
  checkmark: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.sage,
  },

  // Severity Header
  severityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.paleGreen,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  severityValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  severityLabelText: {
    fontSize: 14,
    color: colors.textLight,
    fontWeight: '500',
  },

  // Horizontal Severity Slider
  severitySlider: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 8,
  },
  severityButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  severityButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textDark,
  },
  severityButtonTextActive: {
    color: colors.white,
    fontWeight: '700',
  },

  // Severity Bar
  severityBar: {
    height: 6,
    backgroundColor: colors.borderLight,
    borderRadius: 3,
    marginTop: 16,
    overflow: 'hidden',
  },
  severityBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Notes
  textInput: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    color: colors.textDark,
    fontSize: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },

  // Submit
  submitButton: {
    backgroundColor: colors.sage,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  buttonIcon: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  submitText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});