// mobile-app/src/screens/AddGlucoseScreen.tsx
// REFACTORED: no scroll on happy path, context chips, notes collapsed
import React, { useState, useRef } from 'react';
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
import { colors } from '../theme/colors';
import { BotanicalBackground } from '../components/BotanicalBackground';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AddGlucose'>;
};

const CONTEXTS = [
  { label: 'Fasting',    value: 'fasting'    },
  { label: 'Pre-meal',   value: 'pre_meal'   },
  { label: 'Post-meal',  value: 'post_meal'  },
  { label: 'Bedtime',    value: 'bedtime'    },
];

export default function AddGlucoseScreen({ navigation }: Props) {
  const [value, setValue] = useState('');
  const [selectedContext, setSelectedContext] = useState('fasting');
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const { addReading, isLoading, stats } = useGlucoseStore();

  const numVal = parseFloat(value);
  const isValid = !isNaN(numVal) && numVal >= 20 && numVal <= 600;

  // Contextual hint — single line, no card needed
  const getHint = (): string | null => {
    if (!isValid) return null;
    const avg = stats?.average || stats?.avgGlucose || 0;
    if (selectedContext === 'fasting') {
      if (numVal < 70) return 'Below typical fasting range (70–100)';
      if (numVal > 100) return 'Above typical fasting range (70–100)';
      return null; // in range — no noise
    }
    if (avg && Math.abs(numVal - avg) > 30) {
      return numVal > avg ? 'Higher than your recent average' : 'Lower than your recent average';
    }
    return null;
  };

  const hint = getHint();

  const handleSubmit = async () => {
    if (!isValid) {
      Alert.alert('Invalid Entry', 'Enter a value between 20–600 mg/dL');
      return;
    }
    try {
      await addReading(numVal, selectedContext, notes.trim() || undefined);
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to save reading');
    }
  };

  return (
    <BotanicalBackground variant="green" intensity="light">
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Log Glucose</Text>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >

            {/* ── Large number input ── */}
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => inputRef.current?.focus()}
              style={styles.inputBlock}
            >
              <View style={styles.measureRow}>
                <TextInput
                  ref={inputRef}
                  style={styles.measureInput}
                  placeholder="—"
                  placeholderTextColor="rgba(42,45,42,0.2)"
                  value={value}
                  onChangeText={setValue}
                  keyboardType="decimal-pad"
                  maxLength={3}
                  editable={!isLoading}
                  autoFocus
                />
                <Text style={styles.measureUnit}>mg/dL</Text>
              </View>
              <View style={styles.inputUnderline} />
              {hint ? (
                <View style={styles.hintRow}>
                  <View style={styles.hintDot} />
                  <Text style={styles.hintText}>{hint}</Text>
                </View>
              ) : (
                <Text style={styles.referenceText}>
                  {selectedContext === 'fasting' ? 'Target: 70–100' : 'Target: 70–180'}
                </Text>
              )}
            </TouchableOpacity>

            {/* ── Context chips ── */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>WHEN?</Text>
              <View style={styles.contextRow}>
                {CONTEXTS.map(ctx => (
                  <TouchableOpacity
                    key={ctx.value}
                    style={[styles.contextChip, selectedContext === ctx.value && styles.contextChipActive]}
                    onPress={() => setSelectedContext(ctx.value)}
                    activeOpacity={0.75}
                    disabled={isLoading}
                  >
                    <Text style={[styles.contextLabel, selectedContext === ctx.value && styles.contextLabelActive]}>
                      {ctx.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* ── Optional notes (collapsed by default) ── */}
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
                <>
                  <Text style={styles.sectionLabel}>CONTEXT</Text>
                  <View style={styles.notesContainer}>
                    <TextInput
                      style={styles.notesInput}
                      placeholder="What might explain this reading…"
                      placeholderTextColor="rgba(42,45,42,0.35)"
                      value={notes}
                      onChangeText={setNotes}
                      multiline
                      maxLength={300}
                      textAlignVertical="top"
                      editable={!isLoading}
                      autoFocus
                    />
                  </View>
                </>
              )}
            </View>

            {/* ── Primary action ── */}
            <TouchableOpacity
              style={[styles.primaryButton, (!isValid || isLoading) && styles.primaryButtonDisabled]}
              onPress={handleSubmit}
              disabled={!isValid || isLoading}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>
                {isLoading ? 'Saving…' : isValid ? `Log ${numVal} mg/dL` : 'Enter a reading above'}
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
  backButton: { marginBottom: 16, alignSelf: 'flex-start' },
  backText: { fontSize: 15, color: '#6B7F6E', fontWeight: '500' },
  headerTitle: { fontSize: 22, fontWeight: '600', color: '#2A2D2A', letterSpacing: -0.3 },

  content: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },

  // Number input — instrument style
  inputBlock: {
    marginBottom: 40,
  },
  measureRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  measureInput: {
    fontSize: 64,
    fontWeight: '300',
    color: '#2A2D2A',
    letterSpacing: -2,
    minWidth: 140,
    padding: 0,
    margin: 0,
  },
  measureUnit: {
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(42,45,42,0.4)',
    marginLeft: 10,
    marginBottom: 8,
  },
  inputUnderline: {
    height: 2,
    backgroundColor: 'rgba(42,45,42,0.1)',
    marginTop: 8,
    marginBottom: 12,
  },
  referenceText: {
    fontSize: 13,
    color: 'rgba(42,45,42,0.45)',
    fontWeight: '400',
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hintDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#6B7F6E',
  },
  hintText: {
    fontSize: 13,
    color: '#6B7F6E',
    fontWeight: '500',
  },

  // Sections
  section: { marginBottom: 28 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(42,45,42,0.5)',
    marginBottom: 12,
  },

  // Context chips
  contextRow: {
    flexDirection: 'row',
    gap: 8,
  },
  contextChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1.5,
    borderColor: 'rgba(212,214,212,0.4)',
  },
  contextChipActive: {
    backgroundColor: 'rgba(107,127,110,0.12)',
    borderColor: '#6B7F6E',
  },
  contextLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(42,45,42,0.5)',
  },
  contextLabelActive: {
    color: '#3D5540',
    fontWeight: '600',
  },

  // Optional notes
  addNotesTrigger: { paddingVertical: 10, alignSelf: 'flex-start' },
  addNotesText: { fontSize: 14, color: '#6B7F6E', fontWeight: '500' },
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