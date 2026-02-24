// mobile-app/src/screens/RhythmScreen.tsx
// Dedicated Rhythm tab screen

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BotanicalBackground } from '../components/BotanicalBackground';
import { colors } from '../theme/colors';
import { getRhythmForPhase, RHYTHM_PHASES } from '../data/rhythmData';
import { CYCLE_PROFILE_KEY, CycleProfile } from './RhythmProfileScreen';
import { useCycleStore } from '../stores/cycleStore';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const FEELING_OPTIONS = [
  { phase: 'menstrual',  emoji: '🌱', label: 'Resting',   description: 'Low energy, withdrawing inward' },
  { phase: 'follicular', emoji: '🍃', label: 'Rising',    description: 'Energy returning, feeling creative' },
  { phase: 'ovulation',  emoji: '🌞', label: 'Radiant',   description: 'Confident, connected, expressive' },
  { phase: 'luteal',     emoji: '🌾', label: 'Grounding', description: 'Inward, reflective, need for stillness' },
];

const PROFILE_HEADER: Record<CycleProfile, { title: string; subtitle: string }> = {
  regular:       { title: 'Your Rhythm',  subtitle: 'Based on your cycle' },
  irregular:     { title: 'Your Rhythm',  subtitle: 'Choose how you feel today' },
  perimenopause: { title: 'Your Rhythm',  subtitle: 'Choose how you feel today' },
  menopause:     { title: 'Your Season',  subtitle: 'Choose your rhythm today' },
  unknown:       { title: 'Your Rhythm',  subtitle: 'Choose how you feel today' },
};

export default function RhythmScreen({ navigation }: { navigation: any }) {
  const { currentCycle, fetchCurrentCycle } = useCycleStore();
  const [cycleProfile, setCycleProfile] = useState<CycleProfile>('regular');
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState(false);

  useEffect(() => {
    fetchCurrentCycle();
    AsyncStorage.getItem(CYCLE_PROFILE_KEY).then((val) => {
      if (val) setCycleProfile(val as CycleProfile);
    });
  }, []);

  const useFeeling = cycleProfile !== 'regular';
  const activePhase = useFeeling
    ? selectedPhase
    : currentCycle?.phase ?? null;

  const rhythm = activePhase ? getRhythmForPhase(activePhase) : null;
  const header = PROFILE_HEADER[cycleProfile];

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedPhase(expandedPhase === id ? null : id);
  };

  return (
    <BotanicalBackground variant="green" intensity="light">
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{header.title}</Text>
          <Text style={styles.headerSubtitle}>{header.subtitle}</Text>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >

          {/* ── Today's Rhythm ── */}
          <Text style={styles.sectionLabel}>TODAY</Text>

          {/* Feeling selector for non-regular profiles */}
          {useFeeling && (!selectedPhase || showSelector) ? (
            <View style={styles.card}>
              <Text style={styles.feelingPrompt}>How are you feeling today?</Text>
              {FEELING_OPTIONS.map((opt, i) => (
                <TouchableOpacity
                  key={opt.phase}
                  style={[styles.feelingRow, i === FEELING_OPTIONS.length - 1 && { borderBottomWidth: 0 }]}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setSelectedPhase(opt.phase);
                    setShowSelector(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.feelingEmoji}>{opt.emoji}</Text>
                  <View style={styles.feelingContent}>
                    <Text style={styles.feelingLabel}>{opt.label}</Text>
                    <Text style={styles.feelingDesc}>{opt.description}</Text>
                  </View>
                  <Text style={styles.arrow}>→</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : rhythm ? (
            /* Active rhythm card */
            <View style={[styles.card, styles.activeCard, { borderLeftColor: rhythm.color }]}>
              <View style={styles.activeHeader}>
                <Text style={styles.activeEmoji}>{rhythm.emoji}</Text>
                <View style={styles.activeInfo}>
                  <Text style={[styles.activeName, { color: rhythm.color }]}>{rhythm.name}</Text>
                  <Text style={styles.activeSubtitle}>{rhythm.subtitle}</Text>
                </View>
                {useFeeling && (
                  <TouchableOpacity
                    style={styles.changeBtn}
                    onPress={() => {
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      setShowSelector(true);
                    }}
                  >
                    <Text style={styles.changeBtnText}>Change</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.spiritualRhythm}>{rhythm.spiritualRhythm}</Text>

              <View style={[styles.sectionDivider, { backgroundColor: rhythm.color + '25' }]} />

              <Text style={styles.contentLabel}>BODY</Text>
              <Text style={styles.contentText}>{rhythm.physiology}</Text>

              <Text style={[styles.contentLabel, { marginTop: 14 }]}>SCRIPTURE</Text>
              <Text style={[styles.scriptureRef, { color: rhythm.color }]}>{rhythm.scripture.reference}</Text>
              <Text style={styles.scriptureText}>{rhythm.scripture.text}</Text>

              <Text style={[styles.contentLabel, { marginTop: 14 }]}>PRACTICE</Text>
              <Text style={styles.contentText}>{rhythm.practice}</Text>
            </View>
          ) : (
            /* Regular cycle but no cycle logged yet */
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('LogCycle')}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyEmoji}>🌱</Text>
              <Text style={styles.emptyTitle}>Start tracking your cycle</Text>
              <Text style={styles.emptySubtitle}>Log your cycle start date to see your rhythm</Text>
              <View style={styles.emptyButton}>
                <Text style={styles.emptyButtonText}>+ Log Cycle</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* ── All Four Rhythms ── */}
          <Text style={[styles.sectionLabel, { marginTop: 8 }]}>THE FOUR RHYTHMS</Text>

          {RHYTHM_PHASES.map((phase) => {
            const isExpanded = expandedPhase === phase.id;
            const isActive = activePhase === phase.id;
            return (
              <TouchableOpacity
                key={phase.id}
                style={[
                  styles.phaseCard,
                  isActive && { borderColor: phase.color, borderWidth: 1.5 },
                ]}
                onPress={() => toggleExpand(phase.id)}
                activeOpacity={0.85}
              >
                <View style={styles.phaseHeader}>
                  <Text style={styles.phaseEmoji}>{phase.emoji}</Text>
                  <View style={styles.phaseInfo}>
                    <Text style={[styles.phaseName, { color: phase.color }]}>{phase.name}</Text>
                    <Text style={styles.phaseSubtitle}>{phase.subtitle} · {phase.days}</Text>
                  </View>
                  {isActive && (
                    <View style={[styles.activeBadge, { backgroundColor: phase.color + '18' }]}>
                      <Text style={[styles.activeBadgeText, { color: phase.color }]}>NOW</Text>
                    </View>
                  )}
                  <Text style={styles.chevron}>{isExpanded ? '↑' : '↓'}</Text>
                </View>

                <Text style={styles.phaseRhythm}>{phase.spiritualRhythm}</Text>

                {isExpanded && (
                  <View style={styles.phaseExpanded}>
                    <View style={[styles.sectionDivider, { backgroundColor: phase.color + '25' }]} />

                    <Text style={styles.contentLabel}>BODY</Text>
                    <Text style={styles.contentText}>{phase.physiology}</Text>

                    <Text style={[styles.contentLabel, { marginTop: 12 }]}>SCRIPTURE</Text>
                    <Text style={[styles.scriptureRef, { color: phase.color }]}>{phase.scripture.reference}</Text>
                    <Text style={styles.scriptureText}>{phase.scripture.text}</Text>

                    <Text style={[styles.contentLabel, { marginTop: 12 }]}>PRACTICE</Text>
                    <Text style={styles.contentText}>{phase.practice}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </BotanicalBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 24, paddingTop: 64, paddingBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(212,214,212,0.2)',
  },
  headerTitle: { fontSize: 28, fontWeight: '700', color: colors.forestGreen, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: colors.textMuted, marginTop: 3, letterSpacing: 0.2 },
  content: { flex: 1 },
  scrollContent: { padding: 20 },
  sectionLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.2,
    color: 'rgba(107,127,110,0.6)', marginBottom: 10,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: 18, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(212,214,212,0.25)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  activeCard: { borderLeftWidth: 3 },
  activeHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  activeEmoji: { fontSize: 28 },
  activeInfo: { flex: 1 },
  activeName: { fontSize: 20, fontWeight: '700', letterSpacing: 0.1 },
  activeSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  changeBtn: {
    backgroundColor: 'rgba(107,127,110,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  changeBtnText: { fontSize: 11, fontWeight: '600', color: colors.forestGreen },
  spiritualRhythm: { fontSize: 14, color: colors.textMedium, fontStyle: 'italic', lineHeight: 21, marginBottom: 14 },
  sectionDivider: { height: 1, marginBottom: 14 },
  contentLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: colors.textMuted, marginBottom: 5 },
  contentText: { fontSize: 14, color: colors.textMedium, lineHeight: 21 },
  scriptureRef: { fontSize: 13, fontWeight: '700', letterSpacing: 0.2, marginBottom: 4 },
  scriptureText: { fontSize: 14, color: colors.textDark, fontStyle: 'italic', lineHeight: 21 },
  feelingPrompt: { fontSize: 16, fontWeight: '600', color: colors.textDark, marginBottom: 14 },
  feelingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: 'rgba(212,214,212,0.3)',
  },
  feelingEmoji: { fontSize: 22, width: 32 },
  feelingContent: { flex: 1 },
  feelingLabel: { fontSize: 15, fontWeight: '600', color: colors.textDark, marginBottom: 2 },
  feelingDesc: { fontSize: 12, color: colors.textMuted, lineHeight: 17 },
  arrow: { fontSize: 16, color: colors.textMuted },
  emptyEmoji: { fontSize: 36, textAlign: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: colors.textDark, textAlign: 'center', marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19, marginBottom: 16 },
  emptyButton: {
    alignSelf: 'center', backgroundColor: 'rgba(107,127,110,0.1)',
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(107,127,110,0.2)',
  },
  emptyButtonText: { fontSize: 14, fontWeight: '600', color: colors.forestGreen },
  phaseCard: {
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 14, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(212,214,212,0.25)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  phaseHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  phaseEmoji: { fontSize: 22 },
  phaseInfo: { flex: 1 },
  phaseName: { fontSize: 16, fontWeight: '600', letterSpacing: 0.1 },
  phaseSubtitle: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  activeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  activeBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  chevron: { fontSize: 13, color: colors.textMuted },
  phaseRhythm: { fontSize: 13, color: colors.textMedium, fontStyle: 'italic', lineHeight: 19 },
  phaseExpanded: { marginTop: 12 },
});