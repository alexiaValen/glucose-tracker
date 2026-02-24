// mobile-app/src/components/RhythmCard.tsx
// Adapts display based on cycle profile

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { getRhythmForPhase, RHYTHM_PHASES, RhythmPhase } from '../data/rhythmData';
import { colors } from '../theme/colors';
import { CycleProfile } from '../screens/SettingsScreen';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

// Feeling-based options for irregular/peri/menopause users
const FEELING_OPTIONS: { label: string; description: string; phase: string; emoji: string }[] = [
  { phase: 'menstrual',  emoji: '🌱', label: 'Resting',    description: 'Low energy, withdrawing inward' },
  { phase: 'follicular', emoji: '🍃', label: 'Rising',     description: 'Energy returning, feeling creative' },
  { phase: 'ovulation',  emoji: '🌞', label: 'Radiant',    description: 'Confident, connected, expressive' },
  { phase: 'luteal',     emoji: '🌾', label: 'Grounding',  description: 'Inward, reflective, need for stillness' },
];

interface Props {
  phase?: string;           // from cycle log — used for regular cycles
  currentDay?: number;
  cycleProfile?: CycleProfile;
}

export function RhythmCard({ phase, currentDay, cycleProfile = 'regular' }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [showFeelingSel, setShowFeelingSel] = useState(false);

  // Regular cycle: use logged phase
  // Irregular/peri/menopause/unknown: use feeling selector
  const useFeeling = cycleProfile !== 'regular';
  const activePhase = useFeeling ? selectedPhase : (phase ?? null);
  const rhythm = activePhase ? getRhythmForPhase(activePhase) : null;

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  const handleFeelingSelect = (p: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedPhase(p);
    setShowFeelingSel(false);
  };

  // Profile-aware header label
  const getHeaderLabel = () => {
    if (cycleProfile === 'menopause') return 'YOUR SEASON';
    if (cycleProfile === 'perimenopause') return 'YOUR RHYTHM';
    if (cycleProfile === 'irregular') return 'YOUR RHYTHM';
    return 'SPIRITUAL RHYTHM';
  };

  // ── Feeling selector state (no phase chosen yet) ──────────────────────────
  if (useFeeling && (!selectedPhase || showFeelingSel)) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardLabel}>{getHeaderLabel()}</Text>
        <Text style={styles.feelingPrompt}>How are you feeling today?</Text>
        {FEELING_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.phase}
            style={styles.feelingOption}
            onPress={() => handleFeelingSelect(opt.phase)}
            activeOpacity={0.7}
          >
            <Text style={styles.feelingEmoji}>{opt.emoji}</Text>
            <View style={styles.feelingContent}>
              <Text style={styles.feelingLabel}>{opt.label}</Text>
              <Text style={styles.feelingDescription}>{opt.description}</Text>
            </View>
            <Text style={styles.feelingArrow}>→</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  // ── No rhythm resolved ────────────────────────────────────────────────────
  if (!rhythm) return null;

  // ── Rhythm card (regular or feeling-selected) ─────────────────────────────
  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: rhythm.color }]}
      onPress={handleToggle}
      activeOpacity={0.9}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.emoji}>{rhythm.emoji}</Text>
          <View>
            <Text style={[styles.phaseName, { color: rhythm.color }]}>{rhythm.name}</Text>
            <Text style={styles.phaseSubtitle}>{rhythm.subtitle}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          {useFeeling && (
            <TouchableOpacity
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setShowFeelingSel(true);
              }}
              style={styles.changeBtn}
            >
              <Text style={styles.changeBtnText}>Change</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.chevron}>{expanded ? '↑' : '↓'}</Text>
        </View>
      </View>

      <Text style={styles.spiritualRhythm}>{rhythm.spiritualRhythm}</Text>

      {expanded && (
        <View style={styles.expandedContent}>
          <View style={[styles.divider, { backgroundColor: rhythm.color + '30' }]} />

          <Text style={styles.sectionLabel}>BODY</Text>
          <Text style={styles.bodyText}>{rhythm.physiology}</Text>

          <Text style={[styles.sectionLabel, { marginTop: 12 }]}>SCRIPTURE</Text>
          <Text style={[styles.scriptureRef, { color: rhythm.color }]}>
            {rhythm.scripture.reference}
          </Text>
          <Text style={styles.scriptureText}>{rhythm.scripture.text}</Text>

          <Text style={[styles.sectionLabel, { marginTop: 12 }]}>PRACTICE</Text>
          <Text style={styles.bodyText}>{rhythm.practice}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(107,127,110,0.3)',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1,
    color: 'rgba(107,127,110,0.7)', marginBottom: 10,
  },
  feelingPrompt: {
    fontSize: 15, fontWeight: '600', color: colors.textDark,
    marginBottom: 14, letterSpacing: 0.1,
  },
  feelingOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(212,214,212,0.3)',
  },
  feelingEmoji: { fontSize: 22, width: 30 },
  feelingContent: { flex: 1 },
  feelingLabel: { fontSize: 15, fontWeight: '600', color: colors.textDark, marginBottom: 2 },
  feelingDescription: { fontSize: 12, color: colors.textMuted, lineHeight: 16 },
  feelingArrow: { fontSize: 16, color: colors.textMuted },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 6,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  emoji: { fontSize: 22 },
  phaseName: { fontSize: 17, fontWeight: '600', letterSpacing: 0.2 },
  phaseSubtitle: { fontSize: 11, color: colors.textMuted, letterSpacing: 0.3, marginTop: 1 },
  changeBtn: {
    backgroundColor: 'rgba(107,127,110,0.1)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  changeBtnText: { fontSize: 11, fontWeight: '600', color: colors.forestGreen },
  chevron: { fontSize: 14, color: colors.textMuted },
  spiritualRhythm: { fontSize: 13, color: colors.textMedium, fontStyle: 'italic', lineHeight: 19 },
  expandedContent: { marginTop: 12 },
  divider: { height: 1, marginBottom: 12 },
  sectionLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 1.2, color: colors.textMuted, marginBottom: 4 },
  bodyText: { fontSize: 13, color: colors.textMedium, lineHeight: 20 },
  scriptureRef: { fontSize: 12, fontWeight: '600', letterSpacing: 0.3, marginBottom: 3 },
  scriptureText: { fontSize: 13, color: colors.textDark, fontStyle: 'italic', lineHeight: 20 },
});