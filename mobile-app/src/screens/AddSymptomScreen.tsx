// mobile-app/src/screens/AddSymptomScreen.tsx
// REFACTORED: chip grid replaces dropdown, 3-tap severity, < 5 second log
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
  { id: 'fatigue',      label: 'Fatigue',      emoji: '😴' },
  { id: 'headache',     label: 'Headache',     emoji: '🤕' },
  { id: 'brain_fog',    label: 'Brain fog',    emoji: '🌫️' },
  { id: 'cramps',       label: 'Cramps',       emoji: '🩸' },
  { id: 'bloating',     label: 'Bloating',     emoji: '🎈' },
  { id: 'mood_swings',  label: 'Mood swings',  emoji: '🎭' },
  { id: 'anxiety',      label: 'Anxiety',      emoji: '😰' },
  { id: 'irritability', label: 'Irritability', emoji: '😠' },
  { id: 'nausea',       label: 'Nausea',       emoji: '🤢' },
  { id: 'hunger',       label: 'Hunger',       emoji: '🍽️' },
  { id: 'dizziness',    label: 'Dizziness',    emoji: '😵' },
  { id: 'shaking',      label: 'Shaking',      emoji: '🤝' },
  { id: 'sweating',     label: 'Sweating',     emoji: '💦' },
  { id: 'other',        label: 'Other',        emoji: '📝' },
];

// 3-level severity — one tap, done
const SEVERITY_LEVELS = [
  { value: 3,  label: 'Mild',     color: 'rgba(107,127,110,0.8)' },
  { value: 6,  label: 'Moderate', color: 'rgba(184,164,95,0.9)'  },
  { value: 9,  label: 'Severe',   color: 'rgba(139,111,71,0.9)'  },
];

export default function AddSymptomScreen() {
  const navigation = useNavigation();
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [severity, setSeverity] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const canSubmit = selectedSymptoms.length > 0 && severity !== null;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    try {
      setIsLoading(true);
      await Promise.all(
        selectedSymptoms.map(symptomType =>
          symptomService.createSymptom({
            symptomType,
            severity: severity!,
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

  const activeSeverity = SEVERITY_LEVELS.find(s => s.value === severity);

  return (
    <BotanicalBackground variant="green" intensity="light">
      <View style={styles.container}>

        {/* Header */}
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
            keyboardShouldPersistTaps="handled"
          >

            {/* ── Step 1: Symptom chips ── */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>WHAT ARE YOU FEELING?</Text>
              <View style={styles.chipGrid}>
                {SYMPTOM_TYPES.map(symptom => {
                  const active = selectedSymptoms.includes(symptom.id);
                  return (
                    <TouchableOpacity
                      key={symptom.id}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => toggleSymptom(symptom.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.chipEmoji}>{symptom.emoji}</Text>
                      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                        {symptom.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* ── Step 2: Severity (3 taps, shown once something is selected) ── */}
            {selectedSymptoms.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>HOW INTENSE?</Text>
                <View style={styles.severityRow}>
                  {SEVERITY_LEVELS.map(level => {
                    const active = severity === level.value;
                    return (
                      <TouchableOpacity
                        key={level.value}
                        style={[
                          styles.severityButton,
                          active && { backgroundColor: level.color, borderColor: 'transparent' },
                        ]}
                        onPress={() => setSeverity(level.value)}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.severityLabel, active && styles.severityLabelActive]}>
                          {level.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ── Optional notes (collapsed by default) ── */}
            {severity !== null && (
              <View style={styles.section}>
                {!showNotes ? (
                  <TouchableOpacity
                    style={styles.addNotesTrigger}
                    onPress={() => setShowNotes(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.addNotesText}>+ Add context (optional)</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.notesContainer}>
                    <Text style={styles.sectionLabel}>CONTEXT</Text>
                    <TextInput
                      style={styles.notesInput}
                      placeholder="Activity, meals, stressors…"
                      placeholderTextColor="rgba(42,45,42,0.35)"
                      value={notes}
                      onChangeText={setNotes}
                      multiline
                      maxLength={300}
                      textAlignVertical="top"
                      autoFocus
                    />
                  </View>
                )}
              </View>
            )}

            {/* ── Primary action ── */}
            <TouchableOpacity
              style={[styles.primaryButton, (!canSubmit || isLoading) && styles.primaryButtonDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit || isLoading}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>
                {isLoading
                  ? 'Saving…'
                  : canSubmit
                    ? `Log ${selectedSymptoms.length} ${selectedSymptoms.length === 1 ? 'symptom' : 'symptoms'} · ${activeSeverity?.label}`
                    : 'Select symptoms above'}
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
  container: { flex: 1 },

  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212,214,212,0.25)',
  },
  backButton: {
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 15,
    color: '#6B7F6E',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#2A2D2A',
    letterSpacing: -0.3,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 40,
  },

  section: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(42,45,42,0.5)',
    marginBottom: 14,
  },

  // Chip grid — replaces dropdown entirely
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1.5,
    borderColor: 'rgba(212,214,212,0.5)',
  },
  chipActive: {
    backgroundColor: 'rgba(107,127,110,0.12)',
    borderColor: '#6B7F6E',
  },
  chipEmoji: {
    fontSize: 15,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(42,45,42,0.6)',
  },
  chipLabelActive: {
    color: '#3D5540',
    fontWeight: '600',
  },

  // 3-level severity row
  severityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  severityButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1.5,
    borderColor: 'rgba(212,214,212,0.4)',
  },
  severityLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(42,45,42,0.5)',
    letterSpacing: 0.2,
  },
  severityLabelActive: {
    color: '#FFFFFF',
  },

  // Optional notes
  addNotesTrigger: {
    paddingVertical: 12,
    alignSelf: 'flex-start',
  },
  addNotesText: {
    fontSize: 14,
    color: '#6B7F6E',
    fontWeight: '500',
  },
  notesContainer: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 14,
    padding: 16,
  },
  notesInput: {
    fontSize: 15,
    color: '#2A2D2A',
    lineHeight: 22,
    minHeight: 80,
    padding: 0,
    fontWeight: '400',
  },

  // Primary action — contextual label
  primaryButton: {
    backgroundColor: '#6B7F6E',
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  primaryButtonDisabled: {
    backgroundColor: 'rgba(107,127,110,0.35)',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});