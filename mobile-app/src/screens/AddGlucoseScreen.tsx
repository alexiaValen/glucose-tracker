// mobile-app/src/screens/AddGlucoseScreen.tsx
// PREMIUM CLINICAL-CALM REDESIGN
import React, { useState, useEffect } from 'react';
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

type AddGlucoseScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddGlucose'>;

interface Props {
  navigation: AddGlucoseScreenNavigationProp;
}

const CONTEXTS = [
  { label: 'Fasting', value: 'fasting' },
  { label: 'Pre-meal', value: 'pre_meal' },
  { label: 'Post-meal', value: 'post_meal' },
  { label: 'Bedtime', value: 'bedtime' },
];

export default function AddGlucoseScreen({ navigation }: Props) {
  const [value, setValue] = useState('');
  const [selectedContext, setSelectedContext] = useState('fasting');
  const [notes, setNotes] = useState('');
  const { addReading, isLoading, stats } = useGlucoseStore();

  // Calculate intelligent microcopy
  const getContextualHint = () => {
    const val = parseFloat(value);
    if (isNaN(val)) return null;

    const avgGlucose = stats?.average || stats?.avgGlucose || 0;
    
    if (selectedContext === 'fasting') {
      if (val < 70) return 'Below typical fasting range';
      if (val > 100) return 'Above typical fasting range';
      return 'Within expected fasting range';
    }
    
    if (avgGlucose && Math.abs(val - avgGlucose) > 30) {
      return val > avgGlucose 
        ? 'Higher than your recent average'
        : 'Lower than your recent average';
    }
    
    return null;
  };

  const handleSubmit = async () => {
    const glucoseValue = parseFloat(value);

    if (!value || isNaN(glucoseValue)) {
      Alert.alert('Invalid Entry', 'Please enter a valid glucose value');
      return;
    }

    if (glucoseValue < 20 || glucoseValue > 600) {
      Alert.alert('Out of Range', 'Glucose value must be between 20-600 mg/dL');
      return;
    }

    try {
      await addReading(glucoseValue, selectedContext, notes);
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to save reading');
    }
  };

  const contextualHint = getContextualHint();

  return (
    <BotanicalBackground variant="green" intensity="light">
      <View style={styles.container}>
        {/* Minimal Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Log Glucose</Text>
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
            {/* Glucose Reading Section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>GLUCOSE READING</Text>
              
              <View style={styles.measurementContainer}>
                <TextInput
                  style={styles.measurementInput}
                  placeholder="—"
                  placeholderTextColor="rgba(42,45,42,0.2)"
                  value={value}
                  onChangeText={setValue}
                  keyboardType="decimal-pad"
                  editable={!isLoading}
                  maxLength={3}
                />
                <Text style={styles.measurementUnit}>mg/dL</Text>
              </View>

              {/* Range Reference */}
              <Text style={styles.referenceText}>
                {selectedContext === 'fasting' 
                  ? 'Typical fasting range: 70–100'
                  : 'Target range: 70–180'}
              </Text>

              {/* Contextual Intelligence */}
              {contextualHint && (
                <View style={styles.intelligenceBar}>
                  <View style={styles.intelligenceDot} />
                  <Text style={styles.intelligenceText}>{contextualHint}</Text>
                </View>
              )}
            </View>

            {/* Context Selection - Segmented Control */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>CONTEXT</Text>
              
              <View style={styles.segmentedControl}>
                {CONTEXTS.map((context) => (
                  <TouchableOpacity
                    key={context.value}
                    style={[
                      styles.segment,
                      selectedContext === context.value && styles.segmentActive,
                    ]}
                    onPress={() => setSelectedContext(context.value)}
                    disabled={isLoading}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        selectedContext === context.value && styles.segmentTextActive,
                      ]}
                    >
                      {context.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Reflective Notes */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>CONTEXT NOTES</Text>
              <Text style={styles.promptText}>
                Anything that might explain this reading?
              </Text>
              <View style={styles.notesInset}>
                <TextInput
                  style={styles.notesInput}
                  placeholder="What changed today..."
                  placeholderTextColor="rgba(42,45,42,0.35)"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={4}
                  editable={!isLoading}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Primary Action */}
            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>
                {isLoading ? 'Saving…' : 'Log glucose'}
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
  flex: {
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

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
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

  // Measurement Input - Instrument Style
  measurementContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(42,45,42,0.12)',
  },
  measurementInput: {
    fontSize: 56,
    fontWeight: '300',
    color: '#2A2D2A',
    letterSpacing: -1,
    minWidth: 120,
    padding: 0,
    margin: 0,
  },
  measurementUnit: {
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(42,45,42,0.4)',
    marginLeft: 8,
    marginBottom: 8,
  },

  // Reference Text
  referenceText: {
    fontSize: 13,
    color: 'rgba(42,45,42,0.5)',
    marginTop: 12,
    fontWeight: '400',
    letterSpacing: 0.1,
  },

  // Intelligence Bar
  intelligenceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(107,127,110,0.06)',
    borderRadius: 8,
  },
  intelligenceDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#6B7F6E',
    marginRight: 10,
  },
  intelligenceText: {
    fontSize: 13,
    color: '#6B7F6E',
    fontWeight: '500',
    letterSpacing: 0.1,
  },

  // Segmented Control
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(212,214,212,0.4)',
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(42,45,42,0.5)',
    letterSpacing: 0.1,
  },
  segmentTextActive: {
    color: '#2A2D2A',
    fontWeight: '600',
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
    minHeight: 88,
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