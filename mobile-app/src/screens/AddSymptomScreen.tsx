// mobile-app/src/screens/AddSymptomScreen.tsx
// PREMIUM CLINICAL-CALM REDESIGN
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
  { id: 'headache', label: 'Headache' },
  { id: 'fatigue', label: 'Fatigue' },
  { id: 'dizziness', label: 'Dizziness' },
  { id: 'hunger', label: 'Hunger' },
  { id: 'irritability', label: 'Irritability' },
  { id: 'nausea', label: 'Nausea' },
  { id: 'shaking', label: 'Shaking' },
  { id: 'sweating', label: 'Sweating' },
  { id: 'brain_fog', label: 'Brain fog' },
  { id: 'anxiety', label: 'Anxiety' },
  { id: 'cramps', label: 'Cramps' },
  { id: 'bloating', label: 'Bloating' },
  { id: 'mood_swings', label: 'Mood swings' },
  { id: 'other', label: 'Other' },
];

export default function AddSymptomScreen() {
  const navigation = useNavigation();

  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [severity, setSeverity] = useState(5);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const toggleSymptom = (symptomId: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptomId)
        ? prev.filter(id => id !== symptomId)
        : [...prev, symptomId]
    );
  };

  const handleSubmit = async () => {
    if (selectedSymptoms.length === 0) {
      Alert.alert('Missing Information', 'Please select at least one symptom');
      return;
    }

    try {
      setIsLoading(true);

      // Log each symptom separately with the same severity and notes
      await Promise.all(
        selectedSymptoms.map(symptomType =>
          symptomService.createSymptom({
            symptomType,
            severity,
            notes: notes.trim() || undefined,
          })
        )
      );

      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.error || 'Failed to log symptoms');
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityLabel = (value: number) => {
    if (value <= 3) return 'Mild';
    if (value <= 6) return 'Moderate';
    return 'Severe';
  };

  const getSeverityColor = (value: number) => {
    if (value <= 3) return 'rgba(107,127,110,0.5)';
    if (value <= 6) return 'rgba(184,164,95,0.7)';
    return 'rgba(139,111,71,0.8)';
  };

  return (
    <BotanicalBackground variant="green" intensity="light">
      <View style={styles.container}>
        {/* Minimal Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Log Symptoms</Text>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView 
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Symptom Multi-Select Dropdown */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>SYMPTOMS</Text>

              {/* Dropdown Trigger */}
              <TouchableOpacity
                style={styles.dropdownTrigger}
                onPress={() => setShowDropdown(!showDropdown)}
              >
                <View style={styles.dropdownTriggerContent}>
                  {selectedSymptoms.length === 0 ? (
                    <Text style={styles.placeholderText}>Select symptoms</Text>
                  ) : (
                    <Text style={styles.selectedCountText}>
                      {selectedSymptoms.length} {selectedSymptoms.length === 1 ? 'symptom' : 'symptoms'} selected
                    </Text>
                  )}
                </View>
                <Text style={styles.dropdownChevron}>{showDropdown ? '▴' : '▾'}</Text>
              </TouchableOpacity>

              {/* Selected Symptoms Pills */}
              {selectedSymptoms.length > 0 && (
                <View style={styles.selectedPills}>
                  {selectedSymptoms.map(symptomId => {
                    const symptom = SYMPTOM_TYPES.find(s => s.id === symptomId);
                    return (
                      <View key={symptomId} style={styles.pill}>
                        <Text style={styles.pillText}>{symptom?.label}</Text>
                        <TouchableOpacity
                          onPress={() => toggleSymptom(symptomId)}
                          style={styles.pillRemove}
                        >
                          <Text style={styles.pillRemoveText}>×</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Dropdown List */}
              {showDropdown && (
                <View style={styles.dropdownList}>
                  <ScrollView
                    style={styles.dropdownScroll}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={false}
                  >
                    {SYMPTOM_TYPES.map((symptom) => {
                      const isSelected = selectedSymptoms.includes(symptom.id);
                      return (
                        <TouchableOpacity
                          key={symptom.id}
                          style={[
                            styles.dropdownItem,
                            isSelected && styles.dropdownItemSelected
                          ]}
                          onPress={() => toggleSymptom(symptom.id)}
                        >
                          {/* Checkbox */}
                          <View style={styles.checkbox}>
                            {isSelected && (
                              <View style={styles.checkboxInner} />
                            )}
                          </View>
                          <Text style={[
                            styles.dropdownItemText,
                            isSelected && styles.dropdownItemTextSelected
                          ]}>
                            {symptom.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Severity Scale - Horizontal Selector */}
            <View style={styles.section}>
              <View style={styles.severityHeader}>
                <Text style={styles.sectionLabel}>SEVERITY</Text>
                <Text style={styles.severityValue}>
                  {severity} / 10 · {getSeverityLabel(severity)}
                </Text>
              </View>

              {/* Horizontal Scale with Tap Points */}
              <View style={styles.scaleContainer}>
                {/* Progress Bar */}
                <View style={styles.scaleTrack}>
                  <View 
                    style={[
                      styles.scaleProgress,
                      { 
                        width: `${severity * 10}%`,
                        backgroundColor: getSeverityColor(severity),
                      }
                    ]} 
                  />
                </View>

                {/* Tap Points */}
                <View style={styles.scalePoints}>
                  {Array.from({ length: 10 }).map((_, i) => {
                    const value = i + 1;
                    const isSelected = severity === value;
                    return (
                      <TouchableOpacity
                        key={value}
                        style={styles.scalePoint}
                        onPress={() => setSeverity(value)}
                        activeOpacity={0.7}
                      >
                        <View style={[
                          styles.scalePointDot,
                          isSelected && { 
                            backgroundColor: getSeverityColor(value),
                            transform: [{ scale: 1.5 }]
                          }
                        ]} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Anchor Labels */}
              <View style={styles.anchorLabels}>
                <Text style={styles.anchorLabel}>Mild</Text>
                <Text style={styles.anchorLabel}>Severe</Text>
              </View>
            </View>

            {/* Reflective Notes */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>ADDITIONAL CONTEXT</Text>
              <Text style={styles.promptText}>
                What changed today?
              </Text>
              <View style={styles.notesInset}>
                <TextInput
                  style={styles.notesInput}
                  placeholder="Activity, meals, stressors..."
                  placeholderTextColor="rgba(42,45,42,0.35)"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  maxLength={500}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Primary Action */}
            <TouchableOpacity
              style={[styles.primaryButton, (isLoading || selectedSymptoms.length === 0) && styles.primaryButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading || selectedSymptoms.length === 0}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>
                {isLoading ? 'Saving…' : 'Add entry'}
              </Text>
            </TouchableOpacity>

            <View style={{ height: 60 }} />
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

  // Header - Minimal
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212,214,212,0.25)',
  },
  backButton: {
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 15,
    color: '#6B7F6E',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#2A2D2A',
    letterSpacing: -0.3,
  },

  content: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },

  // Section Layout
  section: {
    marginBottom: 40,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(42,45,42,0.5)',
    marginBottom: 16,
  },

  // Dropdown Trigger
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(212,214,212,0.4)',
  },
  dropdownTriggerContent: {
    flex: 1,
  },
  placeholderText: {
    fontSize: 15,
    color: 'rgba(42,45,42,0.4)',
    fontWeight: '400',
  },
  selectedCountText: {
    fontSize: 15,
    color: '#2A2D2A',
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  dropdownChevron: {
    fontSize: 14,
    color: 'rgba(42,45,42,0.5)',
    fontWeight: '600',
    marginLeft: 12,
  },

  // Selected Pills
  selectedPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 8,
    backgroundColor: 'rgba(107,127,110,0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(107,127,110,0.2)',
  },
  pillText: {
    fontSize: 13,
    color: '#6B7F6E',
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  pillRemove: {
    marginLeft: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(107,127,110,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillRemoveText: {
    fontSize: 16,
    color: '#6B7F6E',
    fontWeight: '600',
    lineHeight: 16,
  },

  // Dropdown List
  dropdownList: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(107,127,110,0.3)',
    maxHeight: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  dropdownScroll: {
    maxHeight: 280,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212,214,212,0.2)',
  },
  dropdownItemSelected: {
    backgroundColor: 'rgba(107,127,110,0.04)',
  },
  dropdownItemText: {
    fontSize: 15,
    color: 'rgba(42,45,42,0.7)',
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  dropdownItemTextSelected: {
    color: '#2A2D2A',
    fontWeight: '500',
  },

  // Checkbox
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(42,45,42,0.25)',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 10,
    height: 10,
    borderRadius: 3,
    backgroundColor: '#6B7F6E',
  },

  // Severity Scale
  severityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  severityValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2A2D2A',
    letterSpacing: 0.2,
  },

  // Custom Scale Selector
  scaleContainer: {
    marginBottom: 12,
  },
  scaleTrack: {
    height: 4,
    backgroundColor: 'rgba(212,214,212,0.3)',
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  scaleProgress: {
    height: '100%',
    borderRadius: 2,
  },
  scalePoints: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  scalePoint: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scalePointDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(42,45,42,0.25)',
  },

  // Anchor Labels
  anchorLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 8,
  },
  anchorLabel: {
    fontSize: 12,
    color: 'rgba(42,45,42,0.5)',
    fontWeight: '500',
    letterSpacing: 0.5,
  },

  // Reflective Notes
  promptText: {
    fontSize: 14,
    color: 'rgba(42,45,42,0.6)',
    marginBottom: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  notesInset: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 12,
    padding: 16,
  },
  notesInput: {
    fontSize: 15,
    color: '#2A2D2A',
    lineHeight: 22,
    minHeight: 100,
    padding: 0,
    margin: 0,
    fontWeight: '400',
  },

  // Primary Action - Flat & Calm
  primaryButton: {
    backgroundColor: '#6B7F6E',
    paddingVertical: 17,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});