// mobile-app/src/components/QuickLogActions.tsx
// Single dominant CTA with secondary actions below — clear hierarchy
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AxisMarker, SeverityContinuum } from './SimpleIcons';

interface Props {
  onLogGlucose: () => void;
  onLogSymptoms: () => void;
  onLogCycle: () => void;
}

export function QuickLogActions({ onLogGlucose, onLogSymptoms, onLogCycle }: Props) {
  return (
    <View style={styles.container}>

      {/* PRIMARY: Log Today — full width, dominant */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={onLogGlucose}
        activeOpacity={0.85}
      >
        <AxisMarker size={20} color="#FFFFFF" />
        <View style={styles.primaryContent}>
          <Text style={styles.primaryLabel}>Log glucose</Text>
          <Text style={styles.primarySub}>Tap to record a reading</Text>
        </View>
        <Text style={styles.primaryArrow}>→</Text>
      </TouchableOpacity>

      {/* SECONDARY: compact row */}
      <View style={styles.secondaryRow}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={onLogSymptoms}
          activeOpacity={0.8}
        >
          <SeverityContinuum size={16} color="#2B2B2B" muted="#CFC9BF" />
          <Text style={styles.secondaryLabel}>Symptoms</Text>
        </TouchableOpacity>

        <View style={styles.secondaryDivider} />

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={onLogCycle}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryEmoji}>🌿</Text>
          <Text style={styles.secondaryLabel}>Cycle</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    gap: 10,
  },

  // Primary — full width, prominent
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6B7F6E',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryContent: { flex: 1 },
  primaryLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
  primarySub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 2,
  },
  primaryArrow: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '400',
  },

  // Secondary — compact side-by-side
  secondaryRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(212,214,212,0.4)',
    overflow: 'hidden',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  secondaryDivider: {
    width: 1,
    backgroundColor: 'rgba(212,214,212,0.5)',
    marginVertical: 10,
  },
  secondaryLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(42,45,42,0.7)',
  },
  secondaryEmoji: {
    fontSize: 15,
  },
});